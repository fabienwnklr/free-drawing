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
