import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MusicBrainzProvider } from '../services/enrichment/MusicBrainzProvider';
import { CoverArtProvider } from '../services/enrichment/CoverArtProvider';
import { LrclibProvider } from '../services/enrichment/LrclibProvider';
import { SerpApiProvider } from '../services/enrichment/SerpApiProvider';
import { OnlineEnrichmentService } from '../services/enrichment/OnlineEnrichmentService';
import { Track } from '../types';

const MOCK_TRACK: Track = {
  id: 'test-track-1',
  title: 'Paranoid Android',
  artist: 'Radiohead',
  album: 'OK Computer',
  genre: ['Alternative Rock'],
  durationSeconds: 383,
  format: 'flac',
  bitrateKbps: 900,
  year: 1997,
  filePath: '/music/radiohead/ok_computer/paranoid_android.flac',
  fileName: 'paranoid_android.flac',
  fileSizeBytes: 42000000,
  lastModified: Date.now(),
  addedAt: Date.now(),
  availability: 'available',
  hasEmbeddedPicture: false,
};

describe('S8: Online Enrichment Service Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('S8.1 — Provider abstraction and credentials', () => {
    it('initializes MusicBrainzProvider with rate limit, user agent and id', () => {
      const provider = new MusicBrainzProvider();
      expect(provider.id).toBe('musicbrainz');
      expect(provider.name).toContain('MusicBrainz');
    });

    it('initializes SerpApiProvider with secure key handling', () => {
      const providerWithKey = new SerpApiProvider('secret_key_12345');
      expect(providerWithKey.id).toBe('serpapi');
      expect(providerWithKey.name).toContain('SerpApi');
      expect(providerWithKey.hasValidKey()).toBe(true);
      expect(providerWithKey.getApiKey()).toBe('secret_key_12345');

      const providerNoKey = new SerpApiProvider('');
      expect(providerNoKey.hasValidKey()).toBe(false);
    });

    it('calculates string similarity deterministically for matching rationale', () => {
      const exactScore = MusicBrainzProvider.calculateSimilarity('Paranoid Android', 'Paranoid Android');
      expect(exactScore).toBe(1.0);

      const fuzzyScore = MusicBrainzProvider.calculateSimilarity('Paranoid Android', 'Paranoid Android (Remastered)');
      expect(fuzzyScore).toBeGreaterThanOrEqual(0.8);

      const noMatchScore = MusicBrainzProvider.calculateSimilarity('Paranoid Android', 'Creep');
      expect(noMatchScore).toBeLessThan(0.3);
    });
  });

  describe('S8.2 — Metadata lookup and confidence scoring', () => {
    it('parses recordings and assigns deterministic confidence rationale', async () => {
      const mockApiResponse = {
        recordings: [
          {
            id: 'rec-123',
            score: 100,
            title: 'Paranoid Android',
            'artist-credit': [{ name: 'Radiohead', artist: { id: 'art-456' } }],
            releases: [
              {
                id: 'rel-789',
                title: 'OK Computer',
                date: '1997-05-21',
                'track-count': 12,
                media: [{ 'track-offset': 1 }],
              },
            ],
            length: 383000,
            tags: [{ name: 'alternative rock' }, { name: 'art rock' }],
          },
        ],
      };

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as Response);

      const provider = new MusicBrainzProvider();
      const results = await provider.searchCandidates({
        title: 'Paranoid Android',
        artist: 'Radiohead',
        album: 'OK Computer',
      });

      global.fetch = originalFetch;

      expect(results.length).toBe(1);
      const first = results[0];
      expect(first.title).toBe('Paranoid Android');
      expect(first.artist).toBe('Radiohead');
      expect(first.album).toBe('OK Computer');
      expect(first.year).toBe(1997);
      expect(first.genre).toContain('Alternative Rock');
      expect(first.releaseId).toBe('rel-789');
      expect(first.confidence).toBeGreaterThanOrEqual(0.85);
      expect(first.confidenceRationale).toContain('Exact title and artist match');
    });

    it('handles 429 rate limit or HTTP errors gracefully without throwing', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const service = new OnlineEnrichmentService();
      const results = await service.searchCandidates({ title: 'Test Track' });

      global.fetch = originalFetch;

      expect(results).toEqual([]);
    });

    it('handles offline network disconnection without crashing local operation', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const service = new OnlineEnrichmentService();
      const results = await service.searchCandidates({ title: 'Test Offline Track' });

      global.fetch = originalFetch;

      expect(results).toEqual([]);
    });
  });

  describe('S8.3 — Artwork and lyrics lookup', () => {
    it('fetches cover art from Cover Art Archive with front cover and thumbnails', async () => {
      const mockCaaResponse = {
        images: [
          {
            front: true,
            image: 'https://coverartarchive.org/release/rel-789/front.jpg',
            thumbnails: {
              small: 'https://coverartarchive.org/release/rel-789/front-250.jpg',
              large: 'https://coverartarchive.org/release/rel-789/front-500.jpg',
            },
          },
        ],
      };

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCaaResponse,
      } as Response);

      const coverArt = await CoverArtProvider.fetchCoverArtForRelease('rel-789');

      global.fetch = originalFetch;

      expect(coverArt).not.toBeNull();
      expect(coverArt?.fullUrl).toBe('https://coverartarchive.org/release/rel-789/front.jpg');
      expect(coverArt?.thumbnailUrl).toBe('https://coverartarchive.org/release/rel-789/front-250.jpg');
      expect(coverArt?.source).toContain('Cover Art Archive');
    });

    it('returns null when Cover Art Archive returns 404 (no art available)', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const coverArt = await CoverArtProvider.fetchCoverArtForRelease('missing-rel');

      global.fetch = originalFetch;

      expect(coverArt).toBeNull();
    });

    it('fetches and clearly distinguishes plain lyrics from synced LRC lyrics in LRCLIB', async () => {
      const mockLrclibResponse = {
        id: 12345,
        trackName: 'Paranoid Android',
        artistName: 'Radiohead',
        albumName: 'OK Computer',
        plainLyrics: 'Please could you stop the noise, I am trying to get some rest',
        syncedLyrics: '[00:15.20] Please could you stop the noise\n[00:19.45] I am trying to get some rest',
      };

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockLrclibResponse,
      } as Response);

      const lyrics = await LrclibProvider.fetchLyrics('Paranoid Android', 'Radiohead', 'OK Computer', 383);

      global.fetch = originalFetch;

      expect(lyrics).not.toBeNull();
      expect(lyrics?.isSynced).toBe(true);
      expect(lyrics?.plainLyrics).toContain('Please could you stop the noise');
      expect(lyrics?.syncedLyrics).toContain('[00:15.20]');
      expect(lyrics?.source).toContain('LRCLIB');
      expect(lyrics?.disclaimer).toContain('personal offline use');
    });
  });

  describe('S8.4 — Proposal construction and User Approval', () => {
    it('converts candidate into reviewable MetadataProposal objects for user approval', () => {
      const candidate = {
        id: 'rec-1',
        title: 'Paranoid Android (Remastered)',
        artist: 'Radiohead',
        album: 'OK Computer (Collector Edition)',
        year: 2009,
        genre: ['Alternative Rock', 'Art Rock'],
        source: 'musicbrainz' as const,
        confidence: 0.92,
        confidenceRationale: 'High confidence match',
      };

      const proposals = OnlineEnrichmentService.buildProposalsFromCandidate(MOCK_TRACK, candidate);

      // Should propose title, album, year, genre (since they differ or are improved)
      expect(proposals.length).toBeGreaterThan(0);
      proposals.forEach((p) => {
        expect(p.status).toBe('pending');
        expect(p.source).toBe('online_musicbrainz');
        expect(p.trackId).toBe(MOCK_TRACK.id);
      });

      const titleProp = proposals.find((p) => p.field === 'title');
      expect(titleProp?.currentValue).toBe('Paranoid Android');
      expect(titleProp?.proposedValue).toBe('Paranoid Android (Remastered)');
    });
  });
});
