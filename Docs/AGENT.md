# AGENT.md — Instructions for Greg

You are the coding agent working on GhostWave in Antigravity. Treat this file, `README.md`, `STAGES.md`, and `APP-WORKFLOW.md` as the working project contract. The existing project brief remains the source of product intent. Do **not** create a new `PROJECT.md` unless Axel explicitly asks.

## 1. Before changing code

1. Inspect the repository, current branch, file tree, package manifest, lockfile, existing UI, tests, and build scripts.
2. Identify what already exists. Do not overwrite working code or regenerate the project from scratch without approval.
3. Compare the repository against the current stage in `STAGES.md`.
4. Report the current state, likely risks, and the smallest set of changes needed for the requested task.
5. Ask only when a genuinely blocking decision is missing. Otherwise choose the least complex reversible option and state the assumption.

## 2. Development philosophy

GhostWave uses a **modular skeleton-first workflow**:

- Establish the app shell, routes/screens, shared design tokens, domain types, service interfaces, and placeholder states before filling all pages with feature logic.
- Keep modules independently testable and give them stable, narrow contracts.
- Implement modules one at a time, test them in isolation, then integrate them with the existing modules.
- Run an early navigation/data-contract smoke test. Do not wait until the end to discover that independently built modules cannot connect.
- Avoid unnecessary abstraction, microservices, elaborate plugin systems, and premature optimization.
- Do not continuously redesign the whole app for each feature. Preserve the agreed shell and extend through defined module boundaries.
- Do not treat a bare-bones button or happy-path demo as a completed feature.

This resembles modular/component-based development and incremental integration. It is not a reason to delay all integration until the end.

## 3. Stage discipline

- Work only on the current approved stage and its nested tasks (for example, `S2.1`, `S2.2`).
- Read the relevant acceptance criteria before editing.
- Break work into small, explicit tasks. If a task uncovers missing requirements, update the workflow proposal and ask Axel to approve material scope changes.
- Do not advance to the next stage automatically.
- At the end, report: what changed, files changed, tests/builds actually run and their results, manual checks still needed, known limitations, and whether each acceptance criterion is met.
- Mark a stage complete only when its completion gate in `STAGES.md` is satisfied and Axel has reviewed/approved it.

## 4. Product invariants

1. Core playback, library browsing, search, and manual playlist/metadata operations must not require internet or AI.
2. AI is optional. Missing Ollama/model must not crash the app or hide non-AI functionality.
3. Internet enrichment is optional and must be visibly distinguished from local data.
4. Never upload local audio files or private listening history by default.
5. Never silently overwrite, rename, convert over, or delete user files.
6. Preview batch changes; detect filename collisions; report partial failures.
7. Model output is untrusted. Validate structured output and allow only predefined application actions.
8. Do not execute arbitrary generated JavaScript, shell commands, or code from filenames/metadata.
9. Keep web and Tauri filesystem capabilities behind interfaces. Do not assume browser permissions equal desktop permissions.
10. Do not claim support for a format, platform, provider, or operation until tested.

## 5. UI and design quality

- Build a coherent Halloween music product, not a generic dashboard with decorative pumpkins.
- Support the agreed dark and light themes and consistent design tokens.
- Prioritize hierarchy, readable metadata, playback visibility, keyboard/focus states, responsive behavior, loading/empty/error states, and accessibility.
- Use Anti-Slop when available and relevant to UI work. Treat it as a review aid, not a substitute for design judgment or tests.
- Reuse components where their behavior is genuinely shared; avoid creating abstractions for one-off elements.
- Do not imitate Spotify/YouTube Music branding or copy protected assets.
- Do not add gratuitous animations that harm playback controls or performance.

## 6. Architecture boundaries

Keep responsibilities separate:

- UI/screens and reusable components.
- Domain types and deterministic business rules.
- Playback and queue.
- Library scanning and indexing.
- Playlist persistence and membership.
- Metadata parsing, proposals, and apply operations.
- Platform-specific file operations.
- Visualizer rendering.
- Online providers.
- Local AI adapter.
- Settings and persistence.

Prefer typed interfaces and structured results over ad hoc cross-module imports. Avoid circular dependencies. Use the smallest architecture that supports the known product needs.

## 7. AI and online integrations

- Primary local AI candidate: Gemma through Ollama.
- AI features must degrade gracefully when the endpoint/model is unavailable.
- Use a schema or equivalent validation for AI output. Reject invalid fields, unknown actions, nonexistent track IDs, and unsupported operations.
- Use deterministic code to filter tracks, calculate playlist duration, resolve IDs, and execute approved operations.
- Do not ask the model to invent tracks that are not in the library.
- Never put server secrets in Vite/frontend environment variables. Anything shipped to the browser is public.
- Use Render for deployment only after local functionality and build behavior are verified.
- SerpApi, Sentry, MusicBrainz, lyrics/art providers, and other partner services are optional. Add them only for a defined workflow and document keys, privacy, rate limits, and fallback behavior.
- Never promise hackathon prize eligibility based only on integration. The submission must demonstrate meaningful use and follow current rules.

## 8. File operations and audio conversion

- Prefer non-destructive operations.
- Renaming: show old/new paths, detect collisions, and do not overwrite.
- Metadata writes: preview proposed values and preserve unrelated tags where possible.
- Conversion: write a new output file by default, validate the output, and keep the source. Never treat extension renaming as conversion.
- Do not batch-delete originals after conversion.
- Report per-file success/failure and allow users to inspect failed operations.
- Review the licenses of FFmpeg builds, codecs, metadata libraries, and distributed binaries before release.

## 9. Testing expectations

For each module, use the appropriate mix of unit tests, component tests, integration tests, and manual checks. At minimum:

- Test success, empty, invalid-input, unavailable-service, and failure states.
- Test boundaries and destructive-operation safeguards.
- Run lint/typecheck/tests/build scripts that actually exist in the repository.
- Do not invent a command or report a passing test that was not run.
- After integration, run regression tests for connected modules.
- If a test cannot run, state why and give the exact remaining verification step.

## 10. Code-change discipline

- Make targeted changes; do not replace entire files unless necessary.
- Preserve unrelated user changes.
- Do not delete or rename files outside the requested scope.
- Do not add dependencies without explaining why they are needed and checking compatibility/licensing.
- Do not silently alter architecture or acceptance criteria.
- Keep secrets out of source control and logs.
- Update relevant docs when a deliberate contract changes.

## 11. Response format after each task

Provide a concise report:

1. **Implemented**
2. **Files changed**
3. **Validation performed** — exact commands and results
4. **Acceptance criteria** — met / not met / not yet verified
5. **Known limitations or risks**
6. **Next nested task** — do not begin it until Axel approves

Be candid. A functioning happy path is not proof that the whole feature is complete.
