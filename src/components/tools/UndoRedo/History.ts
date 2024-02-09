import type { Drawer } from '@/Drawer';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';

export class History {
  appHistory: { type: string }[][] = [[]];
  appHistoryStep: number = 0;
  drawer: Drawer;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
  }

  saveState() {
    const draw = this.drawer.getDrawingShapes();
    const state = draw.map((d) => {
      return { type: d.className, ...d.attrs };
    });
    this.appHistory = this.appHistory.slice(0, this.appHistoryStep + 1);
    this.appHistory = this.appHistory.concat([state]);
    this.appHistoryStep += 1;
  }

  canUndo() {
    return !!this.appHistory[this.appHistoryStep - 1];
  }
  undo() {
    try {
      const state = this.appHistory[this.appHistoryStep - 1];
      if (state) {
        const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
        selectWidget?.transformer.nodes([]);
        this.appHistoryStep -= 1;
        this.drawer.getDrawingShapes().forEach((c) => c.destroy());
        state.forEach((shape) => {
          if (shape.type === 'Line') {
            const line = new Line(shape);
            line.draggable(true);
            line.on('dragend', () => {
              this.drawer.stage.fire('change');
            });
            this.drawer.drawLayer.add(line);
          }

          if (shape.type === 'Text') {
            this.drawer.drawLayer.add(new Text(shape));
          }
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  canRedo() {
    return !!this.appHistory[this.appHistoryStep + 1];
  }

  redo() {
    try {
      const state = this.appHistory[this.appHistoryStep + 1];
      if (state) {
        const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
        selectWidget?.transformer.nodes([]);
        this.appHistoryStep += 1;
        this.drawer.getDrawingShapes().forEach((c) => c.destroy());
        state.forEach((shape) => {
          if (shape.type === 'Line') this.drawer.drawLayer.add(new Line(shape));
          if (shape.type === 'Text') this.drawer.drawLayer.add(new Text(shape));
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
