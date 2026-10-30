import '@/scss/drawer.scss';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { DD } from 'konva/lib/DragAndDrop';
import { Transform } from 'konva/lib/Util';
import { TouchGestures } from '@/utils/TouchGestures';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Rect } from 'konva/lib/shapes/Rect';
import type { AvailableTools } from '@/@types/toolbar';
import type {
  ColorLike,
  Direction,
  DrawerEventMap,
  DrawerOptions,
  DrawerStorage,
  DrawingSnapshot,
  ChangesDuringLoad,
  DrawerUser,
  DrawingShape,
  Arrowheads,
  ArrowType,
  Edges,
  GridStyle,
  WheelAction,
  OptionsChange,
  Preferences,
  ShapeAlignment,
  ShapeOrder,
  StrokeStyle,
  TextStyle,
  Theme,
} from '@/@types/drawer';
import type { CollaborationOptions, CollaborationSocket, ViewArea } from '@/@types/collaboration';
import { createId, deepMerge } from '@/utils/functions';
import {
  defaultOptions,
  drawerEvents,
  gridStyles,
  shapeLabels,
  shapeName,
  viewMargin,
  wheelActions,
  zoomLimits,
} from '@/constants';
import { SpacePan } from '@/utils/SpacePan';
import { drawGrid, gridRotationSnaps, gridShapeStyle, snapToGrid } from '@/utils/grid';
import { hasFocusOutside, replaceUrl, setPressed } from '@/utils/dom';
import { announce, createLiveRegion } from '@/utils/liveRegion';
import { DrawerError, getErrorText } from '@/utils/errors';
import { getStrokeStyle } from '@/utils/stroke';
import { inDrawingOrder, reorderShapes } from '@/utils/order';
import { alignShapes, distributeShapes, moveBy, stackShapes } from '@/utils/align';
import { rectContains, setupHit } from '@/utils/hit';
import { I18n, getLanguage, isLanguage, toLanguageChoice } from '@/i18n/I18n';
import type { Language, TranslationParams, TranslationKey } from '@/@types/i18n';
import { bindingAttrs, unbindMoved, updateBindings } from '@/utils/binding';
import {
  getBoundText,
  getContainer,
  isBoundText,
  updateBoundTexts,
  withBoundTexts,
  withoutBoundTexts,
} from '@/utils/boundText';
import { setupArrows } from '@/utils/arrow';
import { setupNotes } from '@/utils/note';
import { getShapesStyle } from '@/utils/style';
import { embedDrawingInPng, embedDrawingInSvg, readDrawingFile } from '@/utils/embeddedDrawing';
import { fromOtherApp } from '@/utils/foreignDrawing';
import { Library } from '@/utils/library';
import { LibraryPanel } from '@/components/LibraryPanel/LibraryPanel';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { Slideshow } from '@/components/Slideshow/Slideshow';
import { Replay } from '@/components/Replay/Replay';
import { ShapeNavigation } from '@/utils/shapeNavigation';
import { fitTextWidth, getFontsToLoad, getTexts, loadFonts, setupFonts } from '@/utils/text';
import {
  decodeLinkData,
  drawingFileExtension,
  encodeLinkData,
  fixIds,
  maxShapeIdLength,
  parseDrawingFile,
  pickBlob,
  saveFile,
} from '@/utils/drawingFile';
import type {
  DrawingFile,
  DrawingFiles,
  DrawingImage,
  ShapeState,
  ImageFormat,
  ExportImageOptions,
} from '@/@types/file';
import { Image } from 'konva/lib/shapes/Image';
import {
  getFileId,
  getFileIds,
  getImagesToLoad,
  getSvgFiles,
  isImageData,
  loadImages,
  parseFiles,
  readImage,
  setupImages,
} from '@/utils/image';
import { getShapeState, getStateInDrawing, serializeShape } from '@/components/tools/UndoRedo/History';
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
import { ArrowHandle } from '@/utils/arrowHandle';
import type { FrameChanges } from '@/@types/shapes';

import { Zoom } from '@/components/tools/Zoom/Zoom';
import { Position } from '@/components/tools/Position/Position';
import { Help } from '@/components/tools/Help/Help';
import { Collaboration } from '@/components/Collaboration/Collaboration';
import { RoomCipher, createRoomKey, createSecret } from '@/utils/encryption';
import { CollaborationModal } from '@/components/CollaborationModal/CollaborationModal';

import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';

import { Settings } from '@/components/tools/Settings/Settings';
import { Node, type KonvaEventObject } from 'konva/lib/Node';
import MicroEvent from '@/utils/MicroEvent';
import { ConfirmModal } from '@/components/Modal/ConfirmModal';
import { UndoRedo } from '@/components/tools/UndoRedo/UndoRedo';
import { ContextMenu } from '@/components/ContextMenu/ContextMenu';
import { SelectionMenu } from '@/components/SelectionMenu/SelectionMenu';
import { LinkEditor } from '@/components/LinkEditor/LinkEditor';
import { PluginCollection } from '@/plugins/PluginCollection';
import { LayersPanel } from '@/components/LayersPanel/LayersPanel';
import { SaveButton } from '@/components/tools/SaveButton/SaveButton';
import { CollaborationIndicator } from '@/components/CollaborationIndicator/CollaborationIndicator';
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

/** Space kept around shapes shown by `zoomToFit` and `zoomToSelection` (px): header and toolbar over the drawing */
const fitMargin = 64;

/** Highest zoom of `zoomToSelection`: a small shape fills the view without being enlarged too much (200 %) */
const selectionZoomMax = 2;

/**
 * Layer of the stage of a drawer, among its children: a drawing shape may have its name (saves of previous versions)
 * @param stage Stage of a drawer
 * @param name Name of the layer: `background`, `grid`, `draw` or `selection`
 * @returns The layer, undefined when missing
 */
function getLayer(stage: Stage, name: string): Layer | undefined {
  return stage.getChildren().find((layer) => layer.hasName(name));
}

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
export class Drawer extends MicroEvent<DrawerEventMap> {
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
  /** Controller of `signal`, aborted by `destroy` */
  readonly #abort = new AbortController();
  /**
   * Aborted by `destroy`: listeners of the page (window, document, media queries) added with it are removed with the
   * drawer, e.g. `window.addEventListener('resize', handler, { signal: drawer.signal })` (components, plugins, apps)
   */
  readonly signal = this.#abort.signal;
  /** `destroy` called: not destroyed twice */
  #destroyed = false;
  /** JSON of the drawing shapes while a change is handled: found once, read by history and collaboration */
  #shapeStates: Map<string, string> | null = null;
  /** A change is handled (`change` of the stage): `_shapeStates` kept until it ends */
  #inChange = false;
  /** Sessions started so far: a start overtaken by a later one (another room) stops there, its socket closed */
  #collaborationStarts = 0;
  /** Start of a session in a new room, while it connects: asked again meanwhile (double click), the same session */
  #startingRoom: Promise<string> | null = null;
  /** Reminder of a live session in header, with the `collaboration` option */
  collaborationIndicator: CollaborationIndicator | undefined;
  /** Element given to the constructor, holding the container of the drawer */
  $el: HTMLDivElement;
  /** Container of the drawer and regions of its interface, see `layout.add` */
  layout: DrawerLayout;
  /** Live region of messages read by screen readers (toasts), see `_announce` */
  $liveRegion: HTMLDivElement;
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
  /** Handle of a selected curved or elbow arrow: bends the curve, moves the middle segment of the elbow */
  arrowHandle!: ArrowHandle;
  /** Two finger gestures on the canvas: pinch zoom and move of the view (tools ignore touches while `active`) */
  gestures!: TouchGestures;
  /** Space held: a drag moves the view whatever the tool (tools ignore the pointer while `active`) */
  spacePan!: SpacePan;
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
  /** Library of shapes saved to be inserted again in any drawing, kept in the browser */
  library!: Library;
  /** Panel of the library (`library` option) */
  libraryPanel: LibraryPanel | undefined;
  /** Search of the texts of the drawing (Ctrl+F) */
  search!: SearchBar;
  /** Presentation of the frames as slides (Alt+Shift+P) */
  slideshow!: Slideshow;
  /** Replay of how the drawing was made: its shapes again in the order they were created (Alt+Shift+R) */
  replay!: Replay;
  /** Keyboard navigation between the shapes (Enter, Tab, Shift + Tab, Escape), described to screen readers */
  navigation!: ShapeNavigation;
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
  /** Loads of `storage` started: a load ending after a later one started is outdated (another drawing of the app) */
  #storageLoads = 0;
  /**
   * Image files of the drawing by id: data URLs of PNG, JPEG, WebP or GIF images, shown by images (`fileId`
   * attribute), saved, exported in files and links and shared with the drawing. Add files with `addFiles`
   */
  files = new Map<string, string>();
  /** Elements of the image files, decoded once, by id */
  #imageElements = new Map<string, HTMLImageElement>();
  /** Save in storage in progress, another one after it */
  #saving: Promise<void> | null = null;
  /** Drawing changed during a save in storage: saved again once it ends */
  #saveAgain = false;
  /** Load of `storage` whose drawing asked the next save (`#storageLoads`): saved even once the save of another ends */
  #saveAgainFor = 0;
  /** Style copied from shapes by `copyStyle`, pasted by `pasteStyle`; null before a copy */
  #copiedStyle: OptionsChange | null = null;
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
  /**
   * Drawing saved by another tab during a pointer action or a text edit of this one: shown once it ends, unless this tab
   * changed the drawing meanwhile (its save wins)
   */
  #otherTabDrawing: string | null = null;
  /** Work waiting for the end of the pointer action or text edit (`_afterAction`) */
  #afterAction: (() => void)[] = [];
  /** Key of links to drawings (`#<key>=...`): `id` option given by the app, else `drawing` */
  #linkKey = 'drawing';
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

    // links of a drawer without id opened by any drawer without id (its id depends on the drawers created before)
    if (options.id) this.#linkKey = options.id;

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

    // a locale gives its language ('fr-FR'), a language not supported the one of the browser
    this.#languageChoice = toLanguageChoice(preferences.language ?? this.options.language);
    this.options.autoSave = preferences.autoSave ?? this.options.autoSave;
    this.options.keepTool = preferences.keepTool ?? this.options.keepTool;
    this.options.shapeRecognition = preferences.shapeRecognition ?? this.options.shapeRecognition;
    this.options.gridStyle = preferences.gridStyle ?? this.options.gridStyle;
    this.options.wheelAction = preferences.wheelAction ?? this.options.wheelAction;
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
      this.bgLayer = getLayer(this.stage, 'background')!;
      this.drawLayer = getLayer(this.stage, 'draw')!;
      this.selectionLayer = getLayer(this.stage, 'selection')!;
      // not interactive, saved as listening by previous versions
      this.bgLayer.listening(false);
      // saved while Space was held (`SpacePan`): view moved by the pan tool only, shapes reached
      this.stage.draggable(false);
      this.drawLayer.listening(true);
      this.selectionLayer.listening(true);
      // grid layer only contains grid, it is rebuilt: previous versions saved lines and a clip
      // (view at save time) which hid grid outside of it after pan
      const savedGridLayer = getLayer(this.stage, 'grid')!;
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
      this.background = this.bgLayer.getChildren().find((node) => node.hasName(shapeName.background)) as Rect;
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
    // in the page before its first message (konva empties the container when it creates the stage)
    this.$liveRegion = createLiveRegion();
    this.layout.add('floating', this.$liveRegion);
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
    this.library = new Library(this);
    this.search = new SearchBar(this);
    this.slideshow = new Slideshow(this);
    this.replay = new Replay(this);
    this.navigation = new ShapeNavigation(this);
    if (this.options.library) {
      this.libraryPanel = new LibraryPanel(this);
    }
    if (this.options.saveButton) {
      this.saveButton = new SaveButton(this);
    }
    // server given by collaboration option: reminder of a session
    if (this.options.collaboration) {
      this.collaborationIndicator = new CollaborationIndicator(this);
    }
    this._initTheme(preferences.theme);

    this.grid = preferences.grid ?? this.grid;
    if (this.grid) this.showGrid();
    // grid and snapping exclude each other
    else if (preferences.snapping) this.getWidget<SelectWidget>('selection')?.toggleSnapping(true);
    if (preferences.zen) this.setting.toggleZenMode();

    // initial (or saved) tool may not be in widgets option: first widget of toolbar
    // a tool, not an action (image picker opened without a click)
    const tools = [...this.toolbar.widgets.values()].filter((widget) => !widget.actionOnly);
    const activeWidget = tools.find((widget) => widget.id === activeTool) ?? tools[0];
    activeWidget?.setActive(true);

    // dialogs, toasts... after footer
    this.layout.ready();
    this._takeFocus();
    this.undoRedo.manageButtons();
    this._initEvents();
    // drawer created: commands, listeners of plugins (read only after: plugins may listen to it)
    this.plugins._init();

    if (this.options.readOnly) this._setReadOnly(true);

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
    // changes not saved (without auto save, save in progress or failed): page not left without warning
    window.addEventListener(
      'beforeunload',
      (e) => {
        if (this.#unsaved && this.$drawerContainer.isConnected) e.preventDefault();
      },
      { signal: this.signal }
    );
  }

  /**
   * Drawing of a link, or room of a collaboration link
   */
  private _openFromUrl() {
    this._loadFromLink();

    // room link (see `getCollaborationLink`), with id of user who shared it and key of an encrypted room (checked when
    // joining: a key cut by an app is told)
    const [, room, invitedBy, key] =
      window.location.hash.match(/^#room=([\w-]+)(?:&by=([\w-]+))?(?:&key=([^&]*))?$/) ?? [];

    if (this.options.collaboration && room) {
      if (this._getOwnerKey(room)) {
        // owner back in the room
        this.startCollaboration(room, undefined, undefined, key).catch((error) => {
          if (this.#destroyed) return;
          this.toast(this.t('toast.collaborationUnavailable', { error: getErrorText(error, this.i18n.t) }), 'error');
        });
      } else {
        // invited user gives a name before joining
        this.showCollaboration(room, invitedBy, key);
      }
    }
  }

  /**
   * Read only: drawing can't be modified by user (tools except pan, shortcuts and menu items modifying drawing,
   * text edition), API methods still modify it. Asked by the app (kept in `options.readOnly`): a collaboration session
   * giving the right to draw keeps it, a viewer of a session stays read only
   * @param readOnly True disables tools modifying drawing (pan activated), false enables them and the previous tool
   */
  setReadOnly(readOnly: boolean) {
    this.options.readOnly = readOnly;
    this._setReadOnly(readOnly || (!!this.collaboration && !this.collaboration.canEdit));
  }

  /**
   * Read only applied, see `setReadOnly`: also by the right to draw of a collaboration session
   * @param readOnly True disables tools modifying drawing (pan activated), false enables them and the previous tool
   */
  private _setReadOnly(readOnly: boolean) {
    if (readOnly === this.readOnly) return;

    this.readOnly = readOnly;

    if (readOnly) {
      const pan = this.getWidget<BaseWidget>('pan');

      // text being typed: previous one kept
      this.getWidget<TextWidget>('text')?.cancelEdit();
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
      // widgets of disabled plugins stay disabled, their tool is not activated again
      for (const plugin of this.plugins) plugin._updateWidgets();
      if (this.#toolBeforeReadOnly?.isDisabled) this._leaveDisabledTool();
      else this.#toolBeforeReadOnly?.setActive(true);
    }

    this.undoRedo.manageButtons();
    this.trigger(drawerEvents.readOnlyChange, readOnly);
  }

  /**
   * Tool of the user given back once the slideshow or the replay stops: activated; disabled by read only started
   * meanwhile: activated once read only ends, pan meanwhile (not the tool of the slideshow); disabled by its plugin:
   * another one
   * @param tool Tool active before, null for none
   */
  _restoreTool(tool: BaseWidget | null) {
    if (!tool) {
      this.activeWidget?.setActive(false);
    } else if (!tool.isDisabled) {
      tool.setActive(true);
    } else if (this.#readOnlyWidgets.includes(tool)) {
      const pan = this.getWidget<BaseWidget>('pan');

      this.#toolBeforeReadOnly = tool;
      if (pan && !pan.isDisabled) pan.setActive(true);
      else this.activeWidget?.setActive(false);
    } else {
      this._leaveDisabledTool();
    }
  }

  /**
   * Active tool disabled (its plugin disabled): the selection tool activated instead, else the first tool enabled, else
   * none (its pointer action stopped)
   */
  _leaveDisabledTool() {
    const tools = [...this.toolbar.widgets.values()].filter((widget) => !widget.actionOnly && !widget.isDisabled);
    const tool = tools.find((widget) => widget.id === 'selection') ?? tools[0];

    if (tool) tool.setActive(true);
    else this.activeWidget?.setActive(false);
  }

  /**
   * Right to draw of this user given or removed by owner of collaboration room
   * @param canEdit True when this user may draw (still read only with `readOnly` option), told in a toast
   * @param joined Room just joined as viewer: told how to ask the owner to draw (no right removed)
   */
  _onCollaborationRight(canEdit: boolean, joined = false) {
    this._setReadOnly(!canEdit || this.options.readOnly);
    this.toast(this.t(canEdit ? 'toast.canDraw' : joined ? 'toast.joinedViewOnly' : 'toast.viewOnly'), 'info');
  }

  /**
   * Start a live collaboration session in a room (`collaboration` option gives the server), current session is stopped.
   * A new room is encrypted end to end (unless the `encrypt` option of `collaboration` is false): its key is in its
   * links, the server never reads the drawing
   * @param room Room id, new room by default
   * @param name Name shown to other users, saved for next sessions
   * @param invitedBy Id of user who shared the link (see `getCollaborationLink`), shown to owner
   * @param key Key of an encrypted room (`key` of its link), none for a room in clear; a new room gets a new one
   * @returns Link to join the room; a new room asked again while it connects (double click) gives the same session
   * @throws {DrawerError} `error.roomKey` for a key cut or changed, `error.insecurePage` for an encrypted room on a page
   * without Web Crypto (not https); an error when another session was started meanwhile (this one is not)
   */
  startCollaboration(
    room?: string,
    name: string = this.getUserName(),
    invitedBy?: string,
    key?: string
  ): Promise<string> {
    if (!room && this.#startingRoom) return this.#startingRoom;

    const start = this._startCollaboration(room, name, invitedBy, key);

    if (!room) {
      const started = () => {
        if (this.#startingRoom === start) this.#startingRoom = null;
      };

      this.#startingRoom = start;
      start.then(started, started);
    }

    return start;
  }

  /**
   * Session started, see `startCollaboration`: stops at each step once another start began meanwhile, so one socket
   * only joins a room
   * @param room Room id, new room when undefined
   * @param name Name shown to other users
   * @param invitedBy Id of user who shared the link
   * @param key Key of an encrypted room
   * @returns Link to join the room
   */
  private async _startCollaboration(room: string | undefined, name: string, invitedBy?: string, key?: string) {
    const { collaboration } = this.options;
    const start = ++this.#collaborationStarts;
    const overtaken = () => {
      if (this.#destroyed) throw new Error('drawer destroyed');
      if (start !== this.#collaborationStarts) throw new Error('another collaboration session was started meanwhile');
    };

    if (!collaboration) throw new Error('collaboration option is disabled');

    // new room: encrypted end to end, unless disabled
    if (!room)
      key = typeof collaboration === 'object' && collaboration.encrypt === false ? undefined : await createRoomKey();
    // key checked first: a link cut or changed joins nothing
    const cipher = key === undefined ? undefined : await RoomCipher.create(key);

    overtaken();
    // new room: this user is its owner (secret kept for next sessions); ids of rooms can't be guessed either
    const ownerKey = room ? this._getOwnerKey(room) : createSecret();

    room ??= createSecret();
    if (ownerKey) this._setOwnerKey(room, ownerKey);

    this.stopCollaboration();
    this.setUserName(name);

    const socket = await this._createSocket();

    try {
      overtaken();
    } catch (error) {
      socket.disconnect();
      throw error;
    }
    this.socket = socket;
    this.collaboration = new Collaboration(this, this.socket, {
      room,
      name,
      userId: this.getUserId(),
      userKey: this._getUserKey(),
      ownerKey,
      invitedBy,
      cipher,
    });
    this.trigger(drawerEvents.collaborationChange);

    try {
      await this._connected(this.socket);
    } catch (error) {
      this.stopCollaboration();
      throw error;
    }
    // stopped meanwhile (drawer destroyed, another session started): link of no session
    overtaken();

    const link = this.getCollaborationLink(room);

    // reloading page joins the room again, page url shared by this user is known as shared by them
    replaceUrl(link);
    this.trigger(drawerEvents.collaborationChange);

    return link;
  }

  /**
   * Remove the drawer for good (apps mounting and unmounting it): plugins destroyed, tool deactivated (pointer action
   * ended), collaboration session left, listeners of the page (window, document, media queries, resize observers: see
   * `signal`) and of the drawer removed, stage destroyed and element of the drawer emptied. Changes not saved yet are
   * not saved: call `save()` first. The drawer can't be used afterwards
   * @returns Resolved once the drawer is removed (after the `destroy` of plugins)
   */
  async destroy() {
    if (this.#destroyed) return;

    this.#destroyed = true;
    // preferences of the dialog not saved: the ones shown before given back
    if (this.preferencesModal?.isVisible()) this.preferencesModal.hide();
    await this.plugins.destroy();
    this.activeWidget?.setActive(false);
    this.stopCollaboration();
    this.#abort.abort();
    this.off();
    this.stage.destroy();
    this.$el.replaceChildren();
  }

  /**
   * Shapes dragged and released: placed in the frame containing them, one change for the whole drag. Konva ends the drag
   * of each node moved (every selected shape, transformer of the selection): the last one fires the change (saved, in
   * history, sent to collaborators once)
   * @param shapes Shapes moved by the drag
   */
  _endDrag(shapes: DrawingShape[]) {
    // other nodes of this drag still to end (konva removes each one once its dragend is fired)
    const ending = [...DD._dragElements.values()].filter(
      (elem) => elem.dragStatus === 'stopped' && elem.node.getStage() === this.stage
    );

    if (ending.length > 1) return;
    this.placeInFrames(shapes);
    this.stage.fire('change');
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
    this._setReadOnly(this.options.readOnly);
    if (window.location.hash.startsWith('#room=')) {
      replaceUrl(window.location.pathname + window.location.search);
    }
    this.trigger(drawerEvents.collaborationChange);
  }

  /**
   * Link to join a room: current page with `#room=<id>&by=<user id>`, owner knows who shared it, and `&key=<key>` for
   * the room of an encrypted session (browsers never send the `#` part to servers)
   * @param room Room id, room of current session by default
   * @returns Url of current page with room hash, without hash when there is no room
   */
  getCollaborationLink(room: string | undefined = this.collaboration?.room): string {
    const url = new URL(window.location.href);
    const key = room && room === this.collaboration?.room ? this.collaboration.cipher?.key : undefined;

    // id known by server in a session
    url.hash = room
      ? `room=${room}&by=${this.collaboration?.userId || this.getUserId()}${key ? `&key=${key}` : ''}`
      : '';

    return url.toString();
  }

  /**
   * Live collaboration dialog: owner starts / stops session, shares link and QR code, gives rights;
   * other users give their name
   * @param joinRoom Room of a link, joined once user gave a name
   * @param invitedBy Id of user who shared the link
   * @param key Key of the encrypted room of the link
   */
  showCollaboration(joinRoom: string | null = null, invitedBy?: string, key?: string) {
    this.collaborationModal ??= new CollaborationModal(this);
    this.collaborationModal.show(joinRoom, invitedBy, key);
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
   * Secret of this browser given to collaboration servers with the id of the user: they give this id to this browser
   * only, not to another user who saw it (users of a room, `by` of links)
   * @returns Secret kept in localStorage, or a new one (new each session if storage is unavailable)
   */
  private _getUserKey(): string {
    const key = `${this.options.localStorageKey}-user-key`;
    let userKey = this._getStorageItem(key);

    if (!userKey) {
      userKey = createSecret();
      try {
        localStorage.setItem(key, userKey);
      } catch {
        // new secret each session
      }
    }

    return userKey;
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
   * Keep secret of owner of a room in browser (20 rooms used last), owner again when coming back to it
   * @param room Room id
   * @param ownerKey Secret proving to the server that this user owns the room
   */
  private _setOwnerKey(room: string, ownerKey: string) {
    const key = `${this.options.localStorageKey}-owner`;

    try {
      // room used now: last one (ids of rooms are not integer keys, kept in insertion order)
      const rooms = Object.entries<string>(JSON.parse(this._getStorageItem(key) ?? '{}')).filter(([id]) => id !== room);

      // rooms used last only
      localStorage.setItem(key, JSON.stringify(Object.fromEntries([...rooms, [room, ownerKey]].slice(-20))));
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
      socket.once('connect_error', (error) =>
        reject(new DrawerError('error.serverUnreachable', `server unreachable (${error.message})`, { cause: error }))
      );
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
   * Pointer action of a widget ended: changes of collaborators received meanwhile are applied once the tool finished it
   * (tools end their action first, then erase shapes, link an arrow, fill a frame...): its change applies them first,
   * else they are applied here, after it (not recorded with the shapes as they were during the action)
   */
  _onActionEnd() {
    queueMicrotask(() => {
      if (this.#destroyed || this._duringAction()) return;
      if (this.collaboration?.flush()) this.stage.fire('change');

      const saved = this.#otherTabDrawing;
      const waiting = this.#afterAction;

      this.#otherTabDrawing = null;
      this.#afterAction = [];
      if (saved && !this.#unsaved) this._showSaved(saved);
      for (const run of waiting) run();
    });
  }

  /**
   * End of the pointer action or text edit in progress (a stroke, a text being typed): work changing the drawing waits
   * for it (else it would cancel the stroke, save the text hidden...)
   * @returns Resolved once it ended, at once without action
   */
  _afterAction(): Promise<void> {
    return this._duringAction() ? new Promise((resolve) => this.#afterAction.push(resolve)) : Promise.resolve();
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
   * Area of the drawing shown in the view (presented to other users of a collaboration session)
   * @returns Visible area, in drawing coordinates
   */
  getViewArea(): ViewArea {
    const scale = this.getZoomLevel();

    return {
      x: -this.stage.x() / scale,
      y: -this.stage.y() / scale,
      width: this.stage.width() / scale,
      height: this.stage.height() / scale,
    };
  }

  /**
   * Show an area of the drawing (view presented by another user): zoomed to fit in the view (zoom limits kept),
   * centered in it
   * @param area Area of the drawing, in drawing coordinates
   * @param maxScale Highest zoom (a small area is not enlarged beyond it)
   * @param margin Space kept around the area in the view (px)
   */
  showArea({ x, y, width, height }: ViewArea, maxScale: number = zoomLimits.max, margin: number = 0) {
    const fit = Math.min(
      (this.stage.width() - margin * 2) / width,
      (this.stage.height() - margin * 2) / height,
      maxScale
    );
    const scale = Math.min(Math.max(fit, zoomLimits.min), zoomLimits.max);

    this._setView(
      { x: this.stage.width() / 2 - (x + width / 2) * scale, y: this.stage.height() / 2 - (y + height / 2) * scale },
      scale
    );
  }

  /**
   * Move the view to an area of the drawing that is not entirely in it (with a margin): current zoom kept when the area
   * fits, else zoomed out. Texts found by the search, shapes reached with the keyboard
   * @param area Area of the drawing, in drawing coordinates
   */
  _showInView(area: ViewArea) {
    const view = this.getViewArea();
    const margin = viewMargin / this.getZoomLevel();
    const inView =
      area.x >= view.x + margin &&
      area.y >= view.y + margin &&
      area.x + area.width <= view.x + view.width - margin &&
      area.y + area.height <= view.y + view.height - margin;

    if (!inView) this.showArea(area, this.getZoomLevel(), viewMargin);
  }

  /**
   * View moved and zoomed: zoom level shown, background, position and collaboration updated
   * @param position Position of the stage (px)
   * @param scale Zoom level
   */
  _setView(position: Vector2d, scale: number) {
    this.stage.scale({ x: scale, y: scale });
    this.stage.position(position);

    if (this.zoom) {
      this.zoom.update();
    } else {
      this._update();
    }
  }

  /**
   * Show shapes in the view (whole drawing by default): centered, zoomed out when they do not fit (never zoomed in
   * beyond 100 %), space around them for the interface. Done after a file or a link is opened
   * @param shapes Shapes to show, visible drawing shapes by default (nothing done without shapes)
   */
  zoomToFit(shapes: DrawingShape[] = this.getDrawingShapes().filter((shape) => shape.visible())) {
    const box = getExportBox(shapes, this.drawLayer);

    if (box) this.showArea(box, 1, fitMargin);
  }

  /**
   * Show the selected shapes in the view: centered, zoomed to fill it (200 % at most), space around them for the
   * interface (Shift + 2). Nothing done without selection
   */
  zoomToSelection() {
    const box = getExportBox(this.getSelectedShapes(), this.drawLayer);

    if (box) this.showArea(box, selectionZoomMax, fitMargin);
  }

  /**
   * JSON of each drawing shape (`serializeShape`) by id, bottom first: found once while a change is handled (history,
   * collaboration), else each time
   * @returns States of the top nodes of the drawing
   */
  _shapeStates(): Map<string, string> {
    if (this.#inChange && this.#shapeStates) return this.#shapeStates;

    const states = new Map(this.getDrawingShapes().map((shape) => [shape.id(), serializeShape(shape)]));

    if (this.#inChange) this.#shapeStates = states;
    return states;
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
   * @param shape Shape or group to add on top of drawing, given an id if it has none; an id already in the drawing (a
   * copy) or too long for collaboration servers (`maxShapeIdLength`) is replaced, also of its shapes
   * @returns added shape
   */
  addShape<T extends DrawingShape>(shape: T): T {
    const used = new Set(this.drawLayer.find(() => true).map((node) => node.id()));
    const nodes: Node[] = [shape, ...(shape instanceof Group ? shape.find(() => true) : [])];
    const renamed = new Map<string, string>();

    for (const node of nodes) {
      const id = node.id();

      if (id && (id.length > maxShapeIdLength || used.has(id))) {
        node.id(createId());
        renamed.set(id, node.id());
      }
      used.add(node.id());
    }
    // a copy: its texts of shapes and arrows linked to its own shapes, not to the originals
    for (const node of renamed.size ? nodes : []) {
      for (const attr of [...bindingAttrs, 'containerId']) {
        const target = renamed.get(node.getAttr(attr));

        if (target) node.setAttr(attr, target);
      }
    }

    return this._addShape(shape);
  }

  /**
   * Add drawing shape keeping its ids, see `addShape`: shapes of history, of other users (collaboration), of a drawing
   * file (ids made unique by `parseDrawingFile`)
   * @param shape Shape or group to add on top of drawing, given an id if it has none
   * @returns added shape
   */
  _addShape<T extends DrawingShape>(shape: T): T {
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
    // element of an image is not saved: from its file
    setupImages(shape, this.files, this.#imageElements);
    // heads of arrows, shadows of notes (drawing functions not saved)
    setupArrows(shape);
    setupNotes(shape);
    // font of the library for Ubuntu
    setupFonts(shape);
  }

  /**
   * Node of another user added to a group or a frame of the drawing (collaboration): set up as by `addShape`, dragged
   * alone or with its group
   * @param shape Shape or group just added to its parent
   */
  _setupAdded(shape: DrawingShape) {
    this._setupShape(shape);
    shape.draggable(this._isMovedAlone(shape));
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
   * Update bg position (grid is redrawn with stage) and position widget, after view move or zoom: view sent while
   * presenting it in a collaboration session, moved by a user following a presentation: no longer followed
   */
  _update() {
    this.bgLayer.position({ x: -this._unScale(this.stage.position().x), y: -this._unScale(this.stage.position().y) });
    this.position?.update();
    this.collaboration?.updateCursors();
    this.collaboration?.onViewChange();
    // field of a text being typed on its text
    this.getWidget<TextWidget>('text')?.followView();
  }

  /**
   * Listen to shortcuts, zoom wheel, view moves, shape drags and transforms (frames, linked arrows, collaboration)
   * and drawing changes (`change` of stage: save, history, `change` event)
   */
  private _initEvents() {
    this._followOtherTabs();
    this._initHotKey();
    this._initWheel();
    this._initKeyboardFocus();
    this._initFrameMoves();
    this.shapeLinks = new ShapeLinks(this);
    this.arrowHandle = new ArrowHandle(this);
    this.gestures = new TouchGestures(this);
    this.spacePan = new SpacePan(this);

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

      this._endDrag(selected.includes(e.target as DrawingShape) ? selected : [e.target as DrawingShape]);
    });

    // moved or transformed shapes shown to collaborators while moving (selected ones move together)
    const sendLive = (target: unknown) => {
      const selected = this.getSelectedShapes();

      this.collaboration?.sendLive(
        selected.length ? selected : target instanceof Shape || target instanceof Group ? [target] : []
      );
    };

    // once per move of the pointer (the whole selection sent), not for each shape of a big selection
    this.drawLayer.on('dragmove.live', this._oncePerMove(sendLive));
    this.getWidget<SelectWidget>('selection')?.transformer.on('transform.live', (e) => sendLive(e.target));

    // arrows linked to shapes follow them, unlinked when moved without them
    const transformer = this.getWidget<SelectWidget>('selection')?.transformer;

    this.drawLayer.on('dragstart.binding', (e) => {
      const selected = this.getSelectedShapes();

      unbindMoved(selected.includes(e.target as DrawingShape) ? selected : [e.target]);
    });
    // texts of shapes too
    const follow = () => {
      updateBindings(this.drawLayer);
      updateBoundTexts(this.drawLayer, this.background.fill() as string);
    };

    // once per move of the pointer, not for each shape of a big selection
    this.drawLayer.on('dragmove.binding', this._oncePerMove(follow));
    transformer?.on('transformstart.binding', () => unbindMoved(transformer.nodes()));
    transformer?.on('transform.binding', follow);
    this.stage.on('change', () => {
      // drawing of another tab saved during an action of this one: this change saved over it
      this.#otherTabDrawing = null;
      // collaborators changes received during a pointer action, then this one
      this.collaboration?.flush();
      // arrows on their linked shapes, texts in their shapes, before saving
      updateBindings(this.drawLayer);
      updateBoundTexts(this.drawLayer, this.background.fill() as string);
      // drawing as it is now, serialized once for collaboration and history
      this.#inChange = true;
      this.#shapeStates = null;
      try {
        this.collaboration?.send();

        // unsaved until stored: at once in localStorage (unless it fails), once the save of `storage` option ends, or
        // when the user saves
        if (this.options.storage || !this.options.autoSave) this._setUnsaved(true);
        if (this.options.autoSave) this.save();

        this.undoRedo.saveState();
      } finally {
        this.#inChange = false;
        this.#shapeStates = null;
      }
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

    const options = { capture: true, signal: this.signal };

    document.addEventListener('keydown', (e) => (navigationKey = e.key === 'Tab' || e.key === 'Escape'), options);
    document.addEventListener('pointerdown', () => (navigationKey = false), options);
    $container.addEventListener('focus', () => $container.classList.toggle(className, navigationKey));
    $container.addEventListener('blur', () => $container.classList.remove(className));
    $container.addEventListener('pointerdown', () => $container.classList.remove(className));
    // konva prevents default of mouse down on canvas (no focus change): focus taken from the page (app bar...) and from
    // a button of the drawer (color, zoom...), so shortcuts (Ctrl + A, arrows moving the selection...) go to drawer
    this.$stageContainer.addEventListener('pointerdown', () => {
      const focused = document.activeElement;

      if (!$container.contains(focused) || focused instanceof HTMLButtonElement) this.focus({ preventScroll: true });
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
   * Shapes of the drawing being dragged (also the handle of an arrow) or transformed, not the view: one change at the
   * end (`_endDrag`), changes of collaborators received meanwhile are recorded with it
   * @returns True during a drag or a transform of this drawer
   */
  _duringMove() {
    const dragged = [...DD._dragElements.values()].some(
      ({ node, dragStatus }) => dragStatus === 'dragging' && node !== this.stage && node.getStage() === this.stage
    );

    return dragged || !!this.getWidget<SelectWidget>('selection')?.transformer.isTransforming();
  }

  /**
   * Mouse wheel (`wheelAction` preference): zoom around the pointer (`zoom` option, by `scaling` option for a notch
   * of a mouse wheel, less for the small steps of a trackpad), Ctrl / Cmd + wheel moves the view (Shift + wheel:
   * horizontally); or the other way round. A pinch of a trackpad (wheel with `ctrlKey`, Ctrl key not pressed) zooms
   */
  private _initWheel() {
    // Ctrl / Cmd key pressed: browsers give `ctrlKey` to the wheel events of a pinch too
    let modifierDown = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') modifierDown = e.type === 'keydown';
    };

    window.addEventListener('keydown', onKey, { signal: this.signal });
    window.addEventListener('keyup', onKey, { signal: this.signal });
    window.addEventListener('blur', () => (modifierDown = false), { signal: this.signal });

    this.stage.on('wheel', (e) => {
      const evt = e.evt;
      const pinch = evt.ctrlKey && !modifierDown;
      const modifier = (evt.ctrlKey || evt.metaKey) && !pinch;
      const zoom = pinch || (this.options.wheelAction === 'zoom' ? !modifier && !evt.shiftKey : modifier);
      // in pixels: lines (Firefox) or pages
      const unit = evt.deltaMode === 1 ? 33 : evt.deltaMode === 2 ? this.stage.height() : 1;

      // not the page
      evt.preventDefault();
      if (!zoom) {
        // Shift: horizontally, as the browser
        const dx = (evt.shiftKey ? evt.deltaX || evt.deltaY : evt.deltaX) * unit;
        const dy = evt.shiftKey ? 0 : evt.deltaY * unit;

        this._setView({ x: this.stage.x() - dx, y: this.stage.y() - dy }, this.getZoomLevel());
        return;
      }
      if (!this.options.zoom) return;

      // a notch of a mouse wheel (100 px) zooms by `scaling`, small steps of a trackpad less
      const notches = Math.max(-1, Math.min(1, (evt.deltaY * unit) / 100));

      // point under the pointer kept in place
      this.setZoomLevel(this.getZoomLevel() * this.options.scaling ** -notches, this._getPointerPos());
    });
  }

  /**
   * Action of the mouse wheel (preference): zoom (Ctrl / Cmd + wheel moves the view) or move of the view (Ctrl / Cmd +
   * wheel zooms); a pinch of a trackpad always zooms
   * @param wheelAction 'zoom' or 'pan'
   */
  setWheelAction(wheelAction: WheelAction) {
    if (wheelAction === this.options.wheelAction) return;

    this.options.wheelAction = wheelAction;
    this.help.refresh();
    this._preferencesChanged();
  }

  /**
   * Save drawing in `storage` option (once its drawing is loaded), else in localStorage. Changes are saved once it
   * succeeds (`hasUnsavedChanges`), they stay unsaved if it fails or if the drawing of `storage` is not loaded
   * @returns Resolved once saved (errors are shown in a toast)
   */
  save(): Promise<void> {
    const { storage, localStorageKey } = this.options;

    // drawing removed: nothing to save (an empty drawing would replace the stored one)
    if (this.#destroyed) return Promise.resolve();
    try {
      // tool of this browser
      localStorage.setItem(`${localStorageKey}-tool`, this.activeTool);
    } catch {
      // not part of the drawing: kept for this visit
    }

    if (storage) {
      // stored drawing not replaced before it is loaded (nor if it can't be)
      return this.#storageLoaded ? this._saveToStorage(storage) : Promise.resolve();
    }

    try {
      const files = this._getFiles(this.getDrawingShapes());

      localStorage.setItem(localStorageKey, this.stage.toJSON());
      // image files of the drawing, apart (not attributes of the stage)
      if (Object.keys(files).length) localStorage.setItem(`${localStorageKey}-files`, JSON.stringify(files));
      else localStorage.removeItem(`${localStorageKey}-files`);
      this._onSaved();
    } catch (error) {
      this._setUnsaved(true);
      this._onSaveError(error as Error, 'warning');
    }

    return Promise.resolve();
  }

  /**
   * Save drawing (`save`) and tell it, from menu and command palette: nothing told when it failed (error shown) or
   * when nothing could be saved (drawing of `storage` option not loaded)
   */
  async saveNow() {
    await this.save();
    if (!this.#unsaved && (!this.options.storage || this.#storageLoaded)) this.toast(this.t('toast.saved'), 'info');
  }

  /**
   * Drawing has changes not saved yet: without auto save until `save` (or `saveNow`), during a save in `storage`
   * option, after a failed save
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
   * Brush strokes recognized as shapes (preference): a rectangle, an ellipse, a triangle, a diamond, a line or an arrow
   * drawn in one stroke is replaced by the shape of its tool (undo gives back the stroke)
   * @param shapeRecognition True recognizes shapes, false keeps the strokes as drawn
   */
  setShapeRecognition(shapeRecognition: boolean) {
    if (shapeRecognition === this.options.shapeRecognition) return;

    this.options.shapeRecognition = shapeRecognition;
    this._preferencesChanged();
  }

  /**
   * Drawing has changes not saved or is saved: `unsaved.change` event when it changes
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
      this.#saveAgainFor = this.#storageLoads;
      return this.#saving;
    }

    this.#saving = (async () => {
      // result of the last save
      let saved = false;
      const load = this.#storageLoads;

      do {
        // destroyed during the save: its stage is empty; another drawing being loaded: the app stores it in its place
        if (this.#destroyed || load !== this.#storageLoads) break;
        this.#saveAgain = false;
        try {
          await storage.save(this.getDrawingFile());
          saved = true;
          this.#saveFailed = false;
        } catch (error) {
          saved = false;
          this._onSaveError(error as Error, 'error');
        }
      } while (this.#saveAgain);
      this.#saving = null;
      // last drawing saved, else changes stay unsaved (another drawing loaded: its state)
      if (saved && load === this.#storageLoads) this._onSaved();
      // changes of the drawing loaded since, made during the save of the previous one: saved now
      if (this.#saveAgain && this.#saveAgainFor === this.#storageLoads && !this.#destroyed) {
        await this._saveToStorage(storage);
      }
    })();

    return this.#saving;
  }

  /**
   * Drawing saved: no unsaved changes, next failure warned again
   */
  private _onSaved() {
    this.#saveFailed = false;
    this._setUnsaved(false);
  }

  /**
   * Drawing stays in page, warned once until a save succeeds
   * @param error Error of the save, its message shown in the toast
   * @param type Toast type: warning for localStorage, error for app storage
   */
  private _onSaveError(error: Error, type: 'warning' | 'error') {
    if (this.#saveFailed) return;

    this.#saveFailed = true;
    this.toast(this.t('toast.saveFailed', { error: getErrorText(error, this.i18n.t) }), type);
  }

  /**
   * Load drawing of `storage` option (on init, again after login...): it replaces drawing (kept if nothing is
   * stored), history starts from it, changes are saved in storage once it is loaded. Only the last load started is
   * applied (an app switching drawings quickly), once the stroke or text edit in progress ended; changes made during
   * the load (slow download) are kept over the loaded drawing, as one change
   * @returns Rejected if drawing can't be loaded (shown in a toast): changes are not saved
   */
  async loadFromStorage(): Promise<void> {
    const { storage } = this.options;

    if (!storage) throw new Error('storage option is not set');

    const load = ++this.#storageLoads;
    // a later load started: this one is outdated, nothing applied nor told
    const outdated = () => this.#destroyed || load !== this.#storageLoads;
    // drawing when the load starts: changes made meanwhile found from it
    const start: DrawingSnapshot = { shapes: this._shapeStates(), background: this.background.fill() as ColorLike };

    this.#storageLoaded = false;
    this.$drawerContainer.setAttribute('aria-busy', 'true');
    try {
      const file = await storage.load();

      // not during a stroke or a text edit: the shape being drawn would be removed
      if (file) await this._afterAction();
      // removed meanwhile, or another drawing loaded: nothing loaded nor saved
      if (outdated()) return;
      if (file) {
        const kept = this._changesSince(start);

        this.loadDrawing(file);
        this.undoRedo.reset();
        this.undoRedo.manageButtons();
        // history starts here: files of the previous drawing forgotten
        this._pruneFiles();
        this.#storageLoaded = true;
        // drawing as stored
        this._setUnsaved(false);
        // changed during the load: changes kept over it (saved, undone at once)
        if (kept) this._applyChanges(kept);
      } else {
        this.#storageLoaded = true;
        // nothing stored: drawing kept, its changes saved now
        if (this.#unsaved && this.options.autoSave) this.save();
      }
    } catch (error) {
      if (outdated()) return;
      this.toast(this.t('toast.loadFailed', { error: getErrorText(error, this.i18n.t) }), 'error');
      throw error;
    } finally {
      if (load === this.#storageLoads) this.$drawerContainer.removeAttribute('aria-busy');
    }
  }

  /**
   * Changes of the drawing since a load started: shapes added, changed and removed, background
   * @param start Drawing when the load started
   * @returns Changes with the image files of their shapes, null without change
   */
  private _changesSince(start: DrawingSnapshot): ChangesDuringLoad | null {
    const current = this._shapeStates();
    const changed = [...current].filter(([id, json]) => start.shapes.get(id) !== json);
    const removed = [...start.shapes.keys()].filter((id) => !current.has(id));
    const background = this.background.fill() as ColorLike;

    if (!changed.length && !removed.length && background === start.background) return null;

    const ids = new Set(changed.map(([id]) => id));

    return {
      changed: changed.map(([, json]) => json),
      removed,
      ...(background !== start.background && { background }),
      files: this._getFiles(this.getDrawingShapes().filter((shape) => ids.has(shape.id()))),
    };
  }

  /**
   * Changes made during a load applied again over the loaded drawing: shapes changed in their place (added ones on
   * top), removed ones removed, background, then one change (saved, in history)
   * @param changes Changes found by `_changesSince`
   */
  private _applyChanges({ changed, removed, background, files }: ChangesDuringLoad) {
    const shapes = new Map(this.getDrawingShapes().map((shape) => [shape.id(), shape]));

    this.addFiles(files);
    for (const id of removed) shapes.get(id)?.destroy();
    for (const json of changed) {
      const state = JSON.parse(json) as ShapeState;
      const old = shapes.get(state.attrs.id as string);
      const index = old?.zIndex();

      old?.destroy();

      const node = this._addShape(Node.create(state) as DrawingShape);

      if (index !== undefined) node.zIndex(index);
    }
    if (background !== undefined) this._setBackground(background);
    this.stage.fire('change');
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
      const data = JSON.parse(json);
      const draw = (data?.children as ShapeState[] | undefined)?.find((layer) =>
        String(layer?.attrs?.name ?? '')
          .split(' ')
          .includes('draw')
      );

      // ids of saves of previous versions unique and short enough, as of drawing files
      if (Array.isArray(draw?.children)) fixIds(draw.children);

      const stage = Node.create(data, this.$drawerContainer);
      const valid =
        stage instanceof Stage &&
        ['grid', 'draw', 'selection'].every((name) => getLayer(stage, name)) &&
        !!getLayer(stage, 'background')
          ?.getChildren()
          .some((node) => node.hasName(shapeName.background));

      if (valid) {
        // image files saved with it, before its shapes are set up
        try {
          this._storeFiles(JSON.parse(this._getStorageItem(`${this.options.localStorageKey}-files`) ?? '{}'));
        } catch {
          // invalid JSON: images without their files
        }
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
   * Drawing saved by another tab of the browser (same key, without `storage` option): shown here, so the next save of
   * this tab does not replace it with an older drawing; nothing saved again nor added to the history of this tab.
   * Not while this tab has changes not saved (its next save wins) nor during a collaboration session (the drawing of
   * the room). Image files of the other tab added as they come
   */
  private _followOtherTabs() {
    if (this.options.storage) return;

    window.addEventListener(
      'storage',
      (e) => {
        const key = this.options.localStorageKey;

        if (e.storageArea !== localStorage || !e.newValue || this.collaboration) return;
        if (e.key === `${key}-files`) {
          try {
            this.addFiles(JSON.parse(e.newValue));
          } catch {
            // invalid JSON
          }
        } else if (e.key === key && !this.#unsaved) {
          // during a stroke or a text edit: shown once it ends (nodes being drawn or edited kept)
          if (this._duringAction()) this.#otherTabDrawing = e.newValue;
          else this._showSaved(e.newValue);
        }
      },
      { signal: this.signal }
    );
  }

  /**
   * Drawing of a saved stage (`stage.toJSON` of another tab) shown: its shapes and background, history of this tab
   * kept (its next changes only), `change` event
   * @param json Saved stage
   */
  private _showSaved(json: string) {
    try {
      const layers: ShapeState[] = JSON.parse(json)?.children ?? [];
      const isNamed = (state: ShapeState, name: string) =>
        String(state.attrs?.name ?? '')
          .split(' ')
          .includes(name);
      const draw = layers.find((layer) => isNamed(layer, 'draw'));
      const background = layers
        .flatMap((layer) => layer.children ?? [])
        .find((state) => isNamed(state, shapeName.background))?.attrs.fill;

      if (!draw) return;

      const nodes = (draw.children ?? []).map((state) => Node.create(state) as DrawingShape);
      const ids = new Set([...this.getDrawingShapes(), ...nodes].map((shape) => shape.id()));

      this.getWidget<SelectWidget>('selection')?.clearSelection();
      for (const shape of this.getDrawingShapes()) shape.destroy();
      for (const node of nodes) this._addShape(node);
      if (typeof background === 'string') this._setBackground(background as ColorLike);
      // changes of the other tab: not undone here
      this.undoRedo.ignoreChanges(ids);
      this.undoRedo.ignoreBackground();
      this.trigger(drawerEvents.change, this);
    } catch {
      // stage saved by another version: shown again once this tab reloads
    }
  }

  /**
   * Image files no longer used by the drawing nor by its history forgotten, with their elements (memory of drawings
   * opened one after the other, images of other users received)
   */
  private _pruneFiles() {
    const used = new Set([...getFileIds(this.getDrawingShapes()), ...this.undoRedo.fileIds()]);

    for (const id of this.files.keys()) {
      if (used.has(id)) continue;
      this.files.delete(id);
      this.#imageElements.delete(id);
    }
  }

  /**
   * Drawing as file content (`.freedrawing` file, link): background color and drawing shapes
   * @param shapes Shapes written in the file, all drawing shapes by default (shapes of groups and frames: at their place
   * in the drawing)
   * @returns Drawing file with background color and states of shapes
   */
  getDrawingFile(shapes: DrawingShape[] = this.getDrawingShapes()): DrawingFile {
    const files = this._getFiles(shapes);

    return {
      type: 'free-drawing',
      version: 1,
      background: this.background.fill() as ColorLike,
      // shapes of groups and frames selected alone: at their place in the drawing, as drawn (bottom first)
      shapes: inDrawingOrder(shapes).map(getStateInDrawing),
      // only with images
      ...(Object.keys(files).length > 0 && { files }),
    };
  }

  /**
   * Image files of shapes
   * @param shapes Drawing shapes (images of groups and frames too)
   * @returns Files of their images (known ones), by id
   */
  private _getFiles(shapes: DrawingShape[]): DrawingFiles {
    return Object.fromEntries(
      getFileIds(shapes)
        .filter((id) => this.files.has(id))
        .map((id) => [id, this.files.get(id)!])
    );
  }

  /**
   * Add image files to the drawing (files of a drawing, of another user): images using them are shown
   * @param files Data URLs by id, invalid ones (not a PNG, JPEG, WebP or GIF image) are ignored
   */
  addFiles(files: DrawingFiles) {
    if (!this._storeFiles(files).length) return;

    for (const shape of this.getDrawingShapes()) setupImages(shape, this.files, this.#imageElements);
    this.drawLayer.batchDraw();
  }

  /**
   * Keep image files (not known ones)
   * @param files Files read (not trusted)
   * @returns Ids of the files added
   */
  private _storeFiles(files: unknown): string[] {
    const added = Object.entries(parseFiles(files)).filter(([id]) => !this.files.has(id));

    for (const [id, data] of added) this.files.set(id, data);
    return added.map(([id]) => id);
  }

  /**
   * Add an image to the drawing: file reduced and encoded to stay small (see `readImage`), shown whole in the view
   * (60 % of it at most, never enlarged), selected with the selection tool. Its file is kept in `files`
   * @param source Image file (PNG, JPEG, WebP, GIF, SVG...) or image already read (data URL and size)
   * @param position Center of the image, in drawing coordinates (center of the view by default)
   * @returns Image added, null when the file is not an image (error shown)
   */
  async addImage(source: Blob | DrawingImage, position?: Vector2d): Promise<Image | null> {
    // paste or insertion: refused once read only started meanwhile
    const readOnly = this.readOnly;
    let image: DrawingImage;

    try {
      image = source instanceof Blob ? await readImage(source) : source;
      if (!isImageData(image.data) || !(image.width > 0) || !(image.height > 0)) {
        throw new DrawerError('error.notImage', 'not an image of a drawing');
      }
    } catch (error) {
      if (!this.#destroyed)
        this.toast(this.t('toast.imageFailed', { error: getErrorText(error, this.i18n.t) }), 'error');
      return null;
    }

    const fileId = await getFileId(image.data);

    // stroke or text edit started meanwhile: added once it ended
    await this._afterAction();
    // removed meanwhile, read only started
    if (this.#destroyed || (this.readOnly && !readOnly)) return null;
    const view = this.getViewArea();
    const center = position ?? { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    const scale = Math.min(1, (0.6 * Math.min(view.width, view.height)) / Math.max(image.width, image.height));
    const [width, height] = [image.width * scale, image.height * scale];
    const node = new Image({
      name: shapeName.image,
      fileId,
      image: undefined,
      x: Math.round(center.x - width / 2),
      y: Math.round(center.y - height / 2),
      width: Math.round(width),
      height: Math.round(height),
    });

    this._storeFiles({ [fileId]: image.data });
    this.addShape(node);
    this.placeInFrames([node]);
    // selected, as a pasted text
    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (selectWidget) {
      selectWidget.setActive(true);
      selectWidget.select([node]);
    }
    this.stage.fire('change');
    return node;
  }

  /**
   * Add an image file chosen by the user (`addImage`)
   * @param position Center of the image, in drawing coordinates (center of the view by default)
   * @returns Image added, null when canceled or not an image
   */
  async insertImage(position?: Vector2d): Promise<Image | null> {
    const file = await pickBlob('image/*');

    return file && this.addImage(file, position);
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
  flipShapes(direction: Direction, shapes: DrawingShape[] = this.getSelectedShapes()) {
    // frames are not flipped
    shapes = shapes.filter((shape) => !isFrame(shape));
    if (!shapes.length) return;

    const horizontal = direction === 'horizontal';
    const center = this._getCenter(shapes);
    /**
     * Node mirrored around an axis of the drawing (absolute point), in coordinates of its parent
     * @param node Shape, group or text
     * @param point Point of the axis, absolute
     */
    const mirror = (node: Node, point: Vector2d) => {
      const parent = node.getParent()!.getAbsoluteTransform();
      const [, b, c] = parent.getMatrix();

      // parent not turned (drawing, frame, group only moved or scaled): exact attributes
      if (Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9) {
        const axis = parent.copy().invert().point(point);

        node.rotation(-node.rotation());
        if (horizontal) node.setAttrs({ x: 2 * axis.x - node.x(), scaleX: -node.scaleX() });
        else node.setAttrs({ y: 2 * axis.y - node.y(), scaleY: -node.scaleY() });
        return;
      }

      // in a turned group: mirror of the drawing in its coordinates
      const flip = new Transform()
        .translate(point.x, point.y)
        .scale(horizontal ? -1 : 1, horizontal ? 1 : -1)
        .translate(-point.x, -point.y);

      node.setAttrs(parent.copy().invert().multiply(flip).multiply(node.getAbsoluteTransform()).decompose());
    };

    // arrows flipped without their shapes are unlinked
    unbindMoved(shapes);
    shapes.forEach((shape) => {
      mirror(shape, center);
      // texts mirrored again around their center: moved, still readable
      (shape instanceof Text ? [shape] : shape instanceof Group ? shape.find<Text>('Text') : []).forEach((text) => {
        const box = text.getClientRect();

        mirror(text, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      });
    });
    // shapes mirrored out of their frame or onto another one
    this.frameHighlight.flash(this.placeInFrames(shapes));
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
    // shapes turned out of their frame or onto another one
    this.frameHighlight.flash(this.placeInFrames(shapes));
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
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new DrawerError('error.clipboardUnavailable', 'clipboard unavailable');
      }

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
      this.toast(this.t('toast.imageNotCopied', { error: getErrorText(error, this.i18n.t) }), 'warning');
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

        // offsets in the transform already
        copy.setAttrs({ ...transform.decompose(), offsetX: 0, offsetY: 0 });
      }
      copy.move({ x: offset, y: offset });
      return copy;
    });
    // ids of copies, also of shapes of groups
    const nodes = (shape: DrawingShape): Node[] => [shape, ...(shape instanceof Group ? shape.find(() => true) : [])];
    const ids = new Map(
      originals.flatMap((shape, i) => nodes(shape).map((node, j) => [node.id(), nodes(copies[i])[j].id()]))
    );

    // copied arrows linked to copied shapes, texts in copied shapes, unlinked from others
    copies.flatMap(nodes).forEach((node) => {
      [...bindingAttrs, 'containerId'].forEach((attr) => {
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
    // texts of the shapes too
    const removed = [
      ...new Set(shapes.flatMap((shape) => [shape, getBoundText(shape, this.drawLayer) ?? []].flat())),
    ].filter((shape) => shape.getLayer()) as DrawingShape[];
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
      // in a frame: dragged as other shapes of frames (in a group: moved with it)
      group.draggable(this._isMovedAlone(group));
    }
    group.zIndex(index);
    this.getWidget<SelectWidget>('selection')?.select([group]);
    this.stage.fire('change');

    return group;
  }

  /**
   * Shape dragged alone with the selection tool: shape of the drawing or of a frame, not of a group (moved with it)
   * @param shape Shape or group in the drawing
   * @returns True when it is draggable now (selection tool active)
   */
  private _isMovedAlone(shape: DrawingShape): boolean {
    const parent = shape.getParent();

    return this.activeTool === 'selection' && (parent === this.drawLayer || isFrame(parent?.getParent()));
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
        child.draggable(this._isMovedAlone(child));
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
      // text of a shape: with its shape
      if (isBoundText(shape) && getContainer(shape, this.drawLayer)) continue;

      const from = getShapeFrame(shape);
      const frame = findFrameAt(shape, frames);

      moveShapeTo(shape, frame ? getFrameContent(frame) : this.drawLayer);
      if (frame === from) continue;
      if (frame) entered.add(frame);
      if (from) left.add(from);
    }
    this._placeBoundTexts(shapes);

    return { entered: [...entered], left: [...left] };
  }

  /**
   * Texts of shapes in the parent of their shape (drawing or frame), above it: a frame takes or gives back a shape with
   * its text, never one without the other (the text would be hidden under its shape, or cut by another frame)
   * @param shapes Shapes placed in frames, texts of shapes among them
   */
  private _placeBoundTexts(shapes: DrawingShape[]) {
    for (const shape of shapes) {
      const text = isBoundText(shape) ? shape : getBoundText(shape, this.drawLayer);
      const container = text && getContainer(text, this.drawLayer);
      const parent = container?.getParent();

      if (!text || !container || !parent || text.getParent() === parent) continue;
      if (!isShapesContainer(parent, this.drawLayer) || !this._isPlaceable(text)) continue;
      moveShapeTo(text, parent);
      text.zIndex(container.zIndex() + 1);
    }
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
    // once per move of the pointer, not for each shape of a big selection
    this.drawLayer.on(
      'dragmove.frames',
      this._oncePerMove(() => this._updateMove())
    );
    transformer?.on('transformstart.frames', () => this._startMove(transformer.nodes() as DrawingShape[]));
    transformer?.on('transform.frames', () => this._updateMove());
  }

  /**
   * Work on the whole drawing during drags done once per move of the pointer: konva moves each node of a selection and
   * fires their `dragmove` in turn (each one snapped there, the transformer starts the drag of the others at the first
   * one), the work is done once all of them moved: window `mousemove` / `touchmove` listened after the one of konva
   * (added with the first stage). A node not dragged by konva (`dragmove` fired by code) does it at once
   * @param run Work done, given the last node moved
   * @returns Listener of `dragmove`
   */
  private _oncePerMove(run: (target: Node) => void): (e: KonvaEventObject<DragEvent>) => void {
    let pending: Node | null = null;
    const flush = () => {
      const target = pending;

      if (!target) return;
      pending = null;
      run(target);
    };

    for (const type of ['mousemove', 'touchmove']) window.addEventListener(type, flush, { signal: this.signal });

    return (e) => {
      if (e.target.isDragging()) pending = e.target;
      else run(e.target);
    };
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
    // texts of shapes: with their shapes
    const free = (shape: DrawingShape) => !isBoundText(shape) || !getContainer(shape, this.drawLayer);
    const left = getFrameShapes(frame).filter((shape) => free(shape) && findFrameAt(shape, [frame]) !== frame);

    for (const shape of left) moveShapeTo(shape, this.drawLayer);
    // shapes of drawing now inside, after the ones moved out
    const inside = this.getDrawingShapes().filter(
      (shape) => !isFrame(shape) && free(shape) && rectContains(box, shape.getClientRect())
    );

    for (const shape of inside) moveShapeTo(shape, getFrameContent(frame));
    this._placeBoundTexts([...left, ...inside]);
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
   * Lock shapes (selected ones by default), with their texts (texts with their shapes): not moved, transformed nor erased on
   * canvas, only selected to be unlocked
   * @param locked True locks shapes, false unlocks them
   * @param shapes Shapes to lock or unlock, selected shapes by default
   * @returns true if a shape changed (change saved)
   */
  setShapesLocked(locked: boolean, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    return this._setShapesState(
      withBoundTexts(shapes, this.drawLayer).filter((shape) => shape.listening() === locked),
      (shape) => shape.listening(!locked)
    );
  }

  /**
   * Hide shapes (selected ones by default), with their texts (texts with their shapes): not drawn, selected nor exported
   * @param hidden True hides shapes, false shows them
   * @param shapes Shapes to hide or show, selected shapes by default
   * @returns true if a shape changed (change saved)
   */
  setShapesHidden(hidden: boolean, shapes: DrawingShape[] = this.getSelectedShapes()): boolean {
    return this._setShapesState(
      withBoundTexts(shapes, this.drawLayer).filter((shape) => shape.visible() === hidden),
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
   * Align shapes on a side or the center of their whole box (bounding boxes of rotated shapes)
   * @param alignment `left`, `center`, `right` (horizontally), `top`, `middle`, `bottom` (vertically)
   * @param shapes Shapes to align (2 at least), selected shapes by default
   */
  alignShapes(alignment: ShapeAlignment, shapes: DrawingShape[] = this.getSelectedShapes()) {
    this._arrangeShapes(shapes, 2, (arranged) => alignShapes(arranged, this.drawLayer, alignment));
  }

  /**
   * Same space between shapes along an axis: the first and last ones stay, the others are placed between them
   * @param direction `horizontal` (spaces between left and right sides) or `vertical`
   * @param shapes Shapes to distribute (3 at least), selected shapes by default
   */
  distributeShapes(direction: Direction, shapes: DrawingShape[] = this.getSelectedShapes()) {
    this._arrangeShapes(shapes, 3, (arranged) => distributeShapes(arranged, this.drawLayer, direction));
  }

  /**
   * Shapes one after the other along an axis, 16 units between them: the first one stays, their place on the other
   * axis is kept
   * @param direction `horizontal` (a row from left to right) or `vertical` (a column from top to bottom)
   * @param shapes Shapes to stack (2 at least), selected shapes by default
   */
  stackShapes(direction: Direction, shapes: DrawingShape[] = this.getSelectedShapes()) {
    this._arrangeShapes(shapes, 2, (arranged) => stackShapes(arranged, this.drawLayer, direction));
  }

  /**
   * Shapes moved by an alignment, a distribution or a stack: arrows moved without their shapes unlinked, shapes placed
   * in the frames they are moved into or out of (highlighted), change saved
   * @param shapes Shapes moved
   * @param min Fewest shapes for this move (nothing done with less), texts of given shapes not counted
   * @param move Move of the shapes, given without the texts of given shapes
   */
  private _arrangeShapes(shapes: DrawingShape[], min: number, move: (shapes: DrawingShape[]) => void) {
    // texts of shapes follow their shape
    shapes = withoutBoundTexts(shapes);
    if (shapes.length < min) return;

    unbindMoved(shapes);
    move(shapes);
    this.frameHighlight.flash(this.placeInFrames(shapes));
    this.stage.fire('change');
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
   * Drawing (or selected shapes) as png, svg or pdf image, fonts of texts loaded first
   * @param format Image format
   * @param options Export options (selection only, background, dark mode, scale)
   * @returns Image file of the format
   * @throws {Error} nothing to export
   */
  async exportImage(format: ImageFormat, options: ExportImageOptions = {}): Promise<Blob> {
    const image = this._prepareExport(format, options);

    if (!image) throw new DrawerError('error.nothingToExport', 'nothing to export');

    const { shapes, box, imageOptions } = image;
    // drawing of the exported shapes kept in png and svg images
    const drawing = options.withDrawing ? JSON.stringify(this.getDrawingFile(shapes)) : null;

    if (format === 'svg') {
      const svg = renderSvg(shapes, box, imageOptions);

      return new Blob([drawing ? await embedDrawingInSvg(svg, drawing) : svg], { type: 'image/svg+xml' });
    }

    // texts drawn with their fonts (export right after loading a drawing, slow network): not a fallback font; images
    // decoded: not empty
    await Promise.all([loadFonts(getFontsToLoad(shapes)), loadImages(getImagesToLoad(shapes))]);

    const canvas = renderCanvas(shapes, box, imageOptions);

    if (format === 'png') {
      const png = await canvasToBlob(canvas);

      return drawing ? embedDrawingInPng(png, drawing) : png;
    }

    const jpeg = new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer());

    // page of the drawing size, also when the canvas scale was lowered (big drawing)
    return createPdf(jpeg, canvas.width, canvas.height, canvas.width / box.width);
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
    // drawings of other apps converted, then validated: files and links can come from anyone
    const json = typeof file === 'string' ? fromOtherApp(file, this.t('shapes.frame')) : JSON.stringify(file);
    const { background, shapes, files } = parseDrawingFile(json);
    // svg images of other apps: read once the drawing is shown
    const svgFiles = typeof file === 'string' && json !== file ? getSvgFiles(JSON.parse(json).files) : [];

    // before its images are set up
    if (files) this._storeFiles(files);
    // all created before the drawing is replaced: kept as it is if one can't be
    const nodes = shapes.map((shape) => Node.create(shape) as DrawingShape);

    this.getWidget<SelectWidget>('selection')?.clearSelection();
    for (const shape of this.getDrawingShapes()) shape.destroy();
    for (const node of nodes) this._addShape(node);
    // fires change: history, saved, sent to collaborators
    this.setBgColor(background);
    // files of the previous drawing kept for its undo only
    this._pruneFiles();
    if (svgFiles.length) this._readSvgFiles(svgFiles);
  }

  /**
   * SVG images of a drawing of another app read as images of drawings (PNG, WebP: drawing files and collaboration
   * servers keep these only), shown once read and once the stroke or text edit in progress ended, then saved and shared
   * @param files SVG files by id (`getSvgFiles`), unread ones left empty
   */
  private async _readSvgFiles(files: [string, Blob][]) {
    const read = await Promise.all(
      files.map(async ([id, svg]) => {
        try {
          return [[id, (await readImage(svg)).data]];
        } catch {
          return [];
        }
      })
    );

    // not during a stroke or a text edit (shapes being erased would be recorded faded, a text saved hidden)
    await this._afterAction();
    if (this.#destroyed || !read.flat().length) return;
    this.addFiles(Object.fromEntries(read.flat()));
    this.stage.fire('change');
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
        this.toast(this.t('toast.saveFailed', { error: getErrorText(error, this.i18n.t) }), 'error');
      }
    }
  }

  /**
   * Open a `.freedrawing` file chosen by user, it replaces drawing (undo restores it)
   */
  async open() {
    // files of the library (also kept in images), drawings of Excalidraw and tldraw
    const file = await pickBlob(
      `${drawingFileExtension},.json,application/json,.png,image/png,.svg,image/svg+xml,.excalidraw,.tldr`
    );

    if (file === null) return;

    try {
      this.loadDrawing(await readDrawingFile(file));
      // its shapes may be anywhere
      this.zoomToFit();
    } catch (error) {
      this.toast(this.t('toast.invalidFile', { error: getErrorText(error, this.i18n.t) }), 'error');
    }
  }

  /**
   * Link to current page with drawing in its hash, no server needed: `#drawing=<data>`, `#<id>=<data>` with the `id`
   * option (several drawers in a page)
   * @returns Url of current page with compressed drawing file in its hash
   */
  async getLink(): Promise<string> {
    const url = new URL(window.location.href);

    url.hash = `${this.#linkKey}=${await encodeLinkData(JSON.stringify(this.getDrawingFile()))}`;

    return url.toString();
  }

  /**
   * Copy link to drawing (see `getLink`) to clipboard
   */
  async copyLink() {
    try {
      // secure context (https) only
      if (!navigator.clipboard) throw new DrawerError('error.clipboardUnavailable', 'clipboard unavailable');

      await navigator.clipboard.writeText(await this.getLink());
      this.toast(this.t('toast.linkCopied'), 'info');
    } catch (error) {
      this.toast(this.t('toast.linkNotCopied', { error: getErrorText(error, this.i18n.t) }), 'warning');
    }
  }

  /**
   * Drawing of a link (see `getLink`) replaces saved one (undo restores it), removed from page url at once: opened by
   * one drawer only. Without `id` option, links of drawers without id, also `#drawer-<n>=` of previous versions
   */
  private async _loadFromLink() {
    const { hash } = window.location;
    const [prefix] =
      this.#linkKey === 'drawing' ? /^#(?:drawing|drawer-\d+)=/.exec(hash) ?? [] : [`#${this.#linkKey}=`];

    if (!prefix || !hash.startsWith(prefix)) return;

    // taken before decoding (asynchronous): not opened by another drawer of the page
    replaceUrl(window.location.pathname + window.location.search);
    try {
      const file = await decodeLinkData(hash.slice(prefix.length));

      // removed meanwhile: nothing loaded nor saved
      if (this.#destroyed) return;
      this.loadDrawing(file);
      this.zoomToFit();
    } catch (error) {
      if (!this.#destroyed)
        this.toast(this.t('toast.invalidLink', { error: getErrorText(error, this.i18n.t) }), 'error');
    }
  }

  /**
   * Change background color
   * @param color Color of the canvas background (change saved)
   */
  setBgColor(color: ColorLike) {
    this._setBackground(color);
    // saved, in history, sent to collaborators
    this.stage.fire('change');
  }

  /**
   * Background color shown, without change (undo / redo, background of other users of a collaboration session)
   * @param color Color of the canvas background
   */
  _setBackground(color: ColorLike) {
    // canvas background only, selected shapes fill is not changed
    this.background.fill(color);
    this.setting.updateBgColor(color);
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
   * @param language 'en', 'fr', 'es', 'de' or 'auto' (browser one); a locale gives its language ('fr-FR'), a language
   * not supported the one of the browser
   */
  setLanguage(language: Language | 'auto') {
    const choice = toLanguageChoice(language);

    this.#languageChoice = choice;
    this.i18n.setLanguage(choice === 'auto' ? getLanguage() : choice);
    this.$drawerContainer.lang = this.i18n.language;
    this.trigger(drawerEvents.languageChange, this.i18n.language);
    this._preferencesChanged();
  }

  /**
   * Interface settings of user (e.g. saved by the app for its logged in user)
   * @returns Current theme, language choice, grid and its style, snapping, zen mode, auto save, keep tool, shape
   * recognition and action of the mouse wheel
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
      shapeRecognition: this.options.shapeRecognition,
      gridStyle: this.options.gridStyle,
      wheelAction: this.options.wheelAction,
    };
  }

  /**
   * Apply interface settings (given ones only), one `preferences.change` event
   * @param preferences Grid wins when grid and snapping are both true
   */
  setPreferences(preferences: Partial<Preferences>) {
    const { theme, language, grid, snapping, zen, autoSave, keepTool, shapeRecognition, gridStyle, wheelAction } =
      preferences;

    if (autoSave !== undefined) this.setAutoSave(autoSave);
    if (keepTool !== undefined) this.setKeepTool(keepTool);
    if (shapeRecognition !== undefined) this.setShapeRecognition(shapeRecognition);
    if (wheelAction !== undefined) this.setWheelAction(wheelAction);
    // before the grid: shown in its style
    if (gridStyle !== undefined) this.setGridStyle(gridStyle);
    if (theme !== undefined && theme !== this.theme) this.setTheme(theme);
    if (language !== undefined && toLanguageChoice(language) !== this.#languageChoice) this.setLanguage(language);
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
    const isChoice = (value: unknown): value is Language | 'auto' => value === 'auto' || isLanguage(value);
    // first valid one
    const theme = [saved.theme, this._getStorageItem(`${key}-theme`)].find(isTheme);
    const language = [saved.language, this._getStorageItem(`${key}-language`)].find(isChoice);
    const gridStyle = gridStyles.find(({ value }) => value === saved.gridStyle)?.value;
    const wheelAction = wheelActions.find(({ value }) => value === saved.wheelAction)?.value;
    const preferences: Partial<Preferences> = {
      ...(theme && { theme }),
      ...(language && { language }),
      ...(gridStyle && { gridStyle }),
      ...(wheelAction && { wheelAction }),
    };

    (['grid', 'snapping', 'zen', 'autoSave', 'keepTool', 'shapeRecognition'] as const).forEach((name) => {
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
    this.#systemDark?.addEventListener?.(
      'change',
      () => {
        if (this.theme === 'system') this._applyTheme();
      },
      { signal: this.signal }
    );
    this.theme = saved ?? this.options.theme;
    this._applyTheme();
  }

  /**
   * Show theme chosen (`drawer-dark` class on container), `theme.change` event
   */
  private _applyTheme() {
    const dark = this.isDarkMode();

    this.$drawerContainer.classList.toggle('drawer-dark', dark);
    // images drawn again: filtered as the drawing in dark mode (see `setupImages`), shadows of notes (`setupNotes`)
    if (this.drawLayer?.findOne('Image') || this.drawLayer?.findOne(`.${shapeName.note}`)) this.drawLayer.batchDraw();
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
   * Path of new arrows, applied to selected arrows
   * @param arrowType 'straight', 'curved' or 'elbow'
   */
  setArrowType(arrowType: ArrowType) {
    this.options.arrowType = arrowType;
    this.getWidget<SelectWidget>('selection')?.setArrowType(arrowType);
    this._triggerOptionsChange({ arrowType });
  }

  /**
   * Heads of the ends of new arrows (given ends only), applied to selected arrows
   * @param heads Head of the start, of the end: 'none', 'arrow', 'triangle', 'dot' or 'bar'
   */
  setArrowheads(heads: Partial<Arrowheads>) {
    // new object: options keep their defaults (never mutated)
    const arrowheads = { ...this.options.arrowheads, ...heads };

    this.options.arrowheads = arrowheads;
    this.getWidget<SelectWidget>('selection')?.setArrowheads(heads);
    this._triggerOptionsChange({ arrowheads });
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
   * Copy the style of shapes (Ctrl + Alt + C), given to other shapes by `pasteStyle`: color, background, stroke width
   * and style, corners, path and heads of arrows, text style, opacity, each part from the first shape it applies to
   * @param shapes Shapes whose style is copied, selection by default
   * @returns Style copied (see `getShapesStyle` of utils/style), null without shape
   */
  copyStyle(shapes: DrawingShape[] = this.getSelectedShapes()): OptionsChange | null {
    if (!shapes.length) return null;

    this.#copiedStyle = getShapesStyle(shapes);
    this.toast(this.t('toast.styleCopied'), 'info');

    return this.#copiedStyle;
  }

  /**
   * Style copied by `copyStyle`
   * @returns Copied style, null before a copy
   */
  get copiedStyle(): OptionsChange | null {
    return this.#copiedStyle;
  }

  /**
   * Paste a style on the selected shapes (Ctrl + Alt + V), each part on the shapes it applies to (as the options
   * panel does), in one change (one step of history); it becomes the style of new shapes too
   * @param style Style to give, the copied one by default (see `copyStyle`)
   */
  pasteStyle(style: OptionsChange | null = this.#copiedStyle) {
    const selectWidget = this.getWidget<SelectWidget>('selection');

    if (!style || !selectWidget) return;

    selectWidget.batchUpdates(() => {
      if (style.strokeColor) this.setStrokeColor(style.strokeColor);
      if (style.fillColor) this.setFillColor(style.fillColor);
      // width first: dashes follow it
      if (style.strokeWidth !== undefined) this.setStrokeWidth(style.strokeWidth);
      if (style.strokeStyle) this.setStrokeStyle(style.strokeStyle);
      if (style.edges !== undefined) this.setEdges(style.edges);
      if (style.arrowType) this.setArrowType(style.arrowType);
      if (style.arrowheads) this.setArrowheads(style.arrowheads);
      if (style.textStyle) this.setTextStyle(style.textStyle);
      if (style.opacity !== undefined) this.setOpacity(style.opacity);
    });
  }

  /**
   * Message read by screen readers (toasts): in the live region of the dialog shown (nothing out of an `aria-modal`
   * dialog is read), else of the drawer
   * @param message Text read
   * @param urgent Read at once (problems), else when the user is idle
   */
  _announce(message: string, urgent: boolean = false) {
    const $modal = [...this.$drawerContainer.querySelectorAll<HTMLElement>('.drawer-modal.show')].pop();
    // none yet while the stage is created
    const $region = $modal?.querySelector<HTMLElement>(':scope > .drawer-live-region') ?? this.$liveRegion;

    if ($region) announce($region, message, urgent);
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
   * Remove the data kept in the browser by the drawer: drawing, its image files and tool, library, preferences, drawings
   * known by collaboration rooms (identity in collaboration sessions kept: id, name, secrets of rooms owned). The drawing
   * shown is emptied (a new drawing, history cleared), unless it is the one of the `storage` option (drawing of the app),
   * of a collaboration session or read only: kept, stored again by its next change. Preferences and library shown keep
   * their values until the next visit (a preference changed is stored again)
   * @param force Force clear (don't show confirm modal)
   */
  clearStoredData(force: boolean = false) {
    if (!force) {
      this.clearStoredConfirmModal ??= new ConfirmModal(this, {
        onConfirm: (modal) => {
          modal.hide();
          this._clearStoredData();
        },
      });
      this.clearStoredConfirmModal.setMessage(this.t('confirm.clearStorage'));
      this.clearStoredConfirmModal.show();
    } else {
      this._clearStoredData();
    }
  }

  /**
   * Data of the browser removed (see `clearStoredData`), toast
   */
  private _clearStoredData() {
    const key = this.options.localStorageKey;
    // `<key>-<suffix>`, drawings known by rooms `<key>-room-<id>` (not `user`, `user-key`, `name`, `owner`)
    const suffixes = ['files', 'tool', 'library', 'preferences', 'theme', 'language', 'rooms'];
    const isRemoved = (stored: string) =>
      stored === key ||
      (stored.startsWith(`${key}-`) &&
        (suffixes.includes(stored.slice(key.length + 1)) || stored.startsWith(`${key}-room-`)));

    try {
      const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) ?? '');

      for (const stored of keys.filter(isRemoved)) localStorage.removeItem(stored);
    } catch {
      // storage unavailable: nothing stored
    }
    this.library._forget();

    if (!this.options.storage && !this.collaboration && !this.readOnly) {
      // new drawing: nothing to undo (undo would store it again), nothing to save
      this.getWidget<SelectWidget>('selection')?.clearSelection();
      for (const shape of this.getDrawingShapes()) shape.destroy();
      this._setBackground('#fff');
      this.undoRedo.reset();
      this.undoRedo.manageButtons();
      // no shape nor history using them
      this._pruneFiles();
      this._setUnsaved(false);
      this.trigger(drawerEvents.change, this);
    }
    this.toast(this.t('toast.storageCleared'), 'info');
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

    // shape dragged by the pointer (first one of a drag, konva drags the other selected shapes after it): snapped,
    // the other moved shapes follow it, so the gaps between them are kept
    let lead: Node | null = null;

    // namespaced, object snapping and change saving also listen drag events of draw layer
    this.drawLayer.on('dragstart.grid', (e) => {
      if (!lead?.isDragging()) lead = e.target;
    });
    this.drawLayer.on('dragend.grid', (e) => {
      if (e.target === lead) lead = null;
    });
    this.drawLayer.on('dragmove.grid', (e) => {
      const node = e.target;

      if (node !== lead || !(node instanceof Shape || node instanceof Group) || node instanceof Line) return;

      const before = node.absolutePosition();
      const layer = this.drawLayer;

      if (node.getParent() === layer && !(node instanceof Group && !isFrame(node))) {
        // exact position
        node.position(snapToGrid(node.position(), this.options.gridStyle));
      } else {
        // in drawing coordinates (shape of a frame, of a group dragged alone): position, top left corner of the box of a
        // group
        const box = node.getClientRect({ relativeTo: layer });
        const point = node instanceof Group && !isFrame(node) ? box : node.getAbsolutePosition(layer);
        const snapped = snapToGrid(point, this.options.gridStyle);

        moveBy(node, layer, snapped.x - point.x, snapped.y - point.y);
      }

      const after = node.absolutePosition();
      const selected = this.getSelectedShapes();

      if (!selected.includes(node as DrawingShape)) return;
      for (const shape of selected) {
        if (shape === node) continue;

        const pos = shape.absolutePosition();

        shape.absolutePosition({ x: pos.x + after.x - before.x, y: pos.y + after.y - before.y });
      }
    });
    /**
     * Resize anchor snapped to the grid of the drawing (lines, points) less than 10 px away on screen, applied by the
     * selection when the anchor is not snapped to objects
     * @param oldPos Absolute position of the anchor before the move
     * @param newPos Absolute position asked by the move
     * @returns Snapped position, new position when far from old one (fast move) or from the grid
     */
    const gridAnchorBound = (oldPos: Vector2d, newPos: Vector2d) => {
      if (!this.grid || Math.hypot(newPos.x - oldPos.x, newPos.y - oldPos.y) > 10) return newPos;

      const style = this.options.gridStyle;
      // grid of the drawing, whatever the view
      const transform = this.drawLayer.getAbsoluteTransform();
      const snapped = transform.point(snapToGrid(transform.copy().invert().point(newPos), style));
      const snappedX = Math.abs(snapped.x - newPos.x) < 10;
      const snappedY = Math.abs(snapped.y - newPos.y) < 10;

      // corners of triangles only
      if (style === 'isometric') return snappedX && snappedY ? snapped : newPos;
      // heights of lines only
      if (style === 'lines') return { x: newPos.x, y: snappedY ? snapped.y : newPos.y };

      // snapped on one axis: the other one kept where it was
      return {
        x: snappedX ? snapped.x : snappedY ? oldPos.x : newPos.x,
        y: snappedY ? snapped.y : snappedX ? oldPos.y : newPos.y,
      };
    };

    if (selectWidget) selectWidget.gridAnchorBound = gridAnchorBound;
    selectWidget?.transformer.rotationSnaps(gridRotationSnaps(this.options.gridStyle));
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
   * Draw grid in its style (`gridStyle` option): one shape drawing the visible area, redrawn with stage (pan, zoom)
   * without creating nodes
   */
  private _drawGrid() {
    const style = this.options.gridStyle;

    this.gridLayer.destroyChildren();
    this.gridLayer.add(
      new Shape({
        name: shapeName.gridLine,
        ...gridShapeStyle(style),
        listening: false,
        sceneFunc: (ctx, shape) => {
          const scale = this.getZoomLevel();
          // visible area in stage coordinates
          const area = {
            x: -this.stage.x() / scale,
            y: -this.stage.y() / scale,
            width: this.stage.width() / scale,
            height: this.stage.height() / scale,
          };

          drawGrid(ctx, shape, area, scale, style);
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
   * Style of the grid (preference): squares, dots, lines of ruled paper or triangles of isometric paper; shapes snap
   * to its lines or points, selections rotate by 30 degrees on isometric paper
   * @param gridStyle Style of the grid, drawn again when shown
   */
  setGridStyle(gridStyle: GridStyle) {
    if (gridStyle === this.options.gridStyle) return;

    this.options.gridStyle = gridStyle;
    if (this.grid) {
      this._drawGrid();
      this.getWidget<SelectWidget>('selection')?.transformer.rotationSnaps(gridRotationSnaps(gridStyle));
    }
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
   * Focus the drawer (its shortcuts) when it is created or its tool changes, unless the user is elsewhere: on another
   * element of the page, in a field or a dialog of the drawer (e.g. tool changed by the right to draw given by the owner
   * of a collaboration session); the page is not scrolled to the drawer
   */
  _takeFocus() {
    const $active = document.activeElement;

    if (hasFocusOutside(this.$drawerContainer)) return;
    if ($active instanceof HTMLElement && $active !== this.$drawerContainer) {
      const field = $active.matches('input, textarea, select, [contenteditable="true"]');

      if (field || $active.closest('[role="dialog"], [role="alertdialog"]')) return;
    }
    this.focus({ preventScroll: true });
  }

  /**
   * Reset drawer to its initial state: remove drawing (without confirmation), white background
   * and drawing options given on init (color, width, opacity, text style...)
   */
  resetDrawer() {
    const { strokeColor, fillColor, strokeWidth, strokeStyle, edges, arrowType, arrowheads, opacity, textStyle } =
      this.#initialOptions;

    this.clearCanvas(true);
    this.setBgColor('#fff');
    this.setStrokeColor(strokeColor);
    this.setFillColor(fillColor);
    this.setStrokeWidth(strokeWidth);
    this.setStrokeStyle(strokeStyle);
    this.setEdges(edges);
    this.setArrowType(arrowType);
    this.setArrowheads(arrowheads);
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
