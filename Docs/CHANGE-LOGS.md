# GhostWave Changelog

All notable changes to the GhostWave project will be documented in this file after each prompt and milestone.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.14.0] - Render Deployment, Product Origin Story, Walkthrough Demo Video & DEV Submission (2026-11-01)

### Added
- **Render Production Deployment Architecture (`render.yaml`, `public/_redirects`)**:
  - Configured Render Blueprint (`render.yaml`) specifying static web service runtime with automated build command (`npm install && npm run build`), static publish path (`./dist`), and security headers.
  - Implemented seamless SPA routing via `public/_redirects` (`/* /index.html 200`) and Render route rewrite rules to eliminate 404 errors on deep routes.
- **Product Origin Story & Polished README (`README.md`, `docs/assets/youtube_thumbnail.jpg`)**:
  - Detailed the "Ghost in the Machine" origin story: the Halloween Eve thunderstorm power outage, loss of cloud streaming services, and the need for local-first music playback with local open-weight AI (Gemma 3 via Ollama) running offline.
  - Comprehensive feature tour, architecture diagram, local AI setup instructions, Tauri desktop compilation steps, and QA verification evidence.
- **YouTube Video Thumbnail Artwork**:
  - Rendered 16:9 4K visual identity thumbnail with neon orange and purple spectral audio waveforms, glowing Jack-o'-Lanterns, glassmorphic now-playing card, and bold GhostWave branding.
- **High-Definition Product Walkthrough Video (`docs/ghostwave_product_demo.mp4`, `scripts/record-demo.spec.ts`)**:
  - Built automated Playwright recording pipeline capturing the live running application across 8 core scenes at 1920x1080 resolution.
  - Assembled with ffmpeg featuring cinematic fade-in/fade-out title cards and exported to `docs/ghostwave_product_demo.mp4` (93 seconds, 1080p, 30fps).
- **Official DEV Submission Draft (`docs/DEV_CHALLENGE_POST.md`)**:
  - Complete, formatted submission post for Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine.
  - Covers What I Built, Demo links, Code embed, How I Built It, Why Open Innovation Matters, The Spirit of It, and Partner Prize Track entries (Google Cloud/Gemma, Sentry Observability, SerpApi).

---

## [0.13.0] - Comprehensive Automated QA & End-to-End Playwright Testing (2026-11-01)

### Added
- **Complete Playwright End-to-End Test Infrastructure (`playwright.config.ts`, `tests/`)**:
  - Configured Playwright running against the live running application (`http://localhost:5173`) with full screenshot, tracing, and video diagnostics.
  - Implemented 10 dedicated E2E test suites with 30 automated integration specs:
    - `tests/01-navigation-theme.spec.ts`: App shell launching, deck routing, drag-to-resize split panes, Halloween Dark vs Light theme switching, and local storage settings reload persistence.
    - `tests/02-library-management.spec.ts`: Real 74-track audio file import from `/home/axel/Music`, metadata extraction display, multi-field search filtering, empty search results, format filter pills (MP3/FLAC/All), table vs grid album card views, and corrupted audio failure resilience.
    - `tests/03-playback-transport.spec.ts`: Real audio playback progression, time elapsed tracking, pause/resume, next/previous navigation, seek slider, volume and mute toggle, shuffle, repeat mode cycle, slide-up visualizer drawer, and queue drawer.
    - `tests/04-playlists-crates.spec.ts`: Crate creation, adding tracks from library to crate, crate item inspection, title editing, and deletion with confirmation modal.
    - `tests/05-health-metadata.spec.ts`: Library health audit, issue category filtering (missing tags, naming inconsistencies), side-by-side proposed tag diffs, inline proposal editing, approval, renaming template preview, and zero-file-alteration safety invariants.
    - `tests/06-audio-conversion.spec.ts`: Row convert modal, WAV/OGG format selection, sample rate/channel configuration, custom suffix (`_pcm.wav`), real 16-bit PCM re-encoding, and non-destructive source preservation.
    - `tests/07-history-recommendations.spec.ts`: Playback session scrobbling, event classification, KPI metrics (Sessions, Listening Time, Skip Rate, Top Genre), recommendations tab with transparent rationales, tracking toggle, and history clearing.
    - `tests/08-local-ai-agent.spec.ts`: Real Ollama daemon integration (`http://127.0.0.1:11434`), `gemma3:4b` discovery & prompt test, natural language crate generation query, structured JSON schema inference, duration/track constraint enforcement, and saving generated crate to user playlists.
    - `tests/09-online-enrichment-serpapi.spec.ts`: Safe candidate lookup, MusicBrainz recording match, Tag Diff inspector, Artwork preview, LRCLIB lyrics preview, candidate proposals without automatic writes, and SerpApi settings credential masking.
    - `tests/10-sentry-observability.spec.ts`: Sentry SDK initialization, settings toggle, telemetry disclosures, intentional "Break the world" error trigger, envelope interception, and privacy scrubbers verification.
  - Test helper utilities in `tests/helpers.ts`: Fast IndexedDB library loader (`ensureLibraryLoaded`) importing all 74 tracks in ~1.8 seconds, synthetic WAV file generator, corrupted audio generator, and cleanup routines.

### Fixed
- **Ollama JSON Truncation (`src/services/ai/OllamaClient.ts`)**: Resolved context and prediction token truncation with `gemma3:4b` by increasing `num_ctx` to 8192 and `num_predict` to 1024.
- **AI Playlist Parsing Robustness (`src/services/ai/AiPlaylistService.ts`)**: Added markdown code fence stripping (```` ```json ````) and regex fallback parsing `{[\s\S]*}` before throwing syntax errors; increased timeout to 45000ms.
- **Local AI Connection Auto-Probe (`src/screens/LocalAiScreen.tsx`)**: Fixed initial disconnected state by proactively probing Ollama connection on mount if `aiConnection.state === 'unconfigured'`.
- **SerpApi Credential & Provider Forwarding (`src/components/common/OnlineEnrichmentModal.tsx`)**: Passed user-configured `serpApiKey` and provider selection to `OnlineEnrichmentService` instead of hardcoding `undefined`.
- **Sentry Exception Capture (`src/services/telemetry/SentryTelemetry.ts`)**: Dispatched `Sentry.captureException(err)` inside `triggerTestError()` before throwing so Sentry captures intentional errors caught by local UI handlers.
- **Sentry Switch Accessibility (`src/screens/SettingsScreen.tsx`)**: Added `id="sentry-toggle"` and `aria-label="Toggle Sentry Observability"` to the checkbox input and linked `<label htmlFor="sentry-toggle">` for cross-browser click handling.

### Verified
- **100% Test Pass Rate**: 121 / 121 Vitest unit tests passed (12 test suites); 30 / 30 Playwright E2E tests passed (10 test suites).
- **Zero File Mutation Invariant**: All 74 audio tracks in `/home/axel/Music` remain 100% intact and uncorrupted.
- **Production Build Clean**: TypeScript and Vite bundle compiled cleanly in 4.63s with 0 errors.

---

## [0.12.0] - Sentry AI Observability, SerpApi Enrichment & Tauri CI Workflow (2026-11-01)

### Added
- **Sentry AI Observability & Privacy-Preserving Telemetry (`src/services/telemetry/SentryTelemetry.ts`, `src/screens/SettingsScreen.tsx`, `src/main.tsx`)**:
  - Initialized `@sentry/react` early with `tracesSampleRate: 1.0` and `browserTracingIntegration()`.
  - Privacy-first scrubbing architecture: `beforeSend` and `beforeBreadcrumb` hooks scrub all local file paths, audio data URLs, client IP addresses, user listening history, and raw user prompt strings.
  - Dedicated lifecycle telemetry breadcrumbs and events: `ai.request.started`, `ai.request.completed`, `ai.response.invalid`, `ai.playlist.generated`, `ai.track.rejected`, `ai.provider.unavailable`, `enrichment.lookup.failed`, `tool.execution.failure`, and manual test error trigger (`triggerTestError()`).
  - Settings UI card: Live telemetry toggle, masked DSN input, explicit privacy disclosures listing what is scrubbed vs what is captured, and the "Break the world" intentional test error button with `Sentry.logger.info`.
- **SerpApi Partner Integration & Online Enrichment (`src/services/enrichment/SerpApiProvider.ts`, `src/components/common/OnlineEnrichmentModal.tsx`)**:
  - SerpApi music search provider configured with client credentials stored in settings, masked in UI.
  - Dual extraction engine: Searches Google Knowledge Graph for authoritative album/artist/year metadata and parses organic snippets with web source URLs and snippet quotes.
  - Web source preview and verification badge in `OnlineEnrichmentModal.tsx` showing source link and snippet quote with a clear disclaimer: "Notice: Web search snippets are candidate suggestions and not authoritative music metadata. Verify before applying."
  - Strict human-in-the-loop invariant: Proposals remain strictly in `pending` review state and never modify local audio files without explicit user review and confirmation.
- **Tauri 2 Packaging & GitHub Actions CI Workflow (`src-tauri/`, `.github/workflows/desktop-build.yml`)**:
  - Scaffolded Tauri 2 desktop bundler configuration (`tauri.conf.json`) with strict Content Security Policy allowing local loopback (`http://127.0.0.1:11434`), Sentry ingest, and SerpApi endpoints.
  - Generated complete Tauri multi-platform app icon set (PNGs, ICNS, ICO) from `public/ghostwave-logo.svg` across all required desktop resolutions.
  - Created automated GitHub Actions multi-platform release workflow (`.github/workflows/desktop-build.yml`) targeting both Ubuntu Linux (`libwebkit2gtk-4.1-dev`, `libgtk-3-dev`) and Windows (`windows-latest` MSVC) using `@tauri-apps/cli` and `tauri-apps/action-tauri@v2`.
  - Added `src-tauri/target/` to `.gitignore` and scoped Vitest test matching to `src/**/*.{test,spec}.{ts,tsx}`.
- **Comprehensive Unit & Integration Test Suite (`src/test/sentry-serpapi.test.tsx`)**:
  - 11 unit tests covering Sentry event breadcrumbs, invalid JSON schema logging, provider offline alerts, intentional error triggering, SerpApi key validation, Knowledge Graph parsing, organic snippet extraction, HTTP error breadcrumbs, and candidate proposal construction.
  - 100% test pass rate: 121 tests passing across 12 test suites; clean production build.

---

## [0.11.0] - S10: Listening History & Recommendations, S11: Web & Tauri Integration (2026-10-31)

### Added
- **S10: Listening History & Transparent Recommendations (`src/services/history/`, `src/screens/ListeningHistoryScreen.tsx`)**:
  - `HistoryService` and domain models in `src/services/history/types.ts`: `PlaybackEvent`, `PlaybackEventType` ('started' | 'completed' | 'skipped'), `GenreStat`, `ArtistStat`, `TrackStat`, `ListeningStats`, and `RecommendationItem`.
  - Consistent playback event classification (`classifyPlaybackEvent`):
    - Completed play: played >= 30 seconds OR >= 50% track duration, or reached natural end of track.
    - Skip: changed tracks before 30 seconds AND < 50% track duration.
  - Deterministic statistical aggregation (`calculateStats`): Aggregates total plays, completed plays, skips, skip rate, total listening time, top genres, and top artists.
  - Transparent deterministic recommendation engine (`generateRecommendations`): Recommends offline library tracks prioritizing unplayed tracks from top genres/artists, rewards favorites, applies skip rate penalties, strictly filters out missing or unreadable audio files, and attaches clear human-readable rationales to every recommendation.
  - Local IndexedDB persistence: Upgraded repository to `DB_VERSION = 4` introducing `playback_history` store indexed by `timestamp`, `trackId`, and `eventType`.
  - Full local user control: One-click "Clear History" permanently purging event records, tracking toggle (`toggleHistoryTracking`) disabling telemetry recording without affecting core playback, and optional AI taste profile summaries with local Gemma 3.
  - `ListeningHistoryScreen`: Modular view featuring KPI metric cards, taste profile badge, recommendation grid with direct Play/Queue buttons, paginated raw event log with relative timestamps, and top genre/artist breakdown bars.
- **S11: Web & Tauri Desktop Integration (`src-tauri/`, `src/services/platform/`, `Docs/S11-PLATFORM-INTEGRATION.md`)**:
  - Web readiness verified: Tested Vite production build, IndexedDB storage lifecycle, Web Audio API playback, and offline core mode degradation when internet or AI endpoints are absent.
  - Tauri 2 shell architecture: Scaffolded `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/src/lib.rs`, and `src-tauri/src/main.rs`.
  - Narrow filesystem capability scoping: Tauri permissions restricted strictly to `$MUSIC/**`, `$DOWNLOAD/**`, and `$DESKTOP/**`.
  - Platform file adapters (`FileOperationsPlatform`): `WebFilePlatform` respecting browser sandbox boundaries, and `TauriFilePlatform` translating native filepaths to webview-safe `asset://localhost/...` protocols.
  - Documentation in `Docs/S11-PLATFORM-INTEGRATION.md`: Complete matrix documenting verified Linux web environment, Tauri desktop integration, and prerequisites for Windows and macOS compilation without inferring support from source compatibility.
- **Test Suites (`src/test/s10-history-recommendations.test.tsx`, `src/test/s11-web-tauri.test.tsx`)**:
  - S10 suite (11 tests): Validates event classification rules (30s/50% boundary), statistics calculation, recommendation generation rationales, unplayed discovery fallback, IndexedDB persistence, and history clearing.
  - S11 suite (10 tests): Validates platform adapter environment detection (`isDesktop`), sandbox metadata constraints, asset URL generation, path validation, and offline resilience.
  - 100% test pass rate: 110 passed across all 11 test suites; clean TypeScript compilation and production bundle build.

---

## [0.10.0] - S8: Online Enrichment & S9: Audio Conversion (2026-10-30)

### Added
- **S8: Online Enrichment Architecture (`src/services/enrichment/`)**:
  - `OnlineEnrichmentProvider` interface and candidate data structures (`EnrichmentSearchQuery`, `EnrichmentCandidate`, `CoverArtResult`, `LyricsResult`) in `src/services/enrichment/types.ts`.
  - `MusicBrainzProvider`: Rate-limited queries adhering strictly to MusicBrainz API rules (enforcing >= 1000ms delay queue), descriptive User-Agent header `GhostWave/0.9.0 ( https://github.com/edgiaxel/GhostWave )`, Lucene query escaping, and deterministic similarity-based confidence scoring.
  - `CoverArtProvider`: Integration with the Cover Art Archive (Internet Archive/MusicBrainz joint non-profit project) retrieving release front cover art and thumbnails with graceful 404 handling.
  - `LrclibProvider`: Open LRCLIB lyrics integration distinguishing plain lyrics from synchronized LRC lyrics with explicit timestamp indicators (`[mm:ss.xx]`) and copyright disclaimers.
  - `SerpApiProvider`: Optional search partner integration with secure client credential handling (API keys stored exclusively in local client settings, masked in UI, never bundled in frontend source).
  - `OnlineEnrichmentService`: Orchestrator handling online search fallback, timeout protection, offline resilience, and converting candidates into reviewable `MetadataProposal` items.
  - `OnlineEnrichmentModal.tsx`: Interactive modal for querying candidates, comparing tag diffs, previewing album artwork before saving, displaying plain/synced lyrics, and applying approved metadata.
  - Integrated online lookup triggers across the app: Table row actions, grid album card hover actions in `LibraryScreen.tsx`, and issue cards in `HealthCleanupScreen.tsx`.
- **S9: Audio Conversion Engine (`src/services/conversion/`)**:
  - `WavEncoder`: Pure TypeScript 16-bit signed PCM RIFF/WAVE encoder generating compliant 44-byte headers (RIFF, WAVE, fmt , data chunks) and quantizing Float32 audio samples into signed 16-bit integers.
  - True re-encoding verification: Verified actual PCM sample re-quantization and binary RIFF structure validation (`validateWavBlob`), strictly rejecting extension renaming or container spoofing.
  - `AudioConversionService`: Web Audio API `AudioContext.decodeAudioData` decoder, channel extraction, safe filename construction (`{name}_converted.wav`), collision detection against existing library files (`detectCollision` with indexed safe filenames), batch processing with live progress callbacks, and cancellation (`AbortSignal`).
  - `AudioConversionModal.tsx`: Conversion modal supporting format selection (WAV 16-bit PCM Lossless / OGG), sample rate selection (44.1kHz / 48kHz), channels (stereo / mono), naming suffix customization, live progress indicators, per-file result cards, direct download, and one-click import into library index.
  - Licensing & engine analysis in `Docs/S9-CONVERSION-ENGINE-ANALYSIS.md`: Complete comparative analysis between in-browser Web Audio API and desktop FFmpeg bridge, documenting LGPL v2.1/v3 licensing requirements, distribution implications, format support matrices, and non-destructive invariants.
- **S8 & S9 Settings Cards (`src/screens/SettingsScreen.tsx`)**:
  - Online Enrichment settings card: Enable toggle, primary provider selector (MusicBrainz / SerpApi), masked SerpApi API key input, artwork & lyrics fetch toggles, rate limits and privacy documentation.
  - Audio Conversion settings card: Default target format, sample rate, channels configuration, and engine architecture & licensing notice.
- **Test Suites & Bounded Limits (`src/test/s8-online-enrichment.test.tsx`, `src/test/s9-audio-conversion.test.tsx`)**:
  - S8 suite (10 tests): Validates provider initialization, rate limit queuing, confidence rationale, 429/timeout/offline handling, Cover Art Archive lookup, LRCLIB plain vs synced lyrics distinction, and proposal construction.
  - S9 suite (6 tests): Validates supported format contracts, non-destructive filename generation, collision detection with alternate indexing, genuine 44-byte RIFF header generation and Float32-to-Int16 quantization, rejection of invalid non-RIFF blobs, and converted library entity creation preserving source files untouched.
  - Full test suite passes: 89 tests passing across all 9 test suites in ~5s with 5000ms Vitest bounded test execution guards.

---

## [0.9.0] - S7.2, S7.3, S7.4: Natural-Language Playlists, Metadata Proposals, and AI Integration Testing (2026-10-30)

### Added
- **S7.2: Natural-Language Playlist Query (`src/services/ai/AiPlaylistService.ts`, `src/screens/LocalAiScreen.tsx`)**:
  - `PLAYLIST_QUERY_SCHEMA`: Strict JSON Schema defining allowed search filters (`genres`, `artists`, `albums`, `formats`, `minBitrateKbps`, `yearMin`, `yearMax`, `keywords`) and constraints (`maxDurationMinutes`, `minDurationMinutes`, `maxTracks`) with `additionalProperties: false`.
  - `serializeLibrary`: Compact metadata serialization sending only necessary catalog fields (`id`, `title`, `artist`, `album`, `genre`, `durationSeconds`, `format`, `bitrateKbps`, `year`). Omit local file paths, buffer data, and audio bytes.
  - `validatePlan`: Strict schema validator ensuring valid types, required fields (`name`, `matchedTrackIds`, `explanation`), and dropping unexpected properties.
  - `resolveTracks`: Deterministic track resolution against indexed library IDs. Drops hallucinated or nonexistent IDs and reports them in `hallucinatedTrackIds`.
  - Deterministic constraint enforcement: Calculates cumulative durations and caps tracks to stay within `maxDurationMinutes`, never trusting model arithmetic. Enforces `maxTracks` limits deterministically.
  - `LocalAiScreen`: Interactive natural-language playlist curation UI with editable crate title, rationale, duration, track count, filter chips, hallucination warning pill, JSON Schema inspection, and one-click \"Save Crate\" action saving the playlist into IndexedDB.
  - Offline fallback: Deterministic catalog matching when Ollama is offline or unconfigured, guaranteeing non-breaking operation.
- **S7.3: Local AI Metadata Suggestions (`src/services/ai/AiMetadataService.ts`, `src/screens/HealthCleanupScreen.tsx`)**:
  - `AI_METADATA_SCHEMA`: Strict proposal schema covering `title`, `artist`, `album`, `genre`, `year`, and `trackNumber`.
  - `getTracksNeedingAttention` & `serializeTrackEvidence`: Identifies tracks with missing or generic tags and formats compact evidence (filename, size, format, current tags).
  - Explicit confidence scoring & uncertain inference labeling: Classifies model confidence scores and highlights inferences below 0.7 with an `Uncertain inference` badge to alert the user.
  - Side-by-side diff table: Displays current value (strikethrough) and proposed value side-by-side with origin badges (`AI Gemma` vs `Filename Pattern`).
  - Safe user review & inline editing: Supports in-place editing of proposed values via `editProposalValue` before approval. All proposals remain strictly `pending` and are never silently written to files or IndexedDB without explicit user approval.
- **S7.4: AI Testing, Integration & Multi-Run Workflow Verification (`src/test/s7-local-ai.test.tsx`)**:
  - Valid, malformed, empty, hallucinated, and unavailable model responses: Tested syntax error recovery, 0-match results, 100% fake track ID drops, and offline network failure degradation.
  - Security invariant: Verified model output cannot execute arbitrary shell code or perform directory traversal (`../../etc/passwd` inert string handling).
  - Disabled AI verification: App core remains 100% functional with local AI disabled.
  - Multi-run workflow verification: Ran 10 sequential query workflows across varied prompts (\"Fast electronic workout tracks in FLAC\", \"Dark ambient synth under 30 minutes\", \"Acoustic chill evening mix\", \"Lossless 24-bit FLAC tracks\", etc.) ensuring 100% determinism, schema compliance, duration limits, and zero memory leaks.
  - Live model integration test: Live query against running Ollama (`gemma3:4b`) with timeout guards to prevent test suite stalling.
  - All 73 tests passing across all 7 test files with clean production build (`npm run build`).

---

## [0.8.0] - S7.1: Local AI Provider Interface, Setup & Core Workflow Fixes (2026-10-30)

### Fixed
- **Core Workflow: Rescan & File Scanning Hangs Resolved**:
  - Fixed infinite scanning banner (`Scanning: Verifying local index... 0% (0/0)`) by wrapping `importAudioFiles` and `rescanLibrary` in `try ... catch ... finally` blocks in `AppContext.tsx`.
  - Guaranteed `setIsScanning(false)` and `isScanning: false` progress resets unconditionally upon completion, failure, or cancellation.
  - Added immediate guard clauses for empty track lists (`tracks.length === 0`) and empty file selections, returning instantly with friendly user toasts without entering an active scan loop.
- **Core Workflow: Playlist Creation Dialog Fix**:
  - Fixed issue where clicking the create button in the "Create New Playlist" dialog failed to add playlists on migrated PC databases.
  - Upgraded IndexedDB schema version to 3 (`DB_VERSION = 3`) in `IndexedDbRepository.ts`, ensuring the `playlists` object store is reliably initialized on databases migrated from previous versions.
  - Added store existence guards and try/catch recovery in `savePlaylist`, `deletePlaylist`, and `createPlaylist`, guaranteeing in-memory state updates and dialog dismissal regardless of storage latency.
  - Improved `PlaylistsScreen.tsx` form submission with robust error handling and form resets.
- **File System Platform Resilience (`src/services/platform/WebFilePlatform.ts`)**:
  - Handled user cancellations and abort exceptions in `selectAudioFiles` and `selectFolder` across desktop browsers.
  - Normalized async directory iteration across standard and browser-specific `FileSystemDirectoryHandle` APIs (`.values()` fallback).
  - Ensured manual `<input type="file">` elements are cleanly detached from the DOM on both selection and cancellation.
- **Bounded Test Execution Limits (`vite.config.ts`)**:
  - Configured Vitest with `testTimeout: 5000`, `hookTimeout: 4000`, and `teardownTimeout: 3000` to terminate and skip lingering tests promptly without hanging prompts.

### Added
- **S7.1.1: Local AI Provider Interface (`src/services/ai/LocalAiProvider.ts`)**:
  - Defined `LocalAiProvider` interface specifying `checkConnection`, `listModels`, `generate`, and endpoint configuration.
  - Defined explicit connection lifecycle states: `connected`, `offline`, `timeout`, `error`, `unconfigured`, and `checking`.
  - Established application-managed tool dispatch contract supporting both raw `'json'` and structured JSON Schema objects in `GenerateOptions.format`.
- **S7.1.2: Ollama Client Implementation (`src/services/ai/OllamaClient.ts`)**:
  - Implemented `OllamaClient` communicating with local Ollama daemon over HTTP loopback (`http://127.0.0.1:11434`).
  - Added URL normalization, trailing slash trimming, and default fallback to loopback origin.
  - Configured strict request timeouts using `AbortController` (4s connection check, 5s model discovery, 30s generation).
  - Supported Ollama's schema-based format parameter, parsing returned JSON output deterministically into `parsedJson`.
- **S7.1.3: Ollama Connection Testing**:
  - Probes `/api/version` and `/api/tags` with real-time round-trip latency tracking (`performance.now()`).
  - Differentiates timeout (`AbortError`), offline (`TypeError: Failed to fetch`), and server errors with descriptive diagnostic messages.
- **S7.1.4: Installed Model Discovery & Model Selection**:
  - Auto-discovers installed models via `GET /api/tags`, parsing model names, parameter sizes, families, and quantization levels.
  - Pre-configures and selects `gemma3:4b` as the verified default model candidate.
- **S7.1.5: Offline Degradation & Non-AI Preservation**:
  - Verified that all core non-AI functions (audio playback, queue management, visualizer, crates, and tag editing) remain 100% operational when Ollama is offline or unconfigured.
- **S7.1.6: Settings UI Integration (`src/screens/SettingsScreen.tsx`, `LocalAiScreen.tsx`)**:
  - Live status indicator badge reflecting real connection health and measured latency.
  - "Test Connection" button providing instant feedback on Ollama connectivity.
  - Model selector dropdown populated dynamically from discovered local models with fallback input.
  - Interactive "Inference Test Prompt" console to test live generation and display response text, latency, and model name.
  - Terminal setup guide (`ollama serve`, `ollama pull gemma3:4b`) and explanation of browser loopback origin security rules.
- **S7.1.7: Unit and Integration Test Suite (`src/test/s7-local-ai.test.tsx`)**:
  - Created 12 comprehensive unit and integration tests covering endpoint normalization, connection status, timeout handling, offline error states, model discovery, JSON Schema format dispatch, UI integration, empty rescan safety, and playlist dialog submission.
  - 60 passing tests across 7 test suites with 0 errors.

---

## [0.7.1] - S7.0: Technical Verification & AI Architecture (2026-10-30)

### Added
- **S7.0: Technical Verification & AI Architecture Review (`Docs/S7.0-TECHNICAL-REVIEW.md`)**:
  - Comprehensive audit of existing storage, metadata, and health services (`IndexedDbRepository`, `LibraryHealthService`, `MetadataEditService`, `PlaybackEngine`) to ensure zero duplication of domain logic in the AI layer.
  - Verified host Ollama runtime (`ollama version 0.34.1`) and installed model `gemma3:4b` (3.9B parameters, Q4_K_M quantization, 3.4 GB disk size, 128k context window).
  - Empirical benchmarking across 8 capabilities: demonstrated high accuracy in basic instructions, structured JSON, tool argument parsing, multi-step proposals, empty-result handling without hallucinations, and sub-second warm inference (~0.64s to 1.43s) on RTX 3050 GPU.
  - Identified critical runtime constraint: Ollama's experimental native `tools` parameter returns HTTP 400 for `gemma3:4b`; architected and verified prompt-contract structured JSON tool dispatch using stable `"format": "json"`.
  - Designed the complete `LocalAiProvider` interface, bounded `AgentOrchestrator` execution loop (5 turns max, 30s timeout, abort controller), deterministic tool registry (`search_library`, `get_library_stats`, `propose_playlist`), and natural-language playlist workflow.
  - Formulated partner integration recommendations for Hacktoberfest 2026 Week 4 Challenge (Gemma, Render, DigitalOcean, MusicBrainz, Sentry, Entire) and evaluated remaining stages (S7 to S12).

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
