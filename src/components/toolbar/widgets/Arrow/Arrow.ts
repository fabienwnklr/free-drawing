import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import ArrowIcon from '@/icons/arrow.svg?raw';
import { Drawer } from '@/Drawer';

export class ArrowWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $ArrowIcon = stringToNode<SVGElement>(ArrowIcon);
    super(drawer, 'arrow', 'Arrow', $ArrowIcon, 'a');
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
