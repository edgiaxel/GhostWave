/**
 * S8: Online Enrichment Domain Contracts
 * Provider abstraction, rate limits, candidate representations, artwork, and lyrics.
 */

export interface EnrichmentSearchQuery {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  format?: string;
}

export interface EnrichmentCandidate {
  id: string; // Recording MBID or external ID
  title: string;
  artist: string;
  album: string;
  year?: number;
  trackNumber?: number;
  genre?: string[];
  coverArtUrl?: string;
  releaseId?: string; // Release MBID for Cover Art Archive
  source: 'musicbrainz' | 'serpapi' | 'manual';
  confidence: number; // 0.0 to 1.0
  confidenceRationale: string;
}

export interface CoverArtResult {
  thumbnailUrl: string;
  fullUrl: string;
  source: string;
  releaseId?: string;
}

export interface LyricsResult {
  id: string;
  trackName: string;
  artistName: string;
  plainLyrics: string;
  syncedLyrics?: string; // Timestamped LRC string (e.g. "[00:12.34] Lyric line")
  isSynced: boolean;
  source: string;
  disclaimer: string;
}

export interface OnlineEnrichmentProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  searchCandidates(query: EnrichmentSearchQuery): Promise<EnrichmentCandidate[]>;
  fetchCoverArt?(releaseId: string): Promise<CoverArtResult | null>;
  fetchLyrics?(title: string, artist: string): Promise<LyricsResult | null>;
}
