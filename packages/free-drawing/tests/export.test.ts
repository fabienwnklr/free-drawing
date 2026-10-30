import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Line } from 'konva/lib/shapes/Line';
import { Arrow } from 'konva/lib/shapes/Arrow';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createPdf, getCanvasScale, getExportBox, renderSvg, toDarkColor } from '@/utils/export';
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

const tick = () => new Promise((resolve) => setTimeout(resolve));

// one character per byte (jsdom blob)
const readBinary = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.readAsBinaryString(blob);
  });

const drawerWithShapes = () => {
  const drawer = createDrawer();
  const rect = drawer.addShape(new Rect({ x: 10, y: 10, width: 100, height: 50, stroke: '#000', strokeWidth: 2 }));
  const ellipse = drawer.addShape(
    new Ellipse({ x: 200, y: 50, radiusX: 40, radiusY: 20, stroke: '#1971c2', fill: '#a5d8ff' })
  );
  const brush = drawer.addShape(
    new Line({ points: [0, 100, 20, 120, 40, 110, 60, 130], tension: 0.3, closed: true, fill: '#000', stroke: '#000' })
  );
  const arrow = drawer.addShape(
    new Arrow({ points: [300, 10, 400, 60], stroke: '#e03131', fill: '#e03131', dash: [4, 6] })
  );
  const text = drawer.getWidget<TextWidget>('text')!.addTextNode('Hello <world>');
  drawer.getWidget<SelectWidget>('selection')!.clearSelection();

  return { drawer, rect, ellipse, brush, arrow, text };
};

describe('Export', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Dark mode colors: lightness inverted, transparency kept', () => {
    expect(toDarkColor('#000')).toBe('#ededed');
    expect(toDarkColor('#fff')).toBe('#121212');
    expect(toDarkColor('transparent')).toMatch(/^rgba\(.*, 0\)$/);
  });

  it('Svg contains every drawing shape, in a box around them', () => {
    const { drawer } = drawerWithShapes();
    const shapes = drawer.getExportShapes(false);
    const box = getExportBox(shapes, drawer.drawLayer)!;
    const svg = renderSvg(shapes, box, { background: '#fff' });

    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(svg).toContain(`viewBox="${box.x} ${box.y} ${box.width} ${box.height}"`);
    expect(svg).toContain(`<rect x="${box.x}`);
    expect(svg).toContain('<ellipse rx="40" ry="20" fill="#a5d8ff" stroke="#1971c2"');
    // brush: closed tension curve, filled
    expect(svg).toMatch(/<path d="M0 100C[^"]+Z" fill="#000"/);
    // arrow: dashed line, head without dash
    expect(svg).toContain('stroke-dasharray="4 6"');
    expect(svg).toMatch(
      /<path d="M0 0L-?\d+(\.\d+)? \d+(\.\d+)?L[^"]+Z" transform="translate\(400 60\) rotate\(26.57\)" fill="#e03131"/
    );
    expect(svg).toContain('&lt;world&gt;</text>');

    const dark = renderSvg(shapes, box, { background: '#fff', dark: true });
    expect(dark).toContain('fill="#121212"');
    expect(dark).toContain('stroke="#ededed"');
  });

  it('Colors escaped in svg: a color of a file, a link or another user puts no markup in an export', () => {
    const drawer = createDrawer();
    const fill = '#000" onload="alert(1)"/><script>alert(2)</script><path d="';
    const arrow = drawer.addShape(new Arrow({ points: [0, 0, 100, 50], stroke: '#000', fill }));
    const svg = renderSvg([arrow], getExportBox([arrow], drawer.drawLayer)!);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');

    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('[onload]')).toBeNull();
    // head drawn with the color as it is
    expect(doc.querySelector('path[transform]')!.getAttribute('fill')).toBe(fill);
  });

  it('Svg valid with characters XML forbids (line breaks of Word or PowerPoint, controls, lone surrogates)', () => {
    const drawer = createDrawer();
    const text = drawer.getWidget<TextWidget>('text')!.addTextNode('a\u000bb\u0001c\ud800d\u0008😀');
    const svg = renderSvg([text], getExportBox([text], drawer.drawLayer)!);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');

    expect(doc.querySelector('parsererror')).toBeNull();
    // emoji (pair of surrogates) kept
    expect(doc.querySelector('text')!.textContent).toBe('abcd😀');
  });

  it('Selected shapes are exported when there is a selection, else whole drawing', () => {
    const { drawer, rect, ellipse } = drawerWithShapes();

    expect(drawer.getExportShapes()).toHaveLength(5);
    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([rect, ellipse]);
    expect(drawer.getExportShapes()).toEqual([rect, ellipse]);
    expect(drawer.getExportShapes(false)).toHaveLength(5);
  });

  it('Pixel ratio lowered so the canvas fits the limits of browsers (side, area, smaller on iOS)', () => {
    expect(getCanvasScale({ x: 0, y: 0, width: 1000, height: 500 }, 2)).toBe(2);
    // side of 32767 px at most
    expect(getCanvasScale({ x: 0, y: 0, width: 40000, height: 100 }, 2)).toBeCloseTo(32767 / 40000);
    // area of 16384 x 16384 px at most
    expect(getCanvasScale({ x: 0, y: 0, width: 10000, height: 10000 }, 3)).toBeCloseTo(1.6384);

    // iPhone, iPad (platform of macOS with touch): 4096 x 4096 px at most
    const platform = vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
    // not in jsdom
    const touch = (points: number) =>
      Object.defineProperty(navigator, 'maxTouchPoints', { value: points, configurable: true });

    try {
      expect(getCanvasScale({ x: 0, y: 0, width: 4000, height: 2000 }, 2)).toBeCloseTo(Math.sqrt(4096 ** 2 / 8e6));
      platform.mockReturnValue('MacIntel');
      touch(5);
      expect(getCanvasScale({ x: 0, y: 0, width: 4000, height: 2000 }, 2)).toBeLessThan(2);
      touch(0);
      expect(getCanvasScale({ x: 0, y: 0, width: 4000, height: 2000 }, 2)).toBe(2);
    } finally {
      platform.mockRestore();
      delete (navigator as { maxTouchPoints?: number }).maxTouchPoints;
    }
  });

  it('Big drawing: canvas within the limits, pdf page of the drawing size', async () => {
    const drawer = createDrawer();

    drawer.addShape(new Rect({ x: 0, y: 0, width: 30000, height: 1000, fill: '#000' }));

    const canvas = drawer.exportCanvas({ scale: 2 })!;
    // 30000 + 2 x 16 of padding
    const width = 30032;

    expect(canvas.width).toBeLessThanOrEqual(32767);
    expect(canvas.width).toBeGreaterThan(32760);
    expect(canvas.height / canvas.width).toBeCloseTo(1032 / width, 3);

    // small image: the one of jest-canvas-mock has 4 bytes per pixel (147 MB here)
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: BlobCallback) => callback(new Blob(['jpeg'])));
    const text = await readBinary(await drawer.exportImage('pdf', { scale: 2 }).finally(() => toBlob.mockRestore()));

    // page of the drawing size (sides of the canvas rounded to pixels: less than a point)
    const [pageWidth, pageHeight] = text
      .match(/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/)!
      .slice(1)
      .map(Number);

    expect(pageWidth).toBe(width * 0.75);
    expect(Math.abs(pageHeight - 1032 * 0.75)).toBeLessThan(1);
  });

  it('Pdf has one page of drawing size with jpeg image', async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const text = await readBinary(createPdf(jpeg, 200, 100, 2));

    expect(text.startsWith('%PDF-1.4\n')).toBe(true);
    expect(text).toContain('/MediaBox [0 0 75 37.5]');
    expect(text).toContain('/Width 200 /Height 100');
    expect(text).toContain('/Filter /DCTDecode /Length 4');
    // cross reference table: object offsets
    const offset = Number(text.match(/xref\n0 6\n0000000000 65535 f \n(\d{10})/)![1]);
    expect(text.slice(offset).startsWith('1 0 obj')).toBe(true);
    expect(text.endsWith('%%EOF\n')).toBe(true);
  });

  it('Export dialog: preview follows options, selection or whole drawing, saves and copies', async () => {
    const { drawer, rect } = drawerWithShapes();
    const exportImage = vi.spyOn(drawer, 'exportImage').mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    const exportCanvas = vi.spyOn(drawer, 'exportCanvas');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    drawer.getWidget<SelectWidget>('selection')!.transformer.nodes([rect]);
    keydown(drawer, { key: 'E', ctrlKey: true, shiftKey: true });
    const modal = drawer.exportModal!;
    await tick();

    expect(modal.isVisible()).toBe(true);
    expect(modal.$modal.getAttribute('role')).toBe('dialog');
    expect(modal.$selected.checked).toBe(true);
    expect(exportCanvas).toHaveBeenLastCalledWith(expect.objectContaining({ selected: true, background: true }));
    const preview = modal.$preview;
    expect(preview.isConnected).toBe(true);

    // whole drawing without leaving dialog, preview updated at once
    modal.$selected.checked = false;
    modal.$dark.checked = true;
    modal.$selected.dispatchEvent(new Event('change', { bubbles: true }));
    expect(exportCanvas).toHaveBeenLastCalledWith(expect.objectContaining({ selected: false, dark: true }));
    expect(modal.$preview).not.toBe(preview);
    expect(modal.$preview.isConnected).toBe(true);
    expect(modal.$preview.getAttribute('aria-label')).toBe('Preview of exported image');
    // in preview box, not absolutely positioned as konva canvas
    expect(modal.$preview.style.position).toBe('');

    await modal.save('svg');
    expect(exportImage).toHaveBeenLastCalledWith('svg', expect.objectContaining({ selected: false, scale: 2 }));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('Texts exported with their fonts: loaded first, preview drawn again once loaded', async () => {
    const { drawer, text } = drawerWithShapes();
    const loaded = new Set<string>();
    let release = () => {};
    // fonts of the browser (none in jsdom): loaded when released
    const fonts = {
      check: (font: string) => loaded.has(font),
      load: vi.fn(
        (font: string) =>
          new Promise<FontFace[]>((resolve) => {
            release = () => {
              loaded.add(font);
              resolve([]);
            };
          })
      ),
    };

    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
    text.fontStyle('italic');
    const font = text._getContextFont();
    let exported = false;
    const image = drawer.exportImage('png').then((blob) => {
      exported = true;
      return blob;
    });

    await tick();
    expect(fonts.load).toHaveBeenCalledWith(font);
    // not drawn with a fallback font
    expect(exported).toBe(false);
    release();
    expect(await image).toBeInstanceOf(Blob);

    // preview: at once, again once the font is loaded, then no more
    loaded.clear();
    const exportCanvas = vi.spyOn(drawer, 'exportCanvas');

    drawer.showExport();
    expect(exportCanvas).toHaveBeenCalledTimes(1);
    release();
    await tick();
    expect(exportCanvas).toHaveBeenCalledTimes(2);
    await tick();
    expect(exportCanvas).toHaveBeenCalledTimes(2);
    drawer.exportModal!.hide();
    Reflect.deleteProperty(document, 'fonts');
  });

  it('Export dialog without selection nor drawing', async () => {
    const drawer = createDrawer();

    drawer.setting.$exportButton.click();
    await tick();

    const modal = drawer.exportModal!;
    expect(modal.$selected.parentElement!.hidden).toBe(true);
    expect(modal.$empty.hidden).toBe(false);
    expect(modal.$buttons.every(($btn) => $btn.disabled)).toBe(true);
    expect(drawer.setting.$exportButton.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+E');
  });
});
