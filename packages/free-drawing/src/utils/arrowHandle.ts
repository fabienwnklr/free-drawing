import type { KonvaEventObject } from 'konva/lib/Node';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Circle } from 'konva/lib/shapes/Circle';
import type { Drawer } from '@/Drawer';
import type { ArrowHandleDrag } from '@/@types/shapes';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { drawerEvents } from '@/constants';
import { elbowDistance, getArrowType, getHandlePoint, maxBend, routeArrow, toVectors } from '@/utils/arrow';
import { getArrowEnds } from '@/utils/binding';
import { updateBoundTexts } from '@/utils/boundText';
import { getElbowPoints, getMiddleSegment, isOnLine } from '@/utils/elbow';

/** Name of the handle of the selected arrow, in the selection layer */
export const arrowHandleName = 'drawer-arrow-handle';

/** Radius of the handle on screen in px, whatever the zoom */
const handleRadius = 6;

/** Distance on screen in px under which the handle snaps to the straight line (curve) or the automatic path (elbow) */
const snapDistance = 8;

/**
 * Handle of a selected curved or elbow arrow, in the selection layer: dragged, it bends the curve on either side
 * (`bend` attribute) or moves the middle segment of the elbow arrow (`elbowMid`), the arrow routed again at once.
 * Shown for one arrow selected alone (with its label) with the selection tool, not locked nor in read only; placed
 * again each time the drawing is drawn (moves, zoom, changes...), not exported
 */
export class ArrowHandle {
  /** Drawer whose selected arrow gets a handle */
  drawer: Drawer;
  /** Handle node, created again once the selection layer is emptied (drawing loaded) */
  #handle: Circle | null = null;
  /** Arrow of the handle */
  #arrow: Arrow | null = null;
  /** Drag of the handle going on */
  #drag: ArrowHandleDrag | null = null;

  /**
   * Handle following the selection and the drawing
   * @param drawer Drawer whose selected arrow gets a handle
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    drawer.on(drawerEvents.selectionChange, () => this.update());
    drawer.drawLayer.on('draw.arrowHandle', () => this.update());
  }

  /**
   * Arrow getting a handle: one curved or elbow arrow selected (with its labels), selection tool, not locked nor read
   * only, not moved nor transformed
   * @returns Selected arrow, null without
   */
  private _getArrow(): Arrow | null {
    const { drawer } = this;
    const select = drawer.getWidget<SelectWidget>('selection');

    if (!select || drawer.readOnly || drawer.activeTool !== 'selection' || select.isLocked()) return null;

    const nodes = select.transformer.nodes();
    const [arrow, ...others] = nodes.filter((node) => node instanceof Arrow);

    if (
      !(arrow instanceof Arrow) ||
      others.length ||
      nodes.some((node) => node !== arrow && node.getAttr('containerId') !== arrow.id()) ||
      getArrowType(arrow) === 'straight' ||
      !arrow.isVisible() ||
      arrow.isDragging() ||
      select.transformer.isTransforming()
    ) {
      return null;
    }
    return arrow;
  }

  /**
   * Handle shown at the middle of the selected arrow (middle point of a curve, middle segment of an elbow arrow), else
   * hidden
   */
  update() {
    const arrow = this._getArrow();
    const point = arrow && getHandlePoint(arrow);

    if (!arrow || !point) {
      this.#arrow = null;
      if (this.#handle?.visible()) {
        this.#handle.visible(false);
        this.drawer.selectionLayer.batchDraw();
      }
      return;
    }

    const handle = this._getHandle();
    const scale = this.drawer.stage.scaleX();

    this.#arrow = arrow;
    // same size on screen whatever the zoom
    handle.setAttrs({ visible: true, scaleX: 1 / scale, scaleY: 1 / scale });
    handle.absolutePosition(arrow.getAbsoluteTransform().point(point));
    handle.moveToTop();
    this.drawer.selectionLayer.batchDraw();
  }

  /**
   * Handle node in the selection layer, created once (again when the selection layer was emptied)
   * @returns Handle
   */
  private _getHandle(): Circle {
    if (this.#handle?.getLayer()) return this.#handle;

    const { drawer } = this;
    const color = drawer.getWidget<SelectWidget>('selection')?.color ?? '#646cff';
    const handle = new Circle({
      name: arrowHandleName,
      radius: handleRadius,
      fill: '#fff',
      stroke: color,
      strokeWidth: 2,
      hitStrokeWidth: 12,
      draggable: true,
    });
    // press on the handle: not on the drawing (no selection rectangle, no panning)
    const stop = (e: KonvaEventObject<Event>) => {
      e.cancelBubble = true;
    };

    handle.on('mousedown touchstart', stop);
    handle.on('mousemove', (e) => {
      // pointer action going on (selection rectangle...): not stopped by the handle
      if (drawer._duringAction()) return;
      stop(e);
      drawer.$stageContainer.style.cursor = this._cursor();
    });
    handle.on('mouseleave', () => {
      if (!handle.isDragging()) drawer.activeWidget?.updateCursor();
    });
    handle.on('dragstart', () => this._startDrag());
    handle.on('dragmove', () => this._drag(handle));
    handle.on('dragend', () => {
      this.#drag = null;
      drawer.activeWidget?.updateCursor();
      drawer.stage.fire('change');
    });
    drawer.selectionLayer.add(handle);
    this.#handle = handle;

    return handle;
  }

  /**
   * Cursor over the handle: along the move of the middle segment of an elbow arrow, else a grab hand
   * @returns Css cursor
   */
  private _cursor(): string {
    const arrow = this.#arrow;

    if (!arrow || getArrowType(arrow) !== 'elbow') return 'grab';

    return getMiddleSegment(toVectors(arrow.points()))?.vertical ? 'ew-resize' : 'ns-resize';
  }

  /**
   * Drag started: axis of the middle segment of an elbow arrow and its place on the automatic path (snapped to)
   */
  private _startDrag() {
    const arrow = this.#arrow;
    const ends = arrow && getArrowEnds(arrow, this.drawer.drawLayer);

    this.#drag = { vertical: false, initial: null };
    if (!arrow || !ends || getArrowType(arrow) !== 'elbow') return;

    const current = getMiddleSegment(toVectors(arrow.points()));
    const automatic = getElbowPoints(ends.start, ends.end, ends.boxes, undefined, elbowDistance(arrow));
    const middle = getMiddleSegment(automatic);
    const vertical = current?.vertical ?? false;

    this.#drag = {
      vertical,
      initial: middle && middle.vertical === vertical ? automatic[middle.index][vertical ? 'x' : 'y'] : null,
    };
  }

  /**
   * Handle dragged: curve bent through it (its distance from the straight line), middle segment of an elbow arrow
   * moved to it, arrow routed again, labels on its middle, shown to collaborators
   * @param handle Dragged handle
   */
  private _drag(handle: Circle) {
    const { drawer } = this;
    const arrow = this.#arrow;
    const drag = this.#drag;
    const layer = drawer.drawLayer;
    const ends = arrow && getArrowEnds(arrow, layer);

    if (!arrow || !drag || !ends) return;

    const point = arrow.getAbsoluteTransform().copy().invert().point(handle.absolutePosition());
    // screen distance in units of the arrow
    const tolerance = snapDistance / Math.abs(arrow.getAbsoluteScale().x || 1);
    const { start, end } = ends;

    if (getArrowType(arrow) === 'curved') {
      const [dx, dy] = [end.x - start.x, end.y - start.y];
      const length = Math.hypot(dx, dy) || 1;
      // distance from the straight line, positive on its left
      const offset = ((point.x - (start.x + end.x) / 2) * dy - (point.y - (start.y + end.y) / 2) * dx) / length;
      const bend = Math.max(-maxBend, Math.min(maxBend, offset / length));

      arrow.setAttr('bend', Math.abs(offset) < tolerance ? 0 : Math.round(bend * 1000) / 1000);
    } else {
      const axis = drag.vertical ? 'x' : 'y';
      const snapped = drag.initial !== null && Math.abs(point[axis] - drag.initial) < tolerance;
      const middle = (start[axis] + end[axis]) / 2;
      // distance from the middle between the ends, automatic near the place of the automatic path
      const offset = snapped ? undefined : Math.round((point[axis] - middle) * 100) / 100;
      const previous = arrow.getAttr('elbowMid');

      arrow.setAttr('elbowMid', offset);
      routeArrow(arrow, start, end, ends.boxes);
      // place in a shape: the segment stays where it was
      if (offset !== undefined && !isOnLine(toVectors(arrow.points()), axis, middle + offset)) {
        arrow.setAttr('elbowMid', previous);
      }
    }
    routeArrow(arrow, start, end, ends.boxes);
    updateBoundTexts(layer, drawer.background.fill() as string);
    drawer.collaboration?.sendLive(drawer.getSelectedShapes());
    this.update();
  }
}
