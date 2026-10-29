import * as mm from 'music-metadata-browser';
import { Track } from '../../types';

export class MetadataService {
  /**
   * Determine audio format enum from file extension or mime type.
   */
  static getFormatFromFileName(fileName: string): Track['format'] {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp3':
        return 'mp3';
      case 'flac':
        return 'flac';
      case 'ogg':
      case 'oga':
        return 'ogg';
      case 'wav':
        return 'wav';
      case 'm4a':
        return 'm4a';
      case 'aac':
        return 'aac';
      default:
        return 'unknown';
    }
  }

  /**
   * Heuristic title/artist extraction from filename when tags are missing.
   */
  static parseFilenameHeuristic(fileName: string): { title: string; artist: string } {
    // Strip extension
    const baseName = fileName.replace(/\.[^/.]+$/, '').trim();

    // Check for "Artist - Title" or "01 - Artist - Title" pattern
    const parts = baseName.split(' - ').map((p) => p.trim());
    if (parts.length >= 3) {
      // e.g. "01 - The Police - Ghost In The Machine"
      return { artist: parts[1], title: parts.slice(2).join(' - ') };
    }
    if (parts.length === 2) {
      // e.g. "The Police - Ghost In The Machine"
      return { artist: parts[0], title: parts[1] };
    }

    return {
      title: baseName || 'Untitled Track',
      artist: 'Unknown Artist',
    };
  }

  /**
   * Parse an audio File or Blob and extract standardized metadata.
   */
  static async extractMetadata(file: File, trackId: string): Promise<Track> {
    const format = this.getFormatFromFileName(file.name);
    const heuristic = this.parseFilenameHeuristic(file.name);

    let title = heuristic.title;
    let artist = heuristic.artist;
    let album = 'Unknown Album';
    let albumArtist: string | undefined;
    let genre: string[] = [];
    let year: number | undefined;
    let trackNumber: number | undefined;
    let diskNumber: number | undefined;
    let durationSeconds = 0;
    let bitrateKbps: number | undefined;
    let sampleRateHz: number | undefined;
    let hasEmbeddedPicture = false;
    let pictureMimeType: string | undefined;
    let pictureDataUrl: string | undefined;

    try {
      const parsed = await mm.parseBlob(file, { skipCovers: false });
      const common = parsed.common;
      const fmt = parsed.format;

      if (common.title && common.title.trim()) {
        title = common.title.trim();
      }
      if (common.artist && common.artist.trim()) {
        artist = common.artist.trim();
      }
      if (common.album && common.album.trim()) {
        album = common.album.trim();
      }
      if (common.albumartist && common.albumartist.trim()) {
        albumArtist = common.albumartist.trim();
      }
      if (common.genre && common.genre.length > 0) {
        genre = common.genre.filter(Boolean);
      }
      if (common.year) {
        year = common.year;
      }
      if (common.track?.no) {
        trackNumber = common.track.no;
      }
      if (common.disk?.no) {
        diskNumber = common.disk.no;
      }

      if (fmt.duration) {
        durationSeconds = Math.round(fmt.duration);
      }
      if (fmt.bitrate) {
        bitrateKbps = Math.round(fmt.bitrate / 1000);
      }
      if (fmt.sampleRate) {
        sampleRateHz = fmt.sampleRate;
      }

      // Extract embedded cover artwork if present
      if (common.picture && common.picture.length > 0) {
        const pic = common.picture[0];
        hasEmbeddedPicture = true;
        pictureMimeType = pic.format;

        // Convert picture buffer to base64 data URL
        try {
          const base64String = this.uint8ArrayToBase64(pic.data);
          pictureDataUrl = `data:${pic.format};base64,${base64String}`;
        } catch {
          // If base64 conversion fails, fallback gracefully
        }
      }
    } catch {
      // Parsing error: fall back to filename heuristics and basic file stats
    }

    return {
      id: trackId,
      filePath: file.name,
      fileName: file.name,
      fileSizeBytes: file.size,
      lastModified: file.lastModified,
      format,
      title,
      artist,
      album,
      albumArtist,
      genre,
      year,
      trackNumber,
      diskNumber,
      durationSeconds,
      bitrateKbps,
      sampleRateHz,
      hasEmbeddedPicture,
      pictureMimeType,
      pictureDataUrl,
      availability: 'available',
      addedAt: Date.now(),
    };
  }

  private static uint8ArrayToBase64(uint8: Uint8Array): string {
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
}
