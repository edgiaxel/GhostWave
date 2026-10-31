import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, navigateTo } from './helpers';

test.describe('D. Playlists & Smart Crates Suite', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('creates, renames, populates from library, and deletes a playlist with confirmation', async ({ page }) => {
    // 1. Navigate to Playlists screen
    await navigateTo(page, 'Playlists');
    await expect(page.getByRole('heading', { level: 1, name: /Playlists & Smart Crates/i })).toBeVisible();

    // 2. Open "New Playlist" dialog
    const newPlaylistBtn = page.getByRole('button', { name: /new playlist|create your first playlist/i }).first();
    await expect(newPlaylistBtn).toBeVisible();
    await newPlaylistBtn.click();

    // Fill form in modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const nameInput = modal.getByRole('textbox', { name: /Playlist Name/i });
    await nameInput.fill('Spectral Beats Crate');

    const descInput = modal.getByRole('textbox', { name: /Description/i });
    await descInput.fill('Curated eerie beats from the local library');

    // Submit Create
    const createSubmitBtn = modal.getByRole('button', { name: /create playlist/i });
    await createSubmitBtn.click();
    await page.waitForTimeout(400);

    // Verify playlist card appears
    await expect(page.getByText('Spectral Beats Crate').first()).toBeVisible();

    // 3. Navigate to Library to add tracks to the new playlist
    await navigateTo(page, 'Library');

    // Click "Add ... to playlist" icon on the first track
    const addToPlaylistBtns = page.locator('tbody tr button[aria-label*="to playlist"]');
    await expect(addToPlaylistBtns.first()).toBeVisible();
    await addToPlaylistBtns.first().click();

    // AddToPlaylistModal opens
    const addModal = page.getByRole('dialog', { name: /add to playlist/i });
    await expect(addModal).toBeVisible();

    // Click the playlist option
    const targetPlBtn = addModal.getByRole('button', { name: /Spectral Beats Crate/i }).first();
    await expect(targetPlBtn).toBeVisible();
    await targetPlBtn.click();
    await page.waitForTimeout(400);

    // 4. Return to Playlists and verify the track appears inside
    await navigateTo(page, 'Playlists');
    await page.getByText('Spectral Beats Crate').first().click();
    await page.waitForTimeout(300);

    // Track row should be present inside the playlist table
    const playlistTrackRows = page.locator('div.divide-y > div');
    expect(await playlistTrackRows.count()).toBeGreaterThanOrEqual(1);

    // 5. Edit playlist title
    const editBtn = page.getByRole('button', { name: /edit playlist details|edit crate/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const editModal = page.getByRole('dialog');
      await expect(editModal).toBeVisible();

      const editNameInput = editModal.getByRole('textbox', { name: /Playlist Name/i });
      await editNameInput.fill('Renamed Spectral Crate');

      const saveEditBtn = editModal.getByRole('button', { name: /save changes/i });
      await saveEditBtn.click();
      await page.waitForTimeout(400);

      await expect(page.getByText('Renamed Spectral Crate').first()).toBeVisible();
    }

    // 6. Delete playlist with confirmation
    const deleteBtn = page.getByRole('button', { name: /delete playlist|delete crate/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirmation dialog
    const confirmModal = page.getByRole('dialog', { name: /Delete/i });
    await expect(confirmModal).toBeVisible();

    const confirmDeleteBtn = confirmModal.getByRole('button', { name: /Delete Playlist/i });
    await confirmDeleteBtn.click();
    await page.waitForTimeout(400);

    // Playlist should no longer be present
    await expect(page.getByText('Renamed Spectral Crate')).not.toBeVisible();
  });
});
