import { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import type { ShapeOrder } from '@/@types/drawer';
import { unbindMoved } from '@/utils/binding';
import { Drawer } from '@/Drawer';

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
      // locked shapes are selected to be unlocked, not modified
      const locked = !!selectWidget?.isLocked();
      const editable = locked ? [] : selectedNodes;
      // fields keep their keys (arrows of opacity, select all of a text field...)
      const inField = (e.target as HTMLElement).matches('input, select, textarea');
      // read only: shortcuts modifying drawing do nothing
      const edit = !this.drawer.readOnly;

      if (edit && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (mod) {
          // asks confirmation, selection is kept if canceled
          this.drawer.clearCanvas();
        } else if (editable.length) {
          this.drawer.deleteShapes();
        }
      }

      if (mod && e.key === 'a' && !inField) {
        if (edit) selectWidget?.selectAll();
        // shapes, not page text (browser select all)
        e.preventDefault();
      }

      // instead of browser bookmark
      if (edit && mod && e.key === 'd' && editable.length && !inField) {
        e.preventDefault();
        this.drawer.duplicateShapes();
      }

      // instead of browser find next
      if (edit && mod && e.key.toLowerCase() === 'g' && editable.length && !inField) {
        e.preventDefault();
        if (e.shiftKey) this.drawer.ungroupShapes();
        else this.drawer.groupShapes();
      }

      const order = mod ? orderKeys[`${e.shiftKey ? 'Shift+' : ''}${e.key}`] : undefined;

      if (edit && editable.length && order && !inField) {
        this.drawer.reorderShapes(order);
        e.preventDefault();
      } else if (edit && editable.length && e.key in arrowMoves && !inField) {
        // only arrow keys, other keys keep their default behavior (F5, Tab...)
        if (!arrowMoved) unbindMoved(editable);
        editable.forEach((shape) => shape.move(arrowMoves[e.key]));
        arrowMoved = true;
        e.preventDefault();
      }

      // flip or rotate selection by a quarter turn (Shift + letter is not a tool shortcut)
      if (edit && !mod && !e.altKey && e.shiftKey && editable.length && !inField) {
        if (e.code === 'KeyH') this.drawer.flipShapes('horizontal');
        if (e.code === 'KeyV') this.drawer.flipShapes('vertical');
        if (e.code === 'KeyR') this.drawer.rotateShapes(90);
        if (e.code === 'KeyL') this.drawer.rotateShapes(-90);
      }

      // lock selection, unlock locked one (still selected)
      if (edit && mod && e.shiftKey && e.code === 'KeyL' && selectedNodes.length && !inField) {
        e.preventDefault();
        this.drawer.setShapesLocked(!locked);
      }

      // copy selection (whole drawing without selection) as image, physical keys (Alt changes characters)
      if (e.altKey && e.shiftKey && !mod && (e.code === 'KeyC' || e.code === 'KeyS') && !inField) {
        e.preventDefault();
        this.drawer.copyImage(e.code === 'KeyC' ? 'png' : 'svg');
      }

      // Toolbar shortcut, the letter displayed on widget button (whatever caps lock)
      if (!mod && !e.altKey && !e.shiftKey) {
        const widget = Array.from(this.drawer.toolbar.widgets.values()).find(
          (w) => w.shortcut === e.key.toLowerCase()
        );

        if (widget) {
          widget.setActive(true);
          this.drawer.toolbar.getButton(widget).focus();
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

      if (mod && e.key === ',' && !inField) {
        e.preventDefault();
        this.drawer.showPreferences();
      }

      // instead of browser search
      if (mod && e.key.toLowerCase() === 'k' && !inField && this.drawer.options.commandPalette) {
        e.preventDefault();
        this.drawer.showCommandPalette();
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

      if (e.altKey && e.key === 'l') {
        this.drawer.layersPanel?.toggle();
      }

      // physical key: Alt + Shift + D gives another character on some layouts (macOS)
      if (e.altKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        this.drawer.toggleDarkMode();
      }
    });

    this.drawer.$drawerContainer.addEventListener('keyup', (e) => {
      if (arrowMoved && e.key in arrowMoves) {
        arrowMoved = false;
        this.drawer.placeInFrames(this.drawer.getSelectedShapes());
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
