import { afterEach, describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { createDrawer, keydown } from './helpers';

/** Palettes opened by tests, closed after each one (document listeners) */
const palettes = new Set<CommandPalette>();

const open = (drawer: ReturnType<typeof createDrawer>) => {
  drawer.showCommandPalette();
  palettes.add(drawer.commandPalette!);
  return drawer.commandPalette!;
};

const search = (palette: CommandPalette, text: string) => {
  palette.$input.value = text;
  palette.$input.dispatchEvent(new Event('input'));
};

const press = (palette: CommandPalette, key: string) =>
  palette.$input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

const options = (palette: CommandPalette) =>
  [...palette.$list.querySelectorAll<HTMLElement>('[role="option"]')].map(
    ($option) => $option.querySelector('.drawer-commands-label')!.textContent
  );

const activeOption = (palette: CommandPalette) =>
  document.getElementById(palette.$input.getAttribute('aria-activedescendant') ?? '');

describe('Command palette', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => palettes.forEach((palette) => palette.hide()));

  it('Menu item and Ctrl+K open palette, focus in search field', () => {
    const drawer = createDrawer({ language: 'en' });
    const $item = drawer.setting.$commandsButton;

    expect(drawer.setting.$dropdownList.firstElementChild).toBe($item);
    expect($item.getAttribute('aria-keyshortcuts')).toBe('Control+K');
    $item.click();

    const palette = drawer.commandPalette!;

    palettes.add(palette);

    expect(palette.isVisible()).toBe(true);
    expect(document.activeElement).toBe(palette.$input);
    expect(palette.$modal.getAttribute('aria-label')).toBe('Command palette');
    expect(palette.$input.getAttribute('role')).toBe('combobox');
    expect(palette.$input.getAttribute('aria-controls')).toBe(palette.$list.id);
    expect(palette.$list.getAttribute('role')).toBe('listbox');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(palette.isVisible()).toBe(false);

    expect(keydown(drawer, { key: 'k', ctrlKey: true })).toBe(false);
    expect(palette.isVisible()).toBe(true);
  });

  it('Commands available now, in groups, toggles and current tool checked', () => {
    const drawer = createDrawer({ language: 'en' });
    const palette = open(drawer);
    const groups = [...palette.$list.querySelectorAll('.drawer-commands-group')].map(($group) => $group.textContent);

    expect(groups).toEqual(['Tools', 'Editor', 'View', 'File', 'Language']);
    expect(options(palette)).toContain('Brush');
    expect(options(palette)).toContain('Show grid');
    expect(options(palette)).toContain('Language: Deutsch');
    // nothing to undo, no selection
    expect(options(palette)).not.toContain('Undo');
    expect(options(palette)).not.toContain('Duplicate');

    const $brush = palette.$list.querySelector(`[role="option"][aria-checked="true"]`)!;

    expect($brush.textContent).toContain('Brush');
    expect($brush.querySelector('.drawer-commands-shortcut')!.textContent).toBe('B');
    expect(palette.$list.querySelectorAll('[role="group"]')[0].getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('Selection commands with a selection, editing commands hidden in read only', () => {
    const drawer = createDrawer({ language: 'en' });
    const shape = drawer.addShape(new Rect({ width: 10, height: 10 }));

    drawer.getWidget<SelectWidget>('selection')!.select([shape]);
    expect(options(open(drawer))).toEqual(
      expect.arrayContaining(['Duplicate', 'Bring forward', 'Send to back', 'Delete', 'Select all'])
    );

    drawer.commandPalette!.hide();
    drawer.setReadOnly(true);
    const commands = options(open(drawer));

    expect(commands).not.toContain('Brush');
    expect(commands).not.toContain('Clear canvas');
    expect(commands).not.toContain('Open');
    expect(commands).toContain('Pan');
    expect(commands).toContain('Export image...');
  });

  it('Search filters commands in any case, without accents, also with English words', () => {
    const drawer = createDrawer({ language: 'fr' });
    const palette = open(drawer);

    search(palette, 'GRILLE');
    expect(options(palette)).toEqual(['Afficher la grille']);

    search(palette, 'selection');
    expect(options(palette)).toEqual(['Sélection']);

    search(palette, 'theme');
    expect(options(palette)).toEqual(['Mode sombre']);

    search(palette, 'mode zen');
    expect(options(palette)).toEqual(['Mode zen']);

    search(palette, 'epaisseur');
    expect(options(palette)).toEqual([]);
    expect(palette.$empty.hidden).toBe(false);
    expect(palette.$empty.textContent).toBe('Aucune commande trouvée');
    expect(palette.$input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('Arrows choose a command, Enter runs it and closes palette', () => {
    const drawer = createDrawer({ language: 'en' });
    const palette = open(drawer);
    const count = options(palette).length;

    expect(activeOption(palette)!.textContent).toContain('Pan');
    expect(activeOption(palette)!.getAttribute('aria-selected')).toBe('true');
    press(palette, 'ArrowDown');
    expect(activeOption(palette)!.textContent).toContain('Select');
    press(palette, 'ArrowUp');
    press(palette, 'ArrowUp');
    // last one
    expect(activeOption(palette)!.id).toBe(palette.$list.querySelectorAll('[role="option"]')[count - 1].id);

    search(palette, 'grid');
    expect(press(palette, 'Enter')).toBe(false);
    expect(drawer.grid).toBe(true);
    expect(palette.isVisible()).toBe(false);
    expect(document.activeElement).toBe(drawer.$drawerContainer);

    // state shown next time
    open(drawer);
    search(palette, 'grid');
    expect(activeOption(palette)!.getAttribute('aria-checked')).toBe('true');
  });

  it('Click runs a command: tool, language', () => {
    const drawer = createDrawer({ language: 'en' });
    const palette = open(drawer);

    search(palette, 'eraser');
    activeOption(palette)!.click();
    expect(drawer.activeTool).toBe('eraser');

    open(drawer);
    search(palette, 'deutsch');
    activeOption(palette)!.click();
    expect(drawer.language).toBe('de');
    open(drawer);
    expect(palette.$input.placeholder).toBe('Befehl suchen');
  });

  it('commandPalette option false: no menu item nor shortcut', () => {
    const drawer = createDrawer({ commandPalette: false });

    expect(drawer.setting.$commandsButton.isConnected).toBe(false);
    keydown(drawer, { key: 'k', ctrlKey: true });
    expect(drawer.commandPalette).toBeNull();
  });
});
