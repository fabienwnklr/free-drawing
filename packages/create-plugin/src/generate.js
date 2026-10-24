// @ts-check
import { versions } from './versions.js';

/**
 * @typedef {import('./questions.js').Answers} Answers
 * @typedef {Map<string, string>} Files contents of files by path in the package (`/` separators)
 */

/** Guide of plugins */
export const guideUrl = 'https://free-drawing-docs.netlify.app/plugins';

/** Default background color of the shapes of a plugin */
const defaultColor = '#ffec99';

/** Default size of the shapes of a plugin, in drawing units */
const defaultSize = 80;

/**
 * Lines joined, parts left out with `false`, `null` or `undefined`
 * @param {(string | false | null | undefined)[]} parts lines or blocks of lines
 * @returns {string} text ending with a line break
 */
export function lines(...parts) {
  return `${parts.filter((part) => typeof part === 'string').join('\n')}\n`;
}

/**
 * String literal of TypeScript, in single quotes
 * @param {string} text any text (name given by the developer)
 * @returns {string} literal
 */
export function quote(text) {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Texts of a generated plugin by language (English always)
 * @param {Answers} answers answers
 * @returns {Record<string, Record<string, string>>} texts by language, by key
 */
export function getTexts({ names: { title, camel }, toolId, tool, command, header, languages }) {
  /** @type {Record<string, [string, string, string]>} name of shapes, command, counter by language */
  const texts = {
    en: [title, `${title}: add in the middle`, `${title}: {count}`],
    fr: [title, `${title} : ajouter au milieu`, `${title} : {count}`],
    es: [title, `${title}: añadir en el centro`, `${title}: {count}`],
    de: [title, `${title}: in der Mitte hinzufügen`, `${title}: {count}`],
  };

  return Object.fromEntries(
    ['en', ...languages].map((language) => {
      const [name, add, count] = texts[language];
      /** @type {Record<string, string>} */
      const byKey = { [`${camel}.name`]: name };

      if (tool !== 'none') byKey[`tools.${toolId}`] = name;
      if (command) byKey[`${camel}.add`] = add;
      if (header) byKey[`${camel}.count`] = count;

      return [language, byKey];
    })
  );
}

/**
 * Files of the package common to both starts: package.json, TypeScript configs, tests setup, .gitignore
 * @param {Answers} answers answers
 * @returns {Files} files
 */
export function packageFiles(answers) {
  const { packageName, names, css, tests } = answers;
  const copyCss = `node -e "require('fs').copyFileSync('src/style.css', 'dist/style.css')"`;
  const pkg = {
    name: packageName,
    version: '0.1.0',
    description: `${names.title} plugin of free-drawing`,
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
      ...(css ? { './style.css': './dist/style.css' } : {}),
    },
    files: ['dist'],
    keywords: ['free-drawing', 'free-drawing-plugin'],
    scripts: {
      build: `tsc -p tsconfig.build.json${css ? ` && ${copyCss}` : ''}`,
      typecheck: 'tsc -p .',
      ...(tests ? { test: 'vitest run' } : {}),
      prepublishOnly: 'npm run build',
    },
    peerDependencies: { '@fabwcie/free-drawing': versions.library, konva: versions.konva },
    devDependencies: {
      '@fabwcie/free-drawing': versions.library,
      ...(tests ? { 'jest-canvas-mock': versions.jestCanvasMock, jsdom: versions.jsdom } : {}),
      konva: versions.konva,
      typescript: versions.typescript,
      ...(tests ? { vite: versions.vite, vitest: versions.vitest } : {}),
    },
  };
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      strict: true,
      skipLibCheck: true,
      isolatedModules: true,
      noUnusedLocals: true,
      useDefineForClassFields: true,
      noEmit: true,
    },
    include: tests ? ['src', 'tests'] : ['src'],
  };
  const tsconfigBuild = {
    extends: './tsconfig.json',
    compilerOptions: { noEmit: false, declaration: true, outDir: 'dist', rootDir: 'src' },
    include: ['src'],
  };
  /** @type {Files} */
  const files = new Map([
    ['package.json', `${JSON.stringify(pkg, null, 2)}\n`],
    ['tsconfig.json', `${JSON.stringify(tsconfig, null, 2)}\n`],
    ['tsconfig.build.json', `${JSON.stringify(tsconfigBuild, null, 2)}\n`],
    ['.gitignore', lines('node_modules', 'dist')],
  ]);

  if (tests) {
    files.set(
      'vitest.config.ts',
      lines(
        "import { defineConfig } from 'vitest/config';",
        '',
        'export default defineConfig({',
        '  test: {',
        '    // drawer in a DOM, canvas of jest-canvas-mock (jsdom has none)',
        "    environment: 'jsdom',",
        "    setupFiles: ['./vitest.setup.ts'],",
        "    server: { deps: { inline: ['jest-canvas-mock'] } },",
        '  },',
        '});'
      )
    );
    files.set(
      'vitest.setup.ts',
      lines(
        '// Canvas APIs for Konva in jsdom (it has no canvas), from jest-canvas-mock',
        "import { vi } from 'vitest';",
        '',
        'vi.hoisted(() => {',
        '  // jest-canvas-mock expects the global `jest`',
        '  (globalThis as Record<string, unknown>).jest = vi;',
        '});',
        "import getCanvasWindow from 'jest-canvas-mock/lib/window';",
        '',
        'const apis = [',
        "  'Path2D',",
        "  'CanvasGradient',",
        "  'CanvasPattern',",
        "  'CanvasRenderingContext2D',",
        "  'DOMMatrix',",
        "  'ImageData',",
        "  'TextMetrics',",
        "  'ImageBitmap',",
        "  'createImageBitmap',",
        '];',
        'const canvasWindow = getCanvasWindow({ document: window.document });',
        '',
        'for (const api of apis) {',
        '  (globalThis as Record<string, unknown>)[api] = canvasWindow[api];',
        '}'
      )
    );
  }

  return files;
}

/**
 * README of the package: install, use, parts of the plugin, development
 * @param {Answers} answers answers
 * @param {string[]} parts parts of the plugin (list items)
 * @returns {string} markdown
 */
export function readme({ packageName, names, css, options, start }, parts) {
  return lines(
    `# ${names.title}`,
    '',
    `${
      names.title
    } plugin of [free-drawing](https://github.com/fabienwnklr/free-drawing), created with \`@fabwcie/create-free-drawing-plugin\`${
      start === 'template' ? ' from the complete template (stamps, to adapt)' : ''
    }.`,
    '',
    '## Install',
    '',
    '```bash',
    `npm install ${packageName} @fabwcie/free-drawing konva`,
    '```',
    '',
    '## Use',
    '',
    '```js',
    "import { Drawer } from '@fabwcie/free-drawing';",
    "import '@fabwcie/free-drawing/style.css';",
    `import { ${names.pascal}Plugin } from '${packageName}';`,
    css && `import '${packageName}/style.css';`,
    '',
    "const drawer = new Drawer(document.getElementById('drawer'), {",
    `  plugins: [${names.pascal}Plugin],`,
    options && start === 'custom' && `  pluginOptions: { ${names.pascal}: { color: '#a5d8ff', size: 120 } },`,
    options && start === 'template' && `  pluginOptions: { ${names.pascal}: { max: 20 } },`,
    '});',
    '```',
    '',
    ...parts,
    '',
    '## Develop',
    '',
    '- `npm run typecheck`: type check;',
    '- `npm test`: tests (Vitest, drawer in jsdom);',
    `- \`npm run build\`: \`dist/\` (JavaScript, types${css ? ', style.css' : ''});`,
    '- `npm publish`: builds then publishes the package.',
    '',
    `The [plugins guide](${guideUrl}) explains each part of a plugin.`
  );
}

/**
 * Files of a plugin built from the answers
 * @param {Answers} answers answers
 * @returns {Files} files of the package
 */
export function generate(answers) {
  const files = packageFiles(answers);
  const { names, tool, css, tests } = answers;

  files.set('src/index.ts', indexFile(answers));
  files.set('src/constants.ts', constantsFile(answers));
  files.set(`src/${names.pascal}Plugin.ts`, pluginFile(answers));
  files.set('src/translations.ts', translationsFile(answers));
  files.set('src/icons.ts', iconsFile());
  if (answers.options) files.set('src/types.ts', typesFile(answers));
  if (tool !== 'none') files.set(`src/${names.pascal}Widget.ts`, widgetFile(answers));
  if (css) files.set('src/style.css', styleFile(answers));
  if (tests) files.set(`tests/${names.kebab}.test.ts`, testFile(answers));
  files.set('README.md', readme(answers, readmeParts(answers)));

  return files;
}

/**
 * Parts of the plugin in its README
 * @param {Answers} answers answers
 * @returns {string[]} markdown lines
 */
function readmeParts({ names, tool, toolId, toolShortcut, command, commandShortcut, contextMenu, options, header }) {
  return [
    '## Parts',
    '',
    tool === 'click' &&
      `- Tool \`${toolId}\`${
        toolShortcut ? ` (${toolShortcut.toUpperCase()})` : ''
      }: a click adds a shape under the pointer.`,
    tool === 'shape' &&
      `- Tool \`${toolId}\`${
        toolShortcut ? ` (${toolShortcut.toUpperCase()})` : ''
      }: a shape drawn in the dragged box.`,
    command &&
      `- Command "${names.title}: add in the middle": command palette${commandShortcut ? `, ${commandShortcut}` : ''}${
        contextMenu ? ', context menu of the drawing' : ''
      }.`,
    header && '- Button of the header: number of shapes of the plugin.',
    options && `- Options (\`pluginOptions.${names.pascal}\`): \`color\` (background), \`size\` (in drawing units).`,
    `- Texts: \`${names.camel}.*\` keys, replaceable with the \`translations\` option of the drawer.`,
  ].filter((line) => typeof line === 'string');
}

/**
 * Entry of the package
 * @param {Answers} answers answers
 * @returns {string} source
 */
function indexFile({ packageName, names, tool, options, css }) {
  return lines(
    '// Entry of the package: what apps import',
    `// import { ${names.pascal}Plugin } from '${packageName}';`,
    css && `// import '${packageName}/style.css';`,
    `// new Drawer($el, { plugins: [${names.pascal}Plugin] });`,
    `export { ${names.pascal}Plugin } from './${names.pascal}Plugin.js';`,
    tool !== 'none' && `export { ${names.pascal}Widget } from './${names.pascal}Widget.js';`,
    `export { ${names.camel}Name } from './constants.js';`,
    "export { translations } from './translations.js';",
    options && `export type { ${names.pascal}Options } from './types.js';`
  );
}

/**
 * Constants of the plugin: name of its shapes, default style
 * @param {Answers} answers answers
 * @returns {string} source
 */
function constantsFile({ names }) {
  return lines(
    '/**',
    ' * Name marking the shapes of the plugin, next to a name of the library (`shapeName.rect`) which keeps their',
    ' * behavior: selection, options panel, export',
    ' */',
    `export const ${names.camel}Name = ${quote(names.kebab)};`,
    '',
    '/** Default background color of the shapes of the plugin */',
    `export const defaultColor = ${quote(defaultColor)};`,
    '',
    '/** Default size of the shapes of the plugin, in drawing units */',
    `export const defaultSize = ${defaultSize};`
  );
}

/**
 * Options type of the plugin
 * @param {Answers} answers answers
 * @returns {string} source
 */
function typesFile({ names }) {
  return lines(
    '/**',
    ' * Options of the plugin, given by the app with the `pluginOptions` option of the drawer:',
    ` * \`pluginOptions: { ${names.pascal}: { color: '#a5d8ff' } }\``,
    ' */',
    `export type ${names.pascal}Options = {`,
    '  /** Background color of its shapes */',
    '  color: string;',
    '  /** Size of its shapes added by a click or a command, in drawing units */',
    '  size: number;',
    '};'
  );
}

/**
 * Texts of the plugin
 * @param {Answers} answers answers
 * @returns {string} source
 */
function translationsFile(answers) {
  const texts = getTexts(answers);

  return lines(
    "import type { PluginTranslations } from '@fabwcie/free-drawing';",
    '',
    '/**',
    ` * Texts of the plugin by language: keys prefixed with \`${answers.names.camel}.\`, \`tools.<id>\` gives the title of a tool.`,
    ' * Missing languages use English, the `translations` option of the drawer can replace any text',
    ' */',
    'export const translations: PluginTranslations = {',
    ...Object.entries(texts).flatMap(([language, byKey]) => [
      `  ${language}: {`,
      ...Object.entries(byKey).map(([key, text]) => `    ${quote(key)}: ${quote(text)},`),
      '  },',
    ]),
    '};'
  );
}

/**
 * Icon of the tool and of the command
 * @returns {string} source
 */
function iconsFile() {
  return lines(
    '// Icons: svg markup hidden to assistive technologies (buttons are named by their title), colored by `currentColor`',
    '',
    '/** Icon of the plugin: square with a plus */',
    'export const pluginIcon = `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>`;'
  );
}

/**
 * Style sheet of the plugin
 * @param {Answers} answers answers
 * @returns {string} css
 */
function styleFile({ names, header, packageName }) {
  return lines(
    '/* Styles of the plugin: every rule under .drawer-container (nothing applies to the page), colors of the theme of',
    `   the drawer (--drawer-* custom properties, light and dark). Apps import them: import '${packageName}/style.css' */`,
    '',
    header ? '/* button of the header: icon and number */' : '/* e.g. an element added by the plugin */',
    `.drawer-container .drawer-button.${names.kebab}-button {`,
    '  gap: 4px;',
    '  width: auto;',
    '  padding: 0 10px;',
    '  color: var(--drawer-text);',
    '  font-variant-numeric: tabular-nums;',
    '}'
  );
}

/**
 * Class of the plugin
 * @param {Answers} answers answers
 * @returns {string} source
 */
function pluginFile(answers) {
  const { names, tool, toolId, command, commandShortcut, contextMenu, options, header } = answers;
  const P = names.pascal;
  const libraryImports = [
    'Plugin',
    header && 'createButton',
    header && 'drawerEvents',
    'shapeName',
    header && 'setLabel',
    'type Drawer',
    'type DrawingShape',
  ].filter(Boolean);

  return lines(
    "import { Rect } from 'konva/lib/shapes/Rect';",
    "import type { Vector2d } from 'konva/lib/types';",
    `import { ${libraryImports.join(', ')} } from '@fabwcie/free-drawing';`,
    `import { ${names.camel}Name, defaultColor, defaultSize } from './constants.js';`,
    (command || header) && "import { pluginIcon } from './icons.js';",
    "import { translations } from './translations.js';",
    options && `import type { ${P}Options } from './types.js';`,
    tool !== 'none' && `import { ${P}Widget } from './${P}Widget.js';`,
    '',
    '/**',
    ` * ${names.title} plugin of free-drawing. Steps: constructor (before the toolbar: texts, tool), \`init\` (drawer`,
    ' * created: commands, listeners), `afterInit` (every plugin initialized), `destroy`.',
    ` * Guide: ${guideUrl}`,
    ' */',
    `export class ${P}Plugin extends Plugin {`,
    `  /** Unique name: \`drawer.plugins.get('${P}')\`${options ? `, \`pluginOptions: { ${P}: {...} }\`` : ''} */`,
    `  static readonly pluginName = ${quote(P)};`,
    '  /** Plugins required: classes (added when missing) or names, created and initialized before this one */',
    '  static readonly requires = [];',
    '',
    options &&
      `  /** Options: these defaults replaced by the ones of the app (\`pluginOptions.${P}\` of the drawer) */`,
    options && `  readonly options = this.getOptions<${P}Options>({ color: defaultColor, size: defaultSize });`,
    options && '',
    header && '  /** Element of the header: `tool` class gives the surface of the panels of the drawer */',
    header && "  readonly $container = document.createElement('div');",
    header && '  /** Button of the header: icon and number of shapes of the plugin */',
    header &&
      `  readonly $button = createButton('drawer-button', 'drawer-button-neutral', ${quote(`${names.kebab}-button`)});`,
    header && '  /** Number of shapes in the button */',
    header && "  readonly $count = document.createElement('span');",
    header && '',
    '  /**',
    `   * Texts${tool !== 'none' ? ' and tool' : ''} of the plugin: the interface of the drawer is not created yet`,
    '   * @param drawer drawer of the plugin',
    '   */',
    '  constructor(drawer: Drawer) {',
    '    super(drawer);',
    '    this.addTranslations(translations);',
    tool !== 'none' &&
      `    // tool at its place in the \`widgets\` option of the app, else at the end of the toolbar\n    this.addWidget(${quote(
        toolId
      )}, ${P}Widget);`,
    header && "    this.$container.classList.add('tool');",
    header && '    this.$button.innerHTML = pluginIcon;',
    header && '    this.$button.append(this.$count);',
    header && '    this.$container.append(this.$button);',
    '  }',
    '',
    '  /**',
    '   * Drawer created: commands and listeners (removed by `destroy`)',
    '   */',
    '  init() {',
    command && '    // command of the palette, run by its shortcut (shown in help)',
    command && '    this.addCommand({',
    command && `      id: ${quote(`${names.kebab.replace(/-/g, ' ')} add`)},`,
    command && `      label: ${quote(`${names.camel}.add`)},`,
    command && '      icon: pluginIcon,',
    command && !!commandShortcut && `      shortcut: ${quote(commandShortcut)},`,
    command && contextMenu && "      // item of the context menu of the drawing ('selection': of selected shapes)",
    command && contextMenu && "      contextMenu: 'drawing',",
    command && '      run: () => this.add(this._viewCenter()),',
    command && '    });',
    header && '    // element of a region of the drawer: header, footerStart, footer, floating',
    header && "    this.drawer.layout.add('header', this.$container, { hideInZen: true });",
    header && '    this.listenTo(this.drawer, drawerEvents.change, () => this.update());',
    header && '    this.listenTo(this.drawer, drawerEvents.languageChange, () => this.update());',
    header && '    this.update();',
    !command && !header && '    // add commands (`addCommand`) and listeners (`listenTo`) here',
    '  }',
    '',
    '  /**',
    `   * Plugin destroyed (\`drawer.plugins.destroy()\`): ${
      header ? 'element of the header removed, then ' : ''
    }listeners removed`,
    '   * @returns nothing, or a promise',
    '   */',
    '  destroy() {',
    header && '    this.$container.remove();',
    header && '',
    '    return super.destroy();',
    '  }',
    '',
    '  /**',
    '   * Shapes of the plugin in the drawing, also in frames and groups',
    '   * @returns shapes named with the name of the plugin',
    '   */',
    '  getShapes(): DrawingShape[] {',
    `    return this.drawer.drawLayer.find<DrawingShape>(\`.\${${names.camel}Name}\`);`,
    '  }',
    '',
    '  /**',
    '   * Shape of the plugin added to the drawing and saved (history, storage, collaboration)',
    '   * @param point center of the shape, in drawing coordinates',
    '   * @returns the shape, null when the plugin is disabled (read only)',
    '   */',
    '  add(point: Vector2d): Rect | null {',
    '    if (!this.isEnabled) return null;',
    '',
    options ? '    const { color, size } = this.options;' : '    const [color, size] = [defaultColor, defaultSize];',
    '    const shape = new Rect({',
    `      name: \`\${shapeName.rect} \${${names.camel}Name}\`,`,
    '      x: point.x - size / 2,',
    '      y: point.y - size / 2,',
    '      width: size,',
    '      height: size,',
    '      fill: color,',
    "      stroke: '#1e1e1e',",
    '      strokeWidth: 2,',
    '      cornerRadius: 8,',
    '      // name in the layers panel',
    `      label: this.t(${quote(`${names.camel}.name`)}),`,
    '    });',
    '',
    '    // drawing shapes are added with `addShape` (id, hit region, moved with the selection tool)',
    '    this.drawer.addShape(shape);',
    '    this.drawer.placeInFrames([shape]);',
    "    this.drawer.stage.fire('change');",
    '',
    '    return shape;',
    '  }',
    header && '',
    header && '  /**',
    header && '   * Number of shapes of the plugin in the button of the header',
    header && '   */',
    header && '  update() {',
    header && '    const count = this.getShapes().length;',
    header && '',
    header && '    this.$count.textContent = String(count);',
    header && `    setLabel(this.$button, this.t(${quote(`${names.camel}.count`)}, { count }));`,
    header && '  }',
    command && '',
    command && '  /**',
    command && '   * Middle of the view, in drawing coordinates (zoom and position of the view)',
    command && '   * @returns point of the drawing in the middle of the view',
    command && '   */',
    command && '  private _viewCenter(): Vector2d {',
    command && '    const { stage } = this.drawer;',
    command && '',
    command &&
      '    return stage.getAbsoluteTransform().copy().invert().point({ x: stage.width() / 2, y: stage.height() / 2 });',
    command && '  }',
    '}'
  );
}

/**
 * Class of the tool
 * @param {Answers} answers answers
 * @returns {string} source
 */
function widgetFile({ names, tool, toolId, toolShortcut }) {
  const P = names.pascal;
  const superCall = `    super(drawer, ${quote(toolId)}, ${quote(names.title)}, pluginIcon${
    toolShortcut ? `, ${quote(toolShortcut)}` : ''
  });`;
  const constructorBlock = [
    '  /**',
    `   * Tool \`${toolId}\`: title from the \`tools.${toolId}\` text${
      toolShortcut ? `, shortcut ${toolShortcut.toUpperCase()}` : ''
    }`,
    '   * @param drawer drawer of the tool',
    '   */',
    '  constructor(drawer: Drawer) {',
    '    // id, title without translation, svg icon, shortcut letter (the `widgets` option of the app can change them)',
    superCall,
    '  }',
  ];

  if (tool === 'click') {
    return lines(
      "import { BaseWidget, type Drawer } from '@fabwcie/free-drawing';",
      "import { pluginIcon } from './icons.js';",
      '// type only: the plugin imports this tool',
      `import type { ${P}Plugin } from './${P}Plugin.js';`,
      '',
      '/**',
      ' * Tool of the plugin, based on `BaseWidget` (button, shortcut, activation): a click adds a shape under the pointer',
      ' */',
      `export class ${P}Widget extends BaseWidget {`,
      '  /** Cursor of the canvas while the tool is active */',
      "  protected cursor = 'copy';",
      '',
      ...constructorBlock,
      '',
      '  /**',
      '   * Events of the stage while the tool is active: `onStage` removes them when another tool is chosen',
      '   */',
      '  protected initEvents() {',
      "    this.onStage('click tap', (e) => {",
      '      // main button only (right button: context menu)',
      '      if (e.evt.button) return;',
      '',
      `      const shape = this.drawer.plugins.get<${P}Plugin>(${quote(P)})?.add(this.drawer.getPointerPosition());`,
      '',
      '      // selection tool back, unless the user keeps the tool (pin of the toolbar)',
      '      if (shape) this.afterDraw();',
      '    });',
      '  }',
      '}'
    );
  }

  return lines(
    "import { Rect } from 'konva/lib/shapes/Rect';",
    "import type { Vector2d } from 'konva/lib/types';",
    "import { ShapeWidget, shapeName, type Drawer } from '@fabwcie/free-drawing';",
    `import { ${names.camel}Name } from './constants.js';`,
    "import { pluginIcon } from './icons.js';",
    '// type only: the plugin imports this tool',
    `import type { ${P}Plugin } from './${P}Plugin.js';`,
    '',
    '/**',
    ' * Tool of the plugin drawing in the dragged box, based on `ShapeWidget`: the base creates the shape on press, updates',
    ' * it while the pointer moves (shared live), removes it after a simple click, saves the change. It has the options',
    ' * panel of shape tools (stroke, background, width, opacity)',
    ' */',
    `export class ${P}Widget extends ShapeWidget<Rect> {`,
    '  /** Background color option applies to its shapes: section shown in the options panel of the tool */',
    '  protected hasFill = true;',
    '',
    ...constructorBlock,
    '',
    '  /**',
    '   * Shape of size 0 at the press, with the style of the drawer options',
    '   * @param start press, in drawing coordinates',
    '   * @returns shape added to the drawing by the base',
    '   */',
    '  protected createShape(start: Vector2d) {',
    '    return new Rect({',
    '      ...this.shapeStyle,',
    `      name: \`\${shapeName.rect} \${${names.camel}Name}\`,`,
    '      x: start.x,',
    '      y: start.y,',
    '      width: 0,',
    '      height: 0,',
    '      cornerRadius: 8,',
    '    });',
    '  }',
    '',
    '  /**',
    '   * Shape from the press to the pointer, a square with Shift',
    '   * @param shape shape being drawn',
    '   * @param start press',
    '   * @param end pointer',
    '   * @param constrain Shift pressed',
    '   */',
    '  protected updateShape(shape: Rect, start: Vector2d, end: Vector2d, constrain: boolean) {',
    '    let width = end.x - start.x;',
    '    let height = end.y - start.y;',
    '',
    '    if (constrain) {',
    '      const size = Math.max(Math.abs(width), Math.abs(height));',
    '',
    '      width = Math.sign(width || 1) * size;',
    '      height = Math.sign(height || 1) * size;',
    '    }',
    '    shape.setAttrs({',
    '      x: Math.min(start.x, start.x + width),',
    '      y: Math.min(start.y, start.y + height),',
    '      width: Math.abs(width),',
    '      height: Math.abs(height),',
    '    });',
    '  }',
    '',
    '  /**',
    '   * Drawing ended, before the change is saved: name of the shape in the layers panel',
    '   * @param shape shape drawn, null after a simple click (nothing drawn)',
    '   */',
    '  protected onDrawEnd(shape: Rect | null) {',
    `    shape?.setAttr('label', this.drawer.plugins.get<${P}Plugin>(${quote(P)})?.t(${quote(
      `${names.camel}.name`
    )}));`,
    '  }',
    '}'
  );
}

/**
 * Tests of the plugin
 * @param {Answers} answers answers
 * @returns {string} source
 */
function testFile(answers) {
  const { names, tool, toolId, toolShortcut, command, commandShortcut, contextMenu, options, header } = answers;
  const P = names.pascal;
  const en = getTexts(answers).en;
  const key = commandShortcut ? commandShortcut.split('+').pop() ?? '' : '';
  const code = /\d/.test(key) ? `Digit${key}` : `Key${key}`;
  const runCommand = commandShortcut
    ? `    key(drawer, { key: 'π', code: ${quote(code)}, altKey: true${
        commandShortcut.includes('Shift') ? ', shiftKey: true' : ''
      } });`
    : `    drawer.showCommandPalette();\n    drawer.commandPalette!.commands.find((command) => command.label === ${quote(
        en[`${names.camel}.add`]
      )})!.run();\n    drawer.commandPalette!.hide();`;

  return lines(
    '// Tests of the plugin: a drawer in jsdom (canvas of the setup file), events fired on its stage and container',
    "import { describe, expect, it } from 'vitest';",
    `import { Drawer, type ${tool !== 'none' ? 'BaseWidget, type ' : ''}DrawerOptions } from '@fabwcie/free-drawing';`,
    `import { ${P}Plugin } from '../src/index.js';`,
    '',
    'document.body.innerHTML = \'<div id="drawer"></div>\';',
    '',
    '/**',
    ' * Drawer of a test with the plugin: nothing saved, nothing read from other tests',
    ' * @param options options of the drawer',
    ' * @returns the drawer',
    ' */',
    'const createDrawer = (options: Partial<DrawerOptions> = {}) =>',
    "  new Drawer(document.getElementById('drawer') as HTMLDivElement, {",
    "    language: 'en',",
    '    autoSave: false,',
    `    localStorageKey: \`test-\${Math.random()}\`,`,
    `    plugins: [${P}Plugin],`,
    '    ...options,',
    '  });',
    tool !== 'none' && '',
    tool !== 'none' && '/**',
    tool !== 'none' && ' * Pointer event on the stage, pointer at a point of the view',
    tool !== 'none' && ' * @param drawer drawer of the test',
    tool !== 'none' && ' * @param type konva event (`click`, `mousedown`, `mousemove`, `mouseup`)',
    tool !== 'none' && ' * @param x left of the pointer',
    tool !== 'none' && ' * @param y top of the pointer',
    tool !== 'none' && ' */',
    tool !== 'none' && 'const pointer = (drawer: Drawer, type: string, x: number, y: number) => {',
    tool !== 'none' && "  drawer.stage.setPointersPositions(new MouseEvent('mousemove', { clientX: x, clientY: y }));",
    tool !== 'none' && '  drawer.stage.fire(type, { evt: { button: 0, preventDefault() {} } });',
    tool !== 'none' && '};',
    !!(toolShortcut || commandShortcut) && '',
    !!(toolShortcut || commandShortcut) && '/**',
    !!(toolShortcut || commandShortcut) && ' * Key pressed in the drawer',
    !!(toolShortcut || commandShortcut) && ' * @param drawer drawer of the test',
    !!(toolShortcut || commandShortcut) && ' * @param init key and modifiers',
    !!(toolShortcut || commandShortcut) && ' */',
    !!(toolShortcut || commandShortcut) && 'const key = (drawer: Drawer, init: KeyboardEventInit) =>',
    !!(toolShortcut || commandShortcut) &&
      "  drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));",
    command && contextMenu && '',
    command && contextMenu && '/**',
    command && contextMenu && ' * Shown items of the context menu',
    command && contextMenu && ' * @param drawer drawer of the test',
    command && contextMenu && ' * @returns texts of the items (label and shortcut)',
    command && contextMenu && ' */',
    command && contextMenu && 'const menuItems = (drawer: Drawer) => {',
    command && contextMenu && '  drawer.contextMenu.show();',
    command && contextMenu && '',
    command &&
      contextMenu &&
      '  const items = [...drawer.contextMenu.$menu.querySelectorAll(\'[role^="menuitem"]:not([hidden])\')].map(',
    command && contextMenu && '    ($item) => $item.textContent',
    command && contextMenu && '  );',
    command && contextMenu && '',
    command && contextMenu && '  drawer.contextMenu.hide();',
    command && contextMenu && '',
    command && contextMenu && '  return items;',
    command && contextMenu && '};',
    '',
    `describe(${quote(`${names.title} plugin`)}, () => {`,
    "  it('Created with the drawer, adds shapes saved with the drawing', async () => {",
    '    const drawer = createDrawer();',
    `    const plugin = drawer.plugins.get(${P}Plugin)!;`,
    '',
    '    await drawer.ready;',
    `    expect(plugin.name).toBe(${quote(P)});`,
    '    plugin.add({ x: 100, y: 100 });',
    '    expect(plugin.getShapes()).toHaveLength(1);',
    '    expect(drawer.undoRedo.canUndo()).toBe(true);',
    '  });',
    tool !== 'none' && '',
    tool !== 'none' &&
      `  it(${quote(
        `Tool at the end of the toolbar, translated${toolShortcut ? ', activated by its shortcut' : ''}`
      )}, async () => {`,
    tool !== 'none' && '    const drawer = createDrawer();',
    tool !== 'none' && '',
    tool !== 'none' && '    await drawer.ready;',
    tool !== 'none' && `    expect([...drawer.toolbar.widgets.keys()].at(-1)).toBe(${quote(toolId)});`,
    tool !== 'none' &&
      `    expect(drawer.getWidget<BaseWidget>(${quote(toolId)})!.$button.getAttribute('aria-label')).toBe(${quote(
        names.title
      )});`,
    !!toolShortcut && `    key(drawer, { key: ${quote(toolShortcut)} });`,
    !!toolShortcut && `    expect(drawer.activeTool).toBe(${quote(toolId)});`,
    tool !== 'none' && '  });',
    tool === 'click' && '',
    tool === 'click' && "  it('Tool: a click adds a shape under the pointer', async () => {",
    tool === 'click' && '    const drawer = createDrawer();',
    tool === 'click' && `    const plugin = drawer.plugins.get(${P}Plugin)!;`,
    tool === 'click' && '',
    tool === 'click' && '    await drawer.ready;',
    tool === 'click' && `    drawer.getWidget<BaseWidget>(${quote(toolId)})!.setActive(true);`,
    tool === 'click' && "    pointer(drawer, 'click', 200, 150);",
    tool === 'click' && '',
    tool === 'click' && '    const [shape] = plugin.getShapes();',
    tool === 'click' && '',
    tool === 'click' &&
      `    expect([shape.x() + shape.width() / 2, shape.y() + shape.height() / 2]).toEqual([200, 150]);`,
    tool === 'click' && '  });',
    tool === 'shape' && '',
    tool === 'shape' && "  it('Tool: a shape drawn in the dragged box', async () => {",
    tool === 'shape' && '    const drawer = createDrawer();',
    tool === 'shape' && `    const plugin = drawer.plugins.get(${P}Plugin)!;`,
    tool === 'shape' && '',
    tool === 'shape' && '    await drawer.ready;',
    tool === 'shape' && `    drawer.getWidget<BaseWidget>(${quote(toolId)})!.setActive(true);`,
    tool === 'shape' && "    pointer(drawer, 'mousedown', 50, 50);",
    tool === 'shape' && "    pointer(drawer, 'mousemove', 250, 150);",
    tool === 'shape' && "    pointer(drawer, 'mouseup', 250, 150);",
    tool === 'shape' && '',
    tool === 'shape' && '    const [shape] = plugin.getShapes();',
    tool === 'shape' && '',
    tool === 'shape' &&
      '    expect([shape.x(), shape.y(), shape.width(), shape.height()]).toEqual([50, 50, 200, 100]);',
    tool === 'shape' && '  });',
    command && '',
    command &&
      `  it(${quote(
        `Command: palette${commandShortcut ? ', shortcut' : ''}${contextMenu ? ', context menu' : ''}; not in read only`
      )}, async () => {`,
    command && '    const drawer = createDrawer();',
    command && `    const plugin = drawer.plugins.get(${P}Plugin)!;`,
    command && '',
    command && '    await drawer.ready;',
    command &&
      contextMenu &&
      `    expect(menuItems(drawer)).toContain(${quote(`${en[`${names.camel}.add`]}${commandShortcut}`)});`,
    command && runCommand,
    command && '    expect(plugin.getShapes()).toHaveLength(1);',
    command && '',
    command && '    // read only: the drawing is not modified',
    command && '    drawer.setReadOnly(true);',
    command && '    drawer.showCommandPalette();',
    command &&
      `    expect(drawer.commandPalette!.commands.map((command) => command.label)).not.toContain(${quote(
        en[`${names.camel}.add`]
      )});`,
    command && '    drawer.commandPalette!.hide();',
    command && '  });',
    options && '',
    options && "  it('Options of the app replace the defaults', async () => {",
    options && `    const drawer = createDrawer({ pluginOptions: { ${P}: { size: 40 } } });`,
    options && `    const plugin = drawer.plugins.get(${P}Plugin)!;`,
    options && '',
    options && '    await drawer.ready;',
    options && '    expect(plugin.options.size).toBe(40);',
    options && '    expect(plugin.add({ x: 0, y: 0 })!.width()).toBe(40);',
    options && '  });',
    header && '',
    header && "  it('Button of the header: number of shapes, removed when destroyed', async () => {",
    header && '    const drawer = createDrawer();',
    header && `    const plugin = drawer.plugins.get(${P}Plugin)!;`,
    header && '',
    header && '    await drawer.ready;',
    header && '    expect(drawer.layout.$header.contains(plugin.$button)).toBe(true);',
    header && '    plugin.add({ x: 0, y: 0 });',
    header && "    expect(plugin.$count.textContent).toBe('1');",
    header && '    await drawer.plugins.destroy();',
    header && '    expect(plugin.$container.isConnected).toBe(false);',
    header && '  });',
    '});'
  );
}
