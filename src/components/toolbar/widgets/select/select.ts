import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { BaseWidget } from '../BaseWidget';
import SelectIcon from '@/icons/select.svg?raw';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Group } from 'konva/lib/Group';
import { Rect } from 'konva/lib/shapes/Rect';
import { Line } from 'konva/lib/shapes/Line';
import { Util } from 'konva/lib/Util';
import { NodeConfig } from 'konva/lib/Node';

export class SelectWidget extends BaseWidget {
  #x1: number = 0;
  #y1: number = 0;
  #x2: number = 0;
  #y2: number = 0;
  #selectionRectangle: Rect;
  transformer: Transformer;
  isSelecting: boolean = false;
  constructor(protected drawer: Drawer) {
    const $SelectIcon = stringToNode<SVGElement>(SelectIcon);
    super(drawer, 'selection', 'Select', $SelectIcon);

    this.transformer = new Transformer();
    this.drawer.layer.add(this.transformer);

    this.#selectionRectangle = new Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
      name: 'selection',
    });
    this.drawer.layer.add(this.#selectionRectangle);
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

      this.#selectionRectangle.width(0);
      this.#selectionRectangle.height(0);
      this.isSelecting = true;
    });

    this.drawer.stage.on('mousemove touchmove', (e) => {
      if (!this.isSelecting) {

        // Don't change cursor on anchor or on transforming
        if (e.target.hasName('_anchor') || this.transformer.isTransforming()) return;
        if (e.target !== this.drawer.stage) {
          this.drawer.$container.style.cursor = 'move';
        } else {
          this.drawer.$container.style.cursor = 'default';
        }
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      const realPos = this.drawer._getRelativePointerPos();
      this.#x2 = realPos.x;
      this.#y2 = realPos.y;
      this.#selectionRectangle.setAttrs({
        visible: true,
        x: Math.min(this.#x1, this.#x2),
        y: Math.min(this.#y1, this.#y2),
        width: Math.abs(this.#x2 - this.#x1),
        height: Math.abs(this.#y2 - this.#y1),
      });

    });

    this.drawer.stage.on('mouseup touchend', (e) => {
      this.isSelecting = false;
      e.evt.preventDefault();
      // update visibility in timeout, so we can check it in click event
      this.#selectionRectangle.visible(false);
      const shapes = this.drawer.stage.find<Line>('.line');
      const box = this.#selectionRectangle.getClientRect();
      const { x, y } = this.drawer._getPointerPos();
      let selected = shapes.filter((shape) => Util.haveIntersection(box, shape.getClientRect()));

      if (!selected.length && x && y) {
        selected = shapes.filter((shape) =>
          Util.haveIntersection({ x, y, width: 1, height: 1 }, shape.getClientRect())
        );
      }
      const currentlySelected = this.transformer.nodes() as Line<NodeConfig>[];

      currentlySelected.forEach(s => {
        // s.hitFunc(undefined);
        s.hitStrokeWidth(20)
      })
      selected.forEach(s => {
        s.hitFunc((context, shape) => {
          const { x, y, width, height } = shape.getSelfRect();
          context.beginPath();
          context.rect(x, y, width, height);
          context.closePath();
          context.fillStrokeShape(shape);
        });
        s.hitStrokeWidth('auto')
      })
      this.transformer.nodes(selected);
      this.$container.focus();
      this.#selectionRectangle.setAttrs({
        visible: true,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });

    this.drawer.$drawerContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        this.transformer.nodes().forEach((n) => n.remove());
        this.transformer.nodes([]);
      }
    });
  }

  protected removeEvents() {
    this.drawer.stage.off('mousedown touchstart');
    this.drawer.stage.off('mousemove touchmove');
    this.drawer.stage.off('mouseup touchend');
  }

  protected onActive(): void {
    this.initEvents();
    this.updateCursor();
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => {
      d.setDraggable(true);
      if (d instanceof Group) return;
      // d.hitFunc((context, shape) => {
      //   const { x, y, width, height } = shape.getSelfRect();
      //   context.beginPath();
      //   context.rect(x, y, width, height);
      //   context.closePath();
      //   context.fillStrokeShape(shape);
      // });
    });
  }

  protected updateCursor(): void {
    this.drawer.$container.style.cursor = 'default';
  }

  protected onDesactive(): void {
    this.removeEvents();
    const draw = this.drawer.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });

    draw.forEach((d) => {
      d.setDraggable(false);
      if (d instanceof Group) return;
      // d.hitFunc(undefined);
    });
    this.transformer.nodes([]);
  }
}
