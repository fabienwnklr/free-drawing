import type { Drawer } from './Drawer';

export class DrawerLayout {
  drawer: Drawer;
  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }
  log() {
    console.log('test');
  }
}
