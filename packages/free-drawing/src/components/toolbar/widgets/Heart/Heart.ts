import HeartIcon from '@/icons/heart.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Heart tool: heart in the dragged box
 */
export class HeartWidget extends PathShapeWidget {
  protected shapeName = shapeName.heart;
  protected path = pathShapeData[shapeName.heart];

  /**
   * Create the heart tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'heart', 'Heart', HeartIcon);
  }
}
