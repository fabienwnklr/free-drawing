import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// library sources: changes shown at once, `@/` imports of library resolved
const lib = fileURLToPath(new URL('../../packages/free-drawing/src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@fabwcie/free-drawing': `${lib}/index.ts`,
      '@': lib,
    },
  },
});
