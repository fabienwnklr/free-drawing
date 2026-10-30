import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Path } from 'konva/lib/shapes/Path';
import { Shape } from 'konva/lib/Shape';
import type { IRect, Vector2d } from 'konva/lib/types';
import type { DrawingShape } from '@/@types/drawer';
import { fillShapes, pathShapes, shapeName } from '@/constants';
import type { Anchor, ArrowEnds, BoundEnd, BoundEnds, OutlineCrossing, PathOutline } from '@/@types/shapes';
import { isFrame } from '@/utils/frame';
import { getArrowType, routeArrow } from '@/utils/arrow';

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
 * other end (its side, its shape center or its point); an end of an elbow arrow without side leaves the side of its
 * shape facing the other end: across the space between them (the axis they are the farthest apart on), between their
 * centers when they overlap
 * @param layer layer of the arrow and its shapes
 * @param from Start linked to a shape, or start point
 * @param to End linked to a shape, or end point
 * @param elbow Elbow arrow: ends on sides, boxes of the linked shapes given
 * @returns start and end points, the sides they are fixed to and the boxes of their shapes, null when an end on
 * outline aims at the center of its own shape
 */
export function getBoundEnds(
  layer: Container,
  from: BoundEnd | Vector2d,
  to: BoundEnd | Vector2d,
  elbow = false
): BoundEnds | null {
  const isBound = (value: BoundEnd | Vector2d): value is BoundEnd => 'shape' in value;
  const boxOf = (value: BoundEnd | Vector2d): IRect =>
    isBound(value) ? value.shape.getClientRect({ relativeTo: layer }) : { ...value, width: 0, height: 0 };
  // side facing the other end (its shape or its point)
  const facing = (value: BoundEnd | Vector2d, other: BoundEnd | Vector2d): BoundEnd | Vector2d => {
    if (!elbow || !isBound(value) || value.anchor) return value;

    const [a, b] = [boxOf(value), boxOf(other)];
    // space between the boxes on each axis, negative when they overlap on it
    const spaceX = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
    const spaceY = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
    const [dx, dy] = [center(b).x - center(a).x, center(b).y - center(a).y];
    const horizontal = spaceX > 0 || spaceY > 0 ? spaceX >= spaceY : Math.abs(dx) >= Math.abs(dy);
    const anchor: Anchor = horizontal ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top';

    return { ...value, anchor };
  };
  const start = facing(from, to);
  const end = facing(to, from);
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
  const anchorOf = (value: BoundEnd | Vector2d) => (isBound(value) ? value.anchor : undefined);
  // elbow arrows go around their shapes
  const shapeBox = (value: BoundEnd | Vector2d) => (elbow && isBound(value) ? boxOf(value) : undefined);

  return startPoint && endPoint
    ? {
        start: startPoint,
        end: endPoint,
        anchors: [anchorOf(start), anchorOf(end)],
        boxes: [shapeBox(start), shapeBox(end)],
      }
    : null;
}

/**
 * Ends of an arrow in its own coordinates, boxes of its shapes as bounding boxes there
 * @param arrow Arrow
 * @param layer Layer of the arrow, coordinates of the ends
 * @param ends Ends in layer coordinates (see `getBoundEnds`)
 * @returns Ends to route the arrow with (see `routeArrow`)
 */
export function toArrowEnds(arrow: Arrow, layer: Container, ends: BoundEnds): ArrowEnds {
  const toLocal = arrow.getAbsoluteTransform(layer).copy().invert();
  const localBox = (box: IRect | undefined): IRect | undefined => {
    if (!box) return undefined;

    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x, y: box.y + box.height },
      { x: box.x + box.width, y: box.y + box.height },
    ].map((corner) => toLocal.point(corner));
    const [xs, ys] = [corners.map(({ x }) => x), corners.map(({ y }) => y)];

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  };

  return {
    start: toLocal.point(ends.start),
    end: toLocal.point(ends.end),
    boxes: [localBox(ends.boxes[0]), localBox(ends.boxes[1])],
  };
}

/**
 * Ends of an arrow: on its linked shapes, else its own first and last points
 * @param arrow Arrow
 * @param layer Layer of the arrow and its shapes
 * @param find Shape of an id (default: searched in the layer)
 * @returns Ends in coordinates of the arrow (see `toArrowEnds`), null when an end on outline aims at the center of
 * its own shape
 */
export function getArrowEnds(
  arrow: Arrow,
  layer: Container,
  find: (id: string) => Node | undefined = (id) => layer.findOne((node: Node) => node.id() === id)
): ArrowEnds | null {
  const [start, end] = bindingAttrs.map((attr, i): BoundEnd | undefined => {
    const id = arrow.getAttr(attr);
    const shape = id ? find(id) : undefined;
    const anchor = arrow.getAttr(anchorAttrs[i]);

    return shape && { shape, anchor: anchors.includes(anchor) ? anchor : undefined };
  });
  const transform = arrow.getAbsoluteTransform(layer);
  const points = arrow.points();
  const n = points.length;
  const ends = getBoundEnds(
    layer,
    start ?? transform.point({ x: points[0], y: points[1] }),
    end ?? transform.point({ x: points[n - 2], y: points[n - 1] }),
    getArrowType(arrow) === 'elbow'
  );

  return ends && toArrowEnds(arrow, layer, ends);
}

/**
 * Path of an arrow drawn again between its ends (see `getArrowEnds`): after a change of its path, its bend or its
 * middle segment
 * @param arrow Arrow
 * @param layer Layer of the arrow and its shapes
 * @param find Shape of an id (default: searched in the layer)
 */
export function rerouteArrow(arrow: Arrow, layer: Container, find?: (id: string) => Node | undefined) {
  const ends = getArrowEnds(arrow, layer, find);

  if (ends) routeArrow(arrow, ends.start, ends.end, ends.boxes);
}

/**
 * Ids of nodes moved together (drag, transform) and of their shapes (groups, frames): what follows them while they
 * move (`updateBindings`, `updateBoundTexts`)
 * @param moved Nodes moved
 * @returns Their ids and the ids of their descendants
 */
export function getMovedIds(moved: Node[]): Set<string> {
  const nodes = moved.flatMap((node) => [node, ...('find' in node ? (node as Container).find(() => true) : [])]);

  return new Set(nodes.map((node) => node.id()).filter(Boolean));
}

/**
 * Arrows follow their linked shapes, links to removed shapes are removed
 * @param layer Draw layer
 * @param moved Ids of the nodes moved (drag, transform: `getMovedIds`): only the arrows moved or linked to them, whose
 * ids are added to it (their labels follow them), every arrow by default
 * @returns true if an arrow changed
 */
export function updateBindings(layer: Container, moved?: Set<string>): boolean {
  const nodes = layer.find((node: Node) => !!node.id());
  const byId = new Map(nodes.map((node) => [node.id(), node]));
  let changed = false;

  nodes.forEach((arrow) => {
    if (!(arrow instanceof Arrow) || ![...bindingAttrs, ...anchorAttrs].some((attr) => arrow.getAttr(attr))) return;
    if (moved && !moved.has(arrow.id()) && !bindingAttrs.some((attr) => moved.has(arrow.getAttr(attr)))) return;
    moved?.add(arrow.id());

    // links of removed shapes, sides without link
    bindingAttrs.forEach((attr, i) => {
      if ((arrow.getAttr(attr) || arrow.getAttr(anchorAttrs[i])) && !byId.get(arrow.getAttr(attr))) {
        arrow.setAttrs({ [attr]: undefined, [anchorAttrs[i]]: undefined });
        changed = true;
      }
    });
    if (!bindingAttrs.some((attr) => arrow.getAttr(attr))) return;

    const points = arrow.points();

    // path from the ends (curve, elbow around the shapes)
    rerouteArrow(arrow, layer, (id) => byId.get(id));
    if (arrow.points().join() !== points.join()) changed = true;
  });

  return changed;
}

/**
 * Arrows moved (dragged, transformed) without their linked shapes are unlinked from them
 * @param moved Nodes moved together
 */
export function unbindMoved(moved: Node[]) {
  // linked shape moved too: one of them or a shape of one of them
  const movedIds = getMovedIds(moved);

  moved.forEach((node) => {
    const arrows = node instanceof Arrow ? [node] : 'find' in node ? (node as Container).find<Arrow>('Arrow') : [];

    arrows.forEach((arrow) => {
      bindingAttrs.forEach((attr, i) => {
        const id = arrow.getAttr(attr);

        if (id && !movedIds.has(id)) arrow.setAttrs({ [attr]: undefined, [anchorAttrs[i]]: undefined });
      });
    });
  });
}
