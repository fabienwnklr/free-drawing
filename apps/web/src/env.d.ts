/// <reference types="vite/client" />

import type { Drawer } from '@fabwcie/free-drawing';

declare global {
  interface Window {
    /** Drawer of the page (console, end to end tests) */
    drawer: Drawer;
  }
}
