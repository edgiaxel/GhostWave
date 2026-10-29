import '@testing-library/jest-dom';

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
