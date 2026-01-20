import { create } from 'zustand';
import {
  localStorageService,
  STORAGE_KEYS,
} from '../services/local-storage.service';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface FontSizeState {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

// Font size configuration with base text size and emoji ratio
const FONT_SIZE_CONFIG: Record<FontSize, { baseSize: string; emojiSize: string }> = {
  small: {
    baseSize: '0.875rem', // 14px
    emojiSize: '1.125rem', // 18px (1.28x ratio)
  },
  medium: {
    baseSize: '1rem', // 16px
    emojiSize: '1.375rem', // 22px (1.375x ratio)
  },
  large: {
    baseSize: '1.125rem', // 18px
    emojiSize: '1.5rem', // 24px (1.33x ratio)
  },
  'extra-large': {
    baseSize: '1.25rem', // 20px
    emojiSize: '1.75rem', // 28px (1.4x ratio)
  },
} as const;

const updateCSSVariables = (fontSize: FontSize) => {
  const config = FONT_SIZE_CONFIG[fontSize];
  const root = document.documentElement;

  root.style.setProperty('--font-size-base', config.baseSize);
  root.style.setProperty('--font-size-emoji', config.emojiSize);
};

export const useFontSizeStore = create<FontSizeState>((set, get) => {
  // Initialize from localStorage
  const savedFontSize = localStorageService.get(
    STORAGE_KEYS.FONT_SIZE_SETTINGS
  );
  const initialFontSize = savedFontSize?.fontSize || 'small';

  // Apply initial font size to CSS variables
  updateCSSVariables(initialFontSize);

  return {
    fontSize: initialFontSize,
    setFontSize: (newFontSize) => {
      const currentFontSize = get().fontSize;

      if (currentFontSize === newFontSize) return;

      // Update CSS variables
      updateCSSVariables(newFontSize);

      // Update state
      set({ fontSize: newFontSize });

      // Save to localStorage
      localStorageService.set(STORAGE_KEYS.FONT_SIZE_SETTINGS, {
        fontSize: newFontSize,
      });
    },
  };
});

// Utility function to programmatically set font size
export const setFontSize = (fontSize: FontSize) => {
  useFontSizeStore.getState().setFontSize(fontSize);
};
