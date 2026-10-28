import type { Translate, TranslationKey } from '@/@types/i18n';

/** Words of shortcuts written in English (`Ctrl+Click`), shown in the language of the drawer */
const keyNames: Record<string, TranslationKey> = {
  Ctrl: 'key.ctrl',
  Shift: 'key.shift',
  Alt: 'key.alt',
  Delete: 'key.delete',
  Backspace: 'key.backspace',
  Escape: 'key.escape',
  Enter: 'key.enter',
  Tab: 'key.tab',
  Home: 'key.home',
  End: 'key.end',
  Arrows: 'key.arrows',
  Click: 'key.click',
  Space: 'key.space',
  Wheel: 'key.wheel',
};

/** Arrow keys shown as arrows */
const arrows: Record<string, string> = {
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/** Modifiers of Apple keyboards, in the order of macOS menus (Ctrl of shortcuts is Cmd there) */
const appleModifiers: Record<string, string> = { Alt: '⌥', Shift: '⇧', Ctrl: '⌘' };

/** Keys of Apple keyboards shown as symbols (delete key of macOS: Backspace) */
const appleKeys: Record<string, string> = { ...appleModifiers, Delete: '⌫', Backspace: '⌫', Enter: '↩', Escape: '⎋' };

/** Keys of `aria-keyshortcuts` (values of `KeyboardEvent.key`) */
const ariaKeys: Record<string, string> = {
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  '↑': 'ArrowUp',
  '↓': 'ArrowDown',
  '←': 'ArrowLeft',
  '→': 'ArrowRight',
};

/**
 * Device of Apple (macOS, iOS, iPadOS): shortcuts shown with the symbols of its keys (⌘, ⌥, ⇧)
 * @returns true on an Apple device
 */
export function isApple(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/**
 * Modifiers and key of a shortcut written as in the library (`Ctrl+Shift+Z`, `Alt+P`, `Ctrl++`, `Shift`)
 * @param shortcut Keys separated by `+`, modifiers first
 * @returns Modifiers (`Ctrl`, `Alt`, `Shift`) and the last key
 */
function splitShortcut(shortcut: string): [string[], string] {
  const [, modifiers, key] = /^((?:(?:Ctrl|Alt|Shift)\+)*)(.+)$/.exec(shortcut) ?? ['', '', shortcut];

  return [modifiers.split('+').filter(Boolean), key];
}

/**
 * Shortcut as shown to the user: words in the language of the drawer, arrows; on Apple devices symbols of its keys in
 * the order of macOS (`Ctrl+Shift+Z`: ⇧⌘Z, `Ctrl+Click`: ⌘+Click), Ctrl being Cmd there (shortcuts take both)
 * @param shortcut Keys separated by `+` (`Ctrl+Shift+Up`, `Alt+Z`, `Delete`, `Shift+Arrows`)
 * @param t Translation function of the drawer
 * @returns Text of the shortcut
 */
export function formatShortcut(shortcut: string, t: Translate): string {
  if (!shortcut) return '';

  const [modifiers, key] = splitShortcut(shortcut);
  const apple = isApple();
  const keyText = (apple && appleKeys[key]) || arrows[key] || (keyNames[key] ? t(keyNames[key]) : key);

  // names of the keys of the language (Strg, Maj...)
  if (!apple) return [...modifiers.map((modifier) => t(keyNames[modifier])), keyText].join('+');

  const symbols = Object.keys(appleModifiers)
    .filter((modifier) => modifiers.includes(modifier))
    .map((modifier) => appleModifiers[modifier])
    .join('');

  // one key next to its modifiers (⇧⌘Z), a word after a + (⌘+Click)
  return !symbols || [...keyText].length === 1 ? symbols + keyText : `${symbols}+${keyText}`;
}

/**
 * `aria-keyshortcuts` value of shortcuts: Ctrl is Meta (Cmd) on Apple devices, Control elsewhere
 * @param shortcuts Keys separated by `+` (`Ctrl+Shift+Up`, `Alt+L`, `Delete`)
 * @returns Shortcuts separated by spaces (`Control+Shift+ArrowUp`)
 */
export function ariaShortcut(...shortcuts: string[]): string {
  const ctrl = isApple() ? 'Meta' : 'Control';

  return shortcuts
    .filter(Boolean)
    .map((shortcut) => {
      const [modifiers, key] = splitShortcut(shortcut);

      return [...modifiers.map((modifier) => (modifier === 'Ctrl' ? ctrl : modifier)), ariaKeys[key] ?? key].join('+');
    })
    .join(' ');
}
