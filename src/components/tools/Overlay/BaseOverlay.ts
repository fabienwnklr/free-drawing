import type { Drawer } from '@/Drawer';
import './overlay.scss';
export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');

    this.drawer.$drawerContainer.append(this.$overlayContainer);
  }

  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements);
  }

  show() {
    this.$overlayContainer.classList.add('show');
  }

  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
