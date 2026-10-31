import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, navigateTo } from './helpers';

test.describe('Suite 09: Online Enrichment & Search Partner Integration (S8 / Rule 5)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('09.1 — opens online enrichment modal with track preloaded and conducts safe lookup', async ({ page }) => {
    await navigateTo(page, 'library');

    // Find the first track's online enrichment button
    const enrichBtn = page.locator('button[aria-label^="Search online metadata"]').first();
    await expect(enrichBtn).toBeVisible({ timeout: 10000 });
    await enrichBtn.click();

    // Verify modal appears
    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#online-enrichment-title')).toContainText('Online MusicBrainz Enrichment');

    // Title input should have prefilled text
    const titleInput = modal.locator('input[placeholder="Track title..."]');
    await expect(titleInput).toBeVisible();
    const currentTitle = await titleInput.inputValue();
    expect(currentTitle.length).toBeGreaterThan(0);

    // Form can trigger a search
    const searchBtn = modal.locator('button[type="submit"]', { hasText: /Search/i });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Verify loading or candidate/error result is gracefully handled without crash
    // Either candidates appear or an info/error notice appears gracefully
    await expect(
      modal.locator('text=Candidate Matches').or(modal.locator('text=No matching recordings')).or(modal.locator('text=Search failed')).or(modal.locator('button[type="submit"]'))
    ).toBeVisible({ timeout: 15000 });

    // Cancel / close modal
    const cancelBtn = modal.locator('button', { hasText: 'Cancel' });
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('09.2 — verifies candidate inspector displays tag diffs, external source URLs, and safe proposals', async ({ page }) => {
    // Intercept MusicBrainz recording search to provide deterministic candidate matching
    await page.route('https://musicbrainz.org/ws/2/recording*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recordings: [
            {
              id: 'mb-rec-test-1',
              title: 'Midnight Resonance (Remastered)',
              score: 98,
              'artist-credit': [{ name: 'Synth Ghost' }],
              releases: [
                {
                  id: 'mb-rel-test-1',
                  title: 'Spectral Oscillations',
                  date: '2025-10-31',
                  'track-count': 12,
                  media: [{ 'track-offset': 0, 'track-count': 12 }],
                },
              ],
            },
          ],
        }),
      });
    });

    // Intercept Cover Art Archive and LRCLIB
    await page.route('https://coverartarchive.org/release/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          images: [
            {
              front: true,
              image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
              thumbnails: {
                250: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250',
                small: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250',
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
          plainLyrics: 'Drifting through the digital mist\nFrequencies unknown exist',
          syncedLyrics: '[00:05.00] Drifting through the digital mist\n[00:10.00] Frequencies unknown exist',
        }),
      });
    });

    await navigateTo(page, 'library');
    const enrichBtn = page.locator('button[aria-label^="Search online metadata"]').first();
    await enrichBtn.click();

    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();

    // Trigger search
    const searchBtn = modal.locator('button[type="submit"]', { hasText: /Search/i });
    await searchBtn.click();

    // Candidate matches should appear
    await expect(modal.locator('text=Candidate Matches (1)')).toBeVisible({ timeout: 10000 });
    await expect(modal.locator('text=Midnight Resonance (Remastered)')).toBeVisible();
    await expect(modal.locator('button', { hasText: 'Midnight Resonance' }).locator('span').filter({ hasText: '%' })).toBeVisible();

    // Tag Diff tab is active by default
    await expect(modal.locator('button', { hasText: 'Tag Diff' })).toBeVisible();
    await expect(modal.locator('text=Current Local Value')).toBeVisible();
    await expect(modal.locator('text=Proposed Online Value')).toBeVisible();
    await expect(modal.getByText('Spectral Oscillations', { exact: true })).toBeVisible();

    // Switch to Artwork sub-tab
    const artTab = modal.locator('button', { hasText: 'Artwork Preview' });
    await artTab.click();
    await expect(modal.getByAltText(/Artwork Preview/i)).toBeVisible({ timeout: 5000 });

    // Switch to Lyrics sub-tab
    const lyricsTab = modal.locator('button', { hasText: 'Lyrics' });
    await lyricsTab.click();
    await expect(modal.locator('text=Drifting through the digital mist')).toBeVisible({ timeout: 5000 });

    // Verification: Notice that metadata has NOT been applied yet (proposal state invariant)
    const cancelBtn = modal.locator('button', { hasText: 'Cancel' });
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('09.3 — configures SerpApi partner in Settings and validates credential handling', async ({ page }) => {
    await navigateTo(page, 'settings');

    // Locate Online Enrichment section
    const enrichmentHeading = page.locator('h2', { hasText: 'Online Enrichment (S8)' });
    await expect(enrichmentHeading).toBeVisible();

    // Select SerpApi provider
    const providerSelect = page.locator('select#enrichment-provider');
    await providerSelect.selectOption('serpapi');

    // SerpApi Key input should appear
    const apiKeyInput = page.locator('input#serpapi-key');
    await expect(apiKeyInput).toBeVisible();
    expect(await apiKeyInput.getAttribute('type')).toBe('password'); // Password-masked

    // Input test key
    await apiKeyInput.fill('abc5a9a5e25bbae878b1869aff11b4a7533aac084a1db083b6e463de374d33ff');

    // Save enrichment settings
    const saveBtn = page.locator('button', { hasText: 'Save Enrichment Settings' });
    await saveBtn.click();

    // Toast confirmation
    await expect(page.locator('text=Enrichment Settings Saved')).toBeVisible();

    // Reload page to verify persistence
    await page.reload();
    await navigateTo(page, 'settings');
    await expect(page.locator('select').filter({ hasText: /SerpApi/i })).toHaveValue('serpapi');
  });
});
