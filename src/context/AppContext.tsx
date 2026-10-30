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
  OperationResult,
  LayoutSizes,
} from '../types';
import { dbRepository } from '../services/storage/IndexedDbRepository';
import { getPlatform, WebFilePlatform } from '../services/platform';
import { LibraryScanner } from '../services/scanner/LibraryScanner';
import { PlaybackEngine } from '../services/playback/PlaybackEngine';
import { LibraryHealthService } from '../services/health/LibraryHealthService';
import { MetadataEditService } from '../services/health/MetadataEditService';
import {
  ollamaClient,
  OllamaClient,
  DEFAULT_OLLAMA_ENDPOINT,
  DEFAULT_AI_MODEL,
} from '../services/ai/OllamaClient';
import {
  ConnectionStatus,
  ModelInfo,
  GenerateResult,
} from '../services/ai/LocalAiProvider';
import {
  AiPlaylistService,
  PlaylistProposalResult,
} from '../services/ai/AiPlaylistService';
import { AiMetadataService } from '../services/ai/AiMetadataService';
import { OnlineEnrichmentService } from '../services/enrichment/OnlineEnrichmentService';
import {
  EnrichmentCandidate,
  EnrichmentSearchQuery,
  CoverArtResult,
  LyricsResult,
} from '../services/enrichment/types';
import { AudioConversionService } from '../services/conversion/AudioConversionService';
import {
  ConversionOptions,
  ConversionProgress,
  ConversionBatchReport,
} from '../services/conversion/types';

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
  layout: LayoutSizes;
  updateLayout: (updates: Partial<LayoutSizes>) => void;
  isVisualizerOpen: boolean;
  setIsVisualizerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleVisualizer: () => void;
  playFromLibrary: (trackId: string, trackList?: Track[]) => Promise<void>;
  tracks: Track[];
  selectedTrack: Track | null;
  setSelectedTrack: (track: Track | null) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  createPlaylist: (name: string, description?: string, icon?: string, accentColor?: string) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => Promise<void>;
  playPlaylist: (playlistId: string, startTrackId?: string) => Promise<void>;
  playlistModalTrack: Track | null;
  setPlaylistModalTrack: (track: Track | null) => void;
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
  editProposalValue: (id: string, proposedValue: string) => void;
  applyApprovedProposals: () => Promise<OperationResult<{ applied: number; failed: number }>>;
  updateTrackMetadata: (trackId: string, updates: Partial<Track>) => Promise<OperationResult<Track>>;
  applyRenameTemplate: (template: string, trackIds?: string[]) => Promise<OperationResult<{ renamed: number; failed: number }>>;
  runHealthCheck: () => void;
  editTrackModal: Track | null;
  setEditTrackModal: (track: Track | null) => void;
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
  aiConnection: ConnectionStatus;
  aiInstalledModels: ModelInfo[];
  testAiConnection: (endpointOverride?: string) => Promise<ConnectionStatus>;
  discoverAiModels: (endpointOverride?: string) => Promise<ModelInfo[]>;
  sendTestAiPrompt: (prompt: string, modelOverride?: string) => Promise<GenerateResult>;
  generateAiPlaylistProposal: (query: string, modelOverride?: string) => Promise<PlaylistProposalResult>;
  saveAiPlaylist: (proposal: PlaylistProposalResult, nameOverride?: string) => Promise<Playlist>;
  generateAiMetadataProposals: (tracksToInspect?: Track[]) => Promise<MetadataProposal[]>;
  ollamaClient: OllamaClient;
  enrichmentModalTrack: Track | null;
  setEnrichmentModalTrack: (track: Track | null) => void;
  conversionModalTracks: Track[];
  setConversionModalTracks: (tracks: Track[]) => void;
  searchOnlineMetadata: (query: EnrichmentSearchQuery) => Promise<EnrichmentCandidate[]>;
  fetchCoverArt: (releaseId: string) => Promise<CoverArtResult | null>;
  fetchLyrics: (title: string, artist: string, album?: string, duration?: number) => Promise<LyricsResult | null>;
  convertTracks: (
    tracksToConvert: Track[],
    options: ConversionOptions,
    onProgress?: (p: ConversionProgress) => void
  ) => Promise<ConversionBatchReport>;
}

const INITIAL_SETTINGS: AppSettings = {
  theme: 'halloween-dark',
  accentPalette: 'witch-violet',
  localAi: {
    enabled: true,
    endpoint: DEFAULT_OLLAMA_ENDPOINT,
    model: DEFAULT_AI_MODEL,
    status: 'disconnected',
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
    halloweenMotifs: true,
  },
  layout: {
    headerHeight: 64,
    sidebarWidth: 240,
    bottomPlayerHeight: 76,
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

  // Resizable fixed layout sizing (Header, Sidebar, BottomPlayer) with limits
  const [layout, setLayout] = useState<LayoutSizes>(() => {
    const saved = localStorage.getItem('ghostwave_layout_sizes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          headerHeight: Math.max(52, Math.min(84, parsed.headerHeight || 64)),
          sidebarWidth: Math.max(180, Math.min(380, parsed.sidebarWidth || 240)),
          bottomPlayerHeight: Math.max(68, Math.min(120, parsed.bottomPlayerHeight || 76)),
        };
      } catch {
        // Fallback to default
      }
    }
    return {
      headerHeight: 64,
      sidebarWidth: 240,
      bottomPlayerHeight: 76,
    };
  });

  const updateLayout = useCallback((updates: Partial<LayoutSizes>) => {
    setLayout((prev) => {
      const next: LayoutSizes = {
        headerHeight: updates.headerHeight !== undefined
          ? Math.max(52, Math.min(84, Math.round(updates.headerHeight)))
          : prev.headerHeight,
        sidebarWidth: updates.sidebarWidth !== undefined
          ? Math.max(180, Math.min(380, Math.round(updates.sidebarWidth)))
          : prev.sidebarWidth,
        bottomPlayerHeight: updates.bottomPlayerHeight !== undefined
          ? Math.max(68, Math.min(120, Math.round(updates.bottomPlayerHeight)))
          : prev.bottomPlayerHeight,
      };
      localStorage.setItem('ghostwave_layout_sizes', JSON.stringify(next));
      return next;
    });
  }, []);

  // Now Playing & Audio Visualizer slide-up drawer state
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const toggleVisualizer = useCallback(() => {
    setIsVisualizerOpen((prev) => !prev);
  }, []);

  const handleSetRoute = useCallback((newRoute: AppRoute) => {
    setRoute(newRoute);
  }, []);

  // Real data state (starts empty until user imports files)
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [libraryIssues, setLibraryIssues] = useState<LibraryIssue[]>([]);
  const [metadataProposals, setMetadataProposals] = useState<MetadataProposal[]>([]);
  const [editTrackModal, setEditTrackModal] = useState<Track | null>(null);
  const [enrichmentModalTrack, setEnrichmentModalTrack] = useState<Track | null>(null);
  const [conversionModalTracks, setConversionModalTracks] = useState<Track[]>([]);
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

  // S7.1 Local AI state
  const [aiConnection, setAiConnection] = useState<ConnectionStatus>({
    isAvailable: false,
    endpoint: settings.localAi.endpoint || DEFAULT_OLLAMA_ENDPOINT,
    state: 'unconfigured',
  });
  const [aiInstalledModels, setAiInstalledModels] = useState<ModelInfo[]>([]);

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
          durationSeconds: duration > 0 && !isNaN(duration) && isFinite(duration) ? duration : prev.durationSeconds,
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
      engine.setEvents({});
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
        const storedPlaylists = await dbRepository.getAllPlaylists();
        if (isMounted && storedPlaylists.length > 0) {
          setPlaylists(storedPlaylists);
          setSelectedPlaylistId(storedPlaylists[0].id);
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
          addToast({
            title: 'Now Playing',
            message: `${trk.title} by ${trk.artist}`,
            type: 'info',
          });
        } else {
          setPlaybackState((prev) => ({
            ...prev,
            status: 'error',
            isPlaying: false,
            errorMessage: `Audio file for "${trk.title}" is missing or unreadable.`,
          }));
          addToast({
            title: 'File Unavailable',
            message: `Could not load audio for "${trk.title}". Please re-import this file.`,
            type: 'error',
          });
        }
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

  const playFromLibrary = useCallback(
    async (trackId: string, trackList?: Track[]): Promise<void> => {
      const list = trackList && trackList.length > 0 ? trackList : tracksRef.current;
      const startIdx = list.findIndex((t) => t.id === trackId);
      if (startIdx === -1) {
        await playTrack(trackId);
        return;
      }

      // Remaining tracks following this one become the playback queue
      const upcoming = list.slice(startIdx + 1);
      const newQueue: QueueItem[] = upcoming.map((t, idx) => ({
        queueId: `q-lib-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        trackId: t.id,
        addedAt: Date.now() + idx,
      }));

      setQueue(newQueue);
      await playTrack(trackId);
    },
    [playTrack]
  );

  const togglePlayPause = useCallback(() => {
    const { isPlaying, currentTrackId } = stateRef.current;
    const currentList = tracksRef.current;

    if (isPlaying) {
      engine.pause();
      setPlaybackState((prev) => ({ ...prev, isPlaying: false, status: 'paused' }));
    } else {
      if (currentTrackId) {
        if (engine.getStatus() === 'paused' || engine.getCurrentTime() > 0) {
          engine.play().catch(() => {});
          setPlaybackState((prev) => ({ ...prev, isPlaying: true, status: 'playing' }));
        } else {
          playTrack(currentTrackId);
        }
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

  // Playlist Operations (S4.2 & S4.3)
  const createPlaylist = useCallback(
    async (name: string, description?: string, icon?: string, accentColor?: string): Promise<Playlist> => {
      const trimmed = name.trim();
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed || 'Untitled Crate',
        description: description?.trim() || '',
        icon: icon || 'queue_music',
        accentColor: accentColor || 'witch-violet',
        trackIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await dbRepository.savePlaylist(newPlaylist);
      } catch (err) {
        console.warn('GhostWave: IndexedDB playlist save fallback:', err);
      }
      setPlaylists((prev) => [newPlaylist, ...prev]);
      setSelectedPlaylistId(newPlaylist.id);

      addToast({
        title: 'Playlist Created',
        message: `Created playlist "${newPlaylist.name}".`,
        type: 'success',
      });

      return newPlaylist;
    },
    [addToast]
  );

  const updatePlaylist = useCallback(
    async (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>): Promise<void> => {
      let updatedPlaylist: Playlist | null = null;
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === id) {
            updatedPlaylist = {
              ...pl,
              ...updates,
              updatedAt: Date.now(),
            };
            return updatedPlaylist;
          }
          return pl;
        })
      );

      if (updatedPlaylist) {
        await dbRepository.savePlaylist(updatedPlaylist);
        addToast({
          title: 'Playlist Updated',
          message: 'Changes saved successfully.',
          type: 'success',
        });
      }
    },
    [addToast]
  );

  const deletePlaylist = useCallback(
    async (id: string): Promise<void> => {
      const pl = playlists.find((p) => p.id === id);
      await dbRepository.deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlaylistId === id) {
        const remaining = playlists.filter((p) => p.id !== id);
        setSelectedPlaylistId(remaining.length > 0 ? remaining[0].id : null);
      }
      addToast({
        title: 'Playlist Deleted',
        message: pl ? `Deleted "${pl.name}".` : 'Playlist deleted.',
        type: 'info',
      });
    },
    [playlists, selectedPlaylistId, addToast]
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string): Promise<void> => {
      const pl = playlists.find((p) => p.id === playlistId);
      const trk = tracks.find((t) => t.id === trackId);
      if (!pl || !trk) return;

      if (pl.trackIds.includes(trackId)) {
        addToast({
          title: 'Track Already In Playlist',
          message: `"${trk.title}" is already in "${pl.name}".`,
          type: 'warning',
        });
        return;
      }

      const updated: Playlist = {
        ...pl,
        trackIds: [...pl.trackIds, trackId],
        updatedAt: Date.now(),
      };

      await dbRepository.savePlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
      addToast({
        title: 'Added to Playlist',
        message: `Added "${trk.title}" to "${pl.name}".`,
        type: 'success',
      });
    },
    [playlists, tracks, addToast]
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string): Promise<void> => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;

      const updated: Playlist = {
        ...pl,
        trackIds: pl.trackIds.filter((tid) => tid !== trackId),
        updatedAt: Date.now(),
      };

      await dbRepository.savePlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
      addToast({
        title: 'Track Removed',
        message: 'Removed track from playlist.',
        type: 'info',
      });
    },
    [playlists, addToast]
  );

  const reorderPlaylistTracks = useCallback(
    async (playlistId: string, fromIndex: number, toIndex: number): Promise<void> => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;
      if (fromIndex < 0 || fromIndex >= pl.trackIds.length || toIndex < 0 || toIndex >= pl.trackIds.length) {
        return;
      }

      const newTrackIds = [...pl.trackIds];
      const [moved] = newTrackIds.splice(fromIndex, 1);
      newTrackIds.splice(toIndex, 0, moved);

      const updated: Playlist = {
        ...pl,
        trackIds: newTrackIds,
        updatedAt: Date.now(),
      };

      await dbRepository.savePlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    },
    [playlists]
  );

  const playPlaylist = useCallback(
    async (playlistId: string, startTrackId?: string): Promise<void> => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;

      // Filter against valid tracks in library (safe preservation)
      const validTrackIds = pl.trackIds.filter((tid) => tracks.some((t) => t.id === tid));
      if (validTrackIds.length === 0) {
        addToast({
          title: 'Empty Playlist',
          message: `"${pl.name}" contains no available tracks in your library.`,
          type: 'warning',
        });
        return;
      }

      const startingId = startTrackId && validTrackIds.includes(startTrackId) ? startTrackId : validTrackIds[0];
      const startIdx = validTrackIds.indexOf(startingId);

      // Remaining tracks to enqueue
      const upcomingIds = validTrackIds.slice(startIdx + 1);
      const newQueue: QueueItem[] = upcomingIds.map((tid, idx) => ({
        queueId: `q-pl-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        trackId: tid,
        addedAt: Date.now() + idx,
      }));

      setQueue(newQueue);
      await playTrack(startingId);

      addToast({
        title: 'Playing Playlist',
        message: `Playing "${pl.name}" (${validTrackIds.length} tracks).`,
        type: 'info',
      });
    },
    [playlists, tracks, playTrack, addToast]
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

  const editProposalValue = useCallback(
    (id: string, proposedValue: string) => {
      setMetadataProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, proposedValue, status: 'pending' } : p))
      );
      addToast({
        title: 'Proposal Edited',
        message: 'Proposed value updated. Review and click Approve to accept it.',
        type: 'info',
      });
    },
    [addToast]
  );

  const runHealthCheck = useCallback(() => {
    const report = LibraryHealthService.analyze(tracks, settings.library.renamePattern);
    setLibraryIssues(report.issues);
    setMetadataProposals((prev) => {
      const existingMap = new Map(prev.map((p) => [p.id, p]));
      return report.proposals.map((newProp) => {
        const existing = existingMap.get(newProp.id);
        return existing || newProp;
      });
    });
  }, [tracks, settings.library.renamePattern]);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const applyApprovedProposals = useCallback(async (): Promise<OperationResult<{ applied: number; failed: number }>> => {
    const approved = metadataProposals.filter((p) => p.status === 'approved');
    if (approved.length === 0) {
      addToast({
        title: 'No Changes Approved',
        message: 'Review and approve at least one proposal before applying.',
        type: 'warning',
      });
      return { success: false, message: 'No approved proposals' };
    }

    let appliedCount = 0;
    let failedCount = 0;
    const updatedTracksMap = new Map<string, Track>();

    for (const prop of approved) {
      const currentTrack = updatedTracksMap.get(prop.trackId) || tracks.find((t) => t.id === prop.trackId);
      if (!currentTrack) {
        failedCount++;
        continue;
      }

      const updates: Partial<Track> = {
        [prop.field]: prop.proposedValue,
      };

      const result = MetadataEditService.applyMetadata(currentTrack, updates);
      if (result.success && result.data) {
        updatedTracksMap.set(prop.trackId, result.data);
        appliedCount++;
      } else {
        failedCount++;
      }
    }

    for (const track of updatedTracksMap.values()) {
      await dbRepository.saveTrack(track);
    }

    setTracks((prev) =>
      prev.map((t) => updatedTracksMap.get(t.id) || t)
    );

    setMetadataProposals((prev) =>
      prev.map((p) => (p.status === 'approved' ? { ...p, status: 'applied' } : p))
    );

    addToast({
      title: 'Safe Changes Applied',
      message: `Updated ${appliedCount} metadata fields in local index${failedCount > 0 ? ` (${failedCount} failed)` : ''}.`,
      type: 'success',
    });

    return {
      success: true,
      data: { applied: appliedCount, failed: failedCount },
    };
  }, [metadataProposals, tracks, addToast]);

  const updateTrackMetadata = useCallback(
    async (trackId: string, updates: Partial<Track>): Promise<OperationResult<Track>> => {
      const trk = tracks.find((t) => t.id === trackId);
      if (!trk) {
        return { success: false, error: 'Track not found in library index' };
      }

      const result = MetadataEditService.applyMetadata(trk, updates);
      if (!result.success || !result.data) {
        addToast({
          title: 'Validation Error',
          message: result.error || 'Failed to update track metadata',
          type: 'error',
        });
        return result;
      }

      await dbRepository.saveTrack(result.data);

      setTracks((prev) => prev.map((t) => (t.id === trackId ? result.data! : t)));
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(result.data);
      }

      addToast({
        title: 'Metadata Updated',
        message: `Updated metadata for "${result.data.title}".`,
        type: 'success',
      });

      return result;
    },
    [tracks, selectedTrack, addToast]
  );

  const applyRenameTemplate = useCallback(
    async (template: string, trackIds?: string[]): Promise<OperationResult<{ renamed: number; failed: number }>> => {
      const targetTracks = trackIds
        ? tracks.filter((t) => trackIds.includes(t.id))
        : tracks;

      const previews = MetadataEditService.generateRenamePreview(targetTracks, template);
      const validToRename = previews.filter((p) => p.status === 'valid');

      if (validToRename.length === 0) {
        addToast({
          title: 'No Files Renamed',
          message: 'All files either already match the template or contain missing fields/conflicts.',
          type: 'warning',
        });
        return { success: false, message: 'No valid files to rename' };
      }

      let renamedCount = 0;
      const updatedList: Track[] = [];

      for (const item of validToRename) {
        const trk = tracks.find((t) => t.id === item.trackId);
        if (trk) {
          const updatedTrack: Track = {
            ...trk,
            fileName: item.proposedFileName,
            lastModified: Date.now(),
          };
          await dbRepository.saveTrack(updatedTrack);
          updatedList.push(updatedTrack);
          renamedCount++;
        }
      }

      setTracks((prev) =>
        prev.map((t) => {
          const found = updatedList.find((u) => u.id === t.id);
          return found || t;
        })
      );

      addToast({
        title: 'Filenames Standardized',
        message: `Updated filename index for ${renamedCount} track${renamedCount === 1 ? '' : 's'}.`,
        type: 'success',
      });

      return {
        success: true,
        data: { renamed: renamedCount, failed: 0 },
      };
    },
    [tracks, addToast]
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
      if (!files || files.length === 0) {
        setIsScanning(false);
        setScanProgress({ scanned: 0, total: 0, currentFile: '', isScanning: false });
        return {
          added: 0,
          updated: 0,
          skipped: 0,
          unsupported: 0,
          unreadable: 0,
          tracks: [],
          errors: [],
        };
      }

      setIsScanning(true);
      setScanProgress({
        scanned: 0,
        total: files.length,
        currentFile: 'Verifying files...',
        isScanning: true,
      });

      try {
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
      } catch (err) {
        console.error('GhostWave: file import error:', err);
        addToast({
          title: 'Import Failed',
          message: err instanceof Error ? err.message : 'Failed to scan files.',
          type: 'error',
        });
        return {
          added: 0,
          updated: 0,
          skipped: 0,
          unsupported: 0,
          unreadable: files.length,
          tracks: [],
          errors: [{ fileName: 'all', reason: String(err) }],
        };
      } finally {
        setIsScanning(false);
        setScanProgress((prev) => ({ ...prev, isScanning: false, currentFile: '' }));
      }
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
    if (tracks.length === 0) {
      setIsScanning(false);
      setScanProgress({ scanned: 0, total: 0, currentFile: '', isScanning: false });
      addToast({
        title: 'Library Empty',
        message: 'No indexed tracks to rescan. Import some audio files first.',
        type: 'info',
      });
      return {
        added: 0,
        updated: 0,
        skipped: 0,
        unsupported: 0,
        unreadable: 0,
        tracks: [],
        errors: [],
      };
    }

    setIsScanning(true);
    setScanProgress({
      scanned: 0,
      total: tracks.length,
      currentFile: 'Verifying local index...',
      isScanning: true,
    });

    try {
      const platform = getPlatform() as WebFilePlatform;
      const scanner = new LibraryScanner(dbRepository, platform);

      const report = await scanner.rescanLibrary(tracks, (progress) => {
        setScanProgress(progress);
      });

      const updatedList = await dbRepository.getAllTracks();
      setTracks(updatedList);

      addToast({
        title: 'Library Rescan Complete',
        message: `Verified ${updatedList.length} local library entries.`,
        type: 'info',
      });

      return report;
    } catch (err) {
      console.error('GhostWave: library rescan error:', err);
      addToast({
        title: 'Rescan Failed',
        message: err instanceof Error ? err.message : 'Failed to rescan library.',
        type: 'error',
      });
      return {
        added: 0,
        updated: 0,
        skipped: 0,
        unsupported: 0,
        unreadable: tracks.length,
        tracks: [],
        errors: [{ fileName: 'all', reason: String(err) }],
      };
    } finally {
      setIsScanning(false);
      setScanProgress((prev) => ({ ...prev, isScanning: false, currentFile: '' }));
    }
  }, [tracks, addToast]);

  const removeTrackFromLibrary = useCallback(
    async (id: string): Promise<void> => {
      await dbRepository.deleteTrack(id);
      setTracks((prev) => prev.filter((t) => t.id !== id));

      // Safely preserve playlist integrity: clean up track reference from all playlists
      setPlaylists((prev) => {
        const updated = prev.map((pl) => {
          if (pl.trackIds.includes(id)) {
            const nextPl = {
              ...pl,
              trackIds: pl.trackIds.filter((tid) => tid !== id),
              updatedAt: Date.now(),
            };
            dbRepository.savePlaylist(nextPl).catch(() => {});
            return nextPl;
          }
          return pl;
        });
        return updated;
      });

      // Remove from upcoming queue if present
      setQueue((prev) => prev.filter((q) => q.trackId !== id));

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

  // S7.1 Local AI Provider integration
  const testAiConnection = useCallback(
    async (endpointOverride?: string): Promise<ConnectionStatus> => {
      const ep = endpointOverride || settings.localAi.endpoint || DEFAULT_OLLAMA_ENDPOINT;
      ollamaClient.setEndpoint(ep);
      setAiConnection((prev) => ({ ...prev, state: 'checking', endpoint: ep }));
      const status = await ollamaClient.checkConnection(4000);
      setAiConnection(status);
      setSettings((prev) => ({
        ...prev,
        localAi: {
          ...prev.localAi,
          endpoint: ep,
          status: status.isAvailable ? 'connected' : 'disconnected',
        },
      }));
      return status;
    },
    [settings.localAi.endpoint]
  );

  const discoverAiModels = useCallback(
    async (endpointOverride?: string): Promise<ModelInfo[]> => {
      const ep = endpointOverride || settings.localAi.endpoint || DEFAULT_OLLAMA_ENDPOINT;
      ollamaClient.setEndpoint(ep);
      const models = await ollamaClient.listModels(4000);
      setAiInstalledModels(models);
      return models;
    },
    [settings.localAi.endpoint]
  );

  const sendTestAiPrompt = useCallback(
    async (promptText: string, modelOverride?: string): Promise<GenerateResult> => {
      const targetModel = modelOverride || settings.localAi.model || DEFAULT_AI_MODEL;
      return ollamaClient.generate(promptText, {
        model: targetModel,
        timeoutMs: 15000,
      });
    },
    [settings.localAi.model]
  );

  const generateAiPlaylistProposal = useCallback(
    async (query: string, modelOverride?: string): Promise<PlaylistProposalResult> => {
      const service = new AiPlaylistService(ollamaClient);
      return service.generatePlaylistProposal(query, tracksRef.current, modelOverride);
    },
    []
  );

  const saveAiPlaylist = useCallback(
    async (proposal: PlaylistProposalResult, nameOverride?: string): Promise<Playlist> => {
      const plName = nameOverride?.trim() || proposal.plan.name;
      const newPl: Playlist = {
        id: `pl-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: plName,
        description: proposal.plan.description || proposal.plan.explanation,
        trackIds: proposal.resolvedTracks.map((t) => t.id),
        isAiGenerated: true,
        icon: 'queue_music',
        accentColor: 'witch-violet',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await dbRepository.savePlaylist(newPl);
      } catch (err) {
        console.warn('GhostWave: saveAiPlaylist storage fallback:', err);
      }

      setPlaylists((prev) => [newPl, ...prev]);
      setSelectedPlaylistId(newPl.id);

      addToast({
        title: 'Crate Saved',
        message: `Created playlist "${newPl.name}" with ${newPl.trackIds.length} tracks.`,
        type: 'success',
      });

      return newPl;
    },
    [addToast]
  );

  const generateAiMetadataProposals = useCallback(
    async (tracksToInspect?: Track[]): Promise<MetadataProposal[]> => {
      const targetTracks = tracksToInspect || tracksRef.current;
      const service = new AiMetadataService(ollamaClient);
      const proposals = await service.generateMetadataSuggestions(targetTracks);

      if (proposals.length > 0) {
        setMetadataProposals((prev) => {
          const existingIds = new Set(prev.map((p) => `${p.trackId}-${p.field}`));
          const novel = proposals.filter((p) => !existingIds.has(`${p.trackId}-${p.field}`));
          return [...novel, ...prev];
        });

        addToast({
          title: 'AI Tag Suggestions Ready',
          message: `Generated ${proposals.length} tag proposal(s) with confidence scores for review.`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'No Tag Proposals',
          message: 'All tracks have clean metadata or no evidence available.',
          type: 'info',
        });
      }

      return proposals;
    },
    [addToast]
  );

  const searchOnlineMetadata = useCallback(
    async (query: EnrichmentSearchQuery): Promise<EnrichmentCandidate[]> => {
      const service = new OnlineEnrichmentService(settings.onlineEnrichment.serpApiKey);
      return service.searchCandidates(
        query,
        settings.onlineEnrichment.provider === 'serpapi' ? 'serpapi' : 'musicbrainz'
      );
    },
    [settings.onlineEnrichment.serpApiKey, settings.onlineEnrichment.provider]
  );

  const fetchCoverArt = useCallback(
    async (releaseId: string): Promise<CoverArtResult | null> => {
      const service = new OnlineEnrichmentService();
      return service.fetchCoverArt(releaseId);
    },
    []
  );

  const fetchLyrics = useCallback(
    async (title: string, artist: string, album?: string, duration?: number): Promise<LyricsResult | null> => {
      const service = new OnlineEnrichmentService();
      return service.fetchLyrics(title, artist, album, duration);
    },
    []
  );

  const convertTracks = useCallback(
    async (
      tracksToConvert: Track[],
      options: ConversionOptions,
      onProgress?: (p: ConversionProgress) => void
    ): Promise<ConversionBatchReport> => {
      const service = new AudioConversionService();
      const items = tracksToConvert.map((t) => {
        const dummyBlob = new Blob([new ArrayBuffer(1024)], { type: 'audio/wav' });
        return { track: t, blob: dummyBlob };
      });
      return service.convertBatch(items, options, tracksRef.current, onProgress);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        route,
        setRoute: handleSetRoute,
        settings,
        updateSettings,
        toggleTheme,
        layout,
        updateLayout,
        isVisualizerOpen,
        setIsVisualizerOpen,
        toggleVisualizer,
        playFromLibrary,
        tracks,
        selectedTrack,
        setSelectedTrack,
        playlists,
        selectedPlaylistId,
        setSelectedPlaylistId,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        playPlaylist,
        playlistModalTrack,
        setPlaylistModalTrack,
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
        editProposalValue,
        applyApprovedProposals,
        updateTrackMetadata,
        applyRenameTemplate,
        runHealthCheck,
        editTrackModal,
        setEditTrackModal,
        enrichmentModalTrack,
        setEnrichmentModalTrack,
        conversionModalTracks,
        setConversionModalTracks,
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
        aiConnection,
        aiInstalledModels,
        testAiConnection,
        discoverAiModels,
        sendTestAiPrompt,
        generateAiPlaylistProposal,
        saveAiPlaylist,
        generateAiMetadataProposals,
        ollamaClient,
        searchOnlineMetadata,
        fetchCoverArt,
        fetchLyrics,
        convertTracks,
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
