import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '../BaseOverlay';

export class BrushOverlay extends BaseOverlay {
  $strokeColorContainer: HTMLDivElement;
  constructor(drawer: Drawer) {
    super(drawer);

    this.$strokeColorContainer = document.createElement('div');

    this.appendContent([this.$strokeColorContainer]);
  }
}
