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

export class SelectWidget extends BaseWidget {
  #x1: number = 0;
  #y1: number = 0;
  #x2: number = 0;
  #y2: number = 0;
  selectionRectangle: Rect = new Rect();
  // In constructor for be usable out of widget
  transformer: Transformer = new Transformer({
    borderStroke: 'rgba(152, 158, 255, 1)',
    anchorStroke: 'rgba(152, 158, 255, 1)',
    anchorCornerRadius: 3,
  });
  isSelecting: boolean = false;

  constructor(protected drawer: Drawer) {
    const $SelectIcon = stringToNode<SVGElement>(SelectIcon);
    super(drawer, 'selection', 'Select', $SelectIcon);

    this.transformer.on('transformstart dragstart', () => {
      if (this.drawer.activeTool !== 'selection') {
        this.transformer.stopTransform();
        this.transformer.nodes([]);
        if (this.drawer.debug) {
          this.drawer.toast('You need to use "selection" tool.', 'info');
        }
      }
    });

    this.drawer.layer.add(this.transformer);
  }

  protected initEvents(): void {
    this.drawer.stage.on('mousedown touchstart', (e) => {
      // do nothing if we mousedown on any shape
      if (e.target !== this.drawer.stage) {
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
      this.isSelecting = false;
      this.drawer.UIPointerEvents('all')
      e.evt.preventDefault();
      // update visibility in timeout, so we can check it in click event
      this.selectionRectangle.visible(false);
      const shapes = this.drawer.getDrawingShapes();
      const box = this.selectionRectangle.getClientRect();
      const { x, y } = this.drawer._getPointerPos();
      let selected = shapes.filter((shape) => Util.haveIntersection(box, shape.getClientRect()));

      if (!selected.length && x && y) {
        selected = shapes.filter((shape) =>
          Util.haveIntersection({ x, y, width: 1, height: 1 }, shape.getClientRect())
        );
      }
      const currentlySelected = this.transformer.nodes() as Line<NodeConfig>[];

      currentlySelected.forEach((s) => {
        s.hitFunc(undefined as any as (ctx: Context, shape: Line<NodeConfig>) => void);
        s.hitStrokeWidth(20);
      });
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

      if (selected.filter((e) => e.hasName('text')).length === selected.length) {
        this.transformer.enabledAnchors(['middle-left', 'middle-right']);
        this.transformer.boundBoxFunc(function (_oldBox, newBox) {
          newBox.width = Math.max(30, newBox.width);
          return newBox;
        });
      } else {
        this.transformer.enabledAnchors([
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'middle-left',
          'middle-right',
        ]);
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

  protected removeEvents() {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }

  protected onActive(): void {
    this.transformer.zIndex(this.transformer.zIndex() + 1);

    this.selectionRectangle = new Rect({
      fill: 'rgba(152, 158, 255, .2)',
      stroke: 'rgba(152, 158, 255, .8)',
      strokeWidth: 1,
      visible: false,
      name: 'selection',
    });

    this.drawer.layer.add(this.selectionRectangle);
    this.initEvents();
    this.updateCursor();
    const shapes = this.drawer.getDrawingShapes();

    shapes.forEach((d) => {
      d.draggable(true);
    });
  }

  updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = 'default';
  }

  protected onDesactive(): void {
    this.selectionRectangle.destroy();
    this.removeEvents();
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => {
      d.draggable(false);
    });
    this.transformer.nodes([]);
  }
}
