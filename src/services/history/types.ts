/**
 * S10: Listening History & Recommendations Domain Contracts
 * Local-only playback tracking, consistent signal definitions, and transparent recommendations.
 */

import { Track } from '../../types';

export type PlaybackEventType = 'started' | 'completed' | 'skipped';

export interface PlaybackEvent {
  id: string;
  trackId: string;
  timestamp: number; // epoch ms
  eventType: PlaybackEventType;
  durationPlayedSeconds: number;
  trackDurationSeconds: number;
  completedRatio: number; // 0.0 to 1.0
  source?: 'library' | 'playlist' | 'queue' | 'recommendation';
}

export interface GenreStat {
  genre: string;
  count: number;
  durationSeconds: number;
}

export interface ArtistStat {
  artist: string;
  count: number;
  durationSeconds: number;
}

export interface TrackStat {
  trackId: string;
  playCount: number;
  skipCount: number;
  totalDurationSeconds: number;
  lastPlayedAt: number;
}

export interface ListeningStats {
  totalPlays: number;
  totalCompletedPlays: number;
  totalSkips: number;
  skipRate: number; // 0.0 to 1.0
  totalListenTimeSeconds: number;
  topGenres: GenreStat[];
  topArtists: ArtistStat[];
  topTracks: TrackStat[];
  recentEvents: PlaybackEvent[];
}

export type RecommendationBasis =
  | 'genre_affinity'
  | 'artist_affinity'
  | 'unplayed_discovery'
  | 'replay_favorite'
  | 'recent_trend';

export interface RecommendationItem {
  track: Track;
  score: number; // 0.0 to 1.0
  basis: RecommendationBasis;
  rationale: string; // Transparent human-readable explanation
}

export interface HistorySettings {
  enabled: boolean;
  maxEvents: number;
}
