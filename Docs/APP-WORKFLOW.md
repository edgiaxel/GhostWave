# APP-WORKFLOW.md — Screen and User Workflow Specification

This document defines what a user can see and do on each GhostWave screen. Implement the behavior described here rather than inventing interactions during coding.

## Global application rules

- Core playback and manual library management must work without internet or AI.
- AI and online enrichment are optional and must fail gracefully.
- Destructive or externally visible operations require review and confirmation.
- Keep a consistent current track and playback state across screens.
- Distinguish removing a track from a playlist, removing it from the library index, and deleting the actual file.
- Show loading, empty, success, partial-success, and error states where relevant.
- Browser and Tauri capabilities may differ; show clear explanations when an operation is unavailable.
- Do not fake completed functionality with buttons that only display a toast.

## 1. App shell and navigation

### Layout

- Sidebar: Library, Playlists, Cleanup, Visualizer, Listening History, Settings.
- Main content: current screen.
- Global search: searches local indexed metadata.
- Persistent now-playing area: artwork when available, title/artist, progress, playback controls, volume, queue access.
- Notifications/dialog layer: import progress, operation results, confirmations, and recoverable errors.

### User actions

- Select a sidebar item to navigate.
- Use global search to find local tracks.
- Open the current track or queue without losing the current playback state.
- Change theme through the UI or Settings.
- On narrow screens, collapse navigation without making core playback inaccessible.

### States

- First launch: explain how to import music.
- Existing library: open the Library screen.
- No audio device/file support: explain the issue without crashing.
- Unknown route: show a recovery action back to Library.

## 2. Library screen

### Main content

- Import/select-files action.
- Track table/list with title, artist, album, duration, format, and relevant issue indicators.
- Search, sorting, and available filters.
- Selection controls for batch actions.
- Scan/rescan status and library summary.

### Import flow

1. User selects files or a folder using supported platform access.
2. App validates selections and displays the supported/unsupported count.
3. User starts scan or cancels.
4. App extracts metadata and duration.
5. App reports scanned, skipped, and failed files.
6. Library updates without creating duplicate entries for the same indexed file.
7. User can open a failed-file explanation or retry.

### Track actions

- Click a track to select it and inspect details.
- Double-click or use Play to start playback.
- Add to queue.
- Add to playlist.
- Open metadata details.
- Include selected tracks in cleanup, rename, or conversion workflows when supported.

### Empty/error states

- No files imported: show import instructions.
- No search matches: show a clear-search action.
- Unsupported format: explain that the file was skipped.
- Permission denied: explain how to reselect or grant access.
- Missing file after scan: mark unavailable and offer rescan/remove-from-index; do not delete anything.

## 3. Player and queue

### Controls

- Play: start selected/current track.
- Pause: pause without resetting position.
- Resume: continue from paused position.
- Seek slider: move playback position; show elapsed and total duration where available.
- Previous/next: follow queue and repeat rules.
- Shuffle: toggle randomized queue ordering.
- Repeat: cycle through the defined repeat modes.
- Volume: adjust output level.
- Queue: inspect, reorder, and remove upcoming tracks.
- Add-to-playlist: choose an existing playlist or create one.

### State behavior

- Loading: disable conflicting controls and show progress.
- Playing/paused: reflect actual engine state.
- Ended: advance according to queue/repeat settings.
- Error: show the failed track and a recovery option; do not silently stall.
- Track removed or file unavailable: keep the UI consistent and offer the next valid action.

### Acceptance behavior

Starting playback from a playlist must use that playlist's intended order. Navigating to another screen must not unexpectedly stop playback. Queue changes must be reflected by both the player and queue screen.

## 4. Playlists screen

### Playlist list

Each playlist can show name, optional description, track count, duration where calculable, and optional icon/accent color.

Actions:
- Create playlist.
- Open playlist.
- Rename.
- Edit description.
- Change optional icon/color if implemented.
- Delete with confirmation.
- Sort the playlist list.

### Create/edit flow

1. User chooses Create Playlist.
2. Enter a required name.
3. Enter an optional description.
4. Optionally choose icon/color if supported.
5. Save the playlist.
6. Add tracks from the library or an available import workflow.
7. Playlist appears in the list and persists.

### Playlist detail

- Show tracks and order.
- Play all or play a selected track.
- Add tracks from the library.
- Remove tracks from this playlist only.
- Reorder tracks.
- Rename/edit description.
- Delete playlist after confirmation.

### Edge cases

- Empty playlist: show Add Tracks action.
- Duplicate track addition: follow a documented policy and give feedback.
- Track unavailable: mark it and offer removal from the playlist.
- Deleting playlist must not delete underlying audio files.
- Renaming a playlist must not create a new unrelated playlist.

## 5. Search

### Local search

Search indexed fields such as title, artist, album, genre, filename, and other available metadata.

- Update results as the query changes, where practical.
- Support clearing the query.
- Allow opening or playing a result.
- Allow adding results to queue or playlist.
- Display a no-results state.

### Online lookup is separate

A local search must not unexpectedly call a web API. Online lookup is an explicit action from a cleanup/detail workflow and should identify the provider/source.

## 6. Track details and manual metadata editing

### Display

Show current metadata, file path/name where platform permissions permit, duration, format, and available artwork.

### Edit flow

1. User selects Edit Metadata.
2. App presents supported editable fields.
3. User changes fields.
4. Validate fields and preview changes.
5. User applies or cancels.
6. App attempts supported write operation.
7. Report success/failure per file and refresh the library index.

Do not claim a field was written if the format or browser permissions do not support writing it. Preserve unrelated tags where the selected library permits it.

## 7. Cleanup / Library Health screen

### Report categories

- Missing metadata.
- Inconsistent filename conventions.
- Possible duplicate files.
- Possible conflicting tags.
- Unsupported/unreadable files.
- Items that may benefit from online lookup.
- Optional AI suggestions, clearly marked as AI-generated.

### User workflow

1. Open Cleanup.
2. View issue counts and affected tracks.
3. Filter by issue type.
4. Select an issue or track to inspect evidence.
5. Generate a proposal using deterministic rules, online lookup, or local AI as appropriate.
6. Review current value versus proposed value.
7. Edit, approve, or reject each proposal.
8. Apply only approved changes.
9. View per-item results and remaining issues.

### Required safeguards

- No silent changes.
- No automatic deletion.
- Uncertain matches must be labelled uncertain.
- Failed writes must remain visible and retryable.
- AI suggestions must be distinguishable from metadata already present in the file.

## 8. File renaming

### Flow

1. Select tracks and choose Rename.
2. Select or enter a naming template, such as `Artist - Title.ext`.
3. Choose which metadata fields can be used.
4. Preview each old and proposed path.
5. Flag missing fields, invalid characters, duplicate target paths, and collisions with existing files.
6. User edits, excludes, or approves the eligible changes.
7. Execute renames.
8. Show per-file results.
9. Refresh library paths and keep playlist/queue references consistent.

Never overwrite an existing file silently. Do not infer that a file's audio format changed because its extension changed.

## 9. Audio conversion

This is a stretch feature and should be shown only when a conversion engine is available.

### Flow

1. Select tracks.
2. Choose a supported output format (initially a small verified set).
3. Choose supported quality options, if any.
4. Select output location.
5. Preview output filenames and collision warnings.
6. Convert to new files by default.
7. Show progress and per-file success/failure.
8. Offer to import successful outputs into the library.

### Rules

- Conversion must decode and re-encode the audio; changing the extension is not conversion.
- Preserve originals by default.
- Never delete originals automatically.
- Validate output files and metadata.
- Clearly state unsupported formats and conversion failures.
- Do not expose advanced codec controls until they can be validated.

## 10. Visualizer

### Screen content

- Active visualization.
- Style/preset selector.
- Color palette controls.
- Sensitivity/intensity settings where supported.
- Optional background image selector if implemented.
- Reset-to-default control.

### Behavior

- Visualizer responds to the actual audio signal.
- Pause/end states are handled cleanly.
- Switching presets does not stop playback.
- Settings persist locally.
- Unsupported or slow visualizer modes show a fallback rather than a blank screen.

Start with one simple audio-reactive visualizer. Additional shapes, pumpkin/ghost motifs, beat-drop effects, and Butterchurn integration are enhancements, not prerequisites for a working player.

## 11. Themes and appearance

### Options

- Halloween Dark (default).
- Halloween Light.
- Predefined accent palettes.
- Custom accent color only if implemented safely.

### Behavior

- Theme applies across all screens, tables, dialogs, controls, and empty/error states.
- Preference persists.
- Text and controls remain readable.
- Theme change does not reset playback or lose unsaved edits.

## 12. Local AI settings

### Setup screen

Show:
- AI enabled/disabled.
- Runtime endpoint configuration.
- Connection test.
- Model name/configuration.
- Status and last error.
- Setup instructions and privacy explanation.

### Connection workflow

1. User opens Settings → Local AI.
2. User enables AI and enters/accepts a local runtime endpoint.
3. App tests the connection.
4. App shows connected, unavailable, timeout, or invalid-model state.
5. User can disable AI at any time.

Never require AI setup during first launch. If the runtime is unavailable, core features continue to work.

## 13. Natural-language playlist workflow

1. User opens AI Playlist or the playlist creation assistant.
2. User enters a request, e.g. “Make a playlist of Indonesian rock songs under 45 minutes.”
3. App sends only necessary indexed metadata to the configured local model.
4. Model returns structured filters and constraints.
5. App validates the schema and rejects unsupported operators.
6. Deterministic code filters real library entries and calculates duration.
7. App displays selected tracks, total duration, and uncertain/missing classifications.
8. User can remove tracks, adjust criteria, rerun, or cancel.
9. User previews the result and saves it as a named playlist.
10. The playlist becomes available in ordinary playlist and playback workflows.

The model must not invent tracks, directly mutate files, execute arbitrary code, or silently save a playlist without user confirmation.

### Failure states

- No model configured: offer setup or manual playlist creation.
- Invalid model response: show retry/fallback and keep the user’s data unchanged.
- No matches: suggest changing criteria; do not fabricate results.
- Partial metadata: indicate that classification may be incomplete.
- Model timeout: preserve the request and allow retry/cancel.

## 14. Online services and metadata lookup

### Metadata lookup flow

1. User selects a track with missing or questionable metadata.
2. User chooses Search Online.
3. App sends only the necessary query fields to the configured provider.
4. Provider results are displayed with source details.
5. User selects a candidate.
6. App previews proposed changes.
7. User approves the fields to apply.
8. App writes supported changes and reports results.

Online lookup must be optional. Provider errors, rate limits, missing API keys, or no results must not block manual editing or playback.

### SerpApi

Use only if general web results provide a meaningful benefit. Do not assume search results are authoritative structured music metadata. Keep credentials out of frontend bundles and verify the challenge's current partner rules before claiming eligibility.

## 15. Album artwork

1. Prefer embedded artwork already in the file.
2. If missing, allow an explicit online lookup when configured.
3. Display candidate images and their sources.
4. Let the user preview/select/cancel.
5. Save artwork only when supported and permitted.
6. Handle image errors and avoid silently replacing existing artwork.

Do not assume online images can be redistributed freely.

## 16. Lyrics

Lyrics are a stretch feature.

- Allow a user to search for lyrics through a suitable configured provider.
- Clearly distinguish plain lyrics from timed/synchronized lyrics.
- Do not claim synchronization unless timing data exists and has been validated against the track.
- Respect provider terms and copyright restrictions.
- If no provider is configured or a lookup fails, playback remains unaffected.

Do not make singing transcription a core requirement.

## 17. Listening history

If implemented:

- Record play events and supported duration/skip signals locally.
- Make tracking status visible.
- Allow users to disable and clear history.
- Use history for transparent local statistics and simple recommendations first.
- Do not upload history by default.
- Clearing history must not delete music or playlists.

## 18. Settings

Organize settings into clear sections:

- Appearance.
- Library and scanning.
- Playback and queue.
- File operations and conversion (if available).
- Local AI.
- Online providers.
- Listening history/privacy.
- About, versions, licenses, and troubleshooting.

Each setting should have a clear current value, explanation, and appropriate validation. Missing optional configuration should not break startup.

## 19. Web versus Tauri behavior

### Web

- File selection is permission-based and browser-dependent.
- Do not promise unrestricted recursive filesystem access or arbitrary writes.
- Use supported browser APIs and explain limitations.
- Local AI connection may require the user to configure a local endpoint and may be affected by browser security/CORS.
- Render hosting does not mean the user's local model runs on Render.

### Tauri desktop

- Use narrowly scoped filesystem permissions.
- Use platform commands/plugins for operations unavailable in browsers.
- Connect to the user's configured local AI runtime.
- Test file reads/writes/renames on each claimed platform.
- Keep dangerous file operations behind explicit confirmation and validation.

Shared UI should use platform capability interfaces rather than scattered platform checks.

## 20. Offline, no-AI, and error states

The app must gracefully handle:

- No internet connection.
- No local model installed or runtime unavailable.
- Invalid model response.
- Provider rate limit or outage.
- Permission denied.
- Unsupported or corrupt audio file.
- Missing file after scanning.
- Metadata write failure.
- Rename collision.
- Conversion failure or cancellation.
- Empty library/playlist/search.
- Storage failure.

For each case, show what happened, whether user data changed, and the next available action. Never present an unverified operation as successful.

## 21. Cross-screen integration contracts

- Track identity must remain stable when metadata or filenames change.
- Playlist membership and queue references must survive library refreshes.
- A metadata edit must refresh the library display without resetting playback.
- A rename must update indexed paths and keep track references valid.
- A successful conversion creates a new track/file and does not replace the source by default.
- AI/online suggestions enter a review state; only approved changes reach the underlying data.
- Disabling AI or internet providers must not break local workflows.
- Theme and settings persist across routes and app restarts where supported.

## 22. MVP versus stretch

**MVP:** app shell, local import/scan, playback/queue, library search, playlist CRUD, basic cleanup report, safe metadata/rename preview, Halloween themes, one visualizer, optional local AI playlist creation, graceful offline/no-AI states.

**Stretch:** online metadata lookup, artwork, lyrics, audio conversion, listening-history recommendations, advanced visualizers, broad format support, macOS build.

Do not let a stretch feature block a working MVP. If a capability is not implemented, hide or clearly mark it as unavailable rather than shipping a misleading control.
