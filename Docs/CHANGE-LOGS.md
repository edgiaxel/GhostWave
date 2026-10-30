# GhostWave Changelog

All notable changes to the GhostWave project will be documented in this file after each prompt and milestone.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.7.0] - S6: Halloween Visualizer, Slide-Up Drawer & Resizable Fixed Shell (2026-10-30)

### Added
- **Fixed Resizable Layout Engine & Viewport Bounds (`src/components/layout/AppShell.tsx`, `Header.tsx`, `Sidebar.tsx`, `BottomPlayer.tsx`)**:
  - Pinned the Header, Sidebar, and Bottom Player to fixed viewport positions so scrolling the main dashboard never moves the transport controls or hides them off-screen.
  - Implemented interactive drag-to-resize handles on all three framing elements with strict boundary limits:
    - **Header**: Min 52px, max 84px, default 64px (resizable via bottom border handle or keyboard up/down arrows).
    - **Sidebar**: Min 180px, max 380px, default 240px (resizable via right border handle or keyboard left/right arrows).
    - **Bottom Player**: Min 68px, max 120px, default 76px (resizable via top border handle or keyboard up/down arrows).
  - Main scrollable area is bound strictly between the Header and Bottom Player with independent vertical scrolling, preventing content obstruction at both top and bottom extremes.
  - Layout dimensions automatically persist to local storage (`ghostwave_layout_sizes`).
- **Slide-Up "Now Playing & Visualizer" Drawer (`src/components/common/NowPlayingDrawer.tsx`)**:
  - Added an expandable toggle arrow (`expand_less` / `expand_more`) on the right side of the Bottom Player.
  - When activated, slides up a full-width immersive stage spanning the viewport below the Header and above the Bottom Player:
    - **Audio-Reactive Canvas (Left / Center)**: High-performance 60fps Web Audio visualizer connected to the `PlaybackEngine`'s `AnalyserNode`.
    - **Live Playback Queue (Right Panel)**: Integrated "Up Next Queue" with live currently-playing track banner, reordering controls (move up / down), remove buttons, and "Clear Queue" action.
  - **Auto Queue Population**:
    - Playing any track from **My Library** automatically populates upcoming library tracks into the queue.
    - Playing any track from a **Playlist** automatically populates upcoming playlist tracks into the queue.
- **S6.1: Audio-Reactive Visualizer Engine**:
  - Connects directly to HTML5 Audio via Web Audio API `createMediaElementSource` and `AnalyserNode`.
  - Analyzes real-time frequency data and time-domain oscilloscope waveforms across bass, mid, and treble registers.
  - Graceful audio state handling: when audio is paused, ended, muted, or unavailable, renders gentle ambient breathing pulses without freezing, dropping frames, or spiking CPU/GPU.
  - Resource conservation: shuts down animation frames (`cancelAnimationFrame`) completely when the drawer is closed or unmounted.
- **S6.2: Visual Customization & Halloween Motifs**:
  - Four distinct visualizer presets:
    - `ghost_pulse`: Multi-ring spectral waves with frequency harmonic ripples.
    - `spectral_bars`: Frequency bar spectrum with peak highlight caps and theme-reactive gradients.
    - `waveform_rings`: Real-time audio waveform oscilloscope ring around a glowing core.
    - `pumpkin_pulse`: Spooky jack-o'-lantern audio aura with bass punch expansion.
  - Halloween Motifs: Optional floating spectral ember particles reacting dynamically to bass and mid frequencies.
  - Sensitivity adjustment slider (20% to 150%) and preset choices persist in `settings.visualizer`.
- **S6.3: Usability, Contrast & Butterchurn Evaluation**:
  - Full contrast verification across light and dark Halloween themes (`halloween-dark` and `halloween-light`).
  - Accessibility: `prefers-reduced-motion` detection dynamically scales down particle speed and pulsation amplitudes for sensitive users.
  - Butterchurn Evaluation: Analyzed WebAssembly Milkdrop emulation (Butterchurn). Kept lightweight native Canvas 2D as the primary zero-dependency, 100% offline visualizer for guaranteed responsiveness on all desktop hardware.
- **Test Suite (`src/test/s6-visualizer-theme.test.tsx`)**:
  - Created 7 integration tests covering layout limit clamping, resize handles, slide-up drawer toggles, auto queue population from library and playlists, visualizer preset selection, and theme dataset switching.
  - All 48 tests passing across 6 test suites with 0 errors and verified production build.

---

## [0.6.0] - S5: Library Health, Metadata Editing, and Safe Renaming (2026-10-30)

### Added
- **S5.1: Deterministic Library-Health Report (`src/services/health/LibraryHealthService.ts`)**:
  - Deterministic library analysis detecting:
    - Missing tags: identifies blank or generic titles, empty or unknown artists, and missing albums. Automatically generates high-confidence tag proposals from "Artist - Title" filename heuristics.
    - Inconsistent naming patterns: compares filenames against configurable templates (e.g. `{artist} - {title}`) and flags divergences, snake_case underscores, or mismatched prefixes.
    - Exact duplicates: pairs files sharing identical byte sizes and durations with matching formats.
    - Possible metadata duplicates: identifies tracks across different files sharing normalized artist and title tags while preserving both entries for user review.
  - Generates structured, classified `LibraryIssue` records categorized by type and severity (`high`, `medium`, `low`) with actionable suggestions.
- **S5.2: Manual Metadata Editing and Validation (`src/services/health/MetadataEditService.ts`, `src/components/common/MetadataEditModal.tsx`)**:
  - `MetadataEditService`: Validation engine ensuring non-empty title and artist, realistic release years (1800-2100), and valid track numbers (1-999).
  - Safe, non-destructive metadata updates preserving immutable file descriptors (`id`, `filePath`, `format`, `fileSizeBytes`, `durationSeconds`).
  - `MetadataEditModal`: Accessible modal dialog with live inline validation errors, pending diff comparison preview (showing before and after), and clear feedback toasts. Accessible from library table rows, grid card hover menus, and health issue cards.
- **S5.3: Naming Templates and Safe Rename Preview (`src/services/health/MetadataEditService.ts`, `src/screens/HealthCleanupScreen.tsx`)**:
  - Configurable filename standardization supporting `{artist}`, `{title}`, `{album}`, and `{trackNumber}` tokens with quick-insertion buttons.
  - Safe rename simulation computing proposed names, detecting filename collisions across multiple files, and flagging invalid filesystem characters (`<>:"/\\|?*`).
  - Collision and error prevention: tracks with missing fields or conflicting destinations are flagged and prevented from applying.
- **S5.4: User-Approved Execution, Preservation, and UI Workflows (`src/screens/HealthCleanupScreen.tsx`, `src/context/AppContext.tsx`)**:
  - Zero silent changes: proposed tag diffs require explicit per-row approval before being applied to the library.
  - Health & Cleanup interface featuring:
    - Summary stat cards: total indexed tracks, detected issues, pending proposals, and standardizer readiness.
    - Issue category filter pills: `All Issues`, `Missing Tags`, `Inconsistent Naming`, and `Duplicates`.
    - Proposed Tag Diffs table with approve/reject actions, confidence percentage, and bulk application.
    - Filename Standardizer tab with live preview table and collision indicators.
  - Playlist reference preservation: updating track tags updates the indexed track record without breaking existing playlist references or queued playback items.
- **Test Suite (`src/test/s5-health-metadata.test.tsx`)**:
  - Added 7 comprehensive integration tests covering deterministic issue detection, exact vs metadata duplicate separation, live metadata validation, non-destructive updates, collision detection, user approval workflows, and playlist reference preservation.
  - All 41 tests passing across 5 test suites with 0 failures and clean production build.

---

## [0.5.0] - S4: Library Search and Playlists (2026-10-30)

### Added
- **S4.1: Library Search, Sorting, and Filtering**:
  - Offline deterministic search matching against `title`, `artist`, `album`, `albumArtist`, `format`, `fileName`, and `genre`.
  - Format and artwork filter pills: `All Tracks`, `FLAC`, `MP3`, `WAV`, and `Missing Art`.
  - Sort dropdown with direction toggle supporting `title`, `artist`, `album`, `duration`, `addedAt`, and `trackNumber`.
  - Empty search state with one-click "Reset Search and Filters" action.
  - Active search and filter indicator bar summarizing filtered track count and active query terms.
- **S4.2: Playlist CRUD & Smart Crates**:
  - `src/services/storage/IndexedDbRepository.ts`: Upgraded DB version to 2 and added persistent `playlists` object store (`getAllPlaylists`, `getPlaylistById`, `savePlaylist`, `deletePlaylist`).
  - `src/components/common/AddToPlaylistModal.tsx`: Accessible dialog to add any track from the library table or grid card to existing playlists or create a new playlist on the fly.
  - `src/screens/PlaylistsScreen.tsx`: Complete management interface supporting playlist creation (required name, optional description, icon picker, accent color), in-place renaming/editing, track reordering (up/down), track removal, and deletion confirmation modal dialog.
  - Reference safety invariant: When tracks are removed from the library index, `removeTrackFromLibrary` safely cascades to strip track IDs from all stored playlists and queue items without corrupting records.
- **S4.3: Playlist Playback, Queue Integration & Persistence**:
  - "Play All" and individual track play from playlists: starts playback of selected/first track and enqueues all upcoming tracks into the playback queue.
  - Playlists and track ordering persist offline in IndexedDB across page reloads and browser restarts.
- **Player Layout Fix**:
  - Centered transport controls in `BottomPlayer.tsx` using `absolute left-1/2 -translate-x-1/2` with symmetric fixed-width side panels, guaranteeing zero layout shift when track titles or cover art change width on the left.
- **Test Suite**:
  - Created `src/test/s4-playlists.test.tsx` containing 8 comprehensive integration tests for S4.1, S4.2, and S4.3.
  - All 34 tests passing across 4 test suites with clean production build (`npm run build`).

---

## [0.4.1] - S3: Playback Engine Fix & Audio Persistence (2026-10-30)

### Fixed
- **StrictMode PlaybackEngine Destruction**: Fixed issue where React 18 `StrictMode` effect cleanup in `AppContext` called `engine.destroy()`, permanently setting `audio` to `null` on startup. The effect cleanup now detaches event listeners via `engine.setEvents({})` without terminating the underlying audio element.
- **Offline Audio Blob Persistence**: `LibraryScanner` now persists audio file blobs to IndexedDB's `blobs` object store via `saveAudioBlob`. `WebFilePlatform.getAudioUrl` now queries IndexedDB if a track is not present in the in-memory cache, ensuring playback works across page reloads and browser restarts.
- **Seekbar & Playback Progress**: Connected live `timeupdate` events to `BottomPlayer` slider, fixed readyState seek timing, and clamped seek slider values to prevent out-of-bounds duration jumps.
- **Honest Error Handling**: Eliminated silent playback state simulation when an audio file is missing; now triggers explicit `error` status and informs the user with an actionable error toast.
- **Track List & Card Interaction**: Clicking an already-playing track in the table, grid, or hero featured banner toggles play/pause instead of restarting the song from the beginning.
- **Expanded Test Suite**: Added 3 new tests in `src/test/s3-playback.test.tsx` verifying IndexedDB blob playback, unmount resilience, and unavailable track error handling (26 total tests passing).

---

## [0.4.0] - S3: Playback and Queue (2026-10-30)

### Added
- **S3.1: Playback Engine & Transport Core**:
  - `src/services/playback/PlaybackEngine.ts`: Dedicated HTML5 Audio & Web Audio API transport engine handling explicit playback lifecycle states: `idle`, `loading`, `playing`, `paused`, `ended`, and `error`.
  - Methods for `loadAndPlay`, `play`, `pause`, `seek`, `setVolume`, and `setMuted` with safe audio clamping and error handling.
  - Exposes Web Audio `AnalyserNode` with 2048 FFT size for live visualizer frequency reactivity.
- **S3.2: Queue Management & Interactive Drawer**:
  - `src/components/common/QueueModal.tsx`: Real queue drawer modal supporting track reordering, removing items, clear queue, and showing now-playing indicator.
  - `AppContext.tsx`: Integrated queue methods (`addToQueue`, `removeFromQueue`, `moveQueueItem`, `clearQueue`, `playQueueItem`) with queue count badge on bottom player.
  - Priority auto-advance: when a track ends, the engine advances from the upcoming queue first, then falls back to library tracks or repeat loop.
- **S3.3: Playback Modes & Accessible Player Controls**:
  - Seamless repeat modes (`off`, `all`, `one`) and shuffle toggle with state indicators.
  - `src/components/layout/BottomPlayer.tsx`: Connected to real engine and live queue. Clean empty state when no track is active; real scrub bar, time display, volume controls, and format badge.
  - Safe zero-mock workflow: completely removed hardcoded placeholder tracks (`INITIAL_TRACKS`), mock issues, and mock proposals; library and playback operate entirely on real imported user files.
- **S3.4: Tests & Verification**:
  - `src/test/s3-playback.test.tsx`: 7 comprehensive tests covering PlaybackEngine state machine, seek/volume/mute clamping, AnalyserNode connection, queue additions/removals/clearing, and repeat/shuffle mode toggling.
  - All 23 tests across the entire test suite passing with 0 errors.

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
