/**
 * S8.3: LRCLIB Open Lyrics Provider
 * Fetches free community lyrics distinguishing plain text from synchronized LRC timestamps.
 * Terms & Licensing: Community database. For personal offline playback only; not for redistribution.
 */

import { LyricsResult } from './types';

const LRCLIB_API_BASE = 'https://lrclib.net/api/get';

export class LrclibProvider {
  /**
   * Fetches plain and synced lyrics for a given track title and artist.
   */
  static async fetchLyrics(
    trackTitle: string,
    artistName: string,
    albumName?: string,
    durationSeconds?: number
  ): Promise<LyricsResult | null> {
    const cleanTitle = trackTitle.trim();
    const cleanArtist = artistName.trim();

    if (!cleanTitle || !cleanArtist || cleanArtist.toLowerCase() === 'unknown artist') {
      return null;
    }

    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });

    if (albumName && albumName.toLowerCase() !== 'unknown album') {
      params.append('album_name', albumName.trim());
    }

    if (durationSeconds && durationSeconds > 0) {
      params.append('duration', Math.round(durationSeconds).toString());
    }

    const url = `${LRCLIB_API_BASE}?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'GhostWave/0.9.0 ( https://github.com/edgiaxel/GhostWave )',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 404 || !res.ok) {
        return null;
      }

      const data = await res.json();
      const plainLyrics = (data.plainLyrics || '').trim();
      const syncedLyrics = (data.syncedLyrics || '').trim();

      if (!plainLyrics && !syncedLyrics) {
        return null;
      }

      return {
        id: String(data.id || `${cleanArtist}-${cleanTitle}`),
        trackName: cleanTitle,
        artistName: cleanArtist,
        plainLyrics: plainLyrics || syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim(),
        syncedLyrics: syncedLyrics || undefined,
        isSynced: Boolean(syncedLyrics && syncedLyrics.length > 0),
        source: 'LRCLIB (Open Lyrics Database)',
        disclaimer: 'Lyrics provided for personal offline use. GhostWave does not redistribute copyrighted lyrics.',
      };
    } catch {
      return null;
    }
  }
}
