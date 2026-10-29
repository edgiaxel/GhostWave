/**
 * Operation result wrapper for deterministic and safe error handling.
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  partialFailures?: Array<{ id: string; reason: string }>;
}

/**
 * Core Track representation in the library.
 */
export interface Track {
  id: string;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  lastModified: number;
  format: 'mp3' | 'flac' | 'ogg' | 'wav' | 'm4a' | 'aac' | 'unknown';
  title: string;
  artist: string;
  album: string;
  albumArtist?: string;
  genre: string[];
  year?: number;
  trackNumber?: number;
  diskNumber?: number;
  durationSeconds: number;
  bitrateKbps?: number;
  sampleRateHz?: number;
  hasEmbeddedPicture: boolean;
  pictureMimeType?: string;
  pictureDataUrl?: string;
  availability: 'available' | 'missing' | 'unreadable';
  addedAt: number;
  favorite?: boolean;
}

/**
 * Playlist representation.
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  isAiGenerated?: boolean;
  icon?: string;
}

/**
 * Playback Queue Item.
 */
export interface QueueItem {
  queueId: string;
  trackId: string;
  addedAt: number;
}

/**
 * Transport playback state.
 */
export interface PlaybackState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTimeSeconds: number;
  durationSeconds: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  shuffle: boolean;
}

/**
 * Proposed metadata changes requiring user review before application.
 */
export interface MetadataProposal {
  id: string;
  trackId: string;
  field: 'title' | 'artist' | 'album' | 'genre' | 'year' | 'trackNumber' | 'fileName';
  currentValue: string | number | string[];
  proposedValue: string | number | string[];
  source: 'ai_gemma' | 'online_musicbrainz' | 'filename_heuristic' | 'manual';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

/**
 * Health issues detected in the local library.
 */
export interface LibraryIssue {
  id: string;
  trackId: string;
  issueType: 'missing_tags' | 'inconsistent_naming' | 'potential_duplicate' | 'unreadable_file';
  severity: 'low' | 'medium' | 'high';
  description: string;
  details?: Record<string, unknown>;
  suggestedAction?: string;
}

/**
 * Application Settings.
 */
export interface AppSettings {
  theme: 'halloween-dark' | 'halloween-light';
  accentPalette: 'pumpkin-orange' | 'spectral-green' | 'witch-violet' | 'blood-moon-red';
  localAi: {
    enabled: boolean;
    endpoint: string;
    model: string;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
  };
  onlineEnrichment: {
    enabled: boolean;
    provider: 'musicbrainz' | 'none';
    lookupAlbumArt: boolean;
  };
  visualizer: {
    preset: 'spectral_bars' | 'ghost_pulse' | 'waveform_rings';
    sensitivity: number;
    colorCycle: boolean;
  };
  library: {
    autoScanOnStartup: boolean;
    renamePattern: string;
  };
}

/**
 * Supported deck route identifiers.
 */
export type AppRoute =
  | 'library'
  | 'playlists'
  | 'health-cleanup'
  | 'audio-visualizer'
  | 'local-ai-assistant'
  | 'history'
  | 'settings-platform'
  | 'unknown';
