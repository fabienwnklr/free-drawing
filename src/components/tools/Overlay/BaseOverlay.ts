import type { Drawer } from '@/Drawer';

export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool')
  }

  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements)
  }
}
