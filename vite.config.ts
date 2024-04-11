/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  if (mode === 'static') {
    // Build static web site for sample
    return {
      build: {
        outDir: './static',
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
        },
      },
    };
  } else {
    return {
      build: {
        cssMinify: true,
        minify: true,
        lib: {
          // Could also be a dictionary or array of multiple entry points
          entry: resolve(__dirname, 'src/Drawer.ts'),
          name: 'Drawer', // for iife and umd
          // the proper extensions will be added
          fileName: 'drawer',
          formats: ['iife', 'cjs', 'es', 'umd'],
        },
        rollupOptions: {
          external: ['konva', 'perfectFreehand'],
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
      server: {
        open: process.env.NODE_ENV !== 'test',
      },
      test: {
        server: {
          deps: {
            inline: ['jest-canvas-mock'],
          },
        },
        environment: 'jsdom',
        threads: false,
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
    };
  }
});
