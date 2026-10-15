import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { shapeName } from '@/constants';
import { createDrawer, keydown } from './helpers';

/** Drawer with a rectangle, a freehand line and a text (top), panel open */
const createLayers = (options = {}) => {
  const drawer = createDrawer(options);
  const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 50, height: 50, stroke: '#000' }));
  const line = drawer.addShape(new Line({ name: shapeName.line, points: [0, 0, 10, 10], stroke: '#000' }));
  const text = drawer.getWidget<TextWidget>('text')!.addTextNode('Hello\nworld');

  drawer.stage.fire('change');
  drawer.layersPanel!.toggle(true);

  return { drawer, panel: drawer.layersPanel!, rect, line, text };
};

const rows = (drawer: Drawer) =>
  [...drawer.layersPanel!.$list.querySelectorAll<HTMLElement>('.drawer-layers-item')].map(
    ($item) =>
      ($item.querySelector('.drawer-layers-label')?.textContent ?? '') +
      ($item.classList.contains('is-selected') ? ' *' : '') +
      ($item.classList.contains('is-hidden') ? ' hidden' : '') +
      ($item.classList.contains('is-locked') ? ' locked' : '')
  );

const part = (drawer: Drawer, index: number, name: string) =>
  drawer.layersPanel!.$list.children[index].querySelector<HTMLElement>(`[data-part="${name}"]`)!;

describe('Layers panel', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Header button and Alt+L show panel listing shapes, top one first', () => {
    const drawer = createDrawer();
    const panel = drawer.layersPanel!;

    expect(panel.$button.getAttribute('aria-label')).toBe('Layers');
    expect(panel.$button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.$panel.getAttribute('role')).toBe('region');
    // next to menu
    expect(drawer.setting.$dropdownContainer.nextElementSibling).toBe(panel.$buttonContainer);

    panel.$button.click();
    expect(panel.isVisible()).toBe(true);
    expect(panel.$button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.$empty.hidden).toBe(false);

    keydown(drawer, { key: 'l', altKey: true });
    expect(panel.isVisible()).toBe(false);

    const { drawer: other } = createLayers();
    expect(rows(other)).toEqual(['Hello', 'Freehand', 'Rectangle']);
    expect(other.layersPanel!.$empty.hidden).toBe(true);

    expect(createDrawer({ layersPanel: false }).layersPanel).toBeUndefined();
  });

  it('Rows select shapes with selection tool, Ctrl adds, selection on canvas highlights rows', () => {
    const { drawer, rect, text } = createLayers();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    part(drawer, 2, 'name').click();
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getSelectedShapes()).toEqual([rect]);
    expect(rows(drawer)).toEqual(['Hello', 'Freehand', 'Rectangle *']);
    expect(part(drawer, 2, 'name').getAttribute('aria-pressed')).toBe('true');

    part(drawer, 0, 'name').dispatchEvent(new MouseEvent('click', { ctrlKey: true }));
    expect(drawer.getSelectedShapes()).toEqual([rect, text]);
    // removed
    part(drawer, 2, 'name').dispatchEvent(new MouseEvent('click', { metaKey: true }));
    expect(drawer.getSelectedShapes()).toEqual([text]);

    selectWidget.clearSelection();
    expect(rows(drawer)).toEqual(['Hello', 'Freehand', 'Rectangle']);
  });

  it('Shift selects a range of rows from last one selected, with mouse or keyboard', () => {
    const { drawer, panel, rect, line, text } = createLayers();
    const selected = () => new Set(drawer.getSelectedShapes());

    part(drawer, 0, 'name').click();
    part(drawer, 2, 'name').dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(selected()).toEqual(new Set([text, line, rect]));
    expect(rows(drawer)).toEqual(['Hello *', 'Freehand *', 'Rectangle *']);

    // from shape selected on canvas
    drawer.getWidget<SelectWidget>('selection')!.select([rect]);
    part(drawer, 1, 'name').dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(selected()).toEqual(new Set([line, rect]));

    // locked shapes are not selected with others
    drawer.setShapesLocked(true, [line]);
    part(drawer, 2, 'name').click();
    part(drawer, 0, 'name').dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(selected()).toEqual(new Set([rect, text]));
    drawer.setShapesLocked(false, [line]);

    // keyboard: Shift + arrows extend, Ctrl + Space adds or removes
    part(drawer, 0, 'name').click();
    part(drawer, 0, 'name').focus();
    part(drawer, 0, 'name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true })
    );
    expect(document.activeElement).toBe(part(drawer, 1, 'name'));
    expect(selected()).toEqual(new Set([text, line]));
    part(drawer, 1, 'name').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true }));
    expect(selected()).toEqual(new Set([text]));

    // shown in panel, describes rows
    expect(panel.$hint.textContent).toContain('Ctrl+Click');
    expect(panel.$hint.textContent).toContain('Shift+Click');
    expect(part(drawer, 0, 'name').getAttribute('aria-describedby')).toBe(panel.$hint.id);
    expect(panel.$hint.hidden).toBe(false);
  });

  it('Shapes are renamed with double click or F2, empty name gives back default one', () => {
    const { drawer, rect } = createLayers();

    part(drawer, 2, 'name').dispatchEvent(new MouseEvent('dblclick'));
    const $input = drawer.layersPanel!.$list.querySelector('input')!;
    expect($input.value).toBe('Rectangle');
    expect(document.activeElement).toBe($input);

    // letters are not tool shortcuts
    $input.value = 'Background';
    $input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    expect(drawer.activeTool).not.toBe('brush');
    $input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(rect.getAttr('label')).toBe('Background');
    expect(drawer.getShapeLabel(rect)).toBe('Background');
    expect(rows(drawer)[2]).toBe('Background');
    expect(document.activeElement).toBe(part(drawer, 2, 'name'));

    // Escape cancels
    part(drawer, 2, 'name').dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    drawer.layersPanel!.$list.querySelector('input')!.value = 'Other';
    drawer
      .layersPanel!.$list.querySelector('input')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(rows(drawer)[2]).toBe('Background');
    expect(drawer.layersPanel!.isVisible()).toBe(true);

    drawer.undoRedo.undo();
    expect(rows(drawer)[2]).toBe('Rectangle');

    // shapes restored by undo
    const [restored] = drawer.getDrawingShapes();
    expect(drawer.setShapeLabel(restored, '  ')).toBe(false);
    drawer.setShapeLabel(restored, 'Frame');
    expect(drawer.setShapeLabel(restored, '')).toBe(true);
    expect(drawer.getShapeLabel(restored)).toBe('Rectangle');
  });

  it('Hidden shapes are not selectable, locked ones alone (to be unlocked), states saved and undone', () => {
    const { drawer, rect, text } = createLayers();
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    selectWidget.select([rect, text]);
    part(drawer, 2, 'visibility').click();
    expect(rect.visible()).toBe(false);
    expect(part(drawer, 2, 'visibility').getAttribute('aria-pressed')).toBe('true');
    // unselected
    expect(drawer.getSelectedShapes()).toEqual([text]);

    part(drawer, 0, 'lock').click();
    expect(text.listening()).toBe(false);
    expect(part(drawer, 0, 'lock').getAttribute('aria-label')).toBe('Lock Hello');
    // still selected, to be unlocked
    expect(drawer.getSelectedShapes()).toEqual([text]);
    expect(selectWidget.isLocked()).toBe(true);
    expect(rows(drawer)).toEqual(['Hello * locked', 'Freehand', 'Rectangle hidden']);

    // hidden one not selectable from panel, locked one alone, not with select all
    part(drawer, 2, 'name').click();
    expect(drawer.getSelectedShapes()).toEqual([text]);
    part(drawer, 1, 'name').click();
    part(drawer, 0, 'name').dispatchEvent(new MouseEvent('click', { ctrlKey: true }));
    expect(drawer.getSelectedShapes().map((shape) => shape.name())).toEqual([shapeName.line]);
    part(drawer, 0, 'name').click();
    expect(drawer.getSelectedShapes()).toEqual([text]);
    selectWidget.selectAll();
    expect(drawer.getSelectedShapes().map((shape) => shape.name())).toEqual([shapeName.line]);

    drawer.undoRedo.undo();
    expect(rows(drawer)).toEqual(['Hello', 'Freehand', 'Rectangle hidden']);

    expect(drawer.setShapesHidden(false, drawer.getDrawingShapes())).toBe(true);
    expect(drawer.setShapesHidden(false, drawer.getDrawingShapes())).toBe(false);
  });

  it('Rows are reordered with Alt + arrows and drag handle, deleted with Delete', () => {
    const { drawer, rect, line, text } = createLayers();
    const ids = () => drawer.getDrawingShapes().map((shape) => shape.id());

    part(drawer, 2, 'name').focus();
    part(drawer, 2, 'name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true })
    );
    expect(ids()).toEqual([line.id(), rect.id(), text.id()]);
    expect(rows(drawer)).toEqual(['Hello', 'Rectangle', 'Freehand']);
    // focus follows shape
    expect(document.activeElement).toBe(part(drawer, 1, 'name'));

    // first row dropped after last one (no layout in jsdom: pointer below rows)
    part(drawer, 0, 'name')
      .closest('li')!
      .querySelector('.drawer-layers-grip')!
      .dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientY: 10 }));
    expect(drawer.layersPanel!.$list.lastElementChild!.classList.contains('drop-after')).toBe(true);
    window.dispatchEvent(new MouseEvent('pointerup', { clientY: 10 }));
    expect(rows(drawer)).toEqual(['Rectangle', 'Freehand', 'Hello']);
    expect(drawer.layersPanel!.$list.querySelector('.drop-after')).toBeNull();

    part(drawer, 0, 'name').focus();
    part(drawer, 0, 'name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(rows(drawer)).toEqual(['Freehand', 'Hello']);
    expect(document.activeElement).toBe(part(drawer, 0, 'name'));
  });

  it('Only current row is reached with Tab, read only mode disables actions', () => {
    const { drawer } = createLayers();
    const tabbable = () =>
      [...drawer.layersPanel!.$list.querySelectorAll<HTMLElement>('button')]
        .filter(($btn) => $btn.tabIndex === 0)
        .map(($btn) => $btn.dataset.part);

    expect(tabbable()).toEqual(['name', 'visibility', 'lock', 'delete']);
    part(drawer, 1, 'name').focus();
    expect(part(drawer, 0, 'name').tabIndex).toBe(-1);
    expect(part(drawer, 1, 'delete').tabIndex).toBe(0);

    drawer.setReadOnly(true);
    expect(drawer.layersPanel!.$panel.classList.contains('read-only')).toBe(true);
    expect((part(drawer, 0, 'delete') as HTMLButtonElement).disabled).toBe(true);
    part(drawer, 0, 'name').dispatchEvent(new MouseEvent('dblclick'));
    expect(drawer.layersPanel!.$list.querySelector('input')).toBeNull();
  });
});
