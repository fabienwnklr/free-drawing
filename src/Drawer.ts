import './drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Toolbar } from './components/toolbar/Toolbar';
import { Rect } from 'konva/lib/shapes/Rect';
import { AvailableTools } from './@types/toolbar';
import { ColorLike, DrawerOptions } from './@types/drawer';
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
  isPaint: boolean = false;
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
    this.layer = new Layer();
    this.toolbar = new Toolbar(this);

    if (this.options.zoomWidget) {
      this.zoom = new Zoom(this);
    }

    this.help = new Help(this);

    const activeWidget = this.toolbar.getWidget(activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }

    this.stage.add(this.layer);

    this.#background = new Rect({
      fill: '#fff',
      width: this.stage.width() * 100,
      height: this.stage.height() * 100,
      listening: false,
      name: 'background',
    });

    this._initEvents();
  }

  _getRelativePointerPos(): { x: number; y: number } {
    const { x, y } = this.stage.getRelativePointerPosition() ?? { x: 0, y: 0 };
    return {
      x,
      y,
    };
  }

  _getPointerPos(): { x: number; y: number } {
    const { x, y } = this.stage.getPointerPosition() ?? { x: 0, y: 0 };
    return {
      x,
      y,
    };
  }

  private _initEvents() {
    // Zoom on wheel
    if (this.options.zoom) {
      this.stage.on('wheel', (e) => {
        if (!e.evt.ctrlKey) return;
        // stop default scrolling
        e.evt.preventDefault();

        const oldScale = this.stage.scaleX();
        const pointer = this._getRelativePointerPos();

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
