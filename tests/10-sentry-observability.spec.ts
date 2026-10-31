import { test, expect } from '@playwright/test';
import { ensureLibraryLoaded, navigateTo } from './helpers';

test.describe('Suite 10: Sentry Observability & Diagnostic Telemetry (Rule 6)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLibraryLoaded(page);
  });

  test('10.1 — verifies Sentry initialization, settings card, and telemetry toggle', async ({ page }) => {
    await navigateTo(page, 'settings');

    // Observability card exists
    const sentryHeading = page.locator('h2', { hasText: 'AI & App Observability (Sentry)' });
    await expect(sentryHeading).toBeVisible();

    // DSN input is populated with default DSN
    const dsnInput = page.locator('input#sentry-dsn');
    await expect(dsnInput).toBeVisible();
    const dsnVal = await dsnInput.inputValue();
    expect(dsnVal).toContain('o4512232556068864.ingest.us.sentry.io');

    // Disclosure notices are visible
    await expect(page.locator('text=Sanitized Telemetry Disclosure')).toBeVisible();
    await expect(page.locator('text=Strictly Excluded:')).toBeVisible();

    // Toggle Sentry switch off via its interactive switch label
    const toggleLabel = page.locator('label[for="sentry-toggle"]');
    await toggleLabel.click();

    // DSN and Break the world buttons become disabled
    await expect(dsnInput).toBeDisabled();
    const breakBtn = page.locator('button', { hasText: 'Break the world' });
    await expect(breakBtn).toBeDisabled();

    // Save disabled state
    const saveBtn = page.locator('button', { hasText: 'Save Sentry Settings' });
    await expect(saveBtn).toBeDisabled();

    // Re-enable Sentry
    await toggleLabel.click();
    await expect(dsnInput).toBeEnabled();
    await expect(breakBtn).toBeEnabled();
  });

  test('10.2 — triggers intentional "Break the world" error, captures envelope, and verifies privacy scrubbers', async ({ page }) => {
    const sentryRequests: { url: string; postData: string | null }[] = [];

    // Intercept Sentry envelope endpoint to verify actual network transmission and inspect privacy
    await page.route('**/*ingest*sentry*/**', async (route) => {
      sentryRequests.push({
        url: route.request().url(),
        postData: route.request().postData(),
      });
      // Allow it or mock 200 response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-sentry-event-id-12345' }),
      });
    });

    await navigateTo(page, 'settings');

    // Click "Break the world" button
    const breakBtn = page.locator('button', { hasText: 'Break the world' });
    await expect(breakBtn).toBeVisible();
    await breakBtn.click();

    // App shell handles it gracefully without white-screen crash, shows confirmation toast
    await expect(page.locator('text=Sentry Test Event Logged')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=This is your first error!')).toBeVisible();

    // Wait for Sentry envelope to be dispatched
    await page.waitForTimeout(1000);

    // Verify Sentry captured the event
    expect(sentryRequests.length).toBeGreaterThan(0);
    const combinedPayload = sentryRequests.map((r) => r.postData || '').join('\n');

    // Verify event content
    expect(combinedPayload).toContain('This is your first error!');

    // Verify Privacy Scrubbers: No local filesystem paths or binary audio data
    expect(combinedPayload).not.toContain('/home/axel/Music');
    expect(combinedPayload).not.toContain('C:\\');
    expect(combinedPayload).not.toContain('data:audio');
    expect(combinedPayload).not.toContain('audio/wav');
  });

  test('10.3 — handles missing DSN or offline telemetry safely without throwing unhandled exceptions', async ({ page }) => {
    await navigateTo(page, 'settings');

    const dsnInput = page.locator('input#sentry-dsn');
    await dsnInput.fill(''); // Clear DSN

    const saveBtn = page.locator('button', { hasText: 'Save Sentry Settings' });
    await saveBtn.click();

    // App functions completely normally without errors
    await navigateTo(page, 'Playlists');
    await expect(page.getByRole('heading', { level: 1, name: /Playlists & Smart Crates/i })).toBeVisible();

    await navigateTo(page, 'Health & Cleanup');
    await expect(page.getByRole('heading', { level: 1, name: /Health & Cleanup/i })).toBeVisible();
  });
});
