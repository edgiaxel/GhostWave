import { Track, OperationResult } from '../../types';

export interface RenamePreviewItem {
  trackId: string;
  currentFileName: string;
  proposedFileName: string;
  status: 'valid' | 'collision' | 'invalid_characters' | 'missing_field' | 'unchanged';
  reason?: string;
}

export interface MetadataValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export class MetadataEditService {
  private static INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

  /**
   * Validate proposed metadata updates before applying.
   */
  static validate(updates: Partial<Track>): MetadataValidationResult {
    const errors: Record<string, string> = {};

    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim() === '') {
        errors.title = 'Title cannot be blank';
      } else if (updates.title.length > 255) {
        errors.title = 'Title exceeds maximum length of 255 characters';
      }
    }

    if (updates.artist !== undefined) {
      if (!updates.artist || updates.artist.trim() === '') {
        errors.artist = 'Artist cannot be blank';
      } else if (updates.artist.length > 255) {
        errors.artist = 'Artist exceeds maximum length of 255 characters';
      }
    }

    if (updates.album !== undefined && updates.album.length > 255) {
      errors.album = 'Album name exceeds maximum length of 255 characters';
    }

    if (updates.year !== undefined && updates.year !== null) {
      const yearNum = Number(updates.year);
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > 2100) {
        errors.year = 'Year must be a valid 4-digit year between 1800 and 2100';
      }
    }

    if (updates.trackNumber !== undefined && updates.trackNumber !== null) {
      const trackNum = Number(updates.trackNumber);
      if (isNaN(trackNum) || trackNum < 1 || trackNum > 999) {
        errors.trackNumber = 'Track number must be an integer between 1 and 999';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Generates a preview of new filenames according to a template pattern.
   * Detects collisions, invalid characters, and missing required tokens safely.
   */
  static generateRenamePreview(
    tracks: Track[],
    template = '{artist} - {title}'
  ): RenamePreviewItem[] {
    const results: RenamePreviewItem[] = [];
    const proposedNameCounts = new Map<string, number>();

    for (const track of tracks) {
      const extMatch = track.fileName.match(/\.[^/.]+$/);
      const ext = extMatch ? extMatch[0] : `.${track.format}`;

      // Check required tokens
      const hasArtistToken = template.includes('{artist}');
      const hasTitleToken = template.includes('{title}');
      const hasAlbumToken = template.includes('{album}');

      if (hasArtistToken && (!track.artist || track.artist === 'Unknown Artist')) {
        results.push({
          trackId: track.id,
          currentFileName: track.fileName,
          proposedFileName: track.fileName,
          status: 'missing_field',
          reason: 'Template requires {artist}, but track artist is unknown',
        });
        continue;
      }

      if (hasTitleToken && (!track.title || track.title === track.fileName)) {
        results.push({
          trackId: track.id,
          currentFileName: track.fileName,
          proposedFileName: track.fileName,
          status: 'missing_field',
          reason: 'Template requires {title}, but track title is unknown',
        });
        continue;
      }

      if (hasAlbumToken && !track.album) {
        results.push({
          trackId: track.id,
          currentFileName: track.fileName,
          proposedFileName: track.fileName,
          status: 'missing_field',
          reason: 'Template requires {album}, but track album is blank',
        });
        continue;
      }

      // Format proposed base name
      const trackNumStr = track.trackNumber ? String(track.trackNumber).padStart(2, '0') : '';
      let baseName = template
        .replace(/{artist}/g, track.artist || '')
        .replace(/{title}/g, track.title || '')
        .replace(/{album}/g, track.album || '')
        .replace(/{trackNumber}/g, trackNumStr)
        .replace(/{year}/g, track.year ? String(track.year) : '')
        .trim();

      // Clean multiple spaces
      baseName = baseName.replace(/\s+/g, ' ');

      // Check for illegal filename characters
      if (this.INVALID_FILENAME_CHARS.test(baseName)) {
        results.push({
          trackId: track.id,
          currentFileName: track.fileName,
          proposedFileName: `${baseName}${ext}`,
          status: 'invalid_characters',
          reason: 'Proposed filename contains illegal filesystem characters (<>:"/\\|?*)',
        });
        continue;
      }

      const proposedFullName = `${baseName}${ext}`;

      if (proposedFullName === track.fileName) {
        results.push({
          trackId: track.id,
          currentFileName: track.fileName,
          proposedFileName: proposedFullName,
          status: 'unchanged',
          reason: 'File already matches the naming template',
        });
        continue;
      }

      // Track occurrences for collision detection
      const count = proposedNameCounts.get(proposedFullName.toLowerCase()) || 0;
      proposedNameCounts.set(proposedFullName.toLowerCase(), count + 1);

      results.push({
        trackId: track.id,
        currentFileName: track.fileName,
        proposedFileName: proposedFullName,
        status: 'valid',
      });
    }

    // Mark collisions where multiple tracks generate the exact same filename
    for (const item of results) {
      if (item.status === 'valid') {
        const count = proposedNameCounts.get(item.proposedFileName.toLowerCase()) || 0;
        if (count > 1) {
          item.status = 'collision';
          item.reason = 'Naming conflict: multiple tracks would receive this exact filename';
        }
      }
    }

    return results;
  }

  /**
   * Apply metadata changes to track object while safely preserving immutable attributes.
   */
  static applyMetadata(track: Track, updates: Partial<Track>): OperationResult<Track> {
    const validation = this.validate(updates);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return {
        success: false,
        error: firstError,
        message: 'Metadata validation failed',
      };
    }

    const updatedTrack: Track = {
      ...track,
      ...updates,
      // Immutable identity preservation: never alter track.id, format, or availability
      id: track.id,
      format: track.format,
      availability: track.availability,
      lastModified: Date.now(),
    };

    return {
      success: true,
      data: updatedTrack,
    };
  }
}
