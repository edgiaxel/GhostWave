import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const REAL_MUSIC_DIR = '/home/axel/Music';
export const TEMP_TEST_DIR = '/tmp/ghostwave-test-audio';

/**
 * Ensures temporary test directory exists.
 */
export function ensureTempDir(): string {
  if (!fs.existsSync(TEMP_TEST_DIR)) {
    fs.mkdirSync(TEMP_TEST_DIR, { recursive: true });
  }
  return TEMP_TEST_DIR;
}

/**
 * Cleans up temporary test files.
 */
export function cleanupTempDir(): void {
  if (fs.existsSync(TEMP_TEST_DIR)) {
    fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
  }
}

/**
 * Creates a valid 16-bit PCM WAV audio file with standard 44-byte RIFF header.
 */
export function createTestWavFile(filename: string, durationSeconds: number = 2): string {
  ensureTempDir();
  const filePath = path.join(TEMP_TEST_DIR, filename);

  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = sampleRate * durationSeconds;
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Fill with 440Hz test sine tone
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.5;
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, offset);     // Left
    buffer.writeInt16LE(intSample, offset + 2); // Right
    offset += 4;
  }

  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Creates an invalid / corrupted audio file for error handling verification.
 */
export function createCorruptAudioFile(filename: string): string {
  ensureTempDir();
  const filePath = path.join(TEMP_TEST_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from('NOT_AN_AUDIO_FILE_GARBAGE_BYTES_TESTING_ERROR_HANDLING'));
  return filePath;
}

/**
 * Returns all real music files from /home/axel/Music.
 */
export function getRealMusicFiles(): string[] {
  if (!fs.existsSync(REAL_MUSIC_DIR)) {
    throw new Error(`Real music directory not found: ${REAL_MUSIC_DIR}`);
  }
  return fs.readdirSync(REAL_MUSIC_DIR)
    .filter(f => !f.startsWith('.'))
    .map(f => path.join(REAL_MUSIC_DIR, f));
}

/**
 * Ensures the real music library is imported and displayed in GhostWave.
 */
export async function ensureLibraryLoaded(page: Page): Promise<number> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Check if library already contains tracks
  const existingRows = page.locator('tbody tr');
  const initialCount = await existingRows.count();
  if (initialCount >= 70) {
    return initialCount;
  }

  // Open "Add Files" modal
  const addFilesBtn = page.getByRole('button', { name: /add files/i }).first();
  await expect(addFilesBtn).toBeVisible({ timeout: 10000 });
  await addFilesBtn.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  const fileInput = modal.locator('input[type="file"]');
  const allFiles = getRealMusicFiles();
  await fileInput.setInputFiles(allFiles);

  // Wait for import complete toast or rows to reach ~74
  await expect(page.getByText(/Import Complete|Scan Finished/i)).toBeVisible({ timeout: 45000 });

  // Close any remaining toast or dialog
  const rowCount = await page.locator('tbody tr').count();
  expect(rowCount).toBeGreaterThanOrEqual(70);
  return rowCount;
}

/**
 * Navigates to a specific screen using the sidebar navigation.
 */
export async function navigateTo(
  page: Page,
  screenName: 'Library' | 'Playlists' | 'Health & Cleanup' | 'Audio Visualizer' | 'Local AI Assistant' | 'Listening History' | 'Settings & Platform'
): Promise<void> {
  const navBtn = page.getByRole('button', { name: screenName, exact: false }).first();
  await expect(navBtn).toBeVisible({ timeout: 5000 });
  await navBtn.click();
}
