/**
 * S7.3: Local AI Metadata Suggestions Service
 * Uses local model to propose tag corrections strictly from available evidence,
 * assigns explicit confidence ratings, and requires user review before applying.
 */

import { Track, MetadataProposal } from '../../types';
import { LocalAiProvider } from './LocalAiProvider';

export interface RawAiProposal {
  trackId: string;
  field: 'title' | 'artist' | 'album' | 'genre' | 'year' | 'trackNumber';
  proposedValue: string;
  confidence: number;
  evidence: string;
  rationale: string;
}

export interface RawAiProposalResponse {
  proposals: RawAiProposal[];
}

export const AI_METADATA_SCHEMA = {
  type: 'object',
  properties: {
    proposals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trackId: { type: 'string' },
          field: {
            type: 'string',
            enum: ['title', 'artist', 'album', 'genre', 'year', 'trackNumber'],
          },
          proposedValue: { type: 'string' },
          confidence: { type: 'number' },
          evidence: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['trackId', 'field', 'proposedValue', 'confidence', 'evidence', 'rationale'],
        additionalProperties: false,
      },
    },
  },
  required: ['proposals'],
  additionalProperties: false,
};

export class AiMetadataService {
  constructor(private provider: LocalAiProvider) {}

  /**
   * Filters tracks that need metadata attention (missing title, generic filename title, missing artist, etc.)
   */
  static getTracksNeedingAttention(tracks: Track[]): Track[] {
    return tracks.filter((t) => {
      const rawBase = t.fileName.replace(/\.[^/.]+$/, '').trim();
      const hasGenericTitle =
        !t.title || t.title.trim() === '' || t.title === t.fileName || t.title === rawBase;
      const hasUnknownArtist =
        !t.artist || t.artist.trim() === '' || t.artist.toLowerCase() === 'unknown artist';
      const hasUnknownAlbum =
        !t.album || t.album.trim() === '' || t.album.toLowerCase() === 'unknown album';

      return hasGenericTitle || hasUnknownArtist || hasUnknownAlbum;
    });
  }

  /**
   * Compact evidence extraction for a track.
   */
  static serializeTrackEvidence(track: Track) {
    return {
      trackId: track.id,
      fileName: track.fileName,
      format: track.format,
      fileSizeBytes: track.fileSizeBytes,
      currentTitle: track.title,
      currentArtist: track.artist,
      currentAlbum: track.album,
      year: track.year,
    };
  }

  /**
   * Validates raw JSON output from model and constructs clean MetadataProposal objects.
   */
  static processProposals(
    raw: unknown,
    trackPool: Track[]
  ): MetadataProposal[] {
    if (!raw || typeof raw !== 'object') {
      return [];
    }

    const resp = raw as RawAiProposalResponse;
    if (!Array.isArray(resp.proposals)) {
      return [];
    }

    const trackMap = new Map(trackPool.map((t) => [t.id, t]));
    const results: MetadataProposal[] = [];

    resp.proposals.forEach((p, idx) => {
      const trk = trackMap.get(p.trackId);
      if (!trk) {
        // Discard proposals for non-existent track IDs
        return;
      }

      if (!p.field || !p.proposedValue || typeof p.proposedValue !== 'string') {
        return;
      }

      const cleanProposed = p.proposedValue.trim();
      if (!cleanProposed) {
        return;
      }

      let currentVal: string | number | string[] = '';
      switch (p.field) {
        case 'title':
          currentVal = trk.title;
          break;
        case 'artist':
          currentVal = trk.artist;
          break;
        case 'album':
          currentVal = trk.album;
          break;
        case 'genre':
          currentVal = trk.genre || [];
          break;
        case 'year':
          currentVal = trk.year || '';
          break;
        case 'trackNumber':
          currentVal = trk.trackNumber || '';
          break;
      }

      // Do not create proposal if proposed value equals current value
      if (String(currentVal).trim().toLowerCase() === cleanProposed.toLowerCase()) {
        return;
      }

      // Strict confidence clamping
      const rawConf = typeof p.confidence === 'number' ? p.confidence : 0.5;
      const confidence = Math.max(0.1, Math.min(1.0, rawConf));

      results.push({
        id: `prop-ai-${trk.id}-${p.field}-${Date.now()}-${idx}`,
        trackId: trk.id,
        field: p.field,
        currentValue: currentVal,
        proposedValue: cleanProposed,
        source: 'ai_gemma',
        confidence,
        status: 'pending', // Never silently apply; requires explicit user approval
      });
    });

    return results;
  }

  /**
   * Request metadata suggestions from the local AI model.
   */
  async generateMetadataSuggestions(
    tracksToInspect: Track[],
    modelOverride?: string
  ): Promise<MetadataProposal[]> {
    const candidates = AiMetadataService.getTracksNeedingAttention(tracksToInspect).slice(0, 10);
    if (candidates.length === 0) {
      return [];
    }

    const evidenceList = candidates.map(AiMetadataService.serializeTrackEvidence);

    const systemPrompt = `You are GhostWave's offline audio metadata assistant.
Inspect the filename and current tags to propose corrected Title, Artist, Album, Year, or TrackNumber.
Propose values ONLY from strong evidence (e.g. "Artist - Title.mp3").
If inferring with uncertainty, assign a confidence score below 0.6 and clearly note it in rationale.
Output ONLY structured JSON according to the schema.`;

    const promptText = `Evidence for ${evidenceList.length} local audio files needing tags:
${JSON.stringify(evidenceList, null, 2)}

Provide structured proposals for missing or generic fields.`;

    const result = await this.provider.generate(promptText, {
      model: modelOverride,
      systemPrompt,
      format: AI_METADATA_SCHEMA,
      temperature: 0.1,
      timeoutMs: 30000,
    });

    const parsed = result.parsedJson ?? JSON.parse(result.response);
    return AiMetadataService.processProposals(parsed, candidates);
  }
}
