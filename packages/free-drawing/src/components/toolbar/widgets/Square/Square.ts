import SquareIcon from '@/icons/square.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, dragBox } from '@/components/toolbar/widgets/ShapeWidget';
import { getCornerRadius } from '@/utils/stroke';

export class SquareWidget extends ShapeWidget<Rect> {
  protected hasFill = true;
  protected hasEdges = true;

  constructor(drawer: Drawer) {
    super(drawer, 'square', 'Rectangle', SquareIcon, 'r');
  }

  protected createShape(start: Vector2d) {
    return new Rect({ ...this.shapeStyle, x: start.x, y: start.y, width: 0, height: 0, name: shapeName.rect });
  }

  protected updateShape(rect: Rect, start: Vector2d, end: Vector2d, constrain: boolean) {
    // square with shift
    const box = dragBox(start, end, constrain);
    // round corners follow size
    rect.setAttrs({ ...box, cornerRadius: getCornerRadius(box.width, box.height, this.drawer.options.edges) });
  }
}
