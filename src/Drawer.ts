import './scss/style.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Line } from 'konva/lib/shapes/Line';
import { Toolbar } from './components/toolbar/Toolbar';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Util } from 'konva/lib/Util';
import { AvailableTools } from './@types/toolbar';
import { ColorLike } from './@types/drawer';

export type DrawerOptions = {
  tool: AvailableTools;
};

export class Drawer {
  $el: HTMLDivElement;
  $container: HTMLDivElement;
  stage: Stage;
  layer: Layer;
  toolbar: Toolbar;
  activeTool: AvailableTools = 'brush';

  #background: Rect;
  #selectionRectangle: Rect;
  transformer: Transformer;
  #isPaint: boolean = false;
  #lastLine: Line | null = null;
  #x1: number = 0;
  #x2: number = 0;
  #y1: number = 0;
  #y2: number = 0;

  constructor($el: HTMLDivElement, options: Partial<DrawerOptions> = {}) {
    this.$el = $el;

    this.$el.classList.add('drawer-container');
    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.8;
    this.stage = new Stage({
      container: this.$el,
      width: width,
      height: height,
    });
    this.$container = this.stage.content;
    this.toolbar = new Toolbar(this);

    this.activeTool = options.tool ?? 'brush';
    this.layer = new Layer();
    this.stage.add(this.layer);

    this.#background = new Rect({
      fill: '#fff',
      width: this.stage.width(),
      height: this.stage.height(),
      listening: false,
      name: 'background',
    });
    this.layer.add(this.#background);

    this.transformer = new Transformer();
    this.layer.add(this.transformer);

    this.#selectionRectangle = new Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
      name: 'selection',
    });
    this.layer.add(this.#selectionRectangle);

    this._initEvents();

    const activeWidget = this.toolbar.getWidget(this.activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }
  }

  private _draw() {
    if (this.activeTool === 'selection') {
      const realPos = this._getMousePosition();
      this.#x1 = realPos.x;
      this.#y1 = realPos.y;
      this.#x2 = realPos.x;
      this.#y2 = realPos.y;

      this.#selectionRectangle.width(0);
      this.#selectionRectangle.height(0);
    } else if (this.activeTool === 'brush') {
      const realPos = this._getMousePosition();
      this.#lastLine = new Line({
        stroke: '#df4b26',
        strokeWidth: 5,
        globalCompositeOperation: 'source-over',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [realPos.x, realPos.y, realPos.x, realPos.y],
        // draggable: true,
        name: 'line',
      });
      this.layer.add(this.#lastLine);
    }
  }

  private _getMousePosition(): { x: number; y: number } {
    const pos = this.stage.getPointerPosition() ?? { x: 0, y: 0 };
    return {
      x: pos.x - this.stage.getPosition().x,
      y: pos.y - this.stage.getPosition().y,
    };
  }

  private _initEvents() {
    this.stage.on('mousedown touchstart', (e) => {
      if (e.target !== this.stage) {
        return;
      }
      e.evt.preventDefault();

      this.#isPaint = true;
      this._draw();
    });

    // and core function - drawing
    this.stage.on('mousemove touchmove', (e) => {
      if (!this.#isPaint) {
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      if (this.activeTool === 'selection') {
        const realPos = this._getMousePosition();
        this.#x2 = realPos.x;
        this.#y2 = realPos.y;
        this.#selectionRectangle.setAttrs({
          visible: true,
          x: Math.min(this.#x1, this.#x2),
          y: Math.min(this.#y1, this.#y2),
          width: Math.abs(this.#x2 - this.#x1),
          height: Math.abs(this.#y2 - this.#y1),
        });
      } else if (this.activeTool === 'brush') {
        const realPos = this._getMousePosition();
        const newPoints = this.#lastLine?.points().concat([realPos.x, realPos.y]) ?? [0, 0];
        this.#lastLine?.points(newPoints);
      } else if (this.activeTool === 'pan') {
        // Move stage
      }
    });

    // will it be better to listen move/end events on the window?

    this.stage.on('mouseup touchend', (e) => {
      this.#isPaint = false;

      e.evt.preventDefault();
      if (this.activeTool === 'selection') {
        // update visibility in timeout, so we can check it in click event
        this.#selectionRectangle.visible(false);
        const shapes = this.stage.find('.line');
        const box = this.#selectionRectangle.getClientRect();
        const { x, y } = this.stage.getPointerPosition() ?? { x: 0, y: 0 };
        let selected = shapes.filter((shape) => Util.haveIntersection(box, shape.getClientRect()));

        if (!selected.length && x && y) {
          selected = shapes.filter((shape) =>
            Util.haveIntersection({ x, y, width: 1, height: 1 }, shape.getClientRect())
          );
        }
        this.transformer.nodes(selected);
        this.#selectionRectangle.setAttrs({
          visible: true,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
      }
    });

    // const scaleBy = 1.1;
    // Zoom on wheel
    // this.stage.on('wheel', (e) => {
    //   // stop default scrolling
    //   e.evt.preventDefault();

    //   const oldScale = this.stage.scaleX();
    //   const pointer = this.stage.getPointerPosition() ?? { x: 0, y: 0 };

    //   const mousePointTo = {
    //     x: (pointer.x - this.stage.x()) / oldScale,
    //     y: (pointer.y - this.stage.y()) / oldScale,
    //   };

    //   // how to scale? Zoom in? Or zoom out?
    //   let direction = e.evt.deltaY > 0 ? -1 : 1;

    //   // when we zoom on trackpad, e.evt.ctrlKey is true
    //   // in that case lets revert direction
    //   if (e.evt.ctrlKey) {
    //     direction = -direction;
    //   }

    //   const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    //   this.stage.scale({ x: newScale, y: newScale });

    //   const newPos = {
    //     x: pointer.x - mousePointTo.x * newScale,
    //     y: pointer.y - mousePointTo.y * newScale,
    //   };
    //   this.stage.position(newPos);
    // });
  }

  /**
   * Change background color
   * @param {ColorLike} color
   */
  setBgColor(color: ColorLike) {
    this.#background.fill(color);
  }
}
