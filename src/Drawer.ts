import './scss/style.scss';
import MicroEvent from './lib/MicroEvent';
import MicroPlugin, { TPluginHash, TPluginItem } from './lib/MicroPlugin';
import ExamplePlugin from './plugins/example/plugin';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Image } from 'konva/lib/shapes/Image';
import { Line } from 'konva/lib/shapes/Line';
import { Toolbar } from './components/toolbar/Toolbar';

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
  activeTool: 'brush' | 'eraser' = 'brush';

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

    this.context = this.$canvas.getContext('2d') as CanvasRenderingContext2D;
    this.context.strokeStyle = '#df4b26';
    this.context.lineJoin = 'round';
    this.context.lineWidth = 5;

    let isPaint = false;
    let lastLine: Line | null;

    this.image.on('mousedown touchstart', () => {
      isPaint = true;
      const pos = this.stage.getPointerPosition() ?? { x: 0, y: 0 };
      lastLine = new Line({
        stroke: '#df4b26',
        strokeWidth: 5,
        globalCompositeOperation: this.activeTool === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      this.layer.add(lastLine);
    });

    // will it be better to listen move/end events on the window?

    this.stage.on('mouseup touchend', () => {
      isPaint = false;
    });

    // and core function - drawing
    this.stage.on('mousemove touchmove', (e) => {
      if (!isPaint) {
        return;
      }
      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = this.stage.getPointerPosition() ?? { x: 0, y: 0 };
      const newPoints = lastLine?.points().concat([pos.x, pos.y]) ?? [0, 0];
      lastLine?.points(newPoints);
    });

    const activeWidget = this.toolbar.getWidget(this.activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }
  }
}

Drawer.define('plugin-name', ExamplePlugin);
