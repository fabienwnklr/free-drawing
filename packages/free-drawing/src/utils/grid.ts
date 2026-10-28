import type { Context } from 'konva/lib/Context';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { IRect, Vector2d } from 'konva/lib/types';
import type { GridStyle } from '@/@types/drawer';
import { gridSize } from '@/constants';

/** Space between the lines (or dots) drawn, at least, on screen in px: every other one drawn when zoomed out */
const minSpacing = 10;

/** Size of the dots of the dotted grid, on screen in px */
const dotSize = 2.5;

/** Slope of the slanted lines of the isometric grid (30 degrees) */
const slope = 1 / Math.sqrt(3);

/**
 * Space between the columns of points of the isometric grid: its triangles have sides of `side`
 * @param side Side of the triangles
 * @returns Horizontal space between the vertical lines
 */
const columnWidth = (side: number) => (side * Math.sqrt(3)) / 2;

/**
 * Style of the shape drawing the grid
 * @param style Style of the grid
 * @returns Attributes of the konva shape: dashed lines of squares, solid ones of paper, filled dots
 */
export function gridShapeStyle(style: GridStyle): ShapeConfig {
  if (style === 'dots') return { fill: 'rgba(0, 0, 0, 0.35)' };
  if (style === 'squares') return { stroke: 'rgba(0, 0, 0, 0.2)', strokeWidth: 1, dash: [3, 3] };

  return { stroke: 'rgba(0, 0, 0, 0.15)', strokeWidth: 1 };
}

/**
 * Space between the lines drawn at a zoom: `gridSize`, doubled while they would be too near on screen (the lines drawn
 * are lines of the grid: shapes snap to all of them)
 * @param scale Zoom level
 * @returns Space between the lines drawn, in drawing units
 */
export function gridStep(scale: number): number {
  let step = gridSize;

  while (step * scale < minSpacing) step *= 2;

  return step;
}

/**
 * Point of the grid nearest to a point: crossing of lines (squares, dots), height of a line (lines: x kept), corner of
 * the triangles (isometric)
 * @param point Point, in drawing coordinates
 * @param style Style of the grid
 * @returns Point snapped to the grid
 */
export function snapToGrid(point: Vector2d, style: GridStyle): Vector2d {
  const round = (value: number, step: number) => Math.round(value / step) * step;

  if (style === 'lines') return { x: point.x, y: round(point.y, gridSize) };
  if (style !== 'isometric') return { x: round(point.x, gridSize), y: round(point.y, gridSize) };

  // columns of points, every other one shifted by half a side: nearest point of the two columns around
  const width = columnWidth(gridSize);
  let nearest = point;
  let distance = Infinity;

  for (const column of [Math.floor(point.x / width), Math.ceil(point.x / width)]) {
    const shift = Math.abs(column % 2) * (gridSize / 2);
    const candidate = { x: column * width, y: round(point.y - shift, gridSize) + shift };
    const d = Math.hypot(candidate.x - point.x, candidate.y - point.y);

    if (d < distance) [nearest, distance] = [candidate, d];
  }

  return nearest;
}

/**
 * Angles a selection snaps to while it is rotated with the grid shown
 * @param style Style of the grid
 * @returns Every 30 degrees for the isometric grid, else every 90 degrees
 */
export function gridRotationSnaps(style: GridStyle): number[] {
  const step = style === 'isometric' ? 30 : 90;

  return Array.from({ length: 360 / step }, (_, i) => i * step);
}

/**
 * Draw the grid in an area: squares of dashed lines (one stroke per line: browsers draw the dashes of a straight line
 * faster than those of a path of many lines), dots at their crossings, horizontal lines of ruled paper, or triangles
 * of isometric paper (vertical and 30 degrees lines)
 * @param ctx Context of the shape drawing the grid
 * @param shape Shape drawing the grid (stroke or fill of `gridShapeStyle`)
 * @param area Area to fill, in drawing coordinates (view)
 * @param scale Zoom level
 * @param style Style of the grid
 */
export function drawGrid(ctx: Context, shape: Shape, area: IRect, scale: number, style: GridStyle) {
  const step = gridStep(scale);
  const x1 = area.x;
  const y1 = area.y;
  const x2 = area.x + area.width;
  const y2 = area.y + area.height;
  // lines start on the grid, so dashes don't move with the view
  const startX = Math.floor(x1 / step) * step;
  const startY = Math.floor(y1 / step) * step;
  const line = (fromX: number, fromY: number, toX: number, toY: number) => {
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
  };

  if (style === 'squares') {
    for (let x = startX; x <= x2; x += step) {
      ctx.beginPath();
      line(x, startY, x, y2);
      ctx.strokeShape(shape);
    }
    for (let y = startY; y <= y2; y += step) {
      ctx.beginPath();
      line(startX, y, x2, y);
      ctx.strokeShape(shape);
    }
    return;
  }

  ctx.beginPath();
  if (style === 'dots') {
    const size = dotSize / scale;

    for (let x = startX; x <= x2; x += step) {
      for (let y = startY; y <= y2; y += step) ctx.rect(x - size / 2, y - size / 2, size, size);
    }
    ctx.fillShape(shape);
    return;
  }
  if (style === 'lines') {
    for (let y = startY; y <= y2; y += step) line(x1, y, x2, y);
  } else {
    const width = columnWidth(step);

    for (let x = Math.floor(x1 / width) * width; x <= x2; x += width) line(x, y1, x, y2);
    // y = ±slope * x + c, c a multiple of the side: through the corners of the triangles
    for (const s of [slope, -slope]) {
      const offsets = [y1 - s * x1, y1 - s * x2, y2 - s * x1, y2 - s * x2];

      for (let c = Math.floor(Math.min(...offsets) / step) * step; c <= Math.max(...offsets); c += step) {
        line(x1, s * x1 + c, x2, s * x2 + c);
      }
    }
  }
  ctx.strokeShape(shape);
}
