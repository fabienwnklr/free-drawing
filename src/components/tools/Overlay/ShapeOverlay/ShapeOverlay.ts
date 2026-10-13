import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '../BaseOverlay';

/**
 * Overlay of shape tools (line, rectangle, ellipse, arrow)
 */
export class ShapeOverlay extends BaseOverlay {
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: true });
  }
}
