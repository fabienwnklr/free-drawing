import BlockArrowIcon from '@/icons/block-arrow.svg?raw';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Block arrow tool: wide arrow pointing right in the dragged box (rotated or flipped for other directions)
 */
export class BlockArrowWidget extends PathShapeWidget {
  protected shapeName = shapeName.blockArrow;
  // shaft on the left, head on the right
  protected path = 'M0 0.3L0.6 0.3L0.6 0L1 0.5L0.6 1L0.6 0.7L0 0.7Z';

  /**
   * Create the block arrow tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'blockArrow', 'Block arrow', BlockArrowIcon);
  }
}
