import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '../BaseOverlay';

export class BrushOverlay extends BaseOverlay {
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: false, label: 'Brush options' });
  }
}
