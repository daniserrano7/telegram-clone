import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UserService } from 'src/user/user.service';
import { UserId } from '@shared/user.dto';
import { WsAuthGuard } from 'src/auth/auth.guard';
import { Events, ChatMemberRole } from '@shared/gateway.dto';
import { UserStatusService } from '../user/user-status.service';
import { NotificationService } from '../notification/notification.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockedUserException } from 'src/user/blocked-user.exception';

// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');

if (!allowedOrigins) {
  throw new Error('ALLOWED_ORIGINS is not set');
}

@WebSocketGateway({
  pingInterval: 25_000,
  pingTimeout: 20_000,
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  // App-level keepalive below Cloudflare's origin read timeout. Socket.IO also
  // sends Engine.IO ping/pong packets via pingInterval/pingTimeout above.
  private readonly heartbeatInterval = 50_000;

  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userStatusService: UserStatusService,
    private readonly notificationService: NotificationService,
  ) { }

  afterInit() {
    this.userStatusService.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;

      // Set up heartbeat interval for this client
      const interval = setInterval(() => {
        if (client.connected) {
          client.emit(Events.HEARTBEAT);
        }
      }, this.heartbeatInterval);

      // Store the interval reference in the socket data
      client.data.heartbeatInterval = interval;

      // Join user's room
      client.join(`user_${userId}`);

      // Handle user connection and online status
      await this.userStatusService.handleUserConnect(userId, client.id);

      // Update status of received messages
      const updatedMessages =
        await this.chatService.updateReceivedMessagesStatus(userId);

      // Broadcast status changes for each updated message
      updatedMessages.forEach((message) => {
        this.server
          .to(`chat_${message.chatId}`)
          .emit(Events.MESSAGE_STATUS_CHANGE, {
            messageId: message.id,
            status: 'DELIVERED',
          });
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      // Clear heartbeat interval
      if (client.data.heartbeatInterval) {
        clearInterval(client.data.heartbeatInterval);
      }

      const userId = client.data.userId as UserId;
      if (!userId) return;

      // Handle user disconnection
      await this.userStatusService.handleUserDisconnect(userId);
    } catch (error) {
      this.logger.error('Disconnection error:', error);
    }
  }

  @SubscribeMessage(Events.HEARTBEAT_RESPONSE)
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.userStatusService.updateHeartbeat(userId);
    }
  }

  @SubscribeMessage(Events.CONNECTION_VERIFY_RESPONSE)
  handleConnectionVerify(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      // Connection is valid, update verification time
      const connection = this.userStatusService.getUserConnection(userId);
      if (connection) {
        connection.lastVerified = new Date();
      }
    }
  }

  @Cron('*/30 * * * * *')
  handleStaleConnections() {
    this.userStatusService.checkStaleConnections();
  }

  private getUserIdFromSocket(client: Socket): number {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        throw new WsException('Authentication token missing');
      }

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = decoded.id;
      return userId;
    } catch {
      throw new WsException('Invalid token');
    }
  }

  // Start typing
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.START_TYPING)
  handleStartTyping(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { chatId } = data;

    if (!chatId) {
      return { status: 'error', msg: 'Chat ID is required' };
    }

    this.server.to(`chat_${chatId}`).emit(Events.USER_TYPING, {
      userId,
      chatId,
      isTyping: true,
    });
  }

  // Stop typing
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.STOP_TYPING)
  handleStopTyping(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { chatId } = data;

    if (!chatId) {
      return { status: 'error', msg: 'Chat ID is required' };
    }

    this.server.to(`chat_${chatId}`).emit(Events.USER_TYPING, {
      userId,
      chatId,
      isTyping: false,
    });
  }

  // Send message
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() body: { chatId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { chatId, content } = body;

    if (!chatId) {
      return { status: 'error', msg: 'Chat ID is required' };
    }

    if (!content) {
      return { status: 'error', msg: 'Content is required' };
    }

    try {
      const message = await this.chatService.addMessage(
        chatId,
        userId,
        content,
      );
      this.server.to(`chat_${chatId}`).emit('message', message);

      // Get chat members for push notifications
      try {
        const chat = await this.chatService.getChat(chatId);
        const recipientIds = chat.members.map(member => member.id);

        // Send push notifications to offline/background users
        await this.notificationService.sendNewMessageNotification(
          userId,
          recipientIds,
          content,
          chatId,
        );
      } catch (error) {
        this.logger.warn(`Failed to send push notifications for chat ${chatId}:`, error.message);
      }

      return { status: 'success', message };
    } catch (error) {
      // Handle blocked user - return fake success so sender doesn't know they're blocked
      if (error instanceof BlockedUserException) {
        return {
          status: 'success',
          message: {
            id: -1, // Fake ID
            content,
            status: 'SENT',
            chatId,
            senderId: userId,
            createdAt: new Date(),
          },
        };
      }

      return {
        status: 'error',
        message: `Failed to add message: ${error.message}`,
      };
    }
  }

  // Join chat room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.JOIN_CHAT)
  handleJoinChat(
    @MessageBody('chatId') chatId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat_${chatId}`);
    return { message: `Joined chat ${chatId}` };
  }

  // Join user room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.JOIN_USER)
  handleJoinUser(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    client.join(`user_${userId}`);

    return { message: `Joined user ${userId}` };
  }

  // Leave chat room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.LEAVE_CHAT)
  handleLeaveChat(
    @MessageBody('chatId') chatId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat_${chatId}`);
    return { message: `Left chat ${chatId}` };
  }

  emitNewChat(chatId: number, userIds: number[]) {
    userIds.forEach((userId) => {
      this.server.to(`user_${userId}`).emit(Events.NEW_CHAT, chatId);
    });
  }

  // ==================== GROUP EVENT EMITTERS ====================

  emitGroupUpdated(chatId: number, chat: unknown, memberIds: number[]) {
    // Emit to chat room
    this.server.to(`chat_${chatId}`).emit(Events.GROUP_UPDATED, chat);
    // Also emit to user rooms for members not in chat room
    memberIds.forEach((userId) => {
      this.server.to(`user_${userId}`).emit(Events.GROUP_UPDATED, chat);
    });
  }

  emitMembersAdded(chatId: number, newUserIds: number[], allMemberIds: number[]) {
    // Notify existing members in chat room
    this.server.to(`chat_${chatId}`).emit(Events.MEMBER_ADDED, {
      chatId,
      userIds: newUserIds,
    });

    // Notify new members to join the chat (they receive NEW_CHAT)
    newUserIds.forEach((userId) => {
      this.server.to(`user_${userId}`).emit(Events.NEW_CHAT, chatId);
    });
  }

  emitMemberRemoved(
    chatId: number,
    removedUserId: number,
    remainingMemberIds: number[],
  ) {
    // Notify remaining members
    this.server.to(`chat_${chatId}`).emit(Events.MEMBER_REMOVED, {
      chatId,
      userId: removedUserId,
    });

    // Notify the removed user
    this.server.to(`user_${removedUserId}`).emit(Events.MEMBER_REMOVED, {
      chatId,
      userId: removedUserId,
      wasRemoved: true,
    });
  }

  emitMemberLeft(chatId: number, userId: number, remainingMemberIds: number[]) {
    // Notify remaining members
    this.server.to(`chat_${chatId}`).emit(Events.MEMBER_LEFT, {
      chatId,
      userId,
    });
  }

  emitMemberRoleChanged(
    chatId: number,
    userId: number,
    role: ChatMemberRole,
    memberIds: number[],
  ) {
    this.server.to(`chat_${chatId}`).emit(Events.MEMBER_ROLE_CHANGED, {
      chatId,
      userId,
      role,
    });
  }

  emitSystemMessage(chatId: number, message: unknown) {
    this.server.to(`chat_${chatId}`).emit(Events.SYSTEM_MESSAGE, message);
  }

  // Add new event handlers for message status
  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.MESSAGE_DELIVERED)
  async handleMessageDelivered(
    @MessageBody() data: { messageId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { messageId } = data;

    try {
      const message = await this.chatService.updateMessageStatus(
        messageId,
        'DELIVERED',
        userId,
      );

      this.server
        .to(`chat_${message.chatId}`)
        .emit(Events.MESSAGE_STATUS_CHANGE, {
          messageId,
          status: 'DELIVERED',
        });

      return { status: 'success', message };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage(Events.MESSAGE_READ)
  async handleMessageRead(
    @MessageBody() data: { messageId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { messageId } = data;

    try {
      const message = await this.chatService.updateMessageStatus(
        messageId,
        'READ',
        userId,
      );

      this.server
        .to(`chat_${message.chatId}`)
        .emit(Events.MESSAGE_STATUS_CHANGE, {
          messageId,
          status: 'READ',
        });

      return { status: 'success', message };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
