# Local Storage Service

A type-safe localStorage service with runtime validation using Zod.

## Features

- **Type Safety**: All operations are type-safe with TypeScript
- **Runtime Validation**: Uses Zod schemas to validate data when reading from localStorage
- **Error Handling**: Graceful error handling with automatic cleanup of invalid data
- **Date Handling**: Automatic serialization/deserialization of Date objects
- **Availability Check**: Handles cases where localStorage is not available

## Usage

### Direct Service Usage

```typescript
import { localStorageService, STORAGE_KEYS } from '../services/local-storage.service';

// Set user auth data
const userAuth = {
  user: { /* user data */ },
  token: 'jwt-token'
};
localStorageService.set(STORAGE_KEYS.USER_AUTH, userAuth);

// Get user auth data
const auth = localStorageService.get(STORAGE_KEYS.USER_AUTH);
if (auth) {
  console.log('User:', auth.user);
  console.log('Token:', auth.token);
}

// Remove data
localStorageService.remove(STORAGE_KEYS.USER_AUTH);

// Check if key exists
const hasAuth = localStorageService.has(STORAGE_KEYS.USER_AUTH);
```

### React Hooks

```typescript
import { useUserAuth, useRecentSearches, useThemeSettings } from '../hooks/useLocalStorageService';

function MyComponent() {
  const [userAuth, setUserAuth] = useUserAuth();
  const [recentSearches, setRecentSearches] = useRecentSearches();
  const [themeSettings, setThemeSettings] = useThemeSettings();

  // userAuth is type-safe and validated
  if (userAuth) {
    console.log('Logged in user:', userAuth.user.username);
  }

  // Set new theme
  setThemeSettings({ theme: 'dark', accent: 'blue' });

  // Add to recent searches
  setRecentSearches([...recentSearches, newSearch]);
}
```

## Storage Keys

- `STORAGE_KEYS.USER_AUTH`: User authentication data (user + token)
- `STORAGE_KEYS.RECENT_SEARCHES`: Array of recent search users
- `STORAGE_KEYS.THEME_SETTINGS`: Theme and accent preferences

## Validation

All data is validated using Zod schemas:

- Invalid data is automatically removed from localStorage
- Type mismatches are caught at runtime
- Date objects are properly serialized/deserialized
- Error messages are logged in development mode

## Error Handling

- Missing localStorage support is handled gracefully
- Invalid JSON is caught and cleaned up
- Schema validation failures remove corrupted data
- All operations return boolean success indicators

## Migration from useLocalStorage

The old `useLocalStorage` hook has been replaced with type-safe alternatives:

```typescript
// Old way
const [value, setValue] = useLocalStorage('key', defaultValue);

// New way
const [value, setValue] = useRecentSearches(); // for recent searches
const [value, setValue] = useUserAuth(); // for user auth
const [value, setValue] = useThemeSettings(); // for theme settings
```