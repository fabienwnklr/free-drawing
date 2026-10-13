import CircleIcon from '@/icons/circle.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Ellipse } from 'konva/lib/shapes/Ellipse';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '../ShapeWidget';

export class CircleWidget extends ShapeWidget<Ellipse> {
  constructor(drawer: Drawer) {
    super(drawer, 'circle', 'Ellipse', CircleIcon, 'c');
  }

  protected createShape(start: Vector2d) {
    return new Ellipse({ ...this.shapeStyle, x: start.x, y: start.y, radiusX: 0, radiusY: 0, name: shapeName.ellipse });
  }

  protected updateShape(ellipse: Ellipse, start: Vector2d, end: Vector2d, constrain: boolean) {
    // inside drag box, circle with shift
    const { x, y, width, height } = dragBox(start, end, constrain);
    ellipse.setAttrs({ x: x + width / 2, y: y + height / 2, radiusX: width / 2, radiusY: height / 2 });
  }
}
