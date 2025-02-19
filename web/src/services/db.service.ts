import Dexie, { Table } from 'dexie';
import { Message } from '@shared/chat.dto';

type Chat = {
  id?: number;
  members: number[];
};

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message & { pending?: boolean }>;
  pendingSync!: Table<{ id: string; type: 'message' | 'chat'; data: any }>;

  constructor() {
    super('ChatDB');
    this.version(1).stores({
      chats: '++id, members',
      messages: '++id, chatId, senderId, timestamp, pending',
      pendingSync: '++id, type',
    });
  }

  async saveChat(chat: Chat) {
    await this.chats.put(chat);
  }

  async saveMessage(message: Message, isPending = false) {
    await this.messages.put({ ...message, pending: isPending });
  }

  async getPendingMessages() {
    return this.messages.where('pending').equals(1).toArray();
  }

  async getChatMessages(chatId: number) {
    return this.messages.where('chatId').equals(chatId).toArray();
  }
}

export const db = new ChatDatabase();
