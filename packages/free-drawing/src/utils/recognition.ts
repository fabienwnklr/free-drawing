import type { IRect, Vector2d } from 'konva/lib/types';
import type { RecognizedKind, RecognizedShape } from '@/@types/shapes';

/** Points compared along a stroke and along the outline of a shape */
const samples = 64;

/** Distance between the ends of a closed stroke, at most, in diagonals of its box */
const closedGap = 0.25;

/** Mean distance between a closed stroke and the outline of its shape, at most, in diagonals of its box */
const closedError = 0.05;

/** Mean distance of the points of a straight stroke to the line between its ends, at most, in lengths of the line */
const lineError = 0.025;

/** Distance of a point of a straight stroke to the line between its ends, at most, in lengths of the line */
const lineDeviation = 0.07;

/** Corners of closed shapes in a box of size 1, compared with closed strokes (ellipse sampled apart) */
const polygons: Partial<Record<RecognizedKind, Vector2d[]>> = {
  rect: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  // as the triangle tool: pointing up
  triangle: [
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  diamond: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 },
  ],
};

/**
 * Distance between two points
 * @param a First point
 * @param b Second point
 * @returns Euclidean distance
 */
const distance = (a: Vector2d, b: Vector2d) => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * Distance from a point to a segment
 * @param p Point
 * @param a Start of the segment
 * @param b End of the segment
 * @returns Distance to the nearest point of the segment
 */
function segmentDistance(p: Vector2d, a: Vector2d, b: Vector2d): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;

  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/**
 * Distance from a point to a path
 * @param p Point
 * @param path Points of the path
 * @param closed Last point joined to the first one
 * @returns Distance to the nearest segment of the path
 */
function pathDistance(p: Vector2d, path: Vector2d[], closed: boolean): number {
  let min = Infinity;
  const count = closed ? path.length : path.length - 1;

  for (let i = 0; i < count; i++) min = Math.min(min, segmentDistance(p, path[i], path[(i + 1) % path.length]));

  return min;
}

/**
 * Points regularly spaced along a path
 * @param path Points of the path (2 at least)
 * @param count Number of points
 * @param closed Last point joined to the first one
 * @returns `count` points, the first one at the start of the path
 */
export function resample(path: Vector2d[], count: number, closed = false): Vector2d[] {
  const points = closed ? [...path, path[0]] : path;
  const lengths = points.slice(1).map((point, i) => distance(points[i], point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const step = total / (closed ? count : count - 1);
  const result: Vector2d[] = [];
  let segment = 0;
  // length of the path before the current segment
  let before = 0;

  for (let i = 0; i < count; i++) {
    const at = Math.min(i * step, total);

    while (segment < lengths.length - 1 && before + lengths[segment] < at) before += lengths[segment++];

    const a = points[segment];
    const b = points[segment + 1] ?? a;
    const t = lengths[segment] ? (at - before) / lengths[segment] : 0;

    result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }

  return result;
}

/**
 * Path simplified (Ramer–Douglas–Peucker): points farther than a tolerance from the line between the kept ones
 * @param path Points of the path
 * @param tolerance Distance of the points left out to the simplified path, at most
 * @returns Points kept, both ends included
 */
export function simplifyPath(path: Vector2d[], tolerance: number): Vector2d[] {
  if (path.length < 3) return path;

  let farthest = 0;
  let index = 0;

  for (let i = 1; i < path.length - 1; i++) {
    const d = segmentDistance(path[i], path[0], path.at(-1)!);

    if (d > farthest) [farthest, index] = [d, i];
  }
  if (farthest <= tolerance) return [path[0], path.at(-1)!];

  return [
    ...simplifyPath(path.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplifyPath(path.slice(index), tolerance),
  ];
}

/**
 * Box of points
 * @param points Points (1 at least)
 * @returns Smallest box holding them
 */
function boxOf(points: Vector2d[]): IRect {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);

  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/**
 * Outline of a closed shape in a box, as a polygon
 * @param kind Closed shape
 * @param box Box of the stroke
 * @returns Points of its outline (ellipse: sampled)
 */
function outlineOf(kind: RecognizedKind, { x, y, width, height }: IRect): Vector2d[] {
  if (kind === 'ellipse') {
    return Array.from({ length: samples }, (_, i) => ({
      x: x + width / 2 + (Math.cos((i / samples) * 2 * Math.PI) * width) / 2,
      y: y + height / 2 + (Math.sin((i / samples) * 2 * Math.PI) * height) / 2,
    }));
  }

  return polygons[kind]!.map((p) => ({ x: x + p.x * width, y: y + p.y * height }));
}

/**
 * Closed stroke as a closed shape: the one whose outline in the box of the stroke is the nearest (mean distance from
 * the stroke to the outline and from the outline to the stroke: a part missing counts)
 * @param stroke Points of the stroke, regularly spaced
 * @param box Box of the stroke
 * @returns Nearest shape, null when none is near enough
 */
function recognizeClosed(stroke: Vector2d[], box: IRect): RecognizedKind | null {
  const diagonal = Math.hypot(box.width, box.height);
  let best: RecognizedKind | null = null;
  let bestError = closedError;

  for (const kind of ['rect', 'ellipse', 'triangle', 'diamond'] as const) {
    const outline = outlineOf(kind, box);
    const toOutline = stroke.reduce((sum, p) => sum + pathDistance(p, outline, true), 0) / stroke.length;
    const toStroke =
      resample(outline, samples, true).reduce((sum, p) => sum + pathDistance(p, stroke, true), 0) / samples;
    const error = (toOutline + toStroke) / 2 / diagonal;

    if (error < bestError) [best, bestError] = [kind, error];
  }

  return best;
}

/**
 * Open stroke as an arrow: a long straight shaft, a head of short strokes at one end (behind its tip, at least one
 * aside the shaft), drawn after or before the shaft
 * @param stroke Points of the stroke
 * @param tolerance Distance to the simplified stroke, at most
 * @returns Tail and tip of the arrow, null for another stroke
 */
function recognizeArrow(stroke: Vector2d[], tolerance: number): RecognizedShape | null {
  const corners = simplifyPath(stroke, tolerance);

  if (corners.length < 3) return null;

  const lengths = corners.slice(1).map((corner, i) => distance(corners[i], corner));
  const shaft = lengths.indexOf(Math.max(...lengths));
  // head after the shaft (its tip the end of the shaft), else before it
  const headAfter = shaft === 0;

  if (!headAfter && shaft !== lengths.length - 1) return null;

  const tip = headAfter ? corners[1] : corners.at(-2)!;
  const tail = headAfter ? corners[0] : corners.at(-1)!;
  const head = headAfter ? corners.slice(2) : corners.slice(0, -2);
  const length = lengths[shaft];
  const direction = { x: (tail.x - tip.x) / length, y: (tail.y - tip.y) / length };
  const heads = head.map((point) => {
    const offset = distance(point, tip);
    const along = (point.x - tip.x) * direction.x + (point.y - tip.y) * direction.y;
    const aside = Math.abs((point.x - tip.x) * direction.y - (point.y - tip.y) * direction.x);

    return {
      // near the tip, not in front of it
      near: offset < length * 0.6 && along > -length * 0.1,
      // end of a wing: behind the tip, 60 degrees from the shaft at most, not a flick of the pen (nor a check mark)
      wing: offset > length * 0.06 && aside > length * 0.03 && along >= offset * 0.5,
    };
  });

  if (heads.some(({ near }) => !near) || !heads.some(({ wing }) => wing)) return null;

  return { kind: 'arrow', start: tail, end: tip };
}

/**
 * Shape recognized in a freehand stroke: closed stroke near the outline of a rectangle, an ellipse, a triangle
 * (pointing up) or a diamond in its box; open stroke as an arrow (straight shaft and head), or straight as a line
 * @param points Points of the stroke (pointer path), in drawing coordinates
 * @param minSize Diagonal of the box of the stroke, at least (smaller strokes, as letters, are kept)
 * @returns Shape recognized, null for another stroke
 */
export function recognizeShape(points: Vector2d[], minSize: number = 0): RecognizedShape | null {
  if (points.length < 3) return null;

  const box = boxOf(points);
  const diagonal = Math.hypot(box.width, box.height);

  if (!diagonal || diagonal < minSize) return null;

  const stroke = resample(points, samples);
  const start = points[0];
  const end = points.at(-1)!;
  const corners = { start: { x: box.x, y: box.y }, end: { x: box.x + box.width, y: box.y + box.height } };

  // closed: ends near each other, not a thin loop
  if (distance(start, end) <= diagonal * closedGap && Math.min(box.width, box.height) > diagonal * 0.15) {
    const kind = recognizeClosed(stroke, box);

    return kind && { kind, ...corners };
  }

  const arrow = recognizeArrow(stroke, diagonal * 0.05);

  if (arrow) return arrow;

  // straight: points near the line between its ends
  const length = distance(start, end);
  const deviations = stroke.map((p) => segmentDistance(p, start, end));
  const mean = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

  if (length && mean <= length * lineError && Math.max(...deviations) <= length * lineDeviation) {
    return { kind: 'line', start, end };
  }

  return null;
}
