/**
 * S8.4: Optional Search Partner (SerpApi)
 * Evaluates external search partner for tracks unavailable in dedicated metadata databases.
 * Credential Security: SerpApi requires an API key. To prevent credential exposure,
 * private keys are NEVER bundled into client source code. Keys are strictly user-supplied,
 * stored in local browser settings, and masked in the UI.
 */

import { EnrichmentCandidate, EnrichmentSearchQuery, OnlineEnrichmentProvider } from './types';

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
   * Search external web knowledge graph via SerpApi endpoint.
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
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const results: EnrichmentCandidate[] = [];

      // Inspect organic search results or knowledge graph
      if (data.knowledge_graph) {
        const kg = data.knowledge_graph;
        results.push({
          id: `serp-kg-${Date.now()}`,
          title: kg.title || title,
          artist: kg.artist || artist || 'Unknown Artist',
          album: kg.album || query.album || '',
          year: kg.release_date ? parseInt(String(kg.release_date).slice(0, 4), 10) : undefined,
          source: 'serpapi',
          confidence: 0.85,
          confidenceRationale: 'Identified via Search Partner Google Knowledge Graph',
        });
      }

      return results;
    } catch {
      return [];
    }
  }
}
