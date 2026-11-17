// Vitest test setup
// Extend Vitest's expect matchers or set up globals if needed
import '@testing-library/jest-dom';

// ResizeObserver polyfill for jsdom (needed by Recharts)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// URL.createObjectURL polyfill for jsdom
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = () => 'blob:mock-url';
  global.URL.revokeObjectURL = () => {};
}

// HTMLCanvasElement.getContext polyfill
if (typeof HTMLCanvasElement.prototype.getContext === 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: () => {},
    toBlob: (cb: Function) => cb(new Blob(['mock'])),
  } as any);
}