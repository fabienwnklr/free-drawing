import SquareIcon from '@/icons/square.svg?raw';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '@/components/toolbar/widgets/ShapeWidget';
import { getCornerRadius } from '@/utils/stroke';

/**
 * Rectangle tool: rectangle of the dragged box, square with Shift, with background color and edges (sharp, round
 * or radius)
 */
export class SquareWidget extends ShapeWidget<Rect> {
  protected hasFill = true;
  protected hasEdges = true;

  /**
   * Create the rectangle tool, shortcut R
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'square', 'Rectangle', SquareIcon, 'r');
  }

  /**
   * Rectangle of size 0 at drag start
   * @param start Drag start, in drawing coordinates
   * @returns Rectangle with style of drawer options
   */
  protected createShape(start: Vector2d) {
    return new Rect({ ...this.shapeStyle, x: start.x, y: start.y, width: 0, height: 0, name: shapeName.rect });
  }

  /**
   * Rectangle of the dragged box, corner radius from `edges` option and its size
   * @param rect Rectangle being drawn
   * @param start Drag start, in drawing coordinates
   * @param end Pointer, in drawing coordinates
   * @param constrain Shift pressed: square
   */
  protected updateShape(rect: Rect, start: Vector2d, end: Vector2d, constrain: boolean) {
    // square with shift
    const box = dragBox(start, end, constrain);
    // round corners follow size
    rect.setAttrs({ ...box, cornerRadius: getCornerRadius(box.width, box.height, this.drawer.options.edges) });
  }
}
