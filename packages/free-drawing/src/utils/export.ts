import { Shape } from 'konva/lib/Shape';
import type { Container } from 'konva/lib/Container';
import type { Node } from 'konva/lib/Node';
import { Group } from 'konva/lib/Group';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Text } from 'konva/lib/shapes/Text';
import { Path } from 'konva/lib/shapes/Path';
import { normalizeColor } from '@/utils/color';
import { getShapes } from '@/utils/hit';
import { frameParts } from '@/utils/frame';
import type { DrawingShape } from '@/@types/drawer';

export type ImageFormat = 'png' | 'svg' | 'pdf';

export type ImageOptions = {
  /** Background color, transparent when undefined */
  background?: string;
  /** Dark mode colors (see `toDarkColor`) */
  dark?: boolean;
  /** Pixel ratio of png and pdf (default 2) */
  scale?: number;
};

export type Box = { x: number; y: number; width: number; height: number };

// space around shapes
const padding = 16;

/**
 * Box of shapes with padding, in coordinates of their layer, null without shapes
 */
export function getExportBox(shapes: DrawingShape[], layer: Container): Box | null {
  const rects = shapes.map((shape) => shape.getClientRect({ relativeTo: layer }));

  if (!rects.length) return null;

  const x = Math.floor(Math.min(...rects.map((r) => r.x)) - padding);
  const y = Math.floor(Math.min(...rects.map((r) => r.y)) - padding);
  const right = Math.ceil(Math.max(...rects.map((r) => r.x + r.width)) + padding);
  const bottom = Math.ceil(Math.max(...rects.map((r) => r.y + r.height)) + padding);

  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Color of dark mode, as css filter `invert(93%) hue-rotate(180deg)`: lightness inverted, hue kept
 */
export function toDarkColor(color: string): string {
  const normalized = normalizeColor(color);
  const [r, g, b, a = 1] = normalized.startsWith('#')
    ? [1, 3, 5].map((i) => parseInt(normalized.slice(i, i + 2), 16))
    : (normalized.match(/[\d.]+/g) ?? []).map(Number);
  // invert 93%
  const [ir, ig, ib] = [r, g, b].map((c) => 0.93 * (1 - c / 255) + 0.07 * (c / 255));
  // hue rotate 180deg
  const rgb = [
    -0.574 * ir + 1.43 * ig + 0.144 * ib,
    0.426 * ir + 0.43 * ig + 0.144 * ib,
    0.426 * ir + 1.43 * ig - 0.856 * ib,
  ].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255));

  return a < 1
    ? `rgba(${rgb.join(', ')}, ${a})`
    : '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Exported shapes are rendered with dark mode colors or not
 */
function colorOf(color: unknown, dark?: boolean): string | undefined {
  if (typeof color !== 'string' || !color) return undefined;

  return dark ? toDarkColor(color) : color;
}

/**
 * Shapes rendered on a canvas (png, pdf, clipboard), same rendering as drawer
 */
/**
 * Transform of a node in its layer: shapes of groups exported alone are placed as drawn
 */
function layerTransform(node: Node) {
  return node.getAbsoluteTransform(node.getLayer() ?? undefined);
}

export function renderCanvas(shapes: DrawingShape[], box: Box, options: ImageOptions = {}): HTMLCanvasElement {
  const { background, dark, scale = 2 } = options;
  // not in page
  const stage = new Stage({ container: document.createElement('div'), width: box.width, height: box.height });
  const layer = new Layer({ x: -box.x, y: -box.y });

  stage.add(layer);
  if (background) layer.add(new Rect({ ...box, fill: colorOf(background, dark) }));

  shapes.forEach((shape) => {
    const clone = shape.clone({ draggable: false }) as DrawingShape;

    // title of frames not exported
    if (clone instanceof Group) clone.find(`.${frameParts.title}`).forEach((title) => title.hide());
    // shape of a group exported alone
    if (shape.getParent() !== shape.getLayer()) {
      clone.setAttrs({ ...layerTransform(shape).decompose(), offsetX: 0, offsetY: 0 });
    }
    // shapes of groups too
    if (dark) {
      getShapes(clone).forEach((s) => s.setAttrs({ fill: colorOf(s.fill(), dark), stroke: colorOf(s.stroke(), dark) }));
    }
    layer.add(clone);
  });

  const canvas = stage.toCanvas({ pixelRatio: scale });

  stage.destroy();
  return canvas;
}

// svg numbers with 2 decimals at most
const num = (n: number) => String(Math.round(n * 100) / 100);

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attrs = (values: Record<string, string | number | undefined>) =>
  Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([name, value]) => ` ${name}="${typeof value === 'number' ? num(value) : escapeXml(value!)}"`)
    .join('');

/**
 * Path of a line, as konva draws it (tension curves)
 */
function linePath(line: Line): string {
  const points = line.points();
  const length = points.length;

  if (!length) return '';

  let d = `M${num(points[0])} ${num(points[1])}`;

  if (line.tension() !== 0 && length > 4) {
    const tp = line.getTensionPoints() as number[];
    const closed = line.closed();
    let n = closed ? 0 : 4;

    if (!closed) d += `Q${tp.slice(0, 4).map(num).join(' ')}`;
    while (n < tp.length - 2) {
      d += `C${tp.slice(n, n + 6).map(num).join(' ')}`;
      n += 6;
    }
    if (!closed) d += `Q${[tp[tp.length - 2], tp[tp.length - 1], points[length - 2], points[length - 1]].map(num).join(' ')}`;
  } else {
    for (let n = 2; n < length; n += 2) d += `L${num(points[n])} ${num(points[n + 1])}`;
  }

  return line.closed() ? d + 'Z' : d;
}

/**
 * Svg element of a drawing shape or group, in its parent coordinates (`matrix`: transform in another one)
 */
function shapeToSvg(shape: Node, dark?: boolean, matrix = shape.getTransform().getMatrix()): string {
  const [a, b, c, d, e, f] = matrix;
  const group = attrs({
    transform: `matrix(${[a, b, c, d, e, f].map(num).join(' ')})`,
    opacity: shape.opacity() !== 1 ? shape.opacity() : undefined,
    // highlights
    style: shape.globalCompositeOperation() === 'multiply' ? 'mix-blend-mode:multiply' : undefined,
  });

  if (shape instanceof Group) {
    // title of frames not exported
    const children = shape.getChildren().filter((child) => child.visible() && !child.hasName(frameParts.title));
    // shapes of frames cut at their edges
    const clip = shape.clipWidth() && shape.clipHeight() ? `drawer-clip-${shape._id}` : '';
    const clipRect = attrs({ width: shape.clipWidth(), height: shape.clipHeight() });
    const clipPath = clip ? `<clipPath${attrs({ id: clip })}><rect${clipRect}/></clipPath>` : '';

    return `<g${group}${clip ? attrs({ 'clip-path': `url(#${clip})` }) : ''}>${clipPath}${children
      .map((child) => shapeToSvg(child, dark))
      .join('')}</g>`;
  }

  if (!(shape instanceof Shape)) return '';

  const stroke = shape.strokeEnabled() ? colorOf(shape.stroke(), dark) : undefined;
  const strokeAttrs = (dash = true) =>
    attrs({
      stroke: stroke ?? 'none',
      'stroke-width': stroke ? shape.strokeWidth() : undefined,
      'stroke-linecap': stroke ? shape.lineCap() : undefined,
      'stroke-linejoin': stroke ? shape.lineJoin() : undefined,
      'stroke-dasharray': stroke && dash && shape.dash()?.length ? shape.dash().map(num).join(' ') : undefined,
    });
  const fill = colorOf(shape.fill(), dark) ?? 'none';

  if (shape instanceof Rect) {
    const radius = shape.cornerRadius();

    return `<g${group}><rect${attrs({ width: shape.width(), height: shape.height(), rx: typeof radius === 'number' && radius ? radius : undefined, fill })}${strokeAttrs()}/></g>`;
  }

  if (shape instanceof Ellipse) {
    return `<g${group}><ellipse${attrs({ rx: shape.radiusX(), ry: shape.radiusY(), fill })}${strokeAttrs()}/></g>`;
  }

  if (shape instanceof Path) {
    return `<g${group}><path${attrs({ d: shape.data(), fill })}${strokeAttrs()}/></g>`;
  }

  if (shape instanceof Arrow) {
    const points = shape.points();
    const n = points.length;
    const angle = (Math.atan2(points[n - 1] - points[n - 3], points[n - 2] - points[n - 4]) * 180) / Math.PI;
    const length = shape.pointerLength();
    const width = shape.pointerWidth();
    const head = `<path${attrs({
      d: `M0 0L${num(-length)} ${num(width / 2)}L${num(-length)} ${num(-width / 2)}Z`,
      transform: `translate(${num(points[n - 2])} ${num(points[n - 1])}) rotate(${num(angle)})`,
      fill,
    })}${strokeAttrs(false)}/>`;

    return `<g${group}><path${attrs({ d: linePath(shape), fill: 'none' })}${strokeAttrs()}/>${head}</g>`;
  }

  if (shape instanceof Line) {
    // closed line (brush) is filled
    return `<g${group}><path${attrs({ d: linePath(shape), fill: shape.closed() ? fill : 'none' })}${strokeAttrs()}/></g>`;
  }

  if (shape instanceof Text) {
    const padding = shape.padding();
    const fontSize = shape.fontSize();
    const lineHeight = shape.lineHeight() * fontSize;
    const style = shape.fontStyle();
    const decoration = shape.textDecoration();
    // baseline as konva draws it: font box centered in line height
    const { fontBoundingBoxAscent: ascent, fontBoundingBoxDescent: descent } = shape.measureSize('M');
    const baseline = padding + lineHeight / 2 + (ascent - descent) / 2;
    const decorationOffset = Math.round(fontSize / 4);
    const lines = shape.textArr.map((line, i) => {
      const x =
        padding +
        (shape.align() === 'right'
          ? shape.width() - line.width - padding * 2
          : shape.align() === 'center'
          ? (shape.width() - line.width - padding * 2) / 2
          : 0);
      const y = baseline + i * lineHeight;
      // decorations drawn as konva draws them
      const decorationLine = (dy: number) =>
        `<path${attrs({ d: `M${num(x)} ${num(y + dy)}h${num(Math.round(line.width))}`, stroke: fill, 'stroke-width': fontSize / 15 })}/>`;

      return (
        `<text${attrs({ x, y })} xml:space="preserve">${escapeXml(line.text)}</text>` +
        (decoration.includes('underline') ? decorationLine(shape.underlineOffset() ?? decorationOffset) : '') +
        (decoration.includes('line-through') ? decorationLine(-decorationOffset) : '')
      );
    });
    const font = attrs({
      'font-family': `${shape.fontFamily()}, sans-serif`,
      'font-size': fontSize,
      'font-style': style.includes('italic') ? 'italic' : undefined,
      'font-weight': style.includes('bold') ? 'bold' : undefined,
      fill,
    });

    return `<g${group}${font}>${lines.join('')}</g>`;
  }

  return '';
}

/**
 * Shapes as svg (vector) image
 */
export function renderSvg(shapes: DrawingShape[], box: Box, options: ImageOptions = {}): string {
  const { background, dark } = options;
  const size = attrs({ width: box.width, height: box.height });
  const backgroundRect = background ? `<rect${attrs({ ...box, fill: colorOf(background, dark) })}/>` : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg"${size}${attrs({ viewBox: [box.x, box.y, box.width, box.height].join(' ') })}>` +
    backgroundRect +
    shapes.map((shape) => shapeToSvg(shape, dark, layerTransform(shape).getMatrix())).join('') +
    '</svg>'
  );
}

/**
 * Blob of a canvas image
 */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('image not created'))), type, quality)
  );
}

/**
 * Pdf of one page showing a jpeg image (raster pdf, no library needed)
 * @param jpeg Image bytes
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @param scale Pixel ratio of image: page has the drawing size (96 dpi)
 */
export function createPdf(jpeg: Uint8Array<ArrayBuffer>, width: number, height: number, scale: number): Blob {
  // css pixel to pdf point
  const pageWidth = num((width / scale) * 0.75);
  const pageHeight = num((height / scale) * 0.75);
  const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
  const encoder = new TextEncoder();
  const parts: Uint8Array<ArrayBuffer>[] = [];
  const offsets: number[] = [];
  let length = 0;
  const add = (part: string | Uint8Array<ArrayBuffer>) => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part;

    parts.push(bytes);
    length += bytes.length;
  };
  const object = (body: string | (string | Uint8Array<ArrayBuffer>)[]) => {
    offsets.push(length);
    add(`${offsets.length} 0 obj\n`);
    (Array.isArray(body) ? body : [body]).forEach(add);
    add('\nendobj\n');
  };

  add('%PDF-1.4\n');
  object('<< /Type /Catalog /Pages 2 0 R >>');
  object('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
  );
  object([
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    jpeg,
    '\nendstream',
  ]);
  object(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xref = length;

  add(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  offsets.forEach((offset) => add(`${String(offset).padStart(10, '0')} 00000 n \n`));
  add(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob(parts, { type: 'application/pdf' });
}
