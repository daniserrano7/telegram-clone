import { useState, useEffect, useCallback } from 'react';
import {
  localStorageService,
  STORAGE_KEYS,
  type SearchUser,
  type ThemeSettings,
} from '../services/local-storage.service';

/**
 * Hook for recent searches data
 */
export function useRecentSearches(): [
  SearchUser[],
  (value: SearchUser[]) => void
] {
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

// Export storage keys for backward compatibility
export { STORAGE_KEYS };
export const RECENT_SEARCHES_KEY = STORAGE_KEYS.RECENT_SEARCHES;
