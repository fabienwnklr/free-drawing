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

    drawer.loadDrawing(JSON.stringify(file));
    expect(drawer.getDrawingShapes().map((s) => s.attrs.text)).toEqual(['hello']);
    expect(drawer.background.fill()).toBe('#f8f9fa');

    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes().map((s) => s.id())).toEqual([rect.id()]);
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

  it('Menu items and keyboard shortcuts', () => {
    const drawer = createDrawer();
    const saveAs = vi.spyOn(drawer, 'saveAs').mockResolvedValue();
    const open = vi.spyOn(drawer, 'open').mockResolvedValue();
    const { $openButton, $saveAsButton, $copyLinkButton } = drawer.setting;

    expect($openButton.getAttribute('aria-keyshortcuts')).toBe('Control+O');
    expect($saveAsButton.getAttribute('aria-keyshortcuts')).toBe('Control+S');
    expect($copyLinkButton.isConnected).toBe(true);

    // browser shortcuts (save page, open file) replaced
    expect(keydown(drawer, { key: 's', ctrlKey: true })).toBe(false);
    expect(saveAs).toHaveBeenCalled();
    expect(keydown(drawer, { key: 'o', ctrlKey: true })).toBe(false);
    expect(open).toHaveBeenCalled();
  });
});
