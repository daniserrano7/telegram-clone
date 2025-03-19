import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { MessageStatus } from '@shared/gateway.dto';
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
          omit: {
            password: true,
          },
        },
        messages: true,
      },
    });

    return chat;
  }

  async getChat(chatId: number) {
    const chat = await this.db.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        members: {
          omit: {
            password: true,
          },
        },
        messages: true,
      },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

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
        messages: {
          some: {},
        },
      },
      include: {
        members: {
          omit: {
            password: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    return chats;
  }

  async getSharedChats(userId1: number, userId2: number) {
    const chat = await this.db.chat.findFirst({
      where: {
        AND: [
          { members: { some: { id: userId1 } } },
          { members: { some: { id: userId2 } } },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        members: {
          omit: {
            password: true,
          },
        },
        messages: true,
      },
    });

    return chat;
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

  async deleteChat(chatId: number, userId: number) {
    const chat = await this.getChat(chatId);

    if (!chat.members.some((member) => member.id === userId)) {
      throw new Error('Unauthorized');
    }

    const result = await this.db.chat.update({
      where: { id: chatId },
      data: {
        deletedAt: new Date(),
      },
    });

    if (result.id) {
      return { success: true, chatId: result.id };
    }

    return { success: false, chatId: undefined };
  }

  async updateMessageStatus(
    messageId: number,
    status: MessageStatus,
    userId: number,
  ) {
    const message = await this.db.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: {
              omit: {
                password: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is part of the chat
    if (!message.chat.members.some((member) => member.id === userId)) {
      throw new Error('Unauthorized');
    }

    // Only update status if it's progressing forward
    const statusOrder = { SENT: 0, DELIVERED: 1, READ: 2 };
    if (statusOrder[status] <= statusOrder[message.status]) {
      return message;
    }

    return this.db.message.update({
      where: { id: messageId },
      data: { status },
    });
  }

  async updateReceivedMessagesStatus(userId: number) {
    // Find all messages sent to chats where the user is a member
    // and update their status to DELIVERED if they're currently SENT
    await this.db.message.updateMany({
      where: {
        chat: {
          members: {
            some: {
              id: userId,
            },
          },
        },
        senderId: {
          not: userId, // Only update messages not sent by this user
        },
        status: 'SENT', // Only update messages that are still in SENT status
      },
      data: {
        status: 'DELIVERED',
      },
    });

    // Get the updated messages to broadcast the status change
    const updatedMessages = await this.db.message.findMany({
      where: {
        chat: {
          members: {
            some: {
              id: userId,
            },
          },
        },
        senderId: {
          not: userId,
        },
        status: 'DELIVERED',
      },
      include: {
        chat: true,
      },
    });

    return updatedMessages;
  }
}
