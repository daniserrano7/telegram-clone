import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type Accent = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange';

interface ThemeState {
  theme: Theme;
  accent: Accent;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      accent: 'blue',
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
      },
      setAccent: (newAccent) => {
        const currentAccent = get().accent;

        if (currentAccent === newAccent) return;
        document.body.classList.add(`accent-${newAccent}`);
        document.body.classList.remove(`accent-${currentAccent}`);
        set({ accent: newAccent });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
