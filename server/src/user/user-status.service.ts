import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Server } from 'socket.io';
import { Events } from '@shared/gateway.dto';

interface UserConnection {
  socketId: string;
  lastHeartbeat: Date;
}

@Injectable()
export class UserStatusService {
  private readonly onlineUsers = new Map<number, UserConnection>();
  private server: Server;

  constructor(private readonly db: DbService) {}

  setServer(server: Server) {
    this.server = server;
  }

  async handleUserConnect(userId: number, socketId: string) {
    // Store user connection info
    this.onlineUsers.set(userId, {
      socketId,
      lastHeartbeat: new Date(),
    });

    // Update last connection time in DB
    await this.updateLastConnection(userId);

    // Broadcast status change to other users
    this.broadcastStatusChange(userId, 'ONLINE');
  }

  async handleUserDisconnect(userId: number) {
    // Remove user from online users
    this.onlineUsers.delete(userId);

    // Update last connection time in DB
    await this.updateLastConnection(userId);

    // Broadcast status change to other users
    this.broadcastStatusChange(userId, 'OFFLINE');
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  getUserSocketId(userId: number): string | undefined {
    return this.onlineUsers.get(userId)?.socketId;
  }

  updateHeartbeat(userId: number) {
    const connection = this.onlineUsers.get(userId);
    if (connection) {
      connection.lastHeartbeat = new Date();
    }
  }

  // Check for stale connections (no heartbeat for more than 30 seconds)
  checkStaleConnections() {
    const now = new Date();
    const staleThreshold = 30000; // 30 seconds

    for (const [userId, connection] of this.onlineUsers.entries()) {
      const timeSinceLastHeartbeat =
        now.getTime() - connection.lastHeartbeat.getTime();
      if (timeSinceLastHeartbeat > staleThreshold) {
        this.handleUserDisconnect(userId);
      }
    }
  }

  private async updateLastConnection(userId: number) {
    await this.db.user.update({
      where: { id: userId },
      data: {
        lastConnection: new Date(),
        onlineStatus: this.isUserOnline(userId) ? 'ONLINE' : 'OFFLINE',
      },
    });
  }

  private broadcastStatusChange(userId: number, status: 'ONLINE' | 'OFFLINE') {
    if (!this.server) return;

    this.server.emit(Events.USER_STATUS_CHANGE, {
      userId,
      status,
      timestamp: new Date(),
    });
  }
}
