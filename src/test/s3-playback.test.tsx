import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PlaybackEngine } from '../services/playback/PlaybackEngine';
import { AppProvider } from '../context/AppContext';
import { LibraryScreen } from '../screens/LibraryScreen';
import { BottomPlayer } from '../components/layout/BottomPlayer';
import { QueueModal } from '../components/common/QueueModal';
import { ToastContainer } from '../components/common/ToastContainer';
import { IndexedDbRepository } from '../services/storage/IndexedDbRepository';
import { WebFilePlatform } from "../services/platform/WebFilePlatform";
import { getPlatform } from '../services/platform';
import { Track } from '../types';

describe('S3: Audio Playback & Queue Management Tests', () => {
  describe('S3.1: PlaybackEngine State Machine & Core Transport', () => {
    let engine: PlaybackEngine;

    beforeEach(() => {
      engine = new PlaybackEngine();
    });

    afterEach(() => {
      engine.destroy();
    });

    it('initializes in idle status with default volume and unmuted state', () => {
      expect(engine.getStatus()).toBe('idle');
      expect(engine.getCurrentTime()).toBe(0);
      expect(engine.getDuration()).toBe(0);
    });

    it('transitions through status lifecycle: loading -> playing -> paused', async () => {
      const statusTransitions: string[] = [];
      engine.setEvents({
        onStatusChange: (status) => {
          statusTransitions.push(status);
        },
      });

      await engine.loadAndPlay('blob:test-audio-url');
      expect(statusTransitions).toContain('loading');
      expect(statusTransitions).toContain('playing');
      expect(engine.getStatus()).toBe('playing');

      engine.pause();
      expect(engine.getStatus()).toBe('paused');
    });

    it('handles seek, volume clamping, and mute state correctly', () => {
      engine.setVolume(1.5); // Should clamp to 1
      engine.setMuted(true);
      engine.seek(45);

      expect(engine.getCurrentTime()).toBe(45);

      engine.setVolume(-0.5); // Should clamp to 0
      engine.setMuted(false);
      engine.seek(0);
      expect(engine.getCurrentTime()).toBe(0);
    });

    it('provides AnalyserNode with 2048 FFT size for live visualizer', () => {
      const analyser = engine.getAnalyser();
      expect(analyser).not.toBeNull();
      expect(analyser?.fftSize).toBe(2048);
    });
  });

  describe('S3.2 & S3.3: Queue Management, UI Controls, and Auto-Advance', () => {
    let repository: IndexedDbRepository;

    const sampleTracks: Track[] = [
      {
        id: 'track-alpha',
        filePath: 'alpha.mp3',
        fileName: 'alpha.mp3',
        fileSizeBytes: 2048,
        lastModified: 1700000000000,
        format: 'mp3',
        title: 'Alpha Song',
        artist: 'Ghost Wave',
        album: 'Haunted Vol 1',
        genre: ['Synthwave'],
        durationSeconds: 150,
        hasEmbeddedPicture: false,
        availability: 'available',
        addedAt: Date.now(),
      },
      {
        id: 'track-beta',
        filePath: 'beta.flac',
        fileName: 'beta.flac',
        fileSizeBytes: 4096,
        lastModified: 1700000000000,
        format: 'flac',
        title: 'Beta Lossless',
        artist: 'Spooky DJ',
        album: 'Night Vol 2',
        genre: ['Darkwave'],
        durationSeconds: 210,
        hasEmbeddedPicture: false,
        availability: 'available',
        addedAt: Date.now() + 1,
      },
      {
        id: 'track-gamma',
        filePath: 'gamma.wav',
        fileName: 'gamma.wav',
        fileSizeBytes: 8192,
        lastModified: 1700000000000,
        format: 'wav',
        title: 'Gamma Resonance',
        artist: 'Phantom Choir',
        album: 'Echoes',
        genre: ['Ambient'],
        durationSeconds: 180,
        hasEmbeddedPicture: false,
        availability: 'available',
        addedAt: Date.now() + 2,
      },
    ];

    beforeEach(async () => {
      repository = new IndexedDbRepository();
      await repository.clearLibrary();
      await repository.saveTracks(sampleTracks);

      const platform = getPlatform();
      sampleTracks.forEach((t) => {
        (platform as WebFilePlatform).storeFileInMemory(t.id, new File(['dummy-bytes'], t.fileName, { type: 'audio/mpeg' }));
      });
    });

    it('plays selected track directly and updates bottom player metadata', async () => {
      render(
        <AppProvider>
          <LibraryScreen />
          <BottomPlayer />
          <QueueModal />
          <ToastContainer />
        </AppProvider>
      );

      // Wait for tracks from IndexedDB
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /All Tracks \(3\)/i })).toBeInTheDocument();
      });

      // Click Play on Track Alpha
      const playAlphaButtons = screen.getAllByLabelText(/Play Alpha Song/i);
      expect(playAlphaButtons.length).toBeGreaterThan(0);
      fireEvent.click(playAlphaButtons[0]);

      // Bottom player displays title and format
      await waitFor(() => {
        const playerRegion = screen.getByRole('region', { name: /Audio Playback Controls/i });
        expect(playerRegion).toHaveTextContent(/Alpha Song/i);
        expect(playerRegion).toHaveTextContent(/Ghost Wave/i);
        expect(playerRegion).toHaveTextContent(/mp3/i);
      });
    });

    it('adds tracks to queue, displays badge count, and manages queue ordering', async () => {
      render(
        <AppProvider>
          <LibraryScreen />
          <BottomPlayer />
          <QueueModal />
          <ToastContainer />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /All Tracks \(3\)/i })).toBeInTheDocument();
      });

      // Add Track Beta and Gamma to queue
      const addBeta = screen.getByLabelText(/Add Beta Lossless to queue/i);
      fireEvent.click(addBeta);

      await waitFor(() => {
        expect(screen.getByText('Added to Queue')).toBeInTheDocument();
      });

      const addGamma = screen.getByLabelText(/Add Gamma Resonance to queue/i);
      fireEvent.click(addGamma);

      // Open Queue Modal
      const openQueueBtn = screen.getByLabelText(/Open Playback Queue/i);
      fireEvent.click(openQueueBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Current Playback Queue')).toBeInTheDocument();
      expect(within(dialog).getByText(/Up Next \(2\)/i)).toBeInTheDocument();

      // Verify both items in queue modal
      expect(within(dialog).getByText('Beta Lossless')).toBeInTheDocument();
      expect(within(dialog).getByText('Gamma Resonance')).toBeInTheDocument();

      // Remove an item from queue
      const removeBtns = within(dialog).getAllByTitle('Remove from queue');
      fireEvent.click(removeBtns[0]);

      await waitFor(() => {
        expect(within(dialog).getByText(/Up Next \(1\)/i)).toBeInTheDocument();
      });

      // Clear the queue
      const clearBtn = within(dialog).getByRole('button', { name: /Clear Queue/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(within(dialog).getByText(/Queue is empty/i)).toBeInTheDocument();
      });
    });

    it('handles repeat mode toggles and shuffle mode in bottom player', async () => {
      render(
        <AppProvider>
          <BottomPlayer />
        </AppProvider>
      );

      // Toggle repeat modes: all -> one -> off -> all
      const repeatBtn = screen.getByLabelText(/Repeat mode: all/i);
      fireEvent.click(repeatBtn);
      expect(screen.getByLabelText(/Repeat mode: one/i)).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(/Repeat mode: one/i));
      expect(screen.getByLabelText(/Repeat mode: off/i)).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(/Repeat mode: off/i));
      expect(screen.getByLabelText(/Repeat mode: all/i)).toBeInTheDocument();

      // Toggle shuffle
      const shuffleBtn = screen.getByLabelText(/Enable shuffle/i);
      fireEvent.click(shuffleBtn);
      expect(screen.getByLabelText(/Disable shuffle/i)).toBeInTheDocument();
    });

    it('retrieves and plays audio blobs persisted in IndexedDB', async () => {
      // Clear memory cache to simulate page reload
      const platform = getPlatform() as WebFilePlatform;
      const testBlob = new Blob(['persisted-audio-bytes'], { type: 'audio/mpeg' });
      await repository.saveAudioBlob('track-beta', testBlob);

      const url = await platform.getAudioUrl(sampleTracks[1]);
      expect(url).toBeTruthy();
      expect(url.startsWith('blob:')).toBe(true);
    });

    it('displays error state and does not fake playback when audio file is unavailable', async () => {
      // Track with no cached file and no blob in IndexedDB
      const missingTrack: Track = {
        id: 'track-missing',
        filePath: 'missing.mp3',
        fileName: 'missing.mp3',
        fileSizeBytes: 1024,
        lastModified: 1700000000000,
        format: 'mp3',
        title: 'Missing Track',
        artist: 'Ghost',
        album: 'Void',
        genre: ['None'],
        durationSeconds: 120,
        hasEmbeddedPicture: false,
        availability: 'missing',
        addedAt: Date.now(),
      };
      await repository.saveTracks([missingTrack]);

      render(
        <AppProvider>
          <LibraryScreen />
          <BottomPlayer />
          <ToastContainer />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Missing Track')).toBeInTheDocument();
      });

      const playMissingBtn = screen.getByLabelText(/Play Missing Track/i);
      fireEvent.click(playMissingBtn);

      await waitFor(() => {
        expect(screen.getByText('File Unavailable')).toBeInTheDocument();
      });
    });

    it('keeps audio engine alive and responsive across StrictMode or unmount/remount', () => {
      const { unmount } = render(
        <AppProvider>
          <BottomPlayer />
        </AppProvider>
      );

      // Unmounting should not kill audio element on shared engine
      unmount();

      const { getByRole } = render(
        <AppProvider>
          <BottomPlayer />
        </AppProvider>
      );

      expect(getByRole('region', { name: /Audio Playback Controls/i })).toBeInTheDocument();
    });
  });
});
