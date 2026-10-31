import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, navigateTo } from './helpers';

test.use({
  viewport: { width: 1920, height: 1080 },
  video: {
    mode: 'on',
    size: { width: 1920, height: 1080 },
  },
});

test.describe('GhostWave Product Demo Video Recording', () => {

  test('records full end-to-end product demonstration', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes timeout for high-res recording + AI generation

    // Mock external online providers for deterministic, crisp responses in demo
    await page.route('https://musicbrainz.org/ws/2/recording*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recordings: [
            {
              id: 'mb-rec-ghost-1',
              title: 'Matsuri (Official Master)',
              score: 99,
              'artist-credit': [{ name: 'Fujii Kaze' }],
              releases: [
                {
                  id: 'mb-rel-ghost-1',
                  title: 'LASA (Love All Serve All)',
                  date: '2022-03-23',
                  'track-count': 11,
                  media: [{ 'track-offset': 0, 'track-count': 11 }],
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route('https://coverartarchive.org/release/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          images: [
            {
              front: true,
              image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
              thumbnails: {
                250: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=250',
                small: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=250',
              },
            },
          ],
        }),
      });
    });

    await page.route('https://lrclib.net/api/get*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plainLyrics: "Matsuri da matsuri da\nHare no hi mo ame no hi mo\nSubete ga ai no matsuri da",
          syncedLyrics: "[00:10.00] Matsuri da matsuri da\n[00:15.00] Hare no hi mo ame no hi mo\n[00:20.00] Subete ga ai no matsuri da",
        }),
      });
    });

    // ─────────────────────────────────────────────────────────
    // SCENE 1: THE MUSIC LIBRARY (74 Tracks Imported)
    // ─────────────────────────────────────────────────────────
    await ensureLibraryLoaded(page);
    await navigateTo(page, 'Library');
    await page.waitForTimeout(2000);

    // Filter by search
    const searchInput = page.getByRole('searchbox', { name: /Search local tracks/i });
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.pressSequentially('Matsuri', { delay: 100 });
    await page.waitForTimeout(1500);
    await searchInput.clear();
    await page.waitForTimeout(1000);

    // Switch to Grid View
    const gridBtn = page.getByRole('button', { name: /grid view/i });
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await page.waitForTimeout(2000);
      const tableBtn = page.getByRole('button', { name: /table view/i });
      await tableBtn.click();
      await page.waitForTimeout(1000);
    }

    // ─────────────────────────────────────────────────────────
    // SCENE 2: THE MUSIC PLAYER & SPECTRAL VISUALIZER
    // ─────────────────────────────────────────────────────────
    // Start playback of the first track
    const playFirst = page.getByRole('button', { name: /play/i }).first();
    await playFirst.click();
    await page.waitForTimeout(3000);

    // Slide up visualizer drawer
    const visualizerToggle = page.locator('button[aria-label="Toggle full visualizer drawer"]').first();
    if (await visualizerToggle.isVisible()) {
      await visualizerToggle.click();
      await page.waitForTimeout(4000); // Admire the reactive waveforms
      
      // Close visualizer drawer
      const closeVis = page.locator('button[aria-label="Collapse visualizer drawer"]');
      if (await closeVis.isVisible()) {
        await closeVis.click();
      }
      await page.waitForTimeout(1000);
    }

    // Open and inspect queue
    const queueToggle = page.getByRole('button', { name: /open queue/i });
    if (await queueToggle.isVisible()) {
      await queueToggle.click();
      await page.waitForTimeout(2500);
      const closeQueue = page.getByRole('button', { name: /close queue/i });
      if (await closeQueue.isVisible()) {
        await closeQueue.click();
      }
      await page.waitForTimeout(1000);
    }

    // Pause playback so CPU/GPU is dedicated to Gemma 3 inference
    const pauseBtn = page.getByRole('button', { name: /pause/i });
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await page.waitForTimeout(500);
    }

    // ─────────────────────────────────────────────────────────
    // SCENE 3: THE LOCAL AI PLAYLIST AGENT (GEMMA 3)
    // ─────────────────────────────────────────────────────────
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
    await page.waitForTimeout(500);

    // Submit generation
    const generateBtn = page.getByRole('button', { name: /generate crate/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Wait for proposal preview card
    const saveCrateBtn = page.getByRole('button', { name: /save crate/i });
    await expect(saveCrateBtn).toBeVisible({ timeout: 120000 });
    await page.waitForTimeout(3000);

    // Save crate to user library and navigate to Playlists
    await saveCrateBtn.click();
    await expect(page.getByRole('heading', { level: 1, name: /Playlists & Smart Crates/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // ─────────────────────────────────────────────────────────
    // SCENE 4: LIBRARY INTELLIGENCE & ONLINE ENRICHMENT
    // ─────────────────────────────────────────────────────────
    await navigateTo(page, 'Health & Cleanup');
    await page.waitForTimeout(2000);

    // Run audit
    const rescanBtn = page.getByRole('button', { name: /run health audit/i });
    if (await rescanBtn.isVisible()) {
      await rescanBtn.click();
      await page.waitForTimeout(2000);
    }

    // Inspect tag proposals
    const missingTab = page.getByRole('button', { name: /missing tags/i });
    if (await missingTab.isVisible()) {
      await missingTab.click();
      await page.waitForTimeout(2000);
    }

    // Open Online Enrichment modal for a track
    await navigateTo(page, 'Library');
    const enrichBtn = page.locator('button[aria-label^="Search online metadata"]').first();
    if (await enrichBtn.isVisible()) {
      await enrichBtn.click();
      const modal = page.locator('div[role="dialog"][aria-modal="true"]');
      await expect(modal).toBeVisible();

      // Trigger search
      const searchBtn = modal.locator('button[type="submit"]', { hasText: /Search/i });
      await searchBtn.click();
      await page.waitForTimeout(2000);

      // Check Artwork and Lyrics tabs
      const artTab = modal.locator('button', { hasText: 'Artwork Preview' });
      if (await artTab.isVisible()) {
        await artTab.click();
        await page.waitForTimeout(1500);
      }
      const lyricsTab = modal.locator('button', { hasText: 'Lyrics' });
      if (await lyricsTab.isVisible()) {
        await lyricsTab.click();
        await page.waitForTimeout(1500);
      }

      const cancelBtn = modal.locator('button', { hasText: 'Cancel' });
      await cancelBtn.click();
      await page.waitForTimeout(1000);
    }

    // ─────────────────────────────────────────────────────────
    // SCENE 5: LISTENING HISTORY & TRANSPARENT RECOMMENDATIONS
    // ─────────────────────────────────────────────────────────
    await navigateTo(page, 'Listening History');
    await page.waitForTimeout(2000);

    const recsTab = page.getByRole('button', { name: /recommendations/i });
    if (await recsTab.isVisible()) {
      await recsTab.click();
      await page.waitForTimeout(2500);
    }

    // ─────────────────────────────────────────────────────────
    // SCENE 6: SETTINGS, SENTRY OBSERVABILITY & THEME
    // ─────────────────────────────────────────────────────────
    await navigateTo(page, 'Settings & Platform');
    await page.waitForTimeout(2000);

    // Switch theme to Halloween Light and back to Dark
    const themeBtn = page.getByRole('button', { name: /switch theme/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(1500);
      await themeBtn.click();
      await page.waitForTimeout(1500);
    }

    // Final hold on Library screen
    await navigateTo(page, 'Library');
    await page.waitForTimeout(2000);
  });
});
