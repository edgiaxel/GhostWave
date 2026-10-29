# GhostWave Changelog

All notable changes to the GhostWave project will be documented in this file after each prompt and milestone.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] - S3: Playback & Queue (Planned)

### Planned
- S3.1: Playback engine with state transitions (idle, loading, playing, paused, ended, error).
- S3.2: Queue management (reordering, shuffle, repeat, wrap-around).
- S3.3: Playback UI integration with Web Audio graph and visualizer stream.
- S3.4: Tests and verification.

---

## [0.3.0] - S2: Local Library Import & Metadata Scan (2026-10-29)

### Added
- **S2.1: Platform File Operations Interface**:
  - `src/services/platform/WebFilePlatform.ts`: Implemented Web File System Access API (`showOpenFilePicker`, `showDirectoryPicker`) with transparent fallback to HTML input elements and in-memory Blob caching for immediate audio streaming.
  - `src/services/platform/TauriFilePlatform.ts`: Created desktop adapter scaffold ready for native Tauri 2 IPC dialogs and in-place tag updates.
  - `src/services/platform/index.ts`: Added dynamic platform resolver (`getPlatform()`) with graceful degradation.
- **S2.2: Local Audio Import, Validation & Metadata Extraction**:
  - `src/services/metadata/MetadataService.ts`: Added pure JS metadata extraction using `music-metadata-browser` for MP3, FLAC, OGG, WAV, M4A, and AAC. Extracts title, artist, album, genre, year, duration, bitrate, sample rate, and embedded cover art base64 data URLs.
  - Heuristic fallback parser when audio tags are missing, cleanly extracting artist and title from standard file naming conventions without throwing.
  - `src/services/scanner/LibraryScanner.ts`: Built batch audio scanner with deterministic ID generation (`trk-<hash>`) based on file size, timestamp, and name.
  - Live scanning telemetry with cancellation support and structured `ScanReport` (added, updated, skipped, unsupported, unreadable).
- **S2.3: Local Library Index & IndexedDB Persistence**:
  - `src/services/storage/IndexedDbRepository.ts`: Pure browser IndexedDB database (`ghostwave_library`) managing `tracks`, `blobs`, and `settings` object stores with indices for offline persistence.
  - Duplicate prevention: re-scanning unchanged audio files skips re-indexing.
  - Rescan behavior: verifies presence of current indexed tracks.
  - Non-destructive track removal: users can remove entries from the GhostWave index without touching disk files.
- **S2.4: Isolated and Integrated Tests**:
  - `src/test/s2-library.test.tsx`: 10 comprehensive tests covering format detection, filename heuristics, deterministic ID generation, unsupported file filtering, IndexedDB persistence, duplicate prevention, and UI import/removal flows.
  - All 16 unit and smoke tests passing with 0 errors.

---

## [0.2.0] - S1: Modular Application Skeleton (2026-10-29) [Approved]

### Refined (UI Streamlining & Decluttering Pass per User Feedback & Anti-Slop Skills)
- **Anti-Slop Cleanliness & Minimalism**:
  - Filtered out extraneous explanatory micro-text, dev telemetry labels (`AudioLibraryService // Core`, `Buffer Memory Lossless IPC`, `IndexedDB Store • Web File System / Tauri IPC`), and redundant commentary across all modules.
  - Implemented sleek modern aesthetic inspired by user reference designs (clean dark player, pill search bar, hero album banner, crisp album grid, and floating player bar).
- **Navigation & Sidebar (`src/components/layout/Sidebar.tsx`)**:
  - Streamlined width from `w-64` to compact `w-60`.
  - Replaced bulky two-line link labels and subtitles with clean single-line entries grouped into `Menu` and `Tools`.
  - Removed bottom diagnostic telemetry badges in favor of clean minimal navigation.
- **Header (`src/components/layout/Header.tsx`)**:
  - Redesigned search bar into an uncluttered pill search with subtle border and focus ring.
  - Simplified status badges into an unobtrusive offline dot and compact theme toggle button.
- **Bottom Player (`src/components/layout/BottomPlayer.tsx`)**:
  - Consolidated playback controls into a streamlined floating bottom deck.
  - Replaced technical diagnostics with clean bitrate/format pill (`FLAC 24/96`), polished progress track, and quiet volume controls.
- **Library Screen (`src/screens/LibraryScreen.tsx`)**:
  - Added a featured hero album banner with quick-play CTA and artwork backdrop.
  - Replaced telemetry cards with a clean album artwork grid and streamlined track table with hover controls.
- **Visualizer Screen (`src/screens/VisualizerScreen.tsx`)**:
  - Focused layout on the reactive canvas, compact preset selector pills, and minimal sensitivity slider.
- **Health & Cleanup Screen (`src/screens/HealthCleanupScreen.tsx`)**:
  - Replaced text-heavy explanations with compact issue stat chips and clear diff table.
- **Local AI Screen (`src/screens/LocalAiScreen.tsx`)**:
  - Replaced chatty micro-descriptions with clean input pill, quick suggestion chips, and structured crate list.
- **Settings Screen (`src/screens/SettingsScreen.tsx`)**:
  - Simplified theme and accent palette selectors into clean swatch cards; stripped verbose capability commentary.
- **Test Suite (`src/test/skeleton.test.tsx`)**:
  - Updated all 6 smoke tests to validate semantic headings and streamlined navigation hierarchy; all tests passing with 0 errors.

### Added
- **Stitch MCP Connection & Screen Reference Extraction**:
  - Connected to the Stitch MCP server (`https://stitch.googleapis.com/mcp`) using project `300094307329068637` ("Containerized Skeleton UI").
  - Downloaded high-resolution screenshots and HTML source code into `Docs/stitch-references/` for all 4 project screens:
    1. `visualizer.html` / `visualizer.png`: GhostWave Audio Reactive Visualizer (`8794ec02267c499d84fe1edc1633a74d`)
    2. `library.html` / `library.png`: GhostWave Audio Library & File Scanner (`eb3348e18c3445c189ae29b8c3bdd141`)
    3. `cleanup.html` / `cleanup.png`: GhostWave Library Health & Safe Diff Cleanup (`6fdfff6d0d9d41c18df3310b313ca12f`)
    4. `ai-playlist.html` / `ai-playlist.png`: GhostWave Local AI Playlist Assistant (`ae4d8f13f9d64ddd86737a9ffe19dee8`)
- **S1.1: App Shell and Navigation**:
  - `src/components/layout/Header.tsx`: Spooky audio lab brand identity, global track search input, offline-ready status indicator, and theme switcher.
  - `src/components/layout/Sidebar.tsx`: Deck modules navigation covering Library, Playlists, Health & Cleanup, Audio Visualizer, Local AI Assistant, Listening History, and Settings.
  - `src/components/layout/BottomPlayer.tsx`: Persistent now-playing bar featuring track thumbnail, title/artist, format indicator, transport buttons (Play/Pause, Prev, Next, Shuffle, Repeat), interactive seekbar with formatted duration, volume slider, mute toggle, and queue drawer launcher.
  - `src/components/layout/AppShell.tsx`: Container layout coordinating header, sidebar, main screen, and bottom player with keyboard shortcuts (Space for Play/Pause, Alt+Left/Right for Prev/Next).
  - `src/components/common/QueueModal.tsx`: Slide-over queue drawer accessible by keyboard (Escape to dismiss).
  - `src/components/common/ScanModal.tsx`: Platform-aware file and folder scan dialog explaining web vs. desktop file access differences.
  - `src/components/common/ToastContainer.tsx`: Accessible notifications layer for non-blocking feedback.
- **S1.2: Design System & Themes**:
  - `src/styles/tokens.css` and `src/styles/index.css`: Implemented Halloween Dark and Halloween Light themes with full WCAG AA contrast compliance, along with 4 coordinated accent palettes (Witch Violet, Spectral Green, Pumpkin Orange, Blood Moon Red).
  - Defined typography tokens (`Space Grotesk` for headlines/titles, `Geist` for body and code) and crisp border radii (`ROUND_FOUR` standard).
  - Added visible `:focus-visible` styling for comprehensive keyboard navigation.
- **S1.3: Screen Placeholders**:
  - `src/screens/LibraryScreen.tsx`: Audio Library & File Scanner with stats banner, folder scanning simulation, quick filter pills (FLAC, MP3, Missing Art), Table/Grid view toggle, track list, and technical metadata inspector.
  - `src/screens/PlaylistsScreen.tsx`: Smart Crates & AI Mixes with playlist list, track counts, crate details, and new playlist creation flow.
  - `src/screens/HealthCleanupScreen.tsx`: Library Health & Safe Diff Cleanup with issue detection cards, side-by-side current vs. proposed tag diffs, and non-destructive approval controls.
  - `src/screens/VisualizerScreen.tsx`: Audio-reactive HTML5 canvas visualizer featuring live WebAudio telemetry (FFT 2048, 60 FPS), three spectral presets (Ghost Pulse, Spectral Bars, Waveform Rings), real-time energy bands (Sub, Bass, Mid), and sensitivity adjustment.
  - `src/screens/LocalAiScreen.tsx`: Local AI Assistant with Ollama connection status, natural language prompt input with suggestion chips, strict JSON schema validator display, and candidate tracks preview.
  - `src/screens/ListeningHistoryScreen.tsx`: Local playback metrics, play counts, and private history management.
  - `src/screens/SettingsScreen.tsx`: Theme toggling, accent palette picker, Ollama endpoint/model settings with connection tester, and web vs desktop platform capability matrix.
  - `src/screens/NotFoundScreen.tsx`: Spooky 404 recovery screen with a direct link back to Library.
- **S1.4: Skeleton Smoke Tests**:
  - `src/test/skeleton.test.tsx`: 6 comprehensive Vitest/React Testing Library tests covering shell rendering, cross-screen navigation, theme persistence, playback transport state changes, modal keyboard dismissal, and proposal approval flows.

### Changed
- `Docs/STAGES.md`: Updated checklist items for S1.1, S1.2, S1.3, and S1.4 to completed (`[x]`). S1 exit gate approved by Axel on 2026-10-29.

---

## [0.1.0] - S0: Repository Audit & Architecture Lock (2026-10-29)

### Added
- `Docs/ARCHITECTURE.md`: Technical architecture specification, platform capability matrix, and shared domain contracts.
- `Docs/CHANGE-LOGS.md`: Project changelog following Keep a Changelog conventions.

### Changed
- `Docs/STAGES.md`: Marked checklist items for S0.1, S0.2, and S0.3 as completed.
