import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { ensureLibraryLoaded, navigateTo, REAL_MUSIC_DIR } from './helpers';

test.describe('F. Audio Conversion Suite', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('opens conversion modal, configures output options, and verifies non-destructive re-encoding', async ({ page }) => {
    // Record original files state before conversion
    const filesBefore = fs.readdirSync(REAL_MUSIC_DIR);
    expect(filesBefore.length).toBe(74);

    await navigateTo(page, 'Library');

    // Click "Convert" on the first track row
    const rowConvertBtn = page.locator('tbody tr button[aria-label*="Convert"]').first();
    await expect(rowConvertBtn).toBeVisible();
    await rowConvertBtn.click();

    // Conversion modal opens
    const modal = page.getByRole('dialog', { name: /non-destructive audio conversion/i });
    await expect(modal).toBeVisible();

    // Verify format dropdown options
    const formatSelect = modal.locator('select#target-format-select');
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption('wav');

    // Verify sample rate options
    const sampleRateSelect = modal.locator('select#sample-rate-select');
    await expect(sampleRateSelect).toBeVisible();
    await sampleRateSelect.selectOption('44100');

    // Verify channels options
    const channelsSelect = modal.locator('select#channels-select');
    await expect(channelsSelect).toBeVisible();
    await channelsSelect.selectOption('2');

    // Change naming suffix to _pcm
    const suffixInput = modal.locator('input#suffix-input');
    await expect(suffixInput).toBeVisible();
    await suffixInput.fill('_pcm');

    // Verify filename example preview updates
    await expect(modal.getByText(/_pcm\.wav/i)).toBeVisible();

    // Start Conversion
    const startBtn = modal.getByRole('button', { name: /start conversion/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Wait for conversion completion
    await expect(page.getByText(/Conversion Complete/i)).toBeVisible({ timeout: 20000 });

    // Verify conversion result outputs card is rendered
    await expect(modal.getByText(/Converted Outputs/i)).toBeVisible();

    // Close modal
    const closeBtn = modal.getByRole('button', { name: /close/i }).last();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    // Verify original files in /home/axel/Music are 100% preserved
    const filesAfter = fs.readdirSync(REAL_MUSIC_DIR);
    expect(filesAfter.length).toBe(74);
    expect(filesAfter).toEqual(filesBefore);
  });
});
