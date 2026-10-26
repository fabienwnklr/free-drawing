import type { ColorLike } from '@/@types/drawer';

/**
 * Serialized drawing shape (konva `toObject` format), any shape type can be restored, groups with their shapes
 */
export type ShapeState = {
  /** Konva attributes of the node (position, colors, name, id, label...) */
  attrs: Record<string, unknown>;
  /** Konva class name used by `Node.create` (Rect, Line, Group, Frame...) */
  className: string;
  /** States of the shapes of a group */
  children?: ShapeState[];
};

/** Check of the value of an attribute read from a file, a link or a change of another user (not trusted) */
export type AttrCheck = (value: unknown) => boolean;

/**
 * Drawing shape (top node) added, changed or removed by a history entry: JSON of its state before and after it
 */
export type HistoryChange = {
  /** Id of the shape */
  id: string;
  /** JSON of the shape before the change (`serializeShape`), null for a shape added by it */
  before: string | null;
  /** JSON of the shape after the change, null for a shape removed by it */
  after: string | null;
};

/**
 * Change of the drawing made by this user, undone and redone shape by shape: changes of other users of a
 * collaboration session are not in history, so undo and redo keep them
 */
export type HistoryEntry = {
  /** Shapes added, changed or removed, bottom first */
  changes: HistoryChange[];
  /** Ids of drawing shapes before the change, bottom first: places of shapes put back by undo (removed, reordered) */
  before?: string[];
  /** Ids of drawing shapes after the change, bottom first: places of shapes put back by redo (added, reordered) */
  after?: string[];
  /** Stacking order of shapes changed (reorder): restored from `before` / `after` */
  reordered?: boolean;
  /** Background color changed (e.g. file opened): color before and after the change */
  background?: HistoryBackground;
};

/** Background color of the drawing before and after a change of history */
export type HistoryBackground = {
  /** Color before the change, put back by undo */
  before: ColorLike;
  /** Color after the change, put back by redo */
  after: ColorLike;
};

/**
 * Content of a drawing file or link: background color and drawing shapes (konva `toObject` format)
 */
export type DrawingFile = {
  /** Identifies drawing files */
  type: 'free-drawing';
  /** Version of the file format */
  version: 1;
  /** Background color of the drawing */
  background: ColorLike;
  /** Drawing shapes (top nodes, with children of groups and frames), bottom first */
  shapes: ShapeState[];
  /** Files of its images by id (`fileId` of images), only with images */
  files?: DrawingFiles;
};

/**
 * Image files of a drawing by id: data URLs of PNG, JPEG, WebP or GIF images (`data:image/webp;base64,...`)
 */
export type DrawingFiles = Record<string, string>;

/**
 * Item of the library (`drawer.library`): shapes saved to be inserted again in any drawing
 */
export type LibraryItem = {
  /** Unique id */
  id: string;
  /** Name shown in the library, accessible name of its button */
  name: string;
  /** States of its top shapes (with children of groups and frames), bottom first, where they were in the drawing */
  shapes: ShapeState[];
  /** Files of its images by id, only with images */
  files?: DrawingFiles;
  /** Time it was added (ms since 1970) */
  created: number;
};

/**
 * Content of a library file (`.freedrawinglib`): items to use in another browser or app
 */
export type LibraryFile = {
  /** Identifies library files */
  type: 'free-drawing-library';
  /** Version of the file format */
  version: 1;
  /** Items of the library, oldest first */
  items: LibraryItem[];
};

/**
 * Image ready to be added to a drawing (`drawer.addImage`): its file and size in pixels
 */
export type DrawingImage = {
  /** Data URL of a PNG, JPEG, WebP or GIF image */
  data: string;
  /** Width of the image, in pixels */
  width: number;
  /** Height of the image, in pixels */
  height: number;
};

/**
 * Format of exported images
 */
export type ImageFormat = 'png' | 'svg' | 'pdf';

/**
 * Options of exported images, same rendering in every format
 */
export type ImageOptions = {
  /** Background color, transparent when undefined */
  background?: string;
  /** Dark mode colors (see `toDarkColor`) */
  dark?: boolean;
  /** Pixel ratio of png and pdf (default 2) */
  scale?: number;
};

/**
 * Options of an image export (`exportImage`, `exportCanvas`, export dialog)
 */
export type ExportImageOptions = {
  /** Selected shapes only, when there is a selection (default true) */
  selected?: boolean;
  /** With background color (default true), pdf always has a background */
  background?: boolean;
  /** Dark mode colors (default false) */
  dark?: boolean;
  /** Pixel ratio of png and pdf (default 2) */
  scale?: number;
  /** Drawing kept in png and svg images (its exported shapes), to open them again for editing (default false) */
  withDrawing?: boolean;
};

/** `showSaveFilePicker` of File System Access API (Chromium), not typed by TypeScript */
export type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }> }>;

/** Window of a browser with the File System Access API (save dialog of Chromium) */
export type FilePickerWindow = Window & {
  /** Save dialog of the browser, undefined out of Chromium */
  showSaveFilePicker?: SaveFilePicker;
};
