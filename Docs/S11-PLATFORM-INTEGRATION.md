# S11 — Platform Integration & Target Deployment

## 1. Web Readiness & Architecture

GhostWave is built as a single-page client-first application designed to operate with zero server dependencies in the core path.

### 1.1 Web Capabilities & Storage
- **Persistence:** Local library metadata, user playlists, playback history, audio visualizer presets, and AI cache persist locally in browser IndexedDB (Database `ghostwave_db`, version 4).
- **Audio Decoding & Playback:** Native Web Audio API and HTML5 `<audio>` element with object URLs (`blob:`) created via `URL.createObjectURL(file)`.
- **Audio Metadata Extraction:** Clean in-browser parsing using `music-metadata-browser` reading standard ID3v1, ID3v2.3/2.4, Vorbis, and MP4 atoms directly from file ArrayBuffers.
- **Audio Conversion:** Web Audio API offline rendering pipeline with clean PCM WAV encoding.

### 1.2 Browser Sandbox Limitations
- **In-Place File Tag Modification:** Web browsers strictly prohibit overwriting arbitrary local filesystem tracks in place without explicit per-file user save prompts. The web platform adapter (`WebFilePlatform`) marks `canWriteMetadata() = false`.
- **File Access Lifecycle:** Object URLs created for dropped or selected files remain valid for the current tab session; browser page reloads require file references or cached audio blobs.
- **Offline / Core Mode:** When internet access and AI runtimes (Ollama/Gemini) are unavailable, GhostWave automatically switches to Core Mode: deterministic recommendations, local IndexedDB library management, local waveform visualizer, and local conversion operate without degradation.

---

## 2. Tauri 2 Desktop Shell Integration

GhostWave integrates Tauri 2 (`@tauri-apps/api`, `tauri-plugin-dialog`, `tauri-plugin-fs`) to provide native desktop performance while retaining the shared React TypeScript frontend.

### 2.1 File & Directory Scoping
Filesystem access is scoped narrowly via Tauri 2 capabilities (`src-tauri/capabilities/default.json`):
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "GhostWave default capability scoping filesystem access to user music and download folders",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$MUSIC/**" },
        { "path": "$DOWNLOAD/**" },
        { "path": "$DESKTOP/**" }
      ]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [
        { "path": "$MUSIC/**" }
      ]
    }
  ]
}
```

### 2.2 Native Audio Protocols
- In the desktop shell, files are addressed via Tauri's high-performance native asset protocol (`asset://localhost/<path>`), eliminating large memory overhead from browser blob duplications.
- The platform adapter `TauriFilePlatform` encapsulates path-to-asset translation transparently for `<audio>` elements.

### 2.3 Local AI Runtime Connectivity
- Desktop and web frontends communicate with local AI endpoints (Ollama at `http://localhost:11434`) via CORS-configured fetch requests permitted under Tauri's Content Security Policy:
  `connect-src 'self' http://localhost:11434 http://127.0.0.1:11434 https://generativelanguage.googleapis.com`

---

## 3. Verified Platform Test Matrix

| Platform | Target Status | Verification Details | Known Limitations / Notes |
| :--- | :--- | :--- | :--- |
| **Linux (Web)** | **Verified** | Built and tested with Vite 6, TypeScript 5.7, Vitest on Linux x86_64. | In-place file tagging restricted by browser sandbox; relies on downloads. |
| **Linux (Tauri Desktop)** | **Scaffolded** | Tauri 2 configuration, capabilities, and Rust crates authored. | Requires system `cargo` and `rustc` toolchain to compile binary package. |
| **Windows (x64)** | **Documented** | Configuration targets Windows 10/11 x64; MSVC build chain documented. | Not compiled on current Linux host. Support not inferred without native build. |
| **macOS (Apple Silicon / Intel)** | **Documented** | Tauri bundle configuration supports `.icns` and universal targets. | Requires macOS Xcode command-line tools for packaging. |
