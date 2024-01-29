import type { Drawer } from '@/Drawer';

export class Overlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
  }
}
