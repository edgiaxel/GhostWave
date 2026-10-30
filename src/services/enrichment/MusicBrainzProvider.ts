/**
 * S8.1 & S8.2: MusicBrainz Online Metadata Provider
 * Implements rate-limited search against the MusicBrainz Open API.
 * Rate limit: 1 request/second adhering to MusicBrainz API rules.
 * Requires custom User-Agent identifying the client application.
 */

import { EnrichmentCandidate, EnrichmentSearchQuery, OnlineEnrichmentProvider } from './types';

const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'GhostWave/0.9.0 ( https://github.com/edgiaxel/GhostWave )';

export class MusicBrainzProvider implements OnlineEnrichmentProvider {
  id = 'musicbrainz';
  name = 'MusicBrainz (Open Database)';

  // Client-side rate-limiter: enforce >= 1000ms between calls
  private static lastRequestTimestamp = 0;
  private static rateLimitDelayMs = 1000;

  /**
   * Waits if needed to respect the 1 req/sec rate limit.
   */
  private static async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - MusicBrainzProvider.lastRequestTimestamp;
    if (elapsed < MusicBrainzProvider.rateLimitDelayMs) {
      const waitTime = MusicBrainzProvider.rateLimitDelayMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    MusicBrainzProvider.lastRequestTimestamp = Date.now();
  }

  /**
   * Helper to compute string similarity (0.0 to 1.0) using tokenized overlap and exact matching.
   */
  static calculateSimilarity(queryStr: string, targetStr: string): number {
    const q = queryStr.toLowerCase().trim();
    const t = targetStr.toLowerCase().trim();

    if (q === t) return 1.0;
    if (!q || !t) return 0.0;
    if (t.includes(q) || q.includes(t)) return 0.85;

    const qTokens = new Set(q.split(/\W+/).filter(Boolean));
    const tTokens = new Set(t.split(/\W+/).filter(Boolean));
    if (qTokens.size === 0 || tTokens.size === 0) return 0.0;

    let matchCount = 0;
    for (const token of qTokens) {
      if (tTokens.has(token)) matchCount++;
    }

    const jaccard = matchCount / Math.max(qTokens.size, tTokens.size);
    return Math.round(jaccard * 100) / 100;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${MUSICBRAINZ_API_BASE}/recording?query=format:json&limit=1&fmt=json`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Searches MusicBrainz recordings for matching candidates.
   */
  async searchCandidates(query: EnrichmentSearchQuery): Promise<EnrichmentCandidate[]> {
    const title = query.title?.trim() || '';
    const artist = query.artist?.trim() || '';

    if (!title && !artist) {
      return [];
    }

    // Build Lucene query terms
    const queryParts: string[] = [];
    if (title) {
      // Escape special lucene characters
      const cleanTitle = title.replace(/[-+&|!(){}[\]^"~*?:\\/]/g, '\\$&');
      queryParts.push(`recording:"${cleanTitle}"`);
    }
    if (artist && artist.toLowerCase() !== 'unknown artist') {
      const cleanArtist = artist.replace(/[-+&|!(){}[\]^"~*?:\\/]/g, '\\$&');
      queryParts.push(`artist:"${cleanArtist}"`);
    }

    const luceneQuery = queryParts.join(' AND ');
    const url = `${MUSICBRAINZ_API_BASE}/recording?query=${encodeURIComponent(luceneQuery)}&limit=5&fmt=json`;

    await MusicBrainzProvider.waitForRateLimit();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 429) {
        throw new Error('MusicBrainz rate limit exceeded. Please wait a moment before trying again.');
      }

      if (!res.ok) {
        throw new Error(`MusicBrainz HTTP error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const recordings = Array.isArray(data.recordings) ? data.recordings : [];

      return recordings.map((rec: Record<string, unknown>, index: number) => {
        const recTitle = String(rec.title || title);
        const artistCredit = Array.isArray(rec['artist-credit']) ? rec['artist-credit'] : [];
        const recArtist = artistCredit.map((ac: Record<string, unknown>) => ac.name || '').join(' ') || artist;

        // Extract first valid release (album)
        const releases = Array.isArray(rec.releases) ? rec.releases : [];
        const primaryRelease = releases[0] as Record<string, unknown> | undefined;
        const recAlbum = primaryRelease ? String(primaryRelease.title || '') : '';
        const releaseId = primaryRelease ? String(primaryRelease.id || '') : undefined;

        // Release date / year
        let year: number | undefined;
        const dateStr = String(rec['first-release-date'] || primaryRelease?.date || '');
        if (dateStr && /^\d{4}/.test(dateStr)) {
          year = parseInt(dateStr.substring(0, 4), 10);
        }

        // Track number from medium if available
        let trackNumber: number | undefined;
        if (primaryRelease && Array.isArray(primaryRelease.media)) {
          const media = primaryRelease.media[0] as Record<string, unknown> | undefined;
          if (media && Array.isArray(media.track)) {
            const trk = media.track[0] as Record<string, unknown> | undefined;
            if (trk && typeof trk.number === 'string') {
              trackNumber = parseInt(trk.number, 10);
            }
          }
        }

        // Tags to genre
        const tags = Array.isArray(rec.tags)
          ? rec.tags.map((t: Record<string, unknown>) => {
              const name = String(t.name || '').trim();
              return name.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }).filter(Boolean)
          : [];

        // Compute confidence rationale
        const titleSim = title ? MusicBrainzProvider.calculateSimilarity(title, recTitle) : 0.8;
        const artistSim = artist ? MusicBrainzProvider.calculateSimilarity(artist, recArtist) : 0.8;
        const score = typeof rec.score === 'number' ? rec.score / 100 : 0.8;
        const confidence = Math.min(1.0, Math.round(((titleSim * 0.45) + (artistSim * 0.45) + (score * 0.1)) * 100) / 100);

        let rationale = 'Good match';
        if (titleSim >= 0.95 && artistSim >= 0.95) {
          rationale = 'Exact title and artist match';
        } else if (confidence >= 0.9) {
          rationale = 'High confidence exact recording and artist match';
        } else if (confidence >= 0.7) {
          rationale = 'Fuzzy match on artist or recording name';
        } else {
          rationale = 'Low confidence candidate - verify before approving';
        }

        return {
          id: String(rec.id || `mbid-${index}`),
          title: recTitle,
          artist: recArtist,
          album: recAlbum,
          year,
          trackNumber,
          genre: tags.length > 0 ? tags : undefined,
          releaseId,
          source: 'musicbrainz',
          confidence,
          confidenceRationale: rationale,
        };
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('MusicBrainz request timed out (connection slow or unavailable).');
      }
      throw err;
    }
  }
}
