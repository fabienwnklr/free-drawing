import { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Stage } from 'konva/lib/Stage';
import { drawerEvents, edgesShapes, fillShapes, shapeName, strokeStyleShapes } from '@/constants';
import { toFill } from '@/utils/color';
import { getCornerRadius, getDash, getStrokeStyle } from '@/utils/stroke';
import { setPressed } from '@/utils/dom';
import type { ColorLike, Edges, StrokeStyle, TextStyle } from '@/@types/drawer';
import { SelectOverlay } from '@/components/tools/Overlay/SelectOverlay/SelectOverlay';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { Text } from 'konva/lib/shapes/Text';
import { Group } from 'konva/lib/Group';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { arrowPointerSize } from '@/components/toolbar/widgets/Arrow/Arrow';
import type { Vector2d } from 'konva/lib/types';
import {
  getLockedNode,
  getShapes,
  isDrawnAt,
  isDrawnAtLocked,
  isInsideNode,
  isInsideOutline,
  rectContains,
} from '@/utils/hit';
import {
  getDrawingShape,
  getFrameShapes,
  isFrame,
  isShapesContainer,
  setFrameSize,
  withFrameShapes,
} from '@/utils/frame';
import type { DrawingShape } from '@/@types/drawer';
import type { Node } from 'konva/lib/Node';

/** Pointer move under which a press is a click (px) */
const clickTolerance = 3;

export class SelectWidget extends BaseWidget {
  #x1: number = 0;
  #y1: number = 0;
  #x2: number = 0;
  #y2: number = 0;
  defaultAnchors: string[] = [
    'top-left',
    'top-center',
    'top-right',
    'middle-right',
    'middle-left',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];
  color: ColorLike = 'rgba(152, 158, 255, 1)';
  selectionRectangle: Rect = new Rect();
  // In constructor for be usable out of widget
  transformer: Transformer = new Transformer({
    borderStroke: this.color,
    anchorStroke: this.color,
    enabledAnchors: this.defaultAnchors,
    // free resize, proportions kept with Shift (texts: always, see `_setupAnchors`)
    keepRatio: false,
    anchorStyleFunc(anchor) {
      if (anchor.hasName('top-center') || anchor.hasName('bottom-center')) {
        anchor.height(6);
        anchor.offsetY(3);
        anchor.width(30);
        anchor.offsetX(15);
      }
      if (anchor.hasName('middle-left') || anchor.hasName('middle-right')) {
        anchor.height(30);
        anchor.offsetY(15);
        anchor.width(6);
        anchor.offsetX(3);
      }
    },
    anchorCornerRadius: 3,
  });
  // press on transformer anchor (resize, rotate), its release must not change selection
  #pressOnTransformer: boolean = false;
  // press on stage: position, shape pressed, selected at once (dragged with selection), in selection box (dragged),
  // in a group (Ctrl / Cmd)
  #press: {
    pos: Vector2d;
    shape: DrawingShape | null;
    selected: boolean;
    inSelection: boolean;
    deep: boolean;
  } | null = null;
  // selected shapes of groups, dragged alone while selected
  #nested: DrawingShape[] = [];
  /**
   * Snap of resize anchors to grid (set by drawer while grid is shown), applied when anchor is not snapped to objects
   */
  gridAnchorBound: ((oldPos: Vector2d, newPos: Vector2d) => Vector2d) | null = null;
  snapping: boolean = false;
  overlay: SelectOverlay;
  // overlay of selected shapes, not of the tool
  protected showOverlayOnActive = false;

  constructor(drawer: Drawer) {
    super(drawer, 'selection', 'Select', SelectIcon, 's');

    this.transformer.on('transformstart dragstart', () => {
      if (this.drawer.activeTool !== 'selection') {
        this.transformer.stopTransform();
        this.transformer.nodes([]);
        if (this.drawer.debug) {
          this.drawer.toast(this.drawer.t('toast.selectionTool'), 'info');
        }
      }
    });

    this._initShiftEvents();

    // in constructor, not in initEvents, else a listener is added on each activation
    this.transformer.on('transformend dragend', (e) => {
      const nodes = this._getSelected();

      // resized frames take shapes entirely in them, other shapes in frame containing them
      if (e.type === 'transformend') nodes.filter(isFrame).forEach((frame) => this.drawer.fitFrame(frame));
      this.drawer.placeInFrames(nodes);
      this.drawer.stage.fire('change');
    });

    // frames resized, not scaled (title, border), their shapes stay in place
    let framePositions = new Map<Node, Vector2d>();

    this.transformer.on('transformstart', () => {
      framePositions = new Map(
        this._getSelected()
          .filter(isFrame)
          .map((frame) => [frame, frame.position()])
      );
    });
    this.transformer.on('transform', (e) => {
      const frame = e.target;
      const previous = framePositions.get(frame);

      if (!isFrame(frame) || !previous) return;

      const dx = frame.x() - previous.x;
      const dy = frame.y() - previous.y;

      setFrameSize(frame, Math.abs(frame.width() * frame.scaleX()), Math.abs(frame.height() * frame.scaleY()));
      frame.scale({ x: 1, y: 1 });
      getFrameShapes(frame).forEach((shape) => shape.move({ x: -dx, y: -dy }));
      framePositions.set(frame, frame.position());
    });

    // side anchors resize text box (line breaks) instead of stretching text: horizontal stretch becomes width
    this.transformer.on('transform', (e) => {
      const anchor = this.transformer.getActiveAnchor();

      if (!(e.target instanceof Text) || (anchor !== 'middle-left' && anchor !== 'middle-right')) return;

      const text = e.target;
      // keep scale given by corners (same on both axes)
      text.setAttrs({ width: text.width() * (text.scaleX() / text.scaleY()), scaleX: text.scaleY() });
    });

    // text box minimal width, also prevents flip
    this.transformer.boundBoxFunc((_oldBox, newBox) => {
      if (this.transformer.nodes().every((node) => node instanceof Text)) {
        newBox.width = Math.max(30, newBox.width);
      }
      // frames not flipped
      if (this.transformer.nodes().some(isFrame)) {
        newBox.width = Math.max(20, newBox.width);
        newBox.height = Math.max(20, newBox.height);
      }

      return newBox;
    });

    this.drawer.selectionLayer.add(this.transformer);
    this.overlay = new SelectOverlay(drawer);

    // resize anchors snapped to objects, else to grid
    this.transformer.anchorDragBoundFunc((oldPos, newPos) => this._boundAnchor(oldPos, newPos));
    this.transformer.on('transformend.guides', () => this._clearGuides());
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      this.#pressOnTransformer = e.target.getParent() === this.transformer;
      this.#press = null;

      if (e.evt.button === 2 || this.#pressOnTransformer) return;

      const { shiftKey, altKey, ctrlKey, metaKey } = e.evt as MouseEvent;
      // with Ctrl / Cmd, shape of a group instead of the group
      const deep = ctrlKey || metaKey;
      // shape drawn under pointer (konva hit), or its group
      const hit = e.target !== this.drawer.stage && e.target.getLayer() === this.drawer.drawLayer ? e.target : null;
      // parts of frames (border, title) give the frame
      const shape = hit && (deep && !isFrame(hit.getParent()) ? (hit as DrawingShape) : this._getDrawingShape(hit));

      // other nodes of selection layer
      if (!shape && e.target !== this.drawer.stage) return;

      const nodes = this._getSelected();

      this.#press = { pos: this.drawer._getPointerPos(), shape, selected: false, inSelection: false, deep };

      if (shape) {
        // pressed shape selected at once: dragged alone, or with selection with Shift (Alt selects on click)
        if (!nodes.includes(shape) && !altKey) {
          this.select(shiftKey ? [...nodes, shape] : [shape]);
          this.#press.selected = true;
        }
        return;
      }

      // press in selection box out of shapes (inside without background, around lines...): selection dragged
      if (!shiftKey && !altKey && this._inSelectionBox(this.#press.pos)) {
        this.#press.inSelection = true;
        nodes[0].startDrag(e);
        return;
      }

      // press on empty place: selection rectangle
      e.evt.preventDefault();
      const realPos = this.drawer._getRelativePointerPos();
      this.#x1 = realPos.x;
      this.#y1 = realPos.y;
      this.#x2 = realPos.x;
      this.#y2 = realPos.y;

      this.selectionRectangle.width(0);
      this.selectionRectangle.height(0);
      this.startAction();
    });

    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction) {
        // Don't change cursor on anchor or on transforming
        if (e.target.hasName('_anchor') || this.transformer.isTransforming()) return;
        // shape or selection box (dragged from it)
        if (e.target !== this.drawer.stage || this._inSelectionBox(this.drawer._getPointerPos())) {
          this.drawer.$stageContainer.style.cursor = 'move';
          // e.target.setAttrs({ strokeWidth: 2, strokeColor: "red"})
        } else {
          this.drawer.$stageContainer.style.cursor = 'default';
          // e.target.setAttrs({ strokeWidth: 0, strokeColor: "transparant"})
        }
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      const realPos = this.drawer._getRelativePointerPos();
      this.#x2 = realPos.x;
      this.#y2 = realPos.y;
      this.selectionRectangle.setAttrs({
        visible: true,
        x: Math.min(this.#x1, this.#x2),
        y: Math.min(this.#y1, this.#y2),
        width: Math.abs(this.#x2 - this.#x1),
        height: Math.abs(this.#y2 - this.#y1),
      });
    });

    this.onStage('mouseup touchend', (e) => {
      if (e.evt.button === 2) return;

      // end of anchor drag (resize, rotate): pointer may be outside of shapes, selection is kept
      // (konva ends transform before this event, transformer.isTransforming() is already false)
      if (this.#pressOnTransformer) {
        this.#pressOnTransformer = false;
        return;
      }

      const press = this.#press;

      this.#press = null;
      // released without press on stage
      if (!press) return;

      const pos = this.drawer._getPointerPos();
      const moved = Math.hypot(pos.x - press.pos.x, pos.y - press.pos.y) > clickTolerance;
      const { shiftKey, altKey } = e.evt as MouseEvent;

      if (this.inAction) {
        this.endAction();
        e.evt.preventDefault();
        this.selectionRectangle.visible(false);

        if (moved) {
          const box = this.selectionRectangle.getClientRect();
          // shapes entirely in rectangle: a rectangle drawn in a big shape selects small shapes on it, not the big one
          // (shapes of frames too, with their frame when it is in rectangle)
          const inside = withFrameShapes(this.drawer.getDrawingShapes()).filter(
            (shape) => shape.isListening() && rectContains(box, shape.getClientRect())
          );
          const nodes = this._getSelected();

          this.select(shiftKey ? [...nodes, ...inside.filter((shape) => !nodes.includes(shape))] : inside);
        }
      }

      // click (after a drag, selection is kept), unless pressed shape was selected on press
      if (!moved && !press.selected) {
        this._selectAt(pos, press.shape, { shiftKey, altKey, deep: press.deep }, press.inSelection);
      }
      this.$container.focus();
      this.selectionRectangle.setAttrs({
        visible: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
  }

  /**
   * Select shapes (none clears selection): transformer, anchors, selection options instead of options of active tool.
   * Hidden shapes are not selectable, locked ones only without other shapes: selected as a whole (locked group)
   * to be unlocked, not modified (no anchors, options nor move)
   * @param {(Shape<ShapeConfig> | Group)[]} shapes
   */
  select(shapes: (Shape<ShapeConfig> | Group)[]) {
    // shapes of a selected frame are selected with it
    const visible = shapes.filter(
      (shape) => shape.isVisible() && !shapes.some((other) => isFrame(other) && other.isAncestorOf(shape))
    );
    const unlocked = visible.filter((shape) => shape.isListening());
    const selectable = unlocked.length ? unlocked : [...new Set(visible.map(getLockedNode))];
    const locked = !unlocked.length;

    if (!selectable.length) {
      this.clearSelection();
      return;
    }

    this._setupAnchors(selectable, locked);
    this.transformer.nodes(selectable);
    // shapes of groups (not of frames: draggable)
    this._setNested(
      locked ? [] : selectable.filter((shape) => !isShapesContainer(shape.getParent(), this.drawer.drawLayer))
    );
    // overlay of active tool (brush, shapes...) replaced by selection one
    if (this.drawer.activeWidget !== this) this.drawer.activeWidget?.overlay?.hide();

    // frames have no style
    const styled = selectable.filter((shape) => !isFrame(shape));

    if (locked || !styled.length) this.hideOverlay();
    else this.showOverlay(styled);
    this.drawer.trigger(drawerEvents.selectionChange, selectable);
  }

  /**
   * Selected shapes are locked: selected to be unlocked, not modified
   */
  isLocked(): boolean {
    const nodes = this.transformer.nodes();

    return nodes.length > 0 && nodes.every((node) => !node.isListening());
  }

  /**
   * Shapes (or groups) under a point (absolute position), from top to bottom: drawn there (fill, stroke, text box),
   * then rectangles and ellipses without background around it, smallest first, then locked shapes (or their locked
   * groups) in the same order
   * @param {Vector2d} pos
   * @param {DrawingShape | null} hit Shape drawn on top (konva hit of pointer event, or its group), none by default
   * @param {boolean} deep Shapes of groups instead of groups
   */
  getShapesAt(pos: Vector2d, hit: DrawingShape | null = null, deep: boolean = false): DrawingShape[] {
    // shapes of frames above their frame
    const drawing = withFrameShapes(this.drawer.getDrawingShapes());
    const all = (
      deep ? drawing.flatMap((shape): DrawingShape[] => (isFrame(shape) ? [shape] : getShapes(shape))) : drawing
    )
      .filter((shape) => shape.isVisible())
      .reverse();
    const shapes = all.filter((shape) => shape.isListening());
    const locked = all.filter((shape) => !shape.isListening());
    // drawn under hit shape
    const below = hit
      ? shapes.slice(shapes.indexOf(hit) + 1).filter((shape) => shape !== hit && isDrawnAt(shape, pos))
      : [];
    const drawn = hit ? [hit, ...below] : [];
    const lockedDrawn = locked.filter((shape) => isDrawnAtLocked(shape, pos));
    const area = (shape: DrawingShape) => shape.getClientRect().width * shape.getClientRect().height;
    const around = (list: DrawingShape[], exclude: DrawingShape[]) =>
      list.filter((shape) => !exclude.includes(shape) && isInsideNode(shape, pos)).sort((a, b) => area(a) - area(b));

    return [
      ...drawn,
      ...around(shapes, drawn),
      ...new Set([...lockedDrawn, ...around(locked, lockedDrawn)].map(getLockedNode)),
    ];
  }

  /**
   * Drawing shape (or group) of a node of draw layer: the node itself or its top group, in drawing or in a frame
   */
  private _getDrawingShape(node: Node): DrawingShape {
    return getDrawingShape(node, this.drawer.drawLayer);
  }

  /**
   * Selected shapes of groups are dragged alone (shapes of groups are moved with their group)
   */
  private _setNested(shapes: DrawingShape[]) {
    this.#nested.forEach((shape) => shape.draggable(false));
    this.#nested = shapes;
    this.#nested.forEach((shape) => shape.draggable(this.drawer.activeTool === 'selection'));
  }

  /**
   * Point (absolute position) in box of selection, rotated with it (dragged from it), not for locked shapes
   */
  private _inSelectionBox(pos: Vector2d) {
    const back = this.transformer.findOne<Shape<ShapeConfig>>('.back');

    return this.transformer.nodes().length > 0 && !this.isLocked() && !!back && isInsideOutline(back, pos);
  }

  /**
   * Selected nodes (drawing shapes)
   */
  private _getSelected() {
    return this.transformer.nodes() as (Shape<ShapeConfig> | Group)[];
  }

  /**
   * Click selection: shape under pointer, Shift adds or removes it, Alt selects the one behind selected shape
   * @param keep Selection kept without shape under pointer (click in selection box)
   */
  private _selectAt(
    pos: Vector2d,
    hit: DrawingShape | null,
    { shiftKey = false, altKey = false, deep = false } = {},
    keep = false
  ) {
    const shapes = this.getShapesAt(pos, hit, deep);
    const nodes = this._getSelected();
    const current = nodes.length === 1 ? shapes.indexOf(nodes[0]) : -1;
    // behind selected shape, back to top after the last one
    const shape = altKey && current !== -1 ? shapes[(current + 1) % shapes.length] : shapes[0];

    if (!shape && keep) return;

    if (!shiftKey) {
      this.select(shape ? [shape] : []);
    } else if (shape) {
      this.select(nodes.includes(shape) ? nodes.filter((node) => node !== shape) : [...nodes, shape]);
    }
  }

  protected onActive(): void {
    this.selectionRectangle = new Rect({
      fill: 'rgba(152, 158, 255, .2)',
      stroke: 'rgba(152, 158, 255, .8)',
      strokeWidth: 1,
      visible: false,
      name: shapeName.selection,
    });

    this.drawer.selectionLayer.add(this.selectionRectangle);
    // shapes of frames too
    withFrameShapes(this.drawer.getDrawingShapes()).forEach((d) => {
      d.draggable(true);
    });
  }

  /**
   * Show overlay for selected shapes, text overlay if selection contains only text
   * @param {(Shape<ShapeConfig> | Group)[]} shapes
   */
  showOverlay(nodes: (Shape<ShapeConfig> | Group)[]) {
    const textOverlay = this.drawer.getWidget<TextWidget>('text')?.overlay;
    // shapes of groups
    const shapes = nodes.flatMap(getShapes);
    const onlyText = shapes.length > 0 && shapes.every((s) => s.hasName(shapeName.text));

    if (textOverlay && onlyText) {
      this.overlay.hide();
      textOverlay.show(shapes);
    } else {
      textOverlay?.hide();
      // dash only for outline shapes (not brush lines)
      this.overlay.toggleStyleBtns(shapes.every((s) => strokeStyleShapes.some((name) => s.hasName(name))));
      this.overlay.toggleFillBtns(shapes.every((s) => fillShapes.some((name) => s.hasName(name))));
      this.overlay.toggleEdgesBtns(shapes.every((s) => edgesShapes.some((name) => s.hasName(name))));
      this.overlay.show(shapes);
    }
  }

  hideOverlay() {
    this.overlay.hide();
    this.drawer.getWidget<TextWidget>('text')?.overlay.hide();
  }

  /**
   * Unselect shapes and hide selection overlays, overlay of active tool (brush, text...) is shown again
   */
  clearSelection() {
    this.transformer.nodes([]);
    this._setNested([]);
    this.hideOverlay();

    if (this.drawer.activeWidget !== this) this.drawer.activeWidget?.overlay?.show();
    this.drawer.trigger(drawerEvents.selectionChange, []);
  }

  /**
   * Shift while moving: horizontally or vertically (resize: see `keepRatio`, rotation by 15 degrees: konva transformer)
   */
  private _initShiftEvents() {
    this.drawer.drawLayer.on('dragstart.axis', (e) => {
      const start = e.target.absolutePosition();

      // along the axis of the longest move
      e.target.dragBoundFunc((pos, evt?: MouseEvent) => {
        if (!evt?.shiftKey) return pos;

        return Math.abs(pos.x - start.x) > Math.abs(pos.y - start.y)
          ? { x: pos.x, y: start.y }
          : { x: start.x, y: pos.y };
      });
    });
    this.drawer.drawLayer.on('dragend.axis', (e) => {
      e.target.dragBoundFunc(undefined as unknown as (pos: Vector2d) => Vector2d);
    });
  }

  /**
   * Anchors of selected shapes: text has no top / bottom anchors (it would be stretched), its side anchors
   * resize text box and its corners scale it; locked shapes have none (dashed box around their outline)
   * @param {(Shape<ShapeConfig> | Group)[]} shapes
   * @param {boolean} locked
   */
  private _setupAnchors(shapes: (Shape<ShapeConfig> | Group)[], locked: boolean) {
    const onlyText = shapes.length > 0 && shapes.every((s) => s.hasName(shapeName.text));

    this.transformer.enabledAnchors(
      locked
        ? []
        : onlyText
        ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
        : this.defaultAnchors
    );
    // frames are not rotated
    this.transformer.rotateEnabled(!locked && !shapes.some(isFrame));
    this.transformer.borderDash(locked ? [4, 4] : []);
    this.transformer.padding(locked ? 4 : 0);
    // texts scaled by corners keep their proportions
    this.transformer.keepRatio(onlyText);
  }

  /**
   * @deprecated use `inAction`
   */
  get isSelecting() {
    return this.inAction;
  }

  selectAll() {
    const allNodes = this.drawer.getDrawingShapes();

    if (!allNodes.length) return;

    this.select(allNodes);
    this.drawer.focus();
  }

  protected onDesactive(): void {
    this.selectionRectangle.destroy();
    this.clearSelection();
    withFrameShapes(this.drawer.getDrawingShapes()).forEach((d) => d.draggable(false));
  }

  private _initSnapEvents() {
    this.snapping = true;
    // namespaced, grid snapping and change saving also listen drag events of draw layer
    this.drawer.drawLayer.on('dragmove.snap', (e) => {
      // clear all previous lines on the screen
      this._clearGuides();

      // find possible snapping lines (not of shapes moved with it)
      const selected = this._getSelected();
      const moved = selected.includes(e.target as DrawingShape) ? selected : [e.target];
      const lineGuideStops = this._getLineGuideStops(moved);
      // find snapping points of current object
      const itemBounds = this._getObjectSnappingEdges(e.target);

      // now find where can we snap current object
      const guides = this._getGuides(lineGuideStops, itemBounds);

      // do nothing of no snapping
      if (!guides.length) {
        return;
      }

      this._drawGuides(guides);

      const absPos = e.target.absolutePosition();
      // now force object position
      guides.forEach((lg) => {
        switch (lg.snap) {
          case 'start':
          case 'center':
          case 'end': {
            switch (lg.orientation) {
              case 'V': {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case 'H': {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
        }
      });
      e.target.absolutePosition(absPos);
    });

    this.drawer.drawLayer.on('dragend.snap', () => this._clearGuides());
  }

  private _clearGuides() {
    this.drawer.selectionLayer.find(`.${shapeName.guideLine}`).forEach((l) => l.destroy());
  }

  /**
   * Resize anchor position (absolute): side or corner aligned on edges and centers of other shapes (snapping), else
   * on grid. Not when rotating, nor for a rotated selection
   */
  private _boundAnchor(oldPos: Vector2d, newPos: Vector2d): Vector2d {
    const anchor = this.transformer.getActiveAnchor();

    this._clearGuides();
    if (!anchor || anchor === 'rotater') return newPos;

    const rotated = Math.abs(this.transformer.rotation() % 90) > 0.5;

    if (this.snapping && !rotated) {
      const stops = this._getLineGuideStops(this._getSelected());
      // sides move on one axis only
      const nearest = (values: number[], value: number) =>
        values.reduce<number | null>((best, stop) => {
          const diff = Math.abs(stop - value);

          return diff < 5 && (best === null || diff < Math.abs(best - value)) ? stop : best;
        }, null);
      const x = /left|right/.test(anchor) ? nearest(stops.vertical, newPos.x) : null;
      const y = /top|bottom/.test(anchor) ? nearest(stops.horizontal, newPos.y) : null;

      if (x !== null || y !== null) {
        this._drawGuides([
          ...(x !== null ? [{ lineGuide: x, offset: 0, orientation: 'V', snap: 'start' }] : []),
          ...(y !== null ? [{ lineGuide: y, offset: 0, orientation: 'H', snap: 'start' }] : []),
        ]);
        return { x: x ?? newPos.x, y: y ?? newPos.y };
      }
    }

    return this.gridAnchorBound ? this.gridAnchorBound(oldPos, newPos) : newPos;
  }

  private _removeSnapEvents() {
    this.snapping = false;
    this.drawer.drawLayer.off('.snap');
  }

  private _getLineGuideStops(skipShapes: Node[]): { vertical: number[]; horizontal: number[] } {
    // we can snap to stage borders and the center of the stage
    const vertical = [0, this.drawer.stage.width() / 2, this.drawer.stage.width()];
    const horizontal = [0, this.drawer.stage.height() / 2, this.drawer.stage.height()];

    // and we snap over edges and center of each object on the canvas, not of moved ones (or their groups)
    this.drawer.getDrawingShapes().forEach((guideItem) => {
      if (skipShapes.some((shape) => shape === guideItem || guideItem.isAncestorOf(shape))) {
        return;
      }
      const box = guideItem.getClientRect();
      // and we can snap to all edges of shapes
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });
    return {
      vertical,
      horizontal,
    };
  }

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  private _getObjectSnappingEdges(node: Shape<ShapeConfig> | Stage) {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: 'start',
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: 'center',
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: 'end',
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: 'start',
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: 'center',
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: 'end',
        },
      ],
    };
  }

  // find all snapping possibilities
  private _getGuides(
    lineGuideStops: {
      vertical: number[];
      horizontal: number[];
    },
    itemBounds: {
      vertical: {
        guide: number;
        offset: number;
        snap: string;
      }[];
      horizontal: {
        guide: number;
        offset: number;
        snap: string;
      }[];
    }
  ) {
    const resultV: {
      lineGuide: number;
      offset: number;
      diff: number;
      snap: string;
    }[] = [];
    const resultH: {
      lineGuide: number;
      offset: number;
      diff: number;
      snap: string;
    }[] = [];
    const GUIDELINE_OFFSET = 5;
    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    const guides = [];

    // find closest snap (local arrays, sort in place instead of toSorted not supported by older browsers)
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: 'V',
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: 'H',
        snap: minH.snap,
      });
    }
    return guides;
  }

  private _drawGuides(
    guides: {
      lineGuide: number;
      offset: number;
      orientation: string;
      snap: string;
    }[]
  ) {
    guides.forEach((lg) => {
      if (lg.orientation === 'H') {
        const line = new Line({
          points: [-6000, 0, 6000, 0],
          stroke: this.color,
          strokeWidth: 1,
          name: shapeName.guideLine,
          dash: [4, 6],
        });
        this.drawer.selectionLayer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
      } else if (lg.orientation === 'V') {
        const line = new Line({
          points: [0, -6000, 0, 6000],
          stroke: this.color,
          strokeWidth: 1,
          name: shapeName.guideLine,
          dash: [4, 6],
        });
        this.drawer.selectionLayer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
      }
    });
  }

  /**
   * Apply update on each selected shape, then fire change once
   * @param update
   */
  private _updateSelected(update: (shape: Shape<ShapeConfig>) => void) {
    // shapes of groups too, locked shapes and frames are not modified
    const shapes = this.isLocked()
      ? []
      : this.transformer
          .nodes()
          .filter((node) => !isFrame(node))
          .flatMap(getShapes);

    if (!shapes.length) return;

    shapes.forEach(update);
    this.drawer.stage.fire('change');
  }

  /**
   * Change background color of selected rectangles and ellipses
   * @param {ColorLike} color `'transparent'` for none
   */
  setFillColor(color: ColorLike) {
    this._updateSelected((s) => {
      // setAttr: fill(undefined) would be the getter
      if (fillShapes.some((name) => s.hasName(name))) s.setAttr('fill', toFill(color));
    });
  }

  /**
   * @deprecated use `setFillColor`
   */
  setBgColor(color: ColorLike) {
    this.setFillColor(color);
  }

  /**
   * Set color for draw
   * @param {ColorLike} color
   */
  setColor(color: ColorLike) {
    this._updateSelected((s) => {
      // line need to be filled, highlights have no stroke (darker, multiplied)
      if (s instanceof Line) {
        s.fill(color);
        if (!s.hasName(shapeName.highlighter)) s.stroke(color);
      } else if (s instanceof Text) {
        s.fill(color);
      } else {
        s.stroke(color);
      }
    });
  }

  /**
   * Set stroke width for draw
   * @param {Number} width
   */
  setStrokeWidth(width: number) {
    this._updateSelected((s) => {
      // width of highlights is their outline
      if (s.hasName(shapeName.highlighter)) return;

      s.strokeWidth(width);

      // dashes and dots follow stroke width
      if (s.dash()?.length) s.dash(getDash(getStrokeStyle(s.dash()), width) as number[]);

      // head size follows stroke width
      if (s instanceof Arrow) {
        s.pointerLength(arrowPointerSize(width));
        s.pointerWidth(arrowPointerSize(width));
      }
    });
  }

  /**
   * Set stroke style of selected outline shapes (not brush lines, which are filled outlines)
   * @param {StrokeStyle} style
   */
  setStrokeStyle(style: StrokeStyle) {
    this._updateSelected((s) => {
      // setAttrs: dash(undefined) would be the getter, round caps as drawn shapes (previous versions: butt)
      if (strokeStyleShapes.some((name) => s.hasName(name))) {
        s.setAttrs({ dash: getDash(style, s.strokeWidth()), lineCap: 'round' });
      }
    });
  }

  /**
   * Set corners of selected rectangles: sharp, round (radius from their size) or radius
   * @param {Edges} edges
   */
  setEdges(edges: Edges) {
    this._updateSelected((s) => {
      if (edgesShapes.some((name) => s.hasName(name))) {
        s.setAttr('cornerRadius', getCornerRadius(s.width(), s.height(), edges));
      }
    });
  }

  /**
   * Set opacity of shape 0 to 1
   * @param opacity
   */
  setOpacity(opacity: number) {
    this._updateSelected((s) => s.opacity(opacity));
  }

  /**
   * Set text style of selected text
   * @param {Partial<TextStyle>} style
   */
  setTextStyle(style: Partial<TextStyle>) {
    // font metrics change: width is updated to keep the same line breaks
    const resize = 'fontFamily' in style || 'fontSize' in style || 'fontStyle' in style;

    this._updateSelected((text) => {
      if (!(text instanceof Text)) return;

      const lines = text.textArr.map((l) => l.text);
      // box width given by user (side anchors) is kept, scaled with font size
      const width = text.width() * (style.fontSize ? style.fontSize / text.fontSize() : 1);

      text.setAttrs(style);

      if (resize) {
        // widened if lines are wider with new font (empty text has no line to measure)
        const linesWidth = text.text() ? Math.max(...lines.map((l) => text.measureSize(l).width)) : 0;
        text.width(Math.max(Math.round(width), Math.ceil(linesWidth) + text.padding() * 2));
      }
    });

    this.transformer.forceUpdate();
  }

  toggleSnapping(active: boolean = true) {
    if (active && !this.snapping) {
      if (this.drawer.grid) this.drawer.hideGrid();
      setPressed(this.drawer.contextMenu.$snappingBtn, true);
      this._initSnapEvents();
    } else if (!active && this.snapping) {
      this._removeSnapEvents();
      setPressed(this.drawer.contextMenu.$snappingBtn, false);
    }
    this.drawer._preferencesChanged();
    this.drawer.stage.fire('change');
  }
}
