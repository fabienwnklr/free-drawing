import BubbleIcon from '@/icons/bubble.svg?raw';
import type { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Speech bubble tool: rounded box with a tail at the bottom left in the dragged box
 */
export class BubbleWidget extends PathShapeWidget {
  protected shapeName = shapeName.bubble;
  // box in the top 80 %, tail below its left part
  protected path =
    'M0.1 0L0.9 0C0.96 0 1 0.04 1 0.1L1 0.7C1 0.76 0.96 0.8 0.9 0.8L0.45 0.8L0.22 1L0.27 0.8L0.1 0.8' +
    'C0.04 0.8 0 0.76 0 0.7L0 0.1C0 0.04 0.04 0 0.1 0Z';

  /**
   * Create the speech bubble tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'bubble', 'Speech bubble', BubbleIcon);
  }
}
