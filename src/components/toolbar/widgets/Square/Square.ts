import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SquareIcon from '@/icons/square.svg?raw';
import { Drawer } from '@/Drawer';

export class SquareWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $SquareIcon = stringToNode<SVGElement>(SquareIcon);
    super(drawer, 'pan', 'Pan', $SquareIcon, 'h');
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
