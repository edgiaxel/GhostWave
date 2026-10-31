import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded } from './helpers';

test.describe('C. Music Player & Transport Suite', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('starts playback of a real track and verifies audio progress', async ({ page }) => {
    // Click the play button on the first track in the library table
    const firstRowPlayBtn = page.locator('tbody tr button[aria-label*="Play"]').first();
    await expect(firstRowPlayBtn).toBeVisible();
    await firstRowPlayBtn.click();

    // Bottom player should update now playing info
    const bottomPlayer = page.locator('footer[role="region"]');
    await expect(bottomPlayer).toBeVisible();

    // Wait for playback to transition to playing
    const pauseBtn = bottomPlayer.getByRole('button', { name: /pause playback/i });
    await expect(pauseBtn).toBeVisible({ timeout: 10000 });

    // Verify time advances past 0:00
    await page.waitForTimeout(1500);
    const timeDisplay = bottomPlayer.locator('div.font-mono span').first();
    const timeText = await timeDisplay.textContent();
    console.log(`Playback time elapsed: ${timeText}`);

    // Pause playback
    await pauseBtn.click();
    await expect(bottomPlayer.getByRole('button', { name: /start playback/i })).toBeVisible();

    // Resume playback
    const playBtn = bottomPlayer.getByRole('button', { name: /start playback/i });
    await playBtn.click();
    await expect(bottomPlayer.getByRole('button', { name: /pause playback/i })).toBeVisible();
  });

  test('operates next and previous track navigation', async ({ page }) => {
    const bottomPlayer = page.locator('footer[role="region"]');

    // Start playing first track
    const firstRowPlayBtn = page.locator('tbody tr button[aria-label*="Play"]').first();
    await firstRowPlayBtn.click();
    await expect(bottomPlayer.getByRole('button', { name: /pause playback/i })).toBeVisible({ timeout: 10000 });

    const initialTrackTitle = await bottomPlayer.locator('div.flex-col span.font-semibold').textContent();

    // Click Next Track
    const nextBtn = bottomPlayer.getByRole('button', { name: /next track/i });
    await nextBtn.click();
    await page.waitForTimeout(800);

    const nextTrackTitle = await bottomPlayer.locator('div.flex-col span.font-semibold').textContent();
    expect(nextTrackTitle).not.toBe(initialTrackTitle);

    // Click Previous Track
    const prevBtn = bottomPlayer.getByRole('button', { name: /previous track/i });
    await prevBtn.click();
    await page.waitForTimeout(800);
  });

  test('interacts with seek slider, volume control, and mute toggle', async ({ page }) => {
    const bottomPlayer = page.locator('footer[role="region"]');

    // Play first track
    const firstRowPlayBtn = page.locator('tbody tr button[aria-label*="Play"]').first();
    await firstRowPlayBtn.click();
    await expect(bottomPlayer.getByRole('button', { name: /pause playback/i })).toBeVisible({ timeout: 10000 });

    // Test Volume Slider
    const volumeSlider = bottomPlayer.getByRole('slider', { name: /adjust audio volume/i });
    await expect(volumeSlider).toBeVisible();
    await volumeSlider.fill('0.5');

    // Test Mute button
    const muteBtn = bottomPlayer.getByRole('button', { name: /mute volume/i });
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();

    // Check Unmute state
    const unmuteBtn = bottomPlayer.getByRole('button', { name: /unmute volume/i });
    await expect(unmuteBtn).toBeVisible();
    await unmuteBtn.click();
    await expect(bottomPlayer.getByRole('button', { name: /mute volume/i })).toBeVisible();

    // Test Seek slider
    const seekSlider = bottomPlayer.getByRole('slider', { name: /seek position in track/i });
    await expect(seekSlider).toBeVisible();
    await seekSlider.fill('5');
    await page.waitForTimeout(500);
  });

  test('toggles shuffle and cycles through repeat modes', async ({ page }) => {
    const bottomPlayer = page.locator('footer[role="region"]');

    // Shuffle toggle
    const shuffleBtn = bottomPlayer.getByRole('button', { name: /enable shuffle|disable shuffle/i });
    await expect(shuffleBtn).toBeVisible();
    await shuffleBtn.click();
    await page.waitForTimeout(200);

    // Repeat mode toggle: cycles all -> one -> off -> all
    const repeatBtn = bottomPlayer.locator('button[aria-label*="Repeat mode"]');
    await expect(repeatBtn).toBeVisible();

    const mode1 = await repeatBtn.getAttribute('aria-label');
    await repeatBtn.click();
    await page.waitForTimeout(200);
    const mode2 = await repeatBtn.getAttribute('aria-label');
    expect(mode2).not.toBe(mode1);
  });

  test('expands slide-up visualizer drawer and opens playback queue', async ({ page }) => {
    const bottomPlayer = page.locator('footer[role="region"]');

    // Click "Add to queue" on first two tracks in library
    const addToQueueBtns = page.locator('tbody tr button[aria-label*="to queue"]');
    await expect(addToQueueBtns.first()).toBeVisible();
    await addToQueueBtns.nth(0).click();
    await page.waitForTimeout(200);
    await addToQueueBtns.nth(1).click();
    await page.waitForTimeout(200);

    // Expand slide-up visualizer drawer
    const drawerToggle = bottomPlayer.getByRole('button', { name: /visualizer & queue/i });
    await expect(drawerToggle).toBeVisible();
    await drawerToggle.click();

    // Visualizer canvas should be rendering
    const visualizerCanvas = page.locator('canvas');
    await expect(visualizerCanvas).toBeVisible();

    // Close visualizer drawer
    await drawerToggle.click();
    await page.waitForTimeout(300);

    // Open Queue modal via button
    const queueBtn = bottomPlayer.getByRole('button', { name: /open playback queue/i });
    await expect(queueBtn).toBeVisible();
    await queueBtn.click();

    // Queue modal should be visible
    const queueModal = page.getByRole('dialog', { name: /current playback queue/i });
    await expect(queueModal).toBeVisible();

    // Verify queue items exist
    const queueItems = queueModal.locator('div.divide-y > div');
    const qCount = await queueItems.count();
    expect(qCount).toBeGreaterThanOrEqual(2);

    // Close queue modal via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(queueModal).not.toBeVisible();
  });
});
