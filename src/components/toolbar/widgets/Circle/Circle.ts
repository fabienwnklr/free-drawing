import { BaseWidget } from '../BaseWidget';
import CircleIcon from '@/icons/circle.svg?raw';
import { Drawer } from '@/Drawer';

export class CircleWidget extends BaseWidget {
  constructor(drawer: Drawer) {
    super(drawer, 'circle', 'Circle', CircleIcon, 'c');
  }
}
