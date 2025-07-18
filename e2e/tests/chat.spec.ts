import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from '../utils/api';
import { registerUserUI, loginUserUI } from '../utils/ui';
import { v4 as uuid } from 'uuid';

const PASSWORD = 'Password123!';

function generateUsers(): { u1: string; u2: string } {
  const id1 = uuid().slice(0, 8);
  const id2 = uuid().slice(0, 8);
  return {
    u1: `chat_${id1}`,
    u2: `chat_${id2}`,
  };
}

async function performCoreChatFlow(
  page: any,
  senderName: string,
  receiverName: string
): Promise<{ messageText: string }> {
  // Search receiver and open chat
  await page.getByPlaceholder('Search').fill(receiverName);
  await page.locator(`[role="option"]:has-text("${receiverName}")`).click();

  // Send first message => creates chat if needed
  const messageText = 'Hello from ' + senderName;
  await page.getByPlaceholder('Write a message').fill(messageText);

  // Wait for send button to be available and click it
  // Try multiple selectors for the send button
  const sendButton = page
    .getByRole('button')
    .filter({ hasText: /send/i })
    .or(page.getByRole('button').filter({ hasText: /enviar/i }))
    .or(page.locator('button[type="submit"]'))
    .or(page.locator('button:has-text("Send")'));
  await sendButton.first().waitFor({ state: 'visible', timeout: 10000 });
  await sendButton.first().click();

  // Wait a moment for the message to be processed
  await page.waitForTimeout(1000);

  // Wait for message to appear - try multiple selectors
  const messageLocator = page
    .locator('text=' + messageText)
    .or(
      page
        .locator(`text="${messageText}"`)
        .or(
          page
            .getByText(messageText)
            .or(
              page.locator(`[data-testid="message"]:has-text("${messageText}")`)
            )
        )
    );
  await expect(messageLocator.first()).toBeVisible({ timeout: 10000 });

  return { messageText };
}

test.describe('core chat features', () => {
  const { u1, u2 } = generateUsers();

  test.beforeAll(async () => {
    // Pre-register receiver via API so it can be searched
    await registerUser(u2, PASSWORD).catch(() => {});
  });

  test('after register – chat flow', async ({ page, browser }) => {
    /* Register sender via UI */
    await registerUserUI(page, u1, PASSWORD);

    await performCoreChatFlow(page, u1, u2);

    /* Open receiver context and reply */
    const page2 = await browser.newPage();
    await loginUserUI(page2, u2, PASSWORD);

    // Open created chat by selecting chat with sender name in sidebar
    await page2.locator(`text=${u1}`).first().click();
    const replyText = 'Hey there!';
    await page2.getByPlaceholder('Write a message').fill(replyText);

    // Use same send button selector as above
    const sendButton2 = page2
      .getByRole('button')
      .filter({ hasText: /send/i })
      .or(page2.getByRole('button').filter({ hasText: /enviar/i }))
      .or(page2.locator('button[type="submit"]'))
      .or(page2.locator('button:has-text("Send")'));
    await sendButton2.first().click();

    // Sender page should receive it - use more specific selector to avoid sidebar match
    await expect(page.getByText(replyText).last()).toBeVisible();
  });

  test('after login – chat flow', async ({ page }) => {
    // Ensure user exists before login
    await registerUser(u1, PASSWORD).catch(() => {});
    
    await loginUserUI(page, u1, PASSWORD);

    await performCoreChatFlow(page, u1, u2);
  });

  test('stored credentials – chat flow', async ({ browser }) => {
    /* Use storage state from previous login */
    const context = await browser.newContext({
      storageState: 'e2e/.state-user.json',
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/chats/);

    await performCoreChatFlow(page, u1, u2);
  });
});
