import { create } from 'zustand';
import {
  CreateChatRequestDto,
  Message,
  CreateGroupRequestDto,
  ChatMembership,
  Chat as ChatDto,
} from '@shared/chat.dto';
import { User } from '@shared/user.dto';
import {
  Events,
  UserStatus,
  ChatType,
  ChatMemberRole,
} from '@shared/gateway.dto';
import { apiService } from '../services/api.service';
import { socketService } from '../services/socket.service';
import { networkService } from '../services/network.service';
import { syncService } from '../services/sync.service';
import { useAuthStore } from './auth.store';
import { useContactsStore } from './contacts.store';
import {
  LocalMessage,
  LocalMessageStatus,
  generateTempId,
} from '../types/local-message';

interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  createdBy: number | null;
  members: User[];
  memberships: ChatMembership[];
  messages: LocalMessage[];
}

// Same type as Chat but with the id optional (for new chats)
type ActiveChat = Omit<Chat, 'id'> & { id?: number };

interface ChatStore {
  init: (user: User) => Promise<void>;
  cleanUp: () => void;
  isInit: boolean;
  isLoading: boolean;
  errorMsg: string;
  isOnline: boolean;
  chats: Chat[];
  activeChat: ActiveChat | null;
  fetchChat: (chatId: number) => void;
  createChat: (chat: CreateChatRequestDto) => Promise<{ chatId?: number }>;
  createGroup: (data: CreateGroupRequestDto) => Promise<{ chatId?: number }>;
  sendMessage: (chatId: number, content: string) => void;
  setActiveChat: (chat: ActiveChat | null) => void;
  openChatWithUser: (userId: number) => Promise<{ chatId?: number }>;
  getChatPartner: (chat: ActiveChat) => User | undefined;
  getChatName: (chat: ActiveChat) => string;
  getChatAvatar: (chat: ActiveChat) => { username?: string; src?: string | null };
  isUserAdmin: (chat: ActiveChat, userId: number) => boolean;
  getActiveChatFromUrl: (chatId?: string) => ActiveChat | null;
  registerEvents: (user: User) => void;
  replacePendingWithConfirmed: (clientMessageId: string, message: Message) => void;
  updatePendingMessageStatus: (clientMessageId: string, status: LocalMessageStatus) => void;
  retryMessage: (clientMessageId: string) => void;
  cancelMessage: (clientMessageId: string) => void;
}

const convertToLocalChat = (chat: ChatDto): Chat => ({
  ...chat,
  messages: (chat.messages || []).map((msg) => ({
    ...msg,
    clientMessageId: `server_${msg.id}`,
  })) as LocalMessage[],
});

export const useChatStore = create<ChatStore>((set, get) => ({
  init: async (user: User) => {
    try {
      set({ isInit: true, isLoading: true, isOnline: networkService.isOnline() });

      get().registerEvents(user);

      // Initialize sync service and subscribe to events
      syncService.init();

      // Subscribe to network status changes
      networkService.subscribe((isOnline) => {
        set({ isOnline });
      });

      // Subscribe to sync service events
      syncService.on('message-sent', ({ clientMessageId, message }) => {
        get().replacePendingWithConfirmed(clientMessageId, message);
      });

      syncService.on('message-failed', ({ clientMessageId }) => {
        get().updatePendingMessageStatus(clientMessageId, 'FAILED');
      });

      const [contactsResult, chatsResult] = await Promise.all([
        apiService.getContacts(user.id),
        apiService.getChats(user.id),
      ]);

      if (contactsResult.status === 'error') {
        console.error('Failed to fetch contacts', contactsResult.errorMsg);
        return;
      }

      if (chatsResult.status === 'error') {
        console.error('Failed to fetch chats', chatsResult.errorMsg);
        return;
      }

      const contacts = contactsResult.data;
      contacts.forEach((contact) => {
        useContactsStore.getState().contacts[contact.id] = contact;
      });

      const chats = chatsResult.data;
      const localChats = chats.map(convertToLocalChat);
      set({ chats: localChats });

      chats.forEach((chat) => {
        socketService.emit(Events.JOIN_CHAT, { chatId: chat.id });
      });
    } catch (e) {
      console.error('Failed to initialize chat store', e);
    } finally {
      set({ isLoading: false });
    }
  },
  cleanUp: () => {
    syncService.destroy();

    if (socketService.isConnected()) {
      socketService.emit(Events.LEAVE_USER, {
        userId: useAuthStore.getState().user?.id,
      });
      socketService.disconnect();
    }

    set({
      isInit: false,
      isLoading: false,
      errorMsg: '',
      isOnline: true,
      chats: [],
      activeChat: null,
    });
  },
  isInit: false,
  isLoading: false,
  errorMsg: '',
  isOnline: true,
  chats: [],
  activeChat: null,
  fetchChat: async (chatId: number) => {
    try {
      const result = await apiService.getChat(chatId);

      if (result.status === 'error') {
        set({ errorMsg: 'Failed to fetch chat' });
        return;
      }

      const chat = result.data;
      const localChat = convertToLocalChat(chat);
      const chatAlreadyExists = get().chats.some((c) => c.id === localChat.id);
      const newChats = chatAlreadyExists
        ? get().chats.map((c) => (c.id === localChat.id ? localChat : c))
        : [...get().chats, localChat];

      set({ chats: [...newChats] });

      if (get().activeChat?.id === localChat.id) {
        get().setActiveChat(localChat);
      }
    } catch (error) {
      console.error('Failed to fetch chat', error);
      const msg =
        error instanceof Error ? error.message : 'An unknown error occurred';
      set({ errorMsg: msg });
    }
  },
  createChat: async ({ userIds, content }: CreateChatRequestDto) => {
    try {
      const userId = useAuthStore.getState().user?.id;

      if (!userId) {
        set({ errorMsg: 'User not logged in' });
        return { chatId: undefined };
      } else {
        set({ errorMsg: '' });
      }

      const result = await apiService.createChat({ userIds, content });

      if (result.status === 'error') {
        set({ errorMsg: 'Failed to create chat' });
        return { chatId: undefined };
      }

      const { data: chat } = result;
      const localChat = convertToLocalChat(chat);
      set({ chats: [...get().chats, localChat] });

      // Join the newly created chat room to receive messages
      socketService.emit(Events.JOIN_CHAT, { chatId: chat.id });

      // Ensure active chat includes the messages from the newly created chat
      set({
        activeChat: localChat,
      });

      return { chatId: chat.id };
    } catch (error) {
      console.error('Failed to create chat', error);
      const msg =
        error instanceof Error ? error.message : 'An unknown error occurred';
      set({ errorMsg: msg });
      return { chatId: undefined };
    }
  },
  createGroup: async (data: CreateGroupRequestDto) => {
    try {
      const userId = useAuthStore.getState().user?.id;

      if (!userId) {
        set({ errorMsg: 'User not logged in' });
        return { chatId: undefined };
      }

      set({ errorMsg: '' });

      const result = await apiService.createGroup(data);

      if (result.status === 'error') {
        set({ errorMsg: result.errorMsg || 'Failed to create group' });
        return { chatId: undefined };
      }

      const { data: chat } = result;
      const localChat = convertToLocalChat(chat);
      set({ chats: [...get().chats, localChat] });

      // Join the newly created chat room
      socketService.emit(Events.JOIN_CHAT, { chatId: chat.id });

      set({ activeChat: localChat });

      return { chatId: chat.id };
    } catch (error) {
      console.error('Failed to create group', error);
      const msg =
        error instanceof Error ? error.message : 'An unknown error occurred';
      set({ errorMsg: msg });
      return { chatId: undefined };
    }
  },
  sendMessage: async (chatId: number, content: string) => {
    if (!content) return;

    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      console.error('User not logged in');
      return;
    }

    // Generate temporary ID and client message ID
    const tempId = generateTempId();
    const clientMessageId = await syncService.queueMessage(chatId, content, userId);

    // Create optimistic local message with PENDING status
    const optimisticMessage: LocalMessage = {
      id: tempId,
      content,
      type: 'USER',
      chatId,
      senderId: userId,
      status: 'PENDING',
      createdAt: new Date(),
      deletedAt: null,
      clientMessageId,
    };

    // Add to UI immediately
    const currentActiveChat = get().activeChat;
    set({
      chats: get().chats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, optimisticMessage],
          };
        }
        return chat;
      }),
      activeChat:
        currentActiveChat?.id === chatId && currentActiveChat
          ? {
              ...currentActiveChat,
              messages: [...currentActiveChat.messages, optimisticMessage],
            }
          : currentActiveChat,
    });
  },
  setActiveChat: (chat: ActiveChat | null) => set({ activeChat: chat }),
  openChatWithUser: async (userId: number) => {
    try {
      // Only search in DIRECT chats
      const foundChat = get().chats.find(
        (chat) =>
          chat.type === 'DIRECT' &&
          chat.members.length === 2 &&
          chat.members.some((member) => member.id === userId)
      );

      if (foundChat) {
        get().setActiveChat(foundChat);
        return { chatId: foundChat.id };
      }

      const result = await apiService.getUser(userId);

      if (result.status === 'error') {
        console.error(result.errorMsg);
        return { chatId: undefined };
      }

      const user = result.data;
      const ownUser = useAuthStore.getState().user;

      if (!ownUser) {
        console.error('User not logged in');
        return { chatId: undefined };
      }

      get().setActiveChat({
        type: 'DIRECT',
        name: null,
        description: null,
        avatarUrl: null,
        createdBy: null,
        members: [ownUser, user],
        memberships: [],
        messages: [],
      });

      return { chatId: undefined }; // No chatId yet for new chats
    } catch (error) {
      console.error('Failed to open chat with user', error);
      const msg =
        error instanceof Error ? error.message : 'An unknown error occurred';
      set({ errorMsg: msg });
      return { chatId: undefined };
    }
  },
  getChatPartner: (chat: ActiveChat) => {
    if (chat.type === 'GROUP') return undefined;
    const userId = useAuthStore.getState().user?.id;
    return chat.members.find((member) => member.id !== userId);
  },
  getChatName: (chat: ActiveChat) => {
    if (chat.type === 'GROUP') {
      return chat.name || 'Unnamed Group';
    }
    const partner = get().getChatPartner(chat);
    return partner?.username || 'Unknown User';
  },
  getChatAvatar: (chat: ActiveChat) => {
    if (chat.type === 'GROUP') {
      return {
        username: chat.name || 'Group',
        src: chat.avatarUrl,
      };
    }
    const partner = get().getChatPartner(chat);
    return {
      username: partner?.username,
      src: partner?.avatarUrl,
    };
  },
  isUserAdmin: (chat: ActiveChat, userId: number) => {
    if (chat.type === 'DIRECT') return false;
    const membership = chat.memberships?.find((m) => m.userId === userId);
    return membership?.role === 'ADMIN';
  },
  getActiveChatFromUrl: (chatId?: string) => {
    if (!chatId) return null;

    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) return null;

    return get().chats.find((chat) => chat.id === chatIdNum) || null;
  },
  registerEvents: (user: User) => {
    // Listen for message status changes
    socketService.on(
      Events.MESSAGE_STATUS_CHANGE,
      ({
        messageId,
        status,
      }: {
        messageId: number;
        status: Message['status'];
      }) => {
        const currentActiveChat = get().activeChat;
        set({
          chats: get().chats.map((chat) => ({
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status } : msg
            ),
          })),
          activeChat: currentActiveChat
            ? {
                ...currentActiveChat,
                messages: currentActiveChat.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, status } : msg
                ),
              }
            : null,
        });
      }
    );

    // Listen for new chats
    socketService.on(Events.NEW_CHAT, (chatId: number) => {
      get().fetchChat(chatId);
      socketService.emit(Events.JOIN_CHAT, { chatId });
    });

    // Listen for incoming messages
    socketService.on(Events.MESSAGE, (message: Message) => {
      if (message.senderId === user.id) return;

      // Convert server message to LocalMessage
      const localMessage: LocalMessage = {
        ...message,
        clientMessageId: `server_${message.id}`,
      };

      // Update chats with new message
      const currentActiveChat = get().activeChat;
      set({
        chats: get().chats.map((chat) => {
          if (chat.id === message.chatId) {
            return {
              ...chat,
              messages: [...chat.messages, localMessage],
            };
          }
          return chat;
        }),
        activeChat:
          currentActiveChat?.id === message.chatId && currentActiveChat
            ? {
                ...currentActiveChat,
                messages: [...currentActiveChat.messages, localMessage],
              }
            : currentActiveChat,
      });

      // Automatically emit DELIVERED status for received messages (only for USER messages)
      if (message.type === 'USER') {
        socketService.emit(Events.MESSAGE_DELIVERED, { messageId: message.id });
      }
    });

    // Listen for user status changes
    socketService.on(
      Events.USER_STATUS_CHANGE,
      ({
        userId,
        status,
        timestamp,
      }: {
        userId: number;
        status: UserStatus;
        timestamp: string | Date;
      }) => {
        const contacts = useContactsStore.getState().contacts;
        useContactsStore.setState({
          contacts: {
            ...contacts,
            [userId]: {
              ...contacts[userId],
              onlineStatus: status,
              lastConnection: timestamp ? new Date(timestamp) : new Date(),
            },
          },
        });
      }
    );

    // Listen for user typing events
    socketService.on(Events.USER_TYPING, ({ userId, chatId, isTyping }) => {
      useContactsStore.getState().updateTypingStatus(userId, chatId, isTyping);
    });

    // ==================== GROUP EVENT HANDLERS ====================

    // Listen for group updates
    socketService.on(Events.GROUP_UPDATED, (updatedChat: ChatDto) => {
      const localChat = convertToLocalChat(updatedChat);
      set({
        chats: get().chats.map((c) =>
          c.id === localChat.id ? { ...c, ...localChat } : c
        ),
        activeChat:
          get().activeChat?.id === localChat.id
            ? { ...get().activeChat, ...localChat }
            : get().activeChat,
      });
    });

    // Listen for member added
    socketService.on(
      Events.MEMBER_ADDED,
      ({ chatId }: { chatId: number; userIds: number[] }) => {
        // Refetch chat to get updated member list
        get().fetchChat(chatId);
      }
    );

    // Listen for member removed
    socketService.on(
      Events.MEMBER_REMOVED,
      ({ chatId, userId, wasRemoved }: { chatId: number; userId: number; wasRemoved?: boolean }) => {
        const currentUserId = useAuthStore.getState().user?.id;

        if (userId === currentUserId || wasRemoved) {
          // Current user was removed - leave the chat room immediately
          socketService.emit(Events.LEAVE_CHAT, { chatId });

          // Remove chat from list
          set({
            chats: get().chats.filter((c) => c.id !== chatId),
            activeChat:
              get().activeChat?.id === chatId ? null : get().activeChat,
          });
        } else {
          // Someone else was removed - refetch chat
          get().fetchChat(chatId);
        }
      }
    );

    // Listen for member left
    socketService.on(
      Events.MEMBER_LEFT,
      ({ chatId, userId }: { chatId: number; userId: number }) => {
        const currentUserId = useAuthStore.getState().user?.id;

        if (userId === currentUserId) {
          // Current user left - leave the chat room immediately
          socketService.emit(Events.LEAVE_CHAT, { chatId });

          // Remove chat from list
          set({
            chats: get().chats.filter((c) => c.id !== chatId),
            activeChat:
              get().activeChat?.id === chatId ? null : get().activeChat,
          });
        } else {
          // Someone else left - refetch chat to update member list
          get().fetchChat(chatId);
        }
      }
    );

    // Listen for member role changed
    socketService.on(
      Events.MEMBER_ROLE_CHANGED,
      ({ chatId }: { chatId: number; userId: number; role: ChatMemberRole }) => {
        // Refetch chat to update memberships
        get().fetchChat(chatId);
      }
    );

    // Listen for system messages
    socketService.on(Events.SYSTEM_MESSAGE, (message: Message) => {
      const localMessage: LocalMessage = {
        ...message,
        clientMessageId: `server_${message.id}`,
      };

      const currentActiveChat = get().activeChat;
      set({
        chats: get().chats.map((chat) => {
          if (chat.id === message.chatId) {
            return {
              ...chat,
              messages: [...chat.messages, localMessage],
            };
          }
          return chat;
        }),
        activeChat:
          currentActiveChat?.id === message.chatId && currentActiveChat
            ? {
                ...currentActiveChat,
                messages: [...currentActiveChat.messages, localMessage],
              }
            : currentActiveChat,
      });
    });
  },
  replacePendingWithConfirmed: (clientMessageId: string, message: Message) => {
    // Convert server message to LocalMessage
    const confirmedMessage: LocalMessage = {
      ...message,
      clientMessageId,
    };

    // Replace the pending message with the confirmed one
    const currentActiveChat = get().activeChat;
    set({
      chats: get().chats.map((chat) => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.clientMessageId === clientMessageId ? confirmedMessage : msg
            ),
          };
        }
        return chat;
      }),
      activeChat:
        currentActiveChat?.id === message.chatId && currentActiveChat
          ? {
              ...currentActiveChat,
              messages: currentActiveChat.messages.map((msg) =>
                msg.clientMessageId === clientMessageId ? confirmedMessage : msg
              ),
            }
          : currentActiveChat,
    });
  },
  updatePendingMessageStatus: (clientMessageId: string, status: LocalMessageStatus) => {
    const currentActiveChat = get().activeChat;
    set({
      chats: get().chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.clientMessageId === clientMessageId ? { ...msg, status } : msg
        ),
      })),
      activeChat: currentActiveChat
        ? {
            ...currentActiveChat,
            messages: currentActiveChat.messages.map((msg) =>
              msg.clientMessageId === clientMessageId ? { ...msg, status } : msg
            ),
          }
        : null,
    });
  },
  retryMessage: async (clientMessageId: string) => {
    // Reset status to PENDING in UI
    get().updatePendingMessageStatus(clientMessageId, 'PENDING');
    // Retry via sync service
    await syncService.retryFailedMessage(clientMessageId);
  },
  cancelMessage: async (clientMessageId: string) => {
    // Remove from sync queue
    await syncService.cancelPendingMessage(clientMessageId);

    // Remove from UI
    const currentActiveChat = get().activeChat;
    set({
      chats: get().chats.map((chat) => ({
        ...chat,
        messages: chat.messages.filter(
          (msg) => msg.clientMessageId !== clientMessageId
        ),
      })),
      activeChat: currentActiveChat
        ? {
            ...currentActiveChat,
            messages: currentActiveChat.messages.filter(
              (msg) => msg.clientMessageId !== clientMessageId
            ),
          }
        : null,
    });
  },
}));
