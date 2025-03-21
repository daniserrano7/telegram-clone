import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { CreateChatRequestDto, Message } from '@shared/chat.dto';
import { User } from '@shared/user.dto';
import { Events, UserStatus } from '@shared/gateway.dto';
import { apiService } from '../services/api.service';
import { useAuthStore } from './auth.store';
import { useUserStore } from './user.store';

interface Chat {
  id: number;
  members: User[];
  messages: Message[];
}

// Same tipe as Chat but with the id optional
type ActiveChat = Omit<Chat, 'id'> & { id?: number };

interface ChatStore {
  init: (user: User) => void;
  cleanUp: () => void;
  isInit: boolean;
  socket: Socket | null;
  isLoading: boolean;
  errorMsg: string;
  chats: Chat[];
  activeChat: ActiveChat | null;
  fetchChat: (chatId: number) => void;
  createChat: (chat: CreateChatRequestDto) => void;
  sendMessage: (chatId: number, content: string) => void;
  setActiveChat: (chat: ActiveChat) => void;
  openChatWithUser: (userId: number) => void;
  getChatPartner: (chat: ActiveChat) => User | undefined;
  initializeSocket: (user: User) => Socket;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  init: (user: User) => {
    if (get().isInit) return;
    set({ isInit: true });

    if (!user) {
      console.error('User not found');
      return;
    }

    const socket = get().initializeSocket(user);

    apiService
      .getContacts(user.id)
      .then((result) => {
        if (result.status === 'error') {
          console.error('Failed to fetch contacts', result.errorMsg);
          return;
        }

        const contacts = result.data;
        contacts.forEach((contact) => {
          useUserStore.getState().contacts[contact.id] = contact;
        });
      })
      .then(() => apiService.getChats(user.id))
      .then((result) => {
        if (result.status === 'error') {
          console.error('Failed to fetch chats', result.errorMsg);
          return;
        }

        const chats = result.data;
        set({ chats });

        // Join all chat rooms
        chats.forEach((chat) => {
          socket.emit(Events.JOIN_CHAT, { chatId: chat.id });
        });
      });

    set({ socket });
  },
  cleanUp: () => {
    const socket = get().socket;

    if (socket) {
      socket.emit(Events.LEAVE_USER, {
        userId: useAuthStore.getState().user?.id,
      });
      socket.disconnect();
    }

    set({
      isInit: false,
      socket: null,
      isLoading: false,
      errorMsg: '',
      chats: [],
      activeChat: null,
    });
  },
  isInit: false,
  socket: null,
  isLoading: false,
  errorMsg: '',
  chats: [],
  activeChat: null,
  activeChatId: null,
  fetchChat: async (chatId: number) => {
    try {
      const result = await apiService.getChat(chatId);

      if (result.status === 'error') {
        set({ errorMsg: 'Failed to fetch chat' });
        return;
      }

      const chat = result.data;
      const chatAlreadyExists = get().chats.some((c) => c.id === chat.id);
      const newChats = chatAlreadyExists
        ? get().chats.map((c) => (c.id === chat.id ? chat : c))
        : [...get().chats, chat];

      set({ chats: [...newChats] });

      if (get().activeChat?.id === chat.id) {
        get().setActiveChat(chat);
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
        return;
      } else {
        set({ errorMsg: '' });
      }

      const result = await apiService.createChat({ userIds, content });

      if (result.status === 'error') {
        set({ errorMsg: 'Failed to create chat' });
        return;
      }

      const { data: chat } = result;
      set({ chats: [...get().chats, chat] });
      get().setActiveChat(chat);
    } catch (error) {
      console.error('Failed to create chat', error);
      const msg =
        error instanceof Error ? error.message : 'An unknown error occurred';
      set({ errorMsg: msg });
    }
  },
  sendMessage: async (chatId: number, content: string) => {
    if (!content) return;

    const socket = get().socket;

    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

    socket.emit(
      Events.SEND_MESSAGE,
      { chatId, content },
      (result: { status: 'success' | 'error'; message: Message }) => {
        const { status, message } = result;

        if (status === 'error') {
          console.error('Failed to send message: ', message);
          return;
        }

        set({
          chats: get().chats.map((chat) => {
            if (chat.id === message.chatId) {
              return {
                ...chat,
                messages: [...chat.messages, message],
              };
            }
            return chat;
          }),
          activeChat: {
            id: get().activeChat?.id,
            members: get().activeChat?.members || [],
            messages: get().activeChat?.messages.concat(message) || [],
          },
        });

        // Emit delivered status for received messages
        if (
          result.status === 'success' &&
          result.message.senderId !== useAuthStore.getState().user?.id
        ) {
          socket.emit(Events.MESSAGE_DELIVERED, {
            messageId: result.message.id,
          });
        }
      }
    );
  },
  setActiveChat: (chat: ActiveChat) => set({ activeChat: chat }),
  openChatWithUser: async (userId: number) => {
    try {
      const foundChat = get().chats.find(
        (chat) =>
          chat.members.length === 2 &&
          chat.members.some((member) => member.id === userId)
      );

      if (foundChat) {
        get().setActiveChat(foundChat);
        return;
      }

      const result = await apiService.getUser(userId);

      if (result.status === 'error') {
        console.error(result.errorMsg);
        return;
      }

      const user = result.data;
      const ownUser = useAuthStore.getState().user;

      if (!ownUser) {
        console.error('User not logged in');
        return;
      }

      get().setActiveChat({
        members: [ownUser, user],
        messages: [],
      });
    } catch (error) {
      console.error('Failed to open chat with user', error);
      const msg =
        error instanceof Error ? error.message : 'An unknown error occurred';
      set({ errorMsg: msg });
    }
  },
  getChatPartner: (chat: ActiveChat) => {
    const userId = useAuthStore.getState().user?.id;
    return chat.members.find((member) => member.id !== userId);
  },
  initializeSocket: (user: User) => {
    const socketUrl = import.meta.env.VITE_WS_URL;
    console.log('socketUrl', socketUrl);
    const socket = io(socketUrl, {
      auth: {
        token: useAuthStore.getState().token,
      },
    });

    // Listen for message status changes
    socket.on(Events.MESSAGE_STATUS_CHANGE, ({ messageId, status }) => {
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
    });

    // Listen for new chats
    socket.on(Events.NEW_CHAT, (chatId) => {
      get().fetchChat(chatId);
      socket.emit(Events.JOIN_CHAT, chatId);
    });

    // Listen for incoming messages
    socket.on(Events.MESSAGE, (message: Message) => {
      if (message.senderId === user.id) return;

      // Update chats with new message
      set({
        chats: get().chats.map((chat) => {
          if (chat.id === message.chatId) {
            return {
              ...chat,
              messages: [...chat.messages, message],
            };
          }
          return chat;
        }),
        activeChat:
          get().activeChat?.id === message.chatId
            ? {
                id: get().activeChat?.id,
                members: get().activeChat?.members || [],
                messages: get().activeChat?.messages.concat(message) || [],
              }
            : get().activeChat,
      });

      // Automatically emit DELIVERED status for received messages
      socket.emit(Events.MESSAGE_DELIVERED, { messageId: message.id });
    });

    // Listen for user status changes
    socket.on(
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
        const contacts = useUserStore.getState().contacts;
        useUserStore.setState({
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
    socket.on(Events.USER_TYPING, ({ userId, chatId, isTyping }) => {
      useUserStore.getState().updateTypingStatus(userId, chatId, isTyping);
    });

    // Handle heartbeat
    socket.on(Events.HEARTBEAT, () => {
      socket.emit(Events.HEARTBEAT_RESPONSE);
    });

    // Handle connection verification
    socket.on(Events.CONNECTION_VERIFY, () => {
      console.log('Received connection verification request from server');
      socket.emit(Events.CONNECTION_VERIFY_RESPONSE);
    });

    return socket;
  },
}));
