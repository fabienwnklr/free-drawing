import { BrushWidget } from '@/components/toolbar/widgets/Brush/Brush';
import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { Drawer } from '../Drawer';

export class HotKey {
  drawer: Drawer;
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    const DELTA = 4;
    const arrowMoves: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -DELTA, y: 0 },
      ArrowUp: { x: 0, y: -DELTA },
      ArrowRight: { x: DELTA, y: 0 },
      ArrowDown: { x: 0, y: DELTA },
    };

    this.drawer.$drawerContainer.addEventListener('keydown', (e) => {
      if (this.drawer._duringAction()) return;

      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const allNodes = selectWidget?.transformer.nodes();

        if (allNodes?.length) {
          allNodes.forEach((n) => n.destroy());
          selectWidget?.transformer.nodes([]);
          selectWidget?.hideOverlay();

          if (this.drawer.activeWidget instanceof BrushWidget || this.drawer.activeWidget instanceof TextWidget) {
            this.drawer.activeWidget.overlay.show();
          }
          this.drawer.stage.fire('change');
        }
      }

      if (e.ctrlKey && e.key === 'a') {
        selectWidget?.selectAll();
      }

      const selectedNodes = selectWidget?.transformer.nodes() ?? [];

      // only arrow keys, other keys keep their default behavior (F5, Tab...)
      if (selectedNodes.length && e.key in arrowMoves) {
        selectedNodes.forEach((shape) => shape.move(arrowMoves[e.key]));
        e.preventDefault();
      }

      // Toolbar shortcut, the letter displayed on widget button (whatever caps lock)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const widget = Array.from(this.drawer.toolbar.widgets.values()).find(
          (w) => w.shortcut === e.key.toLowerCase()
        );

        if (widget) {
          widget.setActive(true);
          widget.$button.focus();
          return;
        }
      }

      if (e.altKey && e.key === 's') {
        this.drawer.setting.toggleSnapping();
      }

      if (e.altKey && e.key === 'z') {
        this.drawer.setting.toggleZenMode();
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
