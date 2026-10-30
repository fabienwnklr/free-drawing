import { describe, expect, it, vi } from 'vitest';
import type { Group } from 'konva/lib/Group';
import type { Arrow } from 'konva/lib/shapes/Arrow';
import type { Ellipse } from 'konva/lib/shapes/Ellipse';
import type { Rect } from 'konva/lib/shapes/Rect';
import type { Text } from 'konva/lib/shapes/Text';
import type { DrawingShape } from '@/@types/drawer';
import { shapeName } from '@/constants';
import { getFrameShapes, isFrame, type Frame } from '@/utils/frame';
import { fromOtherApp } from '@/utils/foreignDrawing';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { createDrawer, fireMouse } from './helpers';

/** PNG of one pixel */
const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** Fields of every element of Excalidraw */
const base = {
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  isDeleted: false,
  locked: false,
  link: null,
};

/** Drawing of Excalidraw (`.excalidraw`) */
const excalidraw = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements: [
    {
      ...base,
      id: 'rect1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      backgroundColor: '#ffc9c9',
      strokeStyle: 'dashed',
      roundness: { type: 3 },
      boundElements: [{ type: 'text', id: 'text1' }],
    },
    {
      ...base,
      id: 'text1',
      type: 'text',
      x: 150,
      y: 135,
      width: 100,
      height: 25,
      text: 'Start',
      originalText: 'Start',
      fontSize: 20,
      fontFamily: 5,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: 'rect1',
      autoResize: true,
      lineHeight: 1.25,
    },
    { ...base, id: 'ell1', type: 'ellipse', x: 500, y: 100, width: 120, height: 80, angle: Math.PI / 2 },
    {
      ...base,
      id: 'arrow1',
      type: 'arrow',
      x: 300,
      y: 150,
      width: 200,
      height: 0,
      points: [
        [0, 0],
        [200, 0],
      ],
      startBinding: { elementId: 'rect1', focus: 0, gap: 1 },
      endBinding: { elementId: 'ell1', focus: 0, gap: 1 },
      startArrowhead: null,
      endArrowhead: 'triangle',
      link: 'example.com',
    },
    { ...base, id: 'deleted', type: 'rectangle', x: 0, y: 0, width: 10, height: 10, isDeleted: true },
    { ...base, id: 'd1', type: 'diamond', x: 50, y: 350, width: 100, height: 100, frameId: 'frame1', groupIds: ['g1'] },
    {
      ...base,
      id: 'line1',
      type: 'line',
      x: 200,
      y: 350,
      width: 100,
      height: 50,
      points: [
        [0, 0],
        [50, 50],
        [100, 0],
      ],
      frameId: 'frame1',
      groupIds: ['g1'],
    },
    { ...base, id: 'frame1', type: 'frame', x: 0, y: 300, width: 400, height: 300, name: 'Plan' },
    {
      ...base,
      id: 'free1',
      type: 'freedraw',
      x: 700,
      y: 300,
      width: 30,
      height: 15,
      points: [
        [0, 0],
        [10, 5],
        [20, 15],
        [30, 10],
      ],
      pressures: [],
      simulatePressure: true,
      locked: true,
    },
    { ...base, id: 'img1', type: 'image', x: 700, y: 100, width: 64, height: 64, fileId: 'abc123', status: 'saved' },
    { ...base, id: 'embed', type: 'embeddable', x: 0, y: 0, width: 300, height: 200 },
  ],
  appState: { viewBackgroundColor: '#fffce8', gridSize: null },
  files: { abc123: { mimeType: 'image/png', id: 'abc123', dataURL: png, created: 1 } },
};

/** Fields of every shape of tldraw */
const shape = (id: string, type: string, props: object, more: object = {}) => ({
  x: 0,
  y: 0,
  rotation: 0,
  isLocked: false,
  opacity: 1,
  meta: {},
  id: `shape:${id}`,
  type,
  props,
  parentId: 'page:page',
  index: 'a1',
  typeName: 'shape',
  ...more,
});

/** Drawing of tldraw (`.tldr`) */
const tldraw = {
  tldrawFileFormatVersion: 1,
  schema: { schemaVersion: 2, sequences: {} },
  records: [
    { gridSize: 10, name: '', meta: {}, id: 'document:document', typeName: 'document' },
    { meta: {}, id: 'page:page', name: 'Page 1', index: 'a1', typeName: 'page' },
    { meta: {}, id: 'page:other', name: 'Page 2', index: 'a2', typeName: 'page' },
    shape(
      'geo1',
      'geo',
      {
        w: 200,
        h: 100,
        geo: 'rectangle',
        color: 'blue',
        labelColor: 'black',
        fill: 'solid',
        dash: 'draw',
        size: 'm',
        text: 'Hello',
        growY: 0,
      },
      { x: 100, y: 100, index: 'a1' }
    ),
    shape(
      'geo2',
      'geo',
      {
        w: 100,
        h: 60,
        geo: 'arrow-up',
        color: 'red',
        fill: 'none',
        dash: 'dashed',
        size: 's',
        richText: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Up' }] }] },
      },
      { x: 500, y: 100, index: 'a2' }
    ),
    shape(
      'arrow1',
      'arrow',
      {
        start: { x: 0, y: 0 },
        end: { x: 200, y: 0 },
        bend: 40,
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        color: 'black',
        size: 'm',
        dash: 'draw',
        text: '',
      },
      { x: 300, y: 150, index: 'a3' }
    ),
    {
      id: 'binding:b1',
      typeName: 'binding',
      type: 'arrow',
      fromId: 'shape:arrow1',
      toId: 'shape:geo1',
      props: { terminal: 'start' },
      meta: {},
    },
    {
      id: 'binding:b2',
      typeName: 'binding',
      type: 'arrow',
      fromId: 'shape:arrow1',
      toId: 'shape:geo2',
      props: { terminal: 'end' },
      meta: {},
    },
    shape(
      'note1',
      'note',
      { color: 'green', size: 'm', text: 'Note', growY: 0, scale: 1 },
      { x: 700, y: 100, index: 'a4' }
    ),
    shape('frame1', 'frame', { w: 500, h: 300, name: '' }, { x: 0, y: 400, index: 'a5' }),
    shape(
      'draw1',
      'draw',
      {
        segments: [
          {
            type: 'free',
            points: [
              { x: 0, y: 0, z: 0.5 },
              { x: 10, y: 10, z: 0.5 },
              { x: 20, y: 5, z: 0.5 },
            ],
          },
        ],
        color: 'violet',
        size: 'l',
        isPen: false,
      },
      { x: 20, y: 20, parentId: 'shape:frame1' }
    ),
    shape('group1', 'group', {}, { x: 800, y: 400, index: 'a6' }),
    shape(
      'text1',
      'text',
      { text: 'In group', size: 's', textAlign: 'middle', color: 'black', autoSize: true, w: 80 },
      { parentId: 'shape:group1' }
    ),
    shape(
      'line1',
      'line',
      {
        points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 100, y: 20 } },
        spline: 'cubic',
        dash: 'dotted',
        size: 'm',
        color: 'black',
      },
      { y: 50, parentId: 'shape:group1', index: 'a2' }
    ),
    shape('img1', 'image', { w: 64, h: 64, assetId: 'asset:a1' }, { x: 900, y: 100, index: 'a7' }),
    {
      id: 'asset:a1',
      typeName: 'asset',
      type: 'image',
      props: { src: png, w: 1, h: 1, name: 'x.png', mimeType: 'image/png' },
      meta: {},
    },
    shape('other', 'geo', { w: 10, h: 10, geo: 'rectangle' }, { parentId: 'page:other' }),
  ],
};

/**
 * Drawing shape of the drawer by id
 * @param shapes Shapes of the drawing (shapes of frames too)
 * @param id Id of the shape
 * @returns The shape
 */
const byId = (shapes: DrawingShape[], id: string) => shapes.find((shape) => shape.id() === id)!;

describe('Drawings of other apps', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Excalidraw: shapes, text of a shape, linked arrow, frame with a group, freehand stroke, image, background', () => {
    const drawer = createDrawer({ language: 'en' });

    drawer.loadDrawing(JSON.stringify(excalidraw));

    const shapes = drawer.getDrawingShapes();
    const names = shapes.map((node) => node.name());

    // deleted element and embedded page left out
    expect(names).toEqual([
      shapeName.rect,
      shapeName.text,
      shapeName.ellipse,
      shapeName.arrow,
      shapeName.frame,
      shapeName.line,
      shapeName.image,
    ]);
    expect(drawer.background.fill()).toBe('#fffce8');

    const rect = byId(shapes, 'rect1') as Rect;

    expect([rect.x(), rect.width(), rect.fill(), rect.strokeWidth()]).toEqual([100, 200, '#ffc9c9', 4]);
    expect(rect.cornerRadius()).toBeGreaterThan(0);
    expect(rect.dash()?.length).toBe(2);

    // text placed in its rectangle once loaded
    const text = byId(shapes, 'text1') as Text;
    const box = rect.getClientRect();
    const textBox = text.getClientRect();

    expect(text.attrs.containerId).toBe('rect1');
    expect(textBox.x).toBeGreaterThanOrEqual(box.x);
    expect(textBox.x + textBox.width).toBeLessThanOrEqual(box.x + box.width);

    // turned around its center
    const ellipse = byId(shapes, 'ell1') as Ellipse;

    expect([ellipse.x(), ellipse.y(), ellipse.rotation()]).toEqual([560, 140, 90]);

    // linked arrow, its heads, its link
    const arrow = byId(shapes, 'arrow1') as Arrow;

    expect([arrow.attrs.startBinding, arrow.attrs.endBinding, arrow.attrs.endHead]).toEqual([
      'rect1',
      'ell1',
      'triangle',
    ]);
    expect(drawer.getShapeLink(arrow)).toBe('https://example.com/');

    // frame with its name and its group of a diamond and a line, in its coordinates
    const frame = shapes.find(isFrame) as Frame;
    const [group] = getFrameShapes(frame);

    expect([frame.id(), frame.attrs.label, frame.x(), frame.y()]).toEqual(['frame1', 'Plan', 0, 300]);
    expect(group.name()).toBe(shapeName.group);
    expect((group as unknown as { getChildren(): DrawingShape[] }).getChildren().map((child) => child.name())).toEqual([
      shapeName.diamond,
      shapeName.straightLine,
    ]);
    expect(frame.findOne('#d1')!.getAbsolutePosition()).toEqual({ x: 50, y: 350 });

    // freehand stroke filled, locked; image with its file
    const stroke = byId(shapes, 'free1');

    expect([stroke.attrs.closed, stroke.isListening()]).toEqual([true, false]);
    expect(byId(shapes, 'img1').attrs.fileId).toBe('abc123');
    expect(drawer.files.get('abc123')).toBe(png);

    // one change: undo gives the drawing back
    drawer.undoRedo.undo();
    expect(drawer.getDrawingShapes()).toEqual([]);
  });

  it('tldraw: first page, geometric shapes with texts, linked curved arrow, note, frame, group, image', () => {
    const drawer = createDrawer({ language: 'en' });

    drawer.loadDrawing(JSON.stringify(tldraw));

    const shapes = drawer.getDrawingShapes();

    // shape of another page left out; texts after their shapes
    expect(shapes.map((node) => node.id())).toEqual([
      'shape-geo1',
      expect.any(String),
      'shape-geo2',
      expect.any(String),
      'shape-arrow1',
      'shape-note1',
      expect.any(String),
      'shape-frame1',
      'shape-group1',
      'shape-img1',
    ]);

    const rect = byId(shapes, 'shape-geo1') as Rect;
    const [hello, up, note] = shapes.filter((node) => node.hasName(shapeName.text)) as Text[];

    expect([rect.name(), rect.fill(), rect.stroke(), rect.strokeWidth()]).toEqual([
      shapeName.rect,
      '#dce1f8',
      '#4465e9',
      3.5,
    ]);
    expect([hello.text(), hello.attrs.containerId]).toEqual(['Hello', 'shape-geo1']);
    expect([up.text(), note.text()]).toEqual(['Up', 'Note']);

    // block arrow pointing up: turned in its box, dashed
    const arrowUp = byId(shapes, 'shape-geo2');

    expect([arrowUp.name(), arrowUp.rotation()]).toEqual([shapeName.blockArrow, -90]);
    // in the box of tldraw, half the stroke around
    expect(arrowUp.getClientRect()).toMatchObject({ x: 499, y: 99, width: 102, height: 62 });

    // arrow linked to both, curved
    const arrow = byId(shapes, 'shape-arrow1') as Arrow;

    expect([arrow.attrs.startBinding, arrow.attrs.endBinding, arrow.attrs.arrowType]).toEqual([
      'shape-geo1',
      'shape-geo2',
      'curved',
    ]);
    expect(arrow.attrs.bend).toBeCloseTo(-0.2);

    expect(byId(shapes, 'shape-note1').hasName(shapeName.note)).toBe(true);

    // frame without name: named, its freehand stroke in it
    const frame = byId(shapes, 'shape-frame1') as Frame;

    expect(frame.attrs.label).toBe('Frame');
    expect(getFrameShapes(frame).map((node) => node.name())).toEqual([shapeName.line]);

    // group of a text and a dotted cubic line
    const group = byId(shapes, 'shape-group1') as Group;

    expect(group.x()).toBe(800);
    expect(group.findOne(`.${shapeName.straightLine}`)!.attrs.tension).toBe(0.5);
    expect((group.findOne(`.${shapeName.text}`) as Text).align()).toBe('center');

    expect(drawer.files.get('asset-a1')).toBe(png);
  });

  it('Other contents left as they are, a drawing of another app that cannot be read told', () => {
    expect(fromOtherApp('not json', 'Frame')).toBe('not json');
    expect(fromOtherApp('{"type":"free-drawing","shapes":[]}', 'Frame')).toBe('{"type":"free-drawing","shapes":[]}');
    // nothing usable: empty drawing
    expect(JSON.parse(fromOtherApp('{"type":"excalidraw","elements":"x"}', 'Frame')).shapes).toEqual([]);
    expect(JSON.parse(fromOtherApp('{"tldrawFileFormatVersion":1}', 'Frame')).shapes).toEqual([]);
  });

  it('Svg images of other apps read as images of drawings (raster), shown once read, saved', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
    // images read by the browser (jsdom reads none)
    const image = HTMLImageElement.prototype as { decode: () => Promise<void> };
    const { decode } = image;
    const { createObjectURL, revokeObjectURL } = URL;

    image.decode = async () => {};
    URL.createObjectURL = () => 'blob:svg';
    URL.revokeObjectURL = () => {};
    try {
      const drawer = createDrawer();
      const file = {
        type: 'excalidraw',
        elements: [
          { ...base, id: 'img1', type: 'image', x: 0, y: 0, width: 64, height: 64, fileId: 'svg1', status: 'saved' },
        ],
        appState: { viewBackgroundColor: '#fff' },
        files: { svg1: { mimeType: 'image/svg+xml', id: 'svg1', dataURL: `data:image/svg+xml;base64,${btoa(svg)}` } },
      };

      // changes fired during a stroke
      const duringStroke: boolean[] = [];

      drawer.on('change', () => duringStroke.push(drawer._duringAction()));
      drawer.loadDrawing(JSON.stringify(file));
      const fileId = drawer.getDrawingShapes()[0].attrs.fileId as string;

      expect(drawer.files.has(fileId)).toBe(false);
      // a stroke started while it is read: shown once the stroke ends, nothing recorded during it
      drawer.getWidget<BaseWidget>('brush')!.setActive(true);
      fireMouse(drawer, 'mousedown', 100, 100);
      await new Promise((resolve) => setTimeout(resolve, 50));
      fireMouse(drawer, 'mousemove', 150, 150);
      fireMouse(drawer, 'mouseup', 150, 150);
      await vi.waitFor(() => expect(drawer.files.get(fileId)).toMatch(/^data:image\/(png|webp|jpeg);base64,/));
      expect(duringStroke).not.toContain(true);
      expect(drawer.getDrawingFile().files).toEqual({ [fileId]: drawer.files.get(fileId) });
    } finally {
      image.decode = decode;
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;
    }
  });
});
