import BlockArrowIcon from '@/icons/block-arrow.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Block arrow tool: wide arrow pointing right in the dragged box (rotated or flipped for other directions)
 */
export class BlockArrowWidget extends PathShapeWidget {
  protected shapeName = shapeName.blockArrow;
  protected path = pathShapeData[shapeName.blockArrow];

  /**
   * Create the block arrow tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'blockArrow', 'Block arrow', BlockArrowIcon);
  }
}
