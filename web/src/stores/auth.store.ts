import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User } from '@shared/user.dto';
import { apiService } from '../services/api.service';
import { useChatStore } from './chat.store';

interface AuthState {
  token: string | null;
  user: User | null;
  isLogged: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (credentials: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
}

const LOCAL_STORAGE_USER_KEY = 'user';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLogged: false,
      login: async ({ username, password }) => {
        const result = await apiService.login({ username, password });

        if (result.status === 'error') {
          throw new Error(result.errorMsg);
        }

        const { token, user } = result.data;
        apiService.setToken(token);
        set({ token, user, isLogged: true });
        localStorage.setItem(
          LOCAL_STORAGE_USER_KEY,
          JSON.stringify({ user, token })
        );
        useChatStore.getState().init(user);
      },
      register: async ({ username, password, confirmPassword }) => {
        const result = await apiService.register({
          username,
          password,
          confirmPassword,
        });

        if (result.status === 'error') {
          throw new Error(result.errorMsg);
        }

        const { token, user } = result.data;
        apiService.setToken(token);
        set({ token, user, isLogged: true });
        localStorage.setItem(
          LOCAL_STORAGE_USER_KEY,
          JSON.stringify({ user, token })
        );
        useChatStore.getState().init(user);
      },
      logout: () => {
        set({ token: null, user: null, isLogged: false });
        useChatStore.getState().cleanUp();
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
