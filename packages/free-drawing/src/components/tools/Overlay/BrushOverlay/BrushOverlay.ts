import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';

export class BrushOverlay extends BaseOverlay {
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: false, label: 'overlay.brush' });
  }
}
