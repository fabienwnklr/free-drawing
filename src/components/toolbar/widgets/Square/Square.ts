import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SquareIcon from '@/icons/square.svg?raw';
import { Drawer } from '@/Drawer';

export class SquareWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $SquareIcon = stringToNode<SVGElement>(SquareIcon);
    super(drawer, 'square', 'Square', $SquareIcon, 'r');
  }

  protected onActive(): void {
    return;
  }

  protected onDesactive(): void {
    return;
  }

  protected initEvents(): void {
    return;
  }

  protected removeEvents(): void {
    return;
  }

  public updateCursor(): void {
    return;
  }
}
