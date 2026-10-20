import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, shapeName, type Drawer } from '@fabwcie/free-drawing';
import { zoneIcon } from '../icons';
import type { StampsPlugin } from '../StampsPlugin';

/**
 * Tool of a plugin drawing in the dragged box, based on `ShapeWidget`: the base creates the shape on press, updates it
 * while the pointer moves (shared live), removes it after a simple click, places it in frames, saves the change and
 * gives back the selection tool. It has the options panel of shape tools (stroke, background, width, opacity). A tool
 * implements `createShape` and `updateShape`, may implement `onDrawEnd`.
 */
export class ZoneWidget extends ShapeWidget<Rect> {
  /** Background color option applies to zones: its section is shown in the options panel of the tool */
  protected hasFill = true;

  /**
   * Zone tool: id `zone`, shortcut Z
   * @param drawer drawer of the tool
   */
  constructor(drawer: Drawer) {
    super(drawer, 'zone', 'Zone', zoneIcon, 'z');
  }

  /**
   * Zone of size 0 at the press, with the style of the drawer options (`shapeStyle`: stroke, background, width,
   * opacity), dashed and rounded. Named as a rectangle: selected, styled and exported as one
   * @param start press, in drawing coordinates
   * @returns zone added to the drawing by the base
   */
  protected createShape(start: Vector2d) {
    return new Rect({
      ...this.shapeStyle,
      name: `${shapeName.rect} zone`,
      x: start.x,
      y: start.y,
      width: 0,
      height: 0,
      dash: [12, 8],
      cornerRadius: 12,
    });
  }

  /**
   * Zone from the press to the pointer, a square with Shift
   * @param shape zone being drawn
   * @param start press
   * @param end pointer
   * @param constrain Shift pressed
   */
  protected updateShape(shape: Rect, start: Vector2d, end: Vector2d, constrain: boolean) {
    let width = end.x - start.x;
    let height = end.y - start.y;

    if (constrain) {
      const size = Math.max(Math.abs(width), Math.abs(height));

      width = Math.sign(width || 1) * size;
      height = Math.sign(height || 1) * size;
    }
    shape.setAttrs({
      x: Math.min(start.x, start.x + width),
      y: Math.min(start.y, start.y + height),
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }

  /**
   * Drawing ended, before the change is saved: name of the zone in the layers panel
   * @param shape zone drawn, null after a simple click (nothing drawn)
   */
  protected onDrawEnd(shape: Rect | null) {
    shape?.setAttr('label', this.drawer.plugins.get<StampsPlugin>('Stamps')!.t('tools.zone'));
  }
}
