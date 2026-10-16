import type { Node } from 'konva/lib/Node';
import type { Context } from 'konva/lib/Context';
import { Shape, type ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { Line } from 'konva/lib/shapes/Line';
import { Path } from 'konva/lib/shapes/Path';
import type { IRect, Vector2d } from 'konva/lib/types';
import { fillShapes, shapeName } from '@/constants';
import type { DrawingShape } from '@/@types/drawer';

/** Minimum hit width of strokes (px), easier to click than thin strokes */
const hitStrokeWidth = 20;

/**
 * Hit region of rectangles and ellipses as drawn: inside only with a background, an empty inside does not hide
 * shapes under it from pointer
 */
function outlineHitFunc(context: Context, shape: Shape<ShapeConfig>) {
  const hitContext = shape.hasFill()
    ? context
    : Object.create(context, { fillStrokeShape: { value: (s: Shape<ShapeConfig>) => context.strokeShape(s) } });

  shape.sceneFunc().call(shape, hitContext, shape);
}

/**
 * Hit region of a drawing shape (shapes added, loaded...), shapes of a group: as drawn, strokes wider
 */
export function setupHit(node: Node) {
  if (node instanceof Group) node.getChildren().forEach(setupHit);
  if (!(node instanceof Shape)) return;

  if (fillShapes.some((name) => node.hasName(name))) node.hitFunc(outlineHitFunc);
  // lines saved while selected by previous versions
  if (node instanceof Line && node.hitStrokeWidth() === 'auto') {
    node.hitStrokeWidth(Math.max(hitStrokeWidth, node.strokeWidth()));
  }
}

/**
 * Shapes of a node: itself, or shapes of a group and its groups
 */
export function getShapes(node: Node): Shape<ShapeConfig>[] {
  if (node instanceof Shape) return [node];

  return node instanceof Group ? node.find<Shape<ShapeConfig>>((child: Node) => child instanceof Shape) : [];
}

/**
 * A visible shape of a node is drawn at a point (absolute position): fill, stroke, text box
 */
export function isDrawnAt(node: Node, point: Vector2d): boolean {
  return getShapes(node).some((shape) => shape.isVisible() && shape.intersects(point));
}

/**
 * A visible shape of a node is drawn at a point, also when it is locked (konva draws hits of listening nodes only)
 */
export function isDrawnAtLocked(node: Node, point: Vector2d): boolean {
  const locked = [...node.getAncestors(), node, ...(node instanceof Group ? node.find(() => true) : [])].filter(
    (n) => !n.listening()
  );

  locked.forEach((n) => n.listening(true));
  try {
    return isDrawnAt(node, point);
  } finally {
    locked.forEach((n) => n.listening(false));
  }
}

/**
 * Locked node of a locked shape: its top locked group, else itself (selected and unlocked as a whole)
 */
export function getLockedNode(shape: DrawingShape): DrawingShape {
  let locked = shape;

  for (let parent = shape.getParent(); parent instanceof Group; parent = parent.getParent()) {
    if (!parent.listening()) locked = parent;
  }

  return locked;
}

/**
 * Point is inside outline of a rectangle or an ellipse of a node (shape or group)
 */
export function isInsideNode(node: Node, point: Vector2d): boolean {
  return getShapes(node).some(
    (shape) => shape.isVisible() && fillShapes.some((name) => shape.hasName(name)) && isInsideOutline(shape, point)
  );
}

/**
 * Inner box is entirely in outer box
 */
export function rectContains(outer: IRect, inner: IRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Point in box (edges included)
 */
function boxHasPoint(box: IRect, { x, y }: Vector2d): boolean {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

/**
 * Segment crosses box or is in it (Liang-Barsky clipping)
 */
function segmentTouches(box: IRect, a: Vector2d, b: Vector2d): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let start = 0;
  let end = 1;
  // part of segment on the inner side of each edge of box
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0;

    const t = q / p;

    if (p < 0) {
      if (t > end) return false;
      start = Math.max(start, t);
    } else {
      if (t < start) return false;
      end = Math.min(end, t);
    }
    return true;
  };

  return (
    clip(-dx, a.x - box.x) &&
    clip(dx, box.x + box.width - a.x) &&
    clip(-dy, a.y - box.y) &&
    clip(dy, box.y + box.height - a.y)
  );
}

/**
 * Polygon (absolute points in order, closed or not) touched by box: one of its points is in box or one of its sides
 * crosses it. A box entirely inside a closed polygon does not touch it
 */
function polygonTouches(box: IRect, points: Vector2d[], closed: boolean): boolean {
  const sides = points.slice(1).map((point, i) => [points[i], point]);

  if (closed && points.length > 2) sides.push([points[points.length - 1], points[0]]);

  return points.some((point) => boxHasPoint(box, point)) || sides.some(([a, b]) => segmentTouches(box, a, b));
}

/**
 * Box (absolute coordinates, e.g. a frame) touched by another box: crossed by it or in it, not when entirely around it
 */
export function rectTouches(box: IRect, rect: IRect): boolean {
  const { x, y, width, height } = rect;

  return polygonTouches(
    box,
    [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
    true
  );
}

/**
 * Drawing shape touched by a box (absolute coordinates, e.g. selection rectangle): lines and strokes along their
 * points, other shapes along their box (rotated, scaled with them), shapes of groups too. A box entirely inside a shape
 * does not touch it (box drawn in a big shape)
 */
export function isTouchedBy(box: IRect, node: DrawingShape): boolean {
  return getShapes(node).some((shape) => {
    if (!shape.isVisible()) return false;

    const transform = shape.getAbsoluteTransform();

    if (shape instanceof Line) {
      const points = shape.points();
      const absolute = points.filter((_, i) => i % 2 === 0).map((x, i) => transform.point({ x, y: points[i * 2 + 1] }));

      return polygonTouches(box, absolute, shape.closed());
    }

    const { x, y, width, height } = shape.getSelfRect();

    return polygonTouches(
      box,
      [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ].map((point) => transform.point(point)),
      true
    );
  });
}

let pathContext: CanvasRenderingContext2D | null | undefined;

/**
 * Point (shape coordinates) inside the path of a path shape (triangle, diamond, heart, cloud)
 */
function isInsidePath(shape: Path, x: number, y: number) {
  pathContext ??= document.createElement('canvas').getContext('2d');

  return !!pathContext?.isPointInPath(new Path2D(shape.data()), x, y);
}

/**
 * Point (absolute position) is inside outline of a rectangle, an ellipse or a path shape, filled or not, whatever
 * its transform
 */
export function isInsideOutline(shape: Shape<ShapeConfig>, point: Vector2d): boolean {
  const { x, y } = shape.getAbsoluteTransform().copy().invert().point(point);

  if (shape instanceof Path) return isInsidePath(shape, x, y);

  const rect = shape.getSelfRect();
  // negative size when drawn up or left
  const [left, right] = [rect.x, rect.x + rect.width].sort((a, b) => a - b);
  const [top, bottom] = [rect.y, rect.y + rect.height].sort((a, b) => a - b);

  if (shape.hasName(shapeName.ellipse)) {
    const rx = (right - left) / 2;
    const ry = (bottom - top) / 2;

    return rx > 0 && ry > 0 && ((x - left - rx) / rx) ** 2 + ((y - top - ry) / ry) ** 2 <= 1;
  }

  return x >= left && x <= right && y >= top && y <= bottom;
}
