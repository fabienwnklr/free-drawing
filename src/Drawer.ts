import './scss/drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Toolbar } from './components/toolbar/Toolbar';
import { Rect } from 'konva/lib/shapes/Rect';
import { AvailableTools } from './@types/toolbar';
import { ColorLike, DrawerOptions, OptionsChange, StrokeStyle, TextStyle } from './@types/drawer';
import { createId, deepMerge } from './utils/functions';
import { defaultOptions, gridSize, shapeName, zoomLimits } from './constants';
import { setPressed } from './utils/dom';
import { getStrokeStyle } from './utils/stroke';
import { Zoom } from './components/tools/Zoom/Zoom';
import { Position } from './components/tools/Position/Position';
import { Help } from './components/tools/Help/Help';
import { Collaboration } from './components/Collaboration/Collaboration';

import type { SelectWidget } from './components/toolbar/widgets/Select/Select';
import type { BaseWidget } from './components/toolbar/widgets/BaseWidget';

import { Settings } from './components/tools/Settings/Settings';
import { Node } from 'konva/lib/Node';
import MicroEvent from './utils/MicroEvent';
import { ConfirmModal } from './components/Modal/ConfirmModal';
import { UndoRedo } from './components/tools/UndoRedo/UndoRedo';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import { TextWidget } from './components/toolbar/widgets/Text/Text';
import { Line } from 'konva/lib/shapes/Line';
import { Toast } from './components/Toast/Toast';
import { Group } from 'konva/lib/Group';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Vector2d } from 'konva/lib/types';
import { AvailableTypes } from './@types/toast';
import type { Socket } from 'socket.io-client';
import { debounce } from './utils/perf';
import { HotKey } from './utils/HotKey';

// default id of each drawer of the page
let drawerCount = 0;

/**
 * Drawer constructor. A drawer is used to draw multiple shapes
 * @constructor
 * @memberof Drawer
 * @augments Drawer.MicroEvent
 *
 * @example
 * const drawer = new Drawer(document.getElementById('draw'), {
 *   width: 500,
 *   height: 800,
 * });
 */
export class Drawer extends MicroEvent {
  /** Collaboration socket, connected only with `collaboration` option */
  socket: Socket | null = null;
  /** Drawing changes sent to and received from other clients, with `collaboration` option */
  collaboration: Collaboration | null = null;
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
  position: Position | undefined;
  help: Help;
  setting: Settings;
  clearConfirmModal: ConfirmModal | null = null;
  clearStoredConfirmModal: ConfirmModal | null = null;

  debug: boolean = false;
  #saveFailed = false;
  #initialOptions: DrawerOptions;
  undoRedo: UndoRedo;
  /** Top left interface: settings menu, position */
  $headerContainer: HTMLDivElement;
  $footerContainer: HTMLElement;
  $footerLeftElement: HTMLDivElement;
  contextMenu: ContextMenu;
  grid: boolean = false;
  bgLayer: Layer;
  hotKey!: HotKey;

  constructor($el: HTMLDivElement, options: Partial<DrawerOptions> = {}) {
    super();
    this.$el = $el;

    const { widgets, ...otherOptions } = options;

    this.options = deepMerge<DrawerOptions>(
      {
        ...defaultOptions,
        // per instance, not when module is loaded
        id: 'drawer-' + ++drawerCount,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      otherOptions
    );
    // dash array of previous versions
    if (!options.strokeStyle && options.strokeDash) this.options.strokeStyle = getStrokeStyle(options.strokeDash);
    // list or object, replaces default list (not merged)
    if (widgets) this.options.widgets = widgets;
    // copy (setters replace values), restored by resetDrawer
    this.#initialOptions = { ...this.options, textStyle: { ...this.options.textStyle } };
    // Creating drawer container
    this.$drawerContainer = document.createElement('div');
    this.$drawerContainer.classList.add('drawer-container');
    // in tab order, keys go to drawer shortcuts (not to screen reader commands)
    this.$drawerContainer.tabIndex = 0;
    this.$drawerContainer.setAttribute('role', 'application');
    this.$drawerContainer.setAttribute('aria-label', 'Drawing board');

    this.$el.replaceChildren(this.$drawerContainer);

    const width = this.options.width;
    const height = this.options.height;
    let activeTool = this.options.tool ?? 'brush';

    if (width === document.documentElement.clientWidth && height === document.documentElement.clientHeight) {
      this.$drawerContainer.classList.add('is-full');

      const resizeObserver = new ResizeObserver(
        debounce(() => {
          this.setSize(document.documentElement.clientWidth, document.documentElement.clientHeight);
        }, 250)
      );

      //to attach to the whole document
      resizeObserver.observe(document.documentElement);
    }

    const stageSaved = this._loadSavedStage();
    let saved = false;
    if (stageSaved) {
      this.stage = stageSaved;
      this.stage.width(width);
      this.stage.height(height);
      this.bgLayer = this.stage.findOne('.background') as Layer;
      this.drawLayer = this.stage.findOne('.draw') as Layer;
      this.selectionLayer = this.stage.findOne('.selection') as Layer;
      // not interactive, saved as listening by previous versions
      this.bgLayer.listening(false);
      // grid layer only contains grid, it is rebuilt: previous versions saved lines and a clip
      // (view at save time) which hid grid outside of it after pan
      const savedGridLayer = this.stage.findOne('.grid') as Layer;
      this.grid = savedGridLayer.children.length > 0;
      savedGridLayer.destroy();
      this.gridLayer = new Layer({ name: 'grid', listening: false });
      this.stage.add(this.gridLayer);
      // between background and drawing
      this.gridLayer.zIndex(this.bgLayer.zIndex() + 1);
      // saved transformer, selection rectangle and guides are recreated by selection widget
      this.selectionLayer.destroyChildren();
      // draggable depends on active tool, set on its activation
      this.drawLayer.getChildren().forEach((shape) => {
        shape.draggable(false);
        // saves of previous versions
        if (!shape.id()) shape.id(createId());
      });
      this.background = this.bgLayer.findOne(`.${shapeName.background}`) as Rect;
      activeTool = (this._getStorageItem(this.options.localStorageKey + '-tool') as AvailableTools | null) ?? activeTool;
      saved = true;
    } else {
      this.stage = new Stage({
        container: this.$drawerContainer,
        width,
        height,
      });
      // Do not create more layer, if think it's necessary, maybe we should think about rethinking the logic
      // cf : https://konvajs.org/docs/performance/Layer_Management.html
      this.bgLayer = new Layer({ name: 'background', listening: false });
      this.gridLayer = new Layer({ name: 'grid', listening: false });
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
    this.$headerContainer = document.createElement('div');
    this.$headerContainer.classList.add('drawer-header-container');
    this.$drawerContainer.append(this.$headerContainer);

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
    if (this.options.positionWidget) {
      this.position = new Position(this);
    }
    this.undoRedo = new UndoRedo(this);

    if (saved) {
      this.undoRedo.saveState(true);
    }
    this.toolbar = new Toolbar(this);
    this.help = new Help(this);

    if (this.grid) this.showGrid();

    // initial (or saved) tool may not be in widgets option: first widget of toolbar
    const activeWidget = this.getWidget<BaseWidget>(activeTool) ?? this.toolbar.widgets.values().next().value;
    activeWidget?.setActive(true);

    this.$drawerContainer.appendChild(this.$footerContainer);
    this.focus();
    this.undoRedo.manageButtons();
    this._initEvents();

    if (this.options.collaboration) {
      this._initCollaboration()
        .then(() => this.toast('Collaboration available', 'info'))
        .catch((error) => {
          this.toast(`Collaboration unavailable: ${error.message}`, 'error');
        });
    }
  }

  /**
   * Connect to collaboration server, socket.io client is loaded only when `collaboration` option is enabled
   */
  private async _initCollaboration() {
    const { collaboration } = this.options;
    const { io } = await import('socket.io-client');

    // true: server on same origin, string: server url
    this.socket = typeof collaboration === 'string' ? io(collaboration) : io();
    this.collaboration = new Collaboration(this, this.socket);
  }

  /**
   * Pointer action of a widget ended: changes of collaborators received meanwhile are applied
   */
  _onActionEnd() {
    if (this.collaboration?.flush()) this.stage.fire('change');
  }

  /**
   * Get zoom level
   * @returns {number}
   */
  getZoomLevel(): number {
    return this.stage.scaleX();
  }

  /**
   * Set zoom level, limited from 10% to 3000%
   * @param {number} scale Zoom level (1 = 100%)
   * @param {Vector2d} point Absolute position that stays in place, stage center by default
   */
  setZoomLevel(scale: number, point: Vector2d = { x: this.stage.width() / 2, y: this.stage.height() / 2 }) {
    const oldScale = this.getZoomLevel();
    const newScale = Math.min(Math.max(scale, zoomLimits.min), zoomLimits.max);

    // point in stage coordinates
    const pointTo = {
      x: (point.x - this.stage.x()) / oldScale,
      y: (point.y - this.stage.y()) / oldScale,
    };

    this.stage.scale({ x: newScale, y: newScale });
    this.stage.position({
      x: point.x - pointTo.x * newScale,
      y: point.y - pointTo.y * newScale,
    });

    if (this.zoom) {
      this.zoom.update();
    } else {
      this._update();
    }
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
   * Add drawing shape to draw layer, draggable only with selection tool.
   * Every drawing shape must be added with this method (tools, history, collaboration...)
   * @param {Shape<ShapeConfig>} shape
   * @returns {Shape<ShapeConfig>} added shape
   */
  addShape<T extends Shape<ShapeConfig>>(shape: T): T {
    shape.draggable(this.activeTool === 'selection');
    // shape identity for collaboration (kept in history and saves)
    if (!shape.id()) shape.id(createId());
    this.drawLayer.add(shape);

    return shape;
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
   * Update bg position (grid is redrawn with stage) and position widget, after view move or zoom
   */
  _update() {
    this.bgLayer.position({ x: -this._unScale(this.stage.position().x), y: -this._unScale(this.stage.position().y) });
    this.position?.update();
  }

  private _initEvents() {
    this._initHotKey();
    this._initZoomWheel();
    this._initKeyboardFocus();

    this.stage.on('dragmove', (e) => {
      // shapes drag events bubble to stage, only stage drag (pan) moves the view
      if (e.target === this.stage) this._update();
    });

    this.stage.on('wheel', () => {
      this._update();
    });

    // shape moved, listened on layer so any shape is concerned (created, loaded, restored from history...)
    this.drawLayer.on('dragend.change', () => {
      this.stage.fire('change');
    });

    this.stage.on('change', () => {
      // collaborators changes received during a pointer action, then this one
      this.collaboration?.flush();
      this.collaboration?.send();

      if (this.options.autoSave) {
        this.save();
      }

      this.undoRedo.saveState();
      this.undoRedo.manageButtons();
      this.trigger('change', this);
    });
  }

  /**
   * Focus frame on drawer only when focused with keyboard (Tab, Escape from a menu).
   * Not with :focus-visible, which matches after programmatic focus (on load, after tool change...) for mouse users too.
   */
  private _initKeyboardFocus() {
    const $container = this.$drawerContainer;
    const className = 'drawer-keyboard-focus';
    // last key was a navigation key, not a shortcut or Enter validating a text
    let navigationKey = false;

    document.addEventListener('keydown', (e) => (navigationKey = e.key === 'Tab' || e.key === 'Escape'), true);
    document.addEventListener('pointerdown', () => (navigationKey = false), true);
    $container.addEventListener('focus', () => $container.classList.toggle(className, navigationKey));
    $container.addEventListener('blur', () => $container.classList.remove(className));
    $container.addEventListener('pointerdown', () => $container.classList.remove(className));
  }

  private _initHotKey() {
    this.hotKey = new HotKey(this);
  }

  /**
   * Get widget by name
   * @param {AvailableTools} name
   */
  getWidget<T>(name: AvailableTools): T | undefined {
    return this.toolbar.getWidget<T>(name);
  }

  _duringAction() {
    // pointer action of active tool (drawing, erasing, selecting...) or text edition
    return !!this.activeWidget?.inAction || !!this.getWidget<TextWidget>('text')?.isEditing;
  }

  private _initZoomWheel() {
    if (this.options.zoom) {
      this.stage.on('wheel', (e) => {
        if (!e.evt.ctrlKey) return;
        // stop default scrolling
        e.evt.preventDefault();

        const oldScale = this.getZoomLevel();
        // how to scale? Zoom in? Or zoom out?
        const newScale = e.evt.deltaY > 0 ? oldScale / this.options.scaling : oldScale * this.options.scaling;

        // keep point under cursor in place
        this.setZoomLevel(newScale, this._getPointerPos());
      });
    }
  }

  /**
   * Save current draw state to localstorage
   */
  save() {
    try {
      localStorage.setItem(this.options.localStorageKey, this.stage.toJSON());
      localStorage.setItem(this.options.localStorageKey + '-tool', this.activeTool);
    } catch (error) {
      // storage full or unavailable: drawing stays in page, warn only once
      if (!this.#saveFailed) {
        this.#saveFailed = true;
        this.toast(`Drawing can't be saved: ${(error as Error).message}`, 'warning');
      }
    }
  }

  /**
   * Read localStorage item, null if storage is unavailable (blocked cookies, sandboxed iframe...)
   * @param {string} key
   */
  private _getStorageItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Stage saved in localStorage, null if none or invalid (corrupted, other app data...)
   */
  private _loadSavedStage(): Stage | null {
    const json = this._getStorageItem(this.options.localStorageKey);

    if (!json) return null;

    try {
      const stage = Node.create(json, this.$drawerContainer);
      const required = ['.background', '.grid', '.draw', '.selection', `.${shapeName.background}`];

      if (stage instanceof Stage && required.every((selector) => stage.findOne(selector))) {
        return stage;
      }

      stage.destroy();
    } catch {
      // invalid JSON
    }

    console.warn(`[free-drawing] invalid saved data "${this.options.localStorageKey}" ignored`);
    return null;
  }

  /**
   * Change background color
   * @param {ColorLike} color
   */
  setBgColor(color: ColorLike) {
    // canvas background only, selected shapes fill is not changed
    this.background.fill(color);
    this.setting.updateBgColor(color);

    this.stage.fire('change');
  }

  /**
   * Notify overlays (and any listener) that options changed
   * @param {OptionsChange} change Changed options only
   */
  private _triggerOptionsChange(change: OptionsChange) {
    this.trigger('fd.options.change', change);
  }

  /**
   * Set color for draw
   * @param {ColorLike} color
   */
  setStrokeColor(color: ColorLike) {
    this.options.strokeColor = color;
    this.getWidget<SelectWidget>('selection')?.setColor(color);
    this._triggerOptionsChange({ strokeColor: color });
  }

  /**
   * Set background color of rectangles and ellipses (new and selected ones)
   * @param {ColorLike} color `'transparent'` for none
   */
  setFillColor(color: ColorLike) {
    this.options.fillColor = color;
    this.getWidget<SelectWidget>('selection')?.setFillColor(color);
    this._triggerOptionsChange({ fillColor: color });
  }

  /**
   * Set stroke width for draw
   * @param {Number | String} width
   */
  setStrokeWidth(width: string | number) {
    width = Number(width);

    this.options.strokeWidth = width;
    this.getWidget<SelectWidget>('selection')?.setStrokeWidth(width);
    this._triggerOptionsChange({ strokeWidth: width });
  }

  /**
   * Set stroke style of lines, arrows, rectangles and ellipses (new and selected ones)
   * @param {StrokeStyle} style 'solid', 'dashed' or 'dotted' (deprecated dash array gives 'dashed', undefined 'solid')
   */
  setStrokeStyle(style: StrokeStyle | number[] | undefined) {
    const strokeStyle = typeof style === 'string' ? style : getStrokeStyle(style);

    this.options.strokeStyle = strokeStyle;
    this.getWidget<SelectWidget>('selection')?.setStrokeStyle(strokeStyle);
    this._triggerOptionsChange({ strokeStyle });
  }

  /**
   * Set opacity of shape 0 to 1
   * @param opacity
   */
  setOpacity(opacity: number) {
    this.options.opacity = opacity;
    this.getWidget<SelectWidget>('selection')?.setOpacity(opacity);
    this._triggerOptionsChange({ opacity });
  }

  /**
   * Set text style (font family, size, style, decoration, align) of new and selected text
   * @param {Partial<TextStyle>} style
   */
  setTextStyle(style: Partial<TextStyle>) {
    this.options.textStyle = { ...this.options.textStyle, ...style };
    this.getWidget<SelectWidget>('selection')?.setTextStyle(style);
    this._triggerOptionsChange({ textStyle: style });
  }

  /**
   * Show toast message for user
   *
   * @param message Message to show
   * @param type Type of toast
   * @returns {Toast}
   */
  toast(message: string, type?: AvailableTypes, timeout?: number, showIcon?: boolean): Toast {
    const toast = new Toast(this, message, type, timeout, showIcon);

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
    // on drawer container, other drawers of the page are not concerned
    this.$drawerContainer.style.setProperty('--drawer-pointer-events', state);
  }

  /**
   * Clear canvas draw
   * @param force Force clear (don't show confirm modal)
   */
  clearCanvas(force: boolean = false) {
    if (!force) {
      if (!this.clearConfirmModal) {
        this.clearConfirmModal = new ConfirmModal(this, {
          message: 'Are you sure to remove all canvas draw ?',
        });
      }
      this.clearConfirmModal.show();
    } else {
      const shapes = this.getDrawingShapes();

      if (!shapes.length) return;

      this.getWidget<SelectWidget>('selection')?.clearSelection();
      shapes.forEach((shape) => shape.destroy());
      this.stage.fire('change');
    }
  }

  /**
   * Remove localstorage data
   * @param force Force clear (don't show confirm modal)
   */
  clearStoredData(force: boolean = false) {
    if (!force) {
      if (!this.clearStoredConfirmModal) {
        this.clearStoredConfirmModal = new ConfirmModal(this, {
          message: 'Are you sure to remove all stored data ?',
          onConfirm: (modal) => {
            localStorage.removeItem(this.options.localStorageKey);
            modal.hide();
          },
        });
      }
      this.clearStoredConfirmModal.show();
    } else {
      localStorage.removeItem(this.options.localStorageKey);
    }
  }

  /**
   * Show grid
   */
  showGrid() {
    this.grid = true;
    setPressed(this.contextMenu.$gridBtn, true);
    setPressed(this.setting.$toggleGridButton, true);
    this._drawGrid();
    this._initSnapGridEvents();

    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget?.snapping) {
      selectWidget.toggleSnapping(false);
    }
  }

  private _initSnapGridEvents() {
    const selectWidget = this.getWidget<SelectWidget>('selection');

    // namespaced, object snapping and change saving also listen drag events of draw layer
    this.drawLayer.on('dragmove.grid', (e) => {
      if (e.target instanceof Shape) {
        if (e.target instanceof Line) return;
        e.target.position({
          x: Math.round(e.target.x() / gridSize) * gridSize,
          y: Math.round(e.target.y() / gridSize) * gridSize,
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

      return calc(oldPos, newPos);
    });

    function calc(oldPos: Vector2d, newPos: Vector2d) {
      const dist = Math.sqrt(Math.pow(newPos.x - oldPos.x, 2) + Math.pow(newPos.y - oldPos.y, 2));

      // do not do any snapping with new absolute position (pointer position)
      // is too far away from old position
      if (dist > 10) {
        return newPos;
      }

      const closestX = Math.round(newPos.x / gridSize) * gridSize;
      const diffX = Math.abs(newPos.x - closestX);

      const closestY = Math.round(newPos.y / gridSize) * gridSize;
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

    this.drawLayer.off('.grid');
  }

  private _unScale(val: number) {
    return val / this.getZoomLevel();
  }

  /**
   * Draw grid: one shape drawing lines of visible area, redrawn with stage (pan, zoom) without creating nodes
   */
  private _drawGrid() {
    this.gridLayer.destroyChildren();
    this.gridLayer.add(
      new Shape({
        name: shapeName.gridLine,
        stroke: 'rgba(0, 0, 0, 0.2)',
        strokeWidth: 1,
        dash: [3, 3],
        listening: false,
        sceneFunc: (ctx, shape) => {
          const scale = this.getZoomLevel();
          // visible area in stage coordinates
          const x1 = -this.stage.x() / scale;
          const y1 = -this.stage.y() / scale;
          const x2 = x1 + this.stage.width() / scale;
          const y2 = y1 + this.stage.height() / scale;
          // lines start on grid, so dashes don't move with view
          const startX = Math.floor(x1 / gridSize) * gridSize;
          const startY = Math.floor(y1 / gridSize) * gridSize;

          // one stroke per line: browsers optimize dashes of a straight line, not of a path with many lines
          const strokeLine = (fromX: number, fromY: number, toX: number, toY: number) => {
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.strokeShape(shape);
          };

          for (let x = startX; x <= x2; x += gridSize) strokeLine(x, startY, x, y2);
          for (let y = startY; y <= y2; y += gridSize) strokeLine(startX, y, x2, y);
        },
      })
    );
  }

  /**
   * Hide grid
   */
  hideGrid() {
    this.grid = false;
    setPressed(this.setting.$toggleGridButton, false);
    setPressed(this.contextMenu.$gridBtn, false);
    this.gridLayer.destroyChildren();
    this._removeSnapGridEvents();
  }

  /**
   * Focus drawer div container (usefull for keyevent for example)
   */
  focus() {
    this.$drawerContainer.focus();
  }

  /**
   * Reset drawer to its initial state: remove drawing (without confirmation), white background
   * and drawing options given on init (color, width, opacity, text style...)
   */
  resetDrawer() {
    const { strokeColor, fillColor, strokeWidth, strokeStyle, opacity, textStyle } = this.#initialOptions;

    this.clearCanvas(true);
    this.setBgColor('#fff');
    this.setStrokeColor(strokeColor);
    this.setFillColor(fillColor);
    this.setStrokeWidth(strokeWidth);
    this.setStrokeStyle(strokeStyle);
    this.setOpacity(opacity);
    this.setTextStyle({ ...textStyle });
  }

  setSize(width: number, height: number) {
    this.stage.size({ width, height });
  }
}
