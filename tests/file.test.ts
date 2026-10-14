import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { createDrawer, keydown } from './helpers';

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
    expect(drawer.getDrawingShapes().map((s) => s.getAttr('text'))).toEqual(['hello']);
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

    expect(drawer.getDrawingShapes().map((s) => s.getAttr('text'))).toEqual(['from link']);
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
