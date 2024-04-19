import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import CircleIcon from '@/icons/circle.svg?raw';
import { Drawer } from '@/Drawer';

export class CircleWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    const $CircleIcon = stringToNode<SVGElement>(CircleIcon);
    super(drawer, 'pan', 'Pan', $CircleIcon, 'h');
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
