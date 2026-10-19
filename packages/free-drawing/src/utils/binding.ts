import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Shape } from 'konva/lib/Shape';
import type { IRect, Vector2d } from 'konva/lib/types';
import type { DrawingShape } from '@/@types/drawer';
import { shapeName } from '@/constants';
import type { Anchor, BoundEnd } from '@/@types/shapes';

/**
 * Arrows linked to shapes: their start and end stay on outline of shapes (`startBinding` / `endBinding` attributes:
 * ids of shapes) when shapes move or change, fixed to a side (`startAnchor` / `endAnchor`) or aiming at their center
 */
export const bindingAttrs = ['startBinding', 'endBinding'] as const;

/** Sides arrow ends are fixed to, same order as `bindingAttrs` */
export const anchorAttrs = ['startAnchor', 'endAnchor'] as const;

/** Sides of a shape an arrow end can be fixed to, clockwise from top */
export const anchors: Anchor[] = ['top', 'right', 'bottom', 'left'];

/** Space between arrow end and shape outline */
const gap = 6;

/** Distance from a shape (layer units) under which an arrow end is linked to it */
export const bindingMargin = 12;

/**
 * Geometry of a shape in its layer: rectangles and ellipses as drawn (rotation...), other shapes by their box
 * @param shape shape or group linked by an arrow
 * @param layer layer of the shape, coordinates are relative to it
 * @returns `transform` from shape to layer and `box` (own rect) of rectangles and ellipses, else null transform and
 * box in layer; `ellipse` when the outline is an ellipse, `stroke` width (0 for boxes)
 */
function getGeometry(shape: Node, layer: Container) {
  const isRect = shape.hasName(shapeName.rect);
  const isEllipse = shape.hasName(shapeName.ellipse);

  if ((isRect || isEllipse) && shape instanceof Shape) {
    const { x, y, width, height } = shape.getSelfRect();

    return {
      transform: shape.getAbsoluteTransform(layer),
      box: { x, y, width, height },
      ellipse: isEllipse,
      stroke: shape.hasStroke() ? shape.strokeWidth() : 0,
    };
  }

  // box of shape in layer (stroke included), no transform
  return { transform: null, box: shape.getClientRect({ relativeTo: layer }), ellipse: false, stroke: 0 };
}

/**
 * Center of a rectangle
 * @returns center, in coordinates of the rectangle
 */
const center = ({ x, y, width, height }: IRect): Vector2d => ({ x: x + width / 2, y: y + height / 2 });

/**
 * Point moved by a distance in a direction
 * @param point point to move
 * @param from start of the direction
 * @param to end of the direction (same point as `from`: no move)
 * @param distance length of the move, in coordinates of the points
 * @returns moved point
 */
const moveTowards = (point: Vector2d, from: Vector2d, to: Vector2d, distance: number): Vector2d => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;

  return { x: point.x + ((to.x - from.x) / length) * distance, y: point.y + ((to.y - from.y) / length) * distance };
};

/**
 * Center of a shape in its layer
 * @param shape shape or group
 * @param layer layer of the shape
 * @returns center in layer coordinates (rectangles and ellipses: center of their own rect)
 */
export function getShapeCenter(shape: Node, layer: Container): Vector2d {
  const { transform, box } = getGeometry(shape, layer);

  return transform ? transform.point(center(box)) : center(box);
}

/**
 * Middle of each side of a shape in its layer (rotated with it)
 * @param shape shape or group
 * @param layer layer of the shape
 * @returns points by side, in layer coordinates
 */
export function getAnchorPoints(shape: Node, layer: Container): Record<Anchor, Vector2d> {
  const { transform, box } = getGeometry(shape, layer);
  const c = center(box);
  const points: Record<Anchor, Vector2d> = {
    top: { x: c.x, y: box.y },
    right: { x: box.x + box.width, y: c.y },
    bottom: { x: c.x, y: box.y + box.height },
    left: { x: box.x, y: c.y },
  };

  anchors.forEach((anchor) => {
    if (transform) points[anchor] = transform.point(points[anchor]);
  });
  return points;
}

/**
 * Side of a shape whose middle is near a point, undefined when none
 * @param shape shape or group
 * @param layer layer of the shape
 * @param point point in layer coordinates (pointer, arrow end)
 * @param tolerance Distance (layer units)
 * @returns side whose middle is the nearest, if within tolerance
 */
export function getAnchorAt(shape: Node, layer: Container, point: Vector2d, tolerance: number): Anchor | undefined {
  const points = getAnchorPoints(shape, layer);
  const distance = (anchor: Anchor) => Math.hypot(points[anchor].x - point.x, points[anchor].y - point.y);
  const [nearest] = [...anchors].sort((a, b) => distance(a) - distance(b));

  return distance(nearest) <= tolerance ? nearest : undefined;
}

/**
 * Point of shape outline on the way from its center to a point (layer coordinates), `gap` outside of it.
 * Null when the point is the center
 * @param shape shape or group
 * @param layer layer of the shape
 * @param towards point the outline point aims at, in layer coordinates
 * @returns point in layer coordinates, null when `towards` is the center
 */
export function getOutlinePoint(shape: Node, layer: Container, towards: Vector2d): Vector2d | null {
  const { transform, box, ellipse, stroke } = getGeometry(shape, layer);
  const toLocal = (point: Vector2d) => (transform ? transform.copy().invert().point(point) : point);
  const toLayer = (point: Vector2d) => (transform ? transform.point(point) : point);
  const c = center(box);
  const local = toLocal(towards);
  const [dx, dy] = [local.x - c.x, local.y - c.y];
  const [rx, ry] = [Math.abs(box.width) / 2, Math.abs(box.height) / 2];

  if (!dx && !dy) return null;

  // distance ratio from center to outline
  const ratio =
    ellipse && rx && ry
      ? 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
      : Math.min(dx ? rx / Math.abs(dx) : Infinity, dy ? ry / Math.abs(dy) : Infinity);

  return moveTowards(toLayer({ x: c.x + dx * ratio, y: c.y + dy * ratio }), toLayer(c), towards, gap + stroke / 2);
}

/**
 * Point of an arrow end fixed to a side of a shape, `gap` outside of it
 * @param shape shape or group the end is linked to
 * @param layer layer of the shape
 * @param anchor side the end is fixed to
 * @returns point in layer coordinates, away from the shape center
 */
function getAnchoredPoint(shape: Node, layer: Container, anchor: Anchor): Vector2d {
  const point = getAnchorPoints(shape, layer)[anchor];

  return moveTowards(point, getShapeCenter(shape, layer), point, gap + getGeometry(shape, layer).stroke / 2);
}

/**
 * Shape an arrow end can be linked to at a point: smallest visible shape around it (rectangles, ellipses, texts,
 * freehand drawings, groups), not arrows nor lines
 * @param shapes Drawing shapes
 * @param point arrow end, in coordinates of the layer of shapes
 * @param exclude Arrow being drawn
 * @returns smallest shape whose box (with `bindingMargin`) contains the point, null when none
 */
export function findBindingTarget(shapes: DrawingShape[], point: Vector2d, exclude?: Node): DrawingShape | null {
  const layer = shapes[0]?.getLayer();
  const around = shapes.filter((shape) => {
    if (shape === exclude || !shape.isVisible() || shape.hasName(shapeName.arrow)) return false;
    if (shape.hasName(shapeName.straightLine)) return false;

    const { x, y, width, height } = shape.getClientRect({ relativeTo: layer ?? undefined });

    return (
      point.x >= x - bindingMargin &&
      point.x <= x + width + bindingMargin &&
      point.y >= y - bindingMargin &&
      point.y <= y + height + bindingMargin
    );
  });
  const area = (shape: DrawingShape) => {
    const { width, height } = shape.getClientRect();

    return width * height;
  };

  return around.sort((a, b) => area(a) - area(b))[0] ?? null;
}

/**
 * Ends of an arrow from its linked shapes (layer coordinates): at their side, or on their outline aiming at the
 * other end (its side, its shape center or its point)
 * @param layer layer of the arrow and its shapes
 * @param start Start linked to a shape, or start point
 * @param end End linked to a shape, or end point
 * @returns start and end points, null when an end on outline aims at the center of its own shape
 */
export function getBoundEnds(layer: Container, start: BoundEnd | Vector2d, end: BoundEnd | Vector2d) {
  const isBound = (value: BoundEnd | Vector2d): value is BoundEnd => 'shape' in value;
  const aimOf = (other: BoundEnd | Vector2d) => {
    if (!isBound(other)) return other;

    return other.anchor ? getAnchorPoints(other.shape, layer)[other.anchor] : getShapeCenter(other.shape, layer);
  };
  const pointOf = (value: BoundEnd | Vector2d, other: BoundEnd | Vector2d) => {
    if (!isBound(value)) return value;

    return value.anchor
      ? getAnchoredPoint(value.shape, layer, value.anchor)
      : getOutlinePoint(value.shape, layer, aimOf(other));
  };
  const startPoint = pointOf(start, end);
  const endPoint = pointOf(end, start);

  return startPoint && endPoint
    ? {
        /** Start of arrow */
        start: startPoint,
        /** End of arrow */
        end: endPoint,
      }
    : null;
}

/**
 * Number rounded to 2 decimals (points of arrows)
 * @param n coordinate to round
 * @returns rounded coordinate
 */
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Arrows follow their linked shapes, links to removed shapes are removed
 * @param layer Draw layer
 * @returns true if an arrow changed
 */
export function updateBindings(layer: Container): boolean {
  const nodes = layer.find((node: Node) => !!node.id());
  const byId = new Map(nodes.map((node) => [node.id(), node]));
  let changed = false;

  nodes.forEach((arrow) => {
    if (!(arrow instanceof Arrow) || ![...bindingAttrs, ...anchorAttrs].some((attr) => arrow.getAttr(attr))) return;

    const [start, end] = bindingAttrs.map((attr, i): BoundEnd | undefined => {
      const shape = byId.get(arrow.getAttr(attr));
      const anchor = arrow.getAttr(anchorAttrs[i]);

      // link removed with its shape, side without link
      if (!shape && (arrow.getAttr(attr) || anchor)) {
        arrow.setAttrs({ [attr]: undefined, [anchorAttrs[i]]: undefined });
        changed = true;
      }
      return shape && { shape, anchor: anchors.includes(anchor) ? anchor : undefined };
    });

    if (!start && !end) return;

    const transform = arrow.getAbsoluteTransform(layer);
    const toLocal = transform.copy().invert();
    const points = arrow.points();
    const n = points.length;
    const ends = getBoundEnds(
      layer,
      start ?? transform.point({ x: points[0], y: points[1] }),
      end ?? transform.point({ x: points[n - 2], y: points[n - 1] })
    );

    if (!ends) return;

    const a = toLocal.point(ends.start);
    const b = toLocal.point(ends.end);
    const updated = [round(a.x), round(a.y), ...points.slice(2, n - 2), round(b.x), round(b.y)];

    if (updated.some((value, i) => value !== points[i])) {
      arrow.points(updated);
      changed = true;
    }
  });

  return changed;
}

/**
 * Arrows moved (dragged, transformed) without their linked shapes are unlinked from them
 * @param moved Nodes moved together
 */
export function unbindMoved(moved: Node[]) {
  const isMoved = (node: Node) => moved.some((m) => m === node || m.isAncestorOf(node));

  moved.forEach((node) => {
    const arrows = node instanceof Arrow ? [node] : 'find' in node ? (node as Container).find<Arrow>('Arrow') : [];

    arrows.forEach((arrow) => {
      bindingAttrs.forEach((attr, i) => {
        const id = arrow.getAttr(attr);
        const target = id && arrow.getLayer()?.findOne((n: Node) => n.id() === id);

        if (id && (!target || !isMoved(target))) arrow.setAttrs({ [attr]: undefined, [anchorAttrs[i]]: undefined });
      });
    });
  });
}
