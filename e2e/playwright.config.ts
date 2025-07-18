import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Load environment variables from .env file
config({ path: './.env' });
// Base URLs can be overridden by environment variables when running in CI
const baseURL = process.env.E2E_BASE_URL || `http://localhost:3000`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Assume the stack (Docker compose or dev servers) is already running.
  // Set `PW_WEB_SERVER` env if you want Playwright to spawn it automatically.
});
