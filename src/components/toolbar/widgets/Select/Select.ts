import { Drawer } from '@/Drawer';
import { BaseWidget } from '../BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Stage } from 'konva/lib/Stage';
import { fillShapes, shapeName, strokeStyleShapes } from '@/constants';
import { toFill } from '@/utils/color';
import { getDash, getStrokeStyle } from '@/utils/stroke';
import { setPressed } from '@/utils/dom';
import type { ColorLike, StrokeStyle, TextStyle } from '@/@types/drawer';
import { SelectOverlay } from '@/components/tools/Overlay/SelectOverlay/SelectOverlay';
import type { TextWidget } from '../Text/Text';
import { Text } from 'konva/lib/shapes/Text';
import { Group } from 'konva/lib/Group';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { arrowPointerSize } from '../Arrow/Arrow';
import type { Vector2d } from 'konva/lib/types';
import { isInsideOutline, rectContains } from '@/utils/hit';

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
    keepRatio: true,
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
  // press on stage: position, shape pressed, selected at once (dragged with selection), in selection box (dragged)
  #press: { pos: Vector2d; shape: Shape<ShapeConfig> | null; selected: boolean; inSelection: boolean } | null = null;
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
          this.drawer.toast('You need to use "selection" tool.', 'info');
        }
      }
    });

    // in constructor, not in initEvents, else a listener is added on each activation
    this.transformer.on('transformend dragend', () => {
      this.drawer.stage.fire('change');
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

      return newBox;
    });

    this.drawer.selectionLayer.add(this.transformer);
    this.overlay = new SelectOverlay(drawer);
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      this.#pressOnTransformer = e.target.getParent() === this.transformer;
      this.#press = null;

      if (e.evt.button === 2 || this.#pressOnTransformer) return;

      const { shiftKey, altKey } = e.evt as MouseEvent;
      // shape drawn under pointer (konva hit)
      const shape =
        e.target !== this.drawer.stage && e.target.getLayer() === this.drawer.drawLayer
          ? (e.target as Shape<ShapeConfig>)
          : null;

      // other nodes of selection layer
      if (!shape && e.target !== this.drawer.stage) return;

      const nodes = this._getSelected();

      this.#press = { pos: this.drawer._getPointerPos(), shape, selected: false, inSelection: false };

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
          const inside = this.drawer
            .getDrawingShapes()
            .filter((shape) => shape.listening() && rectContains(box, shape.getClientRect()));
          const nodes = this._getSelected();

          this.select(shiftKey ? [...nodes, ...inside.filter((shape) => !nodes.includes(shape))] : inside);
        }
      }

      // click (after a drag, selection is kept), unless pressed shape was selected on press
      if (!moved && !press.selected) this._selectAt(pos, press.shape, { shiftKey, altKey }, press.inSelection);
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
   * Select shapes (none clears selection): transformer, anchors, selection options instead of options of active tool
   * @param {(Shape<ShapeConfig> | Group)[]} shapes
   */
  select(shapes: (Shape<ShapeConfig> | Group)[]) {
    // locked and hidden shapes are not selectable
    const selectable = shapes.filter((shape) => shape.listening() && shape.isVisible());

    if (!selectable.length) {
      this.clearSelection();
      return;
    }

    this._setupAnchors(selectable);
    this.transformer.nodes(selectable);
    // overlay of active tool (brush, shapes...) replaced by selection one
    if (this.drawer.activeWidget !== this) this.drawer.activeWidget?.overlay?.hide();
    this.showOverlay(selectable);
    this.drawer.trigger('fd.selection.change', selectable);
  }

  /**
   * Shapes under a point (absolute position), from top to bottom: drawn there (fill, stroke, text box), then
   * rectangles and ellipses without background around it, smallest first
   * @param {Vector2d} pos
   * @param {Shape<ShapeConfig> | null} hit Shape drawn on top (konva hit of pointer event), none by default
   */
  getShapesAt(pos: Vector2d, hit: Shape<ShapeConfig> | null = null): Shape<ShapeConfig>[] {
    const shapes = this.drawer
      .getDrawingShapes()
      .filter((shape) => shape.listening() && shape.isVisible())
      .reverse();
    // drawn under hit shape
    const below = hit
      ? shapes.slice(shapes.indexOf(hit) + 1).filter((shape) => shape !== hit && shape.intersects(pos))
      : [];
    const drawn = hit ? [hit, ...below] : [];
    const area = (shape: Shape<ShapeConfig>) => shape.getClientRect().width * shape.getClientRect().height;
    const around = shapes
      .filter((shape) => !drawn.includes(shape) && fillShapes.some((name) => shape.hasName(name)))
      .filter((shape) => isInsideOutline(shape, pos))
      .sort((a, b) => area(a) - area(b));

    return [...drawn, ...around];
  }

  /**
   * Point (absolute position) in box of selection, rotated with it
   */
  private _inSelectionBox(pos: Vector2d) {
    const back = this.transformer.findOne<Shape<ShapeConfig>>('.back');

    return this.transformer.nodes().length > 0 && !!back && isInsideOutline(back, pos);
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
    hit: Shape<ShapeConfig> | null,
    { shiftKey = false, altKey = false } = {},
    keep = false
  ) {
    const shapes = this.getShapesAt(pos, hit);
    const nodes = this._getSelected();
    const current = nodes.length === 1 ? shapes.indexOf(nodes[0] as Shape<ShapeConfig>) : -1;
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
    const shapes = this.drawer.getDrawingShapes();

    shapes.forEach((d) => {
      d.draggable(true);
    });
  }

  /**
   * Show overlay for selected shapes, text overlay if selection contains only text
   * @param {(Shape<ShapeConfig> | Group)[]} shapes
   */
  showOverlay(shapes: (Shape<ShapeConfig> | Group)[]) {
    const textOverlay = this.drawer.getWidget<TextWidget>('text')?.overlay;
    const onlyText = shapes.length > 0 && shapes.every((s) => s.hasName(shapeName.text));

    if (textOverlay && onlyText) {
      this.overlay.hide();
      textOverlay.show(shapes);
    } else {
      textOverlay?.hide();
      // dash only for outline shapes (not brush lines)
      this.overlay.toggleStyleBtns(shapes.every((s) => strokeStyleShapes.some((name) => s.hasName(name))));
      this.overlay.toggleFillBtns(shapes.every((s) => fillShapes.some((name) => s.hasName(name))));
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
    this.hideOverlay();

    if (this.drawer.activeWidget !== this) this.drawer.activeWidget?.overlay?.show();
    this.drawer.trigger('fd.selection.change', []);
  }

  /**
   * Anchors of selected shapes: text has no top / bottom anchors (it would be stretched), its side anchors
   * resize text box and its corners scale it
   * @param {(Shape<ShapeConfig> | Group)[]} shapes
   */
  private _setupAnchors(shapes: (Shape<ShapeConfig> | Group)[]) {
    const onlyText = shapes.length > 0 && shapes.every((s) => s.hasName(shapeName.text));

    this.transformer.enabledAnchors(
      onlyText
        ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
        : this.defaultAnchors
    );
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
    this.drawer.getDrawingShapes().forEach((d) => d.draggable(false));
  }

  private _initSnapEvents() {
    this.snapping = true;
    // namespaced, grid snapping and change saving also listen drag events of draw layer
    this.drawer.drawLayer.on('dragmove.snap', (e) => {
      // clear all previous lines on the screen
      this.drawer.selectionLayer.find(`.${shapeName.guideLine}`).forEach((l) => l.destroy());

      // find possible snapping lines
      const lineGuideStops = this._getLineGuideStops(e.target);
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

    this.drawer.drawLayer.on('dragend.snap', () => {
      // clear all previous lines on the screen
      this.drawer.selectionLayer.find(`.${shapeName.guideLine}`).forEach((l) => l.destroy());
    });
  }

  private _removeSnapEvents() {
    this.snapping = false;
    this.drawer.drawLayer.off('.snap');
  }

  private _getLineGuideStops(skipShape: Shape<ShapeConfig> | Stage): { vertical: number[]; horizontal: number[] } {
    // we can snap to stage borders and the center of the stage
    const vertical = [0, this.drawer.stage.width() / 2, this.drawer.stage.width()];
    const horizontal = [0, this.drawer.stage.height() / 2, this.drawer.stage.height()];

    // and we snap over edges and center of each object on the canvas
    this.drawer.getDrawingShapes().forEach((guideItem) => {
      if (guideItem === skipShape) {
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
    const shapes = this.transformer.nodes().filter((s): s is Shape<ShapeConfig> => s instanceof Shape);

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
      // line need to be filled
      if (s instanceof Line) {
        s.fill(color);
        s.stroke(color);
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
    this.drawer.stage.fire('change');
  }
}
