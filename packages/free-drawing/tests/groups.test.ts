import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Group } from 'konva/lib/Group';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { EraserWidget } from '@/components/toolbar/widgets/Eraser/Eraser';
import { shapeName } from '@/constants';
import { parseDrawingFile } from '@/utils/drawingFile';
import { createDrawer, fireMouse, keydown, setPointer } from './helpers';

/** Drawer with a rectangle, an ellipse and a rectangle on top */
const createShapes = () => {
  const drawer = createDrawer();
  const rect = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 0, width: 50, height: 50, stroke: '#000' }));
  const ellipse = drawer.addShape(
    new Ellipse({ name: shapeName.ellipse, x: 100, y: 100, radiusX: 20, radiusY: 20, stroke: '#000', fill: '#fff' })
  );
  const top = drawer.addShape(new Rect({ name: shapeName.rect, x: 300, y: 0, width: 50, height: 50, stroke: '#000' }));

  drawer.stage.fire('change');
  return { drawer, rect, ellipse, top, selectWidget: drawer.getWidget<SelectWidget>('selection')! };
};

const classNames = (drawer: Drawer) =>
  drawer
    .getDrawingShapes()
    .map((n) => (n instanceof Group ? `Group(${n.getChildren().map((c) => c.getClassName())})` : n.getClassName()));

const rectOf = (shape: { getClientRect: () => { x: number; y: number; width: number; height: number } }) => {
  const { x, y, width, height } = shape.getClientRect();

  return [x, y, width, height].map((n) => Math.round(n * 100) / 100);
};

/** Press and release on a shape (konva hit not available in jsdom) */
const click = (drawer: Drawer, shape: Shape<ShapeConfig>, x: number, y: number, evt: Partial<MouseEvent> = {}) => {
  setPointer(drawer, x, y);
  shape.fire('mousedown', { evt: { button: 0, preventDefault() {}, ...evt } }, true);
  fireMouse(drawer, 'mouseup', x, y, evt);
};

describe('Groups', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Shapes of the same group are grouped at place of top one, group is selected and undone', () => {
    const { drawer, rect, ellipse, top } = createShapes();

    expect(drawer.canGroupShapes([rect])).toBe(false);
    expect(drawer.groupShapes([rect])).toBeNull();

    const group = drawer.groupShapes([ellipse, rect])!;
    expect(classNames(drawer)).toEqual(['Group(Rect,Ellipse)', 'Rect']);
    expect(drawer.getDrawingShapes()[1]).toBe(top);
    expect(group.hasName(shapeName.group)).toBe(true);
    expect(drawer.getShapeLabel(group)).toBe('Group');
    expect(drawer.getSelectedShapes()).toEqual([group]);
    // moved with group
    expect(rect.draggable()).toBe(false);
    expect(group.id()).toBeTruthy();

    // group of groups
    const parent = drawer.groupShapes([group, top])!;
    expect(classNames(drawer)).toEqual(['Group(Group,Rect)']);
    expect(drawer.canGroupShapes([rect, top])).toBe(false);

    drawer.undoRedo.undo();
    expect(classNames(drawer)).toEqual(['Group(Rect,Ellipse)', 'Rect']);
    drawer.undoRedo.undo();
    expect(classNames(drawer)).toEqual(['Rect', 'Ellipse', 'Rect']);
    expect(parent.getLayer()).toBeFalsy();
  });

  it('Ungrouped shapes keep their look, place, hidden and locked states', () => {
    const { drawer, rect, ellipse } = createShapes();
    const group = drawer.groupShapes([rect, ellipse])!;

    // moved, scaled and rotated with group
    group.setAttrs({ x: 40, y: 20, scaleX: 1.5, scaleY: 0.5, rotation: 30 });
    group.listening(false);
    const boxes = [rect, ellipse].map(rectOf);

    expect(drawer.ungroupShapes([group])).toEqual([rect, ellipse]);
    expect(classNames(drawer)).toEqual(['Rect', 'Ellipse', 'Rect']);
    expect([rect, ellipse].map(rectOf)).toEqual(boxes);
    expect(rect.listening()).toBe(false);
    expect(ellipse.draggable()).toBe(false);
  });

  it('Click on a shape of a group selects the group, Ctrl + click the shape, dragged alone', () => {
    const { drawer, rect, ellipse, selectWidget } = createShapes();
    const group = drawer.groupShapes([rect, ellipse])!;

    selectWidget.setActive(true);
    selectWidget.clearSelection();
    click(drawer, rect, 10, 10);
    expect(drawer.getSelectedShapes()).toEqual([group]);
    expect(group.draggable()).toBe(true);

    click(drawer, rect, 10, 10, { ctrlKey: true });
    expect(drawer.getSelectedShapes()).toEqual([rect]);
    expect(rect.draggable()).toBe(true);

    selectWidget.clearSelection();
    expect(rect.draggable()).toBe(false);
  });

  it('Styles apply to shapes of selected groups, duplicates and deletions of groups', () => {
    const { drawer, rect, ellipse, selectWidget } = createShapes();
    const group = drawer.groupShapes([rect, ellipse])!;

    drawer.setStrokeColor('#e03131');
    expect([rect.stroke(), ellipse.stroke()]).toEqual(['#e03131', '#e03131']);

    const [copy] = drawer.duplicateShapes([group]) as Group[];
    const ids = [copy, ...copy.getChildren()].map((n) => n.id());
    expect(ids.every((id) => id)).toBe(true);
    expect(ids.some((id) => [group, rect, ellipse].some((n) => n.id() === id))).toBe(false);

    // empty group removed with its last shape
    selectWidget.clearSelection();
    drawer.deleteShapes([rect]);
    expect(group.getLayer()).toBeTruthy();
    drawer.deleteShapes([ellipse]);
    expect(group.getLayer()).toBeFalsy();
  });

  it('Eraser click erases whole group, change saved', () => {
    const { drawer, rect, ellipse } = createShapes();
    const onChange = vi.fn();

    drawer.groupShapes([rect, ellipse]);
    drawer.on('change', onChange);
    drawer.getWidget<EraserWidget>('eraser')!.setActive(true);
    // no hit canvas in jsdom
    vi.spyOn(drawer.drawLayer, 'getIntersection').mockReturnValue(rect);
    fireMouse(drawer, 'mousedown', 10, 10);
    fireMouse(drawer, 'mouseup', 10, 10);

    expect(classNames(drawer)).toEqual(['Rect']);
    expect(onChange).toHaveBeenCalled();
  });

  it('Groups are saved in files, exported in svg', async () => {
    const { drawer, rect, ellipse } = createShapes();
    const group = drawer.groupShapes([rect, ellipse])!;

    group.setAttrs({ x: 10, label: 'Logo' });
    const file = parseDrawingFile(JSON.stringify(drawer.getDrawingFile()));
    expect(file.shapes[0]).toMatchObject({ className: 'Group', attrs: { label: 'Logo' } });
    expect(file.shapes[0].children!.map((c) => c.className)).toEqual(['Rect', 'Ellipse']);

    // other nodes of files are ignored
    const unsafe = parseDrawingFile(
      JSON.stringify({ ...file, shapes: [{ ...file.shapes[0], children: [{ className: 'Star', attrs: {} }] }] })
    );
    expect(unsafe.shapes[0].children).toEqual([]);

    const other = createDrawer();
    other.loadDrawing(file);
    expect(classNames(other)).toEqual(['Group(Rect,Ellipse)', 'Rect']);
    expect((other.getDrawingShapes()[0] as Group).getChildren()[0].id()).toBe(rect.id());

    const blob = await drawer.exportImage('svg', { selected: false });
    const svg = await new Promise<string>((resolve) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blob);
    });
    expect(svg).toMatch(/<g transform="matrix\(1 0 0 1 10 0\)"><g[^>]*><rect/);
    expect(svg).toContain('<ellipse');
  });

  it('Ctrl+G groups selection, Ctrl+Shift+G ungroups it, selection menu shows the possible one', () => {
    const { drawer, rect, ellipse, selectWidget } = createShapes();
    const menu = drawer.selectionMenu!;

    selectWidget.select([rect, ellipse]);
    menu.update();
    expect(menu.$groupBtn.hidden).toBe(false);
    expect(menu.$ungroupBtn.hidden).toBe(true);

    expect(keydown(drawer, { key: 'g', ctrlKey: true })).toBe(false);
    expect(classNames(drawer)).toEqual(['Group(Rect,Ellipse)', 'Rect']);
    menu.update();
    expect(menu.$groupBtn.hidden).toBe(true);
    expect(menu.$ungroupBtn.hidden).toBe(false);

    keydown(drawer, { key: 'G', ctrlKey: true, shiftKey: true });
    expect(classNames(drawer)).toEqual(['Rect', 'Ellipse', 'Rect']);
    expect(drawer.getSelectedShapes()).toEqual([rect, ellipse]);
  });

  it('Layers panel lists shapes of expanded groups, reordered in their group', () => {
    const { drawer, rect, ellipse, selectWidget } = createShapes();
    const panel = drawer.layersPanel!;
    const rows = () =>
      [...panel.$list.querySelectorAll<HTMLElement>('.drawer-layers-item')].map(
        ($item) => '-'.repeat(Number($item.style.getPropertyValue('--depth'))) + $item.textContent!.trim()
      );

    panel.toggle(true);
    const group = drawer.groupShapes([rect, ellipse])!;
    drawer.setShapeLabel(group, 'Logo');
    expect(rows()).toEqual(['Rectangle', 'Logo']);
    expect(panel.$ungroupButton.disabled).toBe(false);
    expect(panel.$groupButton.disabled).toBe(true);

    const $toggle = panel.$list.querySelector<HTMLButtonElement>('[data-part="toggle"]')!;
    expect($toggle.getAttribute('aria-expanded')).toBe('false');
    $toggle.click();
    expect(rows()).toEqual(['Rectangle', 'Logo', '-Ellipse', '-Rectangle']);

    // Alt + Up in group: Ellipse can't go higher, Rectangle goes above it
    const $names = () => [...panel.$list.querySelectorAll<HTMLElement>('[data-part="name"]')];
    $names()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }));
    expect(rows()).toEqual(['Rectangle', 'Logo', '-Ellipse', '-Rectangle']);
    $names()[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }));
    expect(rows()).toEqual(['Rectangle', 'Logo', '-Rectangle', '-Ellipse']);
    expect(group.getChildren()).toEqual([ellipse, rect]);

    // shape of group selected from panel
    $names()[2].click();
    expect(drawer.getSelectedShapes()).toEqual([rect]);

    // collapsed with Left arrow, expanded again when a shape of group is selected
    $names()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(rows()).toEqual(['Rectangle', 'Logo']);
    selectWidget.select([ellipse]);
    expect(rows()).toEqual(['Rectangle', 'Logo', '-Rectangle', '-Ellipse']);
  });
});
