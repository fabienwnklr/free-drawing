import { Path } from 'konva/lib/shapes/Path';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '@/components/toolbar/widgets/ShapeWidget';
import { pathShapes, shapeName as shapeNames } from '@/constants';

/**
 * Svg path of a box of width and height 1 (absolute commands of points: M, L, C, Z) scaled to a box
 * @param path Svg path of the box of size 1, numbers are x and y of points in turn
 * @param width Width of the box to fill
 * @param height Height of the box to fill
 * @returns Path with x multiplied by width and y by height, rounded to 2 decimals
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
 * Shift draws it in a square. Tools of plugins give their own name and path: their shapes behave as the path shapes
 * of the library (named `shapeName.pathShape` too)
 */
export abstract class PathShapeWidget extends ShapeWidget<Path> {
  protected hasFill = true;
  /** Name of shapes (see `shapeName`), a name of the plugin for a shape of a plugin (see `Plugin.addShapeType`) */
  protected abstract shapeName: string;
  /** Path in a box of width and height 1, see `scalePath` */
  protected abstract path: string;

  /**
   * Empty path at drag start, round joins
   * @param start Drag start, in drawing coordinates
   * @returns Path named by `shapeName`, and by `shapeName.pathShape` for a shape of a plugin
   */
  protected createShape(start: Vector2d) {
    return new Path({
      ...this.shapeStyle,
      x: start.x,
      y: start.y,
      data: '',
      // no spike on sharp corners (tip of heart)
      lineJoin: 'round',
      name: pathShapes.includes(this.shapeName) ? this.shapeName : `${shapeNames.pathShape} ${this.shapeName}`,
    });
  }

  /**
   * Path scaled to the dragged box
   * @param shape Path being drawn
   * @param start Drag start, in drawing coordinates
   * @param end Pointer, in drawing coordinates
   * @param constrain Shift pressed: square box
   */
  protected updateShape(shape: Path, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y, width, height } = dragBox(start, end, constrain);

    shape.setAttrs({ x, y, data: scalePath(this.path, width, height) });
  }
}
