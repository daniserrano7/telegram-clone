import { create } from 'zustand';
import { RegisterRequestDto, LoginRequestDto } from '@shared/auth.dto';
import { type User } from '@shared/user.dto';
import { apiService } from '../services/api.service';
import { useChatStore } from './chat.store';
import {
  localStorageService,
  STORAGE_KEYS,
} from '../services/local-storage.service';

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
const LOCAL_STORAGE_USER_KEY = STORAGE_KEYS.USER_AUTH;

export const useAuthStore = create<AuthStore>((set, get) => ({
  init: async () => {
    try {
      if (get().isInit) {
        console.log('Auth store already initialized');
        return;
      }

      set({ isInit: true });

      const userAuth = localStorageService.get(LOCAL_STORAGE_USER_KEY);

      if (!userAuth) {
        console.info('No user auth found');
        return;
      }

      const { token, user } = userAuth;
      apiService.setToken(token);

      set({ token, user, isLogged: true });

      const userData = await apiService.getUser(user.id);

      if (userData.status === 'error') {
        console.error('Failed to fetch user data', userData.errorMsg);
        return;
      }

      set({ user: userData.data });

      await useChatStore.getState().init(user);
    } catch (e) {
      console.error('Failed to initialize auth store', e);
    }
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
    localStorageService.set(LOCAL_STORAGE_USER_KEY, { user, token });

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
    localStorageService.set(LOCAL_STORAGE_USER_KEY, { user, token });

    await useChatStore.getState().init(user);
    return user;
  },
  logout: () => {
    set({ token: '', user: null, isLogged: false });
    useChatStore.getState().cleanUp();
    localStorageService.remove(LOCAL_STORAGE_USER_KEY);
    localStorageService.remove(STORAGE_KEYS.RECENT_SEARCHES);
  },
}));
