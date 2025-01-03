import { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import { EraserWidget } from '@/components/toolbar/widgets/Eraser/Eraser';
import { PanWidget } from '@/components/toolbar/widgets/Pan/Pan';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { Drawer } from '../Drawer';

export class HotKey {
  drawer: Drawer;
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    const DELTA = 4;
    this.drawer.$drawerContainer.addEventListener('keydown', (e) => {
      if (this.drawer._duringAction()) return;

      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const allNodes = selectWidget?.transformer.nodes();

        if (allNodes) {
          allNodes.forEach((n) => n.destroy());
          selectWidget?.transformer.nodes([]);
          selectWidget?.overlay.hide();

          if (this.drawer.activeWidget instanceof BrushWidget) {
            this.drawer.activeWidget.overlay.show();
          }
          this.drawer.stage.fire('change');
        }
      }

      if (e.ctrlKey && e.key === 'a') {
        selectWidget?.selectAll();
      }

      if (selectWidget?.transformer.nodes().length) {
        selectWidget?.transformer.nodes().forEach((shape) => {
          if (e.key === 'ArrowLeft') {
            shape.x(shape.x() - DELTA);
          } else if (e.key === 'ArrowUp') {
            shape.y(shape.y() - DELTA);
          } else if (e.key === 'ArrowRight') {
            shape.x(shape.x() + DELTA);
          } else if (e.key === 'ArrowDown') {
            shape.y(shape.y() + DELTA);
          } else {
            return;
          }
        });
        e.preventDefault();
      }

      const panWidget = this.drawer.getWidget<PanWidget>('pan');

      if (!e.altKey && e.key === 's') {
        if (this.drawer._duringAction()) {
          return;
        }

        selectWidget?.setActive(true);
        selectWidget?.$button.focus();
        return;
      }

      // Toolbar shortcut
      if (e.key === 'h') {
        if (this.drawer._duringAction()) {
          return;
        }

        panWidget?.setActive(true);
        panWidget?.$button.focus();
        return;
      }

      if (e.altKey && e.key === 's') {
        this.drawer.setting.toggleSnapping();
      }

      if (e.key === 'b') {
        if (this.drawer._duringAction()) {
          return;
        }

        const brushWidget = this.drawer.getWidget<BrushWidget>('brush');

        brushWidget?.setActive(true);
        brushWidget?.$button.focus();
        return;
      }

      if (e.key === 'e') {
        if (this.drawer._duringAction()) {
          return;
        }

        const eraserWidget = this.drawer.getWidget<EraserWidget>('eraser');
        eraserWidget?.setActive(true);
        eraserWidget?.$button.focus();
      }

      if (e.key === 't') {
        if (this.drawer._duringAction()) {
          return;
        }

        const textWidget = this.drawer.getWidget<TextWidget>('text');
        textWidget?.setActive(true);
        textWidget?.$button.focus();
      }

      if (e.altKey && e.key === 'z') {
        this.drawer.setting.toggleZenMode();
      }

      if (e.altKey && e.key === 'z') {
        this.drawer.setting.toggleSnapping();
      }

      if (e.ctrlKey && e.key === 'Delete') {
        this.drawer.clearCanvas();
      }

      if (e.ctrlKey && e.key === 'z') {
        this.drawer.undoRedo.undo();
      }

      if (e.ctrlKey && e.key === 'y') {
        this.drawer.undoRedo.redo();
      }

      if (e.altKey && e.key === 'g') {
        this.drawer.setting.toggleGrid();
      }
    });
  }
}
