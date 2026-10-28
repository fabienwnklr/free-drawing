import { grabbingCursor, grabCursor } from '@/constants';
import type { Drawer } from '@/Drawer';

/**
 * Hand of the Space key: while Space is held (focus on the drawing, or pointer on the canvas out of the fields of the
 * drawer), a drag moves the view whatever the tool, as the pan tool; the tool and the selection stay as they were.
 * Shapes and the transformer are not reached meanwhile (layers not listening), tools ignore the pointer (`active`)
 */
export class SpacePan {
  /** Drawer whose view is moved */
  drawer: Drawer;
  /** Space held: a drag moves the view, tools ignore the pointer */
  active = false;
  /** View moved while Space was held: change fired on release (view saved) */
  #moved = false;
  /** Draw and selection layers listening before */
  #listening: boolean[] = [];

  /**
   * Released with Space, or once the page loses focus (Space released out of it)
   * @param drawer Drawer whose view is moved
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    drawer.$drawerContainer.addEventListener('keyup', (e) => {
      if (e.key !== ' ' || !this.active) return;
      // not a click of the focused button
      e.preventDefault();
      this.stop();
    });
    window.addEventListener('blur', () => this.stop(), { signal: drawer.signal });
  }

  /**
   * Keydown of the drawer (`HotKey`): Space starts the hand, its repeats are kept from the page
   * @param e Keydown of the drawer
   * @returns true when the key was used (its default prevented by `HotKey`)
   */
  handleKey(e: KeyboardEvent): boolean {
    if (e.key !== ' ' || e.ctrlKey || e.metaKey || e.altKey) return false;
    if (this.active) return true;

    const { drawer } = this;
    const target = e.target as HTMLElement;
    // drawing focused, or a button of the drawer (tool clicked) with the pointer on the canvas: fields keep Space
    const onDrawing =
      target === drawer.$drawerContainer || (target instanceof HTMLButtonElement && drawer._hasPointer());

    if (!onDrawing || drawer._duringAction()) return false;
    this.start();

    return true;
  }

  /**
   * Drags move the view: stage draggable, shapes and transformer out of reach, grab cursor
   */
  start() {
    const { drawer } = this;
    const { stage, drawLayer, selectionLayer } = drawer;

    if (this.active) return;
    this.active = true;
    this.#moved = false;
    this.#listening = [drawLayer.listening(), selectionLayer.listening()];
    stage.draggable(true);
    drawLayer.listening(false);
    selectionLayer.listening(false);
    drawer.$stageContainer.style.cursor = grabCursor;
    stage.on('dragstart.spacePan', () => (drawer.$stageContainer.style.cursor = grabbingCursor));
    stage.on('dragmove.spacePan', (e) => {
      if (e.target === stage) this.#moved = true;
    });
    stage.on('dragend.spacePan', () => (drawer.$stageContainer.style.cursor = grabCursor));
  }

  /**
   * Tool changed while Space is held (button of the toolbar clicked): drags still move the view until Space is released
   */
  _toolChanged() {
    if (!this.active) return;
    this.drawer.stage.draggable(true);
    this.drawer.$stageContainer.style.cursor = grabCursor;
  }

  /**
   * Back to the tool: drag stopped, stage draggable with the pan tool only (the tool may have changed meanwhile), layers
   * as before, cursor of the tool, change fired when the view moved (view saved)
   */
  stop() {
    const { drawer } = this;
    const { stage, drawLayer, selectionLayer } = drawer;

    if (!this.active) return;
    this.active = false;
    if (stage.isDragging()) stage.stopDrag();
    stage.off('.spacePan');
    stage.draggable(drawer.activeTool === 'pan');
    drawLayer.listening(this.#listening[0]);
    selectionLayer.listening(this.#listening[1]);
    if (drawer.activeWidget) drawer.activeWidget.updateCursor();
    else drawer.$stageContainer.style.cursor = '';
    if (this.#moved) stage.fire('change');
  }
}
