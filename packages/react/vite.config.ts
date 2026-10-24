/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// tests in this repository: sources of the library, as the demo
const lib = fileURLToPath(new URL('../free-drawing/src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@fabwcie/free-drawing': `${lib}/index.ts`,
      '@': lib,
    },
  },
  test: {
    // drawer in a DOM, canvas mocked (jsdom has no canvas)
    environment: 'jsdom',
    // one jsdom document for every test file, as the library
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
    setupFiles: ['../free-drawing/vitest.setup.ts'],
    server: { deps: { inline: ['jest-canvas-mock'] } },
  },
});
