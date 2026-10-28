import { Container } from 'konva/lib/Container';
import type { Node } from 'konva/lib/Node';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import { Line } from 'konva/lib/shapes/Line';
import { Path } from 'konva/lib/shapes/Path';
import { Rect } from 'konva/lib/shapes/Rect';
import type { DrawingShape } from '@/@types/drawer';
import { isFrame } from '@/utils/frame';

/** Time before the ids of the library (2020): earlier times are parts of other ids */
const firstTime = 1.58e12;

/**
 * Time a shape was created, read from its id: ids of the library are the time then random characters in base 36
 * (`createId`)
 * @param id Id of a shape
 * @returns Time (ms), null for other ids (files of other apps, previous versions)
 */
export function creationTime(id: string): number | null {
  const time = /^[0-9a-z]{13,16}$/.test(id) ? parseInt(id.slice(0, 8), 36) : NaN;

  // not in the future (a day of clock difference between users)
  return time > firstTime && time < Date.now() + 864e5 ? time : null;
}

/**
 * Shapes in the order they were created (ids of the library), from bottom to top for the others: a shape without time
 * comes after the shape below it; a group at the time of its first shape (grouped later), a frame at its own time
 * @param shapes Shapes of the drawing and of its frames, from bottom to top
 * @returns The shapes, the first created first
 */
export function inCreationOrder<T extends Node>(shapes: T[]): T[] {
  let previous = 0;
  const keyed = shapes.map((shape, index) => {
    const nodes = shape instanceof Container && !isFrame(shape) ? [shape, ...shape.find(() => true)] : [shape];
    const times = nodes.map((node) => creationTime(node.id())).filter((time): time is number => time !== null);

    previous = times.length ? Math.min(...times) : previous;
    return { shape, time: previous, index };
  });

  return keyed.sort((a, b) => a.time - b.time || a.index - b.index).map(({ shape }) => shape);
}

/**
 * Length of the outline of a shape, drawn by a moving dash during the replay
 * @param shape Rectangle, ellipse, path, line or arrow
 * @returns Length in coordinates of the shape, 0 for other shapes
 */
export function outlineLength(shape: DrawingShape): number {
  if (shape instanceof Rect) return 2 * (shape.width() + shape.height());
  if (shape instanceof Ellipse) {
    const [a, b] = [shape.radiusX(), shape.radiusY()];

    // Ramanujan
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }
  if (shape instanceof Path) return shape.getLength();
  if (shape instanceof Line || shape instanceof Arrow) {
    const points = shape.points();
    let length = 0;

    for (let i = 2; i < points.length; i += 2) {
      length += Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1]);
    }
    return length;
  }

  return 0;
}

/**
 * Freehand stroke drawn up to a progress: its outline (perfect-freehand: one side from start to end, then the other one
 * back) cut at the same place on both sides
 * @param points Points of the whole outline (konva coordinates)
 * @param progress From 0 (start of the stroke) to 1 (whole stroke)
 * @returns Points of the outline drawn so far
 */
export function partialStroke(points: number[], progress: number): number[] {
  const count = points.length / 2;
  const half = Math.floor(count / 2);
  const shown = Math.max(1, Math.round(half * progress));

  if (progress >= 1 || half < 2) return points;

  // first points of the first side, last points of the other side (back to the start)
  return [...points.slice(0, shown * 2), ...points.slice((count - shown) * 2)];
}
