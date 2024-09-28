import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsAuthGuard } from 'src/auth/auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*', // Configura los orígenes permitidos según tu caso
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Listener para enviar mensajes
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() body: { chatId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId; // Autenticación con token de WebSocket
    const { chatId, content } = body;

    if (!content) {
      return { error: 'Content is required' };
    }

    try {
      const message = await this.chatService.addMessage(
        chatId,
        userId,
        content,
      );
      // Emitir el mensaje a todos los miembros del chat
      this.server.to(`chat_${chatId}`).emit('message', message);
      return { status: 'Message sent successfully', message };
    } catch (error) {
      return { error: 'Failed to add message', details: error.message };
    }
  }

  // Join chat room
  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody('chatId') chatId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat_${chatId}`);
    return { message: `Joined chat ${chatId}` };
  }
}
