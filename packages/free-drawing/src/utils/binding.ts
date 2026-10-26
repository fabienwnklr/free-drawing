import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Path } from 'konva/lib/shapes/Path';
import { Shape } from 'konva/lib/Shape';
import type { IRect, Vector2d } from 'konva/lib/types';
import type { DrawingShape } from '@/@types/drawer';
import { fillShapes, pathShapes, shapeName } from '@/constants';
import type { Anchor, BoundEnd, OutlineCrossing, PathOutline } from '@/@types/shapes';
import { isFrame } from '@/utils/frame';

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

/** Distance from a shape on screen (px, divided by the zoom) under which an arrow end is linked to it */
export const bindingMargin = 12;

/** Points sampled on each curve of the outline of a path shape (a line gives its end) */
const curveSteps = 12;

/** Outlines of path shapes, sampled once for each data */
const pathOutlines = new WeakMap<Path, PathOutline>();

/**
 * Outline of a path shape (triangle, diamond, heart, cloud) in its own coordinates: points of its lines, curves
 * sampled
 * @param path path shape
 * @returns one ring of points per subpath (its last edge goes back to its first point)
 */
function getPathRings(path: Path): Vector2d[][] {
  const data = path.data();
  const cached = pathOutlines.get(path);

  if (cached?.data === data) return cached.rings;

  const rings: Vector2d[][] = [];
  let ring: Vector2d[] = [];

  for (const segment of path.dataArray) {
    if (segment.command === 'M') {
      if (ring.length > 2) rings.push(ring);
      ring = [{ x: segment.points[0], y: segment.points[1] }];
      continue;
    }

    const steps = segment.command === 'L' || segment.command === 'z' ? 1 : curveSteps;

    for (let i = 1; i <= steps; i++) {
      const point = Path.getPointAtLengthOfDataArray((segment.pathLength * i) / steps, [segment]);

      if (point) ring.push(point);
    }
  }
  if (ring.length > 2) rings.push(ring);
  pathOutlines.set(path, { data, rings });
  return rings;
}

/**
 * Geometry of a shape in its layer: rectangles, ellipses and path shapes as drawn (rotation...), other shapes by their
 * box
 * @param shape shape or group linked by an arrow
 * @param layer layer of the shape, coordinates are relative to it
 * @returns `transform` from shape to layer and `box` (own rect) of rectangles, ellipses and path shapes, else null
 * transform and box in layer; `ellipse` when the outline is an ellipse, `rings` of the outline of a path shape in layer
 * coordinates (else null), `stroke` width (0 for boxes)
 */
function getGeometry(shape: Node, layer: Container) {
  const isRect = shape.hasName(shapeName.rect);
  const isEllipse = shape.hasName(shapeName.ellipse);
  const isPath = shape instanceof Path && pathShapes.some((name) => shape.hasName(name));

  if ((isRect || isEllipse || isPath) && shape instanceof Shape) {
    const { x, y, width, height } = shape.getSelfRect();
    const transform = shape.getAbsoluteTransform(layer);

    return {
      transform,
      box: { x, y, width, height },
      ellipse: isEllipse,
      rings: isPath ? getPathRings(shape).map((ring) => ring.map((point) => transform.point(point))) : null,
      stroke: shape.hasStroke() ? shape.strokeWidth() : 0,
    };
  }

  // box of shape in layer (stroke included), no transform
  return { transform: null, box: shape.getClientRect({ relativeTo: layer }), ellipse: false, rings: null, stroke: 0 };
}

/**
 * Farthest point of an outline on a ray: the outer outline seen from the point the ray aims at (a heart crossed at
 * its dip, not behind it)
 * @param rings outline of a path shape, in layer coordinates
 * @param from start of the ray (center of the shape)
 * @param towards point giving the direction of the ray
 * @returns farthest crossing, null when the ray crosses no edge (or `towards` is `from`)
 */
function getRingsCrossing(rings: Vector2d[][], from: Vector2d, towards: Vector2d): Vector2d | null {
  const [dx, dy] = [towards.x - from.x, towards.y - from.y];
  // length of the ray to the farthest crossing, in lengths of the direction
  let farthest = 0;

  for (const ring of rings) {
    for (const [i, p] of ring.entries()) {
      const q = ring[(i + 1) % ring.length];
      const [ex, ey] = [q.x - p.x, q.y - p.y];
      // from + t * direction = p + u * edge
      const denominator = dx * ey - dy * ex;

      if (!denominator) continue;

      const t = ((p.x - from.x) * ey - (p.y - from.y) * ex) / denominator;
      const u = ((p.x - from.x) * dy - (p.y - from.y) * dx) / denominator;

      if (t > farthest && u >= 0 && u <= 1) farthest = t;
    }
  }
  return farthest ? { x: from.x + dx * farthest, y: from.y + dy * farthest } : null;
}

/**
 * Distance from a point to an outline, negative inside it (even-odd rule)
 * @param rings outline of a path shape, in layer coordinates
 * @param point point in layer coordinates
 * @returns distance in layer units
 */
function getRingsDistance(rings: Vector2d[][], point: Vector2d): number {
  let nearest = Infinity;
  let inside = false;

  for (const ring of rings) {
    for (const [i, p] of ring.entries()) {
      const q = ring[(i + 1) % ring.length];
      const [ex, ey] = [q.x - p.x, q.y - p.y];
      // projection of the point on the edge, within its ends
      const u = Math.max(0, Math.min(1, ((point.x - p.x) * ex + (point.y - p.y) * ey) / (ex * ex + ey * ey || 1)));

      nearest = Math.min(nearest, Math.hypot(point.x - p.x - u * ex, point.y - p.y - u * ey));
      // edge crossed by the horizontal line of the point, on its right
      if (p.y > point.y !== q.y > point.y && point.x < p.x + ((point.y - p.y) / (q.y - p.y)) * ex) inside = !inside;
    }
  }
  return inside ? -nearest : nearest;
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
 * Middle of each side of a shape in its layer (rotated with it), on the outline of path shapes: where the way from
 * their center to the middle of a side of their box crosses it (side of a triangle, dip of a heart)
 * @param shape shape or group
 * @param layer layer of the shape
 * @returns points by side, in layer coordinates
 */
export function getAnchorPoints(shape: Node, layer: Container): Record<Anchor, Vector2d> {
  const { transform, box, rings } = getGeometry(shape, layer);
  const c = center(box);
  const points: Record<Anchor, Vector2d> = {
    top: { x: c.x, y: box.y },
    right: { x: box.x + box.width, y: c.y },
    bottom: { x: c.x, y: box.y + box.height },
    left: { x: box.x, y: c.y },
  };

  for (const anchor of anchors) {
    if (transform) points[anchor] = transform.point(points[anchor]);
    if (transform && rings)
      points[anchor] = getRingsCrossing(rings, transform.point(c), points[anchor]) ?? points[anchor];
  }
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
 * Point of the outline of a shape on the way from its center to a point
 * @param shape shape or group
 * @param layer layer of the shape
 * @param towards point the outline point aims at, in layer coordinates
 * @returns outline point and center in layer coordinates, `stroke` width; null when `towards` is the center
 */
function getOutlineCrossing(shape: Node, layer: Container, towards: Vector2d): OutlineCrossing | null {
  const { transform, box, ellipse, rings, stroke } = getGeometry(shape, layer);
  const toLayer = (point: Vector2d) => (transform ? transform.point(point) : point);
  const c = center(box);
  // path shapes: their outline (box of an empty path, being drawn)
  const crossing = rings && getRingsCrossing(rings, toLayer(c), towards);

  if (crossing) return { point: crossing, center: toLayer(c), stroke };

  const local = transform ? transform.copy().invert().point(towards) : towards;
  const [dx, dy] = [local.x - c.x, local.y - c.y];
  const [rx, ry] = [Math.abs(box.width) / 2, Math.abs(box.height) / 2];

  if (!dx && !dy) return null;

  // distance ratio from center to outline
  const ratio =
    ellipse && rx && ry
      ? 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
      : Math.min(dx ? rx / Math.abs(dx) : Infinity, dy ? ry / Math.abs(dy) : Infinity);

  return { point: toLayer({ x: c.x + dx * ratio, y: c.y + dy * ratio }), center: toLayer(c), stroke };
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
  const crossing = getOutlineCrossing(shape, layer, towards);

  return crossing && moveTowards(crossing.point, crossing.center, towards, gap + crossing.stroke / 2);
}

/**
 * Distance from the outline of a shape to a point: rectangles to their nearest side as drawn (rotation, scale),
 * ellipses on the way from their center, path shapes to their outline, other shapes to their box
 * @param shape shape or group
 * @param layer layer of the shape
 * @param point point in layer coordinates (arrow end)
 * @returns distance in layer units, negative inside (-Infinity at the center of an ellipse)
 */
export function getOutlineDistance(shape: Node, layer: Container, point: Vector2d): number {
  const { transform, box, ellipse, rings, stroke } = getGeometry(shape, layer);

  if (rings?.length) return getRingsDistance(rings, point) - stroke / 2;
  if (!ellipse) {
    const local = transform ? transform.copy().invert().point(point) : point;
    // layer units of each axis of the shape
    const { scaleX, scaleY } = transform ? transform.decompose() : { scaleX: 1, scaleY: 1 };
    // negative size when drawn up or left
    const [left, right] = [box.x, box.x + box.width].sort((a, b) => a - b);
    const [top, bottom] = [box.y, box.y + box.height].sort((a, b) => a - b);
    // distance out of each pair of sides, negative inside
    const outX = Math.max(left - local.x, local.x - right) * (Math.abs(scaleX) || 1);
    const outY = Math.max(top - local.y, local.y - bottom) * (Math.abs(scaleY) || 1);
    const distance = outX > 0 || outY > 0 ? Math.hypot(Math.max(outX, 0), Math.max(outY, 0)) : Math.max(outX, outY);

    return distance - stroke / 2;
  }

  const crossing = getOutlineCrossing(shape, layer, point);

  if (!crossing) return -Infinity;

  const { point: outline, center: c } = crossing;

  return Math.hypot(point.x - c.x, point.y - c.y) - Math.hypot(outline.x - c.x, outline.y - c.y) - stroke / 2;
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
 * freehand drawings, groups, shapes of frames), not arrows nor lines. Rectangles, ellipses and path shapes as drawn
 * (not their box: an empty corner of the box of a triangle is out of it) near their outline, inside with a background
 * (as their hit region: an empty inside is a free place, far from the outline of a big shape); a frame only near its
 * border (an arrow drawn in a frame links to its shapes, or to nothing); other shapes in their box
 * @param shapes Drawing shapes (with shapes of frames, see `withFrameShapes`)
 * @param point arrow end, in coordinates of the layer of shapes
 * @param exclude Arrow being drawn
 * @param margin Distance from shapes (layer units) under which the end is linked: `bindingMargin` divided by the zoom
 * @returns smallest shape near the point, null when none
 */
export function findBindingTarget(
  shapes: DrawingShape[],
  point: Vector2d,
  exclude?: Node,
  margin: number = bindingMargin
): DrawingShape | null {
  const layer = shapes[0]?.getLayer();
  const around = shapes.filter((shape) => {
    if (shape === exclude || !shape.isVisible() || shape.hasName(shapeName.arrow)) return false;
    // text of a shape: its shape is linked
    if (shape.attrs.containerId) return false;
    if (shape.hasName(shapeName.straightLine)) return false;

    const { x, y, width, height } = shape.getClientRect({ relativeTo: layer ?? undefined });
    // distance from the point inside the box to its nearest side (negative out of it)
    const inside = Math.min(point.x - x, x + width - point.x, point.y - y, y + height - point.y);

    if (inside < -margin) return false;
    if (isFrame(shape)) return inside <= margin;
    if (!layer || !(shape instanceof Shape) || !fillShapes.some((name) => shape.hasName(name))) return true;

    const distance = getOutlineDistance(shape, layer, point);

    // inside without background: near the outline (twice the margin: small shapes from their middle)
    return distance <= margin && (distance >= -2 * margin || shape.hasFill());
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
