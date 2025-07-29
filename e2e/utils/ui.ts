// @ts-nocheck
import { Page, expect } from '@playwright/test';

/**
 * Registers a user through the UI and verifies successful redirect
 */
export async function registerUserUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/.*\/chats/);
}

/**
 * Logs in a user through the UI and verifies successful redirect
 */
export async function loginUserUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/.*\/chats/);
}

/**
 * Opens the profile dialog for the current user
 */
export async function openProfileDialog(page: Page): Promise<void> {
  // Click the hamburger menu button (settings panel trigger)
  await page.getByTestId('settings-menu-button').click();
  
  // Wait for settings panel and click "My Profile"
  await expect(page.getByText('My Profile')).toBeVisible();
  await page.getByText('My Profile').click();
  
  // Wait for profile dialog to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();
}