import { create } from 'zustand';
import { RegisterRequestDto, LoginRequestDto } from '@shared/auth.dto';
import { type User } from '@shared/user.dto';
import { apiService } from '../services/api.service';
import { useChatStore } from './chat.store';

interface UserAuth {
  token: string;
  user: User;
}

interface AuthStore {
  init: () => void;
  user: User | null;
  isInit: boolean;
  isLogged: boolean;
  token: string;
  register: (credentials: RegisterRequestDto) => Promise<User>;
  login: (credentials: LoginRequestDto) => Promise<User>;
  logout: () => void;
}
const LOCAL_STORAGE_USER_KEY = 'user';

export const useAuthStore = create<AuthStore>((set, get) => ({
  init: () => {
    if (get().isInit) return;
    set({ isInit: true });

    const userAuthString = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

    if (!userAuthString) {
      console.error('No user auth found');
      return;
    }

    const { token, user } = JSON.parse(userAuthString) as UserAuth;
    apiService.setToken(token);

    set({ token, user, isLogged: true });
    useChatStore.getState().init(user);

    apiService.getUser(user.id).then((res) => {
      if (res.status === 'success') {
        set({ user: res.data });

        localStorage.setItem(
          LOCAL_STORAGE_USER_KEY,
          JSON.stringify({ user: res.data, token })
        );
      }
    });
  },
  user: null,
  isInit: false,
  isLogged: false,
  token: '',
  register: async ({ username, password, confirmPassword }) => {
    const result = await apiService.register({
      username,
      password,
      confirmPassword,
    });

    if (result.status === 'error') {
      const errorMsg = result.errorMsg || 'An error occurred';
      throw new Error(errorMsg);
    }

    const { user, token } = result.data;
    set({
      user,
      token,
      isLogged: true,
    });
    localStorage.setItem(
      LOCAL_STORAGE_USER_KEY,
      JSON.stringify({ user, token })
    );

    useChatStore.getState().init(user);
    return user;
  },
  login: async ({ username, password }) => {
    const result = await apiService.login({ username, password });

    if (result.status === 'error') {
      const errorMsg = result.errorMsg || 'An error occurred';
      throw new Error(errorMsg);
    }

    const { user, token } = result.data;
    set({
      user,
      token,
      isLogged: true,
    });
    localStorage.setItem(
      LOCAL_STORAGE_USER_KEY,
      JSON.stringify({ user, token })
    );

    useChatStore.getState().init(user);
    return user;
  },
  logout: () => {
    set({ token: '', user: null, isLogged: false });
    useChatStore.getState().cleanUp();
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  },
}));
