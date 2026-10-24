/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import dts from 'unplugin-dts/vite';

// folder of this config (no __dirname for the native config loader of Vite, import.meta.dirname untyped by the
// @types/node of the repository)
const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// library build and tests (demo site: apps/web)
export default defineConfig({
  build: {
    // browsers supported by previous versions (default target of Vite 4): private fields, ??= lowered
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    cssMinify: true,
    minify: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: root('./src/index.ts'),
      name: 'Drawer', // for iife and umd
      // the proper extensions will be added
      fileName: 'drawer',
      // style sheet imported by apps as '@fabwcie/free-drawing/style.css' (named after fileName since Vite 6)
      cssFileName: 'style',
      // formats used by package.json exports (import / require)
      formats: ['es', 'umd'],
    },
    rolldownOptions: {
      // installed with the package (konva as peer dependency), imported with subpaths (konva/lib/...)
      external: [/^konva(\/|$)/, 'perfect-freehand', 'socket.io-client', 'uqr'],
      output: {
        // umd global names
        globals: (id: string) => {
          if (id.startsWith('konva')) return 'Konva';
          if (id === 'socket.io-client') return 'io';
          if (id === 'uqr') return 'uqr';
          return 'PerfectFreehand';
        },
      },
    },
  },
  plugins: [
    // one declaration file (index.d.ts) for the entry, bundled by api-extractor
    dts({
      insertTypesEntry: true,
      bundleTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': root('./src'),
    },
  },
  test: {
    server: {
      deps: {
        inline: ['jest-canvas-mock'],
      },
    },
    environment: 'jsdom',
    // every test file in one process, one after the other, in one jsdom document (as `threads: false` of Vitest 0.34)
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
    // its memory grows with the tests (drawers of `createDrawer` destroyed after each file, see vitest.setup.ts):
    // margin over the 4 GB of the heap of node (crash with code 134)
    execArgv: ['--max-old-space-size=8192'],
    // calls of mocks kept between tests (default of Vitest 5: cleared)
    clearMocks: false,
    setupFiles: ['./vitest.setup.ts'],
    // For this config, check https://github.com/vitest-dev/vitest/issues/740
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/e2e/**',
    ],
  },
});
