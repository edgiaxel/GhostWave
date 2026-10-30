import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryService } from '../services/history/HistoryService';
import { PlaybackEvent } from '../services/history/types';
import { Track } from '../types';
import { IndexedDbRepository } from '../services/storage/IndexedDbRepository';

const MOCK_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Neon Horizon',
    artist: 'CyberBand',
    album: 'Future Glow',
    genre: ['Synthwave', 'Electronic'],
    durationSeconds: 200,
    format: 'mp3',
    filePath: '/music/neon_horizon.mp3',
    fileName: 'neon_horizon.mp3',
    fileSizeBytes: 5000000,
    lastModified: Date.now(),
    addedAt: Date.now(),
    availability: 'available',
    hasEmbeddedPicture: false,
    favorite: true,
  },
  {
    id: 'track-2',
    title: 'Retro Highway',
    artist: 'CyberBand',
    album: 'Future Glow',
    genre: ['Synthwave'],
    durationSeconds: 180,
    format: 'mp3',
    filePath: '/music/retro_highway.mp3',
    fileName: 'retro_highway.mp3',
    fileSizeBytes: 4500000,
    lastModified: Date.now(),
    addedAt: Date.now(),
    availability: 'available',
    hasEmbeddedPicture: false,
  },
  {
    id: 'track-3',
    title: 'Midnight Jazz',
    artist: 'Smooth Trio',
    album: 'Late Night',
    genre: ['Jazz', 'Chill'],
    durationSeconds: 240,
    format: 'flac',
    filePath: '/music/midnight_jazz.flac',
    fileName: 'midnight_jazz.flac',
    fileSizeBytes: 15000000,
    lastModified: Date.now(),
    addedAt: Date.now(),
    availability: 'available',
    hasEmbeddedPicture: false,
  },
  {
    id: 'track-4',
    title: 'Missing Audio',
    artist: 'Unknown',
    album: 'Unknown Album',
    genre: ['Unknown'],
    durationSeconds: 120,
    format: 'wav',
    filePath: '/music/missing.wav',
    fileName: 'missing.wav',
    fileSizeBytes: 1000000,
    lastModified: Date.now(),
    addedAt: Date.now(),
    availability: 'missing',
    hasEmbeddedPicture: false,
  },
];

describe('S10: Listening History & Recommendations', () => {
  let dbRepo: IndexedDbRepository;

  beforeEach(async () => {
    dbRepo = new IndexedDbRepository();
    await dbRepo.clearPlaybackEvents();
  });

  describe('S10.1 — Consistent Playback Event Classification', () => {
    it('classifies as completed when listened >= 30 seconds', () => {
      const eventType = HistoryService.classifyPlaybackEvent(35, 180, false);
      expect(eventType).toBe('completed');
    });

    it('classifies as completed when listened >= 50% of track duration', () => {
      // 10s of a 15s track is >= 50%
      const eventType = HistoryService.classifyPlaybackEvent(10, 15, false);
      expect(eventType).toBe('completed');
    });

    it('classifies as completed when natural end of audio is reached', () => {
      const eventType = HistoryService.classifyPlaybackEvent(5, 180, true);
      expect(eventType).toBe('completed');
    });

    it('classifies as skipped when listened < 30s and < 50% of track duration', () => {
      const eventType = HistoryService.classifyPlaybackEvent(15, 200, false);
      expect(eventType).toBe('skipped');
    });
  });

  describe('S10.2 — Transparent Deterministic Statistics', () => {
    it('aggregates play counts, completions, skips, and skip rate correctly', () => {
      const events: PlaybackEvent[] = [
        {
          id: 'ev-1',
          trackId: 'track-1',
          timestamp: Date.now() - 3000,
          eventType: 'completed',
          durationPlayedSeconds: 150,
          trackDurationSeconds: 200,
          completedRatio: 0.75,
        },
        {
          id: 'ev-2',
          trackId: 'track-1',
          timestamp: Date.now() - 2000,
          eventType: 'skipped',
          durationPlayedSeconds: 10,
          trackDurationSeconds: 200,
          completedRatio: 0.05,
        },
        {
          id: 'ev-3',
          trackId: 'track-2',
          timestamp: Date.now() - 1000,
          eventType: 'completed',
          durationPlayedSeconds: 180,
          trackDurationSeconds: 180,
          completedRatio: 1.0,
        },
      ];

      const stats = HistoryService.calculateStats(MOCK_TRACKS, events);

      expect(stats.totalPlays).toBe(2);
      expect(stats.totalCompletedPlays).toBe(2);
      expect(stats.totalSkips).toBe(1);
      expect(stats.skipRate).toBeCloseTo(1 / 3, 2);
      expect(stats.totalListenTimeSeconds).toBe(340);

      // Top genres
      expect(stats.topGenres.length).toBeGreaterThan(0);
      expect(stats.topGenres[0].genre).toBe('Synthwave');

      // Top artists
      expect(stats.topArtists[0].artist).toBe('CyberBand');
    });

    it('generates human-readable taste profile summary', () => {
      const events: PlaybackEvent[] = [
        {
          id: 'ev-1',
          trackId: 'track-1',
          timestamp: Date.now(),
          eventType: 'completed',
          durationPlayedSeconds: 120,
          trackDurationSeconds: 200,
          completedRatio: 0.6,
        },
      ];

      const stats = HistoryService.calculateStats(MOCK_TRACKS, events);
      const summary = HistoryService.generateTasteProfileSummary(stats);

      expect(summary).toContain('Synthwave');
      expect(summary).toContain('CyberBand');
    });
  });

  describe('S10.3 — Transparent Recommendations with Clear Rationales', () => {
    it('scores and recommends unplayed tracks matching top genre affinity', () => {
      const events: PlaybackEvent[] = [
        {
          id: 'ev-1',
          trackId: 'track-1',
          timestamp: Date.now(),
          eventType: 'completed',
          durationPlayedSeconds: 120,
          trackDurationSeconds: 200,
          completedRatio: 0.6,
        },
      ];

      const recs = HistoryService.generateRecommendations(MOCK_TRACKS, events);

      expect(recs.length).toBeGreaterThan(0);
      // Track 2 shares genre Synthwave and artist CyberBand
      const track2Rec = recs.find(r => r.track.id === 'track-2');
      expect(track2Rec).toBeDefined();
      expect(track2Rec?.rationale).toBeDefined();
    });

    it('never recommends missing or unreadable tracks', () => {
      const events: PlaybackEvent[] = [];
      const recs = HistoryService.generateRecommendations(MOCK_TRACKS, events);

      const missingRec = recs.find(r => r.track.id === 'track-4');
      expect(missingRec).toBeUndefined();
    });

    it('recommends unplayed discovery tracks when history is empty', () => {
      const events: PlaybackEvent[] = [];
      const recs = HistoryService.generateRecommendations(MOCK_TRACKS, events);

      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].basis).toBe('unplayed_discovery');
      expect(recs[0].rationale).toContain('Fresh track');
    });
  });

  describe('S10.4 — Local Persistence & User Controls', () => {
    it('persists and retrieves playback events in IndexedDB', async () => {
      const testEvent: PlaybackEvent = {
        id: 'persisted-ev-1',
        trackId: 'track-1',
        timestamp: Date.now(),
        eventType: 'completed',
        durationPlayedSeconds: 60,
        trackDurationSeconds: 200,
        completedRatio: 0.3,
      };

      await dbRepo.savePlaybackEvent(testEvent);
      const stored = await dbRepo.getPlaybackEvents();

      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe('persisted-ev-1');
      expect(stored[0].trackId).toBe('track-1');
    });

    it('clears all playback events when user requests history clear', async () => {
      const testEvent: PlaybackEvent = {
        id: 'persisted-ev-1',
        trackId: 'track-1',
        timestamp: Date.now(),
        eventType: 'completed',
        durationPlayedSeconds: 60,
        trackDurationSeconds: 200,
        completedRatio: 0.3,
      };

      await dbRepo.savePlaybackEvent(testEvent);
      let stored = await dbRepo.getPlaybackEvents();
      expect(stored.length).toBe(1);

      await dbRepo.clearPlaybackEvents();
      stored = await dbRepo.getPlaybackEvents();
      expect(stored.length).toBe(0);
    });
  });
});
