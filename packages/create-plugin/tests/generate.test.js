import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generate, getTexts, quote } from '../src/generate.js';
import { createAnswersPrompter } from '../src/prompts.js';
import { ask, summarize } from '../src/questions.js';
import { addExtensions, findTemplate, generateFromTemplate, renameTemplate } from '../src/template.js';
import { versions } from '../src/versions.js';

/**
 * Answers of the questions, defaults for the others
 * @param {Record<string, string | boolean | string[]>} answers answers by question id
 * @returns {Promise<import('../src/questions.js').Answers>} answers
 */
const answer = (answers) => ask(createAnswersPrompter({ name: 'Sticky notes', ...answers }));

describe('Generated plugin', () => {
  it('Defaults: click tool, command in the context menu, options, French texts, tests', async () => {
    const answers = await answer({});
    const files = generate(answers);
    const plugin = files.get('src/StickyNotesPlugin.ts');

    expect([...files.keys()].sort()).toEqual([
      '.gitignore',
      'README.md',
      'package.json',
      'src/StickyNotesPlugin.ts',
      'src/StickyNotesWidget.ts',
      'src/constants.ts',
      'src/icons.ts',
      'src/index.ts',
      'src/translations.ts',
      'src/types.ts',
      'tests/sticky-notes.test.ts',
      'tsconfig.build.json',
      'tsconfig.json',
      'vitest.config.ts',
      'vitest.setup.ts',
    ]);
    expect(plugin).toContain("static readonly pluginName = 'StickyNotes';");
    expect(plugin).toContain("this.addWidget('stickyNotes', StickyNotesWidget);");
    expect(plugin).toContain("shortcut: 'Alt+T',");
    expect(plugin).toContain("contextMenu: 'drawing',");
    expect(plugin).toContain('this.getOptions<StickyNotesOptions>(');
    expect(files.get('src/StickyNotesWidget.ts')).toContain(
      "super(drawer, 'stickyNotes', 'Sticky notes', pluginIcon, 'i');"
    );
    expect(getTexts(answers)).toEqual({
      en: {
        'stickyNotes.name': 'Sticky notes',
        'tools.stickyNotes': 'Sticky notes',
        'stickyNotes.add': 'Sticky notes: add in the middle',
      },
      fr: {
        'stickyNotes.name': 'Sticky notes',
        'tools.stickyNotes': 'Sticky notes',
        'stickyNotes.add': 'Sticky notes : ajouter au milieu',
      },
    });
    // relative imports with their extension (ES modules of apps)
    expect([...files.values()].join('\n')).not.toMatch(/from '\.{1,2}\/[^']*(?<!\.js)'/);
  });

  it('Package: library and Konva given by the app, scripts, style sheet exported', async () => {
    const pkg = JSON.parse(generate(await answer({ header: true, css: true })).get('package.json'));

    expect(pkg.name).toBe('free-drawing-plugin-sticky-notes');
    expect(pkg.peerDependencies).toEqual({ '@fabwcie/free-drawing': versions.library, konva: versions.konva });
    expect(pkg.exports['./style.css']).toBe('./dist/style.css');
    // resolved by require too (Jest)
    expect(pkg.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    });
    expect(pkg.scripts.build).toContain('copyFileSync');
    expect(Object.keys(pkg.scripts)).toEqual(['build', 'typecheck', 'test', 'prepublishOnly']);
  });

  it('Nothing chosen: plugin, texts, constants and package files only', async () => {
    const files = generate(
      await answer({ tool: 'none', command: false, options: false, header: false, css: false, tests: false })
    );
    const plugin = files.get('src/StickyNotesPlugin.ts');

    expect([...files.keys()].sort()).toEqual([
      '.gitignore',
      'README.md',
      'package.json',
      'src/StickyNotesPlugin.ts',
      'src/constants.ts',
      'src/icons.ts',
      'src/index.ts',
      'src/translations.ts',
      'tsconfig.build.json',
      'tsconfig.json',
    ]);
    expect(plugin).not.toContain('this.addCommand(');
    expect(plugin).toContain('const [color, size] = [defaultColor, defaultSize];');
    expect(JSON.parse(files.get('package.json')).devDependencies).not.toHaveProperty('vitest');
  });

  it('Shape tool, header button, every language; names given by the developer quoted', async () => {
    const answers = await answer({
      name: "Bob's notes",
      tool: 'shape',
      header: true,
      languages: ['fr', 'es', 'de'],
    });
    const files = generate(answers);

    expect(files.get('src/BobSNotesWidget.ts')).toContain('extends ShapeWidget<Rect>');
    expect(files.get('src/BobSNotesWidget.ts')).toContain("'Bob\\'s notes'");
    expect(files.get('src/BobSNotesPlugin.ts')).toContain("this.drawer.layout.add('header'");
    expect(Object.keys(getTexts(answers))).toEqual(['en', 'fr', 'es', 'de']);
    expect(quote("it's \\ fine")).toBe("'it\\'s \\\\ fine'");
    expect(summarize(answers)).toContain('Header    button with the number of shapes');
  });

  it('Complete template: renamed plugin, its tools kept, imports with extensions, styles imported by the app', async () => {
    const answers = await answer({ name: 'My stamps', start: 'template' });
    const files = generateFromTemplate(answers);
    const plugin = files.get('src/MyStampsPlugin.ts');

    expect(files.has('src/MyStampsCounterPlugin.ts')).toBe(true);
    expect(files.has('src/widgets/StampWidget.ts')).toBe(true);
    expect(files.has('tests/my-stamps.test.ts')).toBe(true);
    expect(plugin).toContain("static readonly pluginName = 'MyStamps';");
    expect(plugin).toContain("label: 'myStamps.center',");
    expect(files.get('src/index.ts')).not.toContain("import './style.css'");
    expect(files.get('tests/my-stamps.test.ts')).toContain("from '../src/index.js'");
    expect(renameTemplate("get<StampsPlugin>('Stamps') 'stamps.limit'", answers)).toBe(
      "get<MyStampsPlugin>('MyStamps') 'myStamps.limit'"
    );
    expect(addExtensions("import { a } from './icons';\nimport b from './x.css';", `${findTemplate()}/src`)).toBe(
      "import { a } from './icons.js';\nimport b from './x.css';"
    );
    // in the repository: the template itself, not a copy left by `prepack`
    expect(findTemplate().replaceAll('\\', '/')).toMatch(/packages\/plugin-template$/);
  });

  it('Versions of dependencies: the ones the library is tested with', () => {
    const library = JSON.parse(readFileSync(new URL('../../free-drawing/package.json', import.meta.url), 'utf8'));
    const [major, minor] = library.version.split('.').map(Number);
    const [, minMajor, minMinor] = versions.library.match(/^\^(\d+)\.(\d+)/).map(Number);

    expect(major === minMajor && minor >= minMinor).toBe(true);
    expect([
      versions.konva,
      versions.typescript,
      versions.vitest,
      versions.vite,
      versions.jsdom,
      versions.jestCanvasMock,
    ]).toEqual([
      library.devDependencies.konva,
      library.devDependencies.typescript,
      library.devDependencies.vitest,
      library.devDependencies.vite,
      library.devDependencies.jsdom,
      library.devDependencies['jest-canvas-mock'],
    ]);
  });
});
