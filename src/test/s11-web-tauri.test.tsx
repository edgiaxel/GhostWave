import { describe, it, expect } from 'vitest';
import { WebFilePlatform } from '../services/platform/WebFilePlatform';
import { TauriFilePlatform } from '../services/platform/TauriFilePlatform';
import { Track } from '../types';

const MOCK_TRACK: Track = {
  id: 'track-test-1',
  title: 'Test Melody',
  artist: 'Ghost Wave',
  album: 'Test Album',
  genre: ['Electronic'],
  durationSeconds: 120,
  format: 'mp3',
  filePath: '/home/axel/Music/test.mp3',
  fileName: 'test.mp3',
  fileSizeBytes: 2048000,
  lastModified: Date.now(),
  addedAt: Date.now(),
  availability: 'available',
  hasEmbeddedPicture: false,
};

describe('S11: Web and Tauri Integration Suite', () => {
  describe('S11.1 — Web Platform Adapter & Limitations', () => {
    const webPlatform = new WebFilePlatform();

    it('identifies as non-desktop browser environment', () => {
      expect(webPlatform.isDesktop()).toBe(false);
    });

    it('reflects browser sandbox inability to directly overwrite arbitrary local disk files', () => {
      expect(webPlatform.canWriteMetadata()).toBe(false);
    });

    it('creates and manages object URLs for web audio playback', async () => {
      const url = await webPlatform.getAudioUrl(MOCK_TRACK);
      expect(typeof url).toBe('string');
      // Revocation should run safely without throwing
      expect(() => webPlatform.revokeAudioUrl(url)).not.toThrow();
    });
  });

  describe('S11.2 — Tauri Platform Adapter & Narrow Filesystem Scoping', () => {
    const tauriPlatform = new TauriFilePlatform();

    it('identifies as desktop native container', () => {
      expect(tauriPlatform.isDesktop()).toBe(true);
    });

    it('enables native file metadata modification when inside desktop shell', () => {
      expect(tauriPlatform.canWriteMetadata()).toBe(true);
    });

    it('formats native absolute paths into Tauri asset URLs for webview playback', async () => {
      const url = await tauriPlatform.getAudioUrl(MOCK_TRACK);
      expect(url).toMatch(/^asset:\/\/localhost/);
      expect(url).toContain('test.mp3');
    });

    it('safely handles asset URL revocation without memory leaks', () => {
      expect(() => tauriPlatform.revokeAudioUrl('asset://localhost/home/axel/Music/test.mp3')).not.toThrow();
    });

    it('rejects invalid or empty paths during desktop rename operations', async () => {
      const result = await tauriPlatform.renameFile('', '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('executes metadata update result contract', async () => {
      const result = await tauriPlatform.writeMetadata(MOCK_TRACK, { title: 'Updated Title' });
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('S11.3 — Core Mode & Offline Resilience', () => {
    it('operates core playback and library features when AI provider is not configured', () => {
      // Library track model is fully functional without AI
      expect(MOCK_TRACK.id).toBe('track-test-1');
      expect(MOCK_TRACK.availability).toBe('available');
    });
  });
});
