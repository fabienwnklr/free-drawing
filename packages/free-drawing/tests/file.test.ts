import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { parseDrawingFile } from '@/utils/drawingFile';
import { createDrawer, drag, keydown } from './helpers';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
  if (typeof window.URL.revokeObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: noOp });
  }
});

const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Drawing files and links', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Drawing file contains background and shapes, loading it replaces drawing (undo restores it)', () => {
    const source = createDrawer();
    source.getWidget<TextWidget>('text')!.addTextNode('hello');
    source.setBgColor('#f8f9fa');
    const file = source.getDrawingFile();

    expect(file).toMatchObject({ type: 'free-drawing', version: 1, background: '#f8f9fa' });
    expect(file.shapes).toHaveLength(1);

    const drawer = createDrawer();
    const rect = drawer.addShape(new Rect({ name: 'drawer-rect', width: 10, height: 10 }));
    drawer.stage.fire('change');
    const background = drawer.background.fill();

    drawer.loadDrawing(JSON.stringify(file));
    expect(drawer.getDrawingShapes().map((s) => s.attrs.text)).toEqual(['hello']);
    expect(drawer.background.fill()).toBe('#f8f9fa');

    // background of the drawing too
    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes().map((s) => s.id())).toEqual([rect.id()]);
    expect(drawer.background.fill()).toBe(background);
    // shown in the settings menu
    const pressed = drawer.setting.$bgColorBtnContainer.querySelector('[aria-pressed="true"]');

    expect(pressed?.getAttribute('data-bg-color')).toBe(background);
    drawer.undoRedo.redo();
    expect(drawer.background.fill()).toBe('#f8f9fa');

    // background changed alone
    drawer.setBgColor('#fffce8');
    drawer.undoRedo.undo();
    expect(drawer.background.fill()).toBe('#f8f9fa');
    expect(drawer.getDrawingShapes().map((s) => s.attrs.text)).toEqual(['hello']);
    drawer.undoRedo.redo();
    expect(drawer.background.fill()).toBe('#fffce8');
  });

  it('Invalid files are rejected, other shapes than drawing ones are ignored', () => {
    const drawer = createDrawer();

    expect(() => drawer.loadDrawing('{}')).toThrow();
    expect(() => drawer.loadDrawing('not json')).toThrow();

    drawer.loadDrawing(
      JSON.stringify({
        type: 'free-drawing',
        version: 1,
        background: '#fff',
        shapes: [
          { className: 'Layer', attrs: {} },
          { className: 'Image', attrs: {} },
          { className: 'Rect', attrs: { width: 10, height: 10 }, children: [{ className: 'Rect', attrs: {} }] },
        ],
      })
    );
    expect(drawer.getDrawingShapes().map((s) => s.getClassName())).toEqual(['Rect']);
  });

  it('Crafted file: attributes of wrong types and incomplete frames ignored, drawing never emptied by an error', () => {
    const drawer = createDrawer();
    const rect = drawer.addShape(new Rect({ name: 'drawer-rect', width: 10, height: 10 }));
    drawer.stage.fire('change');
    const path = (attrs: object) => ({ className: 'Path', attrs: { name: 'drawer-path', ...attrs } });

    drawer.loadDrawing(
      JSON.stringify({
        type: 'free-drawing',
        version: 1,
        background: '#fff',
        shapes: [
          // frames without their parts
          { className: 'Frame', attrs: { id: 'frame', width: 100, height: 100 }, children: [] },
          { className: 'Frame', attrs: { id: 'frame-2', width: 100, height: 100 } },
          // threw while created
          path({ id: 'path', data: 5 }),
          { className: 'Group', attrs: { id: 'group' }, children: [path({ id: 'child', data: {} })] },
          { className: 'Rect', attrs: { id: 'named', name: 5, width: 10, height: 10 } },
          // threw while drawn
          { className: 'Rect', attrs: { id: 'dashed', dash: 'x', stroke: '#000', width: 10, height: 10 } },
          { className: 'Rect', attrs: { id: 'pattern', fillPatternImage: 'x', width: 10, height: 10 } },
          // properties of konva set by methods, data of plugins kept
          { className: 'Rect', attrs: { id: 'data', zIndex: 3, attrs: { x: 1 }, stamp: { kind: 'star' } } },
        ],
      })
    );

    const shapes = new Map(drawer.getDrawingShapes().map((shape) => [shape.id(), shape.attrs]));
    expect([...shapes.keys()]).toEqual(['path', 'group', 'named', 'dashed', 'pattern', 'data']);
    expect(shapes.get('path')!.data).toBeUndefined();
    expect(shapes.get('named')!.name).toBeUndefined();
    expect(shapes.get('dashed')!.dash).toBeUndefined();
    expect(shapes.get('pattern')!.fillPatternImage).toBeUndefined();
    expect(shapes.get('data')!.stamp).toEqual({ kind: 'star' });
    // `attrs` would have set x
    expect(shapes.get('data')!.x).toBeUndefined();
    expect(shapes.get('data')!.zIndex).toBeUndefined();
    expect(() => drawer.drawLayer.draw()).not.toThrow();

    // error while creating a shape: drawing kept
    const create = vi.spyOn(Rect.prototype, 'setAttrs').mockImplementationOnce(() => {
      throw new Error('broken');
    });
    expect(() =>
      drawer.loadDrawing(JSON.stringify({ ...drawer.getDrawingFile(), shapes: [rect.toObject()] }))
    ).toThrow();
    create.mockRestore();
    expect(drawer.getDrawingShapes()).toHaveLength(6);
  });

  it('File of every kind of shape is read back unchanged', () => {
    const drawer = createDrawer({ keepTool: true });
    const tools = [
      'brush',
      'highlighter',
      'line',
      'square',
      'circle',
      'arrow',
      'triangle',
      'diamond',
      'heart',
      'cloud',
    ];

    drawer.setStrokeStyle('dashed');
    drawer.setFillColor('#ffec99');
    drawer.setEdges('round');
    drawer.setOpacity(0.5);
    for (const [index, tool] of [...tools, 'frame'].entries()) {
      drawer.getWidget<BaseWidget>(tool as BaseWidget['id'])!.setActive(true);
      drag(drawer, [10, 10 + index * 60], [80, 50 + index * 60]);
    }
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('hello');
    drawer.getWidget<SelectWidget>('selection')!.select([text]);
    drawer.setTextStyle({ fontStyle: 'italic bold', textDecoration: 'underline', align: 'center' });
    const shapes = drawer.getDrawingShapes();
    drawer.setShapeLink('example.com', [shapes[0]]);
    drawer.setShapeLabel(shapes[1], 'named');
    drawer.setShapesHidden(true, [shapes[4]]);
    drawer.setShapesLocked(true, [shapes[5]]);
    drawer.groupShapes([shapes[2], shapes[3]]);
    const file = drawer.getDrawingFile();

    expect(file.shapes.length).toBe(tools.length + 1);
    expect(parseDrawingFile(JSON.stringify(file))).toEqual(file);
  });

  it('Save as downloads a .freedrawing file (no save dialog)', async () => {
    const drawer = createDrawer();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('drawing.freedrawing');
    });

    await drawer.saveAs();
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it('Link contains drawing, loaded by drawer of the page which opens it', async () => {
    const source = createDrawer({ id: 'drawer-link' });
    source.getWidget<TextWidget>('text')!.addTextNode('from link');
    const link = await source.getLink();

    expect(link).toContain('#drawer-link=');

    window.location.hash = new URL(link).hash;
    const drawer = createDrawer({ id: 'drawer-link' });
    await wait();

    expect(drawer.getDrawingShapes().map((s) => s.attrs.text)).toEqual(['from link']);
    // link drawing loaded once, not on next page load
    expect(window.location.hash).toBe('');
  });

  it('Link of a drawer without id opened by any drawer without id (remounted by an app), also links of previous versions', async () => {
    const texts = (drawer: ReturnType<typeof createDrawer>) => drawer.getDrawingShapes().map((s) => s.attrs.text);
    const source = createDrawer();
    source.getWidget<TextWidget>('text')!.addTextNode('no id');
    const link = await source.getLink();
    const hash = new URL(link).hash;

    expect(hash).toMatch(/^#drawing=/);

    // drawer of another id (drawer-<n> of the page), only the first one of the page
    window.location.hash = hash;
    const drawer = createDrawer();
    const second = createDrawer();
    await wait();
    expect(texts(drawer)).toEqual(['no id']);
    expect(texts(second)).toEqual([]);
    expect(window.location.hash).toBe('');

    // link of a previous version (`#drawer-<n>=`)
    window.location.hash = hash.replace('#drawing=', '#drawer-7=');
    const old = createDrawer();
    await wait();
    expect(texts(old)).toEqual(['no id']);

    // link of a drawer of an app given id: not opened by drawers without it
    window.location.hash = hash.replace('#drawing=', '#notes=');
    const other = createDrawer();
    await wait();
    expect(texts(other)).toEqual([]);
    const notes = createDrawer({ id: 'notes' });
    await wait();
    expect(texts(notes)).toEqual(['no id']);
    expect(window.location.hash).toBe('');
  });

  it('Opened link shown in the view: centered, zoomed out when big, not zoomed in', async () => {
    /** View area contains the box of the shapes */
    const shown = (drawer: ReturnType<typeof createDrawer>) => {
      const view = drawer.getViewArea();

      return drawer.getDrawingShapes().every((shape) => {
        const { x, y, width, height } = shape.getClientRect({ relativeTo: drawer.drawLayer });

        return x >= view.x && y >= view.y && x + width <= view.x + view.width && y + height <= view.y + view.height;
      });
    };
    const source = createDrawer();

    // far from the origin
    source.addShape(new Rect({ x: 5000, y: 4000, width: 200, height: 100, fill: '#000' }));
    window.location.hash = new URL(await source.getLink()).hash;

    const drawer = createDrawer();

    await wait();
    expect(drawer.getDrawingShapes()).toHaveLength(1);
    expect(drawer.getZoomLevel()).toBe(1);
    expect(shown(drawer)).toBe(true);

    // bigger than the view: zoomed out
    drawer.addShape(new Rect({ x: -3000, y: 0, width: 200, height: 100, fill: '#000' }));
    drawer.zoomToFit();
    expect(drawer.getZoomLevel()).toBeLessThan(1);
    expect(shown(drawer)).toBe(true);

    // nothing to show: view kept
    const empty = createDrawer();
    const position = empty.stage.position();

    empty.zoomToFit();
    expect(empty.stage.position()).toEqual(position);
  });

  it('Menu items and keyboard shortcuts', () => {
    const drawer = createDrawer();
    const saveAs = vi.spyOn(drawer, 'saveAs').mockResolvedValue();
    const saveNow = vi.spyOn(drawer, 'saveNow').mockResolvedValue();
    const open = vi.spyOn(drawer, 'open').mockResolvedValue();
    const { $openButton, $saveButton, $saveAsButton, $copyLinkButton } = drawer.setting;

    expect($openButton.getAttribute('aria-keyshortcuts')).toBe('Control+O');
    expect($saveButton.getAttribute('aria-keyshortcuts')).toBe('Control+S');
    expect($saveAsButton.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+S');
    expect($copyLinkButton.isConnected).toBe(true);

    // browser shortcuts (save page, open file) replaced: drawing saved, Shift: file downloaded
    expect(keydown(drawer, { key: 's', ctrlKey: true })).toBe(false);
    expect(saveNow).toHaveBeenCalledTimes(1);
    expect(saveAs).not.toHaveBeenCalled();
    expect(keydown(drawer, { key: 'S', metaKey: true, shiftKey: true })).toBe(false);
    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(saveNow).toHaveBeenCalledTimes(1);
    expect(keydown(drawer, { key: 'o', ctrlKey: true })).toBe(false);
    expect(open).toHaveBeenCalled();
  });
});
