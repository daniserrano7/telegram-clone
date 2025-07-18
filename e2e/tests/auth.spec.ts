import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/api';
import { registerUserUI, loginUserUI } from '../utils/ui';
import { v4 as uuid } from 'uuid';

const PASSWORD = 'Password123!';

// Generate unique usernames per run
const user1 = `e2e_${uuid().slice(0, 8)}` as const;

// Register user through UI and verify redirect

test('register user via UI', async ({ page }) => {
  await registerUserUI(page, user1, PASSWORD);
});

// Login flow (using API to pre-create user)

test('login existing user via UI', async ({ page }) => {
  // Ensure user exists
  await registerUser(user1 + 'b', PASSWORD).catch(() => {});

  await loginUserUI(page, user1 + 'b', PASSWORD);

  // Save storage state for later scenarios
  await page.context().storageState({ path: 'e2e/.state-user.json' });
});
