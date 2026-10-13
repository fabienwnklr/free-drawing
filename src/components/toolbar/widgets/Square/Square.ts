import SquareIcon from '@/icons/square.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '../ShapeWidget';

export class SquareWidget extends ShapeWidget<Rect> {
  protected hasFill = true;

  constructor(drawer: Drawer) {
    super(drawer, 'square', 'Rectangle', SquareIcon, 'r');
  }

  protected createShape(start: Vector2d) {
    return new Rect({ ...this.shapeStyle, x: start.x, y: start.y, width: 0, height: 0, name: shapeName.rect });
  }

  protected updateShape(rect: Rect, start: Vector2d, end: Vector2d, constrain: boolean) {
    // square with shift
    rect.setAttrs(dragBox(start, end, constrain));
  }
}
