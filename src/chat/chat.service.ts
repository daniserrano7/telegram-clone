import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ChatService {
  constructor(private readonly db: DbService) {}

  async createChat(memberIds: number[]) {
    const chat = await this.db.chat.create({
      data: {
        members: {
          connect: memberIds.map((id) => ({ id })),
        },
      },
      include: {
        members: true,
      },
    });
    return chat;
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
