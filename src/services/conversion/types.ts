/**
 * S9: Audio Conversion Domain Contracts & Types
 * Defines supported formats, conversion options, progress states, and validation results.
 */

export type ConversionFormat = 'wav' | 'ogg';

export type SupportedInputFormat = 'mp3' | 'flac' | 'wav' | 'ogg' | 'm4a' | 'aac';

export interface ConversionOptions {
  targetFormat: ConversionFormat;
  sampleRate: 44100 | 48000;
  channels: 1 | 2; // 1 = mono, 2 = stereo
  bitDepth: 16;   // 16-bit PCM for WAV
  namingSuffix?: string; // Default: '_converted'
  customFileName?: string;
  autoImportToLibrary?: boolean;
}

export interface ConversionProgress {
  currentTrackIndex: number;
  totalTracks: number;
  currentTrackTitle: string;
  percent: number; // 0 to 100
  isConverting: boolean;
  statusMessage: string;
}

export interface ConvertedTrackResult {
  trackId: string;
  originalFileName: string;
  outputFileName: string;
  outputFormat: ConversionFormat;
  blob: Blob;
  sizeBytes: number;
  durationSeconds: number;
  success: boolean;
  error?: string;
  isCollision?: boolean;
}

export interface ConversionBatchReport {
  total: number;
  succeeded: number;
  failed: number;
  results: ConvertedTrackResult[];
  durationMs: number;
}
