import ArrowIcon from '@/icons/arrow.svg?raw';
import { Drawer } from '@/Drawer';
import { shapeName } from '@/constants';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Rect } from 'konva/lib/shapes/Rect';
import { Circle } from 'konva/lib/shapes/Circle';
import { Group } from 'konva/lib/Group';
import type { Vector2d } from 'konva/lib/types';
import { ShapeWidget, snapAngle } from '@/components/toolbar/widgets/ShapeWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { type BoundEnd, anchors, findBindingTarget, getAnchorAt, getAnchorPoints, getBoundEnds } from '@/utils/binding';
import { withFrameShapes } from '@/utils/frame';

/**
 * Arrow head size, proportional to stroke width
 * @param {number} strokeWidth
 */
export const arrowPointerSize = (strokeWidth: number) => strokeWidth * 2 + 8;

/** Distance from middle of a side (screen px) under which an arrow end is fixed to it */
const anchorTolerance = 14;

/**
 * Arrow tool: ends near a shape are linked to it (follow it): fixed to a side when near its middle (shown points),
 * else on its outline aiming at the other end. Not linked with Ctrl / Cmd
 */
export class ArrowWidget extends ShapeWidget<Arrow> {
  /** Shape at drawing start */
  #start: BoundEnd | null = null;
  /** Shapes linked while drawing (or under pointer), highlighted with their sides */
  #highlights: Group[] = [];

  constructor(drawer: Drawer) {
    super(drawer, 'arrow', 'Arrow', ArrowIcon, 'a');
  }

  protected initEvents(): void {
    super.initEvents();

    // sides of shape under pointer, before drawing
    this.onStage('mousemove', () => {
      if (!this.inAction) this._highlight([this._findEnd(this.drawer._getRelativePointerPos())]);
    });
    this.onStage('mouseleave', () => {
      if (!this.inAction) this._highlight([]);
    });
  }

  protected createShape(start: Vector2d) {
    const style = this.shapeStyle;
    const pointerSize = arrowPointerSize(style.strokeWidth);

    this.#start = this._findEnd(start);

    return new Arrow({
      ...style,
      // filled head
      fill: style.stroke,
      points: [start.x, start.y, start.x, start.y],
      pointerLength: pointerSize,
      pointerWidth: pointerSize,
      lineCap: 'round',
      lineJoin: 'round',
      name: shapeName.arrow,
    });
  }

  protected updateShape(arrow: Arrow, start: Vector2d, end: Vector2d, constrain: boolean) {
    const free = constrain ? snapAngle(start, end) : end;
    const endBound = this._findEnd(end, arrow);
    // not linked inside a single shape
    const single = !!endBound && endBound.shape === this.#start?.shape;
    const startBound = single ? null : this._unlinked() ? null : this.#start;
    const linkedEnd = single ? null : endBound;
    const ends = getBoundEnds(this.drawer.drawLayer, startBound ?? start, linkedEnd ?? free) ?? { start, end: free };

    arrow.setAttrs({
      points: [ends.start.x, ends.start.y, ends.end.x, ends.end.y],
      startBinding: startBound?.shape.id(),
      startAnchor: startBound?.anchor,
      endBinding: linkedEnd?.shape.id(),
      endAnchor: linkedEnd?.anchor,
    });
    this._highlight([startBound, linkedEnd]);
  }

  protected onDrawEnd() {
    this.#start = null;
    this._highlight([]);
  }

  protected onDesactive() {
    this.onDrawEnd();
  }

  /**
   * Links disabled with Ctrl / Cmd
   */
  private _unlinked() {
    return !!(this.pointerEvent?.ctrlKey || this.pointerEvent?.metaKey);
  }

  /**
   * Arrow end at a point: linked to the shape there, at the side whose middle is near
   */
  private _findEnd(point: Vector2d, exclude?: Arrow): BoundEnd | null {
    // shapes of frames too (smallest one: not their frame)
    const shapes = withFrameShapes(this.drawer.getDrawingShapes());
    const shape = this._unlinked() ? null : findBindingTarget(shapes, point, exclude);
    const tolerance = anchorTolerance / this.drawer.getZoomLevel();

    return shape && { shape, anchor: getAnchorAt(shape, this.drawer.drawLayer, point, tolerance) };
  }

  /**
   * Frame around linked shapes and middle of their sides (fixed side filled)
   */
  private _highlight(ends: (BoundEnd | null)[]) {
    const layer = this.drawer.drawLayer;
    // same size on screen whatever zoom
    const unit = 1 / this.drawer.getZoomLevel();
    const color = this.drawer.getWidget<SelectWidget>('selection')?.color ?? '#646cff';

    this.#highlights.forEach((highlight) => highlight.destroy());
    this.#highlights = ends
      .filter((end): end is BoundEnd => !!end)
      .map(({ shape, anchor }) => {
        const { x, y, width, height } = shape.getClientRect({ relativeTo: layer });
        const points = getAnchorPoints(shape, layer);
        const highlight = new Group({ listening: false });

        highlight.add(
          new Rect({
            x: x - 4 * unit,
            y: y - 4 * unit,
            width: width + 8 * unit,
            height: height + 8 * unit,
            stroke: color,
            strokeWidth: 2 * unit,
            cornerRadius: 4 * unit,
            name: 'binding-highlight',
          }),
          ...anchors.map(
            (side) =>
              new Circle({
                ...points[side],
                radius: (side === anchor ? 5 : 4) * unit,
                fill: side === anchor ? color : '#fff',
                stroke: color,
                strokeWidth: 1.5 * unit,
                name: side === anchor ? 'binding-anchor active' : 'binding-anchor',
              })
          )
        );
        this.drawer.selectionLayer.add(highlight);
        return highlight;
      });
  }
}
