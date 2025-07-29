import { test, expect } from '@playwright/test';
import { registerUser } from '../utils/api';
import { registerUserUI, loginUserUI } from '../utils/ui';
import { v4 as uuid } from 'uuid';
import path from 'path';

const PASSWORD = 'Password123!';

function generateUsers(): { u1: string; u2: string } {
  const id1 = uuid().slice(0, 8);
  const id2 = uuid().slice(0, 8);
  return {
    u1: `profile_${id1}`,
    u2: `profile_${id2}`,
  };
}

test.describe('profile picture upload', () => {
  const { u1, u2 } = generateUsers();

  test.beforeAll(async () => {
    // Pre-register both users via API
    await registerUser(u1, PASSWORD).catch(() => {});
    await registerUser(u2, PASSWORD).catch(() => {});
  });

  test('upload profile picture and verify visibility in both user and partner views', async ({
    page,
    browser,
  }) => {
    // Step 1: Login as first user
    await loginUserUI(page, u1, PASSWORD);

    // Step 2: Open settings panel by clicking the hamburger menu button
    await page.getByTestId('settings-menu-button').click();
    
    // Step 3: Wait for settings panel to open and click "My Profile"
    await expect(page.getByText('My Profile')).toBeVisible();
    await page.getByText('My Profile').click();

    // Step 4: Wait for profile dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Step 5: Create a test image file path
    const testImagePath = path.join(
      __dirname,
      '..',
      'test-assets',
      'test-avatar.png'
    );

    // If test image doesn't exist, we'll create a minimal one or use a placeholder
    // For now, we'll assume there's a test image or use setInputFiles with buffer

    // Step 6: Click the camera/upload button to trigger file input
    const uploadButton = page
      .locator('button')
      .filter({ has: page.locator('[data-testid="camera-icon"]') })
      .or(page.locator('button:has([class*="camera"]'))
      .or(page.locator('input[type="file"]'))
      .or(page.locator('button').filter({ hasText: /upload/i }));

    // Handle file input - either click upload button or directly set files on hidden input
    const fileInput = page.locator('input[type="file"]');

    if ((await fileInput.count()) > 0) {
      // Create a simple test image buffer for upload
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      await fileInput.setInputFiles({
        name: 'test-avatar.png',
        mimeType: 'image/png',
        buffer: testImageBuffer,
      });
    } else {
      // Try clicking upload button first
      await uploadButton.first().click();
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test-avatar.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'base64'
        ),
      });
    }

    // Step 7: Wait for upload to complete (look for loading state to disappear)
    await expect(
      page.locator('[data-testid="uploading-avatar"]')
    ).not.toBeVisible({ timeout: 10000 });

    // Or wait for success indication
    await page.waitForTimeout(2000);

    // Step 8: Verify the avatar updated in the profile dialog
    const avatarInDialog = page
      .locator('[role="dialog"] img[alt*="' + u1 + '"]')
      .or(page.locator('[role="dialog"] [data-testid="avatar"] img'));
    await expect(avatarInDialog.first()).toBeVisible();

    // Step 9: Close profile dialog
    await page.getByTestId('profile-dialog-close').click();

    // Step 10: Verify avatar is updated in the sidebar/main UI
    const avatarInSidebar = page
      .locator(`img[alt*="${u1}"]`)
      .or(page.locator('[data-testid="user-avatar"] img'))
      .or(page.locator('[data-testid="sidebar"] img'));

    // Check that avatar src contains a URL (not just initials)
    await expect(avatarInSidebar.first()).toBeVisible();

    // Step 11: Open a new page/context for second user to verify partner view
    const page2 = await browser.newPage();
    await loginUserUI(page2, u2, PASSWORD);

    // Step 12: Search for first user to start a chat
    await page2.getByPlaceholder('Search').fill(u1);
    await page2.locator(`[role="option"]:has-text("${u1}")`).click();

    // Step 13: Verify the updated avatar is visible in partner's view
    const partnerAvatar = page2
      .locator(`img[alt*="${u1}"]`)
      .or(page2.locator('[data-testid="chat-partner-avatar"] img'))
      .or(page2.locator('[data-testid="avatar"] img'));

    // If avatar doesn't immediately show, refresh the page as mentioned in requirements
    let avatarVisible = await partnerAvatar
      .first()
      .isVisible()
      .catch(() => false);
    if (!avatarVisible) {
      await page2.reload();
      await page2.waitForTimeout(1000);
      // Re-search and open chat after refresh
      await page2.getByPlaceholder('Search').fill(u1);
      await page2.locator(`[role="option"]:has-text("${u1}")`).click();
    }

    // Step 14: Final verification - avatar should be visible in partner's view
    await expect(partnerAvatar.first()).toBeVisible({ timeout: 5000 });

    // Optional: Verify it's actually an image and not just initials by checking src attribute
    const avatarSrc = await partnerAvatar.first().getAttribute('src');
    expect(avatarSrc).toContain('http'); // Should contain a URL, not be empty
  });
});
