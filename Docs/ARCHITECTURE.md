# GhostWave Architecture & Module Contracts

This document locks the technical decisions and module contracts established in Stage S0. It serves as the single source of truth for interfaces and boundaries across the skeleton and feature implementations.

---

## 1. Repository Baseline & Audit Summary (S0.1)

- **Repository status:** Greenfield Git repository (`main` branch) with initial documentation files.
- **Tracked/Untracked files:**
  - `README.md` (Project overview, capability tiers, and MVP scope)
  - `Docs/AGENT.md` (Instructions, workflow rules, and reporting requirements)
  - `Docs/APP-WORKFLOW.md` (Screen-by-screen specifications and user interaction states)
  - `Docs/PROJECT.md` (Comprehensive product vision, target users, and technical strategy)
  - `Docs/STAGES.md` (Staged development plan and completion gates)
- **Runtime Environment:**
  - Node.js `v22.22.1`
  - npm `9.2.0`
  - Linux (ext4/btrfs, case-sensitive filesystem)
  - Rust/Cargo: Not yet installed in the current environment (Tauri desktop packaging will be isolated behind platform interfaces so development and web builds proceed immediately without blocking on Rust toolchains).
- **Preserved Assets:** All existing documentation in `Docs/` and `README.md` is strictly preserved.

---

## 2. Technical Decisions & Stack Lock (S0.2)

### 2.1 Core Framework & Tooling
- **Frontend Framework:** React with TypeScript.
- **Build Tool:** Vite (fast ESM builds, native TypeScript support, optimized production bundling for Render).
- **Package Manager:** `npm` (verified installed and available in the environment).
- **Testing Framework:** Vitest + React Testing Library (native Vite integration, ultra-fast in-memory execution, module mocking for isolated contract tests).
- **Styling Architecture:** Modern CSS variables and design tokens for the Halloween Dark / Halloween Light theme system, avoiding heavy external runtime UI dependencies.

### 2.2 Platform Decoupling (Browser vs Desktop)
GhostWave targets both Web (deployed on Render) and Desktop (Tauri 2 on Linux/Windows). To prevent platform lock-in and avoid crashes when desktop APIs are unavailable, all filesystem and native operations sit behind a unified platform interface:

| Capability | Web (Render) | Desktop (Tauri 2) |
| :--- | :--- | :--- |
| **File Selection** | HTML5 file input / File System Access API (`showOpenFilePicker`, `showDirectoryPicker` where supported) | Native OS file picker dialogs with path access |
| **Audio Stream / Read** | Web `File` objects converted to Object URLs (`URL.createObjectURL`) | Local file protocol or asset protocol streaming |
| **Folder Scanning** | Webkit directory drop / picker (flat or recursive File list) | Recursive native filesystem directory walker |
| **File Renaming** | Virtual renaming in index (Browser sandbox forbids silent disk file rename; download offered) | Direct atomic filesystem rename via scoped permissions |
| **Metadata Tag Writing** | Download modified file blob with updated ID3/Vorbis tags | In-place atomic tag rewrite to disk file |
| **Local AI Connection** | HTTP request to local Ollama (`http://127.0.0.1:11434`) with CORS configured | Direct HTTP / localhost socket communication |
| **Persistence** | IndexedDB (`idb` / Dexie) + LocalStorage | IndexedDB (in Webview) or SQLite / JSON storage |

### 2.3 Metadata Parsing & Audio Engine
- **Audio Metadata Parser:** `music-metadata-browser` (pure TypeScript/JavaScript parser supporting MP3/ID3v1/ID3v2, FLAC, Ogg Vorbis, M4A/AAC, WAV). Reads browser `File` and `Blob` directly without native C++ compilation.
- **Audio Playback:** HTML5 Audio (`HTMLAudioElement`) combined with the Web Audio API (`AudioContext`, `AnalyserNode`) for low-latency visualizer data extraction.

### 2.4 Persistence Strategy
- **Library & Content Store:** IndexedDB via a typed repository pattern. Stores tracks, playlists, listening history, and pending proposals.
- **Application Preferences:** LocalStorage for lightweight UI state (active theme, volume level, sidebar collapsed state, active tab).

---

## 3. Module Boundaries & Dependency Graph (S0.3)

To ensure a modular, test-driven architecture, GhostWave enforces strict unidirectional dependencies. Modules communicate through typed service contracts and never create circular references.

```
+-------------------------------------------------------------+
|                        UI Screens                           |
| (Library, Playlists, Cleanup, Visualizer, History, Settings)|
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                      State / Hooks                          |
|    (usePlayback, useLibrary, usePlaylists, useSettings)     |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                    Core Domain Services                     |
|  - PlaybackService      - AudioLibraryService               |
|  - PlaylistService      - MetadataService                   |
|  - VisualizerService    - CleanupService                    |
|  - LocalAIService       - OnlineEnrichmentService           |
+-------------------------------------------------------------+
               |                               |
+-----------------------------+ +-----------------------------+
|    Platform File Adapter    | |   Storage Repository Layer  |
|  (WebAdapter / TauriAdapter)| |       (IndexedDB Store)     |
+-----------------------------+ +-----------------------------+
```

### Dependency Direction Rules
1. **UI Layer:** Depends only on State Hooks and Domain Contracts. Never accesses IndexedDB or native filesystem APIs directly.
2. **Domain Services:** Pure business and state logic. Depend only on domain types and abstract storage/platform interfaces.
3. **Platform Adapters:** Implement the `FileOperationsPlatform` contract. Web and Tauri variants are interchangeable.
4. **Local AI / Online Enrichment:** Completely decoupled. If Ollama or MusicBrainz is unreachable, the core domain operates uninterrupted.

---

## 4. Shared Domain Types & Contracts (S0.3)

Below are the canonical TypeScript contracts for GhostWave.

```typescript
/**
 * Standard structured result wrapper for safe operation handling.
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  partialFailures?: Array<{ id: string; reason: string }>;
}

/**
 * Core Track representation in the library.
 */
export interface Track {
  id: string; // Deterministic hash of file path or content
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  lastModified: number;
  format: 'mp3' | 'flac' | 'ogg' | 'wav' | 'm4a' | 'aac' | 'unknown';
  
  // Audio metadata
  title: string;
  artist: string;
  album: string;
  albumArtist?: string;
  genre: string[];
  year?: number;
  trackNumber?: number;
  diskNumber?: number;
  durationSeconds: number;
  bitrateKbps?: number;
  sampleRateHz?: number;
  
  // Embedded artwork reference
  hasEmbeddedPicture: boolean;
  pictureMimeType?: string;
  pictureDataUrl?: string; // Optional cached thumbnail
  
  // Library status
  availability: 'available' | 'missing' | 'unreadable';
  addedAt: number;
}

/**
 * Playlist representation.
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  isAiGenerated?: boolean;
}

/**
 * Playback Queue Item.
 */
export interface QueueItem {
  queueId: string;
  trackId: string;
  addedAt: number;
}

/**
 * Transport playback state.
 */
export interface PlaybackState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTimeSeconds: number;
  durationSeconds: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  shuffle: boolean;
}

/**
 * Proposed metadata changes requiring user review before application.
 */
export interface MetadataProposal {
  id: string;
  trackId: string;
  field: 'title' | 'artist' | 'album' | 'genre' | 'year' | 'trackNumber' | 'fileName';
  currentValue: string | number | string[];
  proposedValue: string | number | string[];
  source: 'ai_gemma' | 'online_musicbrainz' | 'filename_heuristic' | 'manual';
  confidence: number; // 0.0 to 1.0
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

/**
 * Health issues detected in the local library.
 */
export interface LibraryIssue {
  id: string;
  trackId: string;
  issueType: 'missing_tags' | 'inconsistent_naming' | 'potential_duplicate' | 'unreadable_file';
  severity: 'low' | 'medium' | 'high';
  description: string;
  details?: Record<string, unknown>;
  suggestedAction?: string;
}

/**
 * Application Settings.
 */
export interface AppSettings {
  theme: 'halloween-dark' | 'halloween-light';
  accentPalette: 'pumpkin-orange' | 'spectral-green' | 'witch-violet' | 'blood-moon-red';
  localAi: {
    enabled: boolean;
    endpoint: string; // Default: 'http://127.0.0.1:11434'
    model: string;    // Default: 'gemma2:2b' or 'gemma:2b'
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
  };
  onlineEnrichment: {
    enabled: boolean;
    provider: 'musicbrainz' | 'none';
    lookupAlbumArt: boolean;
  };
  visualizer: {
    preset: 'spectral_bars' | 'ghost_pulse' | 'waveform_rings';
    sensitivity: number;
    colorCycle: boolean;
  };
  library: {
    autoScanOnStartup: boolean;
    renamePattern: string; // e.g. '{artist} - {title}'
  };
}

/**
 * Abstract platform interface for file operations.
 */
export interface FileOperationsPlatform {
  isDesktop(): boolean;
  selectAudioFiles(): Promise<File[]>;
  selectFolder(): Promise<File[]>;
  getAudioUrl(track: Track): Promise<string>;
  revokeAudioUrl(url: string): void;
  renameFile?(oldPath: string, newPath: string): Promise<OperationResult<string>>;
  writeMetadata?(track: Track, updates: Partial<Track>): Promise<OperationResult<boolean>>;
}
```

---

## 5. Error & Fallback Conventions

1. **Missing Files:** If an audio file is deleted or moved outside GhostWave, mark `availability: 'missing'`. Do not delete the track from playlists or remove its metadata index. Provide a manual "Locate File" or "Remove from Index" option.
2. **Corrupted / Incomplete Metadata:** If an audio file has no ID3/Vorbis tags, fall back to parsing the file name (`Title = filename without extension`, `Artist = Unknown Artist`). Flag it as a `missing_tags` library issue.
3. **Local AI Failure:** If Ollama is not running or Gemma fails to return structured JSON, return `OperationResult<T>` with a descriptive error. Never block manual playlist creation, searching, or audio playback.
4. **Online Lookups:** Must be strictly asynchronous and non-blocking. If offline, the search simply informs the user that network lookup is unavailable.

---

## 6. Next Step: Transition to Stage S1 (Modular Application Skeleton)

With Stage S0 complete:
1. Initialize the modular React + TypeScript + Vite project structure.
2. Configure Vitest for contract and component tests.
3. Establish the Halloween Design System tokens (Halloween Dark & Halloween Light).
4. Build the App Shell, navigation routing, and screen placeholders (S1.1, S1.2, S1.3).
