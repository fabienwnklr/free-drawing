import { DD } from 'konva/lib/DragAndDrop';
import type { Drawer } from '@/Drawer';
import type { TouchGestureStart } from '@/@types/utils';
import { zoomLimits } from '@/constants';

/**
 * Two finger gestures on the canvas of a drawer: pinching zooms around the fingers (`zoom` option), moving them moves
 * the view (also in read only). Only fingers on the canvas count (`targetTouches`): a finger resting on the toolbar
 * starts no gesture. The second finger cancels the pointer action of the first one (`BaseWidget.cancelAction`: shape or
 * stroke being drawn removed, erasing, selecting or laser stopped, drags stopped); tools ignore touches until every
 * finger is lifted (`active`).
 * Listened after konva on its canvas: konva and the tools see each touch first.
 */
export class TouchGestures {
  /** Gesture in progress, until every finger is lifted: tools ignore touches meanwhile */
  active = false;
  /** Fingers and view when the gesture started or its fingers changed, null with one finger left */
  #start: TouchGestureStart | null = null;
  /** Drawer whose view is moved */
  private readonly drawer: Drawer;

  /**
   * Listen to touches of the canvas of the drawer (removed with it: `signal`)
   * @param drawer Drawer whose view is zoomed and moved
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    const $canvas = drawer.stage.content;
    // not passive: no zoom of the page by the browser
    const options = { passive: false, signal: drawer.signal };

    $canvas.addEventListener('touchstart', (e) => this._onTouch(e), options);
    $canvas.addEventListener('touchmove', (e) => this._onMove(e), options);
    $canvas.addEventListener('touchend', (e) => this._onEnd(e), options);
    $canvas.addEventListener('touchcancel', (e) => this._onEnd(e), options);
  }

  /**
   * Second finger: gesture started (action of the first finger cancelled), or followed from the fingers now on it
   * @param e Touch start on the canvas
   */
  private _onTouch(e: TouchEvent) {
    if (e.targetTouches.length < 2) return;
    e.preventDefault();

    if (!this.active) {
      const { stage } = this.drawer;

      this.active = true;
      this.drawer.activeWidget?.cancelAction();
      // shape or view dragged by the first finger (or started by the second one)
      for (const { node } of DD._dragElements.values()) if (node.getStage() === stage) node.stopDrag();
    }
    this.#start = this._read(e);
  }

  /**
   * Fingers moved: zoom from their distance (`zoom` option), the point of the drawing under them stays under them
   * @param e Touch move on the canvas
   */
  private _onMove(e: TouchEvent) {
    if (!this.active) return;
    e.preventDefault();
    if (!this.#start || e.targetTouches.length < 2) return;

    const { stage } = this.drawer;
    const { distance, center } = this._read(e);
    const start = this.#start;
    // `zoom` option off: fingers move the view only
    const scale = this.drawer.options.zoom
      ? Math.min(Math.max((start.scale * distance) / start.distance, zoomLimits.min), zoomLimits.max)
      : start.scale;
    // point of the drawing under the fingers when the gesture started
    const point = {
      x: (start.center.x - start.position.x) / start.scale,
      y: (start.center.y - start.position.y) / start.scale,
    };

    stage.scale({ x: scale, y: scale });
    stage.position({ x: center.x - point.x * scale, y: center.y - point.y * scale });
    if (this.drawer.zoom) this.drawer.zoom.update();
    else this.drawer._update();
  }

  /**
   * Finger lifted: gesture followed from the fingers left, ended once every finger is lifted
   * @param e Touch end or cancel on the canvas
   */
  private _onEnd(e: TouchEvent) {
    if (!this.active) return;

    this.#start = e.targetTouches.length >= 2 ? this._read(e) : null;
    if (!e.targetTouches.length) this.active = false;
  }

  /**
   * Two first fingers on the canvas and the view now
   * @param e Touch event with two fingers on the canvas at least
   * @returns Distance and middle of the fingers in the canvas, zoom and position of the view
   */
  private _read(e: TouchEvent): TouchGestureStart {
    const { stage } = this.drawer;
    const box = stage.content.getBoundingClientRect();
    const [a, b] = [e.targetTouches[0], e.targetTouches[1]];

    return {
      distance: Math.max(1, Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)),
      center: { x: (a.clientX + b.clientX) / 2 - box.left, y: (a.clientY + b.clientY) / 2 - box.top },
      scale: this.drawer.getZoomLevel(),
      position: stage.position(),
    };
  }
}
