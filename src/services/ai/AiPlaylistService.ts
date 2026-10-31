/**
 * S7.2: Natural-Language Playlist Query Service
 * Defines strict schema, compact metadata serialization, model output validation,
 * deterministic constraint calculation, and hallucination rejection.
 */

import { Track, Playlist } from '../../types';
import { LocalAiProvider } from './LocalAiProvider';
import { sentryTelemetry } from '../telemetry/SentryTelemetry';

export interface PlaylistQueryPlan {
  name: string;
  description?: string;
  filters?: {
    genres?: string[];
    artists?: string[];
    albums?: string[];
    formats?: string[];
    minBitrateKbps?: number;
    yearMin?: number;
    yearMax?: number;
    keywords?: string[];
  };
  constraints?: {
    maxDurationMinutes?: number;
    minDurationMinutes?: number;
    maxTracks?: number;
  };
  matchedTrackIds: string[];
  explanation: string;
}

export interface CompactTrackSummary {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre?: string[];
  durationSeconds: number;
  format: string;
  bitrateKbps?: number;
  year?: number;
}

export interface PlaylistProposalResult {
  plan: PlaylistQueryPlan;
  resolvedTracks: Track[];
  totalDurationSeconds: number;
  formattedDuration: string;
  hallucinatedTrackIds: string[];
  isAiGenerated: boolean;
  modelUsed: string;
  durationMs: number;
}

export const PLAYLIST_QUERY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    filters: {
      type: 'object',
      properties: {
        genres: { type: 'array', items: { type: 'string' } },
        artists: { type: 'array', items: { type: 'string' } },
        albums: { type: 'array', items: { type: 'string' } },
        formats: { type: 'array', items: { type: 'string' } },
        minBitrateKbps: { type: 'number' },
        yearMin: { type: 'number' },
        yearMax: { type: 'number' },
        keywords: { type: 'array', items: { type: 'string' } },
      },
      additionalProperties: false,
    },
    constraints: {
      type: 'object',
      properties: {
        maxDurationMinutes: { type: 'number' },
        minDurationMinutes: { type: 'number' },
        maxTracks: { type: 'number' },
      },
      additionalProperties: false,
    },
    matchedTrackIds: {
      type: 'array',
      items: { type: 'string' },
    },
    explanation: { type: 'string' },
  },
  required: ['name', 'matchedTrackIds', 'explanation'],
  additionalProperties: false,
};

export class AiPlaylistService {
  constructor(private provider: LocalAiProvider) {}

  /**
   * Serializes only necessary metadata for inference. Never sends audio bytes or local file paths.
   */
  static serializeLibrary(tracks: Track[]): CompactTrackSummary[] {
    return tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      genre: t.genre && t.genre.length > 0 ? t.genre : undefined,
      durationSeconds: t.durationSeconds,
      format: t.format,
      bitrateKbps: t.bitrateKbps,
      year: t.year,
    }));
  }

  /**
   * Validates raw JSON output from model against the strict plan schema.
   * Rejects unknown fields or non-conforming data types.
   */
  static validatePlan(raw: unknown): PlaylistQueryPlan {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Model output is not a valid JSON object.');
    }

    const obj = raw as Record<string, unknown>;

    if (typeof obj.name !== 'string' || !obj.name.trim()) {
      throw new Error('Plan is missing required string property: name');
    }

    if (!Array.isArray(obj.matchedTrackIds)) {
      throw new Error('Plan is missing required array property: matchedTrackIds');
    }

    if (typeof obj.explanation !== 'string') {
      throw new Error('Plan is missing required string property: explanation');
    }

    const matchedTrackIds = obj.matchedTrackIds
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id) => id.trim());

    const plan: PlaylistQueryPlan = {
      name: obj.name.trim(),
      description: typeof obj.description === 'string' ? obj.description.trim() : undefined,
      matchedTrackIds,
      explanation: obj.explanation.trim(),
    };

    if (obj.filters && typeof obj.filters === 'object' && !Array.isArray(obj.filters)) {
      const f = obj.filters as Record<string, unknown>;
      plan.filters = {
        genres: Array.isArray(f.genres) ? f.genres.filter((g): g is string => typeof g === 'string') : undefined,
        artists: Array.isArray(f.artists) ? f.artists.filter((a): a is string => typeof a === 'string') : undefined,
        albums: Array.isArray(f.albums) ? f.albums.filter((al): al is string => typeof al === 'string') : undefined,
        formats: Array.isArray(f.formats) ? f.formats.filter((fmt): fmt is string => typeof fmt === 'string') : undefined,
        minBitrateKbps: typeof f.minBitrateKbps === 'number' ? f.minBitrateKbps : undefined,
        yearMin: typeof f.yearMin === 'number' ? f.yearMin : undefined,
        yearMax: typeof f.yearMax === 'number' ? f.yearMax : undefined,
        keywords: Array.isArray(f.keywords) ? f.keywords.filter((k): k is string => typeof k === 'string') : undefined,
      };
    }

    if (obj.constraints && typeof obj.constraints === 'object' && !Array.isArray(obj.constraints)) {
      const c = obj.constraints as Record<string, unknown>;
      plan.constraints = {
        maxDurationMinutes: typeof c.maxDurationMinutes === 'number' ? c.maxDurationMinutes : undefined,
        minDurationMinutes: typeof c.minDurationMinutes === 'number' ? c.minDurationMinutes : undefined,
        maxTracks: typeof c.maxTracks === 'number' ? c.maxTracks : undefined,
      };
    }

    return plan;
  }

  /**
   * Resolves proposed track IDs deterministically against library tracks:
   * 1. Filters out hallucinated / non-existent track IDs.
   * 2. If track IDs array was empty, applies search filters to match candidate tracks.
   * 3. Calculates total duration and enforces duration/track-count limits deterministically.
   */
  static resolveTracks(plan: PlaylistQueryPlan, allTracks: Track[]): {
    resolvedTracks: Track[];
    totalDurationSeconds: number;
    hallucinatedTrackIds: string[];
  } {
    const trackMap = new Map(allTracks.map((t) => [t.id, t]));
    const matched: Track[] = [];
    const hallucinatedTrackIds: string[] = [];

    // Step 1: Resolve explicit track IDs
    for (const id of plan.matchedTrackIds) {
      const trk = trackMap.get(id);
      if (trk) {
        if (!matched.some((m) => m.id === trk.id)) {
          matched.push(trk);
        }
      } else {
        hallucinatedTrackIds.push(id);
      }
    }

    // Step 2: Fallback filter match if model provided filters but missed track IDs
    if (matched.length === 0 && plan.filters) {
      const { genres, formats, minBitrateKbps, keywords } = plan.filters;

      for (const trk of allTracks) {
        let fits = true;

        if (formats && formats.length > 0 && !formats.includes(trk.format)) {
          fits = false;
        }

        if (minBitrateKbps && (trk.bitrateKbps || 0) < minBitrateKbps) {
          fits = false;
        }

        if (genres && genres.length > 0) {
          const trackGenres = (trk.genre || []).map((g) => g.toLowerCase());
          const hasGenre = genres.some((g) => trackGenres.includes(g.toLowerCase()));
          if (!hasGenre) fits = false;
        }

        if (keywords && keywords.length > 0) {
          const hay = `${trk.title} ${trk.artist} ${trk.album}`.toLowerCase();
          const hasKw = keywords.some((k) => hay.includes(k.toLowerCase()));
          if (!hasKw) fits = false;
        }

        if (fits && !matched.some((m) => m.id === trk.id)) {
          matched.push(trk);
        }
      }
    }

    // Step 3: Enforce constraints deterministically (never trust model arithmetic)
    let finalTracks = [...matched];

    if (plan.constraints?.maxTracks && plan.constraints.maxTracks > 0) {
      finalTracks = finalTracks.slice(0, plan.constraints.maxTracks);
    }

    if (plan.constraints?.maxDurationMinutes && plan.constraints.maxDurationMinutes > 0) {
      const maxSeconds = plan.constraints.maxDurationMinutes * 60;
      const capped: Track[] = [];
      let cumulative = 0;

      for (const t of finalTracks) {
        if (cumulative + t.durationSeconds <= maxSeconds || capped.length === 0) {
          capped.push(t);
          cumulative += t.durationSeconds;
        } else {
          break;
        }
      }
      finalTracks = capped;
    }

    const totalDurationSeconds = finalTracks.reduce((acc, t) => acc + t.durationSeconds, 0);

    return {
      resolvedTracks: finalTracks,
      totalDurationSeconds,
      hallucinatedTrackIds,
    };
  }

  /**
   * Execute natural-language query to generate a playlist proposal.
   */
  async generatePlaylistProposal(
    query: string,
    libraryTracks: Track[],
    modelOverride?: string
  ): Promise<PlaylistProposalResult> {
    if (!query.trim()) {
      throw new Error('Query cannot be blank.');
    }

    const compactCatalog = AiPlaylistService.serializeLibrary(libraryTracks);
    const systemPrompt = `You are GhostWave's offline playlist curator assistant.
Your task is to analyze user requests and select tracks from the provided local library catalog.
You MUST output structured JSON conforming to the requested schema.
Select ONLY track IDs that exist in the catalog.
Do not invent track IDs, artists, or titles.`;

    const promptText = `User Playlist Request: "${query}"

Available Library Catalog (${compactCatalog.length} tracks):
${JSON.stringify(compactCatalog)}

Select appropriate tracks, choose an evocative crate name, and describe your curation rationale.`;

    const startTime = Date.now();
    const modelTarget = modelOverride || 'default';
    sentryTelemetry.captureAiRequestStarted({ model: modelTarget, taskType: 'playlist_proposal' });

    let result;
    try {
      result = await this.provider.generate(promptText, {
        model: modelOverride,
        systemPrompt,
        format: PLAYLIST_QUERY_SCHEMA,
        temperature: 0.2,
        timeoutMs: 30000,
      });

      sentryTelemetry.captureAiRequestCompleted({
        model: result.model || modelTarget,
        taskType: 'playlist_proposal',
        durationMs: result.durationMs || (Date.now() - startTime),
        success: true,
      });
    } catch (err: unknown) {
      sentryTelemetry.captureAiRequestCompleted({
        model: modelTarget,
        taskType: 'playlist_proposal',
        durationMs: Date.now() - startTime,
        success: false,
      });
      throw err;
    }

    let parsed;
    try {
      parsed = result.parsedJson ?? JSON.parse(result.response);
    } catch (err: unknown) {
      sentryTelemetry.captureAiResponseInvalid({
        model: result.model || modelTarget,
        category: 'json_syntax_error',
        reason: err instanceof Error ? err.message : 'JSON parse failure',
      });
      throw err;
    }

    let plan: PlaylistQueryPlan;
    try {
      plan = AiPlaylistService.validatePlan(parsed);
    } catch (err: unknown) {
      sentryTelemetry.captureAiResponseInvalid({
        model: result.model || modelTarget,
        category: 'schema_validation_error',
        reason: err instanceof Error ? err.message : 'Plan schema violation',
      });
      throw err;
    }

    const { resolvedTracks, totalDurationSeconds, hallucinatedTrackIds } =
      AiPlaylistService.resolveTracks(plan, libraryTracks);

    if (hallucinatedTrackIds.length > 0) {
      sentryTelemetry.captureAiTrackRejected({
        model: result.model || modelTarget,
        rejectedCount: hallucinatedTrackIds.length,
      });
    }

    sentryTelemetry.captureAiPlaylistGenerated({
      model: result.model || modelTarget,
      proposedTrackCount: resolvedTracks.length,
      durationSeconds: totalDurationSeconds,
    });

    const minutes = Math.floor(totalDurationSeconds / 60);
    const seconds = totalDurationSeconds % 60;
    const formattedDuration = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

    return {
      plan,
      resolvedTracks,
      totalDurationSeconds,
      formattedDuration,
      hallucinatedTrackIds,
      isAiGenerated: true,
      modelUsed: result.model,
      durationMs: result.durationMs,
    };
  }

  /**
   * Helper to build a confirmed Playlist entity ready to be saved to IndexedDB.
   */
  static buildPlaylistFromProposal(
    proposal: PlaylistProposalResult,
    accentColor = 'witch-violet',
    icon = 'queue_music'
  ): Playlist {
    return {
      id: `pl-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: proposal.plan.name,
      description: proposal.plan.description || proposal.plan.explanation,
      trackIds: proposal.resolvedTracks.map((t) => t.id),
      isAiGenerated: true,
      icon,
      accentColor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}
