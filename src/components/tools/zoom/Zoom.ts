import { Drawer } from '@/Drawer';

export class Zoom {
  drawer: Drawer;
  zoomLevel: number;
  $zoomContainer: HTMLDivElement;
  $btnMinus: HTMLDivElement;
  $btnReset: HTMLDivElement;
  $btnPlus: HTMLDivElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.zoomLevel = drawer.stage.scaleX();

    this.$zoomContainer = document.createElement('div');
    this.$zoomContainer.classList.add('drawer-zoom-container');

    this.$btnMinus = document.createElement('div');
    this.$btnReset = document.createElement('div');
    this.$btnPlus = document.createElement('div');

    this.$btnMinus.role = 'button';
    this.$btnReset.role = 'button';
    this.$btnPlus.role = 'button';

    this.$zoomContainer.append(...[this.$btnMinus, this.$btnReset, this.$btnPlus]);

    this.drawer.$drawerContainer.append(this.$zoomContainer);
  }
}
