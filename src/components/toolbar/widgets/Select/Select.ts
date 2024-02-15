import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import { Util } from 'konva/lib/Util';
import { NodeConfig } from 'konva/lib/Node';
import { Context } from 'konva/lib/Context';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Stage } from 'konva/lib/Stage';
import { shapeName } from '@/constants';
import type { ColorLike } from '@/@types/drawer';
import { SelectOverlay } from '@/components/tools/Overlay/SelectOverlay/SelectOverlay';
import { BrushWidget } from '../Brush/Brush';
import { Text } from 'konva/lib/shapes/Text';

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
  isSelecting: boolean = false;
  snapping: boolean = false;
  overlay: SelectOverlay;

  constructor(protected drawer: Drawer) {
    const $SelectIcon = stringToNode<SVGElement>(SelectIcon);
    super(drawer, 'selection', 'Select', $SelectIcon, 's');

    this.transformer.on('transformstart dragstart', () => {
      if (this.drawer.activeTool !== 'selection') {
        this.transformer.stopTransform();
        this.transformer.nodes([]);
        if (this.drawer.debug) {
          this.drawer.toast('You need to use "selection" tool.', 'info');
        }
      }
    });

    this.drawer.selectionLayer.add(this.transformer);
    this.overlay = new SelectOverlay(drawer);
  }

  protected initEvents(): void {
    this.drawer.stage.on('mousedown touchstart', (e) => {
      // do nothing if we mousedown on any shape
      if (e.target !== this.drawer.stage || e.evt.button === 2) {
        return;
      }
      e.evt.preventDefault();
      const realPos = this.drawer._getRelativePointerPos();
      this.#x1 = realPos.x;
      this.#y1 = realPos.y;
      this.#x2 = realPos.x;
      this.#y2 = realPos.y;

      this.selectionRectangle.width(0);
      this.selectionRectangle.height(0);
      this.isSelecting = true;
      this.drawer.UIPointerEvents('none');
    });

    this.drawer.stage.on('mousemove touchmove', (e) => {
      if (!this.isSelecting) {
        // Don't change cursor on anchor or on transforming
        if (e.target.hasName('_anchor') || this.transformer.isTransforming()) return;
        if (e.target !== this.drawer.stage) {
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

    this.drawer.stage.on('mouseup touchend', (e) => {
      if (e.evt.button === 2) return;
      this.isSelecting = false;
      this.drawer.UIPointerEvents('all');
      e.evt.preventDefault();
      // update visibility in timeout, so we can check it in click event
      this.selectionRectangle.visible(false);
      const shapes = this.drawer.getDrawingShapes();
      const box = this.selectionRectangle.getClientRect();
      const { x, y } = this.drawer._getPointerPos();
      let selected = shapes.filter((shape) => shape.listening() && Util.haveIntersection(box, shape.getClientRect()));

      // For get object on click, force width/height to 1
      if (box.x < 0 && box.y < 0) {
        selected = shapes.filter(
          (shape) => shape.listening() && Util.haveIntersection({ x, y, width: 1, height: 1 }, shape.getClientRect())
        );
      }

      this._restoreHit();

      // now apply hit detection
      selected.forEach((s) => {
        if (s instanceof Line) {
          s.hitFunc((context, shape) => {
            const { x, y, width, height } = shape.getSelfRect();
            context.beginPath();
            context.rect(x, y, width, height);
            context.closePath();
            context.fillStrokeShape(shape);
          });
          s.hitStrokeWidth('auto');
        }
      });

      const textShapes = selected.filter((s) => s.hasName(shapeName.text));
      if (textShapes.length > 0 && textShapes.length === selected.length) {
        this.transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
        this.transformer.boundBoxFunc(function (_oldBox, newBox) {
          newBox.width = Math.max(30, newBox.width);
          return newBox;
        });
      } else {
        this.transformer.enabledAnchors(this.defaultAnchors);
      }
      if (selected.length) {
        this.overlay.show(selected);
      } else {
        this.overlay.hide();
      }
      this.transformer.nodes(selected);
      this.$container.focus();
      this.selectionRectangle.setAttrs({
        visible: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });

    this.transformer.on('transformend dragend', () => {
      this.drawer.stage.fire('change');
    });
  }

  /**
   * reset hit detection for old selected shape
   */
  private _restoreHit() {
    const currentlySelected = this.transformer.nodes() as Line<NodeConfig>[];
    currentlySelected.forEach((s) => {
      s.hitFunc(undefined as any as (ctx: Context, shape: Line<NodeConfig>) => void);
      s.hitStrokeWidth(20);
    });
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
    this.initEvents();
    this.updateCursor();
    const shapes = this.drawer.getDrawingShapes();

    shapes.forEach((d) => {
      d.draggable(true);
    });
  }

  selectAll() {
    const allNodes = this.drawer.getDrawingShapes();
    this.transformer.nodes(allNodes);
    this.overlay.show(allNodes);
    this.drawer.focus();

    const brushWidget = this.drawer.getWidget<BrushWidget>('brush');

    brushWidget?.overlay.hide();
  }

  protected onDesactive(): void {
    this.selectionRectangle.destroy();
    this.removeEvents();
    this._restoreHit();
    const draw = this.drawer.getDrawingShapes();

    draw.forEach((d) => {
      d.draggable(false);
    });
    this.transformer.nodes([]);
    this.overlay.hide();
  }

  private _initSnapEvents() {
    this.snapping = true;
    this.drawer.drawLayer.on('dragmove', (e) => {
      // clear all previous lines on the screen
      this.drawer.selectionLayer.find('.' + shapeName.guideLine).forEach((l) => l.destroy());

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

    this.drawer.drawLayer.on('dragend', () => {
      // clear all previous lines on the screen
      this.drawer.selectionLayer.find('.' + shapeName.guideLine).forEach((l) => l.destroy());
    });
  }

  private _removeSnapEvents() {
    this.snapping = false;
    this.drawer.drawLayer.off('dragmove');
    this.drawer.drawLayer.off('dragend');
  }

  protected removeEvents() {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
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

    // find closest snap
    const minV = resultV.toSorted((a, b) => a.diff - b.diff)[0];
    const minH = resultH.toSorted((a, b) => a.diff - b.diff)[0];
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
   * Change background color
   * @param {ColorLike} color
   */
  setBgColor(color: ColorLike) {
    const selected = this.transformer.nodes();

    selected.forEach((s, index) => {
      if (s instanceof Shape) {
        // Ignore line
        if (s instanceof Line) {
          return;
        } else {
          s.fill(color);
          s.draw();

          if (index === selected.length -1) {
            this.drawer.stage.fire('change');
          }
        }
      }
    });
  }

  /**
   * Set color for draw
   * @param {ColorLike} color
   */
  setColor(color: ColorLike) {
    const selected = this.transformer.nodes();

    selected.forEach((s, index) => {
      if (s instanceof Shape) {
        // line need to be filled
        if (s instanceof Line) {
          s.fill(color);
          s.stroke(color);
        } else if (s instanceof Text) {
          s.fill(color);
        } else {
          s.stroke(color);
        }
        s.draw();

        if (index === selected.length -1) {
          this.drawer.stage.fire('change');
        }
      }
    });
  }

  /**
   * Set stroke width for draw
   * @param {Number | String} width
   */
  setStrokeWidth(width: number) {
    const selected = this.transformer.nodes();

    selected.forEach((s, index) => {
      if (s instanceof Shape) {
        s.strokeWidth(width);
        s.draw();

        if (index === selected.length -1) {
          this.drawer.stage.fire('change');
        }
      }
    });
  }

  /**
   * Set opacity of shape 0 to 1
   * @param opacity
   */
  setOpacity(opacity: number) {
    const selected = this.transformer.nodes();

    selected.forEach((s, index) => {
      if (s instanceof Shape) {
        s.opacity(opacity);
        s.draw();

        if (index === selected.length -1) {
          this.drawer.stage.fire('change');
        }
      }
    });
  }

  toggleSnapping(active: boolean = true) {
    if (active && !this.snapping) {
      if (this.drawer.grid) this.drawer.hideGrid();
      this.drawer.contextMenu.$snappingBtn.classList.add('active');
      this._initSnapEvents();
    } else if (!active && this.snapping) {
      this._removeSnapEvents();
      this.drawer.contextMenu.$snappingBtn.classList.remove('active');
    }
    this.drawer.stage.fire('change');
  }

  updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = 'default';
  }
}
