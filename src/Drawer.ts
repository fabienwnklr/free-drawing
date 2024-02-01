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
import { SelectWidget } from './components/toolbar/widgets/select/select';
import { PanWidget } from './components/toolbar/widgets/pan/pan';
import { BrushWidget } from './components/toolbar/widgets/brush/brush';
import { EraserWidget } from './components/toolbar/widgets/eraser/eraser';
import { BaseWidget } from './components/toolbar/widgets/BaseWidget';
import { Transformer } from 'konva/lib/shapes/Transformer';
import { Settings } from './components/tools/settings/Settings';
import { Node } from 'konva/lib/Node';
import MicroEvent from './utils/MicroEvent';

export class Drawer extends MicroEvent {
  $el: HTMLDivElement;
  $drawerContainer: HTMLDivElement;
  $stageContainer: HTMLDivElement;
  stage: Stage;
  layer: Layer;
  toolbar: Toolbar;
  activeTool: AvailableTools = 'brush';
  options: DrawerOptions;

  background: Rect;
  zoom: Zoom | undefined;
  help: Help;
  setting: Settings;

  constructor($el: HTMLDivElement, options: Partial<DrawerOptions> = {}) {
    super();
    this.$el = $el;

    this.options = deepMerge(defaultOptions, options);
    // Creating drawer container
    this.$drawerContainer = document.createElement('div');
    this.$drawerContainer.classList.add('drawer-container');
    this.$drawerContainer.tabIndex = 1;

    this.$el.replaceChildren(this.$drawerContainer);
    const width = this.options.width;
    const height = this.options.height;

    const saved = localStorage.getItem('free-drawing');
    if (saved) {
      this.stage = Node.create(saved, this.$drawerContainer);
      this.layer = this.stage.findOne('Layer') as Layer;
      this.background = this.stage.findOne('.background') as Rect;
    } else {
      this.stage = new Stage({
        container: this.$drawerContainer,
        width: width,
        height: height,
      });
      this.layer = new Layer();
      this.stage.add(this.layer);

      this.background = new Rect({
        fill: '#fff',
        width: this.stage.width() * 100,
        height: this.stage.height() * 100,
        listening: false,
        name: 'background',
      });

      this.layer.add(this.background);
    }
    this.$stageContainer = this.stage.content;
    const activeTool = this.options.tool ?? 'brush';
    this.toolbar = new Toolbar(this);

    if (this.options.zoomWidget) {
      this.zoom = new Zoom(this);
    }

    this.setting = new Settings(this);

    this.help = new Help(this);

    const activeWidget = this.toolbar.getWidget<BaseWidget>(activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }
    this.$drawerContainer.focus();
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
    // Keyboad shortcut
    this.$drawerContainer.addEventListener('keydown', (e) => {
      const selectWidget = this.toolbar.widgets.get('selection') as SelectWidget;
      if (selectWidget) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          selectWidget.transformer.nodes().forEach((n) => n.destroy());
          selectWidget.transformer.nodes([]);
        }

        if (e.ctrlKey && e.key === 'a') {
          const allNodes = this.layer.children.filter((e) => {
            if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
              return e;
            }
          });
          selectWidget.transformer.nodes(allNodes);
        }
      }

      if (e.key === 'h') {
        const panWidget = this.toolbar.getWidget<PanWidget>('pan');

        if (panWidget) {
          panWidget.setActive(true);
          panWidget.$button.focus();
        }
        return;
      }

      if (e.key === 's') {
        const selectWidget = this.toolbar.getWidget<SelectWidget>('selection');

        if (selectWidget) {
          selectWidget.setActive(true);
          selectWidget.$button.focus();
        }
        return;
      }

      if (e.key === 'b') {
        const brushWidhet = this.toolbar.getWidget<BrushWidget>('brush');

        if (brushWidhet) {
          brushWidhet.setActive(true);
          brushWidhet.$button.focus();
        }
        return;
      }

      if (e.key === 'e') {
        const eraserWidget = this.toolbar.getWidget<EraserWidget>('eraser');

        if (eraserWidget) {
          eraserWidget.setActive(true);
          eraserWidget.$button.focus();
        }
      }

      if (e.altKey && e.key === 'z') {
        this.setting.toggleZenMode();
      }
    });
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

        let newScale = direction > 0 ? oldScale * this.options.scaling : oldScale / this.options.scaling;

        if (newScale <= 0.1) {
          // limit min scale to 10%
          newScale = 0.1;
        } else if (newScale >= 30) {
          // limit max scale to 3000%
          newScale = 30;
        }

        this.stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        this.stage.position(newPos);
        this.zoom?.update();
      });
    }

    this.stage.on('change', () => {
      if (this.options.autoSave) {
        this.save();
      }
      this.trigger('change', this);
    });
  }

  save() {
    localStorage.setItem('free-drawing', this.stage.toJSON());
  }

  /**
   * Change background color
   * @param {ColorLike} color
   */
  setBgColor(color: ColorLike) {
    this.background.fill(color);
  }

  setColor(color: ColorLike) {
    this.options.strokeColor = color;

    const brushWidget = this.toolbar.getWidget('brush') as BrushWidget;

    if (brushWidget) {
      brushWidget.updateCursor();
    }
  }
}
