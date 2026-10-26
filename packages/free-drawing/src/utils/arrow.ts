import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import type { Context } from 'konva/lib/Context';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Line } from 'konva/lib/shapes/Line';
import type { Vector2d } from 'konva/lib/types';
import type { Arrowhead, Arrowheads, ArrowType } from '@/@types/drawer';
import type { EndBoxes } from '@/@types/shapes';
import { elbowMargin, getElbowPoints, getMiddleSegment } from '@/utils/elbow';

/** Heads of arrow ends, `startHead` and `endHead` attributes of arrows */
export const arrowheadNames: Arrowhead[] = ['none', 'arrow', 'triangle', 'dot', 'bar'];

/** Paths of arrows, `arrowType` attribute of arrows (none for straight ones) */
export const arrowTypeNames: ArrowType[] = ['straight', 'curved', 'elbow'];

/**
 * Bend of curved arrows without `bend` attribute, and least bend of a drawn one: distance of their middle from the
 * straight line, in lengths of the arrow (positive on its left)
 */
export const curveBend = 0.2;

/** Largest bend of a drawn curved arrow (its handle bends it more) */
const maxDrawnBend = 0.75;

/** Largest bend given by the handle of a curved arrow */
export const maxBend = 1.5;

/** Heads drawn filled with the color of the arrow (its `fill`), others are lines */
const filledHeads: Arrowhead[] = ['triangle', 'dot'];

/**
 * Number rounded to 2 decimals (saved points)
 * @param n Coordinate
 * @returns Rounded coordinate
 */
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Heads of the ends of an arrow: its `startHead` and `endHead` attributes, else the konva pointers of arrows of
 * previous versions (triangle at the end)
 * @param arrow Arrow of the drawing
 * @returns Head of each end
 */
export function getArrowheads(arrow: Arrow): Arrowheads {
  const head = (value: unknown, pointer: boolean): Arrowhead =>
    arrowheadNames.includes(value as Arrowhead) ? (value as Arrowhead) : pointer ? 'triangle' : 'none';

  return {
    start: head(arrow.getAttr('startHead'), arrow.pointerAtBeginning()),
    end: head(arrow.getAttr('endHead'), arrow.pointerAtEnding()),
  };
}

/**
 * Attributes of the heads of an arrow: konva pointers kept for its box (space of heads)
 * @param heads Head of each end
 * @returns Attributes to set on the arrow
 */
export const arrowheadAttrs = ({ start, end }: Arrowheads) => ({
  startHead: start,
  endHead: end,
  pointerAtBeginning: start !== 'none',
  pointerAtEnding: end !== 'none',
});

/**
 * Path of an arrow
 * @param arrow Arrow of the drawing
 * @returns Its `arrowType` attribute, straight without it
 */
export function getArrowType(arrow: Arrow): ArrowType {
  const type = arrow.getAttr('arrowType');

  return arrowTypeNames.includes(type) ? type : 'straight';
}

/**
 * Head of an end of an arrow as konva draws lines: path at the end of the arrow, turned along it
 * @param context Context of the canvas
 * @param arrow Arrow drawn
 * @param atStart Head of the start, else of the end
 * @param head Kind of head
 */
function drawHead(context: Context, arrow: Arrow, atStart: boolean, head: Arrowhead) {
  const points = arrow.points();
  const index = atStart ? 0 : points.length - 2;
  const [length, width] = [arrow.pointerLength(), arrow.pointerWidth()];

  context.save();
  context.beginPath();
  context.translate(points[index], points[index + 1]);
  context.rotate(arrow._getPointerAngle(atStart));
  if (head === 'triangle') {
    context.moveTo(0, 0);
    context.lineTo(-length, width / 2);
    context.lineTo(-length, -width / 2);
    context.closePath();
  } else if (head === 'arrow') {
    context.moveTo(-length, width / 2);
    context.lineTo(0, 0);
    context.lineTo(-length, -width / 2);
  } else if (head === 'dot') {
    context.arc(-width / 3, 0, width / 3, 0, Math.PI * 2, false);
  } else {
    context.moveTo(0, width / 2);
    context.lineTo(0, -width / 2);
  }
  context.restore();

  if (filledHeads.includes(head)) {
    arrow.__fillStroke(context);
    return;
  }
  // lines without dash, as konva draws its heads
  const dashed = arrow.dashEnabled();

  if (dashed) {
    arrow.attrs.dashEnabled = false;
    context.setLineDash([]);
  }
  context.strokeShape(arrow);
  if (dashed) arrow.attrs.dashEnabled = true;
}

/**
 * Draw an arrow: its line (straight, curve, elbow), then the head of each end
 * @param context Context of the canvas
 * @param arrow Arrow drawn
 */
function drawArrow(context: Context, arrow: Arrow) {
  Line.prototype._sceneFunc.call(arrow, context);
  if (arrow.points().length < 4) return;

  const { start, end } = getArrowheads(arrow);

  if (start !== 'none') drawHead(context, arrow, true, start);
  if (end !== 'none') drawHead(context, arrow, false, end);
}

/**
 * Arrows of a drawing shape drawn with their heads (none, open, triangle, dot, bar): called when shapes are added or
 * loaded (the drawing function is not saved)
 * @param node Drawing shape or group
 */
export function setupArrows(node: Node) {
  const arrows = node instanceof Arrow ? [node] : 'find' in node ? (node as Container).find<Arrow>('Arrow') : [];

  for (const arrow of arrows) arrow.sceneFunc(drawArrow);
}

/**
 * Bend of a curved arrow
 * @param arrow Arrow of the drawing
 * @returns Its `bend` attribute, `curveBend` without it
 */
export function getBend(arrow: Arrow): number {
  const bend = arrow.getAttr('bend');

  return typeof bend === 'number' && Number.isFinite(bend) ? bend : curveBend;
}

/**
 * Position of the middle segment of an elbow arrow chosen with its handle
 * @param arrow Arrow of the drawing
 * @returns Its `elbowMid` attribute (distance from the middle between its ends), undefined: automatic
 */
export function getElbowMid(arrow: Arrow): number | undefined {
  const mid = arrow.getAttr('elbowMid');

  return typeof mid === 'number' && Number.isFinite(mid) ? mid : undefined;
}

/**
 * Distance an elbow arrow keeps from its linked shapes: room for its heads on the straight part out of them
 * @param arrow Elbow arrow
 * @returns `elbowMargin` at least, more for big heads
 */
export const elbowDistance = (arrow: Arrow) => Math.max(elbowMargin, arrow.pointerLength() + 12);

/**
 * Middle of a curve between two points, bent on the left of the way from start to end
 * @param start Start of the arrow
 * @param end End of the arrow
 * @param bend Distance from the straight line in lengths of the arrow, negative on its right
 * @returns Point the curve goes through
 */
export const curveMiddle = (start: Vector2d, end: Vector2d, bend: number): Vector2d => ({
  x: (start.x + end.x) / 2 + (end.y - start.y) * bend,
  y: (start.y + end.y) / 2 - (end.x - start.x) * bend,
});

/**
 * Bend of a curved arrow being drawn: on the side the pointer went, as far as it went (`curveBend` at least,
 * `maxDrawnBend` at most), on the left when it went straight
 * @param start Start of the arrow
 * @param end End of the arrow
 * @param path Pointer positions since the drawing started
 * @returns Bend of the arrow (see `getBend`)
 */
export function getDrawnBend(start: Vector2d, end: Vector2d, path: Vector2d[]): number {
  const [dx, dy] = [end.x - start.x, end.y - start.y];
  const length = Math.hypot(dx, dy);

  if (!length) return curveBend;

  // farthest position from the straight line, positive on its left
  const farthest = path
    .map(({ x, y }) => ((x - start.x) * dy - (y - start.y) * dx) / length)
    .reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);

  // nearly straight
  if (Math.abs(farthest) < length * 0.05) return curveBend;

  const bend = Math.min(Math.max(Math.abs(farthest) / length, curveBend), maxDrawnBend);

  return Math.round(Math.sign(farthest) * bend * 1000) / 1000;
}

/**
 * Points of an arrow as vectors
 * @param points Flat list of coordinates (konva `points`)
 * @returns Points
 */
export const toVectors = (points: number[]): Vector2d[] =>
  Array.from({ length: Math.floor(points.length / 2) }, (_, i) => ({ x: points[i * 2], y: points[i * 2 + 1] }));

/**
 * Points of an arrow from its ends, by its path: straight line, curve through a point beside its middle (`bend`),
 * elbow of horizontal and vertical lines leaving the sides of the linked shapes and going around them (see
 * utils/elbow), its middle segment moved by `elbowMid`
 * @param arrow Arrow (its `arrowType`, `bend`, `elbowMid`), points and tension set
 * @param start Start of the arrow, in coordinates of the arrow
 * @param end End of the arrow, in coordinates of the arrow
 * @param boxes Boxes of the shapes linked to the start and the end, in coordinates of the arrow (elbow arrows)
 */
export function routeArrow(arrow: Arrow, start: Vector2d, end: Vector2d, boxes: EndBoxes = [undefined, undefined]) {
  const type = getArrowType(arrow);
  const points =
    type === 'curved'
      ? [start, curveMiddle(start, end, getBend(arrow)), end]
      : type === 'elbow'
      ? elbowPoints(arrow, start, end, boxes)
      : [start, end];

  arrow.setAttrs({
    points: points.flatMap(({ x, y }) => [round(x), round(y)]),
    tension: type === 'curved' ? 0.5 : 0,
  });
}

/**
 * Points of an elbow arrow, its middle segment where its handle put it (`elbowMid`); a place chosen for a segment of
 * the other direction (its shapes moved round each other) is forgotten: automatic path
 * @param arrow Elbow arrow, its current points tell the direction of its middle segment
 * @param start Start of the arrow, in coordinates of the arrow
 * @param end End of the arrow, in coordinates of the arrow
 * @param boxes Boxes of the shapes linked to the start and the end, in coordinates of the arrow
 * @returns Points of the path
 */
function elbowPoints(arrow: Arrow, start: Vector2d, end: Vector2d, boxes: EndBoxes): Vector2d[] {
  const automatic = getElbowPoints(start, end, boxes, undefined, elbowDistance(arrow));
  const offset = getElbowMid(arrow);

  if (offset === undefined) return automatic;

  const [before, after] = [getMiddleSegment(toVectors(arrow.points())), getMiddleSegment(automatic)];

  if (before && after && before.vertical !== after.vertical) {
    arrow.setAttr('elbowMid', undefined);
    return automatic;
  }
  return getElbowPoints(start, end, boxes, offset, elbowDistance(arrow));
}

/**
 * Place of the handle of a selected arrow: middle point of a curve, middle of the middle segment of an elbow arrow
 * @param arrow Arrow of the drawing
 * @returns Point in coordinates of the arrow, null without handle (straight arrow, elbow of one corner)
 */
export function getHandlePoint(arrow: Arrow): Vector2d | null {
  const points = toVectors(arrow.points());
  const type = getArrowType(arrow);

  if (type === 'curved') return points.length === 3 ? points[1] : null;
  if (type !== 'elbow') return null;

  const middle = getMiddleSegment(points);

  return (
    middle && {
      x: (points[middle.index].x + points[middle.index + 1].x) / 2,
      y: (points[middle.index].y + points[middle.index + 1].y) / 2,
    }
  );
}

/**
 * Head of an end of an arrow in an svg export, as drawn (see `drawHead`)
 * @param arrow Exported arrow
 * @param atStart Head of the start, else of the end
 * @param fill Color of filled heads
 * @param stroke Attributes of the stroke of the arrow (without dash)
 * @returns Svg element of the head, empty without head
 */
export function arrowheadSvg(arrow: Arrow, atStart: boolean, fill: string, stroke: string): string {
  const head = getArrowheads(arrow)[atStart ? 'start' : 'end'];
  const points = arrow.points();

  if (head === 'none' || points.length < 4) return '';

  const index = atStart ? 0 : points.length - 2;
  const [length, width] = [round(arrow.pointerLength()), round(arrow.pointerWidth())];
  const angle = round((arrow._getPointerAngle(atStart) * 180) / Math.PI);
  const transform = `translate(${round(points[index])} ${round(points[index + 1])}) rotate(${angle})`;
  const paint = filledHeads.includes(head) ? `fill="${fill}"` : 'fill="none"';
  const shape =
    head === 'triangle'
      ? `<path d="M0 0L${-length} ${width / 2}L${-length} ${-width / 2}Z"`
      : head === 'arrow'
      ? `<path d="M${-length} ${width / 2}L0 0L${-length} ${-width / 2}"`
      : head === 'dot'
      ? `<circle cx="${round(-width / 3)}" cy="0" r="${round(width / 3)}"`
      : `<path d="M0 ${width / 2}L0 ${-width / 2}"`;

  return `${shape} transform="${transform}" ${paint}${stroke}/>`;
}
