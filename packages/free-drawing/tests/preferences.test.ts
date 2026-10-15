import { afterEach, describe, expect, it, vi } from 'vitest';
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
      keepTool: true,
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

  it('Dialog from menu, shortcut and command palette, fields applied together with Save', async () => {
    const drawer = createDrawer({ language: 'en', collaboration: true });
    const $item = drawer.setting.$preferencesButton;
    const onChange = vi.fn();

    drawer.on('drawer.preferences.change', onChange);
    expect($item.getAttribute('aria-haspopup')).toBe('dialog');
    expect($item.getAttribute('aria-keyshortcuts')).toBe('Control+,');
    $item.click();

    const modal = drawer.preferencesModal!;

    opened.push(modal);
    expect(modal.isVisible()).toBe(true);
    expect(modal.$modal.querySelector('.drawer-modal-title')!.textContent).toBe('Preferences');
    expect(modal.$themes.find(($radio) => $radio.checked)!.value).toBe('light');
    expect([modal.$cancelButton.textContent, modal.$saveButton.textContent]).toEqual(['Cancel', 'Save']);

    // fields changed: nothing applied yet
    modal.$themes[1].click();
    modal.$language.value = 'fr';
    modal.$language.dispatchEvent(new Event('change'));
    modal.$grid.click();
    // grid and snapping exclude each other
    modal.$snapping.click();
    expect(modal.$grid.checked).toBe(false);
    modal.$zen.click();
    modal.$name!.value = 'Ada';
    modal.$name!.dispatchEvent(new Event('input'));
    expect([drawer.theme, drawer.language, drawer.grid, drawer.getUserName()]).toEqual(['light', 'en', false, '']);
    // not replaced by a change elsewhere
    drawer.setPreferences({ zen: false });
    await Promise.resolve();
    expect(modal.$zen.checked).toBe(true);

    // saved: all applied, one event
    onChange.mockClear();
    modal.$saveButton.click();
    await Promise.resolve();
    expect(modal.isVisible()).toBe(false);
    expect([drawer.theme, drawer.language, drawer.getUserName()]).toEqual(['dark', 'fr', 'Ada']);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(saved(drawer)).toEqual({
      theme: 'dark',
      language: 'fr',
      grid: false,
      snapping: true,
      zen: true,
      autoSave: false,
      keepTool: true,
    });

    // cancelled, closed with Escape: nothing applied, fields show preferences again
    drawer.showPreferences();
    expect(modal.$modal.querySelector('.drawer-modal-title')!.textContent).toBe('Préférences');
    modal.$themes[0].click();
    modal.$cancelButton.click();
    expect(drawer.theme).toBe('dark');
    drawer.showPreferences();
    expect(modal.$themes.find(($radio) => $radio.checked)!.value).toBe('dark');
    modal.$zen.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.isVisible()).toBe(false);
    expect(drawer.getPreferences().zen).toBe(true);

    // Enter in name field saves
    drawer.showPreferences();
    modal.$name!.value = 'Grace';
    modal.$name!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(drawer.getUserName()).toBe('Grace');
    expect(modal.isVisible()).toBe(false);

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
