import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import BrushIcon from '@/icons/brush.svg?raw';
import { Line } from 'konva/lib/shapes/Line';
import { SelectWidget } from '../Select/Select';

export class BrushWidget extends BaseWidget {
  #lastLine: Line = new Line();
  isPaint: boolean = false;
  #allPoints: { x: number; y: number }[] = [];
  constructor(protected drawer: Drawer) {
    const $BrushIcon = stringToNode<SVGElement>(BrushIcon);
    super(drawer, 'brush', 'Brush', $BrushIcon);
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
  }

  protected onDesactive(): void {
    this.removeEvents();
  }

  protected initEvents(): void {
    this.drawer.stage.on('mousedown touchstart', (e) => {
      if (e.evt.button === 2) return;
      e.evt.preventDefault();

      this.isPaint = true;
      this.drawer.UIPointerEvents('none');

      const realPos = this.drawer._getRelativePointerPos();
      this.#lastLine = new Line({
        stroke: this.drawer.options.strokeColor,
        strokeWidth: this.drawer.options.strokeWidth,
        hitStrokeWidth: 20,
        globalCompositeOperation: 'source-over',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [realPos.x, realPos.y, realPos.x, realPos.y],
        name: 'line',
      });

      this.#lastLine.on('dragend', () => {
        this.drawer.stage.fire('change');
      });

      // this.#lastLine.on('mouseover', (e) => {
      //   if (!this.isPaint && this.drawer.activeTool === "selection") {
      //     if (e.target instanceof Line) {
      //       e.target.stroke('blue');
      //       e.target.strokeWidth(8);
      //     }
      //   }
      // });

      // this.#lastLine.on('mouseout', (e) => {
      //   if (!this.isPaint && this.drawer.activeTool === "selection") {
      //     if (e.target instanceof Line) {
      //       e.target.stroke(this.drawer.options.strokeColor);
      //       e.target.strokeWidth(this.drawer.options.strokeWidth);
      //     }
      //   }
      // });
      this.drawer.layer.add(this.#lastLine);
    });

    // and core function - drawing
    this.drawer.stage.on('mousemove touchmove', (e) => {
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      if (!this.isPaint) return;

      const realPos = this.drawer._getRelativePointerPos();
      this.#allPoints.push(realPos);
      const simplePoints = this._simplify(this.#allPoints, 0.1, false);

      const newPoints = simplePoints.reduce((arr: number[], p) => arr.concat([p.x, p.y]), []);
      this.#lastLine?.points(newPoints);
      this.drawer.layer.batchDraw();
    });

    this.drawer.stage.on('mouseup touchend', (e) => {
      this.isPaint = false;
      this.drawer.UIPointerEvents('all');
      this.#allPoints = [];

      this.drawer.stage.fire('change');

      const selectWidget = this.drawer.toolbar.widgets.get('selection') as SelectWidget;
      if (selectWidget) {
        const zIndex = this.#lastLine.zIndex() + 1;
        selectWidget.transformer.zIndex(zIndex);
        selectWidget.transformer.nodes([]);
      }

      e.evt.preventDefault();
    });
  }

  protected removeEvents(): void {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }

  private _getSqDist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const dx = p1.x - p2.x,
      dy = p1.y - p2.y;

    return dx * dx + dy * dy;
  }

  // square distance from a point to a segment
  private _getSqSegDist(p: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
    let x = p1.x,
      y = p1.y,
      dx = p2.x - x,
      dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
  }
  // rest of the code doesn't care about point format

  // basic distance-based simplification
  private _simplifyRadialDist(points: { x: number; y: number }[], sqTolerance: number) {
    let prevPoint = points[0],
      point;
    const newPoints = [prevPoint];

    for (let i = 1, len = points.length; i < len; i++) {
      point = points[i];

      if (this._getSqDist(point, prevPoint) > sqTolerance) {
        newPoints.push(point);
        prevPoint = point;
      }
    }

    if (prevPoint !== point && point) {
      newPoints.push(point);
    }

    return newPoints;
  }

  // simplification using optimized Douglas-Peucker algorithm with recursion elimination
  private _simplifyDouglasPeucker(points: { x: number; y: number }[], sqTolerance: number) {
    const len = points.length,
      stack = [],
      newPoints = [],
      MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
      markers = new MarkerArray(len);

    let i,
      maxSqDist,
      sqDist,
      index = 0,
      first = 0,
      last = len - 1;

    markers[first] = markers[last] = 1;

    while (last) {
      maxSqDist = 0;

      for (i = first + 1; i < last; i++) {
        sqDist = this._getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (maxSqDist > sqTolerance) {
        markers[index] = 1;
        stack.push(first, index, index, last);
      }

      last = stack.pop() ?? 0;
      first = stack.pop() ?? 0;
    }

    for (i = 0; i < len; i++) {
      if (markers[i]) {
        newPoints.push(points[i]);
      }
    }

    return newPoints;
  }

  // both algorithms combined for awesome performance
  private _simplify(points: { x: number; y: number }[], tolerance: number, highestQuality: boolean) {
    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : this._simplifyRadialDist(points, sqTolerance);
    points = this._simplifyDouglasPeucker(points, sqTolerance);

    return points;
  }

  updateCursor() {
    this.drawer.$stageContainer.style.cursor = `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='color: black;'><defs><filter id='shadow' y='-40%' x='-40%' width='180px' height='180%' color-interpolation-filters='sRGB'><feDropShadow dx='1' dy='1' stdDeviation='1.2' flood-opacity='.5'/></filter></defs><g fill='none' transform='rotate(0 16 16)' filter='url(%23shadow)'><path d='m25 16h-6.01v-6h-2.98v6h-6.01v3h6.01v6h2.98v-6h6.01z' fill='white'/><path d='m23.9902 17.0103h-6v-6.01h-.98v6.01h-6v.98h6v6.01h.98v-6.01h6z' fill='%23231f1f'/></g></svg>") 16 16, crosshair`;
  }
}