import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';

/**
 * Overlay of brush: color, width and opacity, no stroke style (freehand strokes are filled outlines)
 */
export class BrushOverlay extends BaseOverlay {
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: false, label: 'overlay.brush' });
  }
}
