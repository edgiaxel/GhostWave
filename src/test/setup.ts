import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock URL.createObjectURL and URL.revokeObjectURL for Vitest/jsdom
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = (_blob: Blob | MediaSource): string => {
    return `blob:http://localhost:5173/${Math.random().toString(36).substring(2, 9)}`;
  };
}

if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = (): void => {};
}

// Mock HTMLMediaElement prototype methods for audio playback in jsdom
if (typeof window !== 'undefined' && typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = async function (): Promise<void> {
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function (): void {
    this.dispatchEvent(new Event('pause'));
  };
  HTMLMediaElement.prototype.load = function (): void {};
}

// Mock Web Audio API for jsdom
if (typeof window !== 'undefined' && !window.AudioContext) {
  (window as unknown as { AudioContext: unknown }).AudioContext = class MockAudioContext {
    state = 'running';
    destination = {};
    createAnalyser() {
      return {
        fftSize: 2048,
        frequencyBinCount: 1024,
        connect: () => {},
        disconnect: () => {},
        getByteFrequencyData: (arr: Uint8Array) => {
          arr.fill(128);
        },
      };
    }
    createMediaElementSource() {
      return {
        connect: () => {},
        disconnect: () => {},
      };
    }
    resume = async () => {
      this.state = 'running';
    };
    close = async () => {
      this.state = 'closed';
    };
  };
}

// Mock requestAnimationFrame & cancelAnimationFrame for Vitest/jsdom
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = (() => {
  return {
    fillRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
