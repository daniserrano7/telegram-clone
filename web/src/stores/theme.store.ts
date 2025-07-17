import { create } from 'zustand';
import { localStorageService, STORAGE_KEYS } from '../services/local-storage.service';

export type Theme = 'light' | 'dark';
export type Accent = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange';

interface ThemeState {
  theme: Theme;
  accent: Accent;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize from localStorage
  const savedTheme = localStorageService.get(STORAGE_KEYS.THEME_SETTINGS);
  const initialTheme = savedTheme?.theme || 'light';
  const initialAccent = savedTheme?.accent || 'blue';

  return {
    theme: initialTheme,
    accent: initialAccent,
    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    },
    setTheme: (newTheme) => {
      const currentTheme = get().theme;

      if (currentTheme === newTheme) return;
      document.body.classList.add(`${newTheme}`);
      document.body.classList.remove(`${currentTheme}`);
      set({ theme: newTheme });
      
      // Save to localStorage
      const { accent } = get();
      localStorageService.set(STORAGE_KEYS.THEME_SETTINGS, { theme: newTheme, accent });
    },
    setAccent: (newAccent) => {
      const currentAccent = get().accent;

      if (currentAccent === newAccent) return;
      document.body.classList.add(`accent-${newAccent}`);
      document.body.classList.remove(`accent-${currentAccent}`);
      set({ accent: newAccent });
      
      // Save to localStorage
      const { theme } = get();
      localStorageService.set(STORAGE_KEYS.THEME_SETTINGS, { theme, accent: newAccent });
    },
  };
});
