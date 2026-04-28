import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Server } from 'socket.io';
import { Events } from '@shared/gateway.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SocketConnection {
  lastHeartbeat: Date;
  lastVerified: Date;
}

@Injectable()
export class UserStatusService implements OnModuleInit {
  private readonly logger = new Logger(UserStatusService.name);
  private readonly onlineUsers = new Map<number, Map<string, SocketConnection>>();
  private server: Server;
  // Define constants for timing values
  private readonly STALE_CONNECTION_THRESHOLD = 150000; // 2.5 minutes
  private readonly VERIFICATION_INTERVAL = 300000; // 5 minutes

  constructor(private readonly db: DbService) {}

  /**
   * Reset all user statuses to offline when the server starts
   */
  async onModuleInit() {
    try {
      this.logger.log('Resetting all user statuses to OFFLINE on server start');
      await this.db.user.updateMany({
        where: { onlineStatus: 'ONLINE' },
        data: { onlineStatus: 'OFFLINE' },
      });
      this.logger.log('All user statuses reset to OFFLINE');
    } catch (error) {
      this.logger.error('Failed to reset user statuses:', error);
    }
  }

  setServer(server: Server) {
    this.server = server;
  }

  async handleUserConnect(userId: number, socketId: string) {
    try {
      this.logger.log(`User ${userId} connected with socket ${socketId}`);

      const existingConnections = this.onlineUsers.get(userId) ?? new Map();
      const isFirstConnection = existingConnections.size === 0;

      existingConnections.set(socketId, {
        lastHeartbeat: new Date(),
        lastVerified: new Date(),
      });
      this.onlineUsers.set(userId, existingConnections);

      if (isFirstConnection) {
        await this.updateUserStatus(userId, 'ONLINE');
        this.broadcastStatusChange(userId, 'ONLINE');
      }

      // Send current online status of all other users to the newly connected user
      this.sendCurrentOnlineStatusToUser(userId, socketId);

      return true;
    } catch (error) {
      this.logger.error(`Error handling user ${userId} connection:`, error);
      return false;
    }
  }

  async handleUserDisconnect(userId: number, socketId: string) {
    try {
      this.logger.log(`User ${userId} disconnected from socket ${socketId}`);

      const existingConnections = this.onlineUsers.get(userId);
      if (!existingConnections) {
        return true;
      }

      existingConnections.delete(socketId);

      if (existingConnections.size > 0) {
        this.onlineUsers.set(userId, existingConnections);
        return true;
      }

      this.onlineUsers.delete(userId);

      await this.updateUserStatus(userId, 'OFFLINE');
      this.broadcastStatusChange(userId, 'OFFLINE');

      return true;
    } catch (error) {
      this.logger.error(`Error handling user ${userId} disconnection:`, error);
      return false;
    }
  }

  isUserOnline(userId: number): boolean {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  updateHeartbeat(userId: number, socketId: string) {
    const connections = this.onlineUsers.get(userId);
    const connection = connections?.get(socketId);
    if (connection) {
      connection.lastHeartbeat = new Date();
      connections.set(socketId, connection);
      this.onlineUsers.set(userId, connections);
    }
  }

  markConnectionVerified(userId: number, socketId: string) {
    const connections = this.onlineUsers.get(userId);
    const connection = connections?.get(socketId);
    if (connection) {
      connection.lastVerified = new Date();
      connections.set(socketId, connection);
      this.onlineUsers.set(userId, connections);
    }
  }

  /**
   * Check for stale connections.
   * The threshold must stay comfortably above the gateway heartbeat interval.
   * Runs every 30 seconds via cron job in the gateway
   */
  checkStaleConnections() {
    this.logger.debug('Checking for stale connections...');
    const now = new Date();
    let staleConnectionsCount = 0;
    const staleConnections: Array<{ userId: number; socketId: string }> = [];

    for (const [userId, connections] of this.onlineUsers.entries()) {
      for (const [socketId, connection] of connections.entries()) {
        const timeSinceLastHeartbeat =
          now.getTime() - connection.lastHeartbeat.getTime();

        if (timeSinceLastHeartbeat > this.STALE_CONNECTION_THRESHOLD) {
          this.logger.warn(
            `User ${userId} has a stale connection on socket ${socketId}: ${timeSinceLastHeartbeat}ms since last heartbeat`,
          );
          staleConnections.push({ userId, socketId });
          staleConnectionsCount++;
        }
      }
    }

    staleConnections.forEach(({ userId, socketId }) => {
      this.server?.sockets.sockets.get(socketId)?.disconnect(true);
      void this.handleUserDisconnect(userId, socketId);
    });

    if (staleConnectionsCount > 0) {
      this.logger.log(`Cleaned up ${staleConnectionsCount} stale connections`);
    } else {
      this.logger.debug('No stale connections found');
    }
  }

  /**
   * Verify connections by sending a ping
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyConnections() {
    this.logger.debug('Running connection verification...');
    const now = new Date();
    let failedCount = 0;

    for (const [userId, connections] of this.onlineUsers.entries()) {
      for (const [socketId, connection] of connections.entries()) {
        const timeSinceLastVerification =
          now.getTime() - connection.lastVerified.getTime();

        if (timeSinceLastVerification > this.VERIFICATION_INTERVAL) {
          try {
            this.server.to(socketId).emit(Events.CONNECTION_VERIFY, { userId });
            this.logger.debug(
              `Sent connection verification to user ${userId} on socket ${socketId}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to verify connection for user ${userId} on socket ${socketId}:`,
              error,
            );

            await this.handleUserDisconnect(userId, socketId);
            failedCount++;
          }
        }
      }
    }

    this.logger.debug(
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
        if (!this.isUserOnline(user.id)) {
          this.logger.warn(
            `Found inconsistency: User ${user.id} marked online in DB but not in memory`,
          );

          // Update DB to match memory (the source of truth)
          await this.updateUserStatus(user.id, 'OFFLINE');
          this.logger.log(`Fixed: User ${user.id} status updated to OFFLINE in DB`);
        }
      }
    } catch (error) {
      this.logger.error('Error during status reconciliation:', error);
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
      this.logger.error(`Failed to update status for user ${userId}:`, error);

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

    this.logger.debug(`Sending current online status to user ${userId}`);
    
    // Send status of all currently online users to the newly connected user
    for (const [onlineUserId, connections] of this.onlineUsers.entries()) {
      // Don't send the user their own status
      if (onlineUserId !== userId && connections.size > 0) {
        this.server.to(socketId).emit(Events.USER_STATUS_CHANGE, {
          userId: onlineUserId,
          status: 'ONLINE',
          timestamp: new Date(),
        });
      }
    }
  }
}
