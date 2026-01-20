import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import {
  MessageStatus,
  ChatType,
  ChatMemberRole,
  MessageType,
} from '@shared/gateway.dto';
import { BlockService } from 'src/user/block.service';
import { BlockedUserException } from 'src/user/blocked-user.exception';
import { UpdateGroupRequestDto } from '@shared/chat.dto';

const chatInclude = {
  members: {
    omit: {
      password: true,
    },
  },
  memberships: true,
  messages: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

const chatSelect = {
  id: true,
  type: true,
  name: true,
  description: true,
  avatarUrl: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  members: {
    omit: {
      password: true,
    },
  },
  memberships: true,
  messages: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

@Injectable()
export class ChatService {
  constructor(
    private readonly db: DbService,
    private readonly blockService: BlockService,
  ) {}

  // ==================== DIRECT CHAT METHODS ====================

  async createChat(memberIds: number[]) {
    // Validate exactly 2 members for direct chat
    if (memberIds.length !== 2) {
      throw new Error('Direct chats must have exactly 2 members');
    }

    // Check if direct chat already exists
    const existingChat = await this.findDirectChat(memberIds[0], memberIds[1]);
    if (existingChat) {
      throw new Error('Chat already exists');
    }

    const chat = await this.db.chat.create({
      data: {
        type: 'DIRECT',
        members: {
          connect: memberIds.map((id) => ({ id })),
        },
        memberships: {
          create: memberIds.map((id) => ({
            userId: id,
            role: 'MEMBER',
          })),
        },
      },
      include: chatInclude,
    });

    return chat;
  }

  async findDirectChat(userId1: number, userId2: number) {
    return this.db.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { id: userId1 } } },
          { members: { some: { id: userId2 } } },
        ],
      },
      select: chatSelect,
    });
  }

  // ==================== GROUP CHAT METHODS ====================

  async createGroup(
    memberIds: number[],
    createdBy: number,
    options: { name: string; description?: string; avatarUrl?: string },
  ) {
    // Validate group name
    if (!options.name || options.name.trim() === '') {
      throw new Error('Group name is required');
    }

    // Validate minimum members (at least 2 including creator)
    if (memberIds.length < 2) {
      throw new Error('Group must have at least 2 members');
    }

    // Ensure creator is included in member list
    const allMemberIds = [...new Set([createdBy, ...memberIds])];

    const chat = await this.db.chat.create({
      data: {
        type: 'GROUP',
        name: options.name.trim(),
        description: options.description?.trim() || null,
        avatarUrl: options.avatarUrl || null,
        createdBy,
        members: {
          connect: allMemberIds.map((id) => ({ id })),
        },
        memberships: {
          create: allMemberIds.map((id) => ({
            userId: id,
            role: id === createdBy ? 'ADMIN' : 'MEMBER',
            addedBy: createdBy,
          })),
        },
      },
      include: chatInclude,
    });

    return chat;
  }

  async updateGroup(
    chatId: number,
    userId: number,
    updates: UpdateGroupRequestDto,
  ) {
    const chat = await this.getChat(chatId);

    if (chat.type !== 'GROUP') {
      throw new Error('Can only update group chats');
    }

    await this.verifyUserIsAdmin(chatId, userId);

    return this.db.chat.update({
      where: { id: chatId },
      data: {
        name: updates.name?.trim(),
        description: updates.description?.trim(),
        avatarUrl: updates.avatarUrl,
      },
      select: chatSelect,
    });
  }

  async addMembers(chatId: number, userIds: number[], addedBy: number) {
    const chat = await this.getChat(chatId);

    if (chat.type !== 'GROUP') {
      throw new Error('Can only add members to group chats');
    }

    await this.verifyUserIsAdmin(chatId, addedBy);

    // Filter out users who are already members
    const existingMemberIds = chat.members.map((m) => m.id);
    const newUserIds = userIds.filter((id) => !existingMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return chat;
    }

    await this.db.chat.update({
      where: { id: chatId },
      data: {
        members: {
          connect: newUserIds.map((id) => ({ id })),
        },
        memberships: {
          create: newUserIds.map((id) => ({
            userId: id,
            role: 'MEMBER',
            addedBy,
          })),
        },
      },
    });

    return this.getChat(chatId);
  }

  async removeMember(chatId: number, userIdToRemove: number, removedBy: number) {
    const chat = await this.getChat(chatId);

    if (chat.type !== 'GROUP') {
      throw new Error('Can only remove members from group chats');
    }

    await this.verifyUserIsAdmin(chatId, removedBy);

    // Cannot remove the last admin
    const admins = await this.getChatAdmins(chatId);
    if (admins.length === 1 && admins[0].userId === userIdToRemove) {
      throw new Error('Cannot remove the last admin. Transfer admin role first.');
    }

    // Delete membership
    await this.db.chatMembership.delete({
      where: {
        chatId_userId: {
          chatId,
          userId: userIdToRemove,
        },
      },
    });

    // Disconnect from members
    await this.db.chat.update({
      where: { id: chatId },
      data: {
        members: {
          disconnect: { id: userIdToRemove },
        },
      },
    });

    return this.getChat(chatId);
  }

  async leaveGroup(chatId: number, userId: number) {
    const chat = await this.getChat(chatId);

    if (chat.type !== 'GROUP') {
      throw new Error('Can only leave group chats');
    }

    // Check if user is the last admin
    const admins = await this.getChatAdmins(chatId);
    const userMembership = chat.memberships.find((m) => m.userId === userId);

    if (
      userMembership?.role === 'ADMIN' &&
      admins.length === 1 &&
      chat.members.length > 1
    ) {
      throw new Error(
        'You are the last admin. Promote another member to admin before leaving.',
      );
    }

    // Delete membership
    await this.db.chatMembership.delete({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });

    // Disconnect from members
    await this.db.chat.update({
      where: { id: chatId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    return { success: true };
  }

  async updateMemberRole(
    chatId: number,
    targetUserId: number,
    newRole: ChatMemberRole,
    updatedBy: number,
  ) {
    const chat = await this.getChat(chatId);

    if (chat.type !== 'GROUP') {
      throw new Error('Can only change roles in group chats');
    }

    await this.verifyUserIsAdmin(chatId, updatedBy);

    // Cannot demote the last admin
    if (newRole === 'MEMBER') {
      const admins = await this.getChatAdmins(chatId);
      if (admins.length === 1 && admins[0].userId === targetUserId) {
        throw new Error('Cannot demote the last admin');
      }
    }

    await this.db.chatMembership.update({
      where: {
        chatId_userId: {
          chatId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
    });

    return this.getChat(chatId);
  }

  // ==================== HELPER METHODS ====================

  private async verifyUserIsAdmin(chatId: number, userId: number) {
    const membership = await this.db.chatMembership.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new Error('Only admins can perform this action');
    }
  }

  private async getChatAdmins(chatId: number) {
    return this.db.chatMembership.findMany({
      where: { chatId, role: 'ADMIN' },
    });
  }

  // ==================== MESSAGE METHODS ====================

  async createSystemMessage(
    chatId: number,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.db.message.create({
      data: {
        content,
        type: 'SYSTEM',
        chatId,
        senderId: null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  }

  async addMessage(
    chatId: number,
    userId: number,
    content: string,
    type: MessageType = 'USER',
  ) {
    const chat = await this.getChat(chatId);

    // For DIRECT chats, check blocking
    if (chat.type === 'DIRECT') {
      const recipient = chat.members.find((m) => m.id !== userId);

      if (recipient) {
        const isEitherBlocked = await this.blockService.isEitherBlocked(
          userId,
          recipient.id,
        );

        if (isEitherBlocked) {
          throw new BlockedUserException();
        }
      }
    }

    // For GROUP chats, verify user is a member
    if (chat.type === 'GROUP') {
      const isMember = chat.members.some((m) => m.id === userId);
      if (!isMember) {
        throw new Error('User is not a member of this group');
      }
    }

    const message = await this.db.message.create({
      data: {
        content,
        type,
        sender: type === 'USER' ? { connect: { id: userId } } : undefined,
        chat: { connect: { id: chatId } },
      },
    });
    return message;
  }

  // ==================== COMMON METHODS ====================

  async getChat(chatId: number) {
    const chat = await this.db.chat.findUnique({
      where: { id: chatId },
      select: chatSelect,
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
      select: chatSelect,
    });
    return chats;
  }

  async getSharedChats(userId1: number, userId2: number) {
    const chat = await this.db.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { id: userId1 } } },
          { members: { some: { id: userId2 } } },
        ],
      },
      select: chatSelect,
    });

    return chat;
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
