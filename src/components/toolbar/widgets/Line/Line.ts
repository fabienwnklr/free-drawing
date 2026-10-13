import LineIcon from '@/icons/line2.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Line } from 'konva/lib/shapes/Line';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, snapAngle } from '../ShapeWidget';

export class LineWidget extends ShapeWidget<Line> {
  constructor(drawer: Drawer) {
    super(drawer, 'line', 'Line', LineIcon, 'l');
  }

  protected createShape(start: Vector2d) {
    return new Line({
      ...this.shapeStyle,
      points: [start.x, start.y, start.x, start.y],
      // round cap for smoother lines
      lineCap: 'round',
      lineJoin: 'round',
      name: shapeName.straightLine,
    });
  }

  protected updateShape(line: Line, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y } = constrain ? snapAngle(start, end) : end;
    line.points([start.x, start.y, x, y]);
  }
}
