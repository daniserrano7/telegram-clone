import Dexie, { Table } from 'dexie';
import { Message } from '@shared/chat.dto';
import { PendingMessage } from '../types/local-message';

type Chat = {
  id?: number;
  members: number[];
};

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message & { pending?: boolean }>;
  pendingMessages!: Table<PendingMessage>;

  constructor() {
    super('ChatDB');
    this.version(1).stores({
      chats: '++id, members',
      messages: '++id, chatId, senderId, timestamp, pending',
    });
    // Version 2: Add pendingMessages table
    this.version(2).stores({
      chats: '++id, members',
      messages: '++id, chatId, senderId, timestamp, pending',
      pendingMessages: '++queueOrder, chatId, clientMessageId, status',
    });
  }

  async saveChat(chat: Chat) {
    await this.chats.put(chat);
  }

  async saveMessage(message: Message, isPending = false) {
    await this.messages.put({ ...message, pending: isPending });
  }

  async getPendingMessagesByChat(chatId: number) {
    return this.messages.where('chatId').equals(chatId).and(m => m.pending === true).toArray();
  }

  async getChatMessages(chatId: number) {
    return this.messages.where('chatId').equals(chatId).toArray();
  }

  // Pending messages queue methods

  async addPendingMessage(message: Omit<PendingMessage, 'queueOrder'>): Promise<number> {
    return this.pendingMessages.add(message as PendingMessage);
  }

  async getPendingMessages(): Promise<PendingMessage[]> {
    return this.pendingMessages.orderBy('queueOrder').toArray();
  }

  async getPendingMessagesByStatus(status: 'PENDING' | 'FAILED'): Promise<PendingMessage[]> {
    return this.pendingMessages
      .where('status')
      .equals(status)
      .sortBy('queueOrder');
  }

  async updatePendingMessageStatus(
    clientMessageId: string,
    status: 'PENDING' | 'FAILED',
    retryCount?: number
  ): Promise<number> {
    const updates: Partial<PendingMessage> = { status };
    if (retryCount !== undefined) {
      updates.retryCount = retryCount;
    }
    return this.pendingMessages
      .where('clientMessageId')
      .equals(clientMessageId)
      .modify(updates);
  }

  async removePendingMessage(clientMessageId: string): Promise<number> {
    return this.pendingMessages
      .where('clientMessageId')
      .equals(clientMessageId)
      .delete();
  }

  async getPendingMessageByClientId(clientMessageId: string): Promise<PendingMessage | undefined> {
    return this.pendingMessages
      .where('clientMessageId')
      .equals(clientMessageId)
      .first();
  }
}

export const db = new ChatDatabase();
