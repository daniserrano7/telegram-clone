import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateChatResponseDto } from './chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly db: DbService) {}

  async createChat(memberIds: number[]) {
    const foundChats = await this.db.chat.findMany({
      where: {
        members: {
          every: {
            id: {
              in: memberIds,
            },
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (foundChats.length > 0) {
      throw new Error('Chat already exists');
    }

    const chat = await this.db.chat.create({
      data: {
        members: {
          connect: memberIds.map((id) => ({ id })),
        },
      },
      include: {
        members: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const response: CreateChatResponseDto = {
      id: chat.id,
      createdAt: chat.createdAt,
      memberIds: chat.members.map((member) => member.id),
    };

    return response;
  }

  async getUserChats(userId: number) {
    const chats = await this.db.chat.findMany({
      where: {
        members: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        members: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    return chats;
  }

  async addMessage(chatId: number, userId: number, content: string) {
    const message = await this.db.message.create({
      data: {
        content,
        sender: {
          connect: { id: userId },
        },
        chat: {
          connect: { id: chatId },
        },
      },
    });
    return message;
  }

  async getChatMessages(chatId: number) {
    const messages = await this.db.message.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' },
    });
    return messages;
  }
}
