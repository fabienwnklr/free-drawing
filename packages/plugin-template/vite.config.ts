/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// in this repository: sources of the library, as the demo (out of it, the installed package is used: no alias)
const lib = fileURLToPath(new URL('../free-drawing/src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@fabwcie/free-drawing': `${lib}/Drawer.ts`,
      '@': lib,
    },
  },
  test: {
    // drawer in a DOM, canvas mocked (jsdom has no canvas)
    environment: 'jsdom',
    threads: false,
    setupFiles: ['../free-drawing/vitest.setup.ts'],
    server: { deps: { inline: ['jest-canvas-mock'] } },
  },
});
