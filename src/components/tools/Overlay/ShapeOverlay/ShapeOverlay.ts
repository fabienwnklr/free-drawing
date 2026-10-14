import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';

/**
 * Overlay of shape tools (line, rectangle, ellipse, arrow)
 */
export class ShapeOverlay extends BaseOverlay {
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: true, label: 'overlay.shape' });
  }
}
