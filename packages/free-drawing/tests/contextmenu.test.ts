import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { createDrawer, keydown, setPointer } from './helpers';

/** Right click on canvas at a position */
const rightClick = (drawer: Drawer, x: number, y: number) => {
  setPointer(drawer, x, y);
  drawer.stage.fire('contextmenu', { evt: { clientX: x, clientY: y, preventDefault() {} } });
};

/** Shown items: label and shortcut */
const items = (drawer: Drawer) =>
  [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([hidden])')].map(
    ($item) =>
      `${$item.querySelector('.drawer-context-menu-item__label')!.textContent} ${
        $item.querySelector('kbd')!.textContent
      }`
  );

const item = (drawer: Drawer, label: string) =>
  [...drawer.contextMenu.$menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(
    ($item) => $item.querySelector('.drawer-context-menu-item__label')!.textContent === label
  )!;

const readText = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

const createRect = (drawer: Drawer, x: number, y: number) =>
  drawer.addShape(new Rect({ name: shapeName.rect, x, y, width: 100, height: 50, stroke: '#000' }));

describe('Context menu', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Right click on a shape selects it: actions on selection with their shortcuts', () => {
    const drawer = createDrawer({ language: 'en' });
    const rect = createRect(drawer, 100, 100);

    rightClick(drawer, 150, 125);
    expect(drawer.getSelectedShapes()).toEqual([rect]);
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.contextMenu.isVisible()).toBe(true);
    expect(items(drawer)).toEqual([
      'Duplicate Ctrl+D',
      'Lock Ctrl+Shift+L',
      'Delete Delete',
      'Bring to front Ctrl+Shift+↑',
      'Bring forward Ctrl+↑',
      'Send backward Ctrl+↓',
      'Send to back Ctrl+Shift+↓',
      'Flip horizontal Shift+H',
      'Flip vertical Shift+V',
      'Copy as PNG Shift+Alt+C',
      'Copy as SVG Shift+Alt+S',
      'Select all Ctrl+A',
    ]);
    expect(item(drawer, 'Bring forward').getAttribute('aria-keyshortcuts')).toBe('Control+ArrowUp');
    // 5 groups, separated
    expect(drawer.contextMenu.$list.querySelectorAll('.is-separated').length).toBe(4);
    expect(document.activeElement).toBe(item(drawer, 'Duplicate'));

    // action run, menu hidden
    item(drawer, 'Flip horizontal').click();
    expect(drawer.contextMenu.isVisible()).toBe(false);
    expect(rect.scaleX()).toBe(-1);
  });

  it('Right click elsewhere: actions on drawing, selection removed (kept in its box)', () => {
    const drawer = createDrawer({ language: 'en' });
    const rect = createRect(drawer, 100, 100);

    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    rightClick(drawer, 600, 400);
    expect(drawer.getSelectedShapes()).toEqual([]);
    expect(items(drawer)).toEqual([
      'Paste Ctrl+V',
      'Copy as PNG Shift+Alt+C',
      'Copy as SVG Shift+Alt+S',
      'Select all Ctrl+A',
      'Snap to object Alt+S',
      'Show grid Alt+G',
    ]);

    item(drawer, 'Select all').click();
    expect(drawer.getSelectedShapes()).toEqual([rect]);

    // read only: no action modifying drawing
    drawer.setReadOnly(true);
    rightClick(drawer, 600, 400);
    expect(items(drawer)).toEqual([
      'Copy as PNG Shift+Alt+C',
      'Copy as SVG Shift+Alt+S',
      'Snap to object Alt+S',
      'Show grid Alt+G',
    ]);
    drawer.contextMenu.hide();
  });

  it('Lock, duplicate and delete from menu', () => {
    const drawer = createDrawer({ language: 'en' });
    const rect = createRect(drawer, 100, 100);

    rightClick(drawer, 150, 125);
    item(drawer, 'Duplicate').click();
    expect(drawer.getDrawingShapes()).toHaveLength(2);

    const copy = drawer.getDrawingShapes()[1];
    const box = copy.getClientRect();

    // copy selected: removed
    rightClick(drawer, box.x + box.width - 5, box.y + box.height - 5);
    item(drawer, 'Delete').click();
    expect(drawer.getDrawingShapes()).toEqual([rect]);

    rightClick(drawer, 105, 105);
    item(drawer, 'Lock').click();
    expect(rect.listening()).toBe(false);
  });

  it('Flip around center of selection, texts still readable', () => {
    const drawer = createDrawer();
    const left = createRect(drawer, 0, 0);
    const right = createRect(drawer, 200, 100);
    const text = drawer.addShape(new Text({ name: shapeName.text, x: 0, y: 200, text: 'Hello', fontSize: 20 }));
    const width = text.width();

    drawer.flipShapes('horizontal', [left, right, text]);
    // box from 0 to 300: mirrored around 150
    expect(left.x()).toBe(300);
    expect(left.scaleX()).toBe(-1);
    expect(right.x()).toBe(100);
    expect(text.scaleX()).toBe(1);
    expect(text.x()).toBeCloseTo(300 - width);

    drawer.flipShapes('vertical', [left]);
    expect(left.scaleY()).toBe(-1);
    expect(left.y()).toBe(50);

    // flipped twice: back
    drawer.flipShapes('horizontal', [left, right, text]);
    expect([left.x(), right.x(), text.x()]).toEqual([0, 200, 0]);
    expect(drawer.undoRedo.canUndo()).toBe(true);
  });

  it('Shortcuts: Shift + H / V flip, Ctrl + Shift + L locks, Shift + Alt + C / S copy as image', async () => {
    const drawer = createDrawer();
    const rect = createRect(drawer, 100, 100);
    const write = vi.fn(async () => {});

    vi.stubGlobal(
      'ClipboardItem',
      class {
        static supports = () => true;
        constructor(readonly items: Record<string, Promise<Blob>>) {}
      }
    );
    vi.stubGlobal('navigator', { ...navigator, clipboard: { write } });

    // without selection: not a tool shortcut
    keydown(drawer, { key: 'H', code: 'KeyH', shiftKey: true });
    expect(drawer.activeTool).not.toBe('pan');

    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    keydown(drawer, { key: 'H', code: 'KeyH', shiftKey: true });
    expect(rect.scaleX()).toBe(-1);
    keydown(drawer, { key: 'V', code: 'KeyV', shiftKey: true });
    expect(rect.scaleY()).toBe(-1);

    expect(keydown(drawer, { key: 'Ś', code: 'KeyS', shiftKey: true, altKey: true })).toBe(false);
    await vi.waitFor(() => expect(write).toHaveBeenCalled());

    const [[[item]]] = write.mock.calls as unknown as [[[{ items: Record<string, Promise<Blob>> }]]];
    const text = await item.items['text/plain'];

    expect(Object.keys(item.items)).toEqual(['text/plain', 'image/svg+xml']);
    expect(text.type).toBe('text/plain');
    expect(await readText(text)).toContain('<svg');

    expect(keydown(drawer, { key: 'L', code: 'KeyL', shiftKey: true, ctrlKey: true })).toBe(false);
    expect(rect.listening()).toBe(false);
  });
});
