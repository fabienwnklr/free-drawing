import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { ShapeOrder } from '@/@types/drawer';
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
    // stacking order of selection with Ctrl / Cmd
    const orderKeys: Record<string, ShapeOrder> = {
      ArrowUp: 'forward',
      ArrowDown: 'backward',
      'Shift+ArrowUp': 'front',
      'Shift+ArrowDown': 'back',
    };
    // selection moved with arrow keys, saved on key release (not on each repeated keydown)
    let arrowMoved = false;

    this.drawer.$drawerContainer.addEventListener('keydown', (e) => {
      if (this.drawer._duringAction()) return;

      // Ctrl on Windows / Linux, Cmd on Mac
      const mod = e.ctrlKey || e.metaKey;
      const selectWidget = this.drawer.getWidget<SelectWidget>('selection');
      const selectedNodes = selectWidget?.transformer.nodes() ?? [];
      // fields keep their keys (arrows of opacity, select all of a text field...)
      const inField = (e.target as HTMLElement).matches('input, select, textarea');
      // read only: shortcuts modifying drawing do nothing
      const edit = !this.drawer.readOnly;

      if (edit && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (mod) {
          // asks confirmation, selection is kept if canceled
          this.drawer.clearCanvas();
        } else if (selectedNodes.length) {
          selectWidget?.clearSelection();
          selectedNodes.forEach((n) => n.destroy());
          this.drawer.stage.fire('change');
        }
      }

      if (mod && e.key === 'a' && !inField) {
        if (edit) selectWidget?.selectAll();
        // shapes, not page text (browser select all)
        e.preventDefault();
      }

      const order = mod ? orderKeys[`${e.shiftKey ? 'Shift+' : ''}${e.key}`] : undefined;

      if (edit && selectedNodes.length && order && !inField) {
        this.drawer.reorderShapes(order);
        e.preventDefault();
      } else if (edit && selectedNodes.length && e.key in arrowMoves && !inField) {
        // only arrow keys, other keys keep their default behavior (F5, Tab...)
        selectedNodes.forEach((shape) => shape.move(arrowMoves[e.key]));
        arrowMoved = true;
        e.preventDefault();
      }

      // Toolbar shortcut, the letter displayed on widget button (whatever caps lock)
      if (!mod && !e.altKey) {
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

      if (edit && mod && e.key === 'z') {
        this.drawer.undoRedo.undo();
      }

      // instead of browser save page and open file
      if (mod && e.key === 's') {
        e.preventDefault();
        this.drawer.saveAs();
      }

      if (mod && e.key === 'o') {
        e.preventDefault();
        if (edit) this.drawer.open();
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.drawer.showExport();
      }

      if (edit && mod && e.key === 'y') {
        this.drawer.undoRedo.redo();
      }

      if (e.altKey && e.key === 'g') {
        this.drawer.setting.toggleGrid();
      }
    });

    this.drawer.$drawerContainer.addEventListener('keyup', (e) => {
      if (arrowMoved && e.key in arrowMoves) {
        arrowMoved = false;
        this.drawer.stage.fire('change');
      }
    });

    // Ctrl / Cmd + V, clipboard data is available without permission (unlike navigator.clipboard)
    this.drawer.$drawerContainer.addEventListener('paste', (e) => {
      if (this.drawer._duringAction() || this.drawer.readOnly) return;

      const text = e.clipboardData?.getData('text');

      if (text) {
        e.preventDefault();
        this.drawer.getWidget<TextWidget>('text')?.addTextNode(text);
        this.drawer.stage.fire('change');
      }
    });
  }
}
