import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// library sources: changes shown at once, `@/` imports of library resolved
const lib = fileURLToPath(new URL('../../packages/free-drawing/src', import.meta.url));
// extra tools (shapes, highlighter): sources too
const extraTools = fileURLToPath(new URL('../../packages/extra-tools/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@fabwcie/free-drawing-extra-tools': extraTools,
      '@fabwcie/free-drawing': `${lib}/index.ts`,
      '@': lib,
    },
  },
});
