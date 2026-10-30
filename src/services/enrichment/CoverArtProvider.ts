/**
 * S8.3: Cover Art Archive Provider
 * Retrieves open public-domain / CC0 album cover art using MusicBrainz release MBID.
 * Terms & Licensing: Cover Art Archive is a non-profit joint venture with the Internet Archive.
 * Artwork preview is always shown before applying to track metadata.
 */

import { CoverArtResult } from './types';

const COVER_ART_ARCHIVE_BASE = 'https://coverartarchive.org/release';

export class CoverArtProvider {
  /**
   * Fetches the front cover artwork for a MusicBrainz release ID.
   */
  static async fetchCoverArtForRelease(releaseId: string): Promise<CoverArtResult | null> {
    if (!releaseId || !releaseId.trim()) {
      return null;
    }

    const cleanId = releaseId.trim();
    const url = `${COVER_ART_ARCHIVE_BASE}/${cleanId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        // Normal case: release has no community artwork uploaded yet
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const images = Array.isArray(data.images) ? data.images : [];
      if (images.length === 0) return null;

      // Find front cover or fallback to first image
      const frontImage = images.find((img: Record<string, unknown>) => img.front === true) || images[0];

      const fullUrl = String(frontImage.image || '');
      const thumbnails = (frontImage.thumbnails || {}) as Record<string, string>;
      const thumbnailUrl = thumbnails['250'] || thumbnails['500'] || thumbnails.small || fullUrl;

      if (!fullUrl) return null;

      return {
        fullUrl,
        thumbnailUrl,
        source: 'Cover Art Archive (Internet Archive / MusicBrainz)',
        releaseId: cleanId,
      };
    } catch {
      // Offline or network timeout returns null gracefully
      return null;
    }
  }
}
