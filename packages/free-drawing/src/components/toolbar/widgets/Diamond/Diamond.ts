import DiamondIcon from '@/icons/diamond.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Diamond tool: diamond (rhombus) touching the middles of the sides of the dragged box
 */
export class DiamondWidget extends PathShapeWidget {
  protected shapeName = shapeName.diamond;
  protected path = pathShapeData[shapeName.diamond];

  /**
   * Create the diamond tool, shortcut D
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'diamond', 'Diamond', DiamondIcon, 'd');
  }
}
