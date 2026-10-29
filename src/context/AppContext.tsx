import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Track,
  Playlist,
  PlaybackState,
  LibraryIssue,
  MetadataProposal,
  AppSettings,
  AppRoute,
  QueueItem,
  ScanProgress,
  ScanReport,
} from '../types';
import { dbRepository } from '../services/storage/IndexedDbRepository';
import { getPlatform, WebFilePlatform } from '../services/platform';
import { LibraryScanner } from '../services/scanner/LibraryScanner';
import { PlaybackEngine } from '../services/playback/PlaybackEngine';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  tracks: Track[];
  selectedTrack: Track | null;
  setSelectedTrack: (track: Track | null) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  playbackState: PlaybackState;
  playbackEngine: PlaybackEngine;
  queue: QueueItem[];
  addToQueue: (trackId: string) => void;
  removeFromQueue: (queueId: string) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playQueueItem: (queueId: string) => void;
  togglePlayPause: () => void;
  playTrack: (trackId: string) => Promise<void>;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTrack: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  libraryIssues: LibraryIssue[];
  metadataProposals: MetadataProposal[];
  approveProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isScanning: boolean;
  scanProgress: ScanProgress;
  scanProgressPercent: number;
  triggerScan: () => void;
  importAudioFiles: (files: File[]) => Promise<ScanReport>;
  selectAndImportFiles: () => Promise<ScanReport | null>;
  selectAndImportFolder: () => Promise<ScanReport | null>;
  rescanLibrary: () => Promise<ScanReport>;
  removeTrackFromLibrary: (id: string) => Promise<void>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
}

const INITIAL_SETTINGS: AppSettings = {
  theme: 'halloween-dark',
  accentPalette: 'witch-violet',
  localAi: {
    enabled: true,
    endpoint: 'http://127.0.0.1:11434',
    model: 'gemma2:2b',
    status: 'connected',
  },
  onlineEnrichment: {
    enabled: false,
    provider: 'musicbrainz',
    lookupAlbumArt: true,
  },
  visualizer: {
    preset: 'ghost_pulse',
    sensitivity: 75,
    colorCycle: true,
  },
  library: {
    autoScanOnStartup: false,
    renamePattern: '{artist} - {title}',
  },
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<AppRoute>('library');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ghostwave_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return INITIAL_SETTINGS;
  });

  // Real data state (starts empty until user imports files)
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [libraryIssues] = useState<LibraryIssue[]>([]);
  const [metadataProposals, setMetadataProposals] = useState<MetadataProposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    scanned: 0,
    total: 0,
    currentFile: '',
    isScanning: false,
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Playback Queue state (S3.2)
  const [queue, setQueue] = useState<QueueItem[]>([]);

  // Transport state (S3.1)
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrackId: null,
    status: 'idle',
    isPlaying: false,
    currentTimeSeconds: 0,
    durationSeconds: 0,
    volume: 0.85,
    isMuted: false,
    repeatMode: 'all',
    shuffle: false,
  });

  // Stable Playback Engine instance
  const engineRef = useRef<PlaybackEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new PlaybackEngine();
  }
  const engine = engineRef.current;

  // Refs to avoid stale closures in engine callbacks
  const stateRef = useRef(playbackState);
  stateRef.current = playbackState;

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const queueRef = useRef(queue);
  queueRef.current = queue;

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Calculate percentage for progress bars
  const scanProgressPercent = useMemo(() => {
    if (scanProgress.total === 0) return 0;
    return Math.min(100, Math.round((scanProgress.scanned / scanProgress.total) * 100));
  }, [scanProgress]);

  // Advance queue on track end
  const handleTrackEnded = useCallback(() => {
    const { repeatMode, shuffle, currentTrackId } = stateRef.current;
    const currentQueue = queueRef.current;
    const currentTracks = tracksRef.current;

    if (repeatMode === 'one' && currentTrackId) {
      engine.seek(0);
      engine.play().catch(() => {});
      return;
    }

    // 1. Advance from Queue if queue has items
    if (currentQueue.length > 0) {
      const nextItem = currentQueue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextItem.trackId);
      return;
    }

    // 2. Advance within Library tracks
    if (currentTracks.length > 0) {
      if (shuffle) {
        const remaining = currentTracks.filter((t) => t.id !== currentTrackId);
        const next = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : currentTracks[0];
        playTrack(next.id);
        return;
      }

      const currentIndex = currentTracks.findIndex((t) => t.id === currentTrackId);
      if (currentIndex === -1) {
        playTrack(currentTracks[0].id);
        return;
      }

      if (currentIndex + 1 < currentTracks.length) {
        playTrack(currentTracks[currentIndex + 1].id);
      } else if (repeatMode === 'all') {
        playTrack(currentTracks[0].id);
      } else {
        setPlaybackState((prev) => ({
          ...prev,
          status: 'ended',
          isPlaying: false,
          currentTimeSeconds: prev.durationSeconds,
        }));
      }
    }
  }, [engine]);

  // Wire playback engine event listeners
  useEffect(() => {
    engine.setEvents({
      onStatusChange: (status) => {
        setPlaybackState((prev) => ({
          ...prev,
          status,
          isPlaying: status === 'playing',
        }));
      },
      onTimeUpdate: (currentTime, duration) => {
        setPlaybackState((prev) => ({
          ...prev,
          currentTimeSeconds: currentTime,
          durationSeconds: duration > 0 ? duration : prev.durationSeconds,
        }));
      },
      onEnded: () => {
        handleTrackEnded();
      },
      onError: (errMsg) => {
        setPlaybackState((prev) => ({
          ...prev,
          status: 'error',
          isPlaying: false,
          errorMessage: errMsg,
        }));
        addToast({
          title: 'Playback Error',
          message: errMsg,
          type: 'error',
        });
      },
    });

    return () => {
      engine.destroy();
    };
  }, [engine, handleTrackEnded, addToast]);

  // Initialize library from IndexedDB on startup (loads real saved files)
  useEffect(() => {
    let isMounted = true;

    const initDb = async () => {
      try {
        const storedTracks = await dbRepository.getAllTracks();
        if (isMounted && storedTracks.length > 0) {
          setTracks(storedTracks);
          setSelectedTrack(storedTracks[0]);
        }
      } catch {
        // Fallback to empty library if IndexedDB fails
      }
    };

    initDb();

    return () => {
      isMounted = false;
    };
  }, []);

  // Apply theme & accent to DOM documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'halloween-light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'halloween-light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'halloween-dark');
    }
    root.setAttribute('data-accent', settings.accentPalette);
    localStorage.setItem('ghostwave_settings', JSON.stringify(settings));
    dbRepository.saveSettings(settings).catch(() => {});
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const nextTheme = prev.theme === 'halloween-dark' ? 'halloween-light' : 'halloween-dark';
      addToast({
        title: 'Theme Changed',
        message: `Active palette: ${nextTheme === 'halloween-dark' ? 'Halloween Dark' : 'Halloween Light'}`,
        type: 'info',
      });
      return { ...prev, theme: nextTheme };
    });
  }, [addToast]);

  // Real Play Track Action (S3.1)
  const playTrack = useCallback(
    async (trackId: string): Promise<void> => {
      const currentList = tracksRef.current;
      const trk = currentList.find((t) => t.id === trackId);
      if (!trk) return;

      setSelectedTrack(trk);
      setPlaybackState((prev) => ({
        ...prev,
        currentTrackId: trackId,
        status: 'loading',
        isPlaying: true,
        currentTimeSeconds: 0,
        durationSeconds: trk.durationSeconds,
        errorMessage: undefined,
      }));

      try {
        const platform = getPlatform();
        const url = await platform.getAudioUrl(trk);

        if (url) {
          await engine.loadAndPlay(url);
          setPlaybackState((prev) => ({
            ...prev,
            status: 'playing',
            isPlaying: true,
          }));
        } else {
          // If no audio url is available (e.g. mock or missing file handle)
          setPlaybackState((prev) => ({
            ...prev,
            status: 'playing',
            isPlaying: true,
          }));
        }

        addToast({
          title: 'Now Playing',
          message: `${trk.title} by ${trk.artist}`,
          type: 'info',
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not play audio';
        setPlaybackState((prev) => ({
          ...prev,
          status: 'error',
          isPlaying: false,
          errorMessage: message,
        }));
        addToast({
          title: 'Playback Error',
          message,
          type: 'error',
        });
      }
    },
    [engine, addToast]
  );

  const togglePlayPause = useCallback(() => {
    const { isPlaying, currentTrackId } = stateRef.current;
    const currentList = tracksRef.current;

    if (isPlaying) {
      engine.pause();
      setPlaybackState((prev) => ({ ...prev, isPlaying: false, status: 'paused' }));
    } else {
      if (currentTrackId) {
        engine.play().catch(() => {});
        setPlaybackState((prev) => ({ ...prev, isPlaying: true, status: 'playing' }));
      } else if (currentList.length > 0) {
        playTrack(currentList[0].id);
      }
    }
  }, [engine, playTrack]);

  const nextTrack = useCallback(() => {
    const currentList = tracksRef.current;
    const currentQueue = queueRef.current;

    if (currentQueue.length > 0) {
      const nextItem = currentQueue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextItem.trackId);
      return;
    }

    if (currentList.length === 0) return;
    const currentIndex = currentList.findIndex((t) => t.id === stateRef.current.currentTrackId);
    const nextIdx = (currentIndex + 1) % currentList.length;
    playTrack(currentList[nextIdx].id);
  }, [playTrack]);

  const prevTrack = useCallback(() => {
    const currentList = tracksRef.current;
    if (currentList.length === 0) return;

    if (stateRef.current.currentTimeSeconds > 3) {
      engine.seek(0);
      return;
    }

    const currentIndex = currentList.findIndex((t) => t.id === stateRef.current.currentTrackId);
    const prevIdx = (currentIndex - 1 + currentList.length) % currentList.length;
    playTrack(currentList[prevIdx].id);
  }, [engine, playTrack]);

  const seekTrack = useCallback(
    (seconds: number) => {
      engine.seek(seconds);
      setPlaybackState((prev) => ({ ...prev, currentTimeSeconds: seconds }));
    },
    [engine]
  );

  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      engine.setVolume(clamped);
      setPlaybackState((prev) => ({ ...prev, volume: clamped, isMuted: false }));
    },
    [engine]
  );

  const toggleMute = useCallback(() => {
    setPlaybackState((prev) => {
      const nextMuted = !prev.isMuted;
      engine.setMuted(nextMuted);
      return { ...prev, isMuted: nextMuted };
    });
  }, [engine]);

  const toggleShuffle = useCallback(() => {
    setPlaybackState((prev) => {
      const next = !prev.shuffle;
      addToast({
        title: 'Shuffle Mode',
        message: next ? 'Shuffle enabled' : 'Shuffle disabled',
        type: 'info',
      });
      return { ...prev, shuffle: next };
    });
  }, [addToast]);

  const toggleRepeat = useCallback(() => {
    const modes: PlaybackState['repeatMode'][] = ['off', 'all', 'one'];
    setPlaybackState((prev) => {
      const nextMode = modes[(modes.indexOf(prev.repeatMode) + 1) % modes.length];
      addToast({
        title: 'Repeat Mode',
        message: `Repeat set to ${nextMode}`,
        type: 'info',
      });
      return { ...prev, repeatMode: nextMode };
    });
  }, [addToast]);

  // Queue Operations (S3.2)
  const addToQueue = useCallback(
    (trackId: string) => {
      const trk = tracksRef.current.find((t) => t.id === trackId);
      if (!trk) return;

      const newItem: QueueItem = {
        queueId: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trackId,
        addedAt: Date.now(),
      };

      setQueue((prev) => [...prev, newItem]);
      addToast({
        title: 'Added to Queue',
        message: `Added "${trk.title}" to playback queue.`,
        type: 'info',
      });
    },
    [addToast]
  );

  const removeFromQueue = useCallback((queueId: string) => {
    setQueue((prev) => prev.filter((item) => item.queueId !== queueId));
  }, []);

  const moveQueueItem = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    addToast({
      title: 'Queue Cleared',
      message: 'All upcoming tracks have been removed from the queue.',
      type: 'info',
    });
  }, [addToast]);

  const playQueueItem = useCallback(
    (queueId: string) => {
      const item = queueRef.current.find((q) => q.queueId === queueId);
      if (item) {
        removeFromQueue(queueId);
        playTrack(item.trackId);
      }
    },
    [removeFromQueue, playTrack]
  );

  const approveProposal = useCallback(
    (id: string) => {
      setMetadataProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
      );
      addToast({
        title: 'Proposal Approved',
        message: 'Pending tag modification approved for application.',
        type: 'success',
      });
    },
    [addToast]
  );

  const rejectProposal = useCallback(
    (id: string) => {
      setMetadataProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
      );
      addToast({
        title: 'Proposal Rejected',
        message: 'Proposed change rejected.',
        type: 'info',
      });
    },
    [addToast]
  );

  /**
   * S2 Core: Import files with progress tracking, tag extraction, and duplicate handling.
   */
  const importAudioFiles = useCallback(
    async (files: File[]): Promise<ScanReport> => {
      setIsScanning(true);
      const platform = getPlatform() as WebFilePlatform;
      const scanner = new LibraryScanner(dbRepository, platform);

      const report = await scanner.scanFiles(files, (progress) => {
        setScanProgress(progress);
      });

      // Reload merged tracks from IndexedDB
      const updatedList = await dbRepository.getAllTracks();
      setTracks(updatedList);
      if (updatedList.length > 0 && !selectedTrack) {
        setSelectedTrack(updatedList[0]);
      }
      setIsScanning(false);

      if (report.added > 0 || report.updated > 0) {
        addToast({
          title: 'Import Complete',
          message: `Indexed ${report.added} new track${report.added === 1 ? '' : 's'}${
            report.updated > 0 ? ` and updated ${report.updated}` : ''
          }.`,
          type: 'success',
        });
      } else if (report.unsupported > 0 && report.added === 0) {
        addToast({
          title: 'No Audio Files Found',
          message: `Skipped ${report.unsupported} unsupported non-audio file${
            report.unsupported === 1 ? '' : 's'
          }.`,
          type: 'warning',
        });
      } else {
        addToast({
          title: 'Scan Finished',
          message: 'All selected files already exist in your local library index.',
          type: 'info',
        });
      }

      return report;
    },
    [addToast, selectedTrack]
  );

  const selectAndImportFiles = useCallback(async (): Promise<ScanReport | null> => {
    const platform = getPlatform();
    const files = await platform.selectAudioFiles();
    if (files.length === 0) return null;
    return importAudioFiles(files);
  }, [importAudioFiles]);

  const selectAndImportFolder = useCallback(async (): Promise<ScanReport | null> => {
    const platform = getPlatform();
    const files = await platform.selectFolder();
    if (files.length === 0) return null;
    return importAudioFiles(files);
  }, [importAudioFiles]);

  const rescanLibrary = useCallback(async (): Promise<ScanReport> => {
    setIsScanning(true);
    const platform = getPlatform() as WebFilePlatform;
    const scanner = new LibraryScanner(dbRepository, platform);

    const report = await scanner.rescanLibrary(tracks, (progress) => {
      setScanProgress(progress);
    });

    const updatedList = await dbRepository.getAllTracks();
    setTracks(updatedList);
    setIsScanning(false);

    addToast({
      title: 'Library Rescan Complete',
      message: `Verified ${updatedList.length} local library entries.`,
      type: 'info',
    });

    return report;
  }, [tracks, addToast]);

  const removeTrackFromLibrary = useCallback(
    async (id: string): Promise<void> => {
      await dbRepository.deleteTrack(id);
      setTracks((prev) => prev.filter((t) => t.id !== id));
      if (playbackState.currentTrackId === id) {
        engine.pause();
        setPlaybackState((prev) => ({
          ...prev,
          currentTrackId: null,
          isPlaying: false,
          status: 'idle',
        }));
      }
      addToast({
        title: 'Removed from Library Index',
        message: 'Track reference removed from GhostWave. Local audio file was not deleted.',
        type: 'info',
      });
    },
    [engine, playbackState.currentTrackId, addToast]
  );

  const triggerScan = useCallback(() => {
    rescanLibrary();
  }, [rescanLibrary]);

  return (
    <AppContext.Provider
      value={{
        route,
        setRoute,
        settings,
        updateSettings,
        toggleTheme,
        tracks,
        selectedTrack,
        setSelectedTrack,
        playlists,
        selectedPlaylistId,
        setSelectedPlaylistId,
        playbackState,
        playbackEngine: engine,
        queue,
        addToQueue,
        removeFromQueue,
        moveQueueItem,
        clearQueue,
        playQueueItem,
        togglePlayPause,
        playTrack,
        nextTrack,
        prevTrack,
        seekTrack,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        libraryIssues,
        metadataProposals,
        approveProposal,
        rejectProposal,
        searchQuery,
        setSearchQuery,
        isScanning,
        scanProgress,
        scanProgressPercent,
        triggerScan,
        importAudioFiles,
        selectAndImportFiles,
        selectAndImportFolder,
        rescanLibrary,
        removeTrackFromLibrary,
        toasts,
        addToast,
        removeToast,
        activeModal,
        setActiveModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
