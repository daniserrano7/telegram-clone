import { create } from 'zustand';
import { CreateChatRequestDto, Message } from '@shared/chat.dto';
import { User } from '@shared/user.dto';
import { Events, UserStatus } from '@shared/gateway.dto';
import { apiService } from '../services/api.service';
import { socketService } from '../services/socket.service';
import { useAuthStore } from './auth.store';
import { useContactsStore } from './contacts.store';

interface Chat {
  id: number;
  members: User[];
  messages: Message[];
}

// Same tipe as Chat but with the id optional
type ActiveChat = Omit<Chat, 'id'> & { id?: number };

interface ChatStore {
  init: (user: User) => Promise<void>;
  cleanUp: () => void;
  isInit: boolean;
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
  registerEvents: (user: User) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  init: async (user: User) => {
    try {
      set({ isInit: true, isLoading: true });

      get().registerEvents(user);

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
      set({ chats });

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
      chats: [],
      activeChat: null,
    });
  },
  isInit: false,
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

    if (!socketService.isConnected()) {
      console.error('Socket not initialized');
      return;
    }

    socketService.emit(
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
          socketService.emit(Events.MESSAGE_DELIVERED, {
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
}));
