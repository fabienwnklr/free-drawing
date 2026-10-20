import { describe, expect, it } from 'vitest';
import {
  checkCommandShortcut,
  checkName,
  checkPackageName,
  checkToolId,
  checkToolShortcut,
  formatShortcut,
  getNames,
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
    expect(['free-drawing-plugin-notes', '@me/notes', 'Notes', 'my notes'].map(checkPackageName)).toEqual([
      null,
      null,
      expect.any(String),
      expect.any(String),
    ]);
    expect(['stickyNotes', 'brush', 'Sticky', 'sticky-notes'].map(checkToolId)).toEqual([
      null,
      '"brush" is a tool of the library',
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
    expect(formatShortcut('shift+alt+n')).toBe('Alt+Shift+N');
    // S and T are used: I
    expect(suggestToolShortcut('Sticky notes')).toBe('i');
    // S is used with Alt: T, not the letter of the tool
    expect([suggestCommandShortcut('Sticky notes'), suggestCommandShortcut('Sticky notes', 't')]).toEqual([
      'Alt+T',
      'Alt+I',
    ]);
  });
});
