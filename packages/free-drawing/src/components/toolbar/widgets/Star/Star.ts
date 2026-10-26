import StarIcon from '@/icons/star.svg?raw';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Star tool: star of 5 points in the dragged box
 */
export class StarWidget extends PathShapeWidget {
  protected shapeName = shapeName.star;
  // from the top point, clockwise, inner points between
  protected path = 'M0.5 0L0.618 0.382L1 0.382L0.691 0.618L0.809 1L0.5 0.764L0.191 1L0.309 0.618L0 0.382L0.382 0.382Z';

  /**
   * Create the star tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'star', 'Star', StarIcon);
  }
}
