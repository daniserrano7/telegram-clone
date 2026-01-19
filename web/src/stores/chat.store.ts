import { create } from 'zustand';
import { CreateChatRequestDto, Message } from '@shared/chat.dto';
import { User } from '@shared/user.dto';
import { Events, UserStatus } from '@shared/gateway.dto';
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
  members: User[];
  messages: LocalMessage[];
}

// Same tipe as Chat but with the id optional
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
  sendMessage: (chatId: number, content: string) => void;
  setActiveChat: (chat: ActiveChat | null) => void;
  openChatWithUser: (userId: number) => Promise<{ chatId?: number }>;
  getChatPartner: (chat: ActiveChat) => User | undefined;
  getActiveChatFromUrl: (chatId?: string) => ActiveChat | null;
  registerEvents: (user: User) => void;
  replacePendingWithConfirmed: (clientMessageId: string, message: Message) => void;
  updatePendingMessageStatus: (clientMessageId: string, status: LocalMessageStatus) => void;
  retryMessage: (clientMessageId: string) => void;
  cancelMessage: (clientMessageId: string) => void;
}

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
      // Convert server messages to LocalMessages
      const localChats = chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) => ({
          ...msg,
          clientMessageId: `server_${msg.id}`,
        })) as LocalMessage[],
      }));
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
      // Convert server messages to LocalMessages
      const localChat: Chat = {
        ...chat,
        messages: chat.messages.map((msg) => ({
          ...msg,
          clientMessageId: `server_${msg.id}`,
        })) as LocalMessage[],
      };
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
      // Convert server messages to LocalMessages
      const localChat: Chat = {
        ...chat,
        messages: (chat.messages || []).map((msg) => ({
          ...msg,
          clientMessageId: `server_${msg.id}`,
        })) as LocalMessage[],
      };
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
      chatId,
      senderId: userId,
      status: 'PENDING',
      createdAt: new Date(),
      deletedAt: null,
      clientMessageId,
    };

    // Add to UI immediately
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
        get().activeChat?.id === chatId
          ? {
              ...get().activeChat,
              members: get().activeChat?.members || [],
              messages: [...(get().activeChat?.messages || []), optimisticMessage],
            }
          : get().activeChat,
    });
  },
  setActiveChat: (chat: ActiveChat | null) => set({ activeChat: chat }),
  openChatWithUser: async (userId: number) => {
    try {
      const foundChat = get().chats.find(
        (chat) =>
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
        members: [ownUser, user],
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
    const userId = useAuthStore.getState().user?.id;
    return chat.members.find((member) => member.id !== userId);
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
        set({
          chats: get().chats.map((chat) => ({
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status } : msg
            ),
          })),
          activeChat: get().activeChat
            ? {
                ...get().activeChat,
                members: get().activeChat?.members || [],
                messages:
                  get().activeChat?.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, status } : msg
                  ) || [],
              }
            : null,
        });
      }
    );

    // Listen for new chats
    socketService.on(Events.NEW_CHAT, (chatId: number) => {
      get().fetchChat(chatId);
      socketService.emit(Events.JOIN_CHAT, chatId);
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
          get().activeChat?.id === message.chatId
            ? {
                id: get().activeChat?.id,
                members: get().activeChat?.members || [],
                messages: [...(get().activeChat?.messages || []), localMessage],
              }
            : get().activeChat,
      });

      // Automatically emit DELIVERED status for received messages
      socketService.emit(Events.MESSAGE_DELIVERED, { messageId: message.id });
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

    // Handle heartbeat (additional safety although service already does)
    socketService.on(Events.HEARTBEAT, () => {
      socketService.emit(Events.HEARTBEAT_RESPONSE);
    });

    // Handle connection verification
    socketService.on(Events.CONNECTION_VERIFY, () => {
      console.log('Received connection verification request from server');
      socketService.emit(Events.CONNECTION_VERIFY_RESPONSE);
    });
  },
  replacePendingWithConfirmed: (clientMessageId: string, message: Message) => {
    // Convert server message to LocalMessage
    const confirmedMessage: LocalMessage = {
      ...message,
      clientMessageId,
    };

    // Replace the pending message with the confirmed one
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
        get().activeChat?.id === message.chatId
          ? {
              ...get().activeChat,
              members: get().activeChat?.members || [],
              messages: (get().activeChat?.messages || []).map((msg) =>
                msg.clientMessageId === clientMessageId ? confirmedMessage : msg
              ),
            }
          : get().activeChat,
    });
  },
  updatePendingMessageStatus: (clientMessageId: string, status: LocalMessageStatus) => {
    set({
      chats: get().chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.clientMessageId === clientMessageId ? { ...msg, status } : msg
        ),
      })),
      activeChat: get().activeChat
        ? {
            ...get().activeChat,
            members: get().activeChat?.members || [],
            messages: (get().activeChat?.messages || []).map((msg) =>
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
    set({
      chats: get().chats.map((chat) => ({
        ...chat,
        messages: chat.messages.filter(
          (msg) => msg.clientMessageId !== clientMessageId
        ),
      })),
      activeChat: get().activeChat
        ? {
            ...get().activeChat,
            members: get().activeChat?.members || [],
            messages: (get().activeChat?.messages || []).filter(
              (msg) => msg.clientMessageId !== clientMessageId
            ),
          }
        : null,
    });
  },
}));
