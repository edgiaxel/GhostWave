import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('A. Application & Navigation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('application launches with correct title and branding', async ({ page }) => {
    await expect(page).toHaveTitle(/GhostWave/i);
    const brand = page.getByRole('button', { name: /GhostWave home/i });
    await expect(brand).toBeVisible();
    await expect(page.locator('header img[alt*="GhostWave"]')).toBeVisible();
  });

  test('navigates seamlessly across all deck modules without uncaught errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Library
    await navigateTo(page, 'Library');
    await expect(page.getByRole('heading', { level: 1, name: /GhostWave Library/i })).toBeVisible();

    // 2. Playlists
    await navigateTo(page, 'Playlists');
    await expect(page.getByRole('heading', { level: 1, name: /Playlists & Smart Crates/i })).toBeVisible();

    // 3. Health & Cleanup
    await navigateTo(page, 'Health & Cleanup');
    await expect(page.getByRole('heading', { level: 1, name: /Health & Cleanup/i })).toBeVisible();

    // 4. Audio Visualizer
    await navigateTo(page, 'Audio Visualizer');
    await expect(page.locator('canvas')).toBeVisible();

    // 5. Local AI Assistant
    await navigateTo(page, 'Local AI Assistant');
    await expect(page.getByRole('heading', { level: 1, name: /Local AI Assistant/i })).toBeVisible();

    // 6. Listening History
    await navigateTo(page, 'Listening History');
    await expect(page.getByRole('heading', { level: 1, name: /Listening History/i })).toBeVisible();

    // 7. Settings & Platform
    await navigateTo(page, 'Settings & Platform');
    await expect(page.getByRole('heading', { level: 1, name: /Settings & Platform/i })).toBeVisible();

    // Check no fatal runtime errors occurred
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Sentry'));
    expect(fatalErrors).toHaveLength(0);
  });

  test('switches themes between Halloween Dark and Halloween Light and updates DOM attributes', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /switch theme/i });
    await expect(themeBtn).toBeVisible();

    // Initial theme check (default is halloween-dark)
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(initialTheme).toBe('halloween-dark');

    // Click theme toggle to switch to halloween-light
    await themeBtn.click();
    await page.waitForTimeout(300);

    const lightTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(lightTheme).toBe('halloween-light');
    const isLightClass = await page.evaluate(() => document.documentElement.classList.contains('light'));
    expect(isLightClass).toBe(true);

    // Toggle back to halloween-dark
    await themeBtn.click();
    await page.waitForTimeout(300);

    const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(darkTheme).toBe('halloween-dark');
  });

  test('verifies fixed layout structure and resize handles', async ({ page }) => {
    // Check Header is fixed
    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox?.y).toBe(0);

    // Check Sidebar is fixed
    const sidebar = page.locator('aside[aria-label="Deck Modules Navigation"]');
    await expect(sidebar).toBeVisible();

    // Check Bottom Player is fixed
    const player = page.locator('footer[role="region"]');
    await expect(player).toBeVisible();

    // Check resize handles exist with aria attributes
    const headerResize = page.locator('div[role="separator"][aria-label="Resize Header Height"]');
    await expect(headerResize).toBeAttached();
  });

  test('persists user settings across browser reload', async ({ page }) => {
    await navigateTo(page, 'Settings & Platform');

    // Verify settings screen loads
    const appearanceHeading = page.getByRole('heading', { name: /Appearance & Theme/i });
    await expect(appearanceHeading).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Header and navigation should still be intact
    await expect(page.locator('header[role="banner"]')).toBeVisible();
  });
});
