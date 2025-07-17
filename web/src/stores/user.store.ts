import { create } from 'zustand';
import { type Socket } from 'socket.io-client';
import { Events } from '@shared/gateway.dto';
import { type OnlineStatus } from '@shared/user.dto';
import { useChatStore } from './chat.store';

interface UserStatusInfo {
  status: OnlineStatus;
  lastActive: Date | null;
  typing: {
    chatId: number;
    isTyping: boolean;
  };
}

interface UserState {
  userStatuses: Map<number, UserStatusInfo>;
  contacts: Record<number, any>;
  socket: Socket | null;
  init: (socket: Socket) => void;
  updateUserStatus: (
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

export const useUserStore = create<UserState>((set, get) => ({
  userStatuses: new Map(),
  contacts: {},
  socket: null,
  init: (socket) => {
    set({ socket });
  },
  updateUserStatus: (userId, status, lastActive) => {
    const userStatuses = get().userStatuses;
    const currentStatus = userStatuses.get(userId) || {
      status: 'OFFLINE',
      lastActive: null,
      typing: { chatId: 0, isTyping: false },
    };

    userStatuses.set(userId, {
      ...currentStatus,
      status,
      lastActive,
    });

    set({ userStatuses: new Map(userStatuses) });
  },
  updateTypingStatus: (userId, chatId, isTyping) => {
    const userStatuses = get().userStatuses;
    const currentStatus = userStatuses.get(userId) || {
      status: 'OFFLINE',
      lastActive: null,
      typing: { chatId: 0, isTyping: false },
    };

    userStatuses.set(userId, {
      ...currentStatus,
      typing: { chatId, isTyping },
    });

    set({ userStatuses: new Map(userStatuses) });
  },
  emitTypingStatus: (chatId, isTyping) => {
    const socket = useChatStore.getState().socket;
    if (!socket) return;

    socket.emit(isTyping ? Events.START_TYPING : Events.STOP_TYPING, {
      chatId,
    });
  },
}));
