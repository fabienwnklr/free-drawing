import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import LineIcon from '@/icons/line.svg?raw';
import { Drawer } from '@/Drawer';

export class LineWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $LineIcon = stringToNode<SVGElement>(LineIcon);
    super(drawer, 'pan', 'Pan', $LineIcon, 'h');
  }

  protected onActive(): void {
    throw new Error('Method not implemented.');
  }
  protected onDesactive(): void {
    throw new Error('Method not implemented.');
  }
  protected initEvents(): void {
    throw new Error('Method not implemented.');
  }
  protected removeEvents(): void {
    throw new Error('Method not implemented.');
  }
  public updateCursor(): void {
    throw new Error('Method not implemented.');
  }
}
