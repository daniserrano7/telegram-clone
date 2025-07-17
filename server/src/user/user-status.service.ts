import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Server } from 'socket.io';
import { Events } from '@shared/gateway.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

interface UserConnection {
  socketId: string;
  lastHeartbeat: Date;
  lastVerified: Date;
}

@Injectable()
export class UserStatusService implements OnModuleInit {
  private readonly onlineUsers = new Map<number, UserConnection>();
  private server: Server;
  // Define constants for timing values
  private readonly STALE_CONNECTION_THRESHOLD = 30000; // 30 seconds
  private readonly VERIFICATION_INTERVAL = 300000; // 5 minutes

  constructor(private readonly db: DbService) {}

  /**
   * Reset all user statuses to offline when the server starts
   */
  async onModuleInit() {
    try {
      console.log('Resetting all user statuses to OFFLINE on server start');
      await this.db.user.updateMany({
        where: { onlineStatus: 'ONLINE' },
        data: { onlineStatus: 'OFFLINE' },
      });
      console.log('All user statuses reset to OFFLINE');
    } catch (error) {
      console.error('Failed to reset user statuses:', error);
    }
  }

  setServer(server: Server) {
    this.server = server;
  }

  async handleUserConnect(userId: number, socketId: string) {
    try {
      console.log(`User ${userId} connected with socket ${socketId}`);

      // Store user connection info in memory
      this.onlineUsers.set(userId, {
        socketId,
        lastHeartbeat: new Date(),
        lastVerified: new Date(),
      });

      // Atomic update in DB
      await this.updateUserStatus(userId, 'ONLINE');

      // Broadcast status change to other users
      this.broadcastStatusChange(userId, 'ONLINE');

      // Send current online status of all other users to the newly connected user
      this.sendCurrentOnlineStatusToUser(userId, socketId);

      return true;
    } catch (error) {
      console.error(`Error handling user ${userId} connection:`, error);
      return false;
    }
  }

  async handleUserDisconnect(userId: number) {
    try {
      console.log(`User ${userId} disconnected`);

      // Remove user from online users memory map
      this.onlineUsers.delete(userId);

      // Atomic update in DB
      await this.updateUserStatus(userId, 'OFFLINE');

      // Broadcast status change to other users
      this.broadcastStatusChange(userId, 'OFFLINE');

      return true;
    } catch (error) {
      console.error(`Error handling user ${userId} disconnection:`, error);
      return false;
    }
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  getUserSocketId(userId: number): string | undefined {
    return this.onlineUsers.get(userId)?.socketId;
  }

  getUserConnection(userId: number): UserConnection | undefined {
    return this.onlineUsers.get(userId);
  }

  updateHeartbeat(userId: number) {
    const connection = this.onlineUsers.get(userId);
    if (connection) {
      connection.lastHeartbeat = new Date();
      this.onlineUsers.set(userId, connection);
    }
  }

  /**
   * Check for stale connections (no heartbeat for more than 30 seconds)
   * Runs every 30 seconds via cron job in the gateway
   */
  checkStaleConnections() {
    console.log('Checking for stale connections...');
    const now = new Date();
    let staleConnectionsCount = 0;

    for (const [userId, connection] of this.onlineUsers.entries()) {
      const timeSinceLastHeartbeat =
        now.getTime() - connection.lastHeartbeat.getTime();

      if (timeSinceLastHeartbeat > this.STALE_CONNECTION_THRESHOLD) {
        console.log(
          `User ${userId} has a stale connection: ${timeSinceLastHeartbeat}ms since last heartbeat`,
        );
        this.handleUserDisconnect(userId);
        staleConnectionsCount++;
      }
    }

    if (staleConnectionsCount > 0) {
      console.log(`Cleaned up ${staleConnectionsCount} stale connections`);
    } else {
      console.log('No stale connections found');
    }
  }

  /**
   * Verify connections by sending a ping
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyConnections() {
    console.log('Running connection verification...');
    const now = new Date();
    let failedCount = 0;

    for (const [userId, connection] of this.onlineUsers.entries()) {
      // Only verify connections we haven't verified recently
      const timeSinceLastVerification =
        now.getTime() - connection.lastVerified.getTime();

      if (timeSinceLastVerification > this.VERIFICATION_INTERVAL) {
        try {
          // Send a ping to verify connection is active
          this.server
            .to(connection.socketId)
            .emit(Events.CONNECTION_VERIFY, { userId });

          // Update verification timestamp
          connection.lastVerified = now;
          this.onlineUsers.set(userId, connection);

          console.log(`Verified connection for user ${userId}`);
        } catch (error) {
          console.error(
            `Failed to verify connection for user ${userId}:`,
            error,
          );

          // If ping fails, mark user as disconnected
          await this.handleUserDisconnect(userId);
          failedCount++;
        }
      }
    }

    console.log(
      `Connection verification complete. Failed connections: ${failedCount}`,
    );

    // Check if there are any inconsistencies between DB and memory
    await this.reconcileStatusWithDb();
  }

  /**
   * Reconcile status between database and memory
   * Ensures consistency between the two sources
   */
  private async reconcileStatusWithDb() {
    try {
      // Find users marked as online in DB but not in memory
      const onlineUsersInDb = await this.db.user.findMany({
        where: { onlineStatus: 'ONLINE' },
        select: { id: true },
      });

      for (const user of onlineUsersInDb) {
        if (!this.onlineUsers.has(user.id)) {
          console.log(
            `Found inconsistency: User ${user.id} marked online in DB but not in memory`,
          );

          // Update DB to match memory (the source of truth)
          await this.updateUserStatus(user.id, 'OFFLINE');
          console.log(`Fixed: User ${user.id} status updated to OFFLINE in DB`);
        }
      }
    } catch (error) {
      console.error('Error during status reconciliation:', error);
    }
  }

  /**
   * Update user status in the database with error handling
   * Acts as an atomic operation
   */
  private async updateUserStatus(userId: number, status: 'ONLINE' | 'OFFLINE') {
    try {
      await this.db.user.update({
        where: { id: userId },
        data: {
          lastConnection: new Date(),
          onlineStatus: status,
        },
      });
      return true;
    } catch (error) {
      console.error(`Failed to update status for user ${userId}:`, error);

      // If updating DB fails but we're tracking user as online in memory,
      // we should try to keep things consistent
      if (status === 'OFFLINE' && this.onlineUsers.has(userId)) {
        this.onlineUsers.delete(userId);
      }
      return false;
    }
  }

  private broadcastStatusChange(userId: number, status: 'ONLINE' | 'OFFLINE') {
    if (!this.server) return;

    this.server.emit(Events.USER_STATUS_CHANGE, {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Send current online status of all other users to a newly connected user
   */
  private sendCurrentOnlineStatusToUser(userId: number, socketId: string) {
    if (!this.server) return;

    console.log(`Sending current online status to user ${userId}`);
    
    // Send status of all currently online users to the newly connected user
    for (const [onlineUserId] of this.onlineUsers.entries()) {
      // Don't send the user their own status
      if (onlineUserId !== userId) {
        this.server.to(socketId).emit(Events.USER_STATUS_CHANGE, {
          userId: onlineUserId,
          status: 'ONLINE',
          timestamp: new Date(),
        });
      }
    }
  }
}
