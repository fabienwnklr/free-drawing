import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Group } from 'konva/lib/Group';

export class SelectWidget extends BaseWidget {
  constructor(protected drawer: Drawer) {
    const $SelectIcon = stringToNode<SVGElement>(SelectIcon);
    super(drawer, 'selection', 'Select', $SelectIcon);
  }

  protected onActive(): void {
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => {
      d.setDraggable(true);
      if (d instanceof Group) return;
      d.hitFunc((context, shape) => {
        const { x, y, width, height } = shape.getSelfRect();
        context.beginPath();
        context.rect(x, y, width, height);
        context.closePath();
        context.fillStrokeShape(shape);
      });
    });
  }

  protected onDesactive(): void {
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => {
      d.setDraggable(false);
      if (d instanceof Group) return;
      d.hitFunc(undefined);
    });
    this.drawer.transformer.nodes([]);
  }
}
