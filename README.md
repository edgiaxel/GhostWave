# GhostWave

A Halloween-themed, local-first music player and library manager for people who want to enjoy, organize, and customize their own music collection.

> **Project status:** Planning / initial implementation
> **Hackathon:** Hacktoberfest Week 4 — Ghost in the Machine
> **Primary targets:** Web + Tauri desktop (Windows and Linux first; macOS stretch)
> **Web deployment:** Render
> **Optional local AI:** Gemma through Ollama

## Product vision

GhostWave turns a folder of local music into an organized, searchable, customizable listening experience. Its core works without an internet connection or AI model. Optional online enrichment and local open-weight AI add capabilities without becoming mandatory dependencies.

### Principles

- **Local-first:** music files remain under the user's control.
- **Offline-capable:** core playback, library browsing, playlists, and manual organization work without internet.
- **AI-optional:** no model is required for normal use.
- **Review before changes:** metadata edits, renames, conversions, and other potentially destructive operations require preview and explicit approval.
- **Modular:** feature areas have clear interfaces and can be developed and tested independently.
- **Halloween by design:** polished spooky visual identity with dark/light themes and customizable palettes.
- **Honest capability boundaries:** web and desktop filesystem permissions differ; the UI must communicate this.

## Core user experience

1. Import local audio files or select a folder where supported.
2. Scan supported files and read available metadata.
3. Browse, search, and play tracks.
4. Create and manage playlists.
5. Review a library-health report for missing tags, inconsistent names, and possible duplicates.
6. Preview and approve metadata changes and filename changes.
7. Use a customizable audio-reactive visualizer.
8. Optionally connect a local model for natural-language playlist creation and metadata suggestions.
9. Optionally use online services to look up candidate metadata, artwork, or lyrics.

## Capability tiers

### Local Core — no internet or AI required

- Import supported audio files.
- Read metadata and browse/search the library.
- Play, pause, seek, skip, and manage a queue.
- Create, edit, and delete playlists.
- Manually edit supported metadata.
- Detect missing tags, inconsistent naming, and possible duplicates.
- Preview file-renaming templates.
- Use basic visualizers and themes.
- Persist app data locally.

### Online Enrichment — optional internet

- Search for candidate metadata using suitable providers.
- Look up album artwork and lyrics when a suitable provider and usage terms permit it.
- Show candidate sources and allow users to review matches.
- Never require online services for core playback.

### Local AI — optional local model/runtime

- Natural-language playlist requests.
- Suggested metadata corrections and filename patterns.
- Library-cleanup summaries.
- AI output must be structured, validated, and reviewable. It must never execute arbitrary generated code or modify files without approval.

## MVP priorities

**MVP target:** one coherent workflow from local import to playback, playlist creation, reviewable cleanup, a visualizer, and one local-AI playlist task.

1. App shell and navigation.
2. Local audio import and metadata scan.
3. Playback controls and queue.
4. Library search and playlist CRUD.
5. Library-health report and safe metadata/rename preview.
6. Halloween dark/light themes and one working visualizer.
7. Optional local model connection and natural-language playlist creation.
8. Basic web/desktop capability separation and error states.

### Later or stretch

- Batch audio conversion (start with a small, tested set of formats).
- Online metadata and album-art lookup.
- Lyrics display and synchronization.
- Listening-history recommendations.
- Additional visualizer presets.
- More audio formats and advanced conversion controls.
- macOS packaging.
- Advanced chord detection, source separation, or singing transcription are out of scope for the hackathon MVP.

## Architecture direction

Keep UI and domain logic modular. Platform-specific capabilities should sit behind interfaces:

- `AudioLibrary`: indexed tracks and metadata.
- `Playback`: current track, queue, transport, and playback state.
- `Playlists`: playlist CRUD and membership.
- `Metadata`: parsing, validation, and proposed changes.
- `FileOperations`: platform-specific read/write/rename/conversion operations.
- `Visualizer`: audio-reactive rendering and settings.
- `OnlineProviders`: optional external lookup.
- `LocalAI`: optional model connection and structured task output.
- `Settings`: themes, provider configuration, and user preferences.

The exact folder layout and libraries should be confirmed after repository inspection and a minimal technical prototype. Avoid prematurely building an elaborate plugin framework.

## Privacy and safety

- Do not upload music files or private listening history by default.
- Do not put private API keys in frontend code.
- Never overwrite or delete original files silently.
- Preview batch operations, detect collisions, and report failures.
- Treat model output and file metadata as untrusted input.
- Validate model output against schemas and allow only known application operations.
- Explain which capabilities require internet, desktop permissions, or a configured local model.

## Development workflow

See [STAGES.md](STAGES.md) for staged implementation and completion gates, [APP-WORKFLOW.md](APP-WORKFLOW.md) for screen behavior, and [AGENT.md](AGENT.md) for coding-agent instructions.

The workflow is **skeleton first, then modular implementation**:
1. Inspect the repository and settle minimal architecture.
2. Create the app shell, routes, module boundaries, and placeholder states.
3. Smoke-test navigation and the shared data contracts.
4. Implement one module at a time.
5. Test a module in isolation, integrate it with existing modules, then run regression tests.
6. Axel reviews the evidence and explicitly approves moving to the next stage.

This does not mean postponing all integration until the end. A small early end-to-end smoke test is required to expose architectural problems before the modules grow.

## Partners and optional integrations

- **Gemma via Ollama:** primary local open-weight model candidate.
- **Render:** web deployment and potentially a small backend for online provider requests. The local model remains on the user's machine.
- **SerpApi:** optional web-search candidate only if search results add real value beyond a dedicated music metadata provider.
- **Sentry:** optional diagnostics if setup is quick and privacy implications are documented.
- **MusicBrainz:** candidate structured metadata provider, subject to its policies and rate limits.
- **FFmpeg:** candidate for desktop conversion, subject to codec/build and distribution-license review.

Partner usage does not guarantee prize eligibility. Verify the challenge's current rules and demonstrate a meaningful use case before claiming a category.

## Development setup

The exact commands depend on the repository's selected package manager and installed dependencies. After inspecting the repository:

1. Install the supported Node.js version and package manager.
2. Install project dependencies using the repository's lockfile.
3. Run the frontend development server.
4. For local AI, install Ollama separately, pull a compatible Gemma model, and configure the model endpoint.
5. For desktop development, install the prerequisites required by Tauri 2 and the target operating system.
6. Use the actual scripts and environment variables documented in the repository; do not invent commands or claim a build works without running it.

## Definition of a credible MVP

A new user can import a small local music collection, play a track, search the library, create a playlist, review a proposed correction, see an audio-reactive visualization, and optionally ask a configured local model to build a playlist from existing library metadata. Core playback and manual organization still work when internet and AI are unavailable.

## License and attribution

Choose a project license before public release. Review all dependency licenses, model licenses, audio codecs, visualizer packages, fonts, icons, artwork, and sample music. Do not distribute copyrighted sample tracks or assume a service's search results are freely redistributable.
