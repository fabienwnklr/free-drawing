import '@/scss/drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Rect } from 'konva/lib/shapes/Rect';
import { AvailableTools } from '@/@types/toolbar';
import {
  ColorLike,
  DrawerOptions,
  DrawingShape,
  Edges,
  OptionsChange,
  ShapeOrder,
  StrokeStyle,
  TextStyle,
  Theme,
} from '@/@types/drawer';
import { createId, deepMerge } from '@/utils/functions';
import { defaultOptions, drawerEvents, gridSize, shapeLabels, shapeName, zoomLimits } from '@/constants';
import { setPressed } from '@/utils/dom';
import { getStrokeStyle } from '@/utils/stroke';
import { reorderShapes } from '@/utils/order';
import { setupHit } from '@/utils/hit';
import { I18n, type Language, type TranslationParams, getLanguage, languages } from '@/i18n/I18n';
import type { TranslationKey } from '@/i18n/en';
import { bindingAttrs, unbindMoved, updateBindings } from '@/utils/binding';
import {
  type DrawingFile,
  decodeLinkData,
  drawingFileExtension,
  encodeLinkData,
  parseDrawingFile,
  pickFile,
  saveFile,
} from '@/utils/drawingFile';
import { type ShapeState, getShapeState } from '@/components/tools/UndoRedo/History';
import { type ImageFormat, canvasToBlob, createPdf, getExportBox, renderCanvas, renderSvg } from '@/utils/export';
import { toHexColor } from '@/utils/color';
import { ExportModal } from '@/components/ExportModal/ExportModal';

export type ExportImageOptions = {
  /** Selected shapes only, when there is a selection (default true) */
  selected?: boolean;
  /** With background color (default true), pdf always has a background */
  background?: boolean;
  /** Dark mode colors (default false) */
  dark?: boolean;
  /** Pixel ratio of png and pdf (default 2) */
  scale?: number;
};
import { Zoom } from '@/components/tools/Zoom/Zoom';
import { Position } from '@/components/tools/Position/Position';
import { Help } from '@/components/tools/Help/Help';
import { Collaboration, type CollaborationSocket } from '@/components/Collaboration/Collaboration';
import { CollaborationModal } from '@/components/CollaborationModal/CollaborationModal';

import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';

import { Settings } from '@/components/tools/Settings/Settings';
import { Node } from 'konva/lib/Node';
import MicroEvent from '@/utils/MicroEvent';
import { ConfirmModal } from '@/components/Modal/ConfirmModal';
import { UndoRedo } from '@/components/tools/UndoRedo/UndoRedo';
import { ContextMenu } from '@/components/ContextMenu/ContextMenu';
import { SelectionMenu } from '@/components/SelectionMenu/SelectionMenu';
import { LayersPanel } from '@/components/LayersPanel/LayersPanel';
import { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { Line } from 'konva/lib/shapes/Line';
import { Toast } from '@/components/Toast/Toast';
import { Group } from 'konva/lib/Group';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Vector2d } from 'konva/lib/types';
import { AvailableTypes } from '@/@types/toast';
import { debounce } from '@/utils/perf';
import { HotKey } from '@/utils/HotKey';

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
  /** Drawing can't be modified by user (see `setReadOnly`) */
  readOnly: boolean = false;
  /** Widgets disabled by read only mode, enabled again after it */
  #readOnlyWidgets: BaseWidget[] = [];
  #toolBeforeReadOnly: BaseWidget | null = null;
  /** Collaboration socket, connected during a collaboration session */
  socket: CollaborationSocket | null = null;
  /** Collaboration session: drawing changes sent to and received from other users of a room */
  collaboration: Collaboration | null = null;
  collaborationModal: CollaborationModal | null = null;
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
  /** Menu next to selected shapes (`selectionMenu` option) */
  selectionMenu: SelectionMenu | undefined;
  /** Panel listing shapes (`layersPanel` option) */
  layersPanel: LayersPanel | undefined;
  /** Theme chosen ('system': device one), see `setTheme` */
  theme: Theme = 'light';
  /** Texts of interface, see `t` and `setLanguage` */
  i18n: I18n;
  /** Language chosen ('auto': browser one), see `setLanguage` */
  #languageChoice: Language | 'auto' = 'auto';
  /** Dark theme of device */
  #systemDark: MediaQueryList | undefined;
  help: Help;
  setting: Settings;
  clearConfirmModal: ConfirmModal | null = null;
  clearStoredConfirmModal: ConfirmModal | null = null;
  exportModal: ExportModal | null = null;

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
    // language chosen in menu (saved), else of options
    const savedLanguage = this._getStorageItem(this.options.localStorageKey + '-language');

    this.#languageChoice =
      savedLanguage === 'auto' || (savedLanguage && savedLanguage in languages)
        ? (savedLanguage as Language | 'auto')
        : this.options.language;
    this.i18n = new I18n(
      this.#languageChoice === 'auto' ? getLanguage() : this.#languageChoice,
      this.options.translations
    );
    this.$drawerContainer.lang = this.i18n.language;
    this.i18n.translate((t) => this.$drawerContainer.setAttribute('aria-label', t('drawer.label')));

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
        // ids: saves of previous versions
        this._setupShape(shape as DrawingShape);
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
    // actions on selection of selection widget
    if (this.options.selectionMenu && this.getWidget('selection')) {
      this.selectionMenu = new SelectionMenu(this);
    }
    if (this.options.layersPanel) {
      this.layersPanel = new LayersPanel(this);
    }
    this._initTheme();

    if (this.grid) this.showGrid();

    // initial (or saved) tool may not be in widgets option: first widget of toolbar
    const activeWidget = this.getWidget<BaseWidget>(activeTool) ?? this.toolbar.widgets.values().next().value;
    activeWidget?.setActive(true);

    this.$drawerContainer.appendChild(this.$footerContainer);
    this.focus();
    this.undoRedo.manageButtons();
    this._initEvents();

    this._loadFromLink();

    if (this.options.readOnly) this.setReadOnly(true);

    // room link (see `getCollaborationLink`), with id of user who shared it
    const [, room, invitedBy] = window.location.hash.match(/^#room=([\w-]+)(?:&by=([\w-]+))?$/) ?? [];

    if (this.options.collaboration && room) {
      if (this._getOwnerKey(room)) {
        // owner back in the room
        this.startCollaboration(room).catch((error) => {
          this.toast(this.t('toast.collaborationUnavailable', { error: error.message }), 'error');
        });
      } else {
        // invited user gives a name before joining
        this.showCollaboration(room, invitedBy);
      }
    }
  }

  /**
   * Read only: drawing can't be modified by user (tools except pan, shortcuts and menu items modifying drawing,
   * text edition), API methods still modify it
   * @param {boolean} readOnly
   */
  setReadOnly(readOnly: boolean) {
    if (readOnly === this.readOnly) return;

    this.readOnly = readOnly;

    if (readOnly) {
      const pan = this.getWidget<BaseWidget>('pan');

      this.getWidget<SelectWidget>('selection')?.clearSelection();
      this.#toolBeforeReadOnly = this.activeWidget ?? null;
      if (pan) pan.setActive(true);
      else this.activeWidget?.setActive(false);
      this.#readOnlyWidgets = [...this.toolbar.widgets.values()].filter((w) => w.id !== 'pan' && !w.isDisabled);
      this.#readOnlyWidgets.forEach((widget) => widget.setDisabled(true));
    } else {
      this.#readOnlyWidgets.forEach((widget) => widget.setDisabled(false));
      this.#readOnlyWidgets = [];
      this.#toolBeforeReadOnly?.setActive(true);
    }

    this.undoRedo.manageButtons();
    this.trigger(drawerEvents.readOnlyChange, readOnly);
  }

  /**
   * Right to draw of this user given or removed by owner of collaboration room
   */
  _onCollaborationRight(canEdit: boolean) {
    this.setReadOnly(!canEdit || this.options.readOnly);
    this.toast(this.t(canEdit ? 'toast.canDraw' : 'toast.viewOnly'), 'info');
  }

  /**
   * Start a live collaboration session in a room (`collaboration` option gives the server), current session is stopped
   * @param {string} room Room id, new room by default
   * @param {string} name Name shown to other users, saved for next sessions
   * @param {string} invitedBy Id of user who shared the link (see `getCollaborationLink`), shown to owner
   * @returns {Promise<string>} Link to join the room
   */
  async startCollaboration(room?: string, name: string = this.getUserName(), invitedBy?: string): Promise<string> {
    if (!this.options.collaboration) throw new Error('collaboration option is disabled');

    // new room: this user is its owner (secret kept for next sessions)
    const ownerKey = room ? this._getOwnerKey(room) : createId() + createId();

    room ??= createId();
    if (ownerKey) this._setOwnerKey(room, ownerKey);

    this.stopCollaboration();
    this.setUserName(name);
    this.socket = await this._createSocket();
    this.collaboration = new Collaboration(this, this.socket, {
      room,
      name,
      userId: this.getUserId(),
      ownerKey,
      invitedBy,
    });
    this.trigger(drawerEvents.collaborationChange);

    try {
      await this._connected(this.socket);
    } catch (error) {
      this.stopCollaboration();
      throw error;
    }

    const link = this.getCollaborationLink(room);

    // reloading page joins the room again, page url shared by this user is known as shared by them
    window.history.replaceState(null, '', link);
    this.trigger(drawerEvents.collaborationChange);

    return link;
  }

  /**
   * Stop live collaboration session (drawing is kept)
   */
  stopCollaboration() {
    if (!this.collaboration) return;

    this.collaboration.stop();
    this.collaboration = null;
    this.socket = null;
    // right to draw back
    this.setReadOnly(this.options.readOnly);
    if (window.location.hash.startsWith('#room=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    this.trigger(drawerEvents.collaborationChange);
  }

  /**
   * Link to join a room: current page with `#room=<id>&by=<user id>`, owner knows who shared it
   * @param {string} room Room id, room of current session by default
   */
  getCollaborationLink(room: string | undefined = this.collaboration?.room): string {
    const url = new URL(window.location.href);

    url.hash = room ? `room=${room}&by=${this.getUserId()}` : '';

    return url.toString();
  }

  /**
   * Live collaboration dialog: owner starts / stops session, shares link and QR code, gives rights;
   * other users give their name
   * @param {string} joinRoom Room of a link, joined once user gave a name
   * @param {string} invitedBy Id of user who shared the link
   */
  showCollaboration(joinRoom: string | null = null, invitedBy?: string) {
    this.collaborationModal ??= new CollaborationModal(this);
    this.collaborationModal.show(joinRoom, invitedBy);
  }

  /**
   * Id of this user in collaboration sessions (rights given by owners), kept in browser
   */
  getUserId(): string {
    const key = this.options.localStorageKey + '-user';
    let userId = this._getStorageItem(key);

    if (!userId) {
      userId = createId();
      try {
        localStorage.setItem(key, userId);
      } catch {
        // new id each session
      }
    }

    return userId;
  }

  /**
   * Secret of owner of a room created in this browser
   */
  private _getOwnerKey(room: string): string | undefined {
    try {
      return JSON.parse(this._getStorageItem(this.options.localStorageKey + '-owner') ?? '{}')[room];
    } catch {
      return undefined;
    }
  }

  private _setOwnerKey(room: string, ownerKey: string) {
    const key = this.options.localStorageKey + '-owner';

    try {
      const rooms = { ...JSON.parse(this._getStorageItem(key) ?? '{}'), [room]: ownerKey };

      // last rooms only
      localStorage.setItem(key, JSON.stringify(Object.fromEntries(Object.entries(rooms).slice(-20))));
    } catch {
      // owner for this session only
    }
  }

  /**
   * Name shown to other users in collaboration sessions
   */
  getUserName(): string {
    return this._getStorageItem(this.options.localStorageKey + '-name') ?? '';
  }

  /**
   * Change name shown to other users (current session and next ones)
   */
  setUserName(name: string) {
    name = name.trim().slice(0, 40);
    try {
      localStorage.setItem(this.options.localStorageKey + '-name', name);
    } catch {
      // not saved, kept for current session
    }
    if (this.collaboration && this.collaboration.name !== name) this.collaboration.setName(name);
  }

  /**
   * Resolved when socket is connected, rejected if server can't be reached (no retry)
   */
  private _connected(socket: CollaborationSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (error) => reject(new Error(`server unreachable (${error.message})`)));
    });
  }

  /**
   * Socket connected to collaboration server: true is page origin, string is server url
   * (socket.io client is loaded only then)
   */
  protected async _createSocket(): Promise<CollaborationSocket> {
    const { collaboration } = this.options;
    const { io } = await import('socket.io-client');
    // new connection for each session (no socket reused after stop)
    const options = { forceNew: true };

    return typeof collaboration === 'string' ? io(collaboration, options) : io(options);
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
  getDrawingShapes(): DrawingShape[] {
    // Return clone of array, else clean doesn't work
    return [...this.drawLayer.children] as DrawingShape[];
  }

  /**
   * Add drawing shape (or group) to draw layer, draggable only with selection tool.
   * Every drawing shape must be added with this method (tools, history, collaboration...)
   * @param {DrawingShape} shape
   * @returns {DrawingShape} added shape
   */
  addShape<T extends DrawingShape>(shape: T): T {
    shape.draggable(this.activeTool === 'selection');
    this._setupShape(shape);
    this.drawLayer.add(shape);

    return shape;
  }

  /**
   * Shape identity for collaboration and layers panel (kept in history and saves), also of shapes in groups (moved
   * with their group, not alone), hit region
   */
  private _setupShape(shape: DrawingShape) {
    if (!shape.id()) shape.id(createId());
    if (shape instanceof Group) {
      shape.find(() => true).forEach((node) => {
        if (!node.id()) node.id(createId());
        node.draggable(false);
      });
    }
    setupHit(shape);
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
    this.collaboration?.updateCursors();
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

    // moved or transformed shapes shown to collaborators while moving (selected ones move together)
    const sendLive = (target: unknown) => {
      const selected = this.getSelectedShapes();

      this.collaboration?.sendLive(
        selected.length ? selected : target instanceof Shape || target instanceof Group ? [target] : []
      );
    };

    this.drawLayer.on('dragmove.live', (e) => sendLive(e.target));
    this.getWidget<SelectWidget>('selection')?.transformer.on('transform.live', (e) => sendLive(e.target));

    // arrows linked to shapes follow them, unlinked when moved without them
    const transformer = this.getWidget<SelectWidget>('selection')?.transformer;

    this.drawLayer.on('dragstart.binding', (e) => {
      const selected = this.getSelectedShapes();

      unbindMoved(selected.includes(e.target as DrawingShape) ? selected : [e.target]);
    });
    this.drawLayer.on('dragmove.binding', () => updateBindings(this.drawLayer));
    transformer?.on('transformstart.binding', () => unbindMoved(transformer.nodes()));
    transformer?.on('transform.binding', () => updateBindings(this.drawLayer));
    this.stage.on('change', () => {
      // collaborators changes received during a pointer action, then this one
      this.collaboration?.flush();
      // arrows on their linked shapes before saving
      updateBindings(this.drawLayer);
      this.collaboration?.send();

      if (this.options.autoSave) {
        this.save();
      }

      this.undoRedo.saveState();
      this.undoRedo.manageButtons();
      this.trigger(drawerEvents.change, this);
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
        this.toast(this.t('toast.saveFailed', { error: (error as Error).message }), 'warning');
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
   * Drawing as file content (`.freedrawing` file, link): background color and drawing shapes
   */
  getDrawingFile(shapes: DrawingShape[] = this.getDrawingShapes()): DrawingFile {
    return {
      type: 'free-drawing',
      version: 1,
      background: this.background.fill() as ColorLike,
      shapes: shapes.map(getShapeState),
    };
  }

  /**
   * Drawing shapes selected with selection tool
   */
  getSelectedShapes(): DrawingShape[] {
    const nodes = this.getWidget<SelectWidget>('selection')?.transformer.nodes() ?? [];

    return nodes.filter((node): node is DrawingShape => node instanceof Shape || node instanceof Group);
  }

  /**
   * Copy shapes (selected ones by default) a little further, copies are selected
   * @param {DrawingShape[]} shapes
   * @returns {DrawingShape[]} copies, on top of drawing (change saved)
   */
  duplicateShapes(shapes: DrawingShape[] = this.getSelectedShapes()): DrawingShape[] {
    // same offset on screen whatever zoom
    const offset = 20 / this.getZoomLevel();
    const originals = shapes.filter((shape) => shape.getLayer()).sort((a, b) => a.zIndex() - b.zIndex());
    const copies = originals.map((shape) => {
      const state = getShapeState(shape);
      // new ids given by addShape
      const removeIds = ({ attrs, children }: ShapeState) => {
        delete attrs.id;
        children?.forEach(removeIds);
      };

      removeIds(state);
      const copy = this.addShape(Node.create(state) as DrawingShape);

      copy.move({ x: offset, y: offset });
      return copy;
    });
    // ids of copies, also of shapes of groups
    const nodes = (shape: DrawingShape) => [shape, ...(shape instanceof Group ? shape.find(() => true) : [])];
    const ids = new Map(
      originals.flatMap((shape, i) => nodes(shape).map((node, j) => [node.id(), nodes(copies[i])[j].id()]))
    );

    // copied arrows linked to copied shapes, unlinked from others
    copies.flatMap(nodes).forEach((node) => {
      bindingAttrs.forEach((attr) => {
        if (node.getAttr(attr)) node.setAttr(attr, ids.get(node.getAttr(attr)));
      });
    });

    if (copies.length) {
      this.getWidget<SelectWidget>('selection')?.select(copies);
      this.stage.fire('change');
    }

    return copies;
  }

  /**
   * Remove shapes (selected ones by default), removed from selection
   * @param {Shape<ShapeConfig>[]} shapes
   * @returns {boolean} true if a shape was removed (change saved)
   */
  deleteShapes(shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const removed = shapes.filter((shape) => shape.getLayer());
    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (!removed.length) return false;

    selectWidget?.select(this.getSelectedShapes().filter((shape) => !removed.includes(shape)));
    removed.forEach((shape) => {
      let parent = shape.getParent();

      shape.destroy();
      // empty groups removed
      while (parent instanceof Group && !parent.hasChildren()) {
        const group = parent;

        parent = group.getParent();
        group.destroy();
      }
    });
    this.stage.fire('change');

    return true;
  }

  /**
   * Group shapes (selected ones by default, 2 at least, of the same group): moved, transformed, hidden, locked,
   * ordered and named together. The group takes place of top shape and is selected
   * @param {DrawingShape[]} shapes
   * @returns {Group | null} group (change saved)
   */
  groupShapes(shapes: DrawingShape[] = this.getSelectedShapes()): Group | null {
    const parent = shapes[0]?.getParent();
    const members = [...shapes].sort((a, b) => a.zIndex() - b.zIndex());

    if (!parent || !this.canGroupShapes(shapes)) return null;

    // place of top shape once others are in group
    const index = members[members.length - 1].zIndex() - (members.length - 1);
    const group = new Group({ name: shapeName.group });

    members.forEach((member) => {
      member.draggable(false);
      member.moveTo(group);
    });
    if (parent === this.drawLayer) {
      this.addShape(group);
    } else {
      this._setupShape(group);
      parent.add(group);
    }
    group.zIndex(index);
    this.getWidget<SelectWidget>('selection')?.select([group]);
    this.stage.fire('change');

    return group;
  }

  /**
   * Shapes can be grouped: 2 at least, of the same group (or drawing)
   * @param {DrawingShape[]} shapes Selected shapes by default
   */
  canGroupShapes(shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const parent = shapes[0]?.getParent();

    return !!parent && shapes.length > 1 && shapes.every((shape) => shape.getParent() === parent);
  }

  /**
   * Ungroup groups (selected ones by default): their shapes take their place with the same look (transform,
   * hidden, locked) and are selected
   * @param {DrawingShape[]} shapes
   * @returns {DrawingShape[]} shapes of groups (change saved)
   */
  ungroupShapes(shapes: DrawingShape[] = this.getSelectedShapes()): DrawingShape[] {
    const groups = shapes.filter((shape): shape is Group => shape instanceof Group && !!shape.getParent());
    const ungrouped = groups.flatMap((group) => {
      const parent = group.getParent()!;
      const index = group.zIndex();
      const children = [...group.getChildren()] as DrawingShape[];

      children.forEach((child, i) => {
        // group transform applied to shape (no offset in drawing shapes)
        const transform = group.getTransform().copy().multiply(child.getTransform());

        child.setAttrs({ ...transform.decompose(), offsetX: 0, offsetY: 0 });
        if (!group.visible()) child.visible(false);
        if (!group.listening()) child.listening(false);
        if (group.opacity() !== 1) child.opacity(child.opacity() * group.opacity());
        child.moveTo(parent);
        child.zIndex(index + i);
        child.draggable(parent === this.drawLayer && this.activeTool === 'selection');
      });
      group.destroy();

      return children;
    });

    if (ungrouped.length) {
      this.getWidget<SelectWidget>('selection')?.select(ungrouped);
      this.stage.fire('change');
    }

    return ungrouped;
  }

  /**
   * Name of a shape (layers panel): name given by user, else first line of a text, else type of shape
   * @param {Shape<ShapeConfig>} shape
   */
  getShapeLabel(shape: DrawingShape): string {
    const text = shape.hasName(shapeName.text) ? String(shape.getAttr('text') ?? '').trim().split('\n')[0] : '';
    const type = Object.keys(shapeLabels).find((name) => shape.hasName(name));

    return shape.getAttr('label') || text || (type ? this.t(shapeLabels[type]) : shape.getClassName());
  }

  /**
   * Give a name to a shape (saved with it), an empty name gives back its default name
   * @param {Shape<ShapeConfig>} shape
   * @param {string} label
   * @returns {boolean} true if name changed (change saved)
   */
  setShapeLabel(shape: DrawingShape, label: string): boolean {
    const value = label.trim() || undefined;

    if (shape.getAttr('label') === value) return false;

    shape.setAttr('label', value);
    this.stage.fire('change');

    return true;
  }

  /**
   * Lock shapes (selected ones by default): not selected, moved nor erased on canvas
   * @param {boolean} locked
   * @param {Shape<ShapeConfig>[]} shapes
   * @returns {boolean} true if a shape changed (change saved)
   */
  setShapesLocked(locked: boolean, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    return this._setShapesState(
      shapes.filter((shape) => shape.listening() === locked),
      (shape) => shape.listening(!locked)
    );
  }

  /**
   * Hide shapes (selected ones by default): not drawn, selected nor exported
   * @param {boolean} hidden
   * @param {Shape<ShapeConfig>[]} shapes
   * @returns {boolean} true if a shape changed (change saved)
   */
  setShapesHidden(hidden: boolean, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    return this._setShapesState(
      shapes.filter((shape) => shape.visible() === hidden),
      (shape) => shape.visible(!hidden)
    );
  }

  private _setShapesState(changed: DrawingShape[], apply: (shape: DrawingShape) => void) {
    const shapes = changed.filter((shape) => shape.getLayer());
    const selected = this.getSelectedShapes();

    if (!shapes.length) return false;

    shapes.forEach(apply);
    // locked and hidden shapes are unselected
    if (shapes.some((shape) => selected.includes(shape))) this.getWidget<SelectWidget>('selection')?.select(selected);
    this.stage.fire('change');

    return true;
  }

  /**
   * Move shapes in stacking order: `forward` / `backward` above / below the next shape they overlap,
   * `front` / `back` above / below all shapes (relative order of moved shapes is kept)
   * @param {ShapeOrder} order
   * @param {Shape<ShapeConfig>[]} shapes Selected shapes by default
   * @returns {boolean} true if a shape moved (change saved)
   */
  reorderShapes(order: ShapeOrder, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const moved = reorderShapes(shapes, order);

    if (moved) this.stage.fire('change');

    return moved;
  }

  /**
   * Shapes to export: selected ones when there is a selection, else all drawing shapes
   * @param {boolean} selected Selected shapes only
   */
  getExportShapes(selected: boolean = true): DrawingShape[] {
    const selection = selected ? this.getSelectedShapes() : [];

    return selection.length ? selection : this.getDrawingShapes().filter((shape) => shape.visible());
  }

  /**
   * Drawing (or selected shapes) as png, svg or pdf image
   * @throws {Error} nothing to export
   */
  async exportImage(format: ImageFormat, options: ExportImageOptions = {}): Promise<Blob> {
    const image = this._prepareExport(format, options);

    if (!image) throw new Error('nothing to export');

    const { shapes, box, imageOptions } = image;
    const { scale } = imageOptions;

    if (format === 'svg') return new Blob([renderSvg(shapes, box, imageOptions)], { type: 'image/svg+xml' });

    const canvas = renderCanvas(shapes, box, imageOptions);

    if (format === 'png') return canvasToBlob(canvas);

    const jpeg = new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer());

    return createPdf(jpeg, canvas.width, canvas.height, scale);
  }

  /**
   * Drawing (or selected shapes) rendered on a canvas as exported in png, synchronous (preview), null if nothing to export
   */
  exportCanvas(options: ExportImageOptions = {}): HTMLCanvasElement | null {
    const image = this._prepareExport('png', options);

    return image && renderCanvas(image.shapes, image.box, image.imageOptions);
  }

  /**
   * Shapes, their box and image options of an export, null if nothing to export
   */
  private _prepareExport(format: ImageFormat, options: ExportImageOptions) {
    const { selected = true, background = true, dark = false, scale = 2 } = options;
    const shapes = this.getExportShapes(selected);
    const box = getExportBox(shapes, this.drawLayer);

    if (!box) return null;

    const color = background ? (this.background.fill() as string) : undefined;
    // pdf image (jpeg) has no transparency
    const imageOptions = {
      background: format === 'pdf' && !(color && toHexColor(color)) ? '#fff' : color,
      dark,
      scale,
    };

    return { shapes, box, imageOptions };
  }

  /**
   * Export dialog: preview, png, svg, pdf, drawing file, copy to clipboard
   */
  showExport() {
    this.exportModal ??= new ExportModal(this);
    this.exportModal.show();
  }

  /**
   * Replace drawing by a drawing file content, undo restores previous drawing
   * @param {DrawingFile | string} file Content or its JSON
   * @throws {Error} not a drawing file
   */
  loadDrawing(file: DrawingFile | string) {
    // validated: files and links can come from anyone
    const { background, shapes } = parseDrawingFile(typeof file === 'string' ? file : JSON.stringify(file));

    this.getWidget<SelectWidget>('selection')?.clearSelection();
    this.getDrawingShapes().forEach((shape) => shape.destroy());
    shapes.forEach((shape) => this.addShape(Node.create(shape) as Shape<ShapeConfig>));
    // fires change: history, saved, sent to collaborators
    this.setBgColor(background);
  }

  /**
   * Save drawing in a `.freedrawing` file, with browser save dialog when available (Chromium) else downloaded
   * @param {string} name File name without extension
   */
  async saveAs(name: string = 'drawing') {
    try {
      await saveFile(name + drawingFileExtension, JSON.stringify(this.getDrawingFile()));
    } catch (error) {
      // dialog canceled
      if ((error as Error).name !== 'AbortError') {
        this.toast(this.t('toast.saveFailed', { error: (error as Error).message }), 'error');
      }
    }
  }

  /**
   * Open a `.freedrawing` file chosen by user, it replaces drawing (undo restores it)
   */
  async open() {
    const content = await pickFile(`${drawingFileExtension},.json,application/json`);

    if (content === null) return;

    try {
      this.loadDrawing(content);
    } catch (error) {
      this.toast(this.t('toast.invalidFile', { error: (error as Error).message }), 'error');
    }
  }

  /**
   * Link to current page with drawing in its hash (`#<drawer id>=<data>`), no server needed
   */
  async getLink(): Promise<string> {
    const url = new URL(window.location.href);

    url.hash = `${this.options.id}=${await encodeLinkData(JSON.stringify(this.getDrawingFile()))}`;

    return url.toString();
  }

  /**
   * Copy link to drawing (see `getLink`) to clipboard
   */
  async copyLink() {
    try {
      // secure context (https) only
      if (!navigator.clipboard) throw new Error('clipboard unavailable');

      await navigator.clipboard.writeText(await this.getLink());
      this.toast(this.t('toast.linkCopied'), 'info');
    } catch (error) {
      this.toast(this.t('toast.linkNotCopied', { error: (error as Error).message }), 'warning');
    }
  }

  /**
   * Drawing of a link (see `getLink`) replaces saved one (undo restores it), removed from page url once loaded
   */
  private async _loadFromLink() {
    const prefix = `#${this.options.id}=`;

    if (!window.location.hash.startsWith(prefix)) return;

    try {
      this.loadDrawing(await decodeLinkData(window.location.hash.slice(prefix.length)));
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) {
      this.toast(this.t('toast.invalidLink', { error: (error as Error).message }), 'error');
    }
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
    this.trigger(drawerEvents.optionsChange, change);
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
   * Text of interface in current language
   * @param {TranslationKey} key
   * @param {TranslationParams} params Values of `{name}` placeholders
   */
  t(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }

  /**
   * Language of interface shown
   */
  get language(): Language {
    return this.i18n.language;
  }

  /**
   * Language chosen: 'auto' (browser one) or a language
   */
  get languageChoice(): Language | 'auto' {
    return this.#languageChoice;
  }

  /**
   * Set language of interface (saved for next visits): every text is translated at once
   * @param {Language | 'auto'} language 'en', 'fr', 'es', 'de' or 'auto' (browser one)
   */
  setLanguage(language: Language | 'auto') {
    this.#languageChoice = language;
    try {
      localStorage.setItem(this.options.localStorageKey + '-language', language);
    } catch {
      // storage unavailable: language kept for this visit
    }
    this.i18n.setLanguage(language === 'auto' ? getLanguage() : language);
    this.$drawerContainer.lang = this.i18n.language;
    this.trigger(drawerEvents.languageChange, this.i18n.language);
  }

  /**
   * Theme chosen in menu (saved) or by option, device theme followed with 'system'
   */
  private _initTheme() {
    const saved = this._getStorageItem(this.options.localStorageKey + '-theme') as Theme | null;

    this.#systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
    this.#systemDark?.addEventListener?.('change', () => {
      if (this.theme === 'system') this._applyTheme();
    });
    this.theme = saved && ['light', 'dark', 'system'].includes(saved) ? saved : this.options.theme;
    this._applyTheme();
  }

  private _applyTheme() {
    const dark = this.isDarkMode();

    this.$drawerContainer.classList.toggle('drawer-dark', dark);
    this.trigger(drawerEvents.themeChange, dark);
  }

  /**
   * Set theme (saved for next visits): in dark mode, drawing is shown with inverted colors, its colors are kept
   * @param {Theme} theme 'light', 'dark' or 'system' (device one)
   */
  setTheme(theme: Theme) {
    this.theme = theme;
    try {
      localStorage.setItem(this.options.localStorageKey + '-theme', theme);
    } catch {
      // storage unavailable: theme kept for this visit
    }
    this._applyTheme();
  }

  /**
   * Dark theme shown (chosen, or of device with 'system' theme)
   */
  isDarkMode(): boolean {
    return this.theme === 'dark' || (this.theme === 'system' && !!this.#systemDark?.matches);
  }

  /**
   * Switch between light and dark themes
   */
  toggleDarkMode() {
    this.setTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  /**
   * Set corners of rectangles (new and selected ones)
   * @param {Edges} edges 'sharp', 'round' (radius following rectangle size) or radius (px, 0 is sharp)
   */
  setEdges(value: Edges) {
    const edges = typeof value !== 'number' ? value : value > 0 ? Math.round(value * 100) / 100 : 'sharp';

    this.options.edges = edges;
    this.getWidget<SelectWidget>('selection')?.setEdges(edges);
    this._triggerOptionsChange({ edges });
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
      this.clearConfirmModal ??= new ConfirmModal(this);
      // current language
      this.clearConfirmModal.setMessage(this.t('confirm.clearCanvas'));
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
      this.clearStoredConfirmModal ??= new ConfirmModal(this, {
        onConfirm: (modal) => {
          localStorage.removeItem(this.options.localStorageKey);
          modal.hide();
        },
      });
      this.clearStoredConfirmModal.setMessage(this.t('confirm.clearStorage'));
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
    // applied by selection when anchor is not snapped to objects
    const gridAnchorBound = (oldPos: Vector2d, newPos: Vector2d) => {
      // do not snap if grid disabled
      if (!this.grid) {
        return newPos;
      }

      const dist = Math.sqrt(Math.pow(newPos.x - oldPos.x, 2) + Math.pow(newPos.y - oldPos.y, 2));

      // do not do any snapping with new absolute position (pointer position)
      // is too far away from old position
      if (dist > 10) {
        return newPos;
      }

      return calc(oldPos, newPos);
    };

    if (selectWidget) selectWidget.gridAnchorBound = gridAnchorBound;

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

    if (selectWidget) selectWidget.gridAnchorBound = null;
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
    const { strokeColor, fillColor, strokeWidth, strokeStyle, edges, opacity, textStyle } = this.#initialOptions;

    this.clearCanvas(true);
    this.setBgColor('#fff');
    this.setStrokeColor(strokeColor);
    this.setFillColor(fillColor);
    this.setStrokeWidth(strokeWidth);
    this.setStrokeStyle(strokeStyle);
    this.setEdges(edges);
    this.setOpacity(opacity);
    this.setTextStyle({ ...textStyle });
  }

  setSize(width: number, height: number) {
    this.stage.size({ width, height });
  }
}
