import { afterEach, describe, expect, it } from 'vitest';
import type { Drawer } from '@/Drawer';
import { createDrawer, keydown } from './helpers';

const saved = (drawer: Drawer) => JSON.parse(localStorage.getItem(drawer.options.localStorageKey + '-preferences')!);

/** Dialogs opened by a test, closed after it (document listeners) */
const opened: { hide(): void }[] = [];

describe('Preferences', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => opened.splice(0).forEach((modal) => modal.hide()));

  it('Saved in browser, restored on next visit', () => {
    const drawer = createDrawer({ language: 'en' });

    drawer.setPreferences({ theme: 'dark', language: 'fr', snapping: true, zen: true });
    expect(saved(drawer)).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: false,
      snapping: true,
      zen: true,
      autoSave: false,
    });

    const reloaded = createDrawer({ localStorageKey: drawer.options.localStorageKey, language: 'en' });

    expect(reloaded.getPreferences()).toEqual(saved(drawer));
    expect(reloaded.isDarkMode()).toBe(true);
    expect(reloaded.language).toBe('fr');
    expect(reloaded.layout.zen).toBe(true);
    expect(reloaded.$drawerContainer.classList.contains('is-zen')).toBe(true);
    expect(reloaded.setting.$zenModeButton.getAttribute('aria-pressed')).toBe('true');

    // grid also without drawing saved in browser
    reloaded.setPreferences({ grid: true, zen: false });
    expect(createDrawer({ localStorageKey: drawer.options.localStorageKey }).getPreferences()).toMatchObject({
      grid: true,
      snapping: false,
      zen: false,
    });
  });

  it('Choices of previous versions kept, invalid data ignored', () => {
    const key = 'test-' + Math.random();

    localStorage.setItem(key + '-theme', 'dark');
    localStorage.setItem(key + '-language', 'de');
    expect(createDrawer({ localStorageKey: key }).getPreferences()).toMatchObject({ theme: 'dark', language: 'de' });

    localStorage.setItem(key + '-preferences', '{ invalid');
    localStorage.removeItem(key + '-theme');
    expect(createDrawer({ localStorageKey: key, language: 'en' }).getPreferences()).toMatchObject({
      theme: 'light',
      language: 'de',
    });

    localStorage.setItem(key + '-preferences', JSON.stringify({ theme: 'pink', language: 'xx', grid: 'yes' }));
    expect(createDrawer({ localStorageKey: key, language: 'en' }).getPreferences()).toMatchObject({
      theme: 'light',
      language: 'de',
      grid: false,
    });
  });

  it('Dialog from menu, shortcut and command palette, fields applied at once', async () => {
    const drawer = createDrawer({ language: 'en', collaboration: true });
    const $item = drawer.setting.$preferencesButton;

    expect($item.getAttribute('aria-haspopup')).toBe('dialog');
    expect($item.getAttribute('aria-keyshortcuts')).toBe('Control+,');
    $item.click();

    const modal = drawer.preferencesModal!;

    opened.push(modal);
    expect(modal.isVisible()).toBe(true);
    expect(modal.$modal.querySelector('.drawer-modal-title')!.textContent).toBe('Preferences');
    expect(modal.$themes.find(($radio) => $radio.checked)!.value).toBe('light');

    modal.$themes[1].click();
    expect(drawer.theme).toBe('dark');

    modal.$language.value = 'fr';
    modal.$language.dispatchEvent(new Event('change'));
    expect(drawer.language).toBe('fr');
    expect(modal.$modal.querySelector('.drawer-modal-title')!.textContent).toBe('Préférences');

    modal.$grid.click();
    expect(drawer.grid).toBe(true);
    // snapping hides grid: field updated
    modal.$snapping.click();
    await Promise.resolve();
    expect(drawer.getPreferences()).toMatchObject({ grid: false, snapping: true });
    expect(modal.$grid.checked).toBe(false);

    modal.$zen.click();
    expect(drawer.getPreferences().zen).toBe(true);

    modal.$name!.value = 'Ada';
    modal.$name!.dispatchEvent(new Event('change'));
    expect(drawer.getUserName()).toBe('Ada');
    expect(saved(drawer)).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: false,
      snapping: true,
      zen: true,
      autoSave: false,
    });

    modal.hide();
    expect(keydown(drawer, { key: ',', ctrlKey: true })).toBe(false);
    expect(modal.isVisible()).toBe(true);
    modal.hide();

    drawer.showCommandPalette();
    opened.push(drawer.commandPalette!);
    drawer.commandPalette!.$input.value = 'préférences';
    drawer.commandPalette!.$input.dispatchEvent(new Event('input'));
    expect(drawer.commandPalette!.$list.querySelector('[role="option"]')!.textContent).toContain('Préférences');
  });

  it('No name field without collaboration', () => {
    const drawer = createDrawer();

    drawer.showPreferences();
    opened.push(drawer.preferencesModal!);
    expect(drawer.preferencesModal!.$name).toBeNull();
  });
});
