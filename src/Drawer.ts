import './scss/style.scss';
import MicroEvent from './lib/MicroEvent';
import MicroPlugin, { TPluginHash, TPluginItem } from './lib/MicroPlugin';
import ExamplePlugin from './plugins/example/plugin';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Image } from 'konva/lib/shapes/Image';
import { Line } from 'konva/lib/shapes/Line';
import { Toolbar } from './components/toolbar/Toolbar';
import { Vector2d } from 'konva/lib/types';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Util } from 'konva/lib/Util';

export type DrawerOptions = {
  plugins: string[] | TPluginItem[] | TPluginHash | undefined;
};

export class Drawer extends MicroPlugin(MicroEvent) {
  $el: HTMLDivElement;
  $canvas: HTMLCanvasElement;
  $container: HTMLDivElement;
  stage: Stage;
  layer: Layer;
  image: Image;
  context: CanvasRenderingContext2D;
  toolbar: Toolbar;
  activeTool: 'brush' | 'eraser' | 'selection' = 'brush';

  #transformer: Transformer;
  #isPaint: boolean = false;
  #selecting: boolean = false;
  #lastLine: Line | null = null;
  #x1: number = 0;
  #x2: number = 0;
  #y1: number = 0;
  #y2: number = 0;

  constructor($el: HTMLDivElement, options: Partial<DrawerOptions> = { plugins: ['plugin-name'] }) {
    super();
    this.$el = $el;

    if (options.plugins?.length) {
      this.initializePlugins(options.plugins);
    }

    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.8;
    this.stage = new Stage({
      container: this.$el,
      width: width,
      height: height,
    });
    this.$container = this.stage.content;
    this.toolbar = new Toolbar(this);

    this.layer = new Layer();
    this.stage.add(this.layer);

    this.$canvas = document.createElement('canvas');
    this.$canvas.width = this.stage.width();
    this.$canvas.height = this.stage.height();

    this.image = new Image({
      image: this.$canvas,
      x: 0,
      y: 0,
    });
    this.layer.add(this.image);

    this.#transformer = new Transformer();
    this.layer.add(this.#transformer);

    this.selectionRectangle = new Rect({
      fill: 'rgba(0,0,255,0.5)',
      visible: false,
    });
    this.layer.add(this.selectionRectangle);

    this.context = this.$canvas.getContext('2d') as CanvasRenderingContext2D;
    this.context.strokeStyle = '#df4b26';
    this.context.lineJoin = 'round';
    this.context.lineWidth = 5;

    this._initEvents();

    const activeWidget = this.toolbar.getWidget(this.activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }
  }

  _draw(pos: Vector2d) {
    if (this.activeTool === 'selection') {
      this.#x1 = this.stage.getPointerPosition()?.x ?? 0;
      this.#y1 = this.stage.getPointerPosition()?.y ?? 0;
      this.#x2 = this.stage.getPointerPosition()?.x ?? 0;
      this.#y2 = this.stage.getPointerPosition()?.y ?? 0;

      this.selectionRectangle.width(0);
      this.selectionRectangle.height(0);
      return;
    }
    this.#lastLine = new Line({
      stroke: '#df4b26',
      strokeWidth: this.activeTool === 'brush' ? 5 : 20,
      globalCompositeOperation: this.activeTool === 'brush' ? 'source-over' : 'destination-out',
      // round cap for smoother lines
      lineCap: 'round',
      lineJoin: 'round',
      // add point twice, so we have some drawings even on a simple click
      points: [pos.x, pos.y, pos.x, pos.y],
      draggable: true,
      name: 'line'
    });
    this.layer.add(this.#lastLine);
  }

  private _initEvents() {
    this.image.on('mousedown touchstart', (e) => {
      e.evt.preventDefault();

      this.#isPaint = true;
      const pos = this.stage.getPointerPosition() ?? { x: 0, y: 0 };

      this._draw(pos);
    });

    // will it be better to listen move/end events on the window?

    this.stage.on('mouseup touchend', (e) => {
      this.#isPaint = false;

      e.evt.preventDefault();
      if (this.activeTool === 'selection') {
        // update visibility in timeout, so we can check it in click event
        this.selectionRectangle.visible(false);
        const shapes = this.stage.find('.line');
        const box = this.selectionRectangle.getClientRect();
        const selected = shapes.filter((shape) => Util.haveIntersection(box, shape.getClientRect()));
        this.#transformer.nodes(selected);
      }
    });

    this.stage.on('click tap', (e) => {
      if (this.selectionRectangle.visible() || e.target === this.image) {
        return;
      }

      // if click on empty area - remove all selections
      if (e.target === this.stage) {
        this.#transformer.nodes([]);
        return;
      }

      this.#transformer.nodes([e.target]);
    });

    // and core function - drawing
    this.stage.on('mousemove touchmove', (e) => {
      if (!this.#isPaint) {
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = this.stage.getPointerPosition() ?? { x: 0, y: 0 };

      e.evt.preventDefault();

      if (this.activeTool === 'selection') {
        this.#x2 = pos.x;
        this.#y2 = pos.y;
        this.selectionRectangle.setAttrs({
          visible: true,
          x: Math.min(this.#x1, this.#x2),
          y: Math.min(this.#y1, this.#y2),
          width: Math.abs(this.#x2 - this.#x1),
          height: Math.abs(this.#y2 - this.#y1),
        });
        return;
      }
      const newPoints = this.#lastLine?.points().concat([pos.x, pos.y]) ?? [0, 0];
      this.#lastLine?.points(newPoints);
    });
  }
}

Drawer.define('plugin-name', ExamplePlugin);
