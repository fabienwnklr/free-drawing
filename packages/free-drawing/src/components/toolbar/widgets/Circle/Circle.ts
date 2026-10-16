import CircleIcon from '@/icons/circle.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '@/components/toolbar/widgets/ShapeWidget';

/**
 * Ellipse tool: ellipse inside the dragged box, circle with Shift, with background color
 */
export class CircleWidget extends ShapeWidget<Ellipse> {
  protected hasFill = true;

  /**
   * Create the ellipse tool, shortcut C
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'circle', 'Ellipse', CircleIcon, 'c');
  }

  /**
   * Ellipse of radius 0 at drag start
   * @param start Drag start, in drawing coordinates
   * @returns Ellipse with style of drawer options
   */
  protected createShape(start: Vector2d) {
    return new Ellipse({ ...this.shapeStyle, x: start.x, y: start.y, radiusX: 0, radiusY: 0, name: shapeName.ellipse });
  }

  /**
   * Ellipse inscribed in the dragged box
   * @param ellipse Ellipse being drawn
   * @param start Drag start, in drawing coordinates
   * @param end Pointer, in drawing coordinates
   * @param constrain Shift pressed: circle
   */
  protected updateShape(ellipse: Ellipse, start: Vector2d, end: Vector2d, constrain: boolean) {
    // inside drag box, circle with shift
    const { x, y, width, height } = dragBox(start, end, constrain);
    ellipse.setAttrs({ x: x + width / 2, y: y + height / 2, radiusX: width / 2, radiusY: height / 2 });
  }
}
