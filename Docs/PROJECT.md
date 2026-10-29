# GhostWave — Project Brief

**Project:** GhostWave
**Event:** Hacktoberfest Week 4 — Ghost in the Machine
**Category:** Open-source, local-first music player and library manager
**Project status:** Concept locked; prototype phase
**Primary platforms:** Web and desktop
**Desktop framework:** Tauri
**Target desktop operating systems:** Windows and Linux; macOS as a stretch goal
**Web deployment:** Render
**AI approach:** Optional, user-controlled local open-weight models

---

## 1. Product Vision

GhostWave is a Halloween-themed music player and library manager that transforms an ordinary folder of music into an organized, searchable, customizable listening experience.

Users can import local audio files, play their music, organize metadata, create playlists, discover missing information, and customize audio visualizations.

For users who want more functionality, GhostWave can connect to online metadata services and an optional local AI model. The AI can interpret natural-language requests, suggest metadata corrections, and organize a music library without requiring a hosted AI service.

The core application must remain useful without internet access or AI.

### Product philosophy

1. **Local-first:** Users control their music files and library.
2. **Offline-capable:** Core playback and organization do not depend on external services.
3. **AI-optional:** The application remains functional without an AI model.
4. **Review before modification:** AI suggestions never silently overwrite metadata or rename files.
5. **Open and extensible:** Users can inspect the code, change integrations, and configure supported local models.
6. **Halloween by design:** The interface feels like a polished spooky music experience, not a generic dashboard with a pumpkin icon.
7. **Progressive capability:** Internet and AI enhance the application rather than determine whether it works.

## 2. Problem Statement

Local music collections can become difficult to maintain over time.

- File names use inconsistent formats.
- Artist, album, genre, and title metadata may be missing or incorrect.
- Duplicate files consume storage and clutter the library.
- Creating playlists manually becomes tedious for large collections.
- Discovering album covers, lyrics, and other music information requires switching between applications.
- Traditional music players often separate playback, library maintenance, visual customization, and intelligent organization.

GhostWave brings these workflows together while keeping the user's music library under their control.

## 3. Target Users

### Primary users

People who maintain local music collections and want more control over playback and organization.

### Secondary users

- Music enthusiasts who enjoy visualizers and interface customization.
- Users who prefer local applications over streaming subscriptions.
- Users who want to experiment with open-weight AI.
- Linux and Windows users who value open-source software and local data ownership.

## 4. Core Product Experience

The main workflow is:

1. Open GhostWave.
2. Select a local music folder or import supported audio files.
3. Scan available files and extract their metadata.
4. View the library, including missing tags, inconsistent naming, and possible duplicates.
5. Review suggested changes and approve or edit them.
6. Apply approved changes to the files when supported.
7. Create and manage playlists.
8. Play music with a customizable Halloween-themed visualizer.
9. Optionally enrich the library through online services or a local AI model.

The application should guide users through this workflow without requiring them to understand AI, APIs, or music metadata standards.

## 5. Three Operating Modes

GhostWave must distinguish its core application from optional integrations.

### Mode A — Local Core

**Requirements:** Installed application or compatible browser; no internet or AI required for core functionality.

Features:

- Import supported local audio files.
- Read available audio metadata.
- Display and search the local library.
- Play, pause, seek, skip, and adjust volume.
- Create, rename, edit, and delete playlists.
- Add and remove songs from playlists.
- Edit supported metadata manually.
- Identify missing tags and inconsistent naming.
- Detect likely duplicate files.
- Preview and apply supported file-renaming rules.
- Use basic audio visualizers.
- Save library indexes, playlists, and preferences locally.

All essential library operations should remain available offline.

### Mode B — Online Enrichment

**Requirements:** Internet connection and whichever service configuration is necessary.

Features:

- Search for artist, title, album, and other metadata.
- Suggest corrections using external music databases.
- Retrieve album artwork where permitted.
- Look up lyrics through a suitable provider where licensing and API access allow it.
- Display external music references and search results.

The application must distinguish verified information from uncertain matches.

Online services should be replaceable. Users should be able to configure their own API credentials when supported.

### Mode C — Local AI

**Requirements:** A compatible local model and its runtime, such as Ollama.

Features:

- Generate metadata-cleanup suggestions.
- Interpret natural-language playlist requests.
- Classify tracks using available metadata.
- Suggest playlist names and descriptions.
- Help organize music by artist, genre, language, era, or user-defined criteria.
- Summarize library inconsistencies and propose a cleanup plan.

The AI must not be required for ordinary playback, searching, playlist management, or manual metadata editing.

**Offline AI requirement:** If the model and its dependencies are already installed, supported AI features should continue working without an internet connection. AI features that require online metadata lookups must clearly indicate that limitation.

## 6. Music Library Management

### Import and scanning

Users select a folder or choose files through the operating system's file picker.

GhostWave scans supported audio formats and extracts available information, such as:

- File name and path
- Title
- Artist
- Album
- Genre
- Duration
- Track number
- Year, when available
- Embedded artwork, when supported
- File format and size

The scanner should tolerate incomplete metadata and unsupported files without crashing the application.

Recursive folder scanning should be supported where the selected platform and file-access permissions permit it.

### Library health report

After scanning, GhostWave generates a report containing:

- Missing metadata
- Inconsistent naming conventions
- Possible duplicate tracks
- Suspected incorrect or conflicting tags
- Files that could not be read
- Tracks that may need external metadata lookup

The report should separate definite issues from uncertain matches.

### Metadata cleanup workflow

1. Scan the library.
2. Identify problems.
3. Generate suggested corrections.
4. Show the current value and proposed value side by side.
5. Allow the user to edit individual suggestions.
6. Allow approval of selected changes or an entire reviewed batch.
7. Apply the approved changes.
8. Report successful updates and failures.
9.

No destructive change should occur before user approval.

### File renaming

Users can define naming templates, for example:

`Artist - Title.ext`

Other templates may include album, track number, or year.

GhostWave should preview the resulting paths before renaming. It must detect filename collisions and avoid overwriting existing files.

Metadata editing and physical file renaming are separate operations so users can choose either or both.

### Duplicate detection

Use deterministic checks first:

- Matching file hashes for identical files.
- Matching normalized metadata for likely duplicates.
- Duration and file information as supporting evidence.

Tracks with similar names should not automatically be treated as identical. The user decides what to remove or keep.

## 7. Playlists and Intelligent Organization

Users can create multiple named playlists, each with an optional description.

The default library is not itself a playlist. A playlist is a saved collection of tracks selected from the library.

### Manual playlist management

- Create, rename, and delete playlists.
- Add and remove tracks.
- Reorder tracks.
- Edit the playlist description.
- Save and restore playlist contents.
- Play a playlist or individual tracks.

### Natural-language playlists

Users can ask for playlists in ordinary language.

Examples:

- "Make a playlist with all One Direction songs."
- "Find my K-pop tracks."
- "Create an Indonesian music playlist."
- "Give me calm music for studying."
- "Make a Halloween playlist that lasts less than 45 minutes."
- "Create a high-energy playlist without songs I have already marked as favorites."

The local model translates the request into structured search criteria. Deterministic application code then filters the library, checks durations, and constructs the playlist.

The model should not invent songs that are absent from the user's collection.

### Confidence and accuracy

The application should distinguish between:

- Matches supported by existing metadata.
- Probable matches that need review.
- Tracks that cannot be classified reliably.

For example, a track with a missing genre should not be confidently labelled as K-pop solely because its filename contains a Korean-looking word.

Users can review the proposed playlist before saving it.

## 8. Listening History and Recommendations

GhostWave may maintain a local listening history to support personalized recommendations.

Potential signals include:

- Number of plays.
- Listening duration.
- Skips and early exits.
- Frequently played artists.
- Frequently played genres.
- Favorite tracks.
- User-selected moods.
- Playlists the user returns to.

The first implementation should use transparent, deterministic statistics rather than an elaborate recommendation model.

A later local AI feature could summarize these statistics and explain recommendations in natural language.

Listening history should be stored locally by default, with controls to clear it or disable tracking.

## 9. Audio Playback and Visualizers

### Playback

The player should provide:

- Play and pause.
- Previous and next track.
- Seeking and playback progress.
- Volume control.
- Current track information.
- Queue or playlist playback.
- Album artwork when available.

### Visualizer concept

GhostWave should have a recognizable visual identity beyond a conventional music-player interface.

Possible visualizations include:

- Waveforms.
- Frequency bars.
- Circular audio-reactive patterns.
- Pulsing shapes.
- Heart-shaped visualizations.
- Pumpkin or ghost-inspired effects.
- Custom colors and background images.

Users should be able to select visualizer styles and adjust supported properties such as colors, sensitivity, and animation intensity.

Beat and bass responsiveness should be added only after a basic audio-reactive visualization works reliably.

### Implementation strategy

Use Web Audio APIs where appropriate and evaluate Butterchurn, an open-source MilkDrop-style visualizer, as a reference or optional visualization component.

A built-in GhostWave visualizer should provide a simpler, distinctive default experience. The project does not need to recreate every MilkDrop preset.

Custom visualizers should be evaluated for browser compatibility, performance, and licensing before inclusion.

## 10. Album Artwork and Lyrics

### Album artwork

The application should first use embedded artwork when available.

For tracks without artwork, users may search online providers for candidate images. They must be able to preview and approve the result before saving it.

### Lyrics

Lyrics are a secondary feature.

The initial implementation should focus on finding lyrics from an appropriate external source and displaying them alongside playback.

Synchronized lyrics require timing data associated with the specific recording. Searching for plain lyrics does not automatically provide reliable word-by-word or line-by-line synchronization.

Lyrics retrieval, storage, and redistribution depend on provider terms and copyright. GhostWave must not assume that publicly accessible lyrics can be freely republished.

Automatic transcription of singing, chord detection, source separation, and AI-generated music are outside the initial scope.

## 11. Halloween-Themed User Interface

GhostWave should look like a complete Halloween music application, not a generic dashboard with Halloween decoration.

### Visual direction

The interface can combine a modern music-player layout with a restrained spooky atmosphere.

Possible visual elements:

- Deep charcoal and midnight-purple backgrounds.
- Pumpkin orange, violet, spectral green, and muted red accents.
- Subtle glow effects and atmospheric gradients.
- Ghost, moon, bat, and pumpkin motifs.
- Animated audio-reactive elements.
- Clear typography and readable track information.

The design must prioritize usability over decoration.

### Theme system

Support:

1. **Halloween Dark** — the default theme.
2. **Halloween Light** — a lighter, readable alternative.
3. **Custom palettes** — allow users to select from predefined color schemes.
4. **Custom accent color** — a later enhancement.

Theme changes should apply consistently across navigation, player controls, cards, dialogs, visualizers, and library tables.

### Main interface

The proposed layout contains:

- **Sidebar:** Library, Playlists, Listening History, Settings.
- **Main content:** Search, library overview, track table, selected playlist, or cleanup report.
- **Now Playing panel:** Track information, artwork, playback controls.
- **Visualizer area:** Audio-reactive animation and customization controls.
- **Optional AI panel:** Natural-language requests and reviewable suggestions.

The interface should feel familiar to users of modern music applications without copying Spotify or YouTube Music branding or protected assets.

## 12. Application Platforms

### Web application

The web version will use React, TypeScript, and Vite, with deployment on Render.

It should support core playback and library operations within browser file-access constraints.

Browser security requires users to explicitly select files or folders, and some filesystem operations differ between browsers. The web version must not promise unrestricted filesystem access.

### Desktop application

Tauri will package the frontend into a desktop application.

Initial targets:

- Windows
- Linux

macOS is a stretch goal, depending on build tooling, testing availability, and remaining time.

The desktop application is especially important for reliable local file management, direct access to local AI runtimes, and a more natural local music experience.

Filesystem access should use narrowly scoped permissions. The app should not receive unrestricted filesystem access simply because it is a desktop application.

### Shared codebase

The web and desktop versions should share as much of the UI and application logic as practical.

Platform-specific capabilities should sit behind explicit interfaces, including:

- File access.
- Metadata reading and writing.
- File renaming.
- Local storage.
- Local AI connections.

This avoids maintaining two independent applications.

## 13. Proposed Technical Architecture

### Frontend

- React
- TypeScript
- Vite
- CSS or a suitable styling library
- Web Audio APIs
- IndexedDB for browser-side library indexes and preferences

### Desktop

- Tauri 2
- Rust commands or plugins for platform-specific filesystem operations
- Scoped permissions for reading, writing, and renaming files

### Audio and metadata

- A suitable browser-compatible audio metadata parser.
- Browser audio playback for the web application.
- Platform-aware file operations for the desktop application.
- A lightweight local database or indexed storage for library records.

### Local AI

- Ollama as an initial supported local inference runtime.
- A small, compatible open-weight instruction model.
- Structured JSON output for playlist criteria and metadata suggestions.
- Validation in application code before any operation is performed.

The AI integration should be modular so additional compatible runtimes can be considered later.

### Online enrichment

- A metadata provider such as MusicBrainz, subject to its usage requirements.
- A separately evaluated artwork provider.
- A separately evaluated lyrics provider.
- Optional user-supplied API keys for supported services.

A small Render-hosted backend may be necessary for API integrations that require secret credentials, request proxying, or rate-limit enforcement. A static frontend must never contain private server API keys.

### Storage separation

Keep the following data conceptually separate:

- Music files, which belong to the user.
- The library index and application settings.
- Playlists and listening history.
- Pending metadata changes.
- AI-generated suggestions.
- Cached online results.

The application should not upload music files or private listening history to a remote server by default.

## 14. AI Design and Safety

GhostWave's AI should operate as an assistant for library organization, not as an unrestricted agent.

### Structured operations

The model can propose operations such as:

- Filter tracks by artist or genre.
- Search by title.
- Suggest metadata values.
- Create a playlist from matching tracks.
- Propose a filename using a selected naming template.

The application executes validated operations using deterministic code.

### Prohibited behavior

The model must not:

- Execute arbitrary generated JavaScript or shell commands.
- Rename or modify files without approval.
- Delete files automatically.
- Invent metadata and silently save it.
- Upload music files to an external model provider.
- Treat untrusted filenames or metadata as executable instructions.

### Model failure handling

If the model is unavailable, returns invalid output, or produces uncertain results, GhostWave should show an understandable error and leave the library unchanged.

Manual operations must remain available.

## 15. Open-Source and Open-Innovation Rationale

GhostWave demonstrates why local and open AI can matter in a consumer application.

- **Privacy:** Music-library information can be processed locally.
- **Offline use:** A configured local model can provide supported AI functions without contacting a hosted AI provider.
- **User control:** Users choose whether to enable AI.
- **Replaceable models:** The application can support compatible models without tying its core logic to a single provider.
- **Inspectability:** Users can inspect how suggested changes are validated and applied.
- **Cost control:** Local inference avoids per-request hosted inference charges, although hardware and electricity still have costs.

The project should clearly distinguish open-weight model availability from the licensing of the model itself. Model licenses and third-party dependencies must be checked before distribution.

## 16. Third-Party Partner Strategy

Product functionality comes first. Partner selection follows the architecture rather than driving it.

### Priority 1 — Essential product capabilities

Build and validate local playback, library scanning, playlist management, and a basic visualizer before integrating additional services.

### Priority 2 — Open-weight AI

Evaluate a local Ollama model for structured playlist queries and metadata suggestions.

This is the most important integration for the Hacktoberfest theme because it directly demonstrates user-controlled, local AI.

### Priority 3 — Online metadata

Evaluate MusicBrainz and other suitable providers. Implement only the integrations needed to demonstrate useful metadata enrichment.

### Priority 4 — Deployment and distribution

Use Render for the web version and GitHub for source code, release artifacts, installation instructions, and documentation.

Additional partners should be included only when they add a concrete capability or directly support an applicable challenge requirement.

The final submission must use only verified partner-program details and must not claim a partnership or prize eligibility that has not been confirmed.

## 17. MVP Scope

The MVP must demonstrate one coherent workflow from importing music to organizing and playing it.

### Must have

1. Import supported local audio files.
2. Read and display basic metadata.
3. Play, pause, seek, and skip tracks.
4. Search the local library.
5. Create and manage playlists.
6. Identify missing tags and inconsistent metadata.
7. Preview and approve metadata changes.
8. Rename files using a configurable naming template, with a preview.
9. Provide a distinctive Halloween interface with dark and light themes.
10. Include at least one working audio-reactive visualizer.
11. Support a local AI query that creates a playlist from existing library metadata.
12. Keep the core application usable without internet or AI.

### High-priority stretch features

- Online metadata search and candidate matching.
- Album-art lookup.
- Additional visualizer presets.
- Basic listening history.
- A desktop build for Windows and Linux.
- A small sample library of legally redistributable music.

### Deferred features

- Reliable synchronized lyrics.
- Automatic transcription of singing.
- Chord detection.
- Source separation.
- AI-generated music.
- Advanced personalized recommendations.
- Cloud synchronization.
- Streaming-service integration.
- Full mobile support.
- Extensive plugin architecture.
- Complete parity between all desktop and web filesystem capabilities.

## 18. Prototype-First Development Workflow

Development should begin with working interactions, not a large documentation exercise.

### Phase 1 — Prototype the risky interactions

Build small, independently testable prototypes:

1. Import and play local audio.
2. Read metadata from the imported files.
3. Build a library table and playlist interaction.
4. Preview a metadata correction.
5. Test a file-renaming operation safely.
6. Render an audio-reactive visualization.
7. Send a natural-language request to a local model and validate its structured output.
8. Test the shared frontend inside Tauri.

Each prototype should have a clear pass/fail condition.

### Phase 2 — Validate the architecture

Confirm that:

- The browser version can handle its intended local-file workflow.
- Desktop filesystem operations work through the Tauri integration.
- The local model can be connected without making it a mandatory dependency.
- Online integrations can be disabled without breaking the core application.
- The same core UI can run in the web and desktop targets.

### Phase 3 — Assemble the MVP

Combine the validated components into a usable application.

Focus on the complete workflow rather than implementing every proposed feature.

### Phase 4 — Improve the interface

After the working prototype is stable, refine the Halloween design, playback layout, responsive behavior, visualizer controls, error states, and onboarding.

### Phase 5 — Test and package

- Test offline mode.
- Test with AI unavailable.
- Test with internet unavailable.
- Test missing and incorrect metadata.
- Test duplicate detection.
- Test file-renaming collisions.
- Test large libraries within practical performance limits.
- Build and test Windows and Linux desktop versions.
- Verify the deployed Render version.
- Publish installation instructions and release artifacts.

## 19. Acceptance Criteria

The MVP is ready for demonstration when a new user can:

1. Open GhostWave and understand its interface.
2. Import a small local music collection.
3. Play a selected track and see the current playback state.
4. Search for tracks and create a playlist.
5. Identify missing metadata and review proposed corrections.
6. Edit or reject a suggestion before it changes a file.
7. Rename a file safely using a preview.
8. See an audio-reactive visualizer.
9. Use the core application without an internet connection.
10. Use the core application without a configured AI model.
11. Connect a compatible local model and create a playlist using natural language.
12. Understand which features require internet access or additional configuration.

At least one desktop target should be built and tested before claiming that desktop distribution is complete. A web deployment alone does not establish Windows or Linux compatibility.

## 20. Main Risks and Mitigations

| Risk                                          | Mitigation                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Scope exceeds the hackathon timeline          | Prioritize one end-to-end workflow and defer advanced features.                             |
| Browser filesystem limitations                | Separate browser file access from desktop filesystem operations.                            |
| Local AI is unavailable or inaccurate         | Keep AI optional, validate structured output, and provide manual controls.                  |
| Incorrect metadata matches                    | Present candidates with confidence indicators and require approval.                         |
| Destructive file operations                   | Preview changes, detect collisions, and never overwrite files silently.                     |
| Lyrics and artwork licensing                  | Use appropriate providers and respect their terms.                                          |
| API keys exposed in the frontend              | Keep server secrets on a backend and support user-owned keys where appropriate.             |
| Desktop builds are delayed                    | Validate the smallest Tauri application early.                                              |
| Visualizer integration consumes too much time | Start with a simple built-in visualizer and evaluate MilkDrop-style integration separately. |
| AI integration breaks offline behavior        | Keep AI and online enrichment behind independent service interfaces.                        |

## 21. Definition of Success

GhostWave succeeds when it demonstrates a useful local music workflow, a distinctive Halloween identity, and a meaningful application of open-weight AI.

The key demonstration is not merely that the app has an AI chat panel.

It is that a user can import a messy local library, inspect and approve corrections, organize tracks using natural language, create a playlist, and listen to the result—while retaining control over their files and choosing whether to use internet services or local AI.

**Final principle:** Build the reliable music application first. Make the optional capabilities genuinely useful. Do not let advanced features compromise the core experience.
