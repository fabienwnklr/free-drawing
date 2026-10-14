import { Drawer } from '@/Drawer';
import { Dropdown } from '@/components/Dropdown/Dropdown';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { Toolbar } from '@/components/toolbar/Toolbar';

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
