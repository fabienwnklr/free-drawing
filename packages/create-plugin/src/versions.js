// @ts-check

/**
 * Versions of the dependencies of a generated plugin: the library (plugin API with options since 7.19.0) and the
 * tools its tests are run with in the repository of the library (tests check they stay the same)
 */
export const versions = {
  /** @fabwcie/free-drawing: plugins, `getOptions`, `getPointerPosition` */
  library: '^7.19.0',
  /** Konva, peer dependency of the library */
  konva: '^10.9.0',
  /** TypeScript */
  typescript: '^5.9.3',
  /** Vitest */
  vitest: '^5.0.5',
  /** Vite, required by Vitest */
  vite: '^8.3.5',
  /** DOM of tests */
  jsdom: '^29.1.1',
  /** Canvas of tests (jsdom has none) */
  jestCanvasMock: '^2.5.2',
};
