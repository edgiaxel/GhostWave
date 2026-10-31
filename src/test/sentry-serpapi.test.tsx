import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import { sentryTelemetry, DEFAULT_SENTRY_DSN } from '../services/telemetry/SentryTelemetry';
import { SerpApiProvider } from '../services/enrichment/SerpApiProvider';
import { OnlineEnrichmentService } from '../services/enrichment/OnlineEnrichmentService';
import { Track } from '../types';

vi.mock('@sentry/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sentry/react')>();
  return {
    ...actual,
    init: vi.fn(),
    addBreadcrumb: vi.fn(),
    captureMessage: vi.fn(),
    captureException: vi.fn(),
    browserTracingIntegration: vi.fn(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Sentry Observability & SerpApi Partner Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentryTelemetry.init({ enabled: true, dsn: DEFAULT_SENTRY_DSN });
  });

  describe('Sentry AI Observability & Sanitized Telemetry', () => {
    it('initializes with default DSN and identifies as active', () => {
      expect(sentryTelemetry.isInitialized()).toBe(true);
      expect(Sentry.init).toHaveBeenCalled();
    });

    it('disables telemetry cleanly without throwing when configured false', () => {
      sentryTelemetry.init({ enabled: false });
      expect(sentryTelemetry.isInitialized()).toBe(false);

      // Subsequent calls should safely no-op
      expect(() => {
        sentryTelemetry.captureAiRequestStarted({ model: 'gemma3:4b', taskType: 'test' });
        sentryTelemetry.captureAiRequestCompleted({
          model: 'gemma3:4b',
          taskType: 'test',
          durationMs: 120,
          success: true,
        });
      }).not.toThrow();
    });

    it('records AI request lifecycle breadcrumbs', () => {
      sentryTelemetry.init({ enabled: true, dsn: DEFAULT_SENTRY_DSN });
      sentryTelemetry.captureAiRequestStarted({ model: 'gemma3:4b', taskType: 'playlist_proposal' });
      sentryTelemetry.captureAiRequestCompleted({
        model: 'gemma3:4b',
        taskType: 'playlist_proposal',
        durationMs: 450,
        success: true,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2);
      expect(vi.mocked(Sentry.addBreadcrumb).mock.calls[0][0].category).toBe('ai.request.started');
      expect(vi.mocked(Sentry.addBreadcrumb).mock.calls[1][0].category).toBe('ai.request.completed');
    });

    it('captures invalid AI response warnings with model tags', () => {
      sentryTelemetry.init({ enabled: true, dsn: DEFAULT_SENTRY_DSN });
      sentryTelemetry.captureAiResponseInvalid({
        model: 'gemma3:4b',
        category: 'schema_validation_error',
        reason: 'Required field matchedTrackIds is missing',
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'AI Invalid Response: schema_validation_error',
        expect.objectContaining({
          level: 'warning',
          tags: { model: 'gemma3:4b', category: 'schema_validation_error' },
        })
      );
    });

    it('captures AI provider unavailability on Ollama offline', () => {
      sentryTelemetry.init({ enabled: true, dsn: DEFAULT_SENTRY_DSN });
      sentryTelemetry.captureAiProviderUnavailable({
        endpoint: 'http://127.0.0.1:11434',
        error: 'ECONNREFUSED',
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Local AI Provider Unavailable',
        expect.objectContaining({
          level: 'warning',
          tags: { endpoint: 'http://127.0.0.1:11434' },
        })
      );
    });

    it('triggers verified intentional test error for "Break the world"', () => {
      expect(() => sentryTelemetry.triggerTestError()).toThrowError('This is your first error!');
      expect(Sentry.logger.info).toHaveBeenCalledWith(
        'User triggered test error',
        expect.objectContaining({ action: 'test_error_button_click' })
      );
    });
  });

  describe('SerpApi Search Partner Integration & User Review Safeguards', () => {
    it('detects valid API key format and reports availability', async () => {
      const provider = new SerpApiProvider('abc5a9a5e25bbae878b1869aff11b4a7533aac084a1db083b6e463de374d33ff');
      expect(provider.hasValidKey()).toBe(true);
      expect(await provider.isAvailable()).toBe(true);

      const emptyProvider = new SerpApiProvider('');
      expect(emptyProvider.hasValidKey()).toBe(false);
      expect(await emptyProvider.isAvailable()).toBe(false);
    });

    it('returns empty candidates when title is empty', async () => {
      const provider = new SerpApiProvider('abc5a9a5e25bbae878b1869aff11b4a7533aac084a1db083b6e463de374d33ff');
      const results = await provider.searchCandidates({});
      expect(results).toEqual([]);
    });

    it('parses Google Knowledge Graph and organic web results with source URLs and snippets', async () => {
      const provider = new SerpApiProvider('valid_test_key_123456');

      const mockSerpResponse = {
        knowledge_graph: {
          title: 'Master of Puppets',
          artist: 'Metallica',
          album: 'Master of Puppets',
          release_date: '1986-03-03',
          description: 'Master of Puppets is the third studio album by American heavy metal band Metallica.',
          source: {
            link: 'https://en.wikipedia.org/wiki/Master_of_Puppets',
          },
        },
        organic_results: [
          {
            title: 'Master of Puppets (album) - Wikipedia',
            link: 'https://en.wikipedia.org/wiki/Master_of_Puppets',
            snippet: 'Master of Puppets was released on March 3, 1986, by Elektra Records.',
            source: 'Wikipedia',
          },
          {
            title: 'Metallica - Master of Puppets Releases on Discogs',
            link: 'https://www.discogs.com/master/6495-Metallica-Master-Of-Puppets',
            snippet: 'Discover releases, reviews, credits, songs, and more about Metallica - Master Of Puppets.',
            source: 'Discogs',
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockSerpResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const candidates = await provider.searchCandidates({
        title: 'Master of Puppets',
        artist: 'Metallica',
      });

      expect(candidates.length).toBeGreaterThan(0);

      // Verify Knowledge Graph candidate
      const kgCandidate = candidates.find((c) => c.id.startsWith('serp-kg'));
      expect(kgCandidate).toBeDefined();
      expect(kgCandidate?.title).toBe('Master of Puppets');
      expect(kgCandidate?.artist).toBe('Metallica');
      expect(kgCandidate?.year).toBe(1986);
      expect(kgCandidate?.source).toBe('serpapi');
      expect(kgCandidate?.sourceUrl).toBe('https://en.wikipedia.org/wiki/Master_of_Puppets');
      expect(kgCandidate?.confidence).toBe(0.85);

      // Verify Organic results candidates with extracted snippet and URLs
      const organicCandidate = candidates.find((c) => c.id.startsWith('serp-organic'));
      expect(organicCandidate).toBeDefined();
      expect(organicCandidate?.sourceUrl).toBeDefined();
      expect(organicCandidate?.snippet).toBeDefined();
      expect(organicCandidate?.confidenceRationale).toContain('requires user review');
    });

    it('captures Sentry warning when SerpApi returns HTTP error or rate limit', async () => {
      const provider = new SerpApiProvider('test_key_123456');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized key', { status: 401 })
      );

      const candidates = await provider.searchCandidates({ title: 'Song' });
      expect(candidates).toEqual([]);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'enrichment.lookup.failed',
          data: expect.objectContaining({
            provider: 'serpapi',
            errorCategory: 'HTTP_401',
          }),
        })
      );
    });

    it('converts SerpApi candidates to reviewable MetadataProposals without silent writes', () => {
      const mockTrack: Track = {
        id: 'track-metal-1',
        title: 'Puppets',
        artist: 'Metal Band',
        album: 'Old Album',
        genre: ['Metal'],
        durationSeconds: 515,
        format: 'flac',
        filePath: '/music/puppets.flac',
        fileName: 'puppets.flac',
        fileSizeBytes: 30000000,
        lastModified: Date.now(),
        addedAt: Date.now(),
        availability: 'available',
        hasEmbeddedPicture: false,
      };

      const candidate = {
        id: 'serp-kg-123',
        title: 'Master of Puppets',
        artist: 'Metallica',
        album: 'Master of Puppets',
        year: 1986,
        source: 'serpapi' as const,
        sourceUrl: 'https://en.wikipedia.org/wiki/Master_of_Puppets',
        snippet: 'Master of Puppets is an album by Metallica.',
        confidence: 0.85,
        confidenceRationale: 'Identified via Search Partner Google Knowledge Graph',
      };

      const proposals = OnlineEnrichmentService.buildProposalsFromCandidate(mockTrack, candidate);

      expect(proposals.length).toBeGreaterThan(0);
      proposals.forEach((p) => {
        expect(p.status).toBe('pending'); // strictly pending
        expect(p.trackId).toBe('track-metal-1');
      });

      const titleProp = proposals.find((p) => p.field === 'title');
      expect(titleProp?.currentValue).toBe('Puppets');
      expect(titleProp?.proposedValue).toBe('Master of Puppets');

      const artistProp = proposals.find((p) => p.field === 'artist');
      expect(artistProp?.currentValue).toBe('Metal Band');
      expect(artistProp?.proposedValue).toBe('Metallica');
    });
  });
});
