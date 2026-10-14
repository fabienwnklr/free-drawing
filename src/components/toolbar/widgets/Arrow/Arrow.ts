import ArrowIcon from '@/icons/arrow.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Arrow } from 'konva/lib/shapes/Arrow';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, snapAngle } from '@/components/toolbar/widgets/ShapeWidget';

/**
 * Arrow head size, proportional to stroke width
 * @param {number} strokeWidth
 */
export const arrowPointerSize = (strokeWidth: number) => strokeWidth * 2 + 8;

export class ArrowWidget extends ShapeWidget<Arrow> {
  constructor(drawer: Drawer) {
    super(drawer, 'arrow', 'Arrow', ArrowIcon, 'a');
  }

  protected createShape(start: Vector2d) {
    const style = this.shapeStyle;
    const pointerSize = arrowPointerSize(style.strokeWidth);

    return new Arrow({
      ...style,
      // filled head
      fill: style.stroke,
      points: [start.x, start.y, start.x, start.y],
      pointerLength: pointerSize,
      pointerWidth: pointerSize,
      lineCap: 'round',
      lineJoin: 'round',
      name: shapeName.arrow,
    });
  }

  protected updateShape(arrow: Arrow, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y } = constrain ? snapAngle(start, end) : end;
    arrow.points([start.x, start.y, x, y]);
  }
}
