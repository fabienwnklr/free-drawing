import { defineConfig } from 'vitest/config';

// tests of the command only (not the generated packages of check:generated, nor the copied template)
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
  },
});
