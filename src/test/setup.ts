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
