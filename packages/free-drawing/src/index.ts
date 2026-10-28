/**
 * Entry of the package (build, aliases of the web app and of the plugin template): what apps and plugins import from
 * `@fabwcie/free-drawing`, the drawer and its public API.
 *
 * @module exports
 */
export { Drawer } from '@/Drawer';
// types of options, storage, preferences and files, for apps using the drawer
export type {
  ColorLike,
  CssColorNames,
  Direction,
  DrawerEventMap,
  DrawerOptions,
  DrawerStorage,
  DrawerUser,
  DrawingShape,
  ArrowType,
  Arrowhead,
  Arrowheads,
  Edges,
  HEX,
  OptionsChange,
  Preferences,
  RGB,
  RGBA,
  ShapeAlignment,
  ShapeOrder,
  StrokeStyle,
  TextStyle,
  Theme,
} from '@/@types/drawer';
export type {
  AccessRequest,
  CollaborationMember,
  CollaborationOptions,
  CollaborationSession,
  CollaborationSocket,
  DrawingChange,
  PresentedView,
  EncryptedChange,
  EncryptedMessage,
  EncryptedShape,
  ViewArea,
} from '@/@types/collaboration';
export type {
  DrawingFile,
  LibraryFile,
  LibraryItem,
  DrawingFiles,
  DrawingImage,
  ExportImageOptions,
  HistoryBackground,
  HistoryChange,
  HistoryEntry,
  ImageFormat,
  ShapeState,
} from '@/@types/file';
export type {
  AvailableTypes,
  Choice,
  ColorPickerOptions,
  Command,
  ConfirmModalOptions,
  ContextMenuItemOptions,
  LayoutItemOptions,
  LayoutRegion,
  ModalOptions,
  SlideshowOptions,
} from '@/@types/ui';
export type { Listener } from '@/@types/utils';
export type { FrameChanges } from '@/@types/shapes';
export type {
  AvailableTools,
  BrushWidgetOptions,
  GroupWidgetOptions,
  OverlayOptions,
  PluginToolName,
  ToolOverlay,
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
  Translate,
  TranslationKey,
  TranslationParams,
  Translations,
} from '@/@types/i18n';
export type {
  ListenedTarget,
  PluginClass,
  PluginEntry,
  PluginCommand,
  PluginCommandMenu,
  PluginOptions,
  PluginRequirement,
  RegisteredCommand,
  WidgetClass,
} from '@/@types/plugin';
// for plugins: their base, bases of widgets, events, names of shapes, buttons of their interface
export { Plugin } from '@/plugins/Plugin';
export { PluginCollection } from '@/plugins/PluginCollection';
export { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
export { ShapeWidget } from '@/components/toolbar/widgets/ShapeWidget';
// selection of shapes from code: `drawer.getWidget<SelectWidget>('selection')?.select(shapes)`
export type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
// classes of the public API, as types: members of the drawer (`drawer.layout` is a `DrawerLayout`), results of its
// methods (`drawer.toast()` gives a `Toast`), shapes (`Frame`)
export type { default as MicroEvent } from '@/utils/MicroEvent';
export type { DrawerLayout } from '@/DrawerLayout';
export type { I18n } from '@/i18n/I18n';
export type { HotKey } from '@/utils/HotKey';
export type { Frame } from '@/utils/frame';
export type { FrameHighlight } from '@/utils/frameHighlight';
export type { ShapeLinks } from '@/utils/shapeLinks';
export type { ArrowHandle } from '@/utils/arrowHandle';
export type { TouchGestures } from '@/utils/TouchGestures';
export type { Toolbar } from '@/components/toolbar/Toolbar';
export type { GroupWidget } from '@/components/toolbar/widgets/GroupWidget';
export type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
export type { ShapeOverlay } from '@/components/tools/Overlay/ShapeOverlay/ShapeOverlay';
export type { TextOverlay } from '@/components/tools/Overlay/TextOverlay/TextOverlay';
export type { SelectOverlay } from '@/components/tools/Overlay/SelectOverlay/SelectOverlay';
export type { ColorPicker } from '@/components/ColorPicker/ColorPicker';
export type { Dropdown } from '@/components/Dropdown/Dropdown';
export type { Settings } from '@/components/tools/Settings/Settings';
export type { SaveButton } from '@/components/tools/SaveButton/SaveButton';
export type { Zoom } from '@/components/tools/Zoom/Zoom';
export type { Position } from '@/components/tools/Position/Position';
export type { UndoRedo } from '@/components/tools/UndoRedo/UndoRedo';
export type { History } from '@/components/tools/UndoRedo/History';
export type { Help } from '@/components/tools/Help/Help';
export type { Modal } from '@/components/Modal/Modal';
export type { ConfirmModal } from '@/components/Modal/ConfirmModal';
export type { Toast } from '@/components/Toast/Toast';
export type { ContextMenu } from '@/components/ContextMenu/ContextMenu';
export type { CommandPalette } from '@/components/CommandPalette/CommandPalette';
export type { PreferencesModal } from '@/components/PreferencesModal/PreferencesModal';
export type { ExportModal } from '@/components/ExportModal/ExportModal';
export type { LayersPanel } from '@/components/LayersPanel/LayersPanel';
export type { LibraryPanel } from '@/components/LibraryPanel/LibraryPanel';
export type { Library } from '@/utils/library';
export type { SelectionMenu } from '@/components/SelectionMenu/SelectionMenu';
export type { LinkEditor } from '@/components/LinkEditor/LinkEditor';
export type { Collaboration } from '@/components/Collaboration/Collaboration';
export type { CollaborationModal } from '@/components/CollaborationModal/CollaborationModal';
export type { CollaborationIndicator } from '@/components/CollaborationIndicator/CollaborationIndicator';
export type { CollaborationPanel } from '@/components/CollaborationPanel/CollaborationPanel';
export type { CollaborationMembers } from '@/components/CollaborationMembers/CollaborationMembers';
export type { SearchBar } from '@/components/SearchBar/SearchBar';
export type { Slideshow } from '@/components/Slideshow/Slideshow';
export type { ShapeNavigation } from '@/utils/shapeNavigation';
export type { RoomCipher } from '@/utils/encryption';
export { drawerEvents, shapeName } from '@/constants';
export { createButton, setLabel, setPressed } from '@/utils/dom';
// shortcuts shown as by the library (`Ctrl+Shift+Z`: ⇧⌘Z on Apple devices) and their `aria-keyshortcuts`
export { ariaShortcut, formatShortcut } from '@/utils/shortcut';
