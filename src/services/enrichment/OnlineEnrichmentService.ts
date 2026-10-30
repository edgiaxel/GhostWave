/**
 * S8: Online Enrichment Service
 * Orchestrates external lookups from MusicBrainz, Cover Art Archive, LRCLIB, and optional SerpApi.
 * Guarantees failure tolerance: all network calls degrade gracefully without interfering with core playback.
 */

import { Track, MetadataProposal } from '../../types';
import { MusicBrainzProvider } from './MusicBrainzProvider';
import { CoverArtProvider } from './CoverArtProvider';
import { LrclibProvider } from './LrclibProvider';
import { SerpApiProvider } from './SerpApiProvider';
import {
  EnrichmentCandidate,
  EnrichmentSearchQuery,
  CoverArtResult,
  LyricsResult,
} from './types';

export class OnlineEnrichmentService {
  private musicBrainz = new MusicBrainzProvider();
  private serpApi = new SerpApiProvider();

  constructor(serpApiKey?: string) {
    if (serpApiKey) {
      this.serpApi.setApiKey(serpApiKey);
    }
  }

  setSerpApiKey(key: string) {
    this.serpApi.setApiKey(key);
  }

  /**
   * Search for candidate metadata matches across available providers.
   */
  async searchCandidates(
    query: EnrichmentSearchQuery,
    preferProvider?: 'musicbrainz' | 'serpapi'
  ): Promise<EnrichmentCandidate[]> {
    const candidates: EnrichmentCandidate[] = [];

    // Priority 1: MusicBrainz (Open structured database)
    if (preferProvider !== 'serpapi') {
      try {
        const mbResults = await this.musicBrainz.searchCandidates(query);
        candidates.push(...mbResults);
      } catch (err: unknown) {
        console.warn('GhostWave: MusicBrainz search fallback:', err);
      }
    }

    // Priority 2: SerpApi fallback (if configured and few/no results)
    if ((candidates.length === 0 || preferProvider === 'serpapi') && this.serpApi.hasValidKey()) {
      try {
        const serpResults = await this.serpApi.searchCandidates(query);
        candidates.push(...serpResults);
      } catch (err: unknown) {
        console.warn('GhostWave: SerpApi search fallback:', err);
      }
    }

    return candidates;
  }

  /**
   * Fetch album artwork from Cover Art Archive using release MBID.
   */
  async fetchCoverArt(releaseId: string): Promise<CoverArtResult | null> {
    return CoverArtProvider.fetchCoverArtForRelease(releaseId);
  }

  /**
   * Fetch plain and synchronized lyrics from LRCLIB.
   */
  async fetchLyrics(
    title: string,
    artist: string,
    album?: string,
    durationSeconds?: number
  ): Promise<LyricsResult | null> {
    return LrclibProvider.fetchLyrics(title, artist, album, durationSeconds);
  }

  /**
   * Converts a candidate match into standard MetadataProposal objects for review.
   * Invariant: Never silently writes to track or files.
   */
  static buildProposalsFromCandidate(
    track: Track,
    candidate: EnrichmentCandidate
  ): MetadataProposal[] {
    const proposals: MetadataProposal[] = [];
    const source = candidate.source === 'musicbrainz' ? 'online_musicbrainz' : 'manual';

    if (candidate.title && candidate.title !== track.title) {
      proposals.push({
        id: `prop-online-${track.id}-title-${Date.now()}`,
        trackId: track.id,
        field: 'title',
        currentValue: track.title,
        proposedValue: candidate.title,
        source,
        confidence: candidate.confidence,
        status: 'pending',
      });
    }

    if (candidate.artist && candidate.artist !== track.artist) {
      proposals.push({
        id: `prop-online-${track.id}-artist-${Date.now()}`,
        trackId: track.id,
        field: 'artist',
        currentValue: track.artist,
        proposedValue: candidate.artist,
        source,
        confidence: candidate.confidence,
        status: 'pending',
      });
    }

    if (candidate.album && candidate.album !== track.album) {
      proposals.push({
        id: `prop-online-${track.id}-album-${Date.now()}`,
        trackId: track.id,
        field: 'album',
        currentValue: track.album,
        proposedValue: candidate.album,
        source,
        confidence: candidate.confidence,
        status: 'pending',
      });
    }

    if (candidate.year && candidate.year !== track.year) {
      proposals.push({
        id: `prop-online-${track.id}-year-${Date.now()}`,
        trackId: track.id,
        field: 'year',
        currentValue: track.year || '',
        proposedValue: candidate.year,
        source,
        confidence: candidate.confidence,
        status: 'pending',
      });
    }

    if (candidate.trackNumber && candidate.trackNumber !== track.trackNumber) {
      proposals.push({
        id: `prop-online-${track.id}-trackNumber-${Date.now()}`,
        trackId: track.id,
        field: 'trackNumber',
        currentValue: track.trackNumber || '',
        proposedValue: candidate.trackNumber,
        source,
        confidence: candidate.confidence,
        status: 'pending',
      });
    }

    return proposals;
  }
}
