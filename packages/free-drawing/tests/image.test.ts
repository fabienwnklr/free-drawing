import { describe, expect, it, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Image } from 'konva/lib/shapes/Image';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { shapeName } from '@/constants';
import { getImagesToLoad, isImageData, parseFiles } from '@/utils/image';
import { parseDrawingFile } from '@/utils/drawingFile';
import { renderSvg } from '@/utils/export';
import { createDrawer } from './helpers';

/** Image file of 1 x 1 pixel */
const pngData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** Element shown by an image */
const elementOf = (image: Image) => image.image() as HTMLImageElement | undefined;

describe('Images', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Exports of images still loading wait for them: not drawn empty', async () => {
    const drawer = createDrawer();
    const image = (await drawer.addImage({ data: pngData, width: 10, height: 10 }))!;
    const element = elementOf(image)!;
    let release: () => void = () => {};
    let exported = false;

    Object.defineProperty(element, 'complete', { value: false, configurable: true });
    element.decode = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
    expect(getImagesToLoad([image])).toEqual([element]);

    const png = drawer.exportImage('png').then((blob) => {
      exported = true;
      return blob;
    });

    await new Promise((resolve) => setTimeout(resolve));
    expect(element.decode).toHaveBeenCalled();
    expect(exported).toBe(false);
    release();
    expect(await png).toBeInstanceOf(Blob);
  });

  it('Image files: data URLs of PNG, JPEG, WebP or GIF images only, from anyone', () => {
    expect(isImageData(pngData)).toBe(true);
    expect(isImageData('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBe(false);
    expect(isImageData('https://example.com/image.png')).toBe(false);
    expect(isImageData('data:image/png;base64,<script>')).toBe(false);
    expect(
      parseFiles({ good: pngData, 'bad id!': pngData, other: 'https://example.com/a.png', ['__proto__']: pngData })
    ).toEqual({ good: pngData });
    expect(parseFiles(['a'])).toEqual({});
    expect(parseFiles(null)).toEqual({});
  });

  it('Image added in the view: its file kept by id, shown, selected, never enlarged', async () => {
    const drawer = createDrawer({ width: 1000, height: 800 });
    const changes = vi.fn();

    drawer.on('change', changes);
    const image = (await drawer.addImage({ data: pngData, width: 400, height: 200 }, { x: 100, y: 100 }))!;
    const fileId = image.getAttr('fileId');

    expect(image.hasName(shapeName.image)).toBe(true);
    // hash of its content
    expect(fileId).toMatch(/^[0-9a-f]{32}$/);
    expect(drawer.files.get(fileId)).toBe(pngData);
    expect(elementOf(image)?.src).toBe(pngData);
    expect([image.x(), image.y(), image.width(), image.height()]).toEqual([-100, 0, 400, 200]);
    expect(drawer.getSelectedShapes()).toEqual([image]);
    expect(changes).toHaveBeenCalled();

    // the same image twice: one file; a big one: 60 % of the view at most
    const big = (await drawer.addImage({ data: pngData, width: 4000, height: 2000 }))!;

    expect(big.getAttr('fileId')).toBe(fileId);
    expect(drawer.files.size).toBe(1);
    expect([big.width(), big.height()]).toEqual([480, 240]);
  });

  it('Not an image: nothing added, error shown', async () => {
    const drawer = createDrawer({ language: 'en' });
    const toast = vi.spyOn(drawer, 'toast');

    expect(await drawer.addImage({ data: 'data:text/html;base64,PGI+', width: 10, height: 10 })).toBeNull();
    expect(await drawer.addImage(new Blob(['text'], { type: 'text/plain' }))).toBeNull();
    expect(drawer.getDrawingShapes()).toHaveLength(0);
    expect(toast).toHaveBeenLastCalledWith(expect.stringMatching(/^Image not added: not an image/), 'error');
  });

  it('Files of the images in drawing files and links, valid ones read back', async () => {
    const drawer = createDrawer();
    const image = (await drawer.addImage({ data: pngData, width: 40, height: 20 }))!;
    const fileId = image.getAttr('fileId');

    drawer.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10 }));

    const file = drawer.getDrawingFile();

    expect(file.files).toEqual({ [fileId]: pngData });
    // only files of the shapes written
    expect(drawer.getDrawingFile([drawer.getDrawingShapes()[1]]).files).toBeUndefined();

    const read = parseDrawingFile(JSON.stringify({ ...file, files: { ...file.files, bad: 'data:text/plain,x' } }));

    expect(read.files).toEqual({ [fileId]: pngData });
    expect(read.shapes[0]).toMatchObject({ className: 'Image', attrs: { fileId } });

    // opened in another drawer: images shown from the files of the drawing
    const other = createDrawer();

    other.loadDrawing(file);
    expect(elementOf(other.getDrawingShapes()[0] as Image)?.src).toBe(pngData);
  });

  it('Files saved in the browser with the drawing, images shown again; undo shows a removed image', async () => {
    const drawer = createDrawer();
    const image = (await drawer.addImage({ data: pngData, width: 40, height: 20 }))!;
    const key = drawer.options.localStorageKey;

    drawer.save();
    expect(JSON.parse(localStorage.getItem(`${key}-files`)!)).toEqual({ [image.getAttr('fileId')]: pngData });

    const loaded = createDrawer({ localStorageKey: key });

    expect(elementOf(loaded.getDrawingShapes()[0] as Image)?.src).toBe(pngData);

    // removed, then put back by undo: node created again from history
    drawer.deleteShapes([image]);
    drawer.undoRedo.undo();
    expect(elementOf(drawer.getDrawingShapes()[0] as Image)?.src).toBe(pngData);

    // no image left: no files saved
    drawer.deleteShapes([drawer.getDrawingShapes()[0]]);
    drawer.save();
    expect(localStorage.getItem(`${key}-files`)).toBeNull();
  });

  it('Svg export: the image with its file; options of a selected image: opacity, not stroke nor color', async () => {
    const drawer = createDrawer();
    const image = (await drawer.addImage({ data: pngData, width: 40, height: 20 }, { x: 20, y: 10 }))!;
    const svg = renderSvg([image], { x: 0, y: 0, width: 40, height: 20 });

    expect(svg).toContain(`<image href="${pngData}" width="40" height="20" preserveAspectRatio="none"/>`);

    const selectWidget = drawer.getWidget<SelectWidget>('selection')!;
    const { overlay } = selectWidget;

    selectWidget.select([image]);
    expect(overlay.$strokeColorContainer.style.display).toBe('none');
    expect(overlay.$strokeWidthContainer.style.display).toBe('none');
    expect(overlay.$opacityContainer.style.display).not.toBe('none');
    // proportions kept when resized
    expect(selectWidget.transformer.keepRatio()).toBe(true);

    // with a rectangle: its options apply to it, not to the image
    const rect = drawer.addShape(new Rect({ name: shapeName.rect, width: 10, height: 10, stroke: '#000' }));

    selectWidget.select([image, rect]);
    selectWidget.setColor('#e03131');
    selectWidget.setStrokeWidth(8);
    expect(rect.stroke()).toBe('#e03131');
    expect(image.stroke()).toBeUndefined();
    expect(image.strokeWidth()).not.toBe(8);
  });

  it('Image tool of the toolbar: its button inserts an image, never the active tool, disabled in read only', () => {
    const drawer = createDrawer({ tool: 'image' });
    const widget = drawer.getWidget<BaseWidget>('image')!;
    const insertImage = vi.spyOn(drawer, 'insertImage').mockResolvedValue(null);
    const ids = [...drawer.toolbar.widgets.keys()];

    // after the arrow, its own button (not in the group of more tools)
    expect(ids.indexOf('image')).toBe(ids.indexOf('arrow') + 1);
    expect(drawer.toolbar.getButton(widget)).toBe(widget.$button);
    // first tool: a tool, not an action
    expect(drawer.activeTool).not.toBe('image');

    const tool = drawer.activeTool;

    widget.$button.click();
    expect(insertImage).toHaveBeenCalledOnce();
    expect(drawer.activeTool).toBe(tool);

    insertImage.mockClear();
    drawer.setReadOnly(true);
    widget.$button.click();
    expect(insertImage).not.toHaveBeenCalled();
  });

  it('Pasted image file added at the pointer, not in read only', () => {
    const drawer = createDrawer();
    const addImage = vi.spyOn(drawer, 'addImage').mockResolvedValue(null);
    const paste = () => {
      const event = new Event('paste', { bubbles: true, cancelable: true });
      const file = new File(['png'], 'screenshot.png', { type: 'image/png' });

      Object.defineProperty(event, 'clipboardData', { value: { files: [file], getData: () => '' } });
      // fired on the focused element (here the drawer), listened on the document
      drawer.$drawerContainer.dispatchEvent(event);
      return file;
    };

    drawer.$drawerContainer.focus();
    const file = paste();

    expect(addImage).toHaveBeenCalledWith(file, expect.objectContaining({ x: expect.any(Number) }));

    addImage.mockClear();
    drawer.setReadOnly(true);
    paste();
    expect(addImage).not.toHaveBeenCalled();
  });
});
