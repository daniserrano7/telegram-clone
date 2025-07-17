import { useState, useEffect, useCallback } from 'react';
import { 
  localStorageService, 
  STORAGE_KEYS,
  type SearchUser,
  type UserAuth,
  type ThemeSettings,
} from '../services/local-storage.service';

/**
 * Hook for user authentication data
 */
export function useUserAuth(): [UserAuth | null, (value: UserAuth | null) => void] {
  const [storedValue, setStoredValue] = useState<UserAuth | null>(() => {
    return localStorageService.get(STORAGE_KEYS.USER_AUTH);
  });

  const setValue = useCallback((value: UserAuth | null) => {
    try {
      setStoredValue(value);
      if (value === null) {
        localStorageService.remove(STORAGE_KEYS.USER_AUTH);
      } else {
        localStorageService.set(STORAGE_KEYS.USER_AUTH, value);
      }
    } catch (error) {
      console.error('Error setting user auth in localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER_AUTH) {
        const newValue = localStorageService.get(STORAGE_KEYS.USER_AUTH);
        setStoredValue(newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [storedValue, setValue];
}

/**
 * Hook for recent searches data
 */
export function useRecentSearches(): [SearchUser[], (value: SearchUser[]) => void] {
  const [storedValue, setStoredValue] = useState<SearchUser[]>(() => {
    return localStorageService.get(STORAGE_KEYS.RECENT_SEARCHES) || [];
  });

  const setValue = useCallback((value: SearchUser[]) => {
    try {
      setStoredValue(value);
      localStorageService.set(STORAGE_KEYS.RECENT_SEARCHES, value);
    } catch (error) {
      console.error('Error setting recent searches in localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.RECENT_SEARCHES) {
        const newValue = localStorageService.get(STORAGE_KEYS.RECENT_SEARCHES);
        setStoredValue(newValue || []);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [storedValue, setValue];
}

/**
 * Hook for theme settings data
 */
export function useThemeSettings(): [ThemeSettings, (value: ThemeSettings) => void] {
  const [storedValue, setStoredValue] = useState<ThemeSettings>(() => {
    return localStorageService.get(STORAGE_KEYS.THEME_SETTINGS) || {
      theme: 'light',
      accent: 'blue',
    };
  });

  const setValue = useCallback((value: ThemeSettings) => {
    try {
      setStoredValue(value);
      localStorageService.set(STORAGE_KEYS.THEME_SETTINGS, value);
    } catch (error) {
      console.error('Error setting theme settings in localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.THEME_SETTINGS) {
        const newValue = localStorageService.get(STORAGE_KEYS.THEME_SETTINGS);
        setStoredValue(newValue || { theme: 'light', accent: 'blue' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [storedValue, setValue];
}

// Export storage keys for backward compatibility
export { STORAGE_KEYS };
export const RECENT_SEARCHES_KEY = STORAGE_KEYS.RECENT_SEARCHES;