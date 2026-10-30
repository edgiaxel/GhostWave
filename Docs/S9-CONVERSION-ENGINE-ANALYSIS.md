# S9: Audio Conversion Engine Architecture & Licensing Analysis

## 1. Engine Comparison: Web Audio API vs Desktop FFmpeg Bridge

| Dimension | Web Audio API (In-Browser Pure Client) | Desktop FFmpeg Subprocess / Shared Library |
| :--- | :--- | :--- |
| **Execution Environment** | Client browser engine (Web Audio + Web Workers) | Tauri Native Subprocess (`std::process::Command` / sidecar) |
| **Dependencies** | Zero external dependencies; 100% self-contained | Requires bundling or detecting external `ffmpeg` binary |
| **Performance** | Hardware-accelerated PCM decoding (~10x real-time) | Multi-threaded native transcoding (~30x-50x real-time) |
| **Codec Breadth** | Decodes MP3, FLAC, WAV, AAC, OGG. Encodes lossless WAV/PCM | Transcodes between virtually all known audio codecs |
| **Filesystem Safety** | Pure memory / Blob / File System Access API; zero silent overwrite | File path sandboxing in Tauri; explicit destination path |
| **Security & Sandbox** | Runs entirely within browser security boundary; zero shell access | Requires narrow scoping of Tauri IPC and path permissions |

## 2. Licensing & Distribution Review

### Web Audio API + Pure TypeScript RIFF/WAVE Encoder
- **Licensing:** MIT License.
- **Distribution:** Safe for web hosting (Render, Vercel, Netlify) and desktop bundling.
- **Patent / Royalty Risk:** Zero. Uses standard W3C Web Audio API and uncompressed PCM RIFF specifications.

### Desktop FFmpeg Integration
- **Licensing Nuance:**
  - FFmpeg is licensed under the **LGPL v2.1+** (or **GPL v2+** if configured with `--enable-gpl` for libx264/libx265).
  - Audio codecs (libmp3lame, libvorbis, libopus, flac) fall under LGPL when GPL flags are disabled.
  - In a Tauri desktop application:
    1. If distributing as a dynamic link library (`.dll`, `.so`, `.dylib`) or standalone executable sidecar under LGPL, the user must be permitted to replace the FFmpeg library.
    2. Static linking requires releasing object files or full application source under compatible terms.
- **Architectural Decision for GhostWave:**
  - **Tier 1 (Web & Desktop Baseline):** Native Web Audio API + `WavEncoder` is the primary built-in conversion engine. Works 100% offline, zero install, cross-platform without licensing complications.
  - **Tier 2 (Desktop Stretch):** Tauri desktop shell can detect an optional system-installed FFmpeg binary for extended formats (`ffmpeg -i input.flac -c:a libmp3lame -b:a 320k output.mp3`) without embedding GPL binaries into the package.

## 3. Explicitly Supported Formats & Conversion Options

### Input Formats (Decodable)
- `mp3` (MPEG Layer III)
- `flac` (Free Lossless Audio Codec)
- `wav` (PCM uncompressed)
- `ogg` (Ogg Vorbis / Opus)
- `m4a` / `aac` (Advanced Audio Coding)

### Output Formats (Encodable)
- **`wav` (16-bit PCM RIFF Lossless)**: Universal compatibility, zero compression artifacts, guaranteed playback on all target platforms.
- **`ogg` / `webm`**: Browser-supported compressed stream containers.

### Target Quality Options
- **Sample Rate:** `44,100 Hz` (CD standard), `48,000 Hz` (Studio / Video standard).
- **Channels:** `Stereo (2 channels)`, `Mono (1 channel)`.
- **Bit Depth:** `16-bit signed PCM integer` (clamped and scaled from Float32).

## 4. Invariant Safeguards
1. **Non-Destructive Guarantee:** Original files are never modified, overwritten, or deleted.
2. **Explicit Destination Naming:** Output defaults to `{filename}_converted.{ext}` with live collision warnings.
3. **Genuine Re-encoding:** Input audio is decoded to PCM samples and re-quantized; changing the file extension is strictly disallowed as a conversion mechanism.
4. **Failure Isolation:** In batch conversions, failure on one corrupted track does not halt conversion of remaining files.
