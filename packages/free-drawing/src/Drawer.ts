import '@/scss/drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Rect } from 'konva/lib/shapes/Rect';
import type { AvailableTools } from '@/@types/toolbar';
import type {
  ColorLike,
  DrawerOptions,
  DrawerStorage,
  DrawerUser,
  DrawingShape,
  Edges,
  OptionsChange,
  Preferences,
  ShapeOrder,
  StrokeStyle,
  TextStyle,
  Theme,
} from '@/@types/drawer';
import type { CollaborationOptions, CollaborationSocket } from '@/@types/collaboration';
import { createId, deepMerge } from '@/utils/functions';
import { defaultOptions, drawerEvents, gridSize, shapeLabels, shapeName, zoomLimits } from '@/constants';
import { setPressed } from '@/utils/dom';
import { getStrokeStyle } from '@/utils/stroke';
import { reorderShapes } from '@/utils/order';
import { rectContains, setupHit } from '@/utils/hit';
import { I18n, getLanguage, languages } from '@/i18n/I18n';
import type { Language, TranslationParams, TranslationKey } from '@/@types/i18n';
import { bindingAttrs, unbindMoved, updateBindings } from '@/utils/binding';
import { fitTextWidth, getTexts } from '@/utils/text';
import {
  decodeLinkData,
  drawingFileExtension,
  encodeLinkData,
  parseDrawingFile,
  pickFile,
  saveFile,
} from '@/utils/drawingFile';
import type { DrawingFile, ShapeState, ImageFormat, ExportImageOptions } from '@/@types/file';
import { getShapeState } from '@/components/tools/UndoRedo/History';
import { canvasToBlob, createPdf, getExportBox, renderCanvas, renderSvg } from '@/utils/export';
import { toHexColor } from '@/utils/color';
import { ExportModal } from '@/components/ExportModal/ExportModal';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { PreferencesModal } from '@/components/PreferencesModal/PreferencesModal';
import { DrawerLayout } from '@/DrawerLayout';
import {
  type Frame,
  drawAbove,
  findFrameAt,
  getFrameContent,
  getFrameShapes,
  getShapeFrame,
  isFrame,
  isShapesContainer,
  moveShapeTo,
  setFrameLabel,
} from '@/utils/frame';
import { FrameHighlight } from '@/utils/frameHighlight';
import { parseLink } from '@/utils/link';
import { ShapeLinks } from '@/utils/shapeLinks';
import type { FrameChanges } from '@/@types/shapes';

// types of options, storage, preferences and files, for apps using the drawer
export type {
  ColorLike,
  DrawerOptions,
  DrawerStorage,
  DrawerUser,
  DrawingShape,
  Edges,
  Preferences,
  ShapeOrder,
  StrokeStyle,
  TextStyle,
  Theme,
} from '@/@types/drawer';
export type { CollaborationOptions } from '@/@types/collaboration';
export type { DrawingFile, ExportImageOptions, ImageFormat, ShapeState } from '@/@types/file';
export type { LayoutItemOptions, LayoutRegion } from '@/@types/ui';
export type { FrameChanges } from '@/@types/shapes';
export type {
  AvailableTools,
  BrushWidgetOptions,
  PluginToolName,
  ToolbarWidgetName,
  WidgetGroupOptions,
  WidgetName,
  WidgetOptions,
  WidgetsOptions,
} from '@/@types/toolbar';
export type {
  CustomTranslations,
  Language,
  PluginTexts,
  PluginTranslations,
  TranslationKey,
  TranslationParams,
  Translations,
} from '@/@types/i18n';
export type {
  ListenedTarget,
  PluginClass,
  PluginCommand,
  PluginCommandMenu,
  PluginOptions,
  PluginRequirement,
  WidgetClass,
} from '@/@types/plugin';
// for plugins: their base, bases of widgets, events, names of shapes, buttons of their interface
export { Plugin } from '@/plugins/Plugin';
export { PluginCollection } from '@/plugins/PluginCollection';
export { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
export { ShapeWidget } from '@/components/toolbar/widgets/ShapeWidget';
// selection of shapes from code: `drawer.getWidget<SelectWidget>('selection')?.select(shapes)`
export type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
export { drawerEvents, shapeName } from '@/constants';
export { createButton, setLabel, setPressed } from '@/utils/dom';

import { Zoom } from '@/components/tools/Zoom/Zoom';
import { Position } from '@/components/tools/Position/Position';
import { Help } from '@/components/tools/Help/Help';
import { Collaboration } from '@/components/Collaboration/Collaboration';
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
import { LinkEditor } from '@/components/LinkEditor/LinkEditor';
import { PluginCollection } from '@/plugins/PluginCollection';
import { LayersPanel } from '@/components/LayersPanel/LayersPanel';
import { SaveButton } from '@/components/tools/SaveButton/SaveButton';
import type { TextWidget } from '@/components/toolbar/widgets/Text/Text';
import { Line } from 'konva/lib/shapes/Line';
import { Toast } from '@/components/Toast/Toast';
import { Group } from 'konva/lib/Group';
import { Text } from 'konva/lib/shapes/Text';
import { Shape, type ShapeConfig } from 'konva/lib/Shape';
import type { Vector2d } from 'konva/lib/types';
import type { AvailableTypes } from '@/@types/ui';
import { HotKey } from '@/utils/HotKey';

// default id of each drawer of the page
let drawerCount = 0;

/**
 * Infinite canvas drawing board created in an element: Konva stage of the drawing, toolbar and interface, public API.
 * Events of the drawer are listened with `on` (see `drawerEvents`).
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
  /** Active tool when read only mode started, active again after it */
  #toolBeforeReadOnly: BaseWidget | null = null;
  /** Collaboration socket, connected during a collaboration session */
  socket: CollaborationSocket | null = null;
  /** Collaboration session: drawing changes sent to and received from other users of a room */
  collaboration: Collaboration | null = null;
  /** Created on first use, see `showCollaboration` */
  collaborationModal: CollaborationModal | null = null;
  /** Element given to the constructor, holding the container of the drawer */
  $el: HTMLDivElement;
  /** Container of the drawer and regions of its interface, see `layout.add` */
  layout: DrawerLayout;
  /** Konva content of the stage (its canvases): cursor of active tool is set on it */
  $stageContainer: HTMLDivElement;
  /** Konva stage: background, grid, drawing and selection layers */
  stage: Stage;
  // Layers
  /** Grid shown with `showGrid` (not listening) */
  gridLayer: Layer;
  /** Drawing shapes, add them with `addShape` (named ' draw': select it with `.draw`) */
  drawLayer: Layer;
  /** Transient nodes: transformer, selection rectangle, snapping guides, cursors of collaborators */
  selectionLayer: Layer;
  /** Highlights of frames entered and left by moved shapes, in the selection layer */
  frameHighlight!: FrameHighlight;
  /** Icons of shapes having a link, in the selection layer (see `setShapeLink`) */
  shapeLinks!: ShapeLinks;
  /** Shapes being dragged or transformed: frames they come from, end of drawing above the drawing (`drawAbove`) */
  #moving: { shapes: DrawingShape[]; from: Map<DrawingShape, Frame | null>; drawInFrames: () => void } | null = null;
  /** Toolbar of the footer: widgets (tools) and their groups */
  toolbar: Toolbar;
  /** Id of active tool, see `activeWidget` */
  activeTool: AvailableTools = 'brush';
  /** Widget of active tool, set by `toolbar.setActiveWidget` (activate one with `widget.setActive(true)`) */
  activeWidget!: BaseWidget;
  /** Options given to the constructor merged with defaults, updated by setters (color, width...) and preferences */
  options: DrawerOptions;

  /** Background rectangle of the drawing, its color set with `setBgColor` */
  background: Rect;
  /** Zoom out, level (reset) and zoom in buttons (`zoomWidget` option) */
  zoom: Zoom | undefined;
  /** Position of view with a button back to origin (`positionWidget` option) */
  position: Position | undefined;
  /** Menu next to selected shapes (`selectionMenu` option) */
  selectionMenu: SelectionMenu | undefined;
  /** Link of selected shapes above them (with selection widget, see `setShapeLink`) */
  linkEditor: LinkEditor | undefined;
  /** Plugins of the drawer (`plugins` option): `get`, `has`, widgets and commands they added */
  plugins!: PluginCollection;
  /** Panel listing shapes (`layersPanel` option) */
  layersPanel: LayersPanel | undefined;
  /** Button of header saving the drawing while auto save is off (`saveButton` option) */
  saveButton: SaveButton | undefined;
  /** Theme chosen ('system': device one), see `setTheme` */
  theme: Theme = 'light';
  /** Texts of interface, see `t` and `setLanguage` */
  i18n: I18n;
  /** Language chosen ('auto': browser one), see `setLanguage` */
  #languageChoice: Language | 'auto' = 'auto';
  /** Dark theme of device */
  #systemDark: MediaQueryList | undefined;
  /** Help dialog (shortcuts, documentation links) and its footer button */
  help: Help;
  /** Settings menu of header: file actions, collaboration, view toggles, language, background color */
  setting: Settings;
  /** Confirmation of `clearCanvas`, created on first use */
  clearConfirmModal: ConfirmModal | null = null;
  /** Confirmation of `clearStoredData`, created on first use */
  clearStoredConfirmModal: ConfirmModal | null = null;
  /** Created on first use, see `showExport` */
  exportModal: ExportModal | null = null;
  /** Created on first use, see `showCommandPalette` */
  commandPalette: CommandPalette | null = null;
  /** Created on first use, see `showPreferences` */
  preferencesModal: PreferencesModal | null = null;

  /** Development messages: collaboration connection logged, toast when shapes are moved without selection tool */
  debug: boolean = false;
  /** Last save failed: its error was shown once, "saved" toast not shown */
  #saveFailed = false;
  /** Drawing of `storage` option loaded (on init, see `ready`, or with `loadFromStorage`), else not saved */
  #storageLoaded = false;
  /** Save in storage in progress, another one after it */
  #saving: Promise<void> | null = null;
  /** Drawing changed during a save in storage: saved again once it ends */
  #saveAgain = false;
  /** Resolved once drawing of `storage` option is loaded (rejected if it can't be) and plugins are initialized */
  ready: Promise<void>;
  /** See `user` option and `setUser` */
  #user: DrawerUser | null = null;
  /** Name given by user for this visit (collaboration dialog) */
  #userName: string | undefined;
  /** Last preferences notified, one check for several changes */
  #preferences = '';
  /** Changes not saved yet, see `hasUnsavedChanges` */
  #unsaved = false;
  /** Preferences check planned in a microtask (see `_preferencesChanged`) */
  #preferencesCheck = false;
  /** Options given on init, restored by `resetDrawer` */
  #initialOptions: DrawerOptions;
  /** History of drawing (undo / redo) and its footer buttons */
  undoRedo: UndoRedo;
  /** Menu of right click on drawing */
  contextMenu: ContextMenu;
  /** Grid shown (see `showGrid`, `hideGrid`), shapes snapped to it */
  grid: boolean = false;
  /** Layer of background rectangle, first one (not listening), moved with the view */
  bgLayer: Layer;
  /** Keyboard shortcuts of the drawer (keydown on its container) */
  hotKey!: HotKey;

  /**
   * Create a drawer in an element: its content is replaced by the drawer
   * @param $el Element of the drawer
   * @param options Options merged with `defaultOptions` (`widgets` replaces default list)
   */
  constructor($el: HTMLDivElement, options: Partial<DrawerOptions> = {}) {
    super();
    this.$el = $el;

    const { widgets, ...otherOptions } = options;

    this.options = deepMerge<DrawerOptions>(
      {
        ...defaultOptions,
        // per instance, not when module is loaded
        id: `drawer-${++drawerCount}`,
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
    this.#user = this.options.user;
    // preferences saved in browser, else options
    const preferences = this._readPreferences();

    this.#languageChoice = preferences.language ?? this.options.language;
    this.options.autoSave = preferences.autoSave ?? this.options.autoSave;
    this.options.keepTool = preferences.keepTool ?? this.options.keepTool;
    this.i18n = new I18n(
      this.#languageChoice === 'auto' ? getLanguage() : this.#languageChoice,
      this.options.translations
    );
    // container in drawer element, regions of interface
    this.layout = new DrawerLayout(this);

    const width = this.options.width;
    const height = this.options.height;
    let activeTool = this.options.tool ?? 'brush';

    // drawing of storage option loaded once drawer is created
    const stageSaved = this.options.storage ? null : this._loadSavedStage();
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
      activeTool =
        (this._getStorageItem(`${this.options.localStorageKey}-tool`) as AvailableTools | null) ?? activeTool;
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
    this.layout.setStage(this.stage);
    // before the toolbar and help: widgets and texts of plugins
    this.plugins = new PluginCollection(this);
    this.plugins._create(this.options.plugins);

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
    // after the selection menu: placed out of it
    if (this.getWidget('selection')) this.linkEditor = new LinkEditor(this);
    if (this.options.layersPanel) {
      this.layersPanel = new LayersPanel(this);
    }
    if (this.options.saveButton) {
      this.saveButton = new SaveButton(this);
    }
    this._initTheme(preferences.theme);

    this.grid = preferences.grid ?? this.grid;
    if (this.grid) this.showGrid();
    // grid and snapping exclude each other
    else if (preferences.snapping) this.getWidget<SelectWidget>('selection')?.toggleSnapping(true);
    if (preferences.zen) this.setting.toggleZenMode();

    // initial (or saved) tool may not be in widgets option: first widget of toolbar
    const activeWidget = this.getWidget<BaseWidget>(activeTool) ?? this.toolbar.widgets.values().next().value;
    activeWidget?.setActive(true);

    // dialogs, toasts... after footer
    this.layout.ready();
    this.focus();
    this.undoRedo.manageButtons();
    this._initEvents();
    // drawer created: commands, listeners of plugins (read only after: plugins may listen to it)
    this.plugins._init();

    if (this.options.readOnly) this.setReadOnly(true);

    if (this.options.storage) {
      this.ready = this.loadFromStorage();
      // drawing of a link or room replaces stored one
      this.ready.then(
        () => this._openFromUrl(),
        () => this._openFromUrl()
      );
    } else {
      this.ready = Promise.resolve();
      this._openFromUrl();
    }
    // also plugins initialized (asynchronous init)
    this.ready = Promise.all([this.ready, this.plugins.ready]).then(() => undefined);
    this.#preferences = JSON.stringify(this.getPreferences());
    // drawing as loaded (grid of preferences...)
    this.#unsaved = false;
    // changes not saved (without auto save): page not left without warning
    window.addEventListener('beforeunload', (e) => {
      if (this.#unsaved && !this.options.autoSave && this.$drawerContainer.isConnected) e.preventDefault();
    });
  }

  /**
   * Drawing of a link, or room of a collaboration link
   */
  private _openFromUrl() {
    this._loadFromLink();

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
   * @param readOnly True disables tools modifying drawing (pan activated), false enables them and the previous tool
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
      // pan and laser do not change drawing
      this.#readOnlyWidgets = [...this.toolbar.widgets.values()].filter(
        (w) => w.id !== 'pan' && w.id !== 'laser' && !w.isDisabled
      );
      for (const widget of this.#readOnlyWidgets) widget.setDisabled(true);
    } else {
      for (const widget of this.#readOnlyWidgets) widget.setDisabled(false);
      this.#readOnlyWidgets = [];
      this.#toolBeforeReadOnly?.setActive(true);
    }

    this.undoRedo.manageButtons();
    this.trigger(drawerEvents.readOnlyChange, readOnly);
  }

  /**
   * Right to draw of this user given or removed by owner of collaboration room
   * @param canEdit True when this user may draw (still read only with `readOnly` option), told in a toast
   */
  _onCollaborationRight(canEdit: boolean) {
    this.setReadOnly(!canEdit || this.options.readOnly);
    this.toast(this.t(canEdit ? 'toast.canDraw' : 'toast.viewOnly'), 'info');
  }

  /**
   * Start a live collaboration session in a room (`collaboration` option gives the server), current session is stopped
   * @param room Room id, new room by default
   * @param name Name shown to other users, saved for next sessions
   * @param invitedBy Id of user who shared the link (see `getCollaborationLink`), shown to owner
   * @returns Link to join the room
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
   * @param room Room id, room of current session by default
   * @returns Url of current page with room hash, without hash when there is no room
   */
  getCollaborationLink(room: string | undefined = this.collaboration?.room): string {
    const url = new URL(window.location.href);

    // id known by server in a session
    url.hash = room ? `room=${room}&by=${this.collaboration?.userId || this.getUserId()}` : '';

    return url.toString();
  }

  /**
   * Live collaboration dialog: owner starts / stops session, shares link and QR code, gives rights;
   * other users give their name
   * @param joinRoom Room of a link, joined once user gave a name
   * @param invitedBy Id of user who shared the link
   */
  showCollaboration(joinRoom: string | null = null, invitedBy?: string) {
    this.collaborationModal ??= new CollaborationModal(this);
    this.collaborationModal.show(joinRoom, invitedBy);
  }

  /**
   * User of the app (`user` option), null for anonymous user
   */
  get user(): DrawerUser | null {
    return this.#user;
  }

  /**
   * User logged in or out: their id is used by next collaboration sessions, their name at once
   * @param user null for anonymous user (id and name kept in browser)
   */
  setUser(user: DrawerUser | null) {
    this.#user = user;
    // name of new user, unless given in dialog
    this.#userName = undefined;

    const name = this.getUserName();

    if (this.collaboration && this.collaboration.name !== name) this.collaboration.setName(name);
  }

  /**
   * Id of this user in collaboration sessions (rights given by owners): of `user` option, else kept in browser
   * @returns Id of the user, or a new one saved in localStorage (new each session if storage is unavailable)
   */
  getUserId(): string {
    if (this.#user) return this.#user.id;

    const key = `${this.options.localStorageKey}-user`;
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
   * @param room Room id
   * @returns Owner key kept for this room, undefined if this browser did not create it
   */
  private _getOwnerKey(room: string): string | undefined {
    try {
      return JSON.parse(this._getStorageItem(`${this.options.localStorageKey}-owner`) ?? '{}')[room];
    } catch {
      return undefined;
    }
  }

  /**
   * Keep secret of owner of a room in browser (20 last rooms), owner again when coming back to it
   * @param room Room id
   * @param ownerKey Secret proving to the server that this user owns the room
   */
  private _setOwnerKey(room: string, ownerKey: string) {
    const key = `${this.options.localStorageKey}-owner`;

    try {
      const rooms = { ...JSON.parse(this._getStorageItem(key) ?? '{}'), [room]: ownerKey };

      // last rooms only
      localStorage.setItem(key, JSON.stringify(Object.fromEntries(Object.entries(rooms).slice(-20))));
    } catch {
      // owner for this session only
    }
  }

  /**
   * Name shown to other users in collaboration sessions: given for this visit, else of `user` option, else kept in browser
   * @returns User name, empty string if none was given
   */
  getUserName(): string {
    return this.#userName ?? this.#user?.name ?? this._getStorageItem(`${this.options.localStorageKey}-name`) ?? '';
  }

  /**
   * Change name shown to other users (current session and next ones)
   * @param name New name, trimmed and cut to 40 characters
   */
  setUserName(name: string) {
    name = name.trim().slice(0, 40);
    this.#userName = name;
    try {
      localStorage.setItem(`${this.options.localStorageKey}-name`, name);
    } catch {
      // not saved, kept for current session
    }
    if (this.collaboration && this.collaboration.name !== name) this.collaboration.setName(name);
  }

  /**
   * Resolved when socket is connected, rejected if server can't be reached (no retry)
   * @param socket Socket of the collaboration session being started
   * @returns Promise resolved on connection, rejected with the connection error
   */
  private _connected(socket: CollaborationSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (error) => reject(new Error(`server unreachable (${error.message})`)));
    });
  }

  /**
   * Socket connected to collaboration server: true is page origin, string is server url, options give url and
   * data read by server on connection (socket.io client is loaded only then)
   * @returns New socket (new connection each session), connecting
   */
  protected async _createSocket(): Promise<CollaborationSocket> {
    const { collaboration } = this.options;
    const { url, auth }: CollaborationOptions =
      typeof collaboration === 'object'
        ? collaboration
        : { url: typeof collaboration === 'string' ? collaboration : '' };
    const { io } = await import('socket.io-client');
    // new connection for each session (no socket reused after stop)
    const options = { forceNew: true, ...(auth && { auth }) };

    return url ? io(url, options) : io(options);
  }

  /**
   * Pointer action of a widget ended: changes of collaborators received meanwhile are applied
   */
  _onActionEnd() {
    if (this.collaboration?.flush()) this.stage.fire('change');
  }

  /**
   * Get zoom level
   * @returns Scale of the stage (1 = 100%)
   */
  getZoomLevel(): number {
    return this.stage.scaleX();
  }

  /**
   * Set zoom level, limited from 10% to 3000%
   * @param scale Zoom level (1 = 100%)
   * @param point Absolute position that stays in place, stage center by default
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
   * @returns Copy of the top nodes of draw layer (shapes and groups), bottom first
   */
  getDrawingShapes(): DrawingShape[] {
    // Return clone of array, else clean doesn't work
    return [...this.drawLayer.children] as DrawingShape[];
  }

  /**
   * Add drawing shape (or group) to draw layer, draggable only with selection tool.
   * Every drawing shape must be added with this method (tools, history, collaboration...)
   * @param shape Shape or group to add on top of drawing, given an id if it has none
   * @returns added shape
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
   * @param shape Shape or group added to drawing, shapes of frames set up too
   */
  private _setupShape(shape: DrawingShape) {
    if (!shape.id()) shape.id(createId());
    if (isFrame(shape)) {
      // parts not moved alone, shapes of frame moved as other shapes
      shape.getChildren().forEach((part) => {
        if (!part.id()) part.id(createId());
        part.draggable(false);
      });
      getFrameShapes(shape).forEach((child) => {
        this._setupShape(child);
        child.draggable(this.activeTool === 'selection');
      });
    } else if (shape instanceof Group) {
      shape
        .find(() => true)
        .forEach((node) => {
          if (!node.id()) node.id(createId());
          node.draggable(false);
        });
    }
    setupHit(shape);
  }

  /**
   * Get all drawing shape by name
   * @param shapeType Shape type
   * @returns Top nodes of draw layer having the name of this type
   */
  getDrawingShapeByName(shapeType: keyof typeof shapeName): (Group | Shape<ShapeConfig>)[] {
    return this.drawLayer.children.filter((e) => e.hasName(shapeName[shapeType]));
  }

  /**
   * Pointer registered by stage: over canvas, or during a pointer action (konva forgets it when pointer leaves canvas)
   * @returns True when stage knows a pointer position
   */
  _hasPointer(): boolean {
    return this.stage._pointerPositions.length > 0 || this.stage._changedPointerPositions.length > 0;
  }

  /**
   * Pointer in drawing (view moved and zoomed), center of view when pointer is out of canvas (menu, keyboard)
   * @returns Position in drawing coordinates
   */
  _getRelativePointerPos(): Vector2d {
    return this.stage.getAbsoluteTransform().copy().invert().point(this._getPointerPos());
  }

  /**
   * Pointer in drawing coordinates (view moved and zoomed), for apps and plugins: center of the view when the pointer
   * is out of the canvas (menu, keyboard)
   * @returns Position of the pointer in the drawing
   */
  getPointerPosition(): Vector2d {
    return this._getRelativePointerPos();
  }

  /**
   * Pointer in view, center of view when pointer is out of canvas (menu, keyboard)
   * @returns Position relative to the stage container
   */
  _getPointerPos(): Vector2d {
    const pos = this._hasPointer() ? this.stage.getPointerPosition() : null;

    return pos ?? { x: this.stage.width() / 2, y: this.stage.height() / 2 };
  }

  /**
   * Update bg position (grid is redrawn with stage) and position widget, after view move or zoom
   */
  _update() {
    this.bgLayer.position({ x: -this._unScale(this.stage.position().x), y: -this._unScale(this.stage.position().y) });
    this.position?.update();
    this.collaboration?.updateCursors();
  }

  /**
   * Listen to shortcuts, zoom wheel, view moves, shape drags and transforms (frames, linked arrows, collaboration)
   * and drawing changes (`change` of stage: save, history, `drawer.change` event)
   */
  private _initEvents() {
    this._initHotKey();
    this._initZoomWheel();
    this._initKeyboardFocus();
    this._initFrameMoves();
    this.shapeLinks = new ShapeLinks(this);

    this.stage.on('dragmove', (e) => {
      // shapes drag events bubble to stage, only stage drag (pan) moves the view
      if (e.target === this.stage) this._update();
    });

    this.stage.on('wheel', () => {
      this._update();
    });

    // shape moved, listened on layer so any shape is concerned (created, loaded, restored from history...)
    // (frames entered or left: see `_initFrameMoves`)
    this.drawLayer.on('dragend.change', (e) => {
      const selected = this.getSelectedShapes();

      // moved shapes in frame containing them
      this.placeInFrames(selected.includes(e.target as DrawingShape) ? selected : [e.target as DrawingShape]);
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
      } else {
        this._setUnsaved(true);
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
    // konva prevents default of mouse down on canvas (no focus change): focus taken from the page (app bar...),
    // so shortcuts (Ctrl + A...) go to drawer
    this.$stageContainer.addEventListener('pointerdown', () => {
      if (!$container.contains(document.activeElement)) this.focus({ preventScroll: true });
    });
  }

  /**
   * Keyboard shortcuts on drawer container
   */
  private _initHotKey() {
    this.hotKey = new HotKey(this);
  }

  /**
   * Get widget by name
   * @param name Widget id
   * @returns Widget of the toolbar, undefined if it is not in toolbar
   */
  getWidget<T>(name: AvailableTools): T | undefined {
    return this.toolbar.getWidget<T>(name);
  }

  /**
   * Pointer action of active tool or text edition in progress: shortcuts and interface ignore keys and pointer
   * @returns True while an action or a text edition is in progress
   */
  _duringAction() {
    // pointer action of active tool (drawing, erasing, selecting...) or text edition
    return !!this.activeWidget?.inAction || !!this.getWidget<TextWidget>('text')?.isEditing;
  }

  /**
   * Ctrl + wheel zooms around pointer (`zoom` option), by `scaling` option
   */
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
   * Save drawing in `storage` option (once its drawing is loaded), else in localStorage
   * @returns Resolved once saved (errors are shown in a toast)
   */
  save(): Promise<void> {
    const { storage, localStorageKey } = this.options;

    this._setUnsaved(false);
    try {
      // tool of this browser
      localStorage.setItem(`${localStorageKey}-tool`, this.activeTool);
      if (!storage) localStorage.setItem(localStorageKey, this.stage.toJSON());
    } catch (error) {
      this._onSaveError(error as Error, 'warning');
    }

    // stored drawing not replaced before it is loaded (nor if it can't be)
    return storage && this.#storageLoaded ? this._saveToStorage(storage) : Promise.resolve();
  }

  /**
   * Save drawing (`save`) and tell it, from menu and command palette
   */
  async saveNow() {
    await this.save();
    if (!this.#saveFailed) this.toast(this.t('toast.saved'), 'info');
  }

  /**
   * Drawing has changes not saved yet: without auto save, until `save` (or `saveNow`)
   * @returns True when changes are not saved
   */
  hasUnsavedChanges(): boolean {
    return this.#unsaved;
  }

  /**
   * Save drawing on each change, or only with `save` / `saveNow` (preference): pending changes saved when enabled
   * @param autoSave True saves on each change, false marks changes unsaved until a save
   */
  setAutoSave(autoSave: boolean) {
    if (autoSave === this.options.autoSave) return;

    this.options.autoSave = autoSave;
    if (autoSave && this.#unsaved) this.save();
    this._preferencesChanged();
  }

  /**
   * Keep drawing tool after drawing a shape, else selection tool is activated, nothing selected (preference)
   * @param keepTool True keeps the drawing tool, false activates selection tool after each drawing
   */
  setKeepTool(keepTool: boolean) {
    if (keepTool === this.options.keepTool) return;

    this.options.keepTool = keepTool;
    this._preferencesChanged();
  }

  /**
   * Drawing has changes not saved or is saved: `drawer.unsaved.change` event when it changes
   * @param unsaved True when drawing has changes not saved, false once saved
   */
  private _setUnsaved(unsaved: boolean) {
    if (unsaved === this.#unsaved) return;

    this.#unsaved = unsaved;
    this.trigger(drawerEvents.unsavedChange, unsaved);
  }

  /**
   * One save at a time: changes made during a save are saved once it ends (last drawing only)
   * @param storage Storage of the app receiving the drawing file
   * @returns Promise of the save in progress, resolved once last changes are saved (errors shown in a toast)
   */
  private _saveToStorage(storage: DrawerStorage): Promise<void> {
    if (this.#saving) {
      this.#saveAgain = true;
      return this.#saving;
    }

    this.#saving = (async () => {
      do {
        this.#saveAgain = false;
        try {
          await storage.save(this.getDrawingFile());
          this.#saveFailed = false;
        } catch (error) {
          this._onSaveError(error as Error, 'error');
        }
      } while (this.#saveAgain);
      this.#saving = null;
    })();

    return this.#saving;
  }

  /**
   * Drawing stays in page, warned once until a save succeeds
   * @param error Error of the save, its message shown in the toast
   * @param type Toast type: warning for localStorage, error for app storage
   */
  private _onSaveError(error: Error, type: 'warning' | 'error') {
    if (this.#saveFailed) return;

    this.#saveFailed = true;
    this.toast(this.t('toast.saveFailed', { error: error.message }), type);
  }

  /**
   * Load drawing of `storage` option (on init, again after login...): it replaces drawing (kept if nothing is
   * stored), history starts from it, changes are saved in storage once it is loaded
   * @returns Rejected if drawing can't be loaded (shown in a toast): changes are not saved
   */
  async loadFromStorage(): Promise<void> {
    const { storage } = this.options;

    if (!storage) throw new Error('storage option is not set');

    this.#storageLoaded = false;
    this.$drawerContainer.setAttribute('aria-busy', 'true');
    try {
      const file = await storage.load();

      if (file) {
        this.loadDrawing(file);
        this.undoRedo.reset();
        this.undoRedo.manageButtons();
      }
      this.#storageLoaded = true;
      // drawing as stored
      this._setUnsaved(false);
    } catch (error) {
      this.toast(this.t('toast.loadFailed', { error: (error as Error).message }), 'error');
      throw error;
    } finally {
      this.$drawerContainer.removeAttribute('aria-busy');
    }
  }

  /**
   * Read localStorage item, null if storage is unavailable (blocked cookies, sandboxed iframe...)
   * @param key Key of the item
   * @returns Item value, null if missing or storage unavailable
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
   * @returns Stage created from saved JSON with its required layers, else null
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
   * @param shapes Shapes written in the file, all drawing shapes by default
   * @returns Drawing file with background color and states of shapes
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
   * @returns Nodes of the transformer, empty without selection widget
   */
  getSelectedShapes(): DrawingShape[] {
    const nodes = this.getWidget<SelectWidget>('selection')?.transformer.nodes() ?? [];

    return nodes.filter((node): node is DrawingShape => node instanceof Shape || node instanceof Group);
  }

  /**
   * Flip shapes (selected ones by default) around the center of their box, texts are still read from left to right
   * @param direction Horizontal mirrors left and right, vertical mirrors top and bottom
   * @param shapes Shapes to flip (frames ignored), selected shapes by default
   */
  flipShapes(direction: 'horizontal' | 'vertical', shapes: DrawingShape[] = this.getSelectedShapes()) {
    // frames are not flipped
    shapes = shapes.filter((shape) => !isFrame(shape));
    if (!shapes.length) return;

    const horizontal = direction === 'horizontal';
    const center = this._getCenter(shapes);
    // mirrored around an axis, in coordinates of its parent
    const mirror = (node: Node, axis: Vector2d) => {
      node.rotation(-node.rotation());
      if (horizontal) node.setAttrs({ x: 2 * axis.x - node.x(), scaleX: -node.scaleX() });
      else node.setAttrs({ y: 2 * axis.y - node.y(), scaleY: -node.scaleY() });
    };

    // arrows flipped without their shapes are unlinked
    unbindMoved(shapes);
    shapes.forEach((shape) => {
      mirror(shape, shape.getParent()!.getAbsoluteTransform().copy().invert().point(center));
      // texts mirrored again around their center: moved, still readable
      (shape instanceof Text ? [shape] : shape instanceof Group ? shape.find<Text>('Text') : []).forEach((text) => {
        const box = text.getClientRect({ relativeTo: text.getParent()! });

        mirror(text, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      });
    });
    this.stage.fire('change');
  }

  /**
   * Rotate shapes (selected ones by default) around the center of their box
   * @param angle Degrees, clockwise when positive (90: quarter turn right, -90: left)
   * @param shapes Shapes to rotate (frames ignored), selected shapes by default
   */
  rotateShapes(angle: number, shapes: DrawingShape[] = this.getSelectedShapes()) {
    // frames are not rotated
    shapes = shapes.filter((shape) => !isFrame(shape));
    if (!shapes.length || !angle) return;

    const center = this._getCenter(shapes);
    // no float noise in saved positions (box of rotated shapes)
    const round = (n: number) => Math.round(n * 1e6) / 1e6 || 0;

    // arrows rotated without their shapes are unlinked
    unbindMoved(shapes);
    shapes.forEach((shape) => {
      const transform = shape.getParent()!.getAbsoluteTransform();
      const [a, b, c, d] = transform.getMatrix();
      // in coordinates of its parent, which turns the other way when flipped
      const degrees = a * d - b * c < 0 ? -angle : angle;
      const radians = (degrees * Math.PI) / 180;
      // exact quarter turns
      const [cos, sin] = [Math.cos(radians), Math.sin(radians)].map((n) => Math.round(n * 1e12) / 1e12);
      const pivot = transform.copy().invert().point(center);
      const dx = shape.x() - pivot.x;
      const dy = shape.y() - pivot.y;

      shape.setAttrs({
        x: round(pivot.x + dx * cos - dy * sin),
        y: round(pivot.y + dx * sin + dy * cos),
        rotation: (shape.rotation() + degrees) % 360,
      });
    });
    this.stage.fire('change');
  }

  /**
   * Fit width of texts (selected ones by default, also texts of groups) to their content: box of their longest line,
   * lines no longer wrapped, text stays in place
   * @param shapes Shapes whose texts are fitted, selected shapes by default
   * @returns true if a text changed (change saved)
   */
  fitTextWidth(shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const changed = getTexts(shapes).filter(fitTextWidth);

    if (changed.length) this.stage.fire('change');

    return changed.length > 0;
  }

  /**
   * Center of the box of shapes (absolute position)
   * @param shapes Shapes whose client rects make the box
   * @returns Absolute position of the center of the box
   */
  private _getCenter(shapes: DrawingShape[]): Vector2d {
    const boxes = shapes.map((shape) => shape.getClientRect());
    const left = Math.min(...boxes.map((box) => box.x));
    const top = Math.min(...boxes.map((box) => box.y));

    return {
      x: (left + Math.max(...boxes.map((box) => box.x + box.width))) / 2,
      y: (top + Math.max(...boxes.map((box) => box.y + box.height))) / 2,
    };
  }

  /**
   * Copy image of selected shapes (whole drawing without selection) to clipboard: png image, or svg image and text
   * (pasted as svg code in editors), message shown
   * @param format Image format copied, png by default
   * @param options Export options (selection only, background, dark mode, scale)
   */
  async copyImage(format: 'png' | 'svg' = 'png', options: ExportImageOptions = {}) {
    try {
      // secure context (https) only
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('clipboard unavailable');

      // image promise: Safari needs clipboard write during the user action
      const image = this.exportImage(format, options);
      const items: Record<string, Promise<Blob>> = format === 'png'
        ? { 'image/png': image }
        : {
            'text/plain': image.then((blob) => new Blob([blob], { type: 'text/plain' })),
            ...(ClipboardItem.supports?.('image/svg+xml') && { 'image/svg+xml': image }),
          };

      await navigator.clipboard.write([new ClipboardItem(items)]);
      this.toast(this.t('toast.imageCopied'), 'info');
    } catch (error) {
      this.toast(this.t('toast.imageNotCopied', { error: (error as Error).message }), 'warning');
    }
  }

  /**
   * Copy shapes (selected ones by default) a little further, copies are selected
   * @param shapes Shapes to copy (removed ones ignored), selected shapes by default
   * @returns copies, on top of drawing (change saved)
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

      // copy of a shape of a group or frame: in drawing, at its place
      if (shape.getParent() !== this.drawLayer) {
        const transform = this.drawLayer.getAbsoluteTransform().copy().invert().multiply(shape.getAbsoluteTransform());

        copy.setAttrs(transform.decompose());
      }
      copy.move({ x: offset, y: offset });
      return copy;
    });
    // ids of copies, also of shapes of groups
    const nodes = (shape: DrawingShape): Node[] => [shape, ...(shape instanceof Group ? shape.find(() => true) : [])];
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
      // copies of shapes of a frame in it
      this.placeInFrames(copies);
      this.getWidget<SelectWidget>('selection')?.select(copies);
      this.stage.fire('change');
    }

    return copies;
  }

  /**
   * Remove shapes (selected ones by default), removed from selection
   * @param shapes Shapes to remove (groups left empty removed too), selected shapes by default
   * @returns true if a shape was removed (change saved)
   */
  deleteShapes(shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const removed = shapes.filter((shape) => shape.getLayer());
    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (!removed.length) return false;

    selectWidget?.select(this.getSelectedShapes().filter((shape) => !removed.includes(shape)));
    removed.forEach((shape) => {
      let parent = shape.getParent();

      shape.destroy();
      // empty groups removed (not content of a frame)
      while (parent instanceof Group && !isShapesContainer(parent, this.drawLayer) && !parent.hasChildren()) {
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
   * @param shapes Shapes to group, selected shapes by default
   * @returns group (change saved), null if shapes can't be grouped
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
   * @param shapes Selected shapes by default
   * @returns True for 2 shapes or more of the same parent, none of them a frame
   */
  canGroupShapes(shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const parent = shapes[0]?.getParent();

    // frames are not grouped
    return !!parent && shapes.length > 1 && shapes.every((shape) => shape.getParent() === parent && !isFrame(shape));
  }

  /**
   * Ungroup groups (selected ones by default): their shapes take their place with the same look (transform,
   * hidden, locked) and are selected
   * @param shapes Groups to ungroup (other shapes and frames ignored), selected shapes by default
   * @returns shapes of groups (change saved)
   */
  ungroupShapes(shapes: DrawingShape[] = this.getSelectedShapes()): DrawingShape[] {
    const groups = shapes.filter(
      (shape): shape is Group => shape instanceof Group && !isFrame(shape) && !!shape.getParent()
    );
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
   * @param shape Shape or group to name
   * @returns Label shown for the shape, in current language for a type of shape
   */
  getShapeLabel(shape: DrawingShape): string {
    // attributes read from node (konva types those of each class, not of a shape or group)
    const node: Node = shape;
    const text = shape.hasName(shapeName.text) ? String(node.getAttr('text') ?? '').trim() : '';
    const type = Object.keys(shapeLabels).find((name) => shape.hasName(name));

    // first line of a text
    return node.getAttr('label') || text.split('\n')[0] || (type ? this.t(shapeLabels[type]) : shape.getClassName());
  }

  /**
   * Give a name to a shape (saved with it), an empty name gives back its default name (frames: their title)
   * @param shape Shape or group to name
   * @param label New name, trimmed (empty removes it)
   * @param save Change saved (default true)
   * @returns true if name changed
   */
  setShapeLabel(shape: DrawingShape, label: string, save: boolean = true): boolean {
    // frames always have a name, their title
    const value = label.trim() || (isFrame(shape) ? this.t('shapes.frame') : undefined);
    const node: Node = shape;

    if (node.getAttr('label') === value && (!isFrame(shape) || label === value)) return false;

    if (isFrame(shape)) setFrameLabel(shape, value!);
    else node.setAttr('label', value);
    if (save) this.stage.fire('change');

    return true;
  }

  /**
   * Shapes (drawn, moved, transformed) put in the frame containing their center, or back in drawing out of frames.
   * Frames and shapes of groups are not concerned. Ends a move of shapes (`_endMove`): frames it highlighted fade out.
   * @param shapes Shapes drawn, moved or transformed
   * @returns frames entered and left by the shapes
   */
  placeInFrames(shapes: DrawingShape[]): FrameChanges {
    this._endMove();

    const frames = this.getDrawingShapes().filter(isFrame);
    const entered = new Set<Frame>();
    const left = new Set<Frame>();

    for (const shape of shapes.filter((shape) => this._isPlaceable(shape))) {
      const from = getShapeFrame(shape);
      const frame = findFrameAt(shape, frames);

      moveShapeTo(shape, frame ? getFrameContent(frame) : this.drawLayer);
      if (frame === from) continue;
      if (frame) entered.add(frame);
      if (from) left.add(from);
    }

    return { entered: [...entered], left: [...left] };
  }

  /**
   * Shape placed in frames by `placeInFrames`: not a frame nor a shape of a group
   * @param shape drawing shape
   * @returns true for a shape of the drawing or of a frame
   */
  private _isPlaceable(shape: DrawingShape) {
    return !isFrame(shape) && !!shape.getLayer() && isShapesContainer(shape.getParent(), this.drawLayer);
  }

  /**
   * Shapes dragged or transformed: drawn above the drawing while moved (not cut by their frame), frames they would
   * enter or leave once dropped highlighted (`frameHighlight`), placed in frames when dropped (`placeInFrames`)
   */
  private _initFrameMoves() {
    this.frameHighlight = new FrameHighlight(this.selectionLayer);

    const transformer = this.getWidget<SelectWidget>('selection')?.transformer;
    // dragged shape and the selected ones moved with it
    const moved = (target: unknown) => {
      const selected = this.getSelectedShapes();

      return selected.includes(target as DrawingShape) ? selected : [target as DrawingShape];
    };

    this.drawLayer.on('dragstart.frames', (e) => this._startMove(moved(e.target)));
    this.drawLayer.on('dragmove.frames', () => this._updateMove());
    transformer?.on('transformstart.frames', () => this._startMove(transformer.nodes() as DrawingShape[]));
    transformer?.on('transform.frames', () => this._updateMove());
  }

  /**
   * Move of shapes started (drag, transform): frames they come from kept, shapes of frames drawn above the drawing
   * @param shapes shapes moved (frames and shapes of groups ignored)
   */
  _startMove(shapes: DrawingShape[]) {
    // several shapes dragged together: one move
    if (this.#moving?.shapes.some((shape) => shape.isDragging())) return;
    if (this.getWidget<SelectWidget>('selection')?.transformer.isTransforming() && this.#moving) return;
    // move not ended (shape removed meanwhile...)
    this._endMove();

    const placeable = shapes.filter((shape) => this._isPlaceable(shape));

    this.#moving = {
      shapes: placeable,
      from: new Map(placeable.map((shape) => [shape, getShapeFrame(shape)])),
      drawInFrames: drawAbove(placeable, this.drawLayer),
    };
  }

  /**
   * Shapes moving: frames they would enter or leave if dropped now highlighted
   */
  _updateMove() {
    if (!this.#moving) return;

    const frames = this.getDrawingShapes().filter(isFrame);
    const entered = new Set<Frame>();
    const left = new Set<Frame>();

    for (const shape of this.#moving.shapes) {
      const from = this.#moving.from.get(shape) ?? null;
      const frame = findFrameAt(shape, frames);

      if (frame === from) continue;
      if (frame) entered.add(frame);
      if (from) left.add(from);
    }
    this.frameHighlight.show({ entered: [...entered], left: [...left] });
  }

  /**
   * Move of shapes ended: shapes drawn in their frame again (placed after by `placeInFrames`), highlights faded out
   */
  _endMove() {
    if (!this.#moving) return;

    this.#moving.drawInFrames();
    this.#moving = null;
    this.frameHighlight.fade();
  }

  /**
   * Frame drawn or resized: takes shapes of drawing entirely in it, gives back to drawing its shapes out of it
   * @param frame Frame drawn or resized
   */
  fitFrame(frame: Frame) {
    const box = frame.getClientRect();
    const left = getFrameShapes(frame).filter((shape) => findFrameAt(shape, [frame]) !== frame);

    for (const shape of left) moveShapeTo(shape, this.drawLayer);
    // shapes of drawing now inside, after the ones moved out
    const inside = this.getDrawingShapes().filter(
      (shape) => !isFrame(shape) && rectContains(box, shape.getClientRect())
    );

    for (const shape of inside) moveShapeTo(shape, getFrameContent(frame));
  }

  /**
   * Link of shapes (selected ones by default): web page or email address, opened from the link icon of the shape or from
   * the selection panel
   * @param link address (`https://` added without protocol, see `parseLink`), null or empty to remove the link
   * @param shapes Shapes linked (removed ones ignored), selected shapes by default
   * @returns true if a link changed (change saved), false for an invalid address (nothing changed)
   */
  setShapeLink(link: string | null, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const url = link?.trim() ? parseLink(link) : null;

    if (link?.trim() && !url) return false;

    const changed = shapes.filter((shape) => shape.getLayer() && this.getShapeLink(shape) !== url);

    for (const shape of changed) {
      const node: Node = shape;

      // attribute removed without link
      node.setAttr('link', url ?? undefined);
    }
    if (changed.length) this.stage.fire('change');

    return changed.length > 0;
  }

  /**
   * Link of a shape (see `setShapeLink`)
   * @param shape drawing shape, group or frame
   * @returns url of its link, null without one
   */
  getShapeLink(shape: DrawingShape): string | null {
    return parseLink(shape.attrs.link);
  }

  /**
   * Open the link of a shape: web page in a new tab, email address in the mail app
   * @param shape Shape with a link, first selected shape with one by default
   * @returns true if a link was opened
   */
  openShapeLink(shape = this.getSelectedShapes().find((s) => this.getShapeLink(s))): boolean {
    const link = shape && this.getShapeLink(shape);

    if (!link) return false;
    window.open(link, '_blank', 'noopener,noreferrer');

    return true;
  }

  /**
   * Lock shapes (selected ones by default): not moved, transformed nor erased on canvas, only selected to be unlocked
   * @param locked True locks shapes, false unlocks them
   * @param shapes Shapes to lock or unlock, selected shapes by default
   * @returns true if a shape changed (change saved)
   */
  setShapesLocked(locked: boolean, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    return this._setShapesState(
      shapes.filter((shape) => shape.listening() === locked),
      (shape) => shape.listening(!locked)
    );
  }

  /**
   * Hide shapes (selected ones by default): not drawn, selected nor exported
   * @param hidden True hides shapes, false shows them
   * @param shapes Shapes to hide or show, selected shapes by default
   * @returns true if a shape changed (change saved)
   */
  setShapesHidden(hidden: boolean, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    return this._setShapesState(
      shapes.filter((shape) => shape.visible() === hidden),
      (shape) => shape.visible(!hidden)
    );
  }

  /**
   * Lock or hide shapes of the drawing (not removed ones), selection updated, change saved
   * @param changed Shapes whose state changes
   * @param apply Changes the state of a shape
   * @returns true if a shape changed
   */
  private _setShapesState(changed: DrawingShape[], apply: (shape: DrawingShape) => void) {
    const shapes = changed.filter((shape) => shape.getLayer());
    const selected = this.getSelectedShapes();

    if (!shapes.length) return false;

    shapes.forEach(apply);
    // hidden shapes are unselected, locked ones stay selected only without others
    if (shapes.some((shape) => selected.includes(shape))) this.getWidget<SelectWidget>('selection')?.select(selected);
    this.stage.fire('change');

    return true;
  }

  /**
   * Move shapes in stacking order: `forward` / `backward` above / below the next shape they overlap,
   * `front` / `back` above / below all shapes (relative order of moved shapes is kept)
   * @param order Move: `forward`, `backward`, `front` or `back`
   * @param shapes Selected shapes by default
   * @returns true if a shape moved (change saved)
   */
  reorderShapes(order: ShapeOrder, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    const moved = reorderShapes(shapes, order);

    if (moved) this.stage.fire('change');

    return moved;
  }

  /**
   * Shapes to export: selected ones when there is a selection, else all drawing shapes
   * @param selected Selected shapes only
   * @returns Selected shapes, else visible drawing shapes
   */
  getExportShapes(selected: boolean = true): DrawingShape[] {
    const selection = selected ? this.getSelectedShapes() : [];

    return selection.length ? selection : this.getDrawingShapes().filter((shape) => shape.visible());
  }

  /**
   * Drawing (or selected shapes) as png, svg or pdf image
   * @param format Image format
   * @param options Export options (selection only, background, dark mode, scale)
   * @returns Image file of the format
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
   * @param options Export options (selection only, background, dark mode, scale)
   * @returns Canvas of the png image, null if nothing to export
   */
  exportCanvas(options: ExportImageOptions = {}): HTMLCanvasElement | null {
    const image = this._prepareExport('png', options);

    return image && renderCanvas(image.shapes, image.box, image.imageOptions);
  }

  /**
   * Shapes, their box and image options of an export, null if nothing to export
   * @param format Image format (pdf gets a white background when it has no color)
   * @param options Export options, defaults applied
   * @returns Shapes, box and rendering options, null if nothing to export
   */
  private _prepareExport(format: ImageFormat, options: ExportImageOptions) {
    const { selected = true, background = true, dark = false, scale = 2 } = options;
    const shapes = this.getExportShapes(selected);
    const box = getExportBox(shapes, this.drawLayer);

    if (!box) return null;

    const color = background ? (this.background.fill() as string) : undefined;
    // pdf image (jpeg) has no transparency
    const imageOptions = {
      /** Background color, none for a transparent image */
      background: format === 'pdf' && !(color && toHexColor(color)) ? '#fff' : color,
      /** Dark mode colors */
      dark,
      /** Pixel ratio of png and pdf */
      scale,
    };

    return {
      /** Shapes exported */
      shapes,
      /** Area of the image, around shapes */
      box,
      /** Rendering options */
      imageOptions,
    };
  }

  /**
   * Export dialog: preview, png, svg, pdf, drawing file, copy to clipboard
   */
  showExport() {
    this.exportModal ??= new ExportModal(this);
    this.exportModal.show();
  }

  /**
   * Command palette: search a tool or command available now and run it
   */
  showCommandPalette() {
    this.commandPalette ??= new CommandPalette(this);
    this.commandPalette.show();
  }

  /**
   * Preferences dialog: theme, language, zen mode, grid, snapping, name in collaboration sessions
   */
  showPreferences() {
    this.preferencesModal ??= new PreferencesModal(this);
    this.preferencesModal.show();
  }

  /**
   * Replace drawing by a drawing file content, undo restores previous drawing
   * @param file Content or its JSON
   * @throws {Error} not a drawing file
   */
  loadDrawing(file: DrawingFile | string) {
    // validated: files and links can come from anyone
    const { background, shapes } = parseDrawingFile(typeof file === 'string' ? file : JSON.stringify(file));

    this.getWidget<SelectWidget>('selection')?.clearSelection();
    for (const shape of this.getDrawingShapes()) shape.destroy();
    for (const shape of shapes) this.addShape(Node.create(shape) as Shape<ShapeConfig>);
    // fires change: history, saved, sent to collaborators
    this.setBgColor(background);
  }

  /**
   * Save drawing in a `.freedrawing` file, with browser save dialog when available (Chromium) else downloaded
   * @param name File name without extension
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
   * @returns Url of current page with compressed drawing file in its hash
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
   * @param color Color of the canvas background (change saved)
   */
  setBgColor(color: ColorLike) {
    // canvas background only, selected shapes fill is not changed
    this.background.fill(color);
    this.setting.updateBgColor(color);

    this.stage.fire('change');
  }

  /**
   * Notify overlays (and any listener) that options changed
   * @param change Changed options only
   */
  private _triggerOptionsChange(change: OptionsChange) {
    this.trigger(drawerEvents.optionsChange, change);
  }

  /**
   * Set color for draw
   * @param color Stroke color of new shapes, applied to selected ones
   */
  setStrokeColor(color: ColorLike) {
    this.options.strokeColor = color;
    this.getWidget<SelectWidget>('selection')?.setColor(color);
    this._triggerOptionsChange({ strokeColor: color });
  }

  /**
   * Set background color of rectangles and ellipses (new and selected ones)
   * @param color `'transparent'` for none
   */
  setFillColor(color: ColorLike) {
    this.options.fillColor = color;
    this.getWidget<SelectWidget>('selection')?.setFillColor(color);
    this._triggerOptionsChange({ fillColor: color });
  }

  /**
   * Set stroke width for draw
   * @param width Stroke width (px) of new shapes, applied to selected ones (string converted to number)
   */
  setStrokeWidth(width: string | number) {
    width = Number(width);

    this.options.strokeWidth = width;
    this.getWidget<SelectWidget>('selection')?.setStrokeWidth(width);
    this._triggerOptionsChange({ strokeWidth: width });
  }

  /**
   * Set stroke style of lines, arrows, rectangles and ellipses (new and selected ones)
   * @param style 'solid', 'dashed' or 'dotted' (deprecated dash array gives 'dashed', undefined 'solid')
   */
  setStrokeStyle(style: StrokeStyle | number[] | undefined) {
    const strokeStyle = typeof style === 'string' ? style : getStrokeStyle(style);

    this.options.strokeStyle = strokeStyle;
    this.getWidget<SelectWidget>('selection')?.setStrokeStyle(strokeStyle);
    this._triggerOptionsChange({ strokeStyle });
  }

  /**
   * Text of interface in current language
   * @param key Key of the text in translations
   * @param params Values of `{name}` placeholders
   * @returns Translated text with placeholders replaced
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
   * @param language 'en', 'fr', 'es', 'de' or 'auto' (browser one)
   */
  setLanguage(language: Language | 'auto') {
    this.#languageChoice = language;
    this.i18n.setLanguage(language === 'auto' ? getLanguage() : language);
    this.$drawerContainer.lang = this.i18n.language;
    this.trigger(drawerEvents.languageChange, this.i18n.language);
    this._preferencesChanged();
  }

  /**
   * Interface settings of user (e.g. saved by the app for its logged in user)
   * @returns Current theme, language choice, grid, snapping, zen mode, auto save and keep tool
   */
  getPreferences(): Preferences {
    return {
      theme: this.theme,
      language: this.#languageChoice,
      grid: this.grid,
      snapping: !!this.getWidget<SelectWidget>('selection')?.snapping,
      zen: this.setting.zenMode,
      autoSave: this.options.autoSave,
      keepTool: this.options.keepTool,
    };
  }

  /**
   * Apply interface settings (given ones only), one `drawer.preferences.change` event
   * @param preferences Grid wins when grid and snapping are both true
   */
  setPreferences({ theme, language, grid, snapping, zen, autoSave, keepTool }: Partial<Preferences>) {
    if (autoSave !== undefined) this.setAutoSave(autoSave);
    if (keepTool !== undefined) this.setKeepTool(keepTool);
    if (theme !== undefined && theme !== this.theme) this.setTheme(theme);
    if (language !== undefined && language !== this.#languageChoice) this.setLanguage(language);
    if (zen !== undefined && zen !== this.setting.zenMode) this.setting.toggleZenMode();
    if (snapping !== undefined) this.getWidget<SelectWidget>('selection')?.toggleSnapping(snapping);
    if (grid !== undefined && grid !== this.grid) {
      if (grid) this.showGrid();
      else this.hideGrid();
      // saved with drawing in localStorage
      this.stage.fire('change');
    }
  }

  /**
   * Preferences saved in browser, and choices of previous versions (`<key>-theme`, `<key>-language`)
   * @returns Valid saved preferences only, empty when none
   */
  private _readPreferences(): Partial<Preferences> {
    const key = this.options.localStorageKey;
    let saved: Record<string, unknown> = {};

    try {
      saved = JSON.parse(this._getStorageItem(`${key}-preferences`) ?? '{}') ?? {};
    } catch {
      // invalid data ignored
    }

    const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark' || value === 'system';
    const isLanguage = (value: unknown): value is Language | 'auto' =>
      typeof value === 'string' && (value === 'auto' || value in languages);
    // first valid one
    const theme = [saved.theme, this._getStorageItem(`${key}-theme`)].find(isTheme);
    const language = [saved.language, this._getStorageItem(`${key}-language`)].find(isLanguage);
    const preferences: Partial<Preferences> = { ...(theme && { theme }), ...(language && { language }) };

    (['grid', 'snapping', 'zen', 'autoSave', 'keepTool'] as const).forEach((name) => {
      if (typeof saved[name] === 'boolean') preferences[name] = saved[name];
    });

    return preferences;
  }

  /**
   * A preference may have changed: saved in browser, event once current code ends (several changes give one event)
   */
  _preferencesChanged() {
    // not while drawer is created
    if (!this.#preferences) return;

    try {
      localStorage.setItem(`${this.options.localStorageKey}-preferences`, JSON.stringify(this.getPreferences()));
    } catch {
      // storage unavailable: kept for this visit
    }
    if (this.#preferencesCheck) return;

    this.#preferencesCheck = true;
    queueMicrotask(() => {
      this.#preferencesCheck = false;

      const preferences = this.getPreferences();
      const json = JSON.stringify(preferences);

      if (json === this.#preferences) return;

      this.#preferences = json;
      this.trigger(drawerEvents.preferencesChange, preferences);
    });
  }

  /**
   * Theme chosen in menu (saved) or by option, device theme followed with 'system'
   * @param saved Theme of saved preferences, `theme` option when undefined
   */
  private _initTheme(saved?: Theme) {
    this.#systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
    this.#systemDark?.addEventListener?.('change', () => {
      if (this.theme === 'system') this._applyTheme();
    });
    this.theme = saved ?? this.options.theme;
    this._applyTheme();
  }

  /**
   * Show theme chosen (`drawer-dark` class on container), `drawer.theme.change` event
   */
  private _applyTheme() {
    const dark = this.isDarkMode();

    this.$drawerContainer.classList.toggle('drawer-dark', dark);
    this.trigger(drawerEvents.themeChange, dark);
  }

  /**
   * Set theme (saved for next visits): in dark mode, drawing is shown with inverted colors, its colors are kept
   * @param theme 'light', 'dark' or 'system' (device one)
   */
  setTheme(theme: Theme) {
    this.theme = theme;
    this._applyTheme();
    this._preferencesChanged();
  }

  /**
   * Dark theme shown (chosen, or of device with 'system' theme)
   * @returns True when dark theme is shown
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
   * @param value 'sharp', 'round' (radius following rectangle size) or radius (px, 0 is sharp)
   */
  setEdges(value: Edges) {
    const edges = typeof value !== 'number' ? value : value > 0 ? Math.round(value * 100) / 100 : 'sharp';

    this.options.edges = edges;
    this.getWidget<SelectWidget>('selection')?.setEdges(edges);
    this._triggerOptionsChange({ edges });
  }

  /**
   * Set opacity of shape 0 to 1
   * @param opacity Opacity of new shapes (0 transparent, 1 opaque), applied to selected ones
   */
  setOpacity(opacity: number) {
    this.options.opacity = opacity;
    this.getWidget<SelectWidget>('selection')?.setOpacity(opacity);
    this._triggerOptionsChange({ opacity });
  }

  /**
   * Set text style (font family, size, style, decoration, align) of new and selected text
   * @param style Changed properties only, merged with current text style
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
   * @param timeout Delay (ms) before it hides, 5000 by default, 0 keeps it shown
   * @param showIcon Show the icon of its type (default true)
   * @returns Toast shown
   */
  toast(message: string, type?: AvailableTypes, timeout?: number, showIcon?: boolean): Toast {
    const toast = new Toast(this, message, type, timeout, showIcon);

    toast.show();

    return toast;
  }

  /**
   * Interface panels receive pointer or not (`--drawer-pointer-events`)
   * @param state 'none' during pointer actions, 'all' after
   * @deprecated use `layout.setPointerEvents`
   */
  UIPointerEvents(state: 'all' | 'none') {
    this.layout.setPointerEvents(state);
  }

  /**
   * Container of the drawer: canvas and interface (`layout.$container`)
   */
  get $drawerContainer(): HTMLDivElement {
    return this.layout.$container;
  }

  /**
   * Header region of the layout (top left: settings menu, layers button, position)
   * @deprecated use `layout.add('header', $element)`
   */
  get $headerContainer(): HTMLDivElement {
    return this.layout.$header;
  }

  /**
   * Footer region of the layout (toolbar, help)
   * @deprecated use `layout.add('footer', $element)`
   */
  get $footerContainer(): HTMLElement {
    return this.layout.$footer;
  }

  /**
   * Start of the footer (zoom, undo / redo)
   * @deprecated use `layout.add('footerStart', $element)`
   */
  get $footerLeftElement(): HTMLDivElement {
    return this.layout.$footerStart;
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
      for (const shape of shapes) shape.destroy();
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
    this._preferencesChanged();
  }

  /**
   * Snap to grid while grid is shown: dragged shapes (but lines), resize anchors of selection, rotation by 90°
   */
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

      const dist = Math.sqrt((newPos.x - oldPos.x) ** 2 + (newPos.y - oldPos.y) ** 2);

      // do not do any snapping with new absolute position (pointer position)
      // is too far away from old position
      if (dist > 10) {
        return newPos;
      }

      return calc(oldPos, newPos);
    };

    if (selectWidget) selectWidget.gridAnchorBound = gridAnchorBound;

    /**
     * Anchor position snapped to the closest grid lines (x, y or both) when they are less than 10px away
     * @param oldPos Absolute position of the anchor before the move
     * @param newPos Absolute position asked by the move
     * @returns Snapped position, new position when far from old one or from grid lines
     */
    function calc(oldPos: Vector2d, newPos: Vector2d) {
      const dist = Math.sqrt((newPos.x - oldPos.x) ** 2 + (newPos.y - oldPos.y) ** 2);

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

  /**
   * Stop snapping to grid (grid hidden)
   */
  private _removeSnapGridEvents() {
    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget) selectWidget.gridAnchorBound = null;
    selectWidget?.transformer.rotationSnaps(undefined as any as number[]);

    this.drawLayer.off('.grid');
  }

  /**
   * Length of screen (px) in stage coordinates, at current zoom level
   * @param val Length on screen (px)
   * @returns Length in stage coordinates
   */
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
    this._preferencesChanged();
  }

  /**
   * Focus drawer div container (usefull for keyevent for example)
   * @param options Focus options of the browser (e.g. `preventScroll`)
   */
  focus(options?: FocusOptions) {
    this.$drawerContainer.focus(options);
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

  /**
   * Resize the stage (px), e.g. when the window of a drawer of window size is resized
   * @param width New width of the stage (px)
   * @param height New height of the stage (px)
   */
  setSize(width: number, height: number) {
    this.stage.size({ width, height });
  }
}
