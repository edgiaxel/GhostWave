import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, createCorruptAudioFile, cleanupTempDir } from './helpers';

test.describe('B. Music Library Suite (Real 74-Track Library)', () => {
  test.afterAll(() => {
    cleanupTempDir();
  });

  test('imports real music library and displays extracted metadata', async ({ page }) => {
    const trackCount = await ensureLibraryLoaded(page);
    expect(trackCount).toBeGreaterThanOrEqual(70);

    // Verify metadata columns exist in the table header
    const headers = page.locator('thead th');
    await expect(headers.getByText(/Title/i)).toBeVisible();
    await expect(headers.getByText(/Album/i)).toBeVisible();
    await expect(headers.getByText(/Format/i)).toBeVisible();

    // Verify first track row contains valid title and format badge
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    const formatBadge = firstRow.locator('span.font-mono');
    await expect(formatBadge).toBeVisible();
    const formatText = await formatBadge.textContent();
    expect(['MP3', 'FLAC', 'WAV', 'OGG', 'M4A', 'AAC']).toContain(formatText?.trim().toUpperCase());
  });

  test('searches tracks by title, artist, and handles empty search results', async ({ page }) => {
    await ensureLibraryLoaded(page);

    const searchInput = page.getByRole('searchbox', { name: /Search local tracks/i });
    await expect(searchInput).toBeVisible();

    // 1. Positive search (e.g., "Imagine Dragons" or "Flo Rida")
    await searchInput.fill('Flo Rida');
    await page.waitForTimeout(400);

    let rows = page.locator('tbody tr');
    let count = await rows.count();
    expect(count).toBeGreaterThan(0);
    const rowText = await rows.first().textContent();
    expect(rowText?.toLowerCase()).toContain('flo rida');

    // 2. Clear search
    const clearBtn = page.getByRole('button', { name: /clear search input/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    } else {
      await searchInput.fill('');
    }
    await page.waitForTimeout(300);
    expect(await page.locator('tbody tr').count()).toBeGreaterThanOrEqual(70);

    // 3. Search query that matches nothing
    await searchInput.fill('ZZZ_NONEXISTENT_GHOST_TRACK_QUERY_999');
    await page.waitForTimeout(400);

    // Should display empty state
    await expect(page.getByText(/No tracks found|No spectral tracks match/i)).toBeVisible();
    expect(await page.locator('tbody tr').count()).toBe(0);

    // Clear search again
    await searchInput.fill('');
    await page.waitForTimeout(300);
    expect(await page.locator('tbody tr').count()).toBeGreaterThanOrEqual(70);
  });

  test('filters tracks using format and status filter pills', async ({ page }) => {
    await ensureLibraryLoaded(page);

    // Test MP3 filter pill
    const mp3Pill = page.getByRole('button', { name: 'MP3', exact: true });
    await expect(mp3Pill).toBeVisible();
    await mp3Pill.click();
    await page.waitForTimeout(300);

    let rows = page.locator('tbody tr');
    let mp3Count = await rows.count();
    expect(mp3Count).toBeGreaterThanOrEqual(60);

    // Test All Tracks filter pill
    const allPill = page.getByRole('button', { name: /All Tracks/i });
    await expect(allPill).toBeVisible();
    await allPill.click();
    await page.waitForTimeout(300);

    let allCount = await page.locator('tbody tr').count();
    expect(allCount).toBeGreaterThanOrEqual(70);
  });

  test('toggles sorting fields and sort directions', async ({ page }) => {
    await ensureLibraryLoaded(page);

    // Select "Duration" sort field
    const sortSelect = page.getByRole('combobox', { name: /sort library by field/i });
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption({ label: 'Duration' });
    await page.waitForTimeout(300);

    // Click direction toggle button
    const directionBtn = page.getByRole('button', { name: /toggle sort direction/i });
    await expect(directionBtn).toBeVisible();
    await directionBtn.click();
    await page.waitForTimeout(300);

    // Toggle back to Title
    await sortSelect.selectOption({ label: 'Title' });
    await page.waitForTimeout(300);
  });

  test('switches between Table view and Grid album card view', async ({ page }) => {
    await ensureLibraryLoaded(page);

    // Click Grid view button
    const gridBtn = page.getByRole('button', { name: /grid view/i });
    await expect(gridBtn).toBeVisible();
    await gridBtn.click();
    await page.waitForTimeout(300);

    // Grid cards should be rendered
    const gridCards = page.locator('div.grid > div');
    const cardCount = await gridCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Switch back to Table view
    const tableBtn = page.getByRole('button', { name: /table view/i });
    await expect(tableBtn).toBeVisible();
    await tableBtn.click();
    await page.waitForTimeout(300);

    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('gracefully handles unreadable/corrupted audio files without crash', async ({ page }) => {
    await ensureLibraryLoaded(page);

    // Create a temporary corrupted audio file in /tmp/ghostwave-test-audio
    const corruptFile = createCorruptAudioFile('corrupted_track_test.mp3');

    // Open add files modal
    const addFilesBtn = page.getByRole('button', { name: /add files/i }).first();
    await addFilesBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Input the corrupted file
    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles([corruptFile]);

    // Should complete scan or notify without application crash
    await page.waitForTimeout(2000);

    // App header, navigation, and library must still be intact and responsive
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});
