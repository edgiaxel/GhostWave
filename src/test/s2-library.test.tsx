import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IndexedDbRepository } from '../services/storage/IndexedDbRepository';
import { MetadataService } from '../services/metadata/MetadataService';
import { LibraryScanner } from '../services/scanner/LibraryScanner';
import { WebFilePlatform } from '../services/platform/WebFilePlatform';
import { AppProvider } from '../context/AppContext';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ScanModal } from '../components/common/ScanModal';
import { ToastContainer } from '../components/common/ToastContainer';
import { Track } from '../types';

describe('S2: Local Library Import & Metadata Scan Isolated Tests', () => {
  let repository: IndexedDbRepository;
  let platform: WebFilePlatform;

  beforeEach(async () => {
    repository = new IndexedDbRepository();
    platform = new WebFilePlatform();
    await repository.clearLibrary();
  });

  describe('S2.1: Platform File Operations Interface', () => {
    it('implements WebFilePlatform with expected browser constraints', () => {
      expect(platform.isDesktop()).toBe(false);
      expect(platform.canWriteMetadata()).toBe(false);
    });

    it('creates and revokes audio object URLs safely', async () => {
      const mockFile = new File(['fake-audio-bytes'], 'spooky.mp3', { type: 'audio/mpeg' });
      platform.storeFileInMemory('trk-test-1', mockFile);

      const track: Track = {
        id: 'trk-test-1',
        filePath: 'spooky.mp3',
        fileName: 'spooky.mp3',
        fileSizeBytes: mockFile.size,
        lastModified: mockFile.lastModified,
        format: 'mp3',
        title: 'Spooky Track',
        artist: 'Ghostly Artist',
        album: 'Haunted Sounds',
        genre: ['Soundtrack'],
        durationSeconds: 120,
        hasEmbeddedPicture: false,
        availability: 'available',
        addedAt: Date.now(),
      };

      const url = await platform.getAudioUrl(track);
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);

      expect(() => platform.revokeAudioUrl(url)).not.toThrow();
    });

    it('rejects in-place renaming and writing in web mode without throwing', async () => {
      const renameResult = await platform.renameFile();
      expect(renameResult.success).toBe(false);
      expect(renameResult.code).toBe('UNSUPPORTED_PLATFORM');

      const writeResult = await platform.writeMetadata();
      expect(writeResult.success).toBe(false);
      expect(writeResult.code).toBe('UNSUPPORTED_PLATFORM');
    });
  });

  describe('S2.2 & S2.3: Metadata Parsing & Deterministic IDs', () => {
    it('detects audio formats accurately from extensions', () => {
      expect(MetadataService.getFormatFromFileName('song.mp3')).toBe('mp3');
      expect(MetadataService.getFormatFromFileName('track.flac')).toBe('flac');
      expect(MetadataService.getFormatFromFileName('audio.wav')).toBe('wav');
      expect(MetadataService.getFormatFromFileName('ambient.ogg')).toBe('ogg');
      expect(MetadataService.getFormatFromFileName('podcast.m4a')).toBe('m4a');
      expect(MetadataService.getFormatFromFileName('file.txt')).toBe('unknown');
    });

    it('extracts artist and title from filename heuristics when tags are absent', () => {
      const res1 = MetadataService.parseFilenameHeuristic('John Carpenter - Halloween Theme.flac');
      expect(res1.artist).toBe('John Carpenter');
      expect(res1.title).toBe('Halloween Theme');

      const res2 = MetadataService.parseFilenameHeuristic('01 - Goblin - Suspiria.mp3');
      expect(res2.artist).toBe('Goblin');
      expect(res2.title).toBe('Suspiria');

      const res3 = MetadataService.parseFilenameHeuristic('AmbientDrone.wav');
      expect(res3.artist).toBe('Unknown Artist');
      expect(res3.title).toBe('AmbientDrone');
    });

    it('generates deterministic track IDs for the same file attributes', () => {
      const file1 = new File(['audio1'], 'song.flac', { lastModified: 1700000000000 });
      const file2 = new File(['audio1'], 'song.flac', { lastModified: 1700000000000 });
      const fileDifferent = new File(['audio2-longer-size'], 'song.flac', { lastModified: 1700000000000 });

      const id1 = LibraryScanner.generateDeterministicTrackId(file1);
      const id2 = LibraryScanner.generateDeterministicTrackId(file2);
      const id3 = LibraryScanner.generateDeterministicTrackId(fileDifferent);

      expect(id1).toBe(id2);
      expect(id1).not.toBe(id3);
    });

    it('filters out unsupported non-audio files', () => {
      const audioMp3 = new File([''], 'test.mp3');
      const audioFlac = new File([''], 'test.flac');
      const textFile = new File([''], 'notes.txt');
      const imageFile = new File([''], 'cover.png');

      expect(LibraryScanner.isSupportedAudioFile(audioMp3)).toBe(true);
      expect(LibraryScanner.isSupportedAudioFile(audioFlac)).toBe(true);
      expect(LibraryScanner.isSupportedAudioFile(textFile)).toBe(false);
      expect(LibraryScanner.isSupportedAudioFile(imageFile)).toBe(false);
    });
  });

  describe('S2.3: IndexedDB Persistence & Library Scanner Operations', () => {
    it('persists tracks in IndexedDB and retrieves them offline', async () => {
      const testTrack: Track = {
        id: 'trk-idb-1',
        filePath: 'sound.flac',
        fileName: 'sound.flac',
        fileSizeBytes: 1024,
        lastModified: 1700000000000,
        format: 'flac',
        title: 'Haunted Forest',
        artist: 'Ghost Wave',
        album: 'Night Vol 1',
        genre: ['Horror'],
        durationSeconds: 180,
        hasEmbeddedPicture: false,
        availability: 'available',
        addedAt: Date.now(),
      };

      await repository.saveTracks([testTrack]);
      const retrieved = await repository.getAllTracks();

      expect(retrieved.some((t) => t.id === 'trk-idb-1')).toBe(true);

      const single = await repository.getTrackById('trk-idb-1');
      expect(single?.title).toBe('Haunted Forest');

      await repository.deleteTrack('trk-idb-1');
      const afterDelete = await repository.getTrackById('trk-idb-1');
      expect(afterDelete).toBeNull();
    });

    it('scans a batch of files, reports progress, and prevents duplicate records', async () => {
      const scanner = new LibraryScanner(repository, platform);
      const file1 = new File(['fake-bytes-1'], 'Artist A - Title One.mp3', {
        type: 'audio/mpeg',
        lastModified: 1700000000000,
      });
      const file2 = new File(['fake-bytes-2'], 'Artist B - Title Two.flac', {
        type: 'audio/flac',
        lastModified: 1700000000000,
      });
      const unsupported = new File(['text'], 'lyrics.txt', { type: 'text/plain' });

      const progressSteps: number[] = [];

      const report1 = await scanner.scanFiles([file1, file2, unsupported], (p) => {
        progressSteps.push(p.scanned);
      });

      expect(report1.added).toBe(2);
      expect(report1.unsupported).toBe(1);
      expect(progressSteps.length).toBeGreaterThan(0);

      const report2 = await scanner.scanFiles([file1, file2]);
      expect(report2.added).toBe(0);
      expect(report2.skipped).toBe(2);
    });
  });
});

describe('S2: Library UI Integration Tests', () => {
  beforeEach(async () => {
    const repository = new IndexedDbRepository();
    await repository.clearLibrary();
  });

  it('renders library screen and handles file import trigger and non-destructive removal', async () => {
    const repository = new IndexedDbRepository();
    const testTrack: Track = {
      id: 'trk-ui-1',
      filePath: 'spooky1.mp3',
      fileName: 'spooky1.mp3',
      fileSizeBytes: 1024,
      lastModified: 1700000000000,
      format: 'mp3',
      title: 'Spooky Track 1',
      artist: 'Ghost Artist',
      album: 'Haunted Album',
      genre: ['Soundtrack'],
      durationSeconds: 120,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: Date.now(),
    };
    await repository.saveTracks([testTrack]);

    render(
      <AppProvider>
        <LibraryScreen />
        <ScanModal />
        <ToastContainer />
      </AppProvider>
    );

    // Initial tracks rendered from IndexedDB
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /All Tracks \(1\)/i })).toBeInTheDocument();
      expect(screen.getAllByText('Spooky Track 1').length).toBeGreaterThan(0);
    });

    // Open Add Files modal
    const addFilesBtn = screen.getByRole('button', { name: /Add Files/i });
    fireEvent.click(addFilesBtn);

    // Verify modal appears
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Import Local Audio Files')).toBeInTheDocument();

    // Close modal via Cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Test non-destructive track removal from index
    const removeButtons = screen.getAllByTitle('Remove from GhostWave library index');
    expect(removeButtons.length).toBeGreaterThan(0);

    fireEvent.click(removeButtons[0]);

    // Track count decrements and toast feedback shows
    await waitFor(() => {
      expect(screen.getByText('Removed from Library Index')).toBeInTheDocument();
    });
  });
});
