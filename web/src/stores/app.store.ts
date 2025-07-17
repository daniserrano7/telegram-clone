import { create } from 'zustand';
import { useThemeStore } from './theme.store';
import { useAuthStore } from './auth.store';
import { useChatStore } from './chat.store';

type AppStatus = 'not-init' | 'initializing' | 'ready' | 'error';

interface AppStore {
  status: AppStatus;
  init: () => Promise<void>;
  setStatus: (status: AppStatus) => void;
  cleanUp: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  status: 'not-init',
  init: async () => {
    if (get().status === 'initializing' || get().status === 'ready') {
      return;
    }

    set({ status: 'initializing' });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { theme, accent } = useThemeStore.getState();
    document.body.classList.add(theme);
    document.body.classList.add(`accent-${accent}`);

    useAuthStore.getState().init();

    set({ status: 'ready' });
  },
  setStatus: (status: AppStatus) => set({ status }),
  cleanUp: () => {
    useChatStore.getState().cleanUp();
  },
}));
