import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SelectIcon from './select.svg?raw';

export class SelectWidget extends BaseWidget {
  constructor(protected drawer: Drawer) {
    const $SelectIcon = stringToNode<SVGElement>(SelectIcon);
    super(drawer, 'selection', 'Select', $SelectIcon);
  }

  protected onActive(): void {}

  protected onDesactive(): void {}
}
