import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { ensureLibraryLoaded, navigateTo, REAL_MUSIC_DIR } from './helpers';

test.describe('E. Metadata & Library Health Suite', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('runs audit, filters detected issues, and displays health metrics', async ({ page }) => {
    await navigateTo(page, 'Health & Cleanup');
    await expect(page.getByRole('heading', { level: 1, name: /Health & Cleanup/i })).toBeVisible();

    // Click "Run Audit" button
    const auditBtn = page.getByRole('button', { name: /run audit/i });
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();
    await page.waitForTimeout(500);

    // Verify summary metric cards
    await expect(page.getByText('Total Tracks')).toBeVisible();
    await expect(page.getByText('Library Issues')).toBeVisible();
    await expect(page.getByText('Tag Proposals')).toBeVisible();

    // Verify category filters on Detected Issues
    const allIssuesBtn = page.getByRole('button', { name: /all issues/i });
    await expect(allIssuesBtn).toBeVisible();

    const missingTagsBtn = page.getByRole('button', { name: /missing tags/i });
    await expect(missingTagsBtn).toBeVisible();
    await missingTagsBtn.click();
    await page.waitForTimeout(300);

    const namingBtn = page.getByRole('button', { name: /inconsistent naming/i });
    await expect(namingBtn).toBeVisible();
    await namingBtn.click();
    await page.waitForTimeout(300);
  });

  test('interacts with proposed tag diffs, supports inline editing and approval', async ({ page }) => {
    await navigateTo(page, 'Health & Cleanup');

    // Switch to Proposed Tag Diffs tab
    const proposalsTab = page.getByRole('button', { name: /proposed tag diffs/i });
    await expect(proposalsTab).toBeVisible();
    await proposalsTab.click();
    await page.waitForTimeout(300);

    // Table should render
    const table = page.locator('table[aria-label="Metadata Proposals Table"]');
    await expect(table).toBeVisible();

    const proposalRows = table.locator('tbody tr');
    const pCount = await proposalRows.count();

    if (pCount > 0) {
      // Find the first proposal row
      const firstRow = proposalRows.first();

      // Test inline edit button
      const editBtn = firstRow.getByRole('button', { name: /edit proposed value/i });
      if (await editBtn.isVisible()) {
        await editBtn.click();
        const inlineInput = firstRow.locator('input[type="text"]');
        await expect(inlineInput).toBeVisible();
        await inlineInput.fill('Verified Title');
        const saveBtn = firstRow.getByRole('button', { name: /save/i });
        await saveBtn.click();
        await page.waitForTimeout(300);

        // Verify updated value appears
        await expect(firstRow.getByText('Verified Title')).toBeVisible();
      }

      // Test Approve button
      const approveBtn = firstRow.getByRole('button', { name: /approve proposal/i });
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('inspects safe renaming template, filename previews, and preserves original files untouched', async ({ page }) => {
    // Record original file state in /home/axel/Music before test
    const initialFiles = fs.readdirSync(REAL_MUSIC_DIR);
    expect(initialFiles.length).toBe(74);

    await navigateTo(page, 'Health & Cleanup');

    // Switch to Naming Template & Rename tab
    const renamingTab = page.getByRole('button', { name: /naming template & rename/i });
    await expect(renamingTab).toBeVisible();
    await renamingTab.click();
    await page.waitForTimeout(300);

    // Verify renaming template input exists
    const templateInput = page.locator('input[value*="{artist}"]');
    await expect(templateInput).toBeVisible();

    // Verify preview table is displayed
    const previewTable = page.locator('table[aria-label="Rename Previews Table"]');
    await expect(previewTable).toBeVisible();
    const previewRows = previewTable.locator('tbody tr');
    const previewCount = await previewRows.count();
    expect(previewCount).toBeGreaterThan(0);

    // Check that original music directory files remain exactly untouched
    const afterFiles = fs.readdirSync(REAL_MUSIC_DIR);
    expect(afterFiles.length).toBe(74);
    expect(afterFiles).toEqual(initialFiles);
  });
});
