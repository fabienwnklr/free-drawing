import DiamondIcon from '@/icons/diamond.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Diamond tool: diamond (rhombus) touching the middles of the sides of the dragged box
 */
export class DiamondWidget extends PathShapeWidget {
  protected shapeName = shapeName.diamond;
  protected path = 'M0.5 0L1 0.5L0.5 1L0 0.5Z';

  /**
   * Create the diamond tool, shortcut D
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'diamond', 'Diamond', DiamondIcon, 'd');
  }
}
