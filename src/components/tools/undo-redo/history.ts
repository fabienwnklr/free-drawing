import type { Drawer } from '@/Drawer';
import { SelectWidget } from '@/components/toolbar/widgets/select/select';
import { Line } from 'konva/lib/shapes/Line';

export class History {
  appHistory: { type: string }[][] = [[]];
  appHistoryStep: number = 0;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }

  saveState() {
    const draw = this.drawer.layer.getChildren().filter((e) => e.className === 'Line');
    const state = draw.map((d) => {
      return { type: d.className, ...d.attrs };
    });
    this.appHistory = this.appHistory.slice(0, this.appHistoryStep + 1);
    this.appHistory = this.appHistory.concat([state]);
    this.appHistoryStep += 1;
  }

  undo() {
    try {
      const state = this.appHistory[this.appHistoryStep - 1];
      if (state) {
        const selectWidget = this.drawer.toolbar.widgets.get('selection') as SelectWidget;
        if (selectWidget) {
          selectWidget.transformer.nodes([]);
        }
        this.appHistoryStep -= 1;
        this.drawer.layer
          .getChildren()
          .filter((e) => e.className === 'Line')
          .forEach((c) => c.destroy());
        state.forEach((shape) => {
          if (shape.type === 'Line') {
            const line = new Line(shape);

            line.on('dragend', () => {
              this.drawer.stage.fire('change');
            });
            this.drawer.layer.add(line);
          }
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  redo() {
    try {
      const state = this.appHistory[this.appHistoryStep + 1];
      if (state) {
        const selectWidget = this.drawer.toolbar.widgets.get('selection') as SelectWidget;
        if (selectWidget) {
          selectWidget.transformer.nodes([]);
        }
        this.appHistoryStep += 1;
        this.drawer.layer
          .getChildren()
          .filter((e) => e.className === 'Line')
          .forEach((c) => c.destroy());
        state.forEach((shape) => {
          if (shape.type === 'Line') this.drawer.layer.add(new Line(shape));
        });

        // if selection active, update
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
