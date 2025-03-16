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
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UserService } from 'src/user/user.service';
import { UserId } from '@shared/user.dto';
import { WsAuthGuard } from 'src/auth/auth.guard';
import { Events } from '@shared/gateway.dto';
import { UserStatusService } from '../user/user-status.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@WebSocketGateway({
  cors: {
    methods: ['GET', 'POST'],
    credentials: true,
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '0.0.0.0:3000'],
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly heartbeatInterval = 15000; // 15 seconds

  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userStatusService: UserStatusService,
  ) {}

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

      // Set up heartbeat interval for this client
      const interval = setInterval(() => {
        client.emit('heartbeat');
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
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId as UserId;
      if (!userId) return;

      // Clear heartbeat interval
      if (client.data.heartbeatInterval) {
        clearInterval(client.data.heartbeatInterval);
      }

      // Handle user disconnection
      await this.userStatusService.handleUserDisconnect(userId);
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }

  @SubscribeMessage('heartbeat-response')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.userStatusService.updateHeartbeat(userId);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
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

      return { status: 'success', message };
    } catch (error) {
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
