import { Track, AppSettings } from '../../types';

const DB_NAME = 'ghostwave_library';
const DB_VERSION = 1;
const TRACKS_STORE = 'tracks';
const BLOBS_STORE = 'blobs';
const SETTINGS_STORE = 'settings';

export class IndexedDbRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          const trackStore = db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
          trackStore.createIndex('filePath', 'filePath', { unique: false });
          trackStore.createIndex('artist', 'artist', { unique: false });
          trackStore.createIndex('album', 'album', { unique: false });
          trackStore.createIndex('addedAt', 'addedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(BLOBS_STORE)) {
          db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open GhostWave IndexedDB database.'));
      };
    });

    return this.dbPromise;
  }

  async getAllTracks(): Promise<Track[]> {
    try {
      const db = await this.openDatabase();
      return new Promise<Track[]>((resolve, reject) => {
        const tx = db.transaction(TRACKS_STORE, 'readonly');
        const store = tx.objectStore(TRACKS_STORE);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async getTrackById(id: string): Promise<Track | null> {
    try {
      const db = await this.openDatabase();
      return new Promise<Track | null>((resolve, reject) => {
        const tx = db.transaction(TRACKS_STORE, 'readonly');
        const store = tx.objectStore(TRACKS_STORE);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async saveTracks(tracks: Track[]): Promise<void> {
    if (tracks.length === 0) return;
    const db = await this.openDatabase();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TRACKS_STORE, 'readwrite');
      const store = tx.objectStore(TRACKS_STORE);

      for (const track of tracks) {
        store.put(track);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async deleteTrack(id: string): Promise<void> {
    const db = await this.openDatabase();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([TRACKS_STORE, BLOBS_STORE], 'readwrite');
      const trackStore = tx.objectStore(TRACKS_STORE);
      const blobStore = tx.objectStore(BLOBS_STORE);

      trackStore.delete(id);
      blobStore.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearLibrary(): Promise<void> {
    const db = await this.openDatabase();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([TRACKS_STORE, BLOBS_STORE], 'readwrite');
      tx.objectStore(TRACKS_STORE).clear();
      tx.objectStore(BLOBS_STORE).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveAudioBlob(id: string, blob: Blob): Promise<void> {
    const db = await this.openDatabase();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BLOBS_STORE, 'readwrite');
      const store = tx.objectStore(BLOBS_STORE);
      store.put({ id, blob, updatedAt: Date.now() });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAudioBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.openDatabase();
      return new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(BLOBS_STORE, 'readonly');
        const store = tx.objectStore(BLOBS_STORE);
        const req = store.get(id);

        req.onsuccess = () => {
          const result = req.result as { id: string; blob: Blob } | undefined;
          resolve(result?.blob || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.openDatabase();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE);
      store.put({ key: 'app_settings', value: settings, updatedAt: Date.now() });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadSettings(): Promise<AppSettings | null> {
    try {
      const db = await this.openDatabase();
      return new Promise<AppSettings | null>((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        const store = tx.objectStore(SETTINGS_STORE);
        const req = store.get('app_settings');

        req.onsuccess = () => {
          const res = req.result as { key: string; value: AppSettings } | undefined;
          resolve(res?.value || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }
}

export const dbRepository = new IndexedDbRepository();
