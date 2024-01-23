import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import PanIcon from './pan.svg?raw';

export class PanWidget extends BaseWidget {
  constructor(protected drawer: Drawer) {
    const $PanIcon = stringToNode<SVGElement>(PanIcon);
    super(drawer, 'pan', 'Pan', $PanIcon);
  }

  protected onActive(): void {
    this.drawer.stage.draggable(true);

  }
  protected onDesactive(): void {
    this.drawer.stage.draggable(false);
  }
}
