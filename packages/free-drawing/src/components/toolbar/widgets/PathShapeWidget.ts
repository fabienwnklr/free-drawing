import { Path } from 'konva/lib/shapes/Path';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '@/components/toolbar/widgets/ShapeWidget';

/**
 * Svg path of a box of width and height 1 (absolute commands of points: M, L, C, Z) scaled to a box
 * @param {string} path
 * @param {number} width
 * @param {number} height
 */
export function scalePath(path: string, width: number, height: number): string {
  let index = 0;

  // numbers are x and y of points, in turn
  return path.replace(/-?\d*\.?\d+/g, (n) =>
    String(Math.round(Number(n) * (index++ % 2 ? height : width) * 100) / 100)
  );
}

/**
 * Tool drawing a closed shape in the dragged box (triangle, diamond, heart, cloud): background color, stroke style,
 * Shift draws it in a square
 */
export abstract class PathShapeWidget extends ShapeWidget<Path> {
  protected hasFill = true;
  /** Name of shapes (see `shapeName`) */
  protected abstract shapeName: string;
  /** Path in a box of width and height 1, see `scalePath` */
  protected abstract path: string;

  protected createShape(start: Vector2d) {
    return new Path({
      ...this.shapeStyle,
      x: start.x,
      y: start.y,
      data: '',
      // no spike on sharp corners (tip of heart)
      lineJoin: 'round',
      name: this.shapeName,
    });
  }

  protected updateShape(shape: Path, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y, width, height } = dragBox(start, end, constrain);

    shape.setAttrs({ x, y, data: scalePath(this.path, width, height) });
  }
}
