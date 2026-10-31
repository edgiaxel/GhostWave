*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

## What I Built

**GhostWave** is an open-source, local-first music player, crate manager, and audio-reactive visualizer designed with a spooky Halloween aesthetic. It is built for music lovers who cherish their local music collections (FLAC, MP3, WAV, OGG, AAC) and refuse to surrender their personal audio libraries to the whims of cloud streaming availability, data scraping, or internet connectivity outages.

At the heart of GhostWave is the **"Ghost in the Machine"**: a local open-weight AI agent powered by **Google's Gemma 3 4B running completely offline on your hardware via Ollama**. 

Instead of treating AI as a cloud subscription dependency that reads all your private files, GhostWave treats Gemma 3 as an offline resident spirit—a local companion that analyzes your local audio metadata, curates smart crates from natural language prompts (*"Curate a spooky high-energy Halloween workout playlist in lossless FLAC with punchy bass"*), diagnoses missing ID3 tags, and helps restore corrupted collections while keeping your music vault completely read-only and private.

![GhostWave Hero Banner](https://raw.githubusercontent.com/edgiaxel/GhostWave/main/docs/assets/youtube_thumbnail.jpg)

### Key Capabilities:
- 🗄️ **Zero-Cloud Crate Deck:** Fast IndexedDB cataloging of local audio files with fuzzy search, format pills (MP3/FLAC/All), and table vs grid album views.
- 🎛️ **Audio Engine & Spectral Visualizer:** Web Audio API transport, queue management, and real-time audio-reactive visualizers (Waveform, Neon Bats, Spectral Columns, Jack-o'-Lantern pulses) in Halloween Dark and Light palettes.
- 🤖 **Local Open-Weight AI Curator:** Natural-language crate curation powered by Gemma 3 via Ollama; strictly schema-validated with zero hallucinations allowed.
- 🩺 **Deterministic Health Audits:** Detects missing tags, unicode filename inconsistencies, and duplicate hashes with side-by-side proposal diffs.
- 🔄 **16-Bit PCM Audio Transcoding:** In-browser non-destructive conversion to clean uncompressed WAV or OGG without overwriting source files.
- 📊 **Local Scrobbling & Transparent Recommendations:** Offline playback tracking, skip-rate analytics, and recommendation scoring with clear human-readable rationales.
- 🌐 **Online Metadata Enrichment (Optional):** MusicBrainz, Cover Art Archive, LRCLIB synced lyrics, and SerpApi Google Knowledge Graph candidate lookups; strictly human-in-the-loop.
- 🛡️ **Privacy-Preserving Sentry Telemetry:** Sanitized crash diagnostics and AI latency tracking that scrubs all filepaths, audio bytes, and user prompts before dispatch.

---

## Demo

- **Live Web App:** [https://ghostwave.onrender.com](https://ghostwave.onrender.com)
- **GitHub Repository:** [https://github.com/edgiaxel/GhostWave](https://github.com/edgiaxel/GhostWave)
- **High-Definition Walkthrough Video:** Available in the repository at [`docs/ghostwave_product_demo.mp4`](https://github.com/edgiaxel/GhostWave/blob/main/docs/ghostwave_product_demo.mp4).

---

## Code

{% github edgiaxel/GhostWave %}

---

## How I Built It

GhostWave was engineered using a modular, skeleton-first TypeScript architecture:

1. **Frontend Core:** React 18, TypeScript, Tailwind CSS, Lucide icons, and Material Symbols.
2. **Audio Transport & DSP:** Web Audio API (`AudioContext`, `AnalyserNode`, `BiquadFilterNode`) driving real-time Canvas 2D spectral rendering at 60 FPS.
3. **Audio Metadata Parsing:** `music-metadata-browser` extracting raw ID3v1, ID3v2.4, Vorbis comments, and embedded album artwork directly inside the browser sandbox.
4. **Local AI Inference Engine:** 
   - Uses **Google's Gemma 3 4B** (`gemma3:4b`) served locally via the Ollama REST daemon (`http://127.0.0.1:11434`).
   - The prompt pipeline serializes only the necessary lightweight catalog metadata (IDs, titles, artists, genres, durations, formats) into the prompt context.
   - Enforces strict structured JSON schema generation:
     ```json
     {
       "name": "Fast Electronic Workout (FLAC)",
       "description": "High-octane lossless electronic tracks with driving tempo",
       "trackIds": ["trk-1", "trk-7", "trk-24"],
       "explanation": "Selected based on high tempo tags and lossless FLAC container"
     }
     ```
   - **Deterministic Validation & Hallucination Filter:** In `AiPlaylistService.ts`, the model's output is parsed with resilient code-fence stripping and regex fallbacks. Every proposed track ID is verified against the real IndexedDB track vault. Fabricated track IDs are rejected, and aggregate duration constraints are deterministically enforced.
5. **Desktop Packaging:** Tauri 2 (`src-tauri/`) with native Linux and Windows CI targets, allowing GhostWave to run as a native desktop binary with scoped local disk access.
6. **Automated Testing & QA:** 12 Vitest unit test suites (121 tests) and 10 Playwright End-to-End browser test suites (30 tests) running against real audio files and the live Ollama daemon.

---

## Why Does Open Innovation Matter?

Music is deeply personal. Your private music collection—rare Vocaloid demos, local live bootlegs, anime soundtracks, ripped childhood CDs—tells the story of your life. 

When you use modern closed streaming services:
1. **You own nothing:** Tracks disappear without warning due to regional licensing disputes.
2. **You are surveilled:** Every song you play, pause, or skip is logged, profiled, and sold to advertisers.
3. **You are helpless when offline:** A power outage, a severed fiber line, or a rural road trip leaves you in dead silence.
4. **Cloud AI treats you as training fodder:** Closed LLM APIs upload your private directory structures and prompt histories to corporate servers.

**Open innovation makes digital sovereignty possible.**
Because Google released **Gemma 3** as an open-weight model, and because tools like **Ollama** exist, we can run state-of-the-art language intelligence entirely on consumer hardware. No API keys, no monthly subscriptions, no telemetry leaks, and zero network calls. When the internet cord is cut, GhostWave doesn't degrade into a useless error screen—it continues to organize, curate, and play your music library with full AI capabilities.

---

## The Spirit of It

It was Halloween Eve. Outside my window, a violent thunderstorm rolled across the city. Lightning struck a transformer down the street, and our neighborhood went pitch black.

When power was restored ten minutes later, our home internet was dead—the ISP's junction box had blown out. We were hosting an intimate Halloween gathering with friends. My friend pulled out her phone to start the party playlist on Spotify: **Error: No Internet Connection. You are offline.**

I grabbed my external hard drive packed with over a decade of local music: Japanese Vocaloid tracks, 90s eurobeat, synthwave, and classical files. We plugged it into my laptop, but we immediately hit a wall: half the filenames were unindexed unicode strings (`Matsuri（Official Video）(MP3_160K).mp3`), tags were missing, and nobody wanted to spend an hour manually clicking through folders while the party sat in silence.

We needed a smart, high-energy playlist, and we needed it *right now*—without the internet.

That night was the spark. I sat down and built GhostWave: a music player where the intelligence lives inside the machine with you. When the storm hits, the power flickers, and the fiber goes dark, the ghost in the machine awakens. You type what you feel, Gemma 3 finds the tracks, the neon waveforms pulse across your screen, and the music never stops.

---

## Prize Categories

1. **Hacktoberfest Week 4: Ghost in the Machine (Main Category)**
   - Open-source AI project embracing the Halloween spirit, featuring reactive spectral visualizers and local open-weight AI curation.
2. **Google Cloud / Gemma Track**
   - Utilizes Google's open-weight **Gemma 3 4B** model for offline natural-language crate curation and structured schema validation.
3. **Sentry Observability Track**
   - Integrated with `@sentry/react` for diagnostic telemetry and AI lifecycle breadcrumbs with strict privacy scrubbers protecting local files and prompts.
4. **SerpApi Track**
   - Integrated with SerpApi to search the Google Knowledge Graph for obscure local music tracks, paired with a transparent human-in-the-loop review interface.

---

*Thank you to DEV, GitHub, and MLH for organizing Hacktoberfest 2026!*
