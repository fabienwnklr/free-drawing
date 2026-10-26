import type { Drawer } from '@/Drawer';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import { clickTolerance, drawerEvents, edgesShapes, fillShapes, shapeName, strokeStyleShapes } from '@/constants';
import { toFill } from '@/utils/color';
import { getCornerRadius, getDash, getStrokeStyle } from '@/utils/stroke';
import { setPressed } from '@/utils/dom';
import type { Arrowheads, ArrowType, ColorLike, Edges, StrokeStyle, TextStyle } from '@/@types/drawer';
import { SelectOverlay } from '@/components/tools/Overlay/SelectOverlay/SelectOverlay';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { Text } from 'konva/lib/shapes/Text';
import type { Group } from 'konva/lib/Group';
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
  isTouchedBy,
  rectTouches,
} from '@/utils/hit';
import {
  type Frame,
  getDrawingShape,
  getFrameShapes,
  isFrame,
  isShapesContainer,
  setFrameSize,
  withFrameShapes,
} from '@/utils/frame';
import type { DrawingShape } from '@/@types/drawer';
import type { SnapStops } from '@/@types/toolbar';
import type { Node } from 'konva/lib/Node';
import { withBoundTexts } from '@/utils/boundText';
import { arrowheadAttrs, getArrowheads } from '@/utils/arrow';
import { rerouteArrow } from '@/utils/binding';

/**
 * Selection tool: selects shapes (click, Shift toggles, Alt selects the one behind, rectangle selects shapes entirely
 * in it), moves and transforms them with its Konva `Transformer` (also used by other components), shows the overlay
 * of selected shapes and applies its options to them. Optional snapping of moves and resizes to other shapes.
 */
export class SelectWidget extends BaseWidget {
  #x1: number = 0;
  #y1: number = 0;
  #x2: number = 0;
  #y2: number = 0;
  /** Resize anchors of the transformer: corners and middles of sides (texts: no top / bottom middle) */
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
  /** Color of transformer box and anchors, and of snapping guides */
  color: ColorLike = 'rgba(152, 158, 255, 1)';
  /** Rectangle drawn by a drag from an empty place: selects shapes entirely in it (selection layer) */
  selectionRectangle: Rect = new Rect();
  /**
   * Konva transformer of selected shapes (box, resize and rotation anchors), in selection layer. Its nodes are the
   * selection. Created with the widget, so other components can use it whatever the active tool.
   */
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
  /** Moves and resizes snap to edges and centers of other shapes, with guides (`snapping` preference) */
  snapping: boolean = false;
  overlay: SelectOverlay;
  // overlay of selected shapes, not of the tool
  protected showOverlayOnActive = false;

  /**
   * Create the selection tool, shortcut S: transformer events (frames resized, texts rewrapped, change fired on
   * transform or drag end), Shift moves along an axis, resize anchors snapped
   * @param drawer Drawer of this widget
   */
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

      // dragged with its shapes: one change once each of them is released
      if (e.type === 'dragend') {
        this.drawer._endDrag(nodes);
        return;
      }
      // resized frames take shapes entirely in them, other shapes in frame containing them
      for (const frame of nodes.filter(isFrame)) this.drawer.fitFrame(frame);
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
      for (const shape of getFrameShapes(frame)) shape.move({ x: -dx, y: -dy });
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

  /**
   * Press selects the shape under pointer (dragged at once) or drags the selection from its box, else starts a
   * selection rectangle; release selects shapes touched by the rectangle, or the shape clicked (`_selectAt`)
   */
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
          // shapes touched by rectangle: drawn inside a big shape or a frame, it selects shapes it touches there, not
          // the big shape (shapes of frames too, with their frame when it touches its box)
          const touched = withFrameShapes(this.drawer.getDrawingShapes()).filter(
            (shape) =>
              shape.isListening() &&
              (isFrame(shape) ? rectTouches(box, shape.getClientRect()) : isTouchedBy(box, shape))
          );
          const nodes = this._getSelected();

          this.select(shiftKey ? [...nodes, ...touched.filter((shape) => !nodes.includes(shape))] : touched);
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
   * @param shapes Drawing shapes or shapes of groups to select, replacing the selection
   */
  select(shapes: (Shape<ShapeConfig> | Group)[]) {
    // shapes with their texts (and texts with their shapes): moved, styled and removed together
    shapes = withBoundTexts(shapes, this.drawer.drawLayer);
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

    if (locked) this.hideOverlay();
    else this.showOverlay(selectable);
    this.drawer.trigger(drawerEvents.selectionChange, selectable);
  }

  /**
   * Selected shapes are locked: selected to be unlocked, not modified
   * @returns True when shapes are selected and none of them listens (locked)
   */
  isLocked(): boolean {
    const nodes = this.transformer.nodes();

    return nodes.length > 0 && nodes.every((node) => !node.isListening());
  }

  /**
   * Shapes (or groups) under a point (absolute position), from top to bottom: drawn there (fill, stroke, text box),
   * then rectangles and ellipses without background around it, smallest first, then locked shapes (or their locked
   * groups) in the same order
   * @param pos Point in view (pointer), absolute position
   * @param hit Shape drawn on top (konva hit of pointer event, or its group), none by default
   * @param deep Shapes of groups instead of groups
   * @returns Visible shapes at the point, the first one is selected by a click
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
   * @param node Node of draw layer (konva hit, part of a frame)
   * @returns Node or group selected by a click on it
   */
  private _getDrawingShape(node: Node): DrawingShape {
    return getDrawingShape(node, this.drawer.drawLayer);
  }

  /**
   * Selected shapes of groups are dragged alone (shapes of groups are moved with their group)
   * @param shapes Selected shapes of groups, draggable while the selection tool is active (previous ones no longer)
   */
  private _setNested(shapes: DrawingShape[]) {
    for (const shape of this.#nested) shape.draggable(false);
    this.#nested = shapes;
    for (const shape of this.#nested) shape.draggable(this.drawer.activeTool === 'selection');
  }

  /**
   * Point (absolute position) in box of selection, rotated with it (dragged from it), not for locked shapes
   * @param pos Point in view (pointer)
   * @returns True when the point is in the transformer box of an unlocked selection
   */
  private _inSelectionBox(pos: Vector2d) {
    const back = this.transformer.findOne<Shape<ShapeConfig>>('.back');

    return this.transformer.nodes().length > 0 && !this.isLocked() && !!back && isInsideOutline(back, pos);
  }

  /**
   * Selected nodes (drawing shapes)
   * @returns Nodes of the transformer
   */
  private _getSelected() {
    return this.transformer.nodes() as (Shape<ShapeConfig> | Group)[];
  }

  /**
   * Click selection: shape under pointer, Shift adds or removes it, Alt selects the one behind selected shape
   * @param pos Point clicked in view (pointer)
   * @param hit Shape pressed (konva hit, or its group), null on empty place
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

  /**
   * New selection rectangle in selection layer, drawing shapes (also of frames) draggable
   */
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
   * Show overlay for selected shapes, text overlay if selection contains only text. Frames have no style: opacity,
   * stacking order and actions only
   * @param nodes Selected shapes (shapes of groups are used) and frames
   */
  showOverlay(nodes: (Shape<ShapeConfig> | Group)[]) {
    const textOverlay = this.drawer.getWidget<TextWidget>('text')?.overlay;
    const frames = nodes.filter(isFrame);
    // shapes of groups
    const shapes = nodes.filter((node) => !isFrame(node)).flatMap(getShapes);
    const isText = (s: Shape<ShapeConfig>) => s.hasName(shapeName.text);
    const onlyText = shapes.length > 0 && !frames.length && shapes.every(isText);
    // a kind of selected shapes the section applies to
    const has = (names: string[]) => shapes.some((s) => names.some((name) => s.hasName(name)));

    if (textOverlay && onlyText) {
      this.overlay.hide();
      textOverlay.show(shapes);
    } else {
      textOverlay?.hide();
      // sections of every kind of selected shape, each one changes the shapes it applies to: dash of outline shapes
      // (not brush lines), background of rectangles and ellipses, corners of rectangles, width of outlines and strokes
      // images: opacity only (no stroke nor color)
      const styled = shapes.filter((s) => !s.hasName(shapeName.image));

      this.overlay.toggleColorBtns(styled.length > 0);
      this.overlay.toggleStyleBtns(has(strokeStyleShapes));
      this.overlay.toggleFillBtns(has(fillShapes));
      this.overlay.toggleEdgesBtns(has(edgesShapes));
      this.overlay.toggleArrowBtns(has([shapeName.arrow]));
      this.overlay.toggleWidthBtns(styled.some((s) => !isText(s) && !s.hasName(shapeName.highlighter)));
      // with texts: their fields, color is also the one of texts
      this.overlay.toggleTextFields(shapes.some(isText));
      this.overlay.setColorTitle(shapes.some(isText) ? 'overlay.color' : 'overlay.stroke');
      // opacity of first shape, else of first frame
      this.overlay.show([...shapes, ...frames]);
    }
  }

  /**
   * Hide overlays of selection (selection overlay and text overlay), selection is kept
   */
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

    if (this.drawer.activeWidget !== this) this.drawer.activeWidget?.showToolOverlay();
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
   * @param shapes Shapes being selected
   * @param locked Shapes are locked: no anchors nor rotation, dashed box
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
    // texts scaled by corners and images keep their proportions (Shift frees them)
    this.transformer.keepRatio(
      shapes.length > 0 && shapes.every((s) => s.hasName(shapeName.text) || s.hasName(shapeName.image))
    );
  }

  /**
   * Selection rectangle being drawn (pointer action in progress)
   * @deprecated use `inAction`
   */
  get isSelecting() {
    return this.inAction;
  }

  /**
   * Press cancelled (two finger gesture): no selection rectangle, nothing selected by its release
   */
  protected onCancel(): void {
    this.#press = null;
    this.selectionRectangle.visible(false);
  }

  /**
   * Select every shape of the drawing (nothing if drawing is empty), focus back on drawer
   */
  selectAll() {
    const allNodes = this.drawer.getDrawingShapes();

    if (!allNodes.length) return;

    this.select(allNodes);
    this.drawer.focus();
  }

  /**
   * Selection rectangle removed, selection cleared, drawing shapes no longer draggable
   */
  protected onDesactive(): void {
    this.selectionRectangle.destroy();
    this.clearSelection();
    for (const d of withFrameShapes(this.drawer.getDrawingShapes())) d.draggable(false);
  }

  /**
   * Turn snapping on: a dragged shape is moved to the nearest guide (edges and centers of other shapes, see
   * `_getLineGuideStops`) closer than 5 px on each axis, guides shown until drag end
   */
  private _initSnapEvents() {
    this.snapping = true;
    // namespaced, grid snapping and change saving also listen drag events of draw layer
    this.drawer.drawLayer.on('dragmove.snap', (e) => {
      // clear all previous lines on the screen
      this._clearGuides();

      // find possible snapping lines (not of shapes moved with it)
      const selected = this._getSelected();
      const moved: Node[] = selected.includes(e.target as DrawingShape) ? selected : [e.target];
      const lineGuideStops = this._getLineGuideStops(moved);
      // edges and centers of the moved shapes together: the gaps between them are kept (each one is dragged by
      // konva and fires this event, the box is already snapped for the next ones)
      const itemBounds = this._getObjectSnappingEdges(moved, e.target);

      // now find where can we snap current object
      const guides = this._getGuides(lineGuideStops, itemBounds);

      // do nothing of no snapping
      if (!guides.length) {
        return;
      }

      this._drawGuides(guides);

      const absPos = e.target.absolutePosition();
      const snapped = { ...absPos };

      for (const lg of guides) {
        if (lg.orientation === 'V') snapped.x = lg.lineGuide + lg.offset;
        else snapped.y = lg.lineGuide + lg.offset;
      }
      // every moved shape by the same distance
      for (const node of moved) {
        const pos = node.absolutePosition();

        node.absolutePosition({ x: pos.x + snapped.x - absPos.x, y: pos.y + snapped.y - absPos.y });
      }
    });

    this.drawer.drawLayer.on('dragend.snap', () => this._clearGuides());
  }

  /**
   * Remove snapping guides of selection layer
   */
  private _clearGuides() {
    for (const l of this.drawer.selectionLayer.find(`.${shapeName.guideLine}`)) l.destroy();
  }

  /**
   * Resize anchor position (absolute): side or corner aligned on edges and centers of other shapes (snapping), else
   * on grid. Not when rotating, nor for a rotated selection
   * @param oldPos Anchor position before this move (absolute)
   * @param newPos Anchor position given by the pointer (absolute)
   * @returns Position of the anchor, snapped or unchanged
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

  /**
   * Turn snapping off: drag listeners of snapping (`.snap`) removed
   */
  private _removeSnapEvents() {
    this.snapping = false;
    this.drawer.drawLayer.off('.snap');
  }

  /**
   * Positions a shape can snap to (absolute): edges and centers of visible drawing shapes, shapes of frames too, and
   * the frame of a moved shape; not the view (infinite drawing), nor moved shapes, their shapes and their groups (moved
   * with them)
   * @param skipShapes Moved shapes, not guides themselves
   * @returns Positions of vertical and horizontal guides
   */
  private _getLineGuideStops(skipShapes: Node[]): SnapStops {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    for (const guideItem of withFrameShapes(this.drawer.getDrawingShapes())) {
      // a frame keeps its box while its shapes move, a group follows them
      const moved = skipShapes.some(
        (shape) =>
          shape === guideItem || shape.isAncestorOf(guideItem) || (!isFrame(guideItem) && guideItem.isAncestorOf(shape))
      );

      if (moved || !guideItem.isVisible()) continue;

      const box = guideItem.getClientRect();

      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    }

    return { vertical, horizontal };
  }

  /**
   * Points of dragged nodes which snap to guides: edges and center of their box on each axis (absolute)
   * @param nodes Nodes moved together (selection), or the node dragged alone
   * @param node Node being dragged, whose position gives the offsets
   * @returns Points of the box on each axis, with the offset to the position of the node
   */
  private _getObjectSnappingEdges(nodes: Node[], node: Node) {
    const boxes = nodes.map((moved) => moved.getClientRect());
    const left = Math.min(...boxes.map(({ x }) => x));
    const top = Math.min(...boxes.map(({ y }) => y));
    const box = {
      x: left,
      y: top,
      width: Math.max(...boxes.map(({ x, width }) => x + width)) - left,
      height: Math.max(...boxes.map(({ y, height }) => y + height)) - top,
    };
    const absPos = node.absolutePosition();

    return {
      /** Left, center and right of node box */
      vertical: [
        {
          /** X of the point */
          guide: Math.round(box.x),
          /** From the point to node position: node position once the point snapped is guide + offset */
          offset: Math.round(absPos.x - box.x),
          /** Point of the box: 'start', 'center' or 'end' */
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
      /** Top, center and bottom of node box */
      horizontal: [
        {
          /** Y of the point */
          guide: Math.round(box.y),
          /** From the point to node position: node position once the point snapped is guide + offset */
          offset: Math.round(absPos.y - box.y),
          /** Point of the box: 'start', 'center' or 'end' */
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

  /**
   * Guides a dragged node snaps to: on each axis, the stop nearest to one of its points, closer than 5 px
   * @param lineGuideStops Positions to snap to, see `_getLineGuideStops`
   * @param itemBounds Points of the node, see `_getObjectSnappingEdges`
   * @returns Vertical guide then horizontal one, if any
   */
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
        /** Position of the guide: x of a vertical one, y of a horizontal one (absolute) */
        lineGuide: minV.lineGuide,
        /** From the snapped point to node position */
        offset: minV.offset,
        /** 'V' (vertical guide, snaps x) or 'H' (horizontal guide, snaps y) */
        orientation: 'V',
        /** Point of the node snapped: 'start', 'center' or 'end' */
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

  /**
   * Draw guides as dashed lines across the view, in selection layer
   * @param guides Guides of `_getGuides`
   */
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
   * @param update Change of one shape, called for each selected shape (shapes of groups, not locked shapes nor frames)
   * @param updateFrame Change of a selected frame (as a whole), frames are not modified without it
   */
  private _updateSelected(update: (shape: Shape<ShapeConfig>) => void, updateFrame?: (frame: Frame) => void) {
    // shapes of groups too, locked shapes are not modified
    const nodes = this.isLocked() ? [] : this.transformer.nodes();
    const shapes = nodes.filter((node) => !isFrame(node)).flatMap(getShapes);
    const frames = updateFrame ? nodes.filter(isFrame) : [];

    if (!shapes.length && !frames.length) return;

    shapes.forEach(update);
    if (updateFrame) frames.forEach(updateFrame);
    this.drawer.stage.fire('change');
  }

  /**
   * Change background color of selected rectangles and ellipses
   * @param color `'transparent'` for none
   */
  setFillColor(color: ColorLike) {
    this._updateSelected((s) => {
      // setAttr: fill(undefined) would be the getter
      if (fillShapes.some((name) => s.hasName(name))) s.setAttr('fill', toFill(color));
    });
  }

  /**
   * Change background color of selected rectangles and ellipses
   * @param color `'transparent'` for none
   * @deprecated use `setFillColor`
   */
  setBgColor(color: ColorLike) {
    this.setFillColor(color);
  }

  /**
   * Path of selected arrows, routed again between their ends (on their linked shapes)
   * @param type 'straight', 'curved' or 'elbow'
   */
  setArrowType(type: ArrowType) {
    this._updateSelected((s) => {
      if (!(s instanceof Arrow)) return;

      // straight without attribute (arrows of previous versions)
      s.setAttr('arrowType', type === 'straight' ? undefined : type);
      rerouteArrow(s, this.drawer.drawLayer);
    });
  }

  /**
   * Heads of selected arrows (given ends only)
   * @param heads Head of the start, of the end
   */
  setArrowheads(heads: Partial<Arrowheads>) {
    this._updateSelected((s) => {
      if (s instanceof Arrow) s.setAttrs(arrowheadAttrs({ ...getArrowheads(s), ...heads }));
    });
  }

  /**
   * Set color for draw
   * @param color Fill and stroke of lines and arrows (fill only of highlights), fill of texts, stroke of other shapes
   */
  setColor(color: ColorLike) {
    this._updateSelected((s) => {
      // images keep their colors
      if (s.hasName(shapeName.image)) return;
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
   * @param width Stroke width of selected shapes (not highlights), dashes and arrow heads follow it
   */
  setStrokeWidth(width: number) {
    this._updateSelected((s) => {
      // width of highlights is their outline, texts and images have no stroke
      if (s.hasName(shapeName.highlighter) || s instanceof Text || s.hasName(shapeName.image)) return;

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
   * @param style Solid, dashed or dotted: dash computed from stroke width of each shape
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
   * @param edges 'sharp', 'round' or corner radius
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
   * @param opacity Opacity of selected shapes, from 0 (transparent) to 1, of frames as a whole (border, title, shapes)
   */
  setOpacity(opacity: number) {
    this._updateSelected(
      (s) => s.opacity(opacity),
      (frame) => frame.opacity(opacity)
    );
  }

  /**
   * Set text style of selected text
   * @param style Text attributes to change (font, size, style, alignment...), width kept or widened for font changes
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

  /**
   * Turn snapping to objects on (grid hidden: one snapping at a time) or off, update context menu button, save
   * preferences and fire change. Use `drawer.setting.toggleSnapping()` to toggle it.
   * @param active Turn snapping on (default) or off
   */
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
