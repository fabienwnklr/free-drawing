import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';

/**
 * Overlay of shape tools (line, rectangle, ellipse, arrow)
 */
export class ShapeOverlay extends BaseOverlay {
  /**
   * Create the panel shared by shape tools, with stroke style section
   * @param drawer Drawer whose shape tool options the fields change
   */
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: true, label: 'overlay.shape' });
  }
}
