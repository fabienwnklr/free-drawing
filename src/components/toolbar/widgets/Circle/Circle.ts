import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import CircleIcon from '@/icons/circle.svg?raw';
import { Drawer } from '@/Drawer';

export class CircleWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $CircleIcon = stringToNode<SVGElement>(CircleIcon);
    super(drawer, 'circle', 'Circle', $CircleIcon, 'c');
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
