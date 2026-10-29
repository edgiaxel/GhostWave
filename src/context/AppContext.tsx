import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Track,
  Playlist,
  PlaybackState,
  LibraryIssue,
  MetadataProposal,
  AppSettings,
  AppRoute,
} from '../types';

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
  togglePlayPause: () => void;
  playTrack: (trackId: string) => void;
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
  scanProgress: number;
  triggerScan: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
}

const INITIAL_TRACKS: Track[] = [
  {
    id: 'trk-1',
    filePath: '/Volumes/GhostArchive/Halloween_OST_1978_FLAC/01_Main_Theme.flac',
    fileName: '01_Main_Theme.flac',
    fileSizeBytes: 42800000,
    lastModified: 1729800000000,
    format: 'flac',
    title: 'Halloween Main Theme',
    artist: 'John Carpenter',
    album: 'Halloween (Original Motion Picture Soundtrack)',
    albumArtist: 'John Carpenter',
    genre: ['Soundtrack', 'Electronic', 'Horror'],
    year: 1978,
    trackNumber: 1,
    diskNumber: 1,
    durationSeconds: 178,
    bitrateKbps: 921,
    sampleRateHz: 96000,
    hasEmbeddedPicture: true,
    availability: 'available',
    addedAt: 1729800000000,
    favorite: true,
  },
  {
    id: 'trk-2',
    filePath: '/Volumes/GhostArchive/Halloween_OST_1978_FLAC/02_Lauries_Theme.flac',
    fileName: '02_Lauries_Theme.flac',
    fileSizeBytes: 31200000,
    lastModified: 1729800000000,
    format: 'flac',
    title: "Laurie's Theme",
    artist: 'John Carpenter',
    album: 'Halloween (Original Motion Picture Soundtrack)',
    albumArtist: 'John Carpenter',
    genre: ['Soundtrack', 'Horror'],
    year: 1978,
    trackNumber: 2,
    diskNumber: 1,
    durationSeconds: 134,
    bitrateKbps: 890,
    sampleRateHz: 96000,
    hasEmbeddedPicture: true,
    availability: 'available',
    addedAt: 1729800000000,
  },
  {
    id: 'trk-3',
    filePath: '/Volumes/GhostArchive/SpookyBeats/Ghost_In_The_Machine.flac',
    fileName: 'Ghost_In_The_Machine.flac',
    fileSizeBytes: 58000000,
    lastModified: 1729810000000,
    format: 'flac',
    title: 'Ghost In The Machine (Spectral Dub)',
    artist: 'The Police // Spectral Remaster',
    album: 'Ghost In The Machine (Deluxe)',
    genre: ['Post-Punk', 'Dub', 'New Wave'],
    year: 1981,
    trackNumber: 3,
    durationSeconds: 245,
    bitrateKbps: 1042,
    sampleRateHz: 96000,
    hasEmbeddedPicture: true,
    availability: 'available',
    addedAt: 1729810000000,
    favorite: true,
  },
  {
    id: 'trk-4',
    filePath: '/Volumes/GhostArchive/Unsorted/Track04_unknown.mp3',
    fileName: 'Track04_unknown.mp3',
    fileSizeBytes: 8400000,
    lastModified: 1729812000000,
    format: 'mp3',
    title: 'Track 04 (Corrupted ID3)',
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    genre: ['Ambient'],
    durationSeconds: 212,
    bitrateKbps: 320,
    sampleRateHz: 44100,
    hasEmbeddedPicture: false,
    availability: 'available',
    addedAt: 1729812000000,
  },
  {
    id: 'trk-5',
    filePath: '/Volumes/GhostArchive/Boneyard/Danse_Macabre_Op40.flac',
    fileName: 'Danse_Macabre_Op40.flac',
    fileSizeBytes: 71000000,
    lastModified: 1729814000000,
    format: 'flac',
    title: 'Danse Macabre, Op. 40',
    artist: 'Camille Saint-Saëns',
    album: 'Symphonic Poems',
    genre: ['Classical', 'Orchestral'],
    year: 1874,
    trackNumber: 1,
    durationSeconds: 432,
    bitrateKbps: 880,
    sampleRateHz: 96000,
    hasEmbeddedPicture: true,
    availability: 'available',
    addedAt: 1729814000000,
  },
];

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    name: 'Spooky Synth & OSTs',
    description: 'Dark synthwave, John Carpenter horrors, and ambient tension.',
    trackIds: ['trk-1', 'trk-2', 'trk-3'],
    createdAt: 1729800000000,
    updatedAt: 1729810000000,
    icon: 'skull',
  },
  {
    id: 'pl-2',
    name: 'Spectral FLAC Vault',
    description: 'Lossless 24-bit studio masters for audio visualizer testing.',
    trackIds: ['trk-1', 'trk-3', 'trk-5'],
    createdAt: 1729811000000,
    updatedAt: 1729812000000,
    icon: 'graphic_eq',
  },
  {
    id: 'pl-3',
    name: 'Gemma Midnight Mix (AI)',
    description: 'Generated from query: Calm horror ambience under 45 minutes.',
    trackIds: ['trk-2', 'trk-4'],
    createdAt: 1729813000000,
    updatedAt: 1729813000000,
    isAiGenerated: true,
    icon: 'smart_toy',
  },
];

const INITIAL_ISSUES: LibraryIssue[] = [
  {
    id: 'iss-1',
    trackId: 'trk-4',
    issueType: 'missing_tags',
    severity: 'high',
    description: 'Missing Artist, Album, and Year in ID3v2 container.',
    details: { path: 'Track04_unknown.mp3', fields: ['artist', 'album', 'year'] },
    suggestedAction: 'Run Local AI Tag Deduction or MusicBrainz lookup',
  },
  {
    id: 'iss-2',
    trackId: 'trk-4',
    issueType: 'inconsistent_naming',
    severity: 'medium',
    description: 'Filename does not match standard pattern {artist} - {title}.ext',
    suggestedAction: 'Rename to "Unknown Artist - Track 04.mp3"',
  },
  {
    id: 'iss-3',
    trackId: 'trk-1',
    issueType: 'missing_tags',
    severity: 'low',
    description: 'Missing lyric synchronization timestamp metadata.',
    suggestedAction: 'Optional enrichment',
  },
];

const INITIAL_PROPOSALS: MetadataProposal[] = [
  {
    id: 'prop-1',
    trackId: 'trk-4',
    field: 'artist',
    currentValue: 'Unknown Artist',
    proposedValue: 'Goblin',
    source: 'ai_gemma',
    confidence: 0.88,
    status: 'pending',
  },
  {
    id: 'prop-2',
    trackId: 'trk-4',
    field: 'title',
    currentValue: 'Track 04 (Corrupted ID3)',
    proposedValue: 'Suspiria (Main Theme)',
    source: 'ai_gemma',
    confidence: 0.91,
    status: 'pending',
  },
  {
    id: 'prop-3',
    trackId: 'trk-4',
    field: 'album',
    currentValue: 'Unknown Album',
    proposedValue: 'Suspiria OST (1977)',
    source: 'ai_gemma',
    confidence: 0.85,
    status: 'pending',
  },
];

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
        // Fall back to initial settings if parsing fails
      }
    }
    return INITIAL_SETTINGS;
  });

  const [tracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [playlists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [libraryIssues] = useState<LibraryIssue[]>(INITIAL_ISSUES);
  const [metadataProposals, setMetadataProposals] = useState<MetadataProposal[]>(INITIAL_PROPOSALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTrackId: 'trk-3',
    isPlaying: false,
    currentTimeSeconds: 42,
    durationSeconds: 245,
    volume: 0.85,
    isMuted: false,
    repeatMode: 'all',
    shuffle: false,
  });

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
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'halloween-dark' ? 'halloween-light' : 'halloween-dark',
    });
    addToast({
      title: 'Theme Changed',
      message: `Active palette: ${
        settings.theme === 'halloween-dark' ? 'Halloween Light' : 'Halloween Dark'
      }`,
      type: 'info',
    });
  };

  const togglePlayPause = () => {
    setPlaybackState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const playTrack = (trackId: string) => {
    const trk = tracks.find((t) => t.id === trackId);
    if (trk) {
      setSelectedTrack(trk);
      setPlaybackState((prev) => ({
        ...prev,
        currentTrackId: trackId,
        isPlaying: true,
        currentTimeSeconds: 0,
        durationSeconds: trk.durationSeconds,
      }));
      addToast({
        title: 'Now Playing',
        message: `${trk.title} by ${trk.artist}`,
        type: 'info',
      });
    }
  };

  const nextTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === playbackState.currentTrackId);
    const nextIdx = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIdx].id);
  };

  const prevTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === playbackState.currentTrackId);
    const prevIdx = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIdx].id);
  };

  const seekTrack = (seconds: number) => {
    setPlaybackState((prev) => ({ ...prev, currentTimeSeconds: seconds }));
  };

  const setVolume = (vol: number) => {
    setPlaybackState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, vol)), isMuted: false }));
  };

  const toggleMute = () => {
    setPlaybackState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleShuffle = () => {
    setPlaybackState((prev) => ({ ...prev, shuffle: !prev.shuffle }));
    addToast({
      title: 'Playback Mode',
      message: playbackState.shuffle ? 'Shuffle disabled' : 'Shuffle enabled',
      type: 'info',
    });
  };

  const toggleRepeat = () => {
    const modes: PlaybackState['repeatMode'][] = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(playbackState.repeatMode) + 1) % modes.length];
    setPlaybackState((prev) => ({ ...prev, repeatMode: nextMode }));
    addToast({
      title: 'Repeat Mode',
      message: `Repeat set to ${nextMode}`,
      type: 'info',
    });
  };

  const approveProposal = (id: string) => {
    setMetadataProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );
    addToast({
      title: 'Proposal Approved',
      message: 'Pending tag modification approved for application.',
      type: 'success',
    });
  };

  const rejectProposal = (id: string) => {
    setMetadataProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    );
    addToast({
      title: 'Proposal Rejected',
      message: 'Proposed change rejected.',
      type: 'info',
    });
  };

  const triggerScan = () => {
    setIsScanning(true);
    setScanProgress(10);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          addToast({
            title: 'Scan Complete',
            message: 'All 1,428 local files verified and indexed.',
            type: 'success',
          });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
        triggerScan,
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
