import { Drawer } from '@/Drawer';
import { Dropdown } from '@/components/Dropdown/Dropdown';
import { BaseWidget } from './BaseWidget';
import { Toolbar } from '../Toolbar';

export class GroupWidget extends Dropdown {
  drawer: Drawer;
  constructor(drawer: Drawer, toolbar: Toolbar, widgets: BaseWidget[]) {
    super();

    this.drawer = drawer;

    for (const widget of widgets) {
      toolbar.addWidget(widget);
    }
  }
}
