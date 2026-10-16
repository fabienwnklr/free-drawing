import type { Drawer } from '@/Drawer';
import { TextOverlay } from '@/components/tools/Overlay/TextOverlay/TextOverlay';

/**
 * Overlay of selected shapes: sections of every kind of selected shape (stroke, background, corners, text...) shown by
 * `SelectWidget`, each one changes the selected shapes it applies to
 */
export class SelectOverlay extends TextOverlay {
  /**
   * Create the selection panel, named as selection options, text sections hidden until texts are selected
   * @param drawer Drawer whose selected shapes the fields change
   */
  constructor(drawer: Drawer) {
    super(drawer, { widthBtns: true, colorTitle: 'overlay.stroke', label: 'overlay.selection' });
    this.toggleTextFields(false);
  }
}
