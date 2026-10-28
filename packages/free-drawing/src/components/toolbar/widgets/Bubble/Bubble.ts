import BubbleIcon from '@/icons/bubble.svg?raw';
import type { Drawer } from '@/Drawer';
import { pathShapeData, shapeName } from '@/constants';
import { PathShapeWidget } from '@/components/toolbar/widgets/PathShapeWidget';

/**
 * Speech bubble tool: rounded box with a tail at the bottom left in the dragged box
 */
export class BubbleWidget extends PathShapeWidget {
  protected shapeName = shapeName.bubble;
  protected path = pathShapeData[shapeName.bubble];

  /**
   * Create the speech bubble tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'bubble', 'Speech bubble', BubbleIcon);
  }
}
