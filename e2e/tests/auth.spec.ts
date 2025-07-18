import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/api';
import { v4 as uuid } from 'uuid';

const PASSWORD = 'Password123!';

// Generate unique usernames per run
const user1 = `e2e_${uuid().slice(0, 8)}` as const;

// Register user through UI and verify redirect

test('register user via UI', async ({ page }) => {
  await page.goto('/register');

  await page.getByLabel('Username').fill(user1);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password').fill(PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/.*\/chats/);
});

// Login flow (using API to pre-create user)

test('login existing user via UI', async ({ page }) => {
  // Ensure user exists
  await registerUser(user1 + 'b', PASSWORD).catch(() => {});

  await page.goto('/login');
  await page.getByLabel('Username').fill(user1 + 'b');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/.*\/chats/);

  // Save storage state for later scenarios
  await page.context().storageState({ path: 'e2e/.state-user.json' });
});
