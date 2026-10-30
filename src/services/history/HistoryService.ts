/**
 * S10: Listening History & Recommendations Service
 * Invariant: Private, 100% offline local event tracking and transparent deterministic recommendations.
 */

import { Track } from '../../types';
import {
  PlaybackEvent,
  PlaybackEventType,
  ListeningStats,
  RecommendationItem,
  GenreStat,
  ArtistStat,
  TrackStat,
} from './types';

export class HistoryService {
  /**
   * Deterministic signal classifier:
   * - Completed Play: played >= 30 seconds OR >= 50% of track length (or ended naturally).
   * - Skip: changed track before 30 seconds AND < 50% played.
   */
  static classifyPlaybackEvent(
    durationPlayedSeconds: number,
    trackDurationSeconds: number,
    isNaturalEnd: boolean
  ): PlaybackEventType {
    if (isNaturalEnd) {
      return 'completed';
    }

    const ratio = trackDurationSeconds > 0 ? durationPlayedSeconds / trackDurationSeconds : 0;
    if (durationPlayedSeconds >= 30 || ratio >= 0.5) {
      return 'completed';
    }

    return 'skipped';
  }

  /**
   * Aggregates raw playback events into comprehensive listening statistics.
   */
  static calculateStats(tracks: Track[], events: PlaybackEvent[]): ListeningStats {
    const trackMap = new Map<string, Track>();
    for (const t of tracks) {
      trackMap.set(t.id, t);
    }

    let totalPlays = 0;
    let totalCompletedPlays = 0;
    let totalSkips = 0;
    let totalListenTimeSeconds = 0;

    const trackStatMap = new Map<string, { plays: number; skips: number; duration: number; lastPlayed: number }>();
    const genreMap = new Map<string, { count: number; duration: number }>();
    const artistMap = new Map<string, { count: number; duration: number }>();

    for (const ev of events) {
      totalListenTimeSeconds += ev.durationPlayedSeconds;

      if (ev.eventType === 'completed' || ev.eventType === 'started') {
        totalPlays++;
      }
      if (ev.eventType === 'completed') {
        totalCompletedPlays++;
      }
      if (ev.eventType === 'skipped') {
        totalSkips++;
      }

      // Track stats
      const existing = trackStatMap.get(ev.trackId) || { plays: 0, skips: 0, duration: 0, lastPlayed: 0 };
      if (ev.eventType === 'completed' || ev.eventType === 'started') {
        existing.plays++;
      }
      if (ev.eventType === 'skipped') {
        existing.skips++;
      }
      existing.duration += ev.durationPlayedSeconds;
      existing.lastPlayed = Math.max(existing.lastPlayed, ev.timestamp);
      trackStatMap.set(ev.trackId, existing);

      // Genre & Artist stats (from track metadata)
      const trk = trackMap.get(ev.trackId);
      if (trk) {
        if (ev.eventType === 'completed') {
          // Artist
          if (trk.artist && trk.artist.toLowerCase() !== 'unknown artist') {
            const aStat = artistMap.get(trk.artist) || { count: 0, duration: 0 };
            aStat.count++;
            aStat.duration += ev.durationPlayedSeconds;
            artistMap.set(trk.artist, aStat);
          }

          // Genres
          if (Array.isArray(trk.genre)) {
            for (const g of trk.genre) {
              const cleanG = g.trim();
              if (cleanG) {
                const gStat = genreMap.get(cleanG) || { count: 0, duration: 0 };
                gStat.count++;
                gStat.duration += ev.durationPlayedSeconds;
                genreMap.set(cleanG, gStat);
              }
            }
          }
        }
      }
    }

    const topGenres: GenreStat[] = Array.from(genreMap.entries())
      .map(([genre, data]) => ({ genre, count: data.count, durationSeconds: data.duration }))
      .sort((a, b) => b.count - a.count || b.durationSeconds - a.durationSeconds)
      .slice(0, 10);

    const topArtists: ArtistStat[] = Array.from(artistMap.entries())
      .map(([artist, data]) => ({ artist, count: data.count, durationSeconds: data.duration }))
      .sort((a, b) => b.count - a.count || b.durationSeconds - a.durationSeconds)
      .slice(0, 10);

    const topTracks: TrackStat[] = Array.from(trackStatMap.entries())
      .map(([trackId, data]) => ({
        trackId,
        playCount: data.plays,
        skipCount: data.skips,
        totalDurationSeconds: data.duration,
        lastPlayedAt: data.lastPlayed,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    const effectiveTotal = totalCompletedPlays + totalSkips;
    const skipRate = effectiveTotal > 0 ? Math.round((totalSkips / effectiveTotal) * 100) / 100 : 0;

    return {
      totalPlays,
      totalCompletedPlays,
      totalSkips,
      skipRate,
      totalListenTimeSeconds: Math.round(totalListenTimeSeconds),
      topGenres,
      topArtists,
      topTracks,
      recentEvents: events.slice(0, 50),
    };
  }

  /**
   * Transparent, deterministic recommendation engine.
   * Prioritizes:
   * 1. Unplayed tracks matching user's top genres/artists (Discovery).
   * 2. Highly completed favorite tracks (Replay).
   * 3. Penalizes tracks with high skip rates.
   * Every recommendation contains an explicit, human-readable rationale.
   */
  static generateRecommendations(
    tracks: Track[],
    events: PlaybackEvent[],
    limit = 10
  ): RecommendationItem[] {
    const availableTracks = tracks.filter((t) => t.availability === 'available');
    if (availableTracks.length === 0) {
      return [];
    }

    const stats = HistoryService.calculateStats(availableTracks, events);
    const topGenreNames = new Set(stats.topGenres.slice(0, 3).map((g) => g.genre.toLowerCase()));
    const topArtistNames = new Set(stats.topArtists.slice(0, 3).map((a) => a.artist.toLowerCase()));

    const trackStatMap = new Map<string, TrackStat>();
    for (const ts of stats.topTracks) {
      trackStatMap.set(ts.trackId, ts);
    }

    // If zero history exists, recommend highest quality/duration tracks as initial discovery
    if (events.length === 0) {
      return availableTracks.slice(0, limit).map((t, idx) => ({
        track: t,
        score: Math.max(0.5, 0.9 - idx * 0.05),
        basis: 'unplayed_discovery',
        rationale: 'Fresh track from your offline library, ready to explore.',
      }));
    }

    const candidates: RecommendationItem[] = [];

    for (const trk of availableTracks) {
      const stat = trackStatMap.get(trk.id);
      const playCount = stat?.playCount || 0;
      const skipCount = stat?.skipCount || 0;

      // Heavy skip penalty: if skipped more than completed, skip recommendation
      if (skipCount > 2 && skipCount > playCount) {
        continue;
      }

      let score = 0.0;
      let basis: RecommendationItem['basis'] = 'unplayed_discovery';
      let rationale = '';

      const matchesGenre = trk.genre?.some((g) => topGenreNames.has(g.toLowerCase()));
      const matchesArtist = topArtistNames.has(trk.artist.toLowerCase());

      if (playCount === 0) {
        // Discovery item
        if (matchesArtist && matchesGenre) {
          score = 0.95;
          basis = 'unplayed_discovery';
          rationale = `Unplayed track from your favorite artist "${trk.artist}" and top genre.`;
        } else if (matchesArtist) {
          score = 0.90;
          basis = 'artist_affinity';
          rationale = `Unplayed track by "${trk.artist}", one of your most-listened artists.`;
        } else if (matchesGenre) {
          score = 0.85;
          basis = 'genre_affinity';
          const gName = trk.genre?.find((g) => topGenreNames.has(g.toLowerCase())) || 'your top genre';
          rationale = `Matches your frequent genre "${gName}".`;
        } else {
          score = 0.50;
          basis = 'unplayed_discovery';
          rationale = 'Unexplored track in your collection.';
        }
      } else {
        // Replay favorite
        if (playCount >= 3 && skipCount === 0) {
          score = 0.88;
          basis = 'replay_favorite';
          rationale = `Completed ${playCount} times with zero skips.`;
        } else if (playCount >= 2) {
          score = 0.75;
          basis = 'recent_trend';
          rationale = `Frequently enjoyed track (${playCount} plays).`;
        } else {
          score = 0.60;
          basis = 'recent_trend';
          rationale = 'Revisit track from your listening sessions.';
        }
      }

      candidates.push({
        track: trk,
        score: Math.round(score * 100) / 100,
        basis,
        rationale,
      });
    }

    // Sort by descending score
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit);
  }

  /**
   * Generates a deterministic or AI-assisted summary of the user's taste profile.
   * Invariant: Operates 100% offline.
   */
  static generateTasteProfileSummary(stats: ListeningStats): string {
    if (stats.totalPlays === 0) {
      return 'No listening history yet. Play tracks to build your private offline music profile.';
    }

    const hours = Math.floor(stats.totalListenTimeSeconds / 3600);
    const mins = Math.floor((stats.totalListenTimeSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const topGenre = stats.topGenres[0]?.genre;
    const topArtist = stats.topArtists[0]?.artist;

    if (topGenre && topArtist) {
      return `Listened to ${timeStr} across ${stats.totalPlays} sessions. Heavy affinity for ${topGenre} and artist ${topArtist} with a low ${Math.round(stats.skipRate * 100)}% skip rate.`;
    }

    if (topGenre) {
      return `Listened to ${timeStr} across ${stats.totalPlays} sessions, primarily focused in ${topGenre}.`;
    }

    return `Listened to ${timeStr} across ${stats.totalPlays} sessions with a ${Math.round(stats.skipRate * 100)}% skip rate.`;
  }
}
