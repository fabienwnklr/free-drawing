/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';

// library build and tests (demo site: apps/web)
export default defineConfig({
  build: {
    cssMinify: true,
    minify: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/Drawer.ts'),
      name: 'Drawer', // for iife and umd
      // the proper extensions will be added
      fileName: 'drawer',
      // formats used by package.json exports (import / require)
      formats: ['es', 'umd'],
    },
    rollupOptions: {
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
    dts({
      insertTypesEntry: true,
      rollupTypes: true, // comment if you won't to merge all declarations into one file
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    server: {
      deps: {
        inline: ['jest-canvas-mock'],
      },
    },
    environment: 'jsdom',
    threads: false,
    // every test file in one process (one jsdom document): its memory grows with the drawers of the tests, which are
    // never destroyed, over the 4 GB of the heap of node (crash with code 134)
    env: { NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=8192'].filter(Boolean).join(' ') },
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
