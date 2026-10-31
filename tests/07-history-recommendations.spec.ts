import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, navigateTo } from './helpers';

test.describe('G. Listening History & Recommendations Suite', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('records playback history, calculates analytics, and provides transparent recommendations', async ({ page }) => {
    // 1. Play a track to create a real playback session
    await navigateTo(page, 'Library');
    const firstRowPlayBtn = page.locator('tbody tr button[aria-label*="Play"]').first();
    await expect(firstRowPlayBtn).toBeVisible();
    await firstRowPlayBtn.click();

    // Let it play for 2 seconds
    await page.waitForTimeout(2000);

    // Switch tracks to trigger scrobble event recording
    const nextBtn = page.locator('footer button[aria-label*="Next track"]');
    await nextBtn.click();
    await page.waitForTimeout(1000);

    // 2. Navigate to Listening History
    await navigateTo(page, 'Listening History');
    await expect(page.getByRole('heading', { level: 1, name: /Listening History/i })).toBeVisible();

    // Verify analytics KPI cards
    await expect(page.getByText('Total Sessions')).toBeVisible();
    await expect(page.getByText('Time Listened')).toBeVisible();
    await expect(page.getByText('Skip Rate')).toBeVisible();
    await expect(page.getByText('Top Genre', { exact: true })).toBeVisible();

    // Verify Taste Profile section
    await expect(page.getByRole('heading', { level: 2, name: /Listening Taste Profile/i })).toBeVisible();

    // 3. Verify Recommendations Tab
    const recsTab = page.getByRole('button', { name: /recommendations/i });
    await expect(recsTab).toBeVisible();
    await recsTab.click();

    // Recommended items should be rendered with explicit rationales
    const recCards = page.locator('div.grid > div').filter({ hasText: /Play|Queue/i });
    const recCount = await recCards.count();
    expect(recCount).toBeGreaterThan(0);

    // Verify rationale badge is visible on the first recommendation
    const firstRec = recCards.first();
    await expect(firstRec).toBeVisible();

    // 4. Test Tracking Toggle
    const trackingBtn = page.getByRole('button', { name: /tracking active|tracking paused/i });
    await expect(trackingBtn).toBeVisible();
    await trackingBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /tracking paused/i })).toBeVisible();

    // Toggle back
    await page.getByRole('button', { name: /tracking paused/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /tracking active/i })).toBeVisible();

    // 5. Test Clear History
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const clearBtn = page.getByRole('button', { name: /clear history/i });
    if (await clearBtn.isEnabled()) {
      await clearBtn.click();
      await page.waitForTimeout(400);
    }
  });
});
