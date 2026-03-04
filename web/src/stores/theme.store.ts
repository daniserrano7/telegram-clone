import { create } from 'zustand';
import {
  localStorageService,
  STORAGE_KEYS,
} from '../services/local-storage.service';

export type Theme = 'light' | 'dark';
export type Accent = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface ThemeState {
  theme: Theme;
  accent: Accent;
  fontSize: FontSize;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
  setFontSize: (fontSize: FontSize) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize from localStorage
  const savedTheme = localStorageService.get(STORAGE_KEYS.THEME_SETTINGS);
  const initialTheme = savedTheme?.theme || 'light';
  const initialAccent = savedTheme?.accent || 'blue';
  const initialFontSize = savedTheme?.fontSize || 'medium';

  document.body.classList.add(initialTheme);
  document.body.classList.add(`accent-${initialAccent}`);
  document.body.classList.add(`font-size-${initialFontSize}`);

  return {
    theme: initialTheme,
    accent: initialAccent,
    fontSize: initialFontSize,
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
      const { accent, fontSize } = get();
      localStorageService.set(STORAGE_KEYS.THEME_SETTINGS, {
        theme: newTheme,
        accent,
        fontSize,
      });
    },
    setAccent: (newAccent) => {
      const currentAccent = get().accent;

      if (currentAccent === newAccent) return;
      document.body.classList.add(`accent-${newAccent}`);
      document.body.classList.remove(`accent-${currentAccent}`);
      set({ accent: newAccent });

      // Save to localStorage
      const { theme, fontSize } = get();
      localStorageService.set(STORAGE_KEYS.THEME_SETTINGS, {
        theme,
        accent: newAccent,
        fontSize,
      });
    },
    setFontSize: (newFontSize) => {
      const currentFontSize = get().fontSize;

      if (currentFontSize === newFontSize) return;
      document.body.classList.add(`font-size-${newFontSize}`);
      document.body.classList.remove(`font-size-${currentFontSize}`);
      set({ fontSize: newFontSize });

      // Save to localStorage
      const { theme, accent } = get();
      localStorageService.set(STORAGE_KEYS.THEME_SETTINGS, {
        theme,
        accent,
        fontSize: newFontSize,
      });
    },
  };
});
