import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Drawer } from '@/Drawer';
import type { DrawerStorage } from '@/@types/drawer';
import { shapeName } from '@/constants';
import { createDrawer } from './helpers';

const addRect = (drawer: Drawer) => {
  drawer.addShape(new Rect({ name: shapeName.rect, width: 50, height: 50, stroke: '#000' }));
  drawer.stage.fire('change');
};

const savedStage = (drawer: Drawer) => localStorage.getItem(drawer.options.localStorageKey);

describe('Auto save', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    for (const $modal of document.querySelectorAll('.drawer-modal')) $modal.remove();
  });

  it('On by default: each change saved, nothing left to save', () => {
    const drawer = createDrawer({ autoSave: true });
    const onUnsaved = vi.fn();

    drawer.on('drawer.unsaved.change', onUnsaved);
    addRect(drawer);
    expect(savedStage(drawer)).toContain('drawer-rect');
    expect(drawer.hasUnsavedChanges()).toBe(false);
    expect(onUnsaved).not.toHaveBeenCalled();
    expect(drawer.setting.$saveButton.hidden).toBe(true);
  });

  it('Off: changes saved from menu or command palette, all saved when turned on again', async () => {
    const drawer = createDrawer({ autoSave: true, language: 'en' });
    const onUnsaved = vi.fn();
    const toast = vi.spyOn(drawer, 'toast');

    drawer.on('drawer.unsaved.change', onUnsaved);
    drawer.setPreferences({ autoSave: false });
    expect(drawer.getPreferences().autoSave).toBe(false);

    addRect(drawer);
    expect(savedStage(drawer)).toBeNull();
    expect(drawer.hasUnsavedChanges()).toBe(true);
    expect(onUnsaved).toHaveBeenCalledWith(true);
    // menu item with state
    expect(drawer.setting.$saveButton.hidden).toBe(false);
    expect(drawer.setting.$saveButton.textContent).toContain('Save now');
    expect(drawer.setting.$saveButton.textContent).toContain('Not saved');

    drawer.setting.$saveButton.click();
    await Promise.resolve();
    expect(savedStage(drawer)).toContain('drawer-rect');
    expect(drawer.hasUnsavedChanges()).toBe(false);
    expect(onUnsaved).toHaveBeenLastCalledWith(false);
    expect(toast).toHaveBeenCalledWith('Drawing saved', 'info');
    expect(drawer.setting.$saveButton.textContent).not.toContain('Not saved');

    // turned on: pending changes saved at once
    addRect(drawer);
    drawer.setAutoSave(true);
    expect(drawer.hasUnsavedChanges()).toBe(false);
    expect(JSON.parse(savedStage(drawer)!).children[2].children).toHaveLength(2);
  });

  it('Preference saved in browser, switch of preferences, commands of palette', () => {
    const drawer = createDrawer({ autoSave: true, language: 'en' });

    drawer.showPreferences();
    const modal = drawer.preferencesModal!;

    expect(modal.$autoSave.checked).toBe(true);
    expect(modal.$autoSave.closest('label')!.textContent).toContain('Auto save');
    modal.$autoSave.click();
    modal.$saveButton.click();
    expect(drawer.options.autoSave).toBe(false);

    // next visit
    expect(createDrawer({ autoSave: true, localStorageKey: drawer.options.localStorageKey }).options.autoSave).toBe(
      false
    );

    drawer.showCommandPalette();
    const palette = drawer.commandPalette!;
    const labels = [...palette.$list.querySelectorAll('[role="option"]')].map(($option) => $option.textContent);

    expect(labels.some((label) => label?.includes('Auto save'))).toBe(true);
    expect(labels.some((label) => label?.includes('Save now'))).toBe(true);
    palette.hide();
  });

  it('Page left with changes not saved: warned', () => {
    const drawer = createDrawer({ autoSave: false });
    const leave = () => window.dispatchEvent(new Event('beforeunload', { cancelable: true }));

    expect(leave()).toBe(true);
    addRect(drawer);
    expect(leave()).toBe(false);
    drawer.save();
    expect(leave()).toBe(true);
  });

  it('Storage of an app: saved only when asked', async () => {
    const save = vi.fn(async () => {});
    const storage: DrawerStorage = { load: async () => null, save };
    const drawer = createDrawer({ autoSave: false, storage });

    await drawer.ready;
    expect(drawer.hasUnsavedChanges()).toBe(false);
    addRect(drawer);
    expect(save).not.toHaveBeenCalled();
    await drawer.saveNow();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
