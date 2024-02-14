import './drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Toolbar } from './components/toolbar/Toolbar';
import { Rect } from 'konva/lib/shapes/Rect';
import { AvailableTools } from './@types/toolbar';
import { ColorLike, DrawerOptions } from './@types/drawer';
import { deepMerge } from './utils/functions';
import { defaultOptions, shapeName } from './constants';
import { Zoom } from './components/tools/Zoom/Zoom';
import { Help } from './components/tools/Help/Help';
import { SelectWidget } from './components/toolbar/widgets/Select/Select';
import { PanWidget } from './components/toolbar/widgets/Pan/Pan';
import { BrushWidget } from './components/toolbar/widgets/Brush/Brush';
import { EraserWidget } from './components/toolbar/widgets/Eraser/Eraser';
import { BaseWidget } from './components/toolbar/widgets/BaseWidget';
import { Settings } from './components/tools/Settings/Settings';
import { Node } from 'konva/lib/Node';
import MicroEvent from './utils/MicroEvent';
import { ConfirmModal } from './components/Modal/ConfirmModal';
import { UndoRedo } from './components/tools/UndoRedo/UndoRedo';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import { TextWidget } from './components/toolbar/widgets/Text/Text';
import { Text } from 'konva/lib/shapes/Text';
import { Line } from 'konva/lib/shapes/Line';
import { Toast } from './components/Toast/Toast';
import { Group } from 'konva/lib/Group';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Vector2d } from 'konva/lib/types';

/**
 * Drawer constructor. A drawer is used to draw multiple shapes
 * @constructor
 * @memberof Drawer
 * @augments Konva.MicroEvent
 *
 * @example
 * const drawer = new Drawer(document.getElementById('draw'), {
 *   width: 500,
 *   height: 800,
 * });
 */
export class Drawer extends MicroEvent {
  $el: HTMLDivElement;
  $drawerContainer: HTMLDivElement;
  $stageContainer: HTMLDivElement;
  stage: Stage;
  // Layers
  gridLayer: Layer;
  drawLayer: Layer;
  selectionLayer: Layer;
  toolbar: Toolbar;
  activeTool: AvailableTools = 'brush';
  activeWidget!: BaseWidget;
  options: DrawerOptions;

  background: Rect;
  zoom: Zoom | undefined;
  help: Help;
  setting: Settings;
  $clearConfirmModal: ConfirmModal | null = null;
  $clearStoredConfirmModal: ConfirmModal | null = null;

  debug: boolean = false;
  undoRedo: UndoRedo;
  $footerContainer: HTMLElement;
  $footerLeftElement: HTMLDivElement;
  contextMenu: ContextMenu;
  grid: boolean = false;
  bgLayer: Layer;

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
    let activeTool = this.options.tool ?? 'brush';

    if (width === window.innerWidth && height === window.innerHeight) {
      this.$drawerContainer.classList.add('is-full');
    }

    const stageSaved = localStorage.getItem(this.options.localStorageKey);
    const toolSaved = localStorage.getItem(this.options.localStorageKey + '-tool');
    if (stageSaved) {
      this.stage = Node.create(stageSaved, this.$drawerContainer);
      this.bgLayer = this.stage.findOne('.background') as Layer;
      this.gridLayer = this.stage.findOne('.grid') as Layer;
      this.drawLayer = this.stage.findOne('.draw') as Layer;
      this.selectionLayer = this.stage.findOne('.selection') as Layer;
      this.background = this.bgLayer.findOne('.' + shapeName.background) as Rect;
      this.grid = this.gridLayer.children.length > 0;
      activeTool = toolSaved ?? activeTool;
    } else {
      this.stage = new Stage({
        container: this.$drawerContainer,
        width: width,
        height: height,
      });
      // Do not create more layer, if think it's necessary, maybe we should think about rethinking the logic
      // cf : https://konvajs.org/docs/performance/Layer_Management.html
      this.bgLayer = new Layer({ name: 'background' });
      this.gridLayer = new Layer({ name: 'grid' });
      this.drawLayer = new Layer({ name: ' draw' });
      this.selectionLayer = new Layer({ name: 'selection' });

      this.background = new Rect({
        fill: '#fff',
        width: this.stage.width() * 100,
        height: this.stage.height() * 100,
        listening: false,
        name: shapeName.background,
      });
      this.bgLayer.add(this.background);
      // First bg layer
      this.stage.add(this.bgLayer);
      this.stage.add(this.gridLayer);
      this.stage.add(this.drawLayer);
      this.stage.add(this.selectionLayer);
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

    const activeWidget = this.getWidget<BaseWidget>(activeTool);
    activeWidget?.setActive(true);

    if (stageSaved) {
      const textWidget = this.getWidget<TextWidget>('text');
      this.drawLayer.find('.text').forEach((t) => {
        if (t instanceof Text) {
          textWidget?.addTextNodeEvents(t);
        }
      });
    }

    this.$drawerContainer.appendChild(this.$footerContainer);
    this.focus();
    this.undoRedo.manageButtons();
    this._initEvents();
  }

  /**
   * Get zoom level
   * @returns {number}
   */
  getZoomLevel(): number {
    return this.stage.scaleX();
  }

  /**
   * Get all shape drawing
   * @returns {Shape<ShapeConfig>[]}
   */
  getDrawingShapes(): Shape<ShapeConfig>[] {
    // Return clone of array, else clean doesn't work
    return [...this.drawLayer.children] as Shape<ShapeConfig>[];
  }

  /**
   * Get all drawing shape by name
   * @param {keyof typeof shapeName} shapeType Shape type
   * @returns {(Group | Shape<ShapeConfig>)[]}
   */
  getDrawingShapeByName(shapeType: keyof typeof shapeName): (Group | Shape<ShapeConfig>)[] {
    return this.drawLayer.children.filter((e) => {
      if (e.hasName(shapeName[shapeType])) {
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

  /**
   * Update grid lines and bg position
   */
  _update() {
    if (this.grid) {
      this._drawLines();
    }

    this.bgLayer.position({ x: -this._unScale(this.stage.position().x), y: -this._unScale(this.stage.position().y) });
  }

  private _initEvents() {
    this._initHotKey();
    this._initZoomWheel();

    this.stage.on('dragmove', () => {
      this._update();
    });

    this.stage.on('wheel', () => {
      this._update();
    });

    this.stage.on('change', () => {
      if (this.options.autoSave) {
        this.save();
      }

      this.undoRedo.saveState();
      this.undoRedo.manageButtons();
      this.trigger('change', this);
    });
  }

  private _initHotKey() {
    const DELTA = 4;
    this.$drawerContainer.addEventListener('keydown', (e) => {
      if (this._duringAction()) return;

      const selectWidget = this.getWidget<SelectWidget>('selection');
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const allNodes = selectWidget?.transformer.nodes();

        if (allNodes) {
          allNodes.forEach((n) => n.destroy());
          selectWidget?.transformer.nodes([]);
          selectWidget?.overlay.hide();

          if (this.activeWidget instanceof BrushWidget) {
            this.activeWidget.overlay.show();
          }
          this.stage.fire('change');
        }
      }

      if (e.ctrlKey && e.key === 'a') {
        selectWidget?.selectAll();
      }

      if (selectWidget?.transformer.nodes().length) {
        selectWidget?.transformer.nodes().forEach((shape) => {
          if (e.key === 'ArrowLeft') {
            shape.x(shape.x() - DELTA);
          } else if (e.key === 'ArrowUp') {
            shape.y(shape.y() - DELTA);
          } else if (e.key === 'ArrowRight') {
            shape.x(shape.x() + DELTA);
          } else if (e.key === 'ArrowDown') {
            shape.y(shape.y() + DELTA);
          } else {
            return;
          }
        });
        e.preventDefault();
      }

      const panWidget = this.getWidget<PanWidget>('pan');

      if (!e.altKey && e.key === 's') {
        if (this._duringAction()) {
          return;
        }

        selectWidget?.setActive(true);
        selectWidget?.$button.focus();
        return;
      }

      // Toolbar shortcut
      if (e.key === 'h') {
        if (this._duringAction()) {
          return;
        }

        panWidget?.setActive(true);
        panWidget?.$button.focus();
        return;
      }

      if (e.altKey && e.key === 's') {
        this.setting.toggleSnapping();
      }

      if (e.key === 'b') {
        if (this._duringAction()) {
          return;
        }

        const brushWidget = this.getWidget<BrushWidget>('brush');

        brushWidget?.setActive(true);
        brushWidget?.$button.focus();
        return;
      }

      if (e.key === 'e') {
        if (this._duringAction()) {
          return;
        }

        const eraserWidget = this.getWidget<EraserWidget>('eraser');
        eraserWidget?.setActive(true);
        eraserWidget?.$button.focus();
      }

      if (e.key === 't') {
        if (this._duringAction()) {
          return;
        }

        const textWidget = this.getWidget<TextWidget>('text');
        textWidget?.setActive(true);
        textWidget?.$button.focus();
      }

      if (e.altKey && e.key === 'z') {
        this.setting.toggleZenMode();
      }

      if (e.altKey && e.key === 'z') {
        this.setting.toggleSnapping();
      }

      if (e.ctrlKey && e.key === 'Delete') {
        this.clearCanvas();
      }

      if (e.ctrlKey && e.key === 'z') {
        this.undoRedo.undo();
      }

      if (e.ctrlKey && e.key === 'y') {
        this.undoRedo.redo();
      }

      if (e.altKey && e.key === 'g') {
        this.setting.toggleGrid();
      }
    });
  }

  /**
   * Get widget by name
   * @param {AvailableTools} name
   */
  getWidget<T>(name: AvailableTools): T | undefined {
    return this.toolbar.getWidget<T>(name);
  }

  private _duringAction() {
    const eraserWidget = this.getWidget<EraserWidget>('eraser');
    const brushWidget = this.getWidget<BrushWidget>('brush');
    const selectionWidget = this.getWidget<SelectWidget>('selection');
    const textWidget = this.getWidget<TextWidget>('text');

    if (eraserWidget?.isErasing || selectionWidget?.isSelecting || brushWidget?.isPaint || textWidget?.isEditing) {
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
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        let newScale = direction > 0 ? oldScale * this.options.scaling : oldScale / this.options.scaling;

        // limit min scale to 10%
        if (newScale <= 0.1) {
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
  }

  /**
   * Save current draw state to localstorage
   */
  save() {
    localStorage.setItem(this.options.localStorageKey, this.stage.toJSON());
    localStorage.setItem(this.options.localStorageKey + '-tool', this.activeTool);
  }

  /**
   * Change background color
   * @param {ColorLike} color
   */
  setBgColor(color: ColorLike) {
    this.background.fill(color);

    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget?.transformer.nodes().length) {
      selectWidget?.setBgColor(color);
    }

    this.stage.fire('change');
  }

  /**
   * Set color for draw
   * @param {ColorLike} color
   */
  setColor(color: ColorLike) {
    this.options.strokeColor = color;

    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget?.transformer.nodes().length) {
      selectWidget?.setColor(color);
    }
  }

  /**
   * Set stroke width for draw
   * @param {Number | String} width
   */
  setStrokeWidth(width: string | number) {
    width = Number(width);

    this.options.strokeWidth = width;

    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget?.transformer.nodes().length) {
      selectWidget?.setStrokeWidth(width);
    }
  }

  /**
   * Set opacity of shape 0 to 1
   * @param opacity
   */
  setOpacity(opacity: number) {
    this.options.opacity = opacity;

    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget?.transformer.nodes().length) {
      selectWidget?.setOpacity(opacity);
    }
  }

  /**
   * Show toast message for user
   *
   * @param message Message to show
   * @param type Type of toast
   * @returns {Toast}
   */
  toast(message: string, type?: 'info' | 'warning' | 'error' | 'neutral'): Toast {
    const toast = new Toast(this, message, type);

    toast.show();

    return toast;
  }

  /**
   * @private
   *
   * update pointer-event state
   * @param state
   */
  UIPointerEvents(state: 'all' | 'none') {
    document.getElementsByTagName('html')[0].style.setProperty('--drawer-pointer-events', state);
  }

  /**
   * Clear canvas draw
   * @param force Force clear (don't show confirm modal)
   */
  clearCanvas(force: boolean = false) {
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
        shapes.forEach((l, index) => {
          l.destroy();

          if (index === shapes.length - 1) {
            this.stage.fire('change');
          }
        });
      }
    }
  }

  /**
   * Remove localstorage data
   * @param force Force clear (don't show confirm modal)
   */
  clearStoredData(force: boolean = false) {
    if (!force) {
      if (!this.$clearStoredConfirmModal) {
        this.$clearStoredConfirmModal = new ConfirmModal(this, {
          message: 'Are you sure to remove all stored data ?',
          onConfirm: (modal) => {
            localStorage.removeItem(this.options.localStorageKey);
            modal.hide();
          },
        });
      }
      this.$clearStoredConfirmModal.show();
    } else {
      localStorage.removeItem(this.options.localStorageKey);
    }
  }

  /**
   * Show grid
   */
  showGrid() {
    this.grid = true;
    this.contextMenu.$gridBtn.classList.add('active');
    this.setting.$toggleGridButton.classList.add('active');
    this._drawLines();
    this._initSnapGridEvents();

    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget?.snapping) {
      selectWidget.toggleSnapping(false);
    }
  }

  private _initSnapGridEvents() {
    const selectWidget = this.getWidget<SelectWidget>('selection');
    const cellSize = 40;

    this.drawLayer.on('dragmove', (e) => {
      if (e.target instanceof Shape) {
        console.log(Math.round(e.target.x() / cellSize) * cellSize, Math.round(e.target.y() / cellSize) * cellSize)
        e.target.position({
          x: Math.round(e.target.x() / cellSize) * cellSize,
          y: Math.round(e.target.y() / cellSize) * cellSize
        });
      }
    });
    selectWidget?.transformer.anchorDragBoundFunc((oldPos, newPos) => {
      // do not snap rotating point or if grid disabled
      if (selectWidget.transformer.getActiveAnchor() === 'rotater' || !this.grid) {
        return newPos;
      }

      const dist = Math.sqrt(Math.pow(newPos.x - oldPos.x, 2) + Math.pow(newPos.y - oldPos.y, 2));

      // do not do any snapping with new absolute position (pointer position)
      // is too far away from old position
      if (dist > 10) {
        return newPos;
      }

      return calc(oldPos, newPos)
    });

    function calc(oldPos: Vector2d, newPos: Vector2d) {
      const dist = Math.sqrt(Math.pow(newPos.x - oldPos.x, 2) + Math.pow(newPos.y - oldPos.y, 2));

      // do not do any snapping with new absolute position (pointer position)
      // is too far away from old position
      if (dist > 10) {
        return newPos;
      }

      const closestX = Math.round(newPos.x / cellSize) * cellSize;
      const diffX = Math.abs(newPos.x - closestX);

      const closestY = Math.round(newPos.y / cellSize) * cellSize;
      const diffY = Math.abs(newPos.y - closestY);

      const snappedX = diffX < 10;
      const snappedY = diffY < 10;

      // a bit different snap strategies based on snap direction
      // we need to reuse old position for better UX
      if (snappedX && !snappedY) {
        return {
          x: closestX,
          y: oldPos.y,
        };
      } else if (snappedY && !snappedX) {
        return {
          x: oldPos.x,
          y: closestY,
        };
      } else if (snappedX && snappedY) {
        return {
          x: closestX,
          y: closestY,
        };
      }
      return newPos;
    }

    selectWidget?.transformer.rotationSnaps([0, 90, 180, 270]);
  }

  private _removeSnapGridEvents() {
    const selectWidget = this.getWidget<SelectWidget>('selection');

    selectWidget?.transformer.anchorDragBoundFunc(
      undefined as any as (oldPos: Vector2d, newPos: Vector2d, e: MouseEvent) => Vector2d
    );
    selectWidget?.transformer.rotationSnaps(undefined as any as number[]);
  }

  private _unScale(val: number) {
    return val / this.getZoomLevel();
  }

  private _drawLines() {
    this.gridLayer.clear();
    this.gridLayer.removeChildren();
    this.gridLayer.clipWidth(0);
    const stepSize = 40;

    const stageRect = {
      x1: 0,
      y1: 0,
      x2: this.stage.width(),
      y2: this.stage.height(),
      offset: {
        x: this._unScale(this.stage.position().x),
        y: this._unScale(this.stage.position().y),
      },
    };
    const viewRect = {
      x1: -stageRect.offset.x,
      y1: -stageRect.offset.y,
      x2: this._unScale(this.stage.width()) - stageRect.offset.x,
      y2: this._unScale(this.stage.height()) - stageRect.offset.y,
    };
    // and find the largest rectangle that bounds both the stage and view rect.
    // This is the rect we will draw on.
    const gridOffset = {
      x: Math.ceil(this._unScale(this.stage.position().x) / stepSize) * stepSize,
      y: Math.ceil(this._unScale(this.stage.position().y) / stepSize) * stepSize,
    };
    const gridRect = {
      x1: -gridOffset.x,
      y1: -gridOffset.y,
      x2: this._unScale(this.stage.width()) - gridOffset.x + stepSize,
      y2: this._unScale(this.stage.height()) - gridOffset.y + stepSize,
    };
    const gridFullRect = {
      x1: Math.min(stageRect.x1, gridRect.x1),
      y1: Math.min(stageRect.y1, gridRect.y1),
      x2: Math.max(stageRect.x2, gridRect.x2),
      y2: Math.max(stageRect.y2, gridRect.y2),
    };

    // set clip function to stop leaking lines into non-viewable space.
    this.gridLayer.clip({
      x: viewRect.x1,
      y: viewRect.y1,
      width: viewRect.x2 - viewRect.x1,
      height: viewRect.y2 - viewRect.y1,
    });

    // find the x & y size of the grid
    const xSize = gridFullRect.x2 - gridFullRect.x1,
      ySize = gridFullRect.y2 - gridFullRect.y1,
      // compute the number of steps required on each axis.
      xSteps = Math.round(xSize / stepSize),
      ySteps = Math.round(ySize / stepSize);

    // draw vertical lines
    for (let i = 0; i <= xSteps; i++) {
      this.gridLayer.add(
        new Line({
          x: gridFullRect.x1 + i * stepSize,
          y: gridFullRect.y1,
          points: [0, 0, 0, ySize],
          stroke: 'rgba(0, 0, 0, 0.2)',
          strokeWidth: 1,
          dash: [3, 3],
          name: shapeName.gridLine,
        })
      );
    }
    //draw Horizontal lines
    for (let i = 0; i <= ySteps; i++) {
      this.gridLayer.add(
        new Line({
          x: gridFullRect.x1,
          y: gridFullRect.y1 + i * stepSize,
          points: [0, 0, xSize, 0],
          stroke: 'rgba(0, 0, 0, 0.2)',
          strokeWidth: 1,
          dash: [3, 3],
          name: shapeName.gridLine,
        })
      );
    }
  }

  /**
   * Hide grid
   */
  hideGrid() {
    this.grid = false;
    this.setting.$toggleGridButton.classList.remove('active');
    this.contextMenu.$gridBtn.classList.remove('active');
    this._removeSnapGridEvents();
  }

  /**
   * Focus drawer div container (usefull for keyevent for example)
   */
  focus() {
    this.$drawerContainer.focus();
  }

  /**
   * Reset draw to default state (bgcolor, color, remove draw, etc.)
   */
  resetDraw() {
    this.options = defaultOptions;
  }
}
