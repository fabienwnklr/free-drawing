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
import { ConfirmModal } from './components/modal/ConfirmModal';
import { UndoRedo } from './components/tools/undo-redo/undoRedo';
import { ContextMenu } from './components/context-menu/context-menu';

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
  $clearConfirmModal: ConfirmModal | null = null;

  debug: boolean = false;
  undoRedo: UndoRedo;
  $footerContainer: HTMLElement;
  $footerLeftElement: HTMLDivElement;
  contextMenu: ContextMenu;

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
    const activeTool = this.options.tool ?? 'brush';

    if (width === window.innerWidth && height === window.innerHeight) {
      this.$drawerContainer.classList.add('is-full');
    }

    const saved = localStorage.getItem(this.options.localStorageKey);
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
    this.$footerContainer = document.createElement('footer');
    this.$footerContainer.classList.add('drawer-footer-container');

    this.$footerLeftElement = document.createElement('div');
    this.$footerLeftElement.classList.add('drawer-footer-left');
    this.$footerContainer.append(this.$footerLeftElement);

    this.contextMenu = new ContextMenu(this);
    this.setting = new Settings(this);

    if (this.options.zoomWidget) {
      this.zoom = new Zoom(this);
    }
    this.undoRedo = new UndoRedo(this);
    this.toolbar = new Toolbar(this);
    this.help = new Help(this);

    const activeWidget = this.toolbar.getWidget<BaseWidget>(activeTool);
    if (activeWidget) {
      activeWidget.setActive(true);
    }

    this.$drawerContainer.appendChild(this.$footerContainer);
    this.$drawerContainer.focus();
    this._initEvents();
  }

  getDrawingShapes() {
    return this.layer.children.filter((e) => {
      if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
        return e;
      }
    });
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
    this._initHotKey();
    this._initZoomWheel();

    this.stage.on('change', () => {
      if (this.options.autoSave) {
        this.save();
      }

      this.undoRedo.saveState();
      this.trigger('change', this);
    });
  }

  private _initHotKey() {
    this.$drawerContainer.addEventListener('keydown', (e) => {
      const selectWidget = this.toolbar.widgets.get('selection') as SelectWidget;
      if (selectWidget) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const allNodes = selectWidget.transformer.nodes();

          if (allNodes) {
            allNodes.forEach((n) => n.destroy());
            selectWidget.transformer.nodes([]);
            this.stage.fire('change');
          }
        }

        if (e.ctrlKey && e.key === 'a') {
          const allNodes = this.layer.children.filter((e) => {
            if (!(e instanceof Transformer) && !e.hasName('background') && !e.hasName('selection')) {
              return e;
            }
          });
          this.$drawerContainer.focus();
          selectWidget.transformer.nodes(allNodes);
        }
      }

      if (e.key === 'h') {
        if (this._duringAction()) {
          return;
        }

        const panWidget = this.toolbar.getWidget<PanWidget>('pan');

        if (panWidget) {
          panWidget.setActive(true);
          panWidget.$button.focus();
        }
        return;
      }

      if (e.key === 's') {
        if (this._duringAction()) {
          return;
        }

        const selectWidget = this.toolbar.getWidget<SelectWidget>('selection');

        if (selectWidget) {
          selectWidget.setActive(true);
          selectWidget.$button.focus();
        }
        return;
      }

      if (e.key === 'b') {
        if (this._duringAction()) {
          return;
        }

        const brushWidget = this.toolbar.getWidget<BrushWidget>('brush');

        if (brushWidget) {
          brushWidget.setActive(true);
          brushWidget.$button.focus();
        }
        return;
      }

      if (e.key === 'e') {
        if (this._duringAction()) {
          return;
        }

        const eraserWidget = this.toolbar.getWidget<EraserWidget>('eraser');
        if (eraserWidget) {
          eraserWidget.setActive(true);
          eraserWidget.$button.focus();
        }
      }

      if (e.altKey && e.key === 'z') {
        this.setting.toggleZenMode();
      }

      if (e.ctrlKey && e.key === 'Delete') {
        this.clearCanvas();
      }
    });
  }

  private _duringAction() {
    const eraserWidget = this.toolbar.getWidget<EraserWidget>('eraser');
    const brushWidget = this.toolbar.getWidget<BrushWidget>('brush');
    const selectionWidget = this.toolbar.getWidget<SelectWidget>('selection');

    if (
      (eraserWidget && eraserWidget.isErasing) ||
      (selectionWidget && selectionWidget.isSelecting) ||
      (brushWidget && brushWidget.isPaint)
    ) {
      return true;
    }

    return false;
  }

  private _initZoomWheel() {
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

        if (this.activeTool === 'brush') {
          this.toolbar.activeWidget.updateCursor();
        }
      });
    }
  }

  save() {
    localStorage.setItem(this.options.localStorageKey, this.stage.toJSON());
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

  /**
   * Show toast message for user
   *
   * @param message Message to show
   * @param type Type of toast
   */
  toast(message: string, type?: 'info' | 'warning' | 'error' | 'neutral') {
    console.log(message, type);
  }

  clearCanvas(force = false) {
    if (!force) {
      if (!this.$clearConfirmModal) {
        this.$clearConfirmModal = new ConfirmModal(this, {
          message: 'Are you sure to remove all canvas draw ?',
        });
      }
      this.$clearConfirmModal.show();
    } else {
      const shapes = this.getDrawingShapes();

      if (shapes) {
        shapes.forEach((l) => l.destroy());
        this.stage.fire('change');
      }
    }
  }
}
