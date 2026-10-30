// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('Server rendering', () => {
  it('Library imported without a window (server rendering of an app): nothing read from the page when loaded', async () => {
    expect(typeof window).toBe('undefined');

    const library = await import('@/index');
    const { defaultOptions } = await import('@/constants');

    expect(typeof library.Drawer).toBe('function');
    // size of the window read when a drawer is created
    expect([defaultOptions.width, defaultOptions.height]).toEqual([0, 0]);
  });
});
