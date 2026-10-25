import type { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import ImageIcon from '@/icons/image.svg?raw';

/**
 * Image tool: its button adds an image file chosen by the user in the center of the view (`drawer.insertImage`),
 * selected with the selection tool. It runs an action and never becomes the active tool (no shortcut by default:
 * `shortcut` of the `widgets` option)
 */
export class ImageWidget extends BaseWidget {
  readonly actionOnly = true;

  /**
   * Create the image tool
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'image', 'Insert image', ImageIcon);
  }

  /**
   * Activation runs the action: file picker opened (the active tool stays when it is canceled), nothing to deactivate
   * @param active Run the action (true), nothing done for false
   */
  setActive(active: boolean) {
    if (!active || this.isDisabled) return;

    void this.drawer.insertImage();
  }
}
