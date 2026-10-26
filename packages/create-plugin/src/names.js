// @ts-check

/**
 * @typedef {object} Names Names of a plugin, derived from the name given by the developer
 * @property {string} title Name as given, trimmed (texts, README)
 * @property {string} pascal PascalCase: `pluginName`, classes (`StickyNotesPlugin`)
 * @property {string} camel camelCase: id of its tool, prefix of its text keys (`stickyNotes.add`)
 * @property {string} kebab kebab-case: package, folder, name of its shapes (`sticky-notes`)
 */

/** Ids of the tools of the library: a tool of a plugin needs another one */
export const libraryTools = [
  'pan',
  'selection',
  'brush',
  'eraser',
  'text',
  'note',
  'line',
  'square',
  'circle',
  'arrow',
  'image',
  'triangle',
  'diamond',
  'heart',
  'cloud',
  'star',
  'hexagon',
  'blockArrow',
  'bubble',
  'checkbox',
  'highlighter',
  'laser',
  'frame',
];

/** Letters of the tools of the library (and Q, keep tool): a tool of a plugin needs another one */
export const libraryToolLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'k', 'l', 'm', 'n', 'q', 'r', 's', 't'];

/** Shortcuts of the library with Alt (letters after Alt, after Alt + Shift) */
export const libraryAltShortcuts = { alt: ['z', 'g', 'l', 's'], altShift: ['d', 'c', 's'] };

/**
 * Words of a name: letters and digits, accents removed, camelCase split
 * @param {string} name name given by the developer (`Sticky notes`, `sticky-notes`, `StickyNotes`)
 * @returns {string[]} words in lower case
 */
export function words(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

/**
 * Names of a plugin in every case
 * @param {string} name name given by the developer
 * @returns {Names} names derived from it
 */
export function getNames(name) {
  const parts = words(name);
  const pascal = parts.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');

  return {
    title: name.trim(),
    pascal,
    camel: pascal.charAt(0).toLowerCase() + pascal.slice(1),
    kebab: parts.join('-'),
  };
}

/**
 * Name of a plugin can give identifiers: at least one word, starting with a letter
 * @param {string} name name given by the developer
 * @returns {string | null} error, null when valid
 */
export function checkName(name) {
  const parts = words(name);

  if (!parts.length) return 'Give a name with letters, e.g. "Sticky notes"';
  if (!/^[a-z]/.test(parts[0])) return 'Start the name with a letter: it gives the names of classes';

  return null;
}

/**
 * Name of an npm package: lower case, characters allowed in URLs, scope allowed (`@me/name`)
 * @param {string} name package name
 * @returns {string | null} error, null when valid
 */
export function checkPackageName(name) {
  if (name.length > 214) return 'Package names have 214 characters at most';
  if (!/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
    return 'Use lower case letters, digits, "-", "." or "_" (e.g. free-drawing-plugin-sticky-notes)';
  }

  return null;
}

/**
 * Id of a tool: camelCase, not the id of a tool of the library
 * @param {string} id id of the tool
 * @returns {string | null} error, null when valid
 */
export function checkToolId(id) {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(id)) return 'Use camelCase: a lower case letter, then letters and digits';
  if (libraryTools.includes(id)) return `"${id}" is a tool of the library`;

  return null;
}

/**
 * Shortcut of a tool: one letter, not one of a tool of the library, or nothing
 * @param {string} letter shortcut (empty: none)
 * @returns {string | null} error, null when valid
 */
export function checkToolShortcut(letter) {
  if (!letter) return null;
  if (!/^[a-z]$/i.test(letter)) return 'Give one letter, or "none" for no shortcut';
  if (libraryToolLetters.includes(letter.toLowerCase())) {
    return `${letter.toUpperCase()} is a shortcut of the library (used: ${libraryToolLetters.join(' ').toUpperCase()})`;
  }

  return null;
}

/**
 * Shortcut of a command, written as in help: Alt (+ Shift) and a letter or a digit, not one of the library, or
 * nothing. Ctrl shortcuts are left to the library and the browser
 * @param {string} shortcut shortcut (empty: none)
 * @returns {string | null} error, null when valid
 */
export function checkCommandShortcut(shortcut) {
  if (!shortcut) return null;

  const keys = shortcut.split('+').map((key) => key.trim().toLowerCase());
  const key = keys.pop() ?? '';
  const shift = keys.includes('shift');

  if (!keys.includes('alt') || keys.some((k) => k !== 'alt' && k !== 'shift') || !/^[a-z0-9]$/.test(key)) {
    return 'Use Alt and a letter or a digit, with Shift or not (e.g. Alt+N, Alt+Shift+N)';
  }
  if ((shift ? libraryAltShortcuts.altShift : libraryAltShortcuts.alt).includes(key)) {
    return `${formatShortcut(shortcut)} is a shortcut of the library`;
  }

  return null;
}

/**
 * Shortcut written as in help: `Alt+Shift+N`
 * @param {string} shortcut shortcut typed by the developer (`alt+shift+n`)
 * @returns {string} keys with capitals, Alt before Shift
 */
export function formatShortcut(shortcut) {
  if (!shortcut) return '';

  const keys = shortcut.split('+').map((key) => key.trim().toLowerCase());
  const key = keys.pop() ?? '';

  return [keys.includes('alt') && 'Alt', keys.includes('shift') && 'Shift', key.toUpperCase()]
    .filter(Boolean)
    .join('+');
}

/**
 * First letter of a name that is a free tool shortcut
 * @param {string} name name of the plugin
 * @returns {string} letter, empty when every letter of the name is used
 */
export function suggestToolShortcut(name) {
  return [...words(name).join('')].find((letter) => /[a-z]/.test(letter) && !checkToolShortcut(letter)) ?? '';
}

/**
 * Alt and the first letter of a name that is a free command shortcut
 * @param {string} name name of the plugin
 * @param {string} toolShortcut shortcut of the tool of the plugin, not reused
 * @returns {string} shortcut (`Alt+N`), empty when every letter of the name is used
 */
export function suggestCommandShortcut(name, toolShortcut = '') {
  const letter = [...words(name).join('')].find(
    (l) => /[a-z]/.test(l) && l !== toolShortcut.toLowerCase() && !checkCommandShortcut(`Alt+${l}`)
  );

  return letter ? `Alt+${letter.toUpperCase()}` : '';
}
