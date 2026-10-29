# STAGES.md: GhostWave Development Stages

## How this plan works

GhostWave uses a **skeleton-first, modular, test-and-integrate workflow**.

The analogy is a configurable wardrobe/container system: define the compartments and how they connect; give each compartment a stable interface; then implement and test each one without repeatedly rebuilding the whole structure.

This does **not** mean building every module in isolation and connecting them only at the end. Establish shared contracts and run early smoke tests. After each module passes its own tests, integrate it with the current app and run regression tests before calling the stage complete.

### Stage hierarchy

- `S0`, `S1`, `S2`... are major stages.
- `S1.1`, `S1.2`... are tasks within a stage.
- If a nested task is too large, split it further (for example, `S2.1.a`) and update this file.
- Do not skip unfinished acceptance criteria because the main interaction appears to work.
- Axel reviews the stage evidence and approves moving forward.

## Standard completion gate: required for every stage

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

Read README.md, /Docs AGENT.md, APP-WORKFLOW.md, PROJECT.md, and STAGES.md. 

---

## S0: Repository audit and architecture lock

**Goal:** Understand the existing repository and settle only the architecture needed to create a stable skeleton.

### S0.1: Inspect the repository
- [x] Inspect the file tree, Git status, package manifest/lockfile, current scripts, UI, and tests.
- [x] Identify existing work that must be preserved.
- [x] Report the current baseline and missing pieces.

### S0.2: Confirm technical choices
- [x] Confirm frontend and package manager from repository evidence.
- [x] Confirm Tauri 2 approach and prerequisites.
- [x] Define browser versus desktop capability differences.
- [x] Select a metadata parser and persistence strategy only after checking compatibility.
- [x] Document unresolved choices; avoid adding speculative dependencies.

### S0.3: Define module contracts
- [x] Define shared types for Track, Playlist, QueueItem, MetadataProposal, LibraryIssue, AppSettings, and operation results.
- [x] Define boundaries for library, playback, playlists, metadata, file operations, visualizer, online providers, local AI, and settings.
- [x] Define error/result patterns and dependency direction.

**Exit gate:** Existing code is understood; the minimum shared contracts and platform boundaries are documented in `Docs/ARCHITECTURE.md`. Axel approved on 2026-10-29.

---

## S1: Modular application skeleton

**Goal:** Build the full app frame and all planned screens with realistic placeholders before implementing feature content.

### S1.1: App shell and navigation
- [x] Create the app shell and consistent page layout.
- [x] Add sidebar/navigation for Library, Playlists, Cleanup, Visualizer, Listening History, and Settings.
- [x] Add global search placement, now-playing area, and playback-control placeholder.
- [x] Add route/page state and unknown-route handling.

### S1.2: Design system
- [x] Define typography, spacing, layout, surface, border, focus, and motion tokens.
- [x] Implement Halloween Dark and Halloween Light themes.
- [x] Add a small set of coordinated accent palettes.
- [x] Check contrast, keyboard focus, and responsive layout.

### S1.3: Screen placeholders
- [x] Library screen with empty/importing/loading/error states.
- [x] Playlist list and playlist detail placeholders.
- [x] Cleanup report and metadata-review placeholders.
- [x] Visualizer screen and settings placeholder.
- [x] Listening-history placeholder.
- [x] Settings screen with Local AI and Online Services sections.
- [x] Reusable dialogs, confirmations, notifications, and empty states.

### S1.4: Skeleton smoke test
- [x] Navigate between all pages.
- [x] Verify shared layout does not break between pages.
- [x] Verify theme persists across routes.
- [x] Verify responsive and keyboard navigation basics.
- [x] Confirm placeholder states are explicit rather than fake functionality.

**Exit gate:** All agreed screens exist, navigation works, theme tokens are consistent, UI decluttering pass completed per anti-slop rules, and the skeleton is verified and approved by Axel on 2026-10-29.

---

## S2: Local library import and metadata scan

**Goal:** Import supported local files and build a trustworthy library index.

### S2.1: Platform file-access interface
- [ ] Define an interface for file selection, reading, metadata writing, and path operations.
- [ ] Implement the web-supported path without claiming unrestricted folder access.
- [ ] Implement the Tauri path behind the same interface when desktop setup is available.
- [ ] Handle permission denial and unsupported capabilities.

### S2.2: Import and scan
- [ ] Import selected audio files or a supported folder selection.
- [ ] Validate file type and report unsupported files.
- [ ] Extract available metadata and duration.
- [ ] Display progress and allow safe cancellation.
- [ ] Handle malformed files and partial scan failures.

### S2.3: Library index and persistence
- [ ] Persist the library index and settings locally.
- [ ] Avoid storing duplicate records when a file is rescanned.
- [ ] Provide rescan and remove-from-index behavior.
- [ ] Distinguish removing a library entry from deleting a file.

### S2.4: Isolated and integrated tests
- [ ] Test valid, malformed, unsupported, and empty imports.
- [ ] Test rescanning and duplicate import prevention.
- [ ] Integrate with Library screen and shared Track types.
- [ ] Confirm core browsing works offline.

**Exit gate:** A user can import a test collection, inspect extracted metadata, rescan it safely, and recover from bad files without crashing.

---

## S3: Playback and queue

**Goal:** Deliver reliable playback before adding advanced organization.

### S3.1: Playback engine
- [ ] Implement play, pause, resume, seek, previous, next, and volume.
- [ ] Expose explicit playback states: idle, loading, playing, paused, ended, and error.
- [ ] Handle unsupported or unreadable files.

### S3.2: Queue management
- [ ] Provide a queue that can be reordered, appended to, and cleared.
- [ ] Support shuffle and repeat with clear state indicators.
- [ ] Keep current playback position and active track in sync.

### S3.3: Playback UI integration
- [ ] Connect bottom player and track lists to the playback engine.
- [ ] Show real track metadata, elapsed time, and duration.
- [ ] Ensure transport controls stay responsive during library operations.

### S3.4: Tests and verification
- [ ] Test state transitions: idle -> loading -> playing -> paused -> ended.
- [ ] Test queue reordering, advance, and wrap-around behavior.
- [ ] Test recovery when an audio file cannot be decoded.

**Exit gate:** Local tracks play smoothly, queue mutations behave predictably, and playback errors are surfaced clearly.
