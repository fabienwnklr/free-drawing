import LineIcon from '@/icons/line2.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Line } from 'konva/lib/shapes/Line';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, snapAngle } from '@/components/toolbar/widgets/ShapeWidget';

/**
 * Straight line tool: line from drag start to end, Shift snaps its angle to 45 degrees
 */
export class LineWidget extends ShapeWidget<Line> {
  /**
   * Create the straight line tool, shortcut L
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'line', 'Line', LineIcon, 'l');
  }

  /**
   * Line of length 0 at drag start
   * @param start Drag start, in drawing coordinates
   * @returns Line with style of drawer options
   */
  protected createShape(start: Vector2d) {
    return new Line({
      ...this.shapeStyle,
      /** Start and end, both at drag start until pointer moves */
      points: [start.x, start.y, start.x, start.y],
      /** Round cap for smoother lines */
      lineCap: 'round',
      /** Round joins */
      lineJoin: 'round',
      /** Shape name of straight lines */
      name: shapeName.straightLine,
    });
  }

  /**
   * Line from drag start to pointer
   * @param line Line being drawn
   * @param start Drag start, in drawing coordinates
   * @param end Pointer, in drawing coordinates
   * @param constrain Shift pressed: angle snapped to 45 degrees
   */
  protected updateShape(line: Line, start: Vector2d, end: Vector2d, constrain: boolean) {
    const { x, y } = constrain ? snapAngle(start, end) : end;
    line.points([start.x, start.y, x, y]);
  }
}
