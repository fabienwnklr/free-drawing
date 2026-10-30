import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  checkCommandShortcut,
  checkName,
  checkPackageName,
  checkToolId,
  checkToolShortcut,
  formatShortcut,
  getNames,
  libraryToolLetters,
  extraTools,
  libraryTools,
  suggestCommandShortcut,
  suggestToolShortcut,
  words,
} from '../src/names.js';

describe('Names of a plugin', () => {
  it('Derived from any way of writing the name: PascalCase classes, camelCase ids and keys, kebab-case package', () => {
    for (const name of ['Sticky notes', 'sticky-notes', 'StickyNotes', ' sticky_notes ', 'STICKY NOTES']) {
      expect(getNames(name)).toEqual(
        expect.objectContaining({ pascal: 'StickyNotes', camel: 'stickyNotes', kebab: 'sticky-notes' })
      );
    }
    expect(words('Élan vital 3D')).toEqual(['elan', 'vital', '3d']);
    expect(getNames('Mind map').title).toBe('Mind map');
  });

  it('Invalid names, package names and tool ids are told', () => {
    expect([checkName('Sticky notes'), checkName('---'), checkName('3D shapes')]).toEqual([
      null,
      'Give a name with letters, e.g. "Sticky notes"',
      'Start the name with a letter: it gives the names of classes',
    ]);
    // names of its shapes dropped from drawing files and sessions: names of nodes of the drawer, of the library
    for (const name of ['Background', 'Grid', 'Draw', 'Selection', 'Drawer rect', 'drawer frame box']) {
      expect(checkName(name)).toEqual(expect.stringContaining('another name'));
    }
    expect(checkName('Drawer')).toBeNull();
    expect(['free-drawing-plugin-notes', '@me/notes', 'Notes', 'my notes'].map(checkPackageName)).toEqual([
      null,
      null,
      expect.any(String),
      expect.any(String),
    ]);
    expect(['stickyNotes', 'brush', 'heart', 'Sticky', 'sticky-notes'].map(checkToolId)).toEqual([
      null,
      '"brush" is a tool of the library',
      '"heart" is a tool of @fabwcie/free-drawing-extra-tools',
      expect.any(String),
      expect.any(String),
    ]);
  });

  it('Shortcuts: free ones suggested, the ones of the library refused', () => {
    expect([checkToolShortcut(''), checkToolShortcut('p'), checkToolShortcut('B'), checkToolShortcut('pp')]).toEqual([
      null,
      null,
      expect.stringContaining('B is a shortcut of the library'),
      'Give one letter, or "none" for no shortcut',
    ]);
    expect(
      ['Alt+N', 'alt+shift+n', 'Alt+1', 'Alt+S', 'Alt+Shift+D', 'Ctrl+N', 'N', ''].map(checkCommandShortcut)
    ).toEqual([
      null,
      null,
      null,
      'Alt+S is a shortcut of the library',
      'Alt+Shift+D is a shortcut of the library',
      expect.any(String),
      expect.any(String),
      null,
    ]);
    // panel of the library (Alt + B)
    expect(checkCommandShortcut('Alt+B')).toBe('Alt+B is a shortcut of the library');
    expect(formatShortcut('shift+alt+n')).toBe('Alt+Shift+N');
    // S and T are used: I
    expect(suggestToolShortcut('Sticky notes')).toBe('i');
    // S is used with Alt: T, not the letter of the tool
    expect([suggestCommandShortcut('Sticky notes'), suggestCommandShortcut('Sticky notes', 't')]).toEqual([
      'Alt+T',
      'Alt+I',
    ]);
  });

  it('Tools and their letters follow the sources of the library and of its extra tools', () => {
    const src = new URL('../../free-drawing/src/', import.meta.url);
    const constants = readFileSync(new URL('constants.ts', src), 'utf8');
    const list = constants.match(/export const widgetNames[^=]*= \[([^\]]*)\]/)?.[1] ?? '';
    const widgets = new URL('components/toolbar/widgets/', src);
    // shortcut of each widget: super(drawer, id, title, icon, letter)
    const letters = readdirSync(widgets, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith('.ts'))
      .flatMap((file) => [
        ...readFileSync(new URL(file.replaceAll('\\', '/'), widgets), 'utf8').matchAll(
          /super\(drawer, '\w+', '[^']*', \w+, '(\w)'\)/g
        ),
      ])
      .map(([, letter]) => letter);
    // tools of the plugins of the extra tools: addWidget(id, class), super(drawer, id, title, icon, letter)
    const extra = ['ExtraShapesPlugin.ts', 'HighlighterPlugin.ts'].map((file) =>
      readFileSync(new URL(`../../extra-tools/src/${file}`, import.meta.url), 'utf8')
    );
    const extraIds = extra.flatMap((source) => [...source.matchAll(/this\.addWidget\('(\w+)'/g)].map(([, id]) => id));
    const extraLetters = extra.flatMap((source) =>
      [...source.matchAll(/super\(drawer, '\w+', '[^']*', \w+, '(\w)'\)/g)].map(([, letter]) => letter)
    );

    expect([...libraryTools].sort()).toEqual([...list.matchAll(/'(\w+)'/g)].map(([, name]) => name).sort());
    expect([...extraTools].sort()).toEqual(extraIds.sort());
    // Q: tool kept
    expect([...libraryToolLetters].sort()).toEqual([...letters, ...extraLetters, 'q'].sort());
  });
});
