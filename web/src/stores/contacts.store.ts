import { create } from 'zustand';
import { Events } from '@shared/gateway.dto';
import { type OnlineStatus } from '@shared/user.dto';
import { socketService } from '../services/socket.service';

interface ContactStatusInfo {
  status: OnlineStatus;
  lastActive: Date | null;
  typing: {
    chatId: number;
    isTyping: boolean;
  };
}

interface ContactsState {
  contactsStatuses: Map<number, ContactStatusInfo>;
  contacts: Record<number, any>;
  updateContactStatus: (
    userId: number,
    status: OnlineStatus,
    lastActive: Date
  ) => void;
  updateTypingStatus: (
    userId: number,
    chatId: number,
    isTyping: boolean
  ) => void;
  emitTypingStatus: (chatId: number, isTyping: boolean) => void;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contactsStatuses: new Map(),
  contacts: {},
  updateContactStatus: (userId, status, lastActive) => {
    const contactsStatuses = get().contactsStatuses;
    const currentStatus = contactsStatuses.get(userId) || {
      status: 'OFFLINE',
      lastActive: null,
      typing: { chatId: 0, isTyping: false },
    };

    contactsStatuses.set(userId, {
      ...currentStatus,
      status,
      lastActive,
    });

    set({ contactsStatuses: new Map(contactsStatuses) });
  },
  updateTypingStatus: (userId, chatId, isTyping) => {
    const contactsStatuses = get().contactsStatuses;
    const currentStatus = contactsStatuses.get(userId) || {
      status: 'OFFLINE',
      lastActive: null,
      typing: { chatId: 0, isTyping: false },
    };

    contactsStatuses.set(userId, {
      ...currentStatus,
      typing: { chatId, isTyping },
    });

    set({ contactsStatuses: new Map(contactsStatuses) });
  },
  emitTypingStatus: (chatId, isTyping) => {
    if (!socketService.isConnected()) return;

    socketService.emit(isTyping ? Events.START_TYPING : Events.STOP_TYPING, {
      chatId,
    });
  },
}));
