/**
 * S9.1 & S9.3: True PCM 16-Bit RIFF/WAVE Encoder
 * Encodes decoded floating-point AudioBuffer samples into standard 16-bit PCM WAV.
 * Guarantees genuine re-encoding (sample quantization and bit-packing), not extension renaming.
 */

export class WavEncoder {
  /**
   * Helper to convert any Blob (browser or jsdom) into an ArrayBuffer using standard FileReader.
   */
  static async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    if (typeof blob.arrayBuffer === 'function') {
      try {
        const buf = await blob.arrayBuffer();
        if (buf && buf.byteLength > 0) return buf;
      } catch {
        // Fall back to FileReader
      }
    }
    if (typeof FileReader !== 'undefined') {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error || new Error('FileReader failed to read Blob.'));
        reader.readAsArrayBuffer(blob);
      });
    }
    return new Response(blob).arrayBuffer();
  }

  /**
   * Encodes audio channels into a standard PCM 16-bit RIFF WAV Blob.
   * Supports either an array of Float32Array channel data or an AudioBuffer.
   */
  static encode(
    channelsDataOrBuffer: Float32Array[] | AudioBuffer,
    sampleRateOrOptions: number | { targetSampleRate?: number; targetChannels?: number } = 44100,
    numChannels: number = 2
  ): Blob {
    let channelsData: Float32Array[];
    let sampleRate: number;
    let channelCount: number;

    if (Array.isArray(channelsDataOrBuffer)) {
      channelsData = channelsDataOrBuffer;
      sampleRate = typeof sampleRateOrOptions === 'number' ? sampleRateOrOptions : 44100;
      channelCount = Math.min(numChannels, channelsData.length);
    } else {
      const audioBuffer = channelsDataOrBuffer;
      const opts = typeof sampleRateOrOptions === 'object' ? sampleRateOrOptions : {};
      sampleRate = opts.targetSampleRate || audioBuffer.sampleRate;
      const maxChannels = opts.targetChannels || audioBuffer.numberOfChannels;
      channelCount = Math.min(maxChannels, audioBuffer.numberOfChannels);
      channelsData = [];
      for (let ch = 0; ch < channelCount; ch++) {
        channelsData.push(audioBuffer.getChannelData(ch));
      }
    }

    const length = channelsData[0].length;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = channelCount * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // 1. RIFF Identifier
    WavEncoder.writeString(view, 0, 'RIFF');
    // RIFF chunk size (file length - 8)
    view.setUint32(4, 36 + dataSize, true);
    // WAVE Identifier
    WavEncoder.writeString(view, 8, 'WAVE');

    // 2. "fmt " sub-chunk
    WavEncoder.writeString(view, 12, 'fmt ');
    // Sub-chunk size: 16 for PCM
    view.setUint32(16, 16, true);
    // Audio format: 1 = PCM (uncompressed)
    view.setUint16(20, 1, true);
    // Number of channels
    view.setUint16(22, channelCount, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate = sampleRate * channelCount * (bitsPerSample / 8)
    view.setUint32(28, byteRate, true);
    // Block align = channelCount * (bitsPerSample / 8)
    view.setUint16(32, blockAlign, true);
    // Bits per sample
    view.setUint16(34, bitsPerSample, true);

    // 3. "data" sub-chunk
    WavEncoder.writeString(view, 36, 'data');
    // Data size
    view.setUint32(40, dataSize, true);

    // 4. Interleave PCM samples and quantize Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < channelCount; ch++) {
        const sample = Math.max(-1, Math.min(1, channelsData[ch][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([new Uint8Array(buffer)], { type: 'audio/wav' });
  }

  /**
   * Helper to write ASCII strings to DataView.
   */
  private static writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Validates if a Blob contains a valid RIFF/WAVE header.
   */
  static async validateWavBlob(
    blob: Blob
  ): Promise<{
    isValid: boolean;
    sampleRate?: number;
    channels?: number;
    bitsPerSample?: number;
    durationSeconds?: number;
    error?: string;
  }> {
    if (blob.size < 44) {
      return { isValid: false, error: 'File size is smaller than 44-byte RIFF header.' };
    }

    const slice = await WavEncoder.blobToArrayBuffer(blob.slice(0, 44));
    const view = new DataView(slice);

    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    const fmt = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));

    if (riff !== 'RIFF' || wave !== 'WAVE' || fmt !== 'fmt ') {
      return { isValid: false, error: 'Invalid magic bytes: missing RIFF/WAVE header.' };
    }

    const channels = view.getUint16(22, true);
    const sampleRate = view.getUint32(24, true);
    const bitsPerSample = view.getUint16(34, true);
    const dataSize = blob.size - 44;
    const durationSeconds =
      sampleRate > 0 && channels > 0 && bitsPerSample > 0
        ? dataSize / (sampleRate * channels * (bitsPerSample / 8))
        : 0;

    return {
      isValid: true,
      channels,
      sampleRate,
      bitsPerSample,
      durationSeconds,
    };
  }
}
