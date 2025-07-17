import { z } from 'zod';

// Zod schemas for validation
const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  onlineStatus: z.enum(['ONLINE', 'OFFLINE']),
  lastConnection: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

const UserAuthSchema = z.object({
  user: UserSchema,
  token: z.string(),
});

const SearchUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  lastSearched: z.date(),
});

const ThemeSchema = z.enum(['light', 'dark']);
const AccentSchema = z.enum([
  'blue',
  'red',
  'green',
  'yellow',
  'purple',
  'orange',
]);

const ThemeSettingsSchema = z.object({
  theme: ThemeSchema,
  accent: AccentSchema,
});

// Storage keys
export const STORAGE_KEYS = {
  USER_AUTH: 'user',
  RECENT_SEARCHES: 'recent-searches',
  THEME_SETTINGS: 'theme-storage',
} as const;

// Type definitions
export type UserAuth = z.infer<typeof UserAuthSchema>;
export type SearchUser = z.infer<typeof SearchUserSchema>;
export type ThemeSettings = z.infer<typeof ThemeSettingsSchema>;

// Schema map for type safety
const SCHEMA_MAP = {
  [STORAGE_KEYS.USER_AUTH]: UserAuthSchema,
  [STORAGE_KEYS.RECENT_SEARCHES]: z.array(SearchUserSchema),
  [STORAGE_KEYS.THEME_SETTINGS]: ThemeSettingsSchema,
} as const;

type StorageKey = keyof typeof SCHEMA_MAP;
type StorageValue<K extends StorageKey> = z.infer<(typeof SCHEMA_MAP)[K]>;

export class LocalStorageService {
  private isAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private parseJSON(value: string): unknown {
    try {
      return JSON.parse(value, (_key, val) => {
        // Handle Date objects
        if (
          typeof val === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)
        ) {
          return new Date(val);
        }
        return val;
      });
    } catch {
      return null;
    }
  }

  private stringifyJSON(value: unknown): string {
    return JSON.stringify(value, (_key, val) => {
      // Handle Date objects
      if (val instanceof Date) {
        return val.toISOString();
      }
      return val;
    });
  }

  /**
   * Get a value from localStorage with type safety and validation
   */
  get<K extends StorageKey>(key: K): StorageValue<K> | null {
    if (!this.isAvailable()) {
      console.warn('LocalStorage is not available');
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }

      const parsed = this.parseJSON(item);
      const schema = SCHEMA_MAP[key];

      // Validate the parsed data
      const result = schema.safeParse(parsed);
      if (!result.success) {
        console.warn(
          `Invalid data in localStorage for key "${key}":`,
          result.error.issues
        );
        // Remove invalid data
        localStorage.removeItem(key);
        return null;
      }

      return result.data as StorageValue<K>;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a value in localStorage with type safety and validation
   */
  set<K extends StorageKey>(key: K, value: StorageValue<K>): boolean {
    if (!this.isAvailable()) {
      console.warn('LocalStorage is not available');
      return false;
    }

    try {
      const schema = SCHEMA_MAP[key];

      // Validate the data before storing
      const result = schema.safeParse(value);
      if (!result.success) {
        console.error(
          `Invalid data provided for key "${key}":`,
          result.error.issues
        );
        return false;
      }

      const serialized = this.stringifyJSON(result.data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove a value from localStorage
   */
  remove(key: StorageKey): boolean {
    if (!this.isAvailable()) {
      console.warn('LocalStorage is not available');
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(
        `Error removing from localStorage for key "${key}":`,
        error
      );
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  has(key: StorageKey): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all known keys from localStorage
   */
  clear(): boolean {
    if (!this.isAvailable()) {
      console.warn('LocalStorage is not available');
      return false;
    }

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all stored data (useful for debugging)
   */
  getAll(): Partial<Record<StorageKey, unknown>> {
    const result: Partial<Record<StorageKey, unknown>> = {};

    Object.values(STORAGE_KEYS).forEach((key) => {
      const value = this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    });

    return result;
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

// Export individual methods for convenience
export const {
  get: getFromStorage,
  set: setInStorage,
  remove: removeFromStorage,
  has: hasInStorage,
  clear: clearStorage,
  getAll: getAllFromStorage,
} = localStorageService;
