import { Track, ScanProgress, ScanReport } from '../../types';
import { MetadataService } from '../metadata/MetadataService';
import { IndexedDbRepository } from '../storage/IndexedDbRepository';
import { WebFilePlatform } from '../platform/WebFilePlatform';

export const SUPPORTED_EXTENSIONS = new Set([
  'mp3',
  'flac',
  'ogg',
  'oga',
  'wav',
  'm4a',
  'aac',
  'opus',
]);

export class LibraryScanner {
  private isCancelled = false;

  constructor(
    private repository: IndexedDbRepository,
    private platform?: WebFilePlatform
  ) {}

  cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Deterministic track ID calculation based on file attributes.
   */
  static generateDeterministicTrackId(file: File): string {
    const raw = `${file.name}:${file.size}:${file.lastModified}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `trk-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check if a file has a supported audio extension.
   */
  static isSupportedAudioFile(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    return SUPPORTED_EXTENSIONS.has(ext);
  }

  /**
   * Scan and import an array of audio files into the library.
   */
  async scanFiles(
    files: File[],
    onProgress?: (progress: ScanProgress) => void
  ): Promise<ScanReport> {
    this.isCancelled = false;
    const total = files.length;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let unsupported = 0;
    let unreadable = 0;

    const processedTracks: Track[] = [];
    const errors: Array<{ fileName: string; reason: string }> = [];

    // Pre-load existing track index to detect duplicates/updates
    const existingTracks = await this.repository.getAllTracks();
    const existingMap = new Map(existingTracks.map((t) => [t.id, t]));

    for (let i = 0; i < total; i++) {
      if (this.isCancelled) {
        break;
      }

      const file = files[i];

      onProgress?.({
        scanned: i + 1,
        total,
        currentFile: file.name,
        isScanning: true,
      });

      // 1. Check supported format
      if (!LibraryScanner.isSupportedAudioFile(file)) {
        unsupported++;
        continue;
      }

      const trackId = LibraryScanner.generateDeterministicTrackId(file);

      // Cache file reference for immediate playback and audio graph streaming
      if (this.platform) {
        this.platform.storeFileInMemory(trackId, file);
      }

      try {
        const track = await MetadataService.extractMetadata(file, trackId);

        // Check for duplicates / updates
        const existing = existingMap.get(trackId);
        if (existing) {
          // If already in library with same timestamp and attributes, mark as skipped or updated
          if (existing.lastModified === file.lastModified && existing.fileSizeBytes === file.size) {
            skipped++;
            processedTracks.push(existing);
          } else {
            updated++;
            processedTracks.push(track);
          }
        } else {
          added++;
          processedTracks.push(track);
        }
      } catch (err: unknown) {
        unreadable++;
        const message = err instanceof Error ? err.message : 'Unknown decode failure';
        errors.push({ fileName: file.name, reason: message });
      }
    }

    // Persist newly added or updated tracks to IndexedDB
    if (processedTracks.length > 0) {
      await this.repository.saveTracks(processedTracks);
    }

    onProgress?.({
      scanned: total,
      total,
      currentFile: '',
      isScanning: false,
    });

    return {
      added,
      updated,
      skipped,
      unsupported,
      unreadable,
      tracks: processedTracks,
      errors,
    };
  }

  /**
   * Rescan all current library tracks to verify file presence and update index.
   */
  async rescanLibrary(
    currentTracks: Track[],
    onProgress?: (progress: ScanProgress) => void
  ): Promise<ScanReport> {
    this.isCancelled = false;
    const total = currentTracks.length;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ fileName: string; reason: string }> = [];

    const verifiedTracks: Track[] = [];

    for (let i = 0; i < total; i++) {
      if (this.isCancelled) break;

      const track = currentTracks[i];
      onProgress?.({
        scanned: i + 1,
        total,
        currentFile: track.fileName,
        isScanning: true,
      });

      // Verify availability
      const file = this.platform?.getFileFromMemory(track.id);
      if (file) {
        track.availability = 'available';
        updated++;
      } else {
        // If file handle was lost after reload in browser mode, keep track indexed
        // and retain 'available' or mark 'available' if offline persisted
        skipped++;
      }

      verifiedTracks.push(track);
    }

    await this.repository.saveTracks(verifiedTracks);

    onProgress?.({
      scanned: total,
      total,
      currentFile: '',
      isScanning: false,
    });

    return {
      added: 0,
      updated,
      skipped,
      unsupported: 0,
      unreadable: 0,
      tracks: verifiedTracks,
      errors,
    };
  }
}
