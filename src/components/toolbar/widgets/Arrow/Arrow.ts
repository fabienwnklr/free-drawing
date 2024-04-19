import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import ArrowIcon from '@/icons/arrow.svg?raw';
import { Drawer } from '@/Drawer';

export class ArrowWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $ArrowIcon = stringToNode<SVGElement>(ArrowIcon);
    super(drawer, 'pan', 'Pan', $ArrowIcon, 'h');
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
