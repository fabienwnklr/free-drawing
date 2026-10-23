import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { ariaShortcut, formatShortcut, isApple } from '@/utils/shortcut';
import { createDrawer, setPointer } from './helpers';

/** Device of Apple for the test (jsdom: Windows like) */
const apple = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');

describe('Shortcuts shown', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Names of keys in language, arrows; Ctrl elsewhere than on Apple devices', () => {
    const { t } = createDrawer({ language: 'fr' }).i18n;

    expect(isApple()).toBe(false);
    expect(formatShortcut('Ctrl+Shift+Z', t)).toBe('Ctrl+Shift+Z');
    expect(formatShortcut('Ctrl+Shift+Up', t)).toBe('Ctrl+Shift+↑');
    expect(formatShortcut('Ctrl+Delete', t)).toBe('Ctrl+Suppr');
    expect(formatShortcut('Shift+Click', t)).toBe('Shift+Clic');
    expect(formatShortcut('Ctrl+,', t)).toBe('Ctrl+,');
    expect(formatShortcut('', t)).toBe('');
    expect(ariaShortcut('Ctrl+Shift+Up')).toBe('Control+Shift+ArrowUp');
    expect(ariaShortcut('Ctrl+Y', 'Ctrl+Shift+Z')).toBe('Control+Y Control+Shift+Z');
    expect(ariaShortcut('Alt+L')).toBe('Alt+L');
  });

  it('Apple devices: symbols of their keys in the order of macOS, Meta in aria-keyshortcuts', () => {
    const { t } = createDrawer({ language: 'en' }).i18n;

    apple();
    expect(isApple()).toBe(true);
    expect(formatShortcut('Ctrl+Shift+Z', t)).toBe('⇧⌘Z');
    expect(formatShortcut('Shift+Alt+C', t)).toBe('⌥⇧C');
    expect(formatShortcut('Alt+Shift+D', t)).toBe('⌥⇧D');
    expect(formatShortcut('Ctrl+Shift+Down', t)).toBe('⇧⌘↓');
    // delete key of macOS
    expect(formatShortcut('Ctrl+Delete', t)).toBe('⌘⌫');
    expect(formatShortcut('Ctrl+Backspace', t)).toBe('⌘⌫');
    expect(formatShortcut('Delete', t)).toBe('⌫');
    expect(formatShortcut('Ctrl+,', t)).toBe('⌘,');
    expect(formatShortcut('Ctrl++', t)).toBe('⌘+');
    // modifier alone, words after a +
    expect(formatShortcut('Shift', t)).toBe('⇧');
    expect(formatShortcut('Ctrl+Click', t)).toBe('⌘+Click');
    expect(formatShortcut('Shift+Arrows', t)).toBe('⇧+Arrows');
    expect(formatShortcut('B', t)).toBe('B');
    expect(ariaShortcut('Ctrl+Shift+Up')).toBe('Meta+Shift+ArrowUp');
    expect(ariaShortcut('Alt+Z')).toBe('Alt+Z');
  });

  it('Apple devices: menus, context menu, command palette, help, tooltips and aria-keyshortcuts', () => {
    apple();

    const drawer = createDrawer({ language: 'en' });
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const rect = drawer.addShape(new Rect({ x: 10, y: 10, width: 50, height: 50 }));

    // settings menu
    expect(drawer.setting.$openButton.textContent).toContain('⌘O');
    expect(drawer.setting.$openButton.getAttribute('aria-keyshortcuts')).toBe('Meta+O');
    expect(drawer.setting.$saveAsButton.textContent).toContain('⇧⌘S');

    // context menu of a selected shape
    selectWidget.setActive(true);
    selectWidget.select([rect]);
    setPointer(drawer, 30, 30);
    drawer.stage.fire('contextmenu', { evt: { clientX: 30, clientY: 30, preventDefault() {} } });

    const item = (label: string) =>
      [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(
        ($item) => $item.querySelector('span')?.textContent === label
      )!;

    expect(item('Duplicate').querySelector('kbd')!.textContent).toBe('⌘D');
    expect(item('Duplicate').getAttribute('aria-keyshortcuts')).toBe('Meta+D');
    expect(item('Bring to front').querySelector('kbd')!.textContent).toBe('⇧⌘↑');
    expect(item('Delete').querySelector('kbd')!.textContent).toBe('⌫');
    drawer.contextMenu.hide();

    // selection menu and options panel tooltips
    expect(drawer.selectionMenu!.$duplicateBtn.title).toBe('Duplicate (⌘D)');
    expect(drawer.undoRedo.$btnRedo.title).toBe('Redo (⌘Y)');
    expect(drawer.undoRedo.$btnRedo.getAttribute('aria-keyshortcuts')).toBe('Meta+Y Meta+Shift+Z');

    // command palette
    drawer.showCommandPalette();

    const option = [...drawer.commandPalette!.$list.querySelectorAll('[role="option"]')].find(
      (o) => o.querySelector('.drawer-commands-label')?.textContent === 'Export image...'
    )!;

    expect(option.querySelector('kbd')!.textContent).toBe('⇧⌘E');
    drawer.commandPalette!.hide();

    // help: alternatives of one key of macOS shown once
    const help = [...drawer.help.$modalBody.querySelectorAll('li')].map(($li) => $li.textContent);

    expect(help).toContain('Clear canvas ⌘⌫');
    expect(help).toContain('Redo ⌘Y or ⇧⌘Z');
    expect(help).toContain('Select shape in a group ⌘+Click');
  });

  it('Cmd + wheel zooms like Ctrl + wheel', () => {
    const drawer = createDrawer();

    setPointer(drawer, 100, 100);
    drawer.stage.fire('wheel', { evt: { metaKey: true, deltaY: -100, preventDefault() {} } });
    expect(drawer.getZoomLevel()).toBeGreaterThan(1);
  });
});
