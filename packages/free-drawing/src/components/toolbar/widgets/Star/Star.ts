import StarIcon from '@/icons/star.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Star tool: star of 5 points in the dragged box
 */
export class StarWidget extends PathShapeWidget {
  protected shapeName = shapeName.star;
  protected path = pathShapeData[shapeName.star];

  /**
   * Create the star tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'star', 'Star', StarIcon);
  }
}
