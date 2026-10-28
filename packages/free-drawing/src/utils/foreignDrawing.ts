import { Group } from 'konva/lib/Group';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Image } from 'konva/lib/shapes/Image';
import { Line } from 'konva/lib/shapes/Line';
import { Path } from 'konva/lib/shapes/Path';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';
import type { Vector2d } from 'konva/lib/types';
import { getStroke } from 'perfect-freehand';
import type { Arrowhead, ColorLike, DrawingShape, StrokeStyle } from '@/@types/drawer';
import type { DrawingFile, DrawingFiles, ForeignObject } from '@/@types/file';
import { arrowPointerSize } from '@/components/toolbar/widgets/Arrow/Arrow';
import { scalePath } from '@/components/toolbar/widgets/PathShapeWidget';
import { getShapeState } from '@/components/tools/UndoRedo/History';
import { defaultOptions, pathShapeData, shapeName } from '@/constants';
import { arrowheadAttrs, maxBend, routeArrow } from '@/utils/arrow';
import { DrawerError } from '@/utils/errors';
import { createFrame, getFrameContent, type Frame } from '@/utils/frame';
import { noteColors } from '@/utils/note';
import { getCornerRadius, getDash } from '@/utils/stroke';

// drawings of other apps are converted to drawing files, then read as any file (`parseDrawingFile`): only drawing
// shapes, with attributes of the expected types. Their data come from anyone: every field is checked

/**
 * Object read from a file
 * @param value Value read
 * @returns True for an object (not an array)
 */
const isObject = (value: unknown): value is ForeignObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Number read from a file
 * @param value Value read
 * @param fallback Value of a missing or wrong number
 * @returns Finite number
 */
const num = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

/**
 * Text read from a file
 * @param value Value read
 * @param fallback Value of a missing or wrong text
 * @returns Text
 */
const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

/**
 * Id of a drawing shape or a file from an id of another app (`shape:abc` of tldraw...)
 * @param value Id read
 * @returns Letters, digits, `_` and `-` only (64 at most), empty for a missing id
 */
const toId = (value: unknown) =>
  str(value)
    .replace(/[^\w-]/g, '-')
    .slice(0, 64);

/**
 * Point turned around a center
 * @param point Point to turn
 * @param center Center of the rotation
 * @param angle Angle in radians (clockwise on screen)
 * @returns Turned point
 */
function turn(point: Vector2d, center: Vector2d, angle: number): Vector2d {
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const [dx, dy] = [point.x - center.x, point.y - center.y];

  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

/**
 * Position of a box turned around its center (Excalidraw): konva turns nodes around their position
 * @param x Left of the box before rotation
 * @param y Top of the box before rotation
 * @param width Width of the box
 * @param height Height of the box
 * @param angle Angle in radians
 * @returns Position and rotation (degrees) of the node
 */
function centeredRotation(x: number, y: number, width: number, height: number, angle: number) {
  const corner = turn({ x, y }, { x: x + width / 2, y: y + height / 2 }, angle);

  return { x: corner.x, y: corner.y, rotation: (angle * 180) / Math.PI };
}

/**
 * Points as konva coordinates
 * @param points Points
 * @returns Flat list of coordinates, 2 decimals
 */
const flat = (points: Vector2d[] | number[][]) =>
  points.flatMap((p) => (Array.isArray(p) ? p.slice(0, 2) : [p.x, p.y])).map((n) => Math.round(n * 100) / 100);

/**
 * Bend of a curve through points, as the bend of curved arrows (`curveMiddle`)
 * @param points Points of the curve, from its start to its end
 * @returns Farthest distance from the straight line, in lengths of the line, positive on its left
 */
function bendOf(points: Vector2d[]): number {
  const [start, end] = [points[0], points.at(-1)!];
  const [dx, dy] = [end.x - start.x, end.y - start.y];
  const length = Math.hypot(dx, dy);

  if (!length) return 0;

  const farthest = points
    .map(({ x, y }) => ((x - start.x) * dy - (y - start.y) * dx) / length)
    .reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);

  return Math.max(-maxBend, Math.min(maxBend, Math.round((farthest / length) * 1000) / 1000));
}

/**
 * Freehand stroke filled as the brush draws it (perfect-freehand outline)
 * @param points Points of the pointer path with their pressure (0 to 1)
 * @param size Width of the stroke
 * @param pressure Pressure given (pen), else simulated from the speed
 * @returns Points of the outline, relative to the path
 */
const freehandOutline = (points: number[][], size: number, pressure: boolean) =>
  getStroke(points, {
    size,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: !pressure,
    last: true,
  });

/**
 * Style of the outline of a shape
 * @param stroke Color of the stroke
 * @param strokeWidth Width of the stroke
 * @param style Solid, dashed or dotted
 * @returns Attributes of the shape, as drawn by the tools
 */
const outlineStyle = (stroke: string, strokeWidth: number, style: StrokeStyle) => ({
  stroke,
  strokeWidth,
  ...(style !== 'solid' && { dash: getDash(style, strokeWidth) }),
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  hitStrokeWidth: Math.max(20, strokeWidth),
});

/**
 * Stroke style of a style name of another app
 * @param value Style read (`dashed`, `dotted`, else solid)
 * @returns Stroke style of the library
 */
const strokeStyleOf = (value: unknown): StrokeStyle => (value === 'dashed' || value === 'dotted' ? value : 'solid');

/**
 * Drawing file of nodes created from the drawing of another app
 * @param nodes Top nodes, from bottom to top
 * @param background Background color
 * @param files Image files of the drawing, by id
 * @returns Drawing file (checked again when read)
 */
function toDrawingFile(nodes: DrawingShape[], background: string, files: DrawingFiles): DrawingFile {
  return {
    type: 'free-drawing',
    version: 1,
    background: background as ColorLike,
    shapes: nodes.map(getShapeState),
    ...(Object.keys(files).length > 0 && { files }),
  };
}

/** Heads of Excalidraw arrows, as heads of the library */
const excalidrawHeads: Record<string, Arrowhead> = {
  arrow: 'arrow',
  triangle: 'triangle',
  triangle_outline: 'triangle',
  diamond: 'triangle',
  diamond_outline: 'triangle',
  dot: 'dot',
  circle: 'dot',
  circle_outline: 'dot',
  bar: 'bar',
};

/**
 * Points of a line, an arrow or a freehand stroke of Excalidraw, turned by the rotation of the element (around the
 * center of their box)
 * @param element Element of Excalidraw
 * @returns Points relative to the position of the element
 */
function excalidrawPoints(element: ForeignObject): Vector2d[] {
  const points = (Array.isArray(element.points) ? element.points : [])
    .filter((p): p is unknown[] => Array.isArray(p) && p.length >= 2)
    .map(([x, y]) => ({ x: num(x), y: num(y) }));
  const angle = num(element.angle);

  if (!angle || !points.length) return points;

  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const center = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };

  return points.map((p) => turn(p, center, angle));
}

/**
 * Shape of the library from an element of Excalidraw: rectangle, ellipse, diamond, text (also of a shape or an arrow),
 * line, arrow (linked to the shapes of its ends), freehand stroke, image; other elements (frames apart, embedded
 * pages) give nothing
 * @param element Element of Excalidraw (not deleted)
 * @param files Image files of the drawing: an image without its file gives nothing
 * @returns Shape, null for other elements
 */
function excalidrawShape(element: ForeignObject, files: DrawingFiles): DrawingShape | null {
  const x = num(element.x);
  const y = num(element.y);
  const width = Math.abs(num(element.width));
  const height = Math.abs(num(element.height));
  const angle = num(element.angle);
  const stroke = str(element.strokeColor, '#1e1e1e');
  const background = str(element.backgroundColor, 'transparent');
  const fill = background !== 'transparent' ? { fill: background } : {};
  // thin, bold, extra bold of Excalidraw are drawn rough, thicker than their width
  const strokeWidth = Math.max(1, Math.round(num(element.strokeWidth, 2) * 2));
  const id = toId(element.id);
  const common = {
    ...(id && { id }),
    opacity: Math.min(1, Math.max(0, num(element.opacity, 100) / 100)),
    ...(element.locked === true && { listening: false }),
    ...(typeof element.link === 'string' && element.link && { link: element.link }),
  };
  const outline = outlineStyle(stroke, strokeWidth, strokeStyleOf(element.strokeStyle));
  const box = centeredRotation(x, y, width, height, angle);

  switch (element.type) {
    case 'rectangle':
      return new Rect({
        ...common,
        ...outline,
        ...box,
        width,
        height,
        ...fill,
        cornerRadius: element.roundness ? getCornerRadius(width, height, 'round') : 0,
        name: shapeName.rect,
      });
    case 'ellipse':
      return new Ellipse({
        ...common,
        ...outline,
        x: x + width / 2,
        y: y + height / 2,
        radiusX: width / 2,
        radiusY: height / 2,
        rotation: box.rotation,
        ...fill,
        name: shapeName.ellipse,
      });
    case 'diamond':
      return new Path({
        ...common,
        ...outline,
        ...box,
        data: scalePath(pathShapeData[shapeName.diamond], width, height),
        ...fill,
        name: shapeName.diamond,
      });
    case 'text': {
      const align = str(element.textAlign);
      const containerId = toId(element.containerId);

      return new Text({
        ...common,
        ...defaultOptions.textStyle,
        ...box,
        text: str(element.text, str(element.originalText)),
        fontSize: num(element.fontSize, 20),
        lineHeight: num(element.lineHeight, 1.25),
        align: align === 'center' || align === 'right' ? align : 'left',
        fill: stroke,
        // wrapped in its width
        ...(element.autoResize === false && !containerId && { width }),
        ...(containerId && { containerId }),
        name: shapeName.text,
      });
    }
    case 'line': {
      const points = excalidrawPoints(element);
      const [first, last] = [points[0], points.at(-1)];
      // polygon: closed and filled
      const closed =
        points.length > 2 &&
        (element.polygon === true || (!!first && !!last && Math.hypot(last.x - first.x, last.y - first.y) < 1));

      if (points.length < 2) return null;

      return new Line({
        ...common,
        ...outline,
        x,
        y,
        points: flat(points),
        ...(element.roundness ? { tension: 0.5 } : {}),
        ...(closed && { closed: true, ...fill }),
        name: shapeName.straightLine,
      });
    }
    case 'arrow': {
      const points = excalidrawPoints(element);

      if (points.length < 2) return null;

      const elbow = element.elbowed === true;
      const curved = !elbow && !!element.roundness && points.length > 2;
      const start = isObject(element.startBinding) ? toId(element.startBinding.elementId) : '';
      const end = isObject(element.endBinding) ? toId(element.endBinding.elementId) : '';
      const arrow = new Arrow({
        ...common,
        ...outline,
        x,
        y,
        points: flat(points),
        fill: stroke,
        pointerLength: arrowPointerSize(strokeWidth),
        pointerWidth: arrowPointerSize(strokeWidth),
        ...(elbow && { arrowType: 'elbow' }),
        ...(curved && { arrowType: 'curved', bend: bendOf(points) }),
        ...arrowheadAttrs({
          start: excalidrawHeads[str(element.startArrowhead)] ?? 'none',
          end: excalidrawHeads[str(element.endArrowhead)] ?? 'none',
        }),
        ...(start && { startBinding: start }),
        ...(end && { endBinding: end }),
        name: shapeName.arrow,
      });

      // curve or elbow of the library between its ends (straight ones keep their points)
      if (elbow || curved) routeArrow(arrow, points[0], points.at(-1)!);

      return arrow;
    }
    case 'freedraw': {
      const points = excalidrawPoints(element);
      const pressures = Array.isArray(element.pressures) ? element.pressures : [];

      if (!points.length) return null;

      return new Line({
        ...common,
        x,
        y,
        points: flat(
          freehandOutline(
            points.map((p, i) => [p.x, p.y, num(pressures[i], 0.5)]),
            num(element.strokeWidth, 2) * 4.25,
            element.simulatePressure === false
          )
        ),
        closed: true,
        fill: stroke,
        stroke,
        strokeWidth: 1,
        lineCap: 'round',
        lineJoin: 'round',
        hitStrokeWidth: 20,
        name: shapeName.line,
      });
    }
    case 'image': {
      const fileId = toId(element.fileId);

      if (!files[fileId]) return null;

      return new Image({ ...common, ...box, width, height, image: undefined, fileId, name: shapeName.image });
    }
    default:
      return null;
  }
}

/**
 * Drawing file of an Excalidraw drawing (`.excalidraw`): its elements as shapes of the library, in frames and groups,
 * arrows linked to their shapes, texts in their shapes, images with their files, background color
 * @param data Content of the file (`type: 'excalidraw'`)
 * @param frameName Name of a frame without name
 * @returns Drawing file
 */
export function fromExcalidraw(data: ForeignObject, frameName: string): DrawingFile {
  const elements = (Array.isArray(data.elements) ? data.elements : []).filter(
    (element): element is ForeignObject => isObject(element) && element.isDeleted !== true
  );
  const files: DrawingFiles = {};

  for (const [id, file] of Object.entries(isObject(data.files) ? data.files : {})) {
    if (isObject(file) && typeof file.dataURL === 'string') files[toId(id)] = file.dataURL;
  }

  // frames first: elements of a frame may come before it
  const frames = new Map<string, Frame>();

  for (const element of elements) {
    if (element.type !== 'frame' && element.type !== 'magicframe') continue;

    const frame = createFrame({
      x: num(element.x),
      y: num(element.y),
      width: Math.abs(num(element.width, 100)),
      height: Math.abs(num(element.height, 100)),
      label: str(element.name) || frameName,
    });
    const id = toId(element.id);

    if (id) frame.id(id);
    frames.set(str(element.id), frame);
  }

  const top: DrawingShape[] = [];
  const groups = new Map<string, Group>();
  // shape or outermost group: in the content of its frame (coordinates of the frame), else on top
  const place = (node: DrawingShape, frameId: unknown) => {
    const frame = frames.get(str(frameId));

    if (!frame) {
      top.push(node);
      return;
    }
    node.move({ x: -frame.x(), y: -frame.y() });
    getFrameContent(frame).add(node);
  };

  for (const element of elements) {
    const frame = frames.get(str(element.id));

    if (frame) {
      top.push(frame);
      continue;
    }

    const shape = excalidrawShape(element, files);

    if (!shape) continue;

    // groups from the innermost one: the first one already created holds the others
    let child: DrawingShape = shape;
    let placed = false;

    for (const groupId of (Array.isArray(element.groupIds) ? element.groupIds : []).map((id) => str(id))) {
      const group = groups.get(groupId);

      if (group) {
        group.add(child);
        placed = true;
        break;
      }

      const created = new Group({ name: shapeName.group });

      groups.set(groupId, created);
      created.add(child);
      child = created;
    }
    if (!placed) place(child, element.frameId);
  }

  const appState = isObject(data.appState) ? data.appState : {};

  return toDrawingFile(top, str(appState.viewBackgroundColor, '#fff'), files);
}

/** Widths of strokes of tldraw by size */
const tldrawStrokes: Record<string, number> = { s: 2, m: 3.5, l: 5, xl: 10 };

/** Font sizes of tldraw by size */
const tldrawFonts: Record<string, number> = { s: 18, m: 24, l: 36, xl: 44 };

/** Colors of tldraw (light theme): stroke, then fill */
const tldrawColors: Record<string, string[]> = {
  black: ['#1d1d1d', '#e8e8e8'],
  grey: ['#9fa8b2', '#eceef0'],
  'light-violet': ['#e085f4', '#f5eafa'],
  violet: ['#ae3ec9', '#ecdcf2'],
  blue: ['#4465e9', '#dce1f8'],
  'light-blue': ['#4ba1f1', '#ddedfa'],
  yellow: ['#f1ac4b', '#f9f0e6'],
  orange: ['#e16919', '#f8e2d4'],
  green: ['#099268', '#d3e9e3'],
  'light-green': ['#4cb05e', '#dbf0e0'],
  'light-red': ['#f87777', '#f4dadb'],
  red: ['#e03131', '#f4dadb'],
  white: ['#ffffff', '#f5f5f5'],
};

/** Geometric shapes of tldraw, as shape names of the library (other ones: rectangles) */
const tldrawGeo: Record<string, string> = {
  ellipse: shapeName.ellipse,
  oval: shapeName.ellipse,
  triangle: shapeName.triangle,
  diamond: shapeName.diamond,
  rhombus: shapeName.diamond,
  'rhombus-2': shapeName.diamond,
  pentagon: shapeName.hexagon,
  hexagon: shapeName.hexagon,
  octagon: shapeName.hexagon,
  star: shapeName.star,
  cloud: shapeName.cloud,
  heart: shapeName.heart,
  'check-box': shapeName.checkbox,
  'arrow-right': shapeName.blockArrow,
  'arrow-left': shapeName.blockArrow,
  'arrow-up': shapeName.blockArrow,
  'arrow-down': shapeName.blockArrow,
};

/** Turn of the block arrows of tldraw not pointing right, in degrees */
const tldrawArrowTurns: Record<string, number> = { 'arrow-left': 180, 'arrow-up': -90, 'arrow-down': 90 };

/** Heads of tldraw arrows, as heads of the library */
const tldrawHeads: Record<string, Arrowhead> = {
  arrow: 'arrow',
  triangle: 'triangle',
  inverted: 'triangle',
  diamond: 'triangle',
  square: 'bar',
  pipe: 'bar',
  bar: 'bar',
  dot: 'dot',
};

/**
 * Colors of notes of tldraw, as colors of notes of the library (the default black note is yellow)
 * @param color Color of the note
 * @returns Color of a note of the library
 */
function tldrawNoteColor(color: string): string {
  const [yellow, red, green, blue] = noteColors.map(({ value }) => String(value));

  if (['red', 'light-red', 'violet', 'light-violet'].includes(color)) return red;
  if (['green', 'light-green'].includes(color)) return green;
  if (['blue', 'light-blue', 'grey', 'white'].includes(color)) return blue;

  return yellow;
}

/**
 * Text of a tldraw shape: `text`, or plain text of its rich text (lines of paragraphs, also of lists)
 * @param props Properties of the shape
 * @returns Text, empty without
 */
function tldrawText(props: ForeignObject): string {
  if (typeof props.text === 'string') return props.text;

  const inline = (node: unknown): string => {
    if (!isObject(node)) return '';
    if (node.type === 'text') return str(node.text);
    if (node.type === 'hardBreak') return '\n';

    return Array.isArray(node.content) ? node.content.map(inline).join('') : '';
  };
  const blocks = (node: unknown): string[] => {
    if (!isObject(node) || !Array.isArray(node.content)) return [];
    if (node.type === 'paragraph' || node.type === 'heading') return [inline(node)];

    return node.content.flatMap(blocks);
  };

  return blocks(props.richText).join('\n');
}

/**
 * Converts the shapes of a page of tldraw, with their links (records of bindings), image files (assets)
 */
class TldrawConverter {
  /** Shapes by id of their parent (page, group, frame), in stacking order */
  #children = new Map<string, ForeignObject[]>();
  /** Shapes linked to the ends of arrows: id of the arrow, then of the terminal (start, end) */
  #bindings = new Map<string, Map<string, string>>();
  /** Assets (images) by id */
  #assets = new Map<string, ForeignObject>();
  /** Image files of the drawing */
  files: DrawingFiles = {};

  /**
   * Shapes, bindings and assets of the records
   * @param records Records of the file
   * @param frameName Name of a frame without name
   */
  constructor(
    records: ForeignObject[],
    private readonly frameName: string
  ) {
    for (const record of records) {
      if (record.typeName === 'shape') {
        const parent = str(record.parentId);

        this.#children.set(parent, [...(this.#children.get(parent) ?? []), record]);
      } else if (record.typeName === 'binding' && record.type === 'arrow' && isObject(record.props)) {
        const ends = this.#bindings.get(str(record.fromId)) ?? new Map<string, string>();

        ends.set(str(record.props.terminal), str(record.toId));
        this.#bindings.set(str(record.fromId), ends);
      } else if (record.typeName === 'asset') {
        this.#assets.set(str(record.id), record);
      }
    }
    // fractional indexes: compared as texts
    for (const shapes of this.#children.values()) {
      shapes.sort((a, b) => (str(a.index) < str(b.index) ? -1 : str(a.index) > str(b.index) ? 1 : 0));
    }
  }

  /**
   * Shapes of a parent (page, group, frame) as shapes of the library
   * @param parentId Id of the parent
   * @returns Shapes, from bottom to top
   */
  shapesOf(parentId: string): DrawingShape[] {
    return (this.#children.get(parentId) ?? []).flatMap((shape) => this._convert(shape));
  }

  /**
   * Shape of tldraw as shapes of the library: geometric shape, arrow, freehand stroke, highlight, line, text, note,
   * frame, image, group; with the text of a shape after it. Other shapes (embedded pages, bookmarks, videos) give
   * nothing
   * @param shape Shape record
   * @returns Shapes of the library
   */
  private _convert(shape: ForeignObject): DrawingShape[] {
    const props = isObject(shape.props) ? shape.props : {};
    const id = toId(shape.id);
    const x = num(shape.x);
    const y = num(shape.y);
    const rotation = (num(shape.rotation) * 180) / Math.PI;
    const scale = num(props.scale, 1);
    const [color, fillColor] = tldrawColors[str(props.color)] ?? tldrawColors.black;
    const strokeWidth = (tldrawStrokes[str(props.size)] ?? 3.5) * scale;
    const fontSize = (tldrawFonts[str(props.size)] ?? 24) * scale;
    const common = {
      ...(id && { id }),
      opacity: Math.min(1, Math.max(0, num(shape.opacity, 1))),
      ...(shape.isLocked === true && { listening: false }),
      ...(typeof props.url === 'string' && props.url && { link: props.url }),
    };
    const outline = outlineStyle(color, strokeWidth, strokeStyleOf(props.dash));
    const fill =
      props.fill === 'solid' || props.fill === 'pattern'
        ? { fill: fillColor }
        : props.fill === 'fill'
        ? { fill: color }
        : props.fill === 'semi'
        ? { fill: '#ffffff' }
        : {};
    const text = tldrawText(props);
    // text of a shape (or of an arrow), placed in it once loaded
    const label = (container: DrawingShape, textColor: string = color) =>
      text.trim()
        ? [
            new Text({
              ...defaultOptions.textStyle,
              text,
              fontSize,
              fill: textColor,
              align: 'center',
              containerId: container.id(),
              name: shapeName.text,
            }),
          ]
        : [];

    switch (shape.type) {
      case 'geo': {
        const width = Math.abs(num(props.w, 100));
        const height = Math.abs(num(props.h, 100)) + num(props.growY);
        const name = tldrawGeo[str(props.geo)] ?? shapeName.rect;
        const textColor = tldrawColors[str(props.labelColor)]?.[0] ?? color;
        let node: DrawingShape;

        if (name === shapeName.rect) {
          node = new Rect({ ...common, ...outline, ...fill, x, y, rotation, width, height, name });
        } else if (name === shapeName.ellipse) {
          const center = turn({ x: x + width / 2, y: y + height / 2 }, { x, y }, num(shape.rotation));

          node = new Ellipse({
            ...common,
            ...outline,
            ...fill,
            ...center,
            rotation,
            radiusX: width / 2,
            radiusY: height / 2,
            name,
          });
        } else {
          // block arrows pointing elsewhere: turned in their box
          const quarter = tldrawArrowTurns[str(props.geo)] ?? 0;
          const [w, h] = Math.abs(quarter) === 90 ? [height, width] : [width, height];
          const local = turn(
            { x: (width - w) / 2, y: (height - h) / 2 },
            { x: width / 2, y: height / 2 },
            (quarter * Math.PI) / 180
          );
          const position = turn({ x: x + local.x, y: y + local.y }, { x, y }, num(shape.rotation));

          node = new Path({
            ...common,
            ...outline,
            ...fill,
            ...position,
            rotation: rotation + quarter,
            data: scalePath(pathShapeData[name], w, h),
            name,
          });
        }

        return [node, ...label(node, textColor)];
      }
      case 'note': {
        const size = 200 * scale;
        const note = new Rect({
          ...common,
          x,
          y,
          rotation,
          width: size,
          height: size + num(props.growY) * scale,
          fill: tldrawNoteColor(str(props.color)),
          cornerRadius: 4,
          name: `${shapeName.rect} ${shapeName.note}`,
        });

        return [note, ...label(note, '#1d1d1d')];
      }
      case 'text': {
        const align = str(props.textAlign, str(props.align));

        return [
          new Text({
            ...common,
            ...defaultOptions.textStyle,
            x,
            y,
            rotation,
            text,
            fontSize,
            fill: color,
            align:
              align === 'middle' || align === 'center'
                ? 'center'
                : align === 'end' || align === 'right'
                ? 'right'
                : 'left',
            ...(props.autoSize === false && { width: num(props.w, 100) * scale }),
            name: shapeName.text,
          }),
        ];
      }
      case 'arrow':
        return this._arrow(shape, props, { ...common, ...outline, x, y, rotation }, label);
      case 'draw':
      case 'highlight': {
        const segments = Array.isArray(props.segments) ? props.segments.filter(isObject) : [];
        const points = segments
          .flatMap((segment) => (Array.isArray(segment.points) ? segment.points : []))
          .filter(isObject)
          .map((p) => [num(p.x) * scale, num(p.y) * scale, num(p.z, 0.5)]);
        const highlight = shape.type === 'highlight';

        if (!points.length) return [];

        const outlinePoints = flat(freehandOutline(points, strokeWidth * (highlight ? 5 : 2), props.isPen === true));

        return [
          new Line({
            ...common,
            x,
            y,
            rotation,
            points: outlinePoints,
            closed: true,
            fill: color,
            hitStrokeWidth: 20,
            ...(highlight
              ? { strokeWidth: 0, globalCompositeOperation: 'multiply', name: shapeName.highlighter }
              : { stroke: color, strokeWidth: 1, lineCap: 'round', lineJoin: 'round', name: shapeName.line }),
          }),
        ];
      }
      case 'line': {
        const handles = Array.isArray(props.points)
          ? props.points
          : Object.values(isObject(props.points) ? props.points : {});
        const points = handles
          .filter(isObject)
          .sort((a, b) => (str(a.index) < str(b.index) ? -1 : str(a.index) > str(b.index) ? 1 : 0))
          .map((p) => ({ x: num(p.x) * scale, y: num(p.y) * scale }));

        if (points.length < 2) return [];

        return [
          new Line({
            ...common,
            ...outline,
            x,
            y,
            rotation,
            points: flat(points),
            ...(props.spline === 'cubic' && { tension: 0.5 }),
            name: shapeName.straightLine,
          }),
        ];
      }
      case 'frame': {
        const frame = createFrame({
          x,
          y,
          width: Math.abs(num(props.w, 100)),
          height: Math.abs(num(props.h, 100)),
          label: str(props.name) || this.frameName,
        });

        if (id) frame.id(id);
        getFrameContent(frame).add(...this.shapesOf(str(shape.id)));
        return [frame];
      }
      case 'group': {
        const group = new Group({ ...common, x, y, rotation, name: shapeName.group });
        const children = this.shapesOf(str(shape.id));

        if (!children.length) return [];
        group.add(...children);
        return [group];
      }
      case 'image': {
        const asset = this.#assets.get(str(props.assetId));
        const src = isObject(asset?.props) ? str(asset.props.src) : '';
        const fileId = toId(asset?.id);

        if (!src.startsWith('data:') || !fileId) return [];
        this.files[fileId] = src;

        return [
          new Image({
            ...common,
            x,
            y,
            rotation,
            width: Math.abs(num(props.w, 100)),
            height: Math.abs(num(props.h, 100)),
            image: undefined,
            fileId,
            name: shapeName.image,
          }),
        ];
      }
      default:
        return [];
    }
  }

  /**
   * Arrow of tldraw: ends (points relative to the arrow), linked to their shapes (records of bindings, or bindings
   * in the ends of files of previous versions), bend (curve) or elbow, heads, label
   * @param shape Arrow record
   * @param props Its properties
   * @param attrs Attributes of every shape (id, opacity, stroke, position)
   * @param label Text of the arrow, placed on it once loaded
   * @returns Arrow and its label
   */
  private _arrow(
    shape: ForeignObject,
    props: ForeignObject,
    attrs: ReturnType<typeof outlineStyle> & Record<string, unknown>,
    label: (container: DrawingShape) => Text[]
  ): DrawingShape[] {
    const ends = this.#bindings.get(str(shape.id));
    // end: point, or binding of files of previous versions (without point: placed on the shape once loaded)
    const end = (terminal: 'start' | 'end') => {
      const value = isObject(props[terminal]) ? props[terminal] : {};
      const bound = ends?.get(terminal) ?? (value.type === 'binding' ? str(value.boundShapeId) : '');

      return { point: { x: num(value.x), y: num(value.y) }, bound: toId(bound) };
    };
    const [start, finish] = [end('start'), end('end')];
    const length = Math.hypot(finish.point.x - start.point.x, finish.point.y - start.point.y);
    const elbow = props.kind === 'elbow';
    // tldraw bends on the right of the way for a positive bend (pixels)
    const bend = !elbow && length ? Math.max(-maxBend, Math.min(maxBend, -num(props.bend) / length)) : 0;
    const curved = Math.abs(bend) > 0.01;
    const arrow = new Arrow({
      ...attrs,
      points: flat([start.point, finish.point]),
      fill: attrs.stroke,
      pointerLength: arrowPointerSize(attrs.strokeWidth),
      pointerWidth: arrowPointerSize(attrs.strokeWidth),
      ...(elbow && { arrowType: 'elbow' }),
      ...(curved && { arrowType: 'curved', bend: Math.round(bend * 1000) / 1000 }),
      ...arrowheadAttrs({
        start: tldrawHeads[str(props.arrowheadStart)] ?? 'none',
        end: tldrawHeads[str(props.arrowheadEnd, 'arrow')] ?? 'none',
      }),
      ...(start.bound && { startBinding: start.bound }),
      ...(finish.bound && { endBinding: finish.bound }),
      name: shapeName.arrow,
    });

    if (elbow || curved) routeArrow(arrow, start.point, finish.point);

    return [arrow, ...label(arrow)];
  }
}

/**
 * Drawing file of a tldraw drawing (`.tldr`): the shapes of its first page as shapes of the library, in frames and
 * groups, arrows linked to their shapes, texts in their shapes, images with their files (data URLs only)
 * @param data Content of the file (`tldrawFileFormatVersion`, `records`)
 * @param frameName Name of a frame without name
 * @returns Drawing file
 */
export function fromTldraw(data: ForeignObject, frameName: string): DrawingFile {
  const records = (Array.isArray(data.records) ? data.records : []).filter(isObject);
  const [page] = records
    .filter((record) => record.typeName === 'page')
    .sort((a, b) => (str(a.index) < str(b.index) ? -1 : str(a.index) > str(b.index) ? 1 : 0));
  const converter = new TldrawConverter(records, frameName);
  const shapes = page ? converter.shapesOf(str(page.id)) : [];

  return toDrawingFile(shapes, '#fff', converter.files);
}

/**
 * Drawing file (JSON) of a file of the library, or of another app: Excalidraw (`.excalidraw`), tldraw (`.tldr`)
 * @param json Content of the file
 * @param frameName Name of a frame without name
 * @returns JSON of a drawing file of the library, the content itself for other contents (checked when read)
 * @throws {DrawerError} drawing of another app that can't be read
 */
export function fromOtherApp(json: string, frameName: string): string {
  let data: unknown;

  try {
    data = JSON.parse(json);
  } catch {
    // not JSON: told when read
    return json;
  }
  if (!isObject(data)) return json;

  try {
    if (data.type === 'excalidraw') return JSON.stringify(fromExcalidraw(data, frameName));
    if (typeof data.tldrawFileFormatVersion === 'number') return JSON.stringify(fromTldraw(data, frameName));
  } catch (error) {
    throw new DrawerError('error.notDrawingFile', 'drawing of another app not read', { cause: error });
  }

  return json;
}
