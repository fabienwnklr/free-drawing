import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { shapeName } from '@/constants';
import { parseLibraryFile } from '@/utils/library';
import { createDrawer, keydown } from './helpers';

/** Rectangle with a text, ellipse, arrow linking them, arrow linked to a shape out of the item */
const createShapes = (drawer: Drawer) => {
  const rect = drawer.addShape(
    new Rect({ name: shapeName.rect, x: 0, y: 0, width: 100, height: 50, fill: '#a5d8ff', stroke: '#000' })
  );
  const text = drawer.addShape(new Text({ name: shapeName.text, text: 'Start\nhere', containerId: rect.id() }));
  const ellipse = drawer.addShape(
    new Ellipse({ name: shapeName.ellipse, x: 300, y: 25, radiusX: 50, radiusY: 25, stroke: '#000' })
  );
  const outside = drawer.addShape(new Rect({ name: shapeName.rect, x: 0, y: 500, width: 40, height: 40 }));
  const arrow = drawer.addShape(
    new Arrow({
      name: shapeName.arrow,
      points: [106, 25, 244, 25],
      startBinding: rect.id(),
      endBinding: ellipse.id(),
    })
  );
  const unlinked = drawer.addShape(
    new Arrow({
      name: shapeName.arrow,
      points: [300, 60, 20, 494],
      startBinding: ellipse.id(),
      endBinding: outside.id(),
    })
  );

  drawer.stage.fire('change');
  return { rect, text, ellipse, outside, arrow, unlinked };
};

describe('Library', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Selection saved as an item, kept in the browser for the drawings of the drawer', () => {
    const localStorageKey = `library-${Math.random()}`;
    const drawer = createDrawer({ localStorageKey });
    const { rect, text, ellipse } = createShapes(drawer);
    const onChange = vi.fn();

    drawer.on('library.change', onChange);
    expect(drawer.library.add([])).toBeNull();

    // rectangle with its text: named by its text
    const item = drawer.library.add([rect, text])!;
    expect(item.name).toBe('Start');
    expect(item.shapes.map((state) => state.className)).toEqual(['Rect', 'Text']);
    expect(onChange).toHaveBeenLastCalledWith(drawer.library.items);
    expect(drawer.library.add([ellipse, rect])!.name).toBe('2 shapes');

    // another drawer of the same key (another drawing of the app): same library
    const other = createDrawer({ localStorageKey });
    expect(other.library.items.map(({ name }) => name)).toEqual(['Start', '2 shapes']);

    other.library.rename(item.id, '  Card ');
    other.library.remove(other.library.items[1].id);
    expect(other.library.items.map(({ name }) => name)).toEqual(['Card']);
    expect(createDrawer({ localStorageKey }).library.items).toHaveLength(1);
  });

  it('Item inserted centered on a point: new ids, links and texts kept between its shapes, selected, one step', () => {
    const drawer = createDrawer();
    const { rect, text, ellipse, arrow, unlinked } = createShapes(drawer);
    const item = drawer.library.add([rect, text, ellipse, arrow, unlinked])!;
    const count = drawer.getDrawingShapes().length;

    const inserted = drawer.library.insert(item.id, { x: 1000, y: 1000 });
    const [rectCopy, textCopy, ellipseCopy, arrowCopy, unlinkedCopy] = inserted;
    const box = { x: rectCopy.x(), right: ellipseCopy.x() + 50 };

    expect(drawer.getDrawingShapes()).toHaveLength(count + 5);
    expect(inserted.every((shape, i) => shape.id() !== [rect, text, ellipse, arrow, unlinked][i].id())).toBe(true);
    // text in the copy of the rectangle, arrow between the copies, link to a shape out of the item removed
    expect(textCopy.attrs.containerId).toBe(rectCopy.id());
    expect([arrowCopy.attrs.startBinding, arrowCopy.attrs.endBinding]).toEqual([rectCopy.id(), ellipseCopy.id()]);
    expect([unlinkedCopy.attrs.startBinding, unlinkedCopy.attrs.endBinding]).toEqual([ellipseCopy.id(), undefined]);
    // around the point
    expect(Math.abs((box.x + box.right) / 2 - 1000)).toBeLessThan(160);
    expect(drawer.activeTool).toBe('selection');
    expect(drawer.getSelectedShapes()).toEqual(expect.arrayContaining([rectCopy, ellipseCopy]));

    // one step of history
    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes()).toHaveLength(count);
    drawer.getWidget<SelectWidget>('selection')!.clearSelection();
  });

  it('Library files: exported items imported in another library, invalid shapes and items left out', () => {
    const drawer = createDrawer();
    const { rect } = createShapes(drawer);

    drawer.library.add([rect]);

    const file = drawer.library.toFile();
    const other = createDrawer();

    expect(file).toMatchObject({ type: 'free-drawing-library', version: 1 });
    expect(other.library.import(JSON.stringify(file))).toBe(1);
    // already there
    expect(other.library.import(JSON.stringify(file))).toBe(0);

    const crafted = {
      type: 'free-drawing-library',
      version: 1,
      items: [
        { id: 'a', name: 'Script', shapes: [{ className: 'Star', attrs: {} }] },
        {
          id: 'b',
          name: 'Mixed',
          shapes: [
            { className: 'Rect', attrs: { width: 10 } },
            { className: 'Html', attrs: {} },
          ],
        },
        { id: '../x', name: 'Bad id', shapes: [{ className: 'Rect', attrs: {} }] },
      ],
    };

    expect(parseLibraryFile(JSON.stringify(crafted)).map(({ id, shapes }) => [id, shapes.length])).toEqual([['b', 1]]);
    expect(() => parseLibraryFile('{"type":"free-drawing"}')).toThrow('not a library file');
  });

  it('Panel: header button and Alt+B, one panel at the place of the layers panel, items inserted by click', () => {
    const drawer = createDrawer();
    const panel = drawer.libraryPanel!;
    const { rect, text } = createShapes(drawer);
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    expect(panel.$button.getAttribute('aria-label')).toBe('Library');
    keydown(drawer, { key: 'b', code: 'KeyB', altKey: true });
    expect(panel.isVisible()).toBe(true);
    expect(panel.$empty.hidden).toBe(false);
    expect(panel.$addButton.disabled).toBe(true);
    drawer.layersPanel!.toggle(true);
    expect(panel.isVisible()).toBe(false);
    panel.toggle(true);
    expect(drawer.layersPanel!.isVisible()).toBe(false);

    selectWidget.setActive(true);
    selectWidget.select([rect]);
    expect(panel.$addButton.disabled).toBe(false);
    panel.$addButton.click();
    expect(drawer.library.items).toHaveLength(1);

    const $insert = panel.$list.querySelector<HTMLButtonElement>('.drawer-library-insert')!;
    expect($insert.getAttribute('aria-label')).toBe('Insert Start');
    expect(panel.$list.querySelector('img')!.src).toMatch(/^data:image\/svg\+xml/);
    $insert.click();
    expect(drawer.getDrawingShapes()).toHaveLength(8);

    // read only: not inserted
    drawer.setReadOnly(true);
    expect(panel.$list.querySelector<HTMLButtonElement>('.drawer-library-insert')!.disabled).toBe(true);
    drawer.setReadOnly(false);

    panel.$list.querySelector<HTMLButtonElement>('.drawer-library-remove')!.click();
    expect(drawer.library.items).toHaveLength(0);
    expect(text.attrs.containerId).toBe(rect.id());
    panel.toggle(false);
  });

  it('Panel: focus never on a disabled button (read only started, last item removed, selection cleared)', () => {
    // without pan tool (else read only activates it, the drawer takes the focus)
    const drawer = createDrawer({ widgets: ['selection', 'brush', 'text'] });
    const panel = drawer.libraryPanel!;
    const { rect } = createShapes(drawer);
    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;

    panel.toggle(true);
    selectWidget.setActive(true);
    selectWidget.select([rect]);
    panel.$addButton.click();

    // insertion disabled: remove button of its row
    panel.$list.querySelector<HTMLButtonElement>('.drawer-library-insert')!.focus();
    drawer.setReadOnly(true);
    expect(document.activeElement).toBe(panel.$list.querySelector('.drawer-library-remove'));
    drawer.setReadOnly(false);

    // last item removed, add button disabled (nothing selected): import button
    const $remove = panel.$list.querySelector<HTMLButtonElement>('.drawer-library-remove')!;

    $remove.focus();
    $remove.click();
    expect(document.activeElement).toBe(panel.$importButton);

    // add button disabled with the focus
    selectWidget.select([rect]);
    panel.$addButton.focus();
    selectWidget.clearSelection();
    expect(document.activeElement).toBe(panel.$importButton);
    panel.toggle(false);
  });
});
