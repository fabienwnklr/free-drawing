import './drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Line } from 'konva/lib/shapes/Line';
import { Toolbar } from './components/toolbar/Toolbar';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Rect } from 'konva/lib/shapes/Rect';
import { Util } from 'konva/lib/Util';
import { AvailableTools } from './@types/toolbar';
import { ColorLike, DrawerOptions } from './@types/drawer';
import { Node, NodeConfig } from 'konva/lib/Node';
import { deepMerge } from './utils/functions';
import { defaultOptions } from './constants';
import { Zoom } from './components/tools/zoom/Zoom';
import { Help } from './components/tools/help/Help';

export class Drawer {
  $el: HTMLDivElement;
  $drawerContainer: HTMLDivElement;
  $container: HTMLDivElement;
  stage: Stage;
  layer: Layer;
  toolbar: Toolbar;
  activeTool: AvailableTools = 'brush';
  options: DrawerOptions;

  #background: Rect;
  #selectionRectangle: Rect;
  transformer: Transformer;
  isPaint: boolean = false;
  #lastLine: Line | null = null;
  #x1: number = 0;
  #x2: number = 0;
  #y1: number = 0;
  #y2: number = 0;
  #toRemoved: Node<NodeConfig>[] = [];
  zoom: Zoom | undefined;
  help: Help;

  constructor($el: HTMLDivElement, options: Partial<DrawerOptions> = {}) {
    this.$el = $el;

    this.options = deepMerge(defaultOptions, options);
    // Creating drawer container
    this.$drawerContainer = document.createElement('div');
    this.$drawerContainer.classList.add('drawer-container');
    this.$drawerContainer.tabIndex = 0;

    this.$el.replaceChildren(this.$drawerContainer);
    const width = this.options.width;
    const height = this.options.height;
    this.stage = new Stage({
      container: this.$drawerContainer,
      width: width,
      height: height,
    });
    this.$container = this.stage.content;
    const activeTool = this.options.tool ?? 'brush';
    this.toolbar = new Toolbar(this);

    if (this.options.zoomWidget) {
      this.zoom = new Zoom(this);
    }

    this.help = new Help(this);

    const activeWidget = this.toolbar.getWidget(activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }

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
        hitFunc: function (context, shape) {
          const { x, y, width, height } = shape.getSelfRect();
          context.beginPath();
          context.rect(x, y, width, height);
          context.closePath();
          context.fillStrokeShape(shape);
        },
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
    } else if (this.activeTool === 'eraser') {
      // nothing
    }
  }

  private _getMousePosition(): { x: number; y: number } {
    const { x, y } = this.stage.getRelativePointerPosition() ?? { x: 0, y: 0 };
    return {
      x,
      y,
    };
  }

  private _initEvents() {
    this.$drawerContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        this.transformer.nodes().forEach((n) => n.remove());
        this.transformer.nodes([]);
      }
    });
    this.stage.on('mousedown touchstart', (e) => {
      if (e.target !== this.stage) {
        return;
      }
      e.evt.preventDefault();

      this.isPaint = true;
      this._draw();
    });

    // and core function - drawing
    this.stage.on('mousemove touchmove', (e) => {
      if (!this.isPaint) {
        if (this.activeTool === 'selection') {
          if (e.target !== this.stage) {
            this.$container.style.cursor = 'move';
          } else {
            this.$container.style.cursor = 'default';
          }
        }
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
      } else if (this.activeTool === 'eraser') {
        const shapes = this.stage.find<Line>('.line');
        const pos = this._getMousePosition();
        const selected = shapes.filter((s) => s == this.stage.getIntersection(pos));

        selected.forEach((s) => {
          if (s.opacity() === 0.5) {
            return;
          }
          this.#toRemoved.push(s);
          s.opacity(0.5);
        });
      }
    });

    this.stage.on('mouseup touchend', (e) => {
      this.isPaint = false;

      e.evt.preventDefault();
      if (this.activeTool === 'selection') {
        // update visibility in timeout, so we can check it in click event
        this.#selectionRectangle.visible(false);
        const shapes = this.stage.find('.line');
        const box = this.#selectionRectangle.getClientRect();
        const { x, y } = this._getMousePosition();
        let selected = shapes.filter((shape) => Util.haveIntersection(box, shape.getClientRect()));

        if (!selected.length && x && y) {
          selected = shapes.filter((shape) =>
            Util.haveIntersection({ x, y, width: 1, height: 1 }, shape.getClientRect())
          );
        }
        this.transformer.nodes(selected);
        this.$container.focus();
        this.#selectionRectangle.setAttrs({
          visible: true,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        });
      } else if (this.activeTool === 'eraser') {
        this.#toRemoved.forEach((t) => t.remove());
        this.#toRemoved = [];
      }
    });

    this.stage.on('dragstart', (e) => {
      if (e.target !== this.stage || this.activeTool !== 'pan') return;

      this.$container.style.cursor = 'grabbing';
    });

    this.stage.on('dragend', (e) => {
      if (e.target !== this.stage || this.activeTool !== 'pan') return;

      this.$container.style.cursor = 'grab';
    });

    this.stage.on('click tap', (e) => {
      if (this.activeTool === 'eraser') {
        if (!(e.target instanceof Transformer) && !e.target.hasName('background') && !e.target.hasName('selection')) {
          e.target.remove();
        }
      }
    });
    // Zoom on wheel
    if (this.options.zoom) {
      this.stage.on('wheel', (e) => {
        if (!e.evt.ctrlKey) return;
        // stop default scrolling
        e.evt.preventDefault();

        const oldScale = this.stage.scaleX();
        const pointer = this._getMousePosition();

        const mousePointTo = {
          x: (pointer.x - this.stage.x()) / oldScale,
          y: (pointer.y - this.stage.y()) / oldScale,
        };

        // how to scale? Zoom in? Or zoom out?
        let direction = e.evt.deltaY > 0 ? 1 : -1;

        // when we zoom on trackpad, e.evt.ctrlKey is true
        // in that case lets revert direction
        if (e.evt.ctrlKey) {
          direction = -direction;
        }

        const newScale = direction > 0 ? oldScale * this.options.scaling : oldScale / this.options.scaling;

        this.stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        this.stage.position(newPos);
        this.zoom?.update();
      });
    }
  }

  /**
   * Change background color
   * @param {ColorLike} color
   */
  setBgColor(color: ColorLike) {
    this.#background.fill(color);
  }
}
