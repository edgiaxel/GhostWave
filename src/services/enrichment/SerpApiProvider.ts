/**
 * S8.4: Optional Search Partner (SerpApi)
 * Evaluates external search partner for tracks unavailable in dedicated metadata databases.
 * Credential Security: SerpApi requires an API key. To prevent credential exposure,
 * private keys are NEVER bundled into client source code. Keys are strictly user-supplied,
 * stored in local browser settings, and masked in the UI.
 *
 * Invariants:
 * - Never automatically trust search snippets as metadata.
 * - Display result sources and URLs for manual verification.
 * - User review is strictly required before accepting suggestions.
 */

import { EnrichmentCandidate, EnrichmentSearchQuery, OnlineEnrichmentProvider } from './types';
import { sentryTelemetry } from '../telemetry/SentryTelemetry';

export class SerpApiProvider implements OnlineEnrichmentProvider {
  id = 'serpapi';
  name = 'SerpApi (Search Partner)';

  constructor(private apiKey: string = '') {}

  setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  getApiKey(): string {
    return this.apiKey;
  }

  hasValidKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length >= 10);
  }

  async isAvailable(): Promise<boolean> {
    return this.hasValidKey();
  }

  /**
   * Search external web knowledge graph and organic results via SerpApi endpoint.
   * If no key is configured or proxy fails, returns empty candidate list gracefully.
   */
  async searchCandidates(query: EnrichmentSearchQuery): Promise<EnrichmentCandidate[]> {
    if (!this.hasValidKey()) {
      return [];
    }

    const title = query.title?.trim() || '';
    const artist = query.artist?.trim() || '';
    if (!title) return [];

    const queryTerm = `${artist} ${title} music album release date`.trim();
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(queryTerm)}&api_key=${this.apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        sentryTelemetry.captureEnrichmentLookupFailed({
          provider: 'serpapi',
          errorCategory: `HTTP_${res.status}`,
        });
        return [];
      }

      const data = await res.json();
      const results: EnrichmentCandidate[] = [];

      // 1. Inspect Knowledge Graph (high confidence)
      if (data.knowledge_graph) {
        const kg = data.knowledge_graph;
        results.push({
          id: `serp-kg-${Date.now()}`,
          title: kg.title || title,
          artist: kg.artist || artist || 'Unknown Artist',
          album: kg.album || query.album || '',
          year: kg.release_date ? parseInt(String(kg.release_date).slice(0, 4), 10) : undefined,
          source: 'serpapi',
          sourceUrl: kg.source?.link || undefined,
          snippet: kg.description || 'Google Knowledge Graph entry',
          confidence: 0.85,
          confidenceRationale: 'Identified via Search Partner Google Knowledge Graph (review required)',
        });
      }

      // 2. Inspect Organic Results (candidate suggestions with source links)
      if (Array.isArray(data.organic_results)) {
        for (let i = 0; i < Math.min(data.organic_results.length, 4); i++) {
          const item = data.organic_results[i];
          if (!item.title) continue;

          // Attempt to extract 4-digit release year from snippet
          const yearMatch = item.snippet ? item.snippet.match(/\b(19\d\d|20\d\d)\b/) : null;
          const extractedYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

          results.push({
            id: `serp-organic-${i}-${Date.now()}`,
            title: title, // Keep user's track title for precision
            artist: artist || item.source || 'Web Candidate',
            album: query.album || '',
            year: extractedYear,
            source: 'serpapi',
            sourceUrl: item.link || undefined,
            snippet: item.snippet || item.title,
            confidence: 0.65,
            confidenceRationale: `Web result candidate from ${item.source || 'Search'} (requires user review)`,
          });
        }
      }

      return results;
    } catch (err: unknown) {
      sentryTelemetry.captureEnrichmentLookupFailed({
        provider: 'serpapi',
        errorCategory: err instanceof Error ? err.name : 'UnknownError',
      });
      return [];
    }
  }
}
