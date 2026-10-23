import { afterAll, vi } from 'vitest';

vi.hoisted(() => {
  global.jest = vi;
});
import getCanvasWindow from 'jest-canvas-mock/lib/window';
const apis = [
  'Path2D',
  'CanvasGradient',
  'CanvasPattern',
  'CanvasRenderingContext2D',
  'DOMMatrix',
  'ImageData',
  'TextMetrics',
  'ImageBitmap',
  'createImageBitmap',
] as const;

const canvasWindow = getCanvasWindow({ document: window.document });

apis.forEach((api) => {
  global[api] = canvasWindow[api];
  global.window[api] = canvasWindow[api];
  global.Blob = Blob;
});

// drawers of the test file destroyed: their memory and listeners of the page are not kept for the next files
afterAll(async () => {
  // imported once canvas mocks are set
  const { drawers } = await import('./tests/helpers');

  for (const drawer of drawers) await drawer.destroy();
  drawers.clear();
});
