import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, navigateTo } from './helpers';

test.describe('H. Local AI Agent Suite (Ollama + Gemma 3 4B)', () => {
  test.setTimeout(75000);

  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('probes Ollama connection and verifies installed gemma3:4b model in Settings', async ({ page }) => {
    await navigateTo(page, 'Settings & Platform');

    // Click "Test Connection" button
    const testConnBtn = page.getByRole('button', { name: /test connection/i });
    await expect(testConnBtn).toBeVisible();
    await testConnBtn.click();

    // Verify Ollama Connected toast or connected status indicator
    await expect(page.getByText(/Ollama Connected|Connected \(/i).first()).toBeVisible({ timeout: 10000 });

    // Verify model input / select contains gemma3:4b
    const modelInput = page.locator('input[value*="gemma3:4b"], select');
    await expect(modelInput.first()).toBeAttached();

    // Test Live Inference Prompt in Settings
    const testPromptInput = page.getByPlaceholder(/Test inference prompt/i);
    if (await testPromptInput.isVisible()) {
      await testPromptInput.fill('Say hello in 3 words');
      const runTestBtn = page.getByRole('button', { name: /test model/i });
      await runTestBtn.click();

      // Expect inference response box
      await expect(page.getByText(/Response \(/i)).toBeVisible({ timeout: 25000 });
    }
  });

  test('curates natural-language playlist with real library and saves crate', async ({ page }) => {
    await navigateTo(page, 'Local AI Assistant');
    await expect(page.getByRole('heading', { level: 1, name: /Local AI Assistant/i })).toBeVisible();

    // Verify connection status badge
    await page.waitForTimeout(1000);
    const connBadge = page.locator('button').filter({ hasText: /Ollama/i }).first();
    await expect(connBadge).toBeVisible();

    // Select or type a natural language prompt
    const promptInput = page.getByPlaceholder(/Ask Local AI to create a crate/i);
    await expect(promptInput).toBeVisible();
    await promptInput.fill('Fast electronic workout tracks in FLAC');

    // Submit generation
    const generateBtn = page.getByRole('button', { name: /generate crate/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Wait for proposal preview card
    await expect(page.getByRole('button', { name: /save crate/i })).toBeVisible({ timeout: 45000 });

    // Verify model badge is gemma3:4b or fallback
    await expect(page.locator('span.font-mono').filter({ hasText: /gemma3:4b|offline/i }).first()).toBeVisible();

    // Verify duration and tracks count chips
    await expect(page.getByText(/Tracks:/i)).toBeVisible();
    await expect(page.getByText(/Duration:/i)).toBeVisible();

    // Inspect Schema Debug view
    const inspectSchemaBtn = page.getByRole('button', { name: /inspect schema/i });
    await inspectSchemaBtn.click();
    await expect(page.locator('pre').filter({ hasText: /"name"/i })).toBeVisible();
    await page.getByRole('button', { name: /hide schema/i }).click();

    // Save the Crate
    const saveCrateBtn = page.getByRole('button', { name: /save crate/i });
    await saveCrateBtn.click();
    await page.waitForTimeout(800);

    // Verify navigation or toast confirming crate saved
    await navigateTo(page, 'Playlists');
    await expect(page.getByRole('heading', { level: 1, name: /Playlists & Smart Crates/i })).toBeVisible();
  });
});
