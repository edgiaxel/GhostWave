import { describe, it, expect } from 'vitest';
import { WavEncoder } from '../services/conversion/WavEncoder';
import { AudioConversionService } from '../services/conversion/AudioConversionService';
import { Track } from '../types';

const MOCK_SOURCE_TRACK: Track = {
  id: 'source-track-1',
  title: 'Synth Atmosphere',
  artist: 'Ghost Wave',
  album: 'Spectral Sounds',
  genre: ['Electronic'],
  durationSeconds: 10,
  format: 'mp3',
  bitrateKbps: 320,
  year: 2024,
  filePath: '/music/synth_atmosphere.mp3',
  fileName: 'synth_atmosphere.mp3',
  fileSizeBytes: 400000,
  lastModified: Date.now(),
  addedAt: Date.now(),
  availability: 'available',
  hasEmbeddedPicture: false,
};

describe('S9: Audio Conversion Suite', () => {
  describe('S9.1 — Engine specification and format boundaries', () => {
    it('defines supported input and output formats explicitly', () => {
      const inputs = AudioConversionService.getSupportedInputFormats();
      expect(inputs).toContain('mp3');
      expect(inputs).toContain('flac');
      expect(inputs).toContain('wav');
      expect(inputs).toContain('ogg');
      expect(inputs).toContain('m4a');
      expect(inputs).toContain('aac');

      const outputs = AudioConversionService.getSupportedOutputFormats();
      expect(outputs).toContain('wav');
      expect(outputs).toContain('ogg');
    });

    it('builds non-destructive output filenames with _converted suffix', () => {
      const out1 = AudioConversionService.buildOutputFileName('track1.flac', 'wav');
      expect(out1).toBe('track1_converted.wav');

      const out2 = AudioConversionService.buildOutputFileName('audio.song.mp3', 'ogg');
      expect(out2).toBe('audio.song_converted.ogg');
    });

    it('detects filename collisions against existing library files and generates safe alternate', () => {
      const existing = ['track1_converted.wav', 'track1_converted_1.wav'];
      const result = AudioConversionService.detectCollision('track1_converted.wav', existing);

      expect(result.collides).toBe(true);
      expect(result.safeFileName).toBe('track1_converted_2.wav');

      const nonColliding = AudioConversionService.detectCollision('unique_track_converted.wav', existing);
      expect(nonColliding.collides).toBe(false);
      expect(nonColliding.safeFileName).toBe('unique_track_converted.wav');
    });
  });

  describe('S9.2 — WavEncoder RIFF Header & Genuine PCM Quantization', () => {
    it('generates a valid 44-byte RIFF/WAVE header and re-encodes Float32 audio samples', async () => {
      // Create mock audio buffer data: 2 channels, 44100Hz, 1 second (44100 samples)
      const sampleRate = 44100;
      const numChannels = 2;
      const length = 44100;
      const leftChannel = new Float32Array(length);
      const rightChannel = new Float32Array(length);

      // Generate a 440Hz sine wave tone into channel data
      for (let i = 0; i < length; i++) {
        leftChannel[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
        rightChannel[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
      }

      const mockAudioBuffer = {
        numberOfChannels: numChannels,
        sampleRate,
        length,
        duration: 1.0,
        getChannelData: (ch: number) => (ch === 0 ? leftChannel : rightChannel),
      } as unknown as AudioBuffer;

      const wavBlob = WavEncoder.encode(mockAudioBuffer, {
        targetSampleRate: 44100,
        targetChannels: 2,
      });

      expect(wavBlob).toBeInstanceOf(Blob);
      expect(wavBlob.type).toBe('audio/wav');

      // Verify exact byte length: 44 byte header + 44100 samples * 2 channels * 2 bytes/sample (16-bit)
      const expectedSize = 44 + 44100 * 2 * 2;
      expect(wavBlob.size).toBe(expectedSize);

      // Inspect binary RIFF header
      const buffer = await WavEncoder.blobToArrayBuffer(wavBlob);
      const view = new DataView(buffer);

      // Byte 0-3: 'RIFF'
      const riffHeader = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      expect(riffHeader).toBe('RIFF');

      // Byte 8-11: 'WAVE'
      const waveHeader = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
      expect(waveHeader).toBe('WAVE');

      // Byte 12-15: 'fmt '
      const fmtHeader = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
      expect(fmtHeader).toBe('fmt ');

      // Byte 20-21: Audio format 1 (PCM uncompressed)
      expect(view.getUint16(20, true)).toBe(1);

      // Byte 22-23: Channels (2)
      expect(view.getUint16(22, true)).toBe(2);

      // Byte 24-27: Sample Rate (44100)
      expect(view.getUint32(24, true)).toBe(44100);

      // Byte 34-35: Bits per sample (16)
      expect(view.getUint16(34, true)).toBe(16);

      // Byte 36-39: 'data'
      const dataHeader = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
      expect(dataHeader).toBe('data');

      // Validate via WavEncoder.validateWavBlob
      const validation = await WavEncoder.validateWavBlob(wavBlob);
      expect(validation.isValid).toBe(true);
      expect(validation.channels).toBe(2);
      expect(validation.sampleRate).toBe(44100);
      expect(validation.bitsPerSample).toBe(16);
      expect(validation.durationSeconds).toBeCloseTo(1.0, 1);
    });

    it('rejects invalid non-RIFF blobs during validation', async () => {
      const invalidBlob = new Blob(['not an audio file at all'], { type: 'audio/wav' });
      const validation = await WavEncoder.validateWavBlob(invalidBlob);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('RIFF');
    });
  });

  describe('S9.3 — Validation & non-destructive batch conversion', () => {
    it('creates a converted track entity with metadata preserved and original untouched', () => {
      const convertedEntity = AudioConversionService.buildConvertedTrackEntity(
        MOCK_SOURCE_TRACK,
        'synth_atmosphere_converted.wav',
        'blob:http://localhost:5173/mock-uuid',
        176444, // size
        10 // duration
      );

      // Invariants: original untouched
      expect(MOCK_SOURCE_TRACK.format).toBe('mp3');
      expect(MOCK_SOURCE_TRACK.fileName).toBe('synth_atmosphere.mp3');

      // Converted track inherits tags but has distinct format and id
      expect(convertedEntity.id).toContain('trk-conv-');
      expect(convertedEntity.title).toBe(MOCK_SOURCE_TRACK.title);
      expect(convertedEntity.artist).toBe(MOCK_SOURCE_TRACK.artist);
      expect(convertedEntity.album).toBe(MOCK_SOURCE_TRACK.album);
      expect(convertedEntity.format).toBe('wav');
      expect(convertedEntity.fileName).toBe('synth_atmosphere_converted.wav');
      expect(convertedEntity.fileSizeBytes).toBe(176444);
    });
  });
});
