# STAGES.md — GhostWave Development Stages

## How this plan works

GhostWave uses a **skeleton-first, modular, test-and-integrate workflow**.

The analogy is a configurable wardrobe/container system: define the compartments and how they connect; give each compartment a stable interface; then implement and test each one without repeatedly rebuilding the whole structure.

This does **not** mean building every module in isolation and connecting them only at the end. Establish shared contracts and run early smoke tests. After each module passes its own tests, integrate it with the current app and run regression tests before calling the stage complete.

### Stage hierarchy

- `S0`, `S1`, `S2`… are major stages.
- `S1.1`, `S1.2`… are tasks within a stage.
- If a nested task is too large, split it further (for example, `S2.1.a`) and update this file.
- Do not skip unfinished acceptance criteria because the main interaction appears to work.
- Axel reviews the stage evidence and approves moving forward.

## Standard completion gate — required for every stage

A stage is complete only when:

- [ ] Its stated goal and acceptance criteria are met.
- [ ] Relevant success, empty, invalid, and failure states are handled.
- [ ] The module's isolated tests pass, where applicable.
- [ ] The module is integrated with existing modules.
- [ ] Regression tests for affected modules pass.
- [ ] Build/typecheck/lint checks have been run where available.
- [ ] Manual verification steps and limitations are documented.
- [ ] Documentation and contracts reflect intentional changes.
- [ ] Axel has reviewed the result and explicitly approved stage completion.

A stage is not complete merely because a page exists or a button works once.

$antislop $antislop-code $antislop-human $antislop-ui 

Read README.md, /Docs AGENT.md, APP-WORKFLOW.md, PROJECT.md, ARCHITECTURE.md and STAGES.md. ONLY change the checklist and DO NOT DELETE the content. All document in Docs/ is absolute except CHANGE-LOGS.md you can change it based on the development progress.
Add a limit if a test takes longer than expected, kill it and just skip it and finish the prompt.

---

## S0 — Repository audit and architecture lock

**Goal:** Understand the existing repository and settle only the architecture needed to create a stable skeleton.

### S0.1 — Inspect the repository
- [x] Inspect the file tree, Git status, package manifest/lockfile, current scripts, UI, and tests.
- [x] Identify existing work that must be preserved.
- [x] Report the current baseline and missing pieces.

### S0.2 — Confirm technical choices
- [x] Confirm frontend and package manager from repository evidence.
- [x] Confirm Tauri 2 approach and prerequisites.
- [x] Define browser versus desktop capability differences.
- [x] Select a metadata parser and persistence strategy only after checking compatibility.
- [x] Document unresolved choices; avoid adding speculative dependencies.

### S0.3 — Define module contracts
- [x] Define shared types for Track, Playlist, QueueItem, MetadataProposal, LibraryIssue, AppSettings, and operation results.
- [x] Define boundaries for library, playback, playlists, metadata, file operations, visualizer, online providers, local AI, and settings.
- [x] Define error/result patterns and dependency direction.

**Exit gate:** Existing code is understood; the minimum shared contracts and platform boundaries are documented. Axel approves the proposed structure.

---

## S1 — Modular application skeleton

**Goal:** Build the full app frame and all planned screens with realistic placeholders before implementing feature content.

### S1.1 — App shell and navigation
- [x] Create the app shell and consistent page layout.
- [x] Add sidebar/navigation for Library, Playlists, Cleanup, Visualizer, Listening History, and Settings.
- [x] Add global search placement, now-playing area, and playback-control placeholder.
- [x] Add route/page state and unknown-route handling.

### S1.2 — Design system
- [x] Define typography, spacing, layout, surface, border, focus, and motion tokens.
- [x] Implement Halloween Dark and Halloween Light themes.
- [x] Add a small set of coordinated accent palettes.
- [x] Check contrast, keyboard focus, and responsive layout.

### S1.3 — Screen placeholders
- [x] Library screen with empty/importing/loading/error states.
- [x] Playlist list and playlist detail placeholders.
- [x] Cleanup report and metadata-review placeholders.
- [x] Visualizer screen and settings placeholder.
- [x] Listening-history placeholder.
- [x] Settings screen with Local AI and Online Services sections.
- [x] Reusable dialogs, confirmations, notifications, and empty states.

### S1.4 — Skeleton smoke test
- [x] Navigate between all pages.
- [x] Verify shared layout does not break between pages.
- [x] Verify theme persists across routes.
- [x] Verify responsive and keyboard navigation basics.
- [x] Confirm placeholder states are explicit rather than fake functionality.

**Exit gate:** All agreed screens exist, navigation works, theme tokens are consistent, and the skeleton is approved before feature implementation begins.

---

## S2 — Local library import and metadata scan

**Goal:** Import supported local files and build a trustworthy library index.

### S2.1 — Platform file-access interface
- [x] Define an interface for file selection, reading, metadata writing, and path operations.
- [x] Implement the web-supported path without claiming unrestricted folder access.
- [x] Implement the Tauri path behind the same interface when desktop setup is available.
- [x] Handle permission denial and unsupported capabilities.

### S2.2 — Import and scan
- [x] Import selected audio files or a supported folder selection.
- [x] Validate file type and report unsupported files.
- [x] Extract available metadata and duration.
- [x] Display progress and allow safe cancellation.
- [x] Handle malformed files and partial scan failures.

### S2.3 — Library index and persistence
- [x] Persist the library index and settings locally.
- [x] Avoid storing duplicate records when a file is rescanned.
- [x] Provide rescan and remove-from-index behavior.
- [x] Distinguish removing a library entry from deleting a file.

### S2.4 — Isolated and integrated tests
- [x] Test valid, malformed, unsupported, and empty imports.
- [x] Test rescanning and duplicate import prevention.
- [x] Integrate with Library screen and shared Track types.
- [x] Confirm core browsing works offline.

**Exit gate:** A user can import a test collection, inspect extracted metadata, rescan it safely, and recover from bad files without crashing.

---

## S3 — Playback and queue

**Goal:** Deliver reliable playback before adding advanced organization.

### S3.1 — Playback engine
- [x] Implement play, pause, resume, seek, previous, next, and volume.
- [x] Expose explicit playback states: idle, loading, playing, paused, ended, and error.
- [x] Handle unsupported or unreadable files.
- [x] Keep playback controls responsive during loading.

### S3.2 — Queue and current track
- [x] Add tracks to the queue.
- [x] Remove and reorder queue items.
- [x] Support repeat and shuffle with clear state.
- [x] Define what happens when a queued file disappears or fails.

### S3.3 — Player UI
- [x] Connect current track, progress, duration, artwork, and controls.
- [x] Add keyboard/accessibility labels where appropriate.
- [x] Ensure the player remains consistent across screens.

### S3.4 — Integration and regression
- [x] Start playback from Library.
- [x] Start playback from a queue.
- [x] Test pause/resume, seek, next/previous, shuffle, repeat, and errors.
- [x] Verify library navigation does not unexpectedly reset playback.

**Exit gate:** Playback and queue work across relevant screens and survive common error cases. Do not mark complete after only play/pause works.

---

## S4 — Library search and playlists

**Goal:** Make the collection usable and let users build saved playlists.

### S4.1 — Library search and sorting
- [x] Search available local metadata.
- [x] Add useful sorting and filters supported by known fields.
- [x] Handle no results and clear-search behavior.
- [x] Keep search deterministic and available offline.

### S4.2 — Playlist CRUD
- [x] Create playlist with required name and optional description.
- [x] Rename and edit description.
- [x] Add/remove/reorder tracks.
- [x] Delete playlist with confirmation.
- [x] Support optional icon/emoji and accent color only if time permits.
- [x] Preserve track references safely when library records change.

### S4.3 — Playlist playback and integration
- [x] Play a playlist and define queue behavior.
- [x] Ensure current track and queue update consistently.
- [x] Test empty playlists, duplicate additions, deletion, and reordered tracks.
- [x] Test persistence after app restart.

**Exit gate:** Playlist operations work, persist, and integrate correctly with playback and library search.

---

## S5 — Library health, metadata editing, and safe renaming

**Goal:** Find common library issues and let users correct them safely.

### S5.1 — Deterministic library-health report
- [x] Detect missing supported tags.
- [x] Identify inconsistent filename patterns.
- [x] Detect exact duplicates where reliable hashes are available.
- [x] Flag possible metadata duplicates separately from exact duplicates.
- [x] Show issue categories and affected tracks.

### S5.2 — Manual metadata editing
- [x] Edit supported fields.
- [x] Validate input and preserve unrelated metadata where possible.
- [x] Preview the proposed changes.
- [x] Show per-file success/failure after apply.

### S5.3 — Naming templates and rename preview
- [x] Support a template such as `Artist - Title.ext`.
- [x] Preview old and new paths.
- [x] Detect collisions, invalid characters, and missing required fields.
- [x] Apply approved renames without overwriting.
- [x] Report partial failures and allow the user to recover.

### S5.4 — Integration and tests
- [x] Confirm the library index updates after metadata or path changes.
- [x] Confirm playlists and current playback references remain valid.
- [x] Test collision, permission denial, missing file, and invalid template cases.
- [x] Verify no operation runs without user approval.

**Exit gate:** A user can understand issues, preview corrections, approve selected changes, and see accurate results without silent destructive operations.

---

## S6 — Halloween visualizer and theme polish

**Goal:** Deliver the distinctive visual experience without destabilizing playback.

### S6.1 — Audio-reactive visualizer
- [x] Implement a basic waveform or frequency-bar visualizer.
- [x] Connect it to the actual playing audio.
- [x] Handle paused, ended, muted, and unavailable audio states.
- [x] Avoid excessive CPU/GPU use.

### S6.2 — Visual customization
- [x] Support selected color palettes and visualizer styles.
- [x] Persist visualizer preferences.
- [x] Add Halloween motifs as a deliberate visual treatment, not clutter.

### S6.3 — Theme and usability pass
- [x] Verify dark/light themes across all screens and dialogs.
- [x] Verify focus, contrast, reduced-motion considerations, and responsive layouts.
- [x] Evaluate Butterchurn only after the basic visualizer is stable.

**Exit gate:** A working visualizer responds to audio, theme settings remain consistent, and performance is acceptable on target hardware.

---

## S7 — Local AI integration

**Goal:** Add useful local-model capabilities without making the core dependent on AI.

### S7.1 — AI provider interface and setup
- [x] Define a provider interface for local inference.
- [x] Add Ollama connection configuration and connection test.
- [x] Explain model installation and configuration.
- [x] Show unavailable, timeout, and invalid-response states.
- [x] Keep all non-AI functions usable if no model is configured.

### S7.2 — Natural-language playlist query
- [x] Define a strict schema for search filters and constraints.
- [x] Send only necessary library metadata to the local model.
- [x] Validate model output and reject unknown fields/operators.
- [x] Resolve results against actual library track IDs.
- [x] Calculate duration and enforce constraints deterministically.
- [x] Preview proposed tracks before saving the playlist.

### S7.3 — Metadata suggestions
- [x] Ask the model to propose values only from supplied evidence or clearly label uncertain inference.
- [x] Show old/proposed values side by side.
- [x] Allow editing, rejecting, or approving proposals.
- [x] Never silently write AI-generated metadata.

### S7.4 — AI testing and integration
- [x] Test valid, malformed, empty, hallucinated, and unavailable-model responses.
- [x] Test requests with no matching tracks.
- [x] Test that no arbitrary code or filesystem operation can be generated.
- [x] Verify AI can be disabled without breaking the app.

**Exit gate:** At least one useful natural-language playlist workflow works with a local model, validates output, requires review, and degrades gracefully when AI is unavailable.

---

## S8 — Online enrichment

**Goal:** Add optional external lookup without coupling it to core operation.

### S8.1 — Provider abstraction
- [x] Define a provider interface and result-source representation.
- [x] Keep API credentials on the server when they are private.
- [x] Document rate limits, provider terms, and privacy implications.

### S8.2 — Metadata lookup
- [x] Search for candidate track/artist/album matches.
- [x] Show source and confidence rationale where available.
- [x] Let the user select and approve candidates.
- [x] Handle no results, provider errors, and rate limits.

### S8.3 — Artwork and lyrics (stretch)
- [x] Use a suitable provider only after license/terms review.
- [x] Preview artwork before saving.
- [x] Clearly distinguish plain lyrics from synchronized lyrics.
- [x] Do not redistribute restricted content without permission.

### S8.4 — Optional search partner
- [x] Consider SerpApi only if it adds value beyond a dedicated metadata source.
- [x] Verify partner requirements and do not expose credentials in the frontend.

**Exit gate:** Online services are optional, sourced, and failure-tolerant; core local features continue working with the internet disabled.

---

## S9 — Audio conversion (stretch, non-destructive)

**Goal:** Convert selected tracks to a small, verified set of formats.

### S9.1 — Select conversion engine
- [x] Compare feasible web and desktop implementations.
- [x] Review FFmpeg/build/codec licensing and distribution implications.
- [x] Define supported input/output formats and options explicitly.

### S9.2 — Conversion workflow
- [x] Select one or more tracks and target format.
- [x] Validate output location and extension.
- [x] Convert to a new output file by default.
- [x] Preserve original files.
- [x] Show progress and per-file results.
- [x] Detect output collisions and insufficient/invalid destinations where feasible.

### S9.3 — Validation
- [x] Verify generated files can be read and played.
- [x] Test invalid input, cancellation, partial failure, and collision.
- [x] Verify conversion is actual re-encoding, not extension renaming.

**Exit gate:** One clearly documented conversion path works reliably. Do not claim broad format support without testing.

---

## S10 — Listening history and recommendations (stretch)

- [x] Track local playback events only with clear user controls.
- [x] Define plays, skips, duration, and favorite signals consistently.
- [x] Allow history to be disabled and cleared.
- [x] Start with transparent deterministic recommendations.
- [x] Add AI summaries only if useful and optional.
- [x] Test persistence, disabled tracking, and clearing history.

**Exit gate:** History behavior is understandable, locally controlled, and does not interfere with playback.

---

## S11 — Web and Tauri integration

**Goal:** Validate the supported web experience and package desktop targets.

### S11.1 — Web readiness
- [x] Verify production build.
- [x] Verify file-picker permissions and browser limitations.
- [x] Verify local AI setup and online provider configuration.
- [x] Test core mode with internet and AI unavailable.

### S11.2 — Tauri integration
- [x] Add Tauri 2 shell using the shared frontend.
- [x] Implement platform-specific file operations behind existing interfaces.
- [x] Scope filesystem permissions narrowly.
- [x] Verify local AI connectivity to the user's configured runtime.
- [x] Test startup, file access, errors, and app restart.

### S11.3 — Target builds
- [x] Build and test Windows.
- [x] Build and test Linux.
- [x] Attempt macOS only if time and a suitable build environment are available.
- [x] Document actual tested platforms; never infer support from source compatibility.

**Exit gate:** At least one target build is installed and manually tested, with known limitations documented. Web and desktop must not be described as equivalent where permissions differ.

---

## S12 — Release, deployment, and submission

### S12.1 — Quality pass
- [ ] Run available tests, lint, typecheck, and production builds.
- [ ] Test core workflows and failure states.
- [ ] Remove debug secrets and unintended logging.
- [ ] Verify no user data is uploaded unexpectedly.

### S12.2 — Deployment and distribution
- [ ] Deploy web version to Render.
- [ ] Publish source on GitHub.
- [ ] Publish only builds that have actually been tested.
- [ ] Document setup, local AI configuration, limitations, and licenses.
- [ ] Check `.tech` promotion eligibility and renewal terms before claiming/using it.

### S12.3 — Demo and write-up
- [ ] Record a clear demo showing the working user journey.
- [ ] Explain local-first and open-weight AI choices.
- [ ] Include partner technology only where it was genuinely used.
- [ ] Verify challenge submission requirements and current partner prize rules.
- [ ] Save/link agent session evidence if useful and permitted.

**Exit gate:** A reviewer can understand the product, run the documented build, reproduce the core demo, and distinguish verified features from future plans.
