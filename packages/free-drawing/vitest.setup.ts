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

// tests of a page (jsdom): canvas of jsdom mocked; tests of a server (`@vitest-environment node`) have no window
if (typeof window !== 'undefined') {
  const canvasWindow = getCanvasWindow({ document: window.document });

  apis.forEach((api) => {
    global[api] = canvasWindow[api];
    global.window[api] = canvasWindow[api];
    global.Blob = Blob;
  });
}

// drawers of the test file destroyed: their memory and listeners of the page are not kept for the next files
afterAll(async () => {
  if (typeof window === 'undefined') return;
  // imported once canvas mocks are set
  const { drawers } = await import('./tests/helpers');

  for (const drawer of drawers) await drawer.destroy();
  drawers.clear();
});
