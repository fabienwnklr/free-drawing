import type { Node } from 'konva/lib/Node';
import type { Context } from 'konva/lib/Context';
import { Shape, type ShapeConfig } from 'konva/lib/Shape';
import { Line } from 'konva/lib/shapes/Line';
import type { IRect, Vector2d } from 'konva/lib/types';
import { fillShapes, shapeName } from '@/constants';

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
 * Hit region of a drawing shape (shapes added, loaded...): as drawn, strokes wider
 */
export function setupHit(node: Node) {
  if (!(node instanceof Shape)) return;

  if (fillShapes.some((name) => node.hasName(name))) node.hitFunc(outlineHitFunc);
  // lines saved while selected by previous versions
  if (node instanceof Line && node.hitStrokeWidth() === 'auto') {
    node.hitStrokeWidth(Math.max(hitStrokeWidth, node.strokeWidth()));
  }
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
 * Point (absolute position) is inside outline of a rectangle or an ellipse, filled or not, whatever its transform
 */
export function isInsideOutline(shape: Shape<ShapeConfig>, point: Vector2d): boolean {
  const { x, y } = shape.getAbsoluteTransform().copy().invert().point(point);
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
