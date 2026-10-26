import type { IRect, Vector2d } from 'konva/lib/types';
import type { ElbowLine, ElbowSegment, EndBoxes, GridLine } from '@/@types/shapes';

/**
 * Least distance an elbow arrow goes straight out of a linked shape before turning, and keeps from its shapes (less
 * between close shapes)
 */
export const elbowMargin = 24;

/** Cost of a turn, in units of length: fewer turns are preferred to a shorter path */
const turnCost = 40;

/** Cost of a turn onto a line of the grid out of the middles between the ends and between the shapes */
const sideCost = 1;

/** Cost of a turn onto another line than the one chosen for the middle segment (`elbowMid`): taken only without it */
const avoidCost = 10_000;

/** Coordinates closer than this are the same line */
const epsilon = 0.01;

/** Steps of the 4 directions: right, down, left, up (opposite direction: index + 2) */
const steps: Vector2d[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

/**
 * Direction along the longest distance of a vector
 * @param vector Vector
 * @returns Index of the direction in `steps`
 */
const directionOf = ({ x, y }: Vector2d) => (Math.abs(x) >= Math.abs(y) ? (x >= 0 ? 0 : 2) : y >= 0 ? 1 : 3);

/**
 * Center of a box
 * @param box Box
 * @returns Center
 */
const centerOf = (box: IRect): Vector2d => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/**
 * Box grown on each side
 * @param box Box
 * @param margin Distance added on each side
 * @returns Grown box
 */
const grow = (box: IRect, margin: number): IRect => ({
  x: box.x - margin,
  y: box.y - margin,
  width: box.width + margin * 2,
  height: box.height + margin * 2,
});

/**
 * Point strictly inside a box (its border is free)
 * @param point Point
 * @param box Box
 * @returns True inside
 */
const isInside = (point: Vector2d, box: IRect) =>
  point.x > box.x + epsilon &&
  point.x < box.x + box.width - epsilon &&
  point.y > box.y + epsilon &&
  point.y < box.y + box.height - epsilon;

/**
 * Space between two boxes along the axis they are the farthest apart on
 * @param a Box
 * @param b Other box
 * @returns Distance, negative when they overlap
 */
const separation = (a: IRect, b: IRect) =>
  Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), b.y - (a.y + a.height), a.y - (b.y + b.height));

/**
 * Point where a line leaving a point in a direction crosses the border of a box around it
 * @param point Point in the box (end of an arrow on a side of its shape)
 * @param direction Index of the direction
 * @param box Box around the shape, grown by the margin (none: free end, the point itself)
 * @returns Point on the border ahead, the point itself when it is out of the box already
 */
function exitPoint(point: Vector2d, direction: number, box?: IRect): Vector2d {
  if (!box) return point;

  const step = steps[direction];
  const distance =
    step.x > 0
      ? box.x + box.width - point.x
      : step.x < 0
      ? point.x - box.x
      : step.y > 0
      ? box.y + box.height - point.y
      : point.y - box.y;

  return { x: point.x + step.x * Math.max(0, distance), y: point.y + step.y * Math.max(0, distance) };
}

/**
 * Points without repeated ones nor points in the middle of a straight line
 * @param points Points of an elbow path
 * @returns Corners of the path, with its ends
 */
function simplify(points: Vector2d[]): Vector2d[] {
  const result: Vector2d[] = [];

  for (const point of points) {
    const last = result.at(-1);

    if (last && Math.abs(last.x - point.x) < epsilon && Math.abs(last.y - point.y) < epsilon) continue;

    const before = result.at(-2);

    if (
      before &&
      last &&
      ((Math.abs(before.x - last.x) < epsilon && Math.abs(last.x - point.x) < epsilon) ||
        (Math.abs(before.y - last.y) < epsilon && Math.abs(last.y - point.y) < epsilon))
    ) {
      result.pop();
    }
    result.push(point);
  }
  return result;
}

/**
 * Elbow path when the grid has none (shapes overlapping): a turn in the middle between the ends, or one corner
 * @param start Start of the arrow
 * @param end End of the arrow
 * @param startDirection Direction leaving the start
 * @param endDirection Direction leaving the end (the arrow arrives the other way)
 * @returns Points of the path
 */
function simpleElbow(start: Vector2d, end: Vector2d, startDirection: number, endDirection: number): Vector2d[] {
  const [fromSide, toSide] = [startDirection % 2 === 0, endDirection % 2 === 0];
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  if (fromSide && toSide) return simplify([start, { x: middle.x, y: start.y }, { x: middle.x, y: end.y }, end]);
  if (!fromSide && !toSide) return simplify([start, { x: start.x, y: middle.y }, { x: end.x, y: middle.y }, end]);
  return simplify([start, fromSide ? { x: end.x, y: start.y } : { x: start.x, y: end.y }, end]);
}

/**
 * Lines of the grid along one axis, sorted, same coordinates merged (cheapest turn kept)
 * @param middles Coordinates in the middle between the ends and between the shapes (no cost)
 * @param others Coordinates of the exits and of the borders of the boxes around the shapes
 * @param chosen Coordinate chosen for the middle segment on this axis: the only line without cost
 * @returns Lines sorted by coordinate
 */
function gridLines(middles: number[], others: number[], chosen?: number): GridLine[] {
  const lines = [
    ...middles.map((value) => ({ value, cost: 0 })),
    ...others.map((value) => ({ value, cost: sideCost })),
  ].map((line) => (chosen === undefined ? line : { ...line, cost: avoidCost }));

  if (chosen !== undefined) lines.push({ value: chosen, cost: 0 });
  lines.sort((a, b) => a.value - b.value);

  const merged: GridLine[] = [];

  for (const line of lines) {
    const last = merged.at(-1);

    if (last && line.value - last.value < epsilon) last.cost = Math.min(last.cost, line.cost);
    else merged.push({ ...line });
  }
  return merged;
}

/**
 * Cheapest path on the grid between two points (length, turns, lines turned onto), never inside a box nor going back
 * @param from Exit of the start (grid node)
 * @param startDirection Direction the path leaves `from`
 * @param to Entry of the end (grid node)
 * @param arrival Direction the path must reach `to` in (a turn there costs one)
 * @param obstacles Boxes around the linked shapes
 * @param xs Vertical lines of the grid
 * @param ys Horizontal lines of the grid
 * @returns Nodes of the path from `from` to `to`, null without path
 */
function searchGrid(
  from: Vector2d,
  startDirection: number,
  to: Vector2d,
  arrival: number,
  obstacles: IRect[],
  xs: GridLine[],
  ys: GridLine[]
): Vector2d[] | null {
  const free = (point: Vector2d) => !obstacles.some((box) => isInside(point, box));
  const find = (lines: GridLine[], value: number) => lines.findIndex((line) => Math.abs(line.value - value) < epsilon);
  const [fromI, fromJ, toI, toJ] = [find(xs, from.x), find(ys, from.y), find(xs, to.x), find(ys, to.y)];

  if (fromI < 0 || fromJ < 0 || toI < 0 || toJ < 0 || !free(from) || !free(to)) return null;

  // state: node of the grid and direction it was reached in
  const key = (i: number, j: number, direction: number) => (i * ys.length + j) * 4 + direction;
  const costs = new Float64Array(xs.length * ys.length * 4).fill(Infinity);
  const previous = new Int32Array(costs.length).fill(-1);
  const done = new Uint8Array(costs.length);
  const open = new Set([key(fromI, fromJ, startDirection)]);
  // cost of a turn onto the line along a direction at a node
  const turn = (direction: number, i: number, j: number) => turnCost + (direction % 2 ? xs[i].cost : ys[j].cost);

  costs[key(fromI, fromJ, startDirection)] = 0;
  while (open.size) {
    let current = -1;

    for (const state of open) if (current < 0 || costs[state] < costs[current]) current = state;
    open.delete(current);
    done[current] = 1;

    const direction = current % 4;
    const node = (current - direction) / 4;
    const [i, j] = [Math.floor(node / ys.length), node % ys.length];

    for (const [next, step] of steps.entries()) {
      // never back
      if (next === (direction + 2) % 4) continue;

      const [ni, nj] = [i + step.x, j + step.y];

      if (ni < 0 || nj < 0 || ni >= xs.length || nj >= ys.length) continue;

      const a = { x: xs[i].value, y: ys[j].value };
      const b = { x: xs[ni].value, y: ys[nj].value };

      // node and segment out of the boxes (their borders are lines of the grid: the middle of a segment tells)
      if (!free(b) || !free({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })) continue;

      const state = key(ni, nj, next);
      const cost =
        costs[current] + Math.abs(b.x - a.x) + Math.abs(b.y - a.y) + (next === direction ? 0 : turn(next, i, j));

      if (done[state] || cost >= costs[state]) continue;
      costs[state] = cost;
      previous[state] = current;
      open.add(state);
    }
  }

  // arrival in the direction of the end: a turn at the entry costs one, never back
  let best = -1;
  let bestCost = Infinity;

  for (const [direction] of steps.entries()) {
    const state = key(toI, toJ, direction);
    const last = direction === arrival ? 0 : direction === (arrival + 2) % 4 ? Infinity : turn(arrival, toI, toJ);

    if (costs[state] + last < bestCost) [best, bestCost] = [state, costs[state] + last];
  }
  if (best < 0) return null;

  const path: Vector2d[] = [];

  for (let state = best; state >= 0; state = previous[state]) {
    const node = (state - (state % 4)) / 4;

    path.unshift({ x: xs[Math.floor(node / ys.length)].value, y: ys[node % ys.length].value });
  }
  return path;
}

/**
 * Path of an elbow arrow: horizontal and vertical lines leaving the sides of the linked shapes (straight out of them
 * first), around them, turns in the middle between them; free ends leave and arrive along the longest distance
 * between the ends
 * @param start Start of the arrow
 * @param end End of the arrow
 * @param boxes Boxes of the shapes linked to the start and the end, in the same coordinates
 * @param distance Distance kept from the shapes (less between close shapes)
 * @param chosen Line chosen for the middle segment, taken when it gives a path
 * @returns Points of the path, from start to end
 */
function routeElbow(start: Vector2d, end: Vector2d, boxes: EndBoxes, distance: number, chosen?: ElbowLine): Vector2d[] {
  const [startBox, endBox] = boxes;
  // out of the side of linked shapes (from their center), else along the longest distance between the ends
  const startDirection = directionOf(
    startBox
      ? { x: start.x - centerOf(startBox).x, y: start.y - centerOf(startBox).y }
      : { x: end.x - start.x, y: end.y - start.y }
  );
  const endDirection = directionOf(
    endBox
      ? { x: end.x - centerOf(endBox).x, y: end.y - centerOf(endBox).y }
      : { x: start.x - end.x, y: start.y - end.y }
  );
  // space kept around shapes: less between close shapes (or a free end close to a shape)
  const space = separation(startBox ?? { ...start, width: 0, height: 0 }, endBox ?? { ...end, width: 0, height: 0 });
  const margin = space > 0 ? Math.min(distance, space / 2) : distance;
  const [startArea, endArea] = [startBox && grow(startBox, margin), endBox && grow(endBox, margin)];
  const obstacles = [startArea, endArea].filter((box): box is IRect => !!box);
  const from = exitPoint(start, startDirection, startArea);
  const to = exitPoint(end, endDirection, endArea);
  const lines = (axis: 'x' | 'y') => {
    const size = axis === 'x' ? 'width' : 'height';
    const middles = [(start[axis] + end[axis]) / 2, (from[axis] + to[axis]) / 2];

    // middle of the space between the shapes
    if (startArea && endArea) {
      const [first, second] = startArea[axis] <= endArea[axis] ? [startArea, endArea] : [endArea, startArea];

      if (first[axis] + first[size] < second[axis]) middles.push((first[axis] + first[size] + second[axis]) / 2);
    }
    const borders = obstacles.flatMap((box) => [box[axis], box[axis] + box[size]]);
    // around everything: paths going round the shapes
    const outside = [
      Math.min(from[axis], to[axis], ...borders) - margin,
      Math.max(from[axis], to[axis], ...borders) + margin,
    ];

    return gridLines(
      middles,
      [from[axis], to[axis], ...borders, ...outside],
      chosen?.axis === axis ? chosen.value : undefined
    );
  };
  const path = searchGrid(from, startDirection, to, (endDirection + 2) % 4, obstacles, lines('x'), lines('y'));

  return path ? simplify([start, ...path, end]) : simpleElbow(start, end, startDirection, endDirection);
}

/**
 * Middle segment of an elbow path, between two turns (not at an end): moved by the handle of the arrow
 * @param points Points of the path
 * @returns Middle one of the inner segments, null without (a straight line or one corner)
 */
export function getMiddleSegment(points: Vector2d[]): ElbowSegment | null {
  const count = points.length - 1;
  const index = Math.floor((count - 1) / 2);

  if (index < 1 || index > count - 2) return null;

  return { index, vertical: Math.abs(points[index].x - points[index + 1].x) < epsilon };
}

/**
 * Points of an elbow arrow between its ends (see `routeElbow`), its middle segment moved by its `elbowMid` attribute
 * @param start Start of the arrow
 * @param end End of the arrow
 * @param boxes Boxes of the shapes linked to the start and the end, in the same coordinates
 * @param offset Position of the middle segment from the middle between the ends (`elbowMid`), undefined: automatic
 * @param distance Distance kept from the shapes: room for the head of the arrow straight out of a shape
 * @returns Points of the path, from start to end
 */
export function getElbowPoints(
  start: Vector2d,
  end: Vector2d,
  boxes: EndBoxes = [undefined, undefined],
  offset?: number,
  distance = elbowMargin
): Vector2d[] {
  const points = routeElbow(start, end, boxes, distance);
  const middle = offset === undefined ? null : getMiddleSegment(points);

  if (!middle || offset === undefined) return points;

  const axis = middle.vertical ? 'x' : 'y';
  const value = (start[axis] + end[axis]) / 2 + offset;
  const moved = routeElbow(start, end, boxes, distance, { axis, value });

  // line in a shape: automatic path
  return isOnLine(moved, axis, value) ? moved : points;
}

/**
 * A turn of an elbow path is on a line
 * @param points Points of the path
 * @param axis `x` for a vertical line, `y` for a horizontal one
 * @param value Coordinate of the line
 * @returns True when a point between the ends is on the line
 */
export const isOnLine = (points: Vector2d[], axis: 'x' | 'y', value: number) =>
  points.slice(1, -1).some((point) => Math.abs(point[axis] - value) < 0.02);
