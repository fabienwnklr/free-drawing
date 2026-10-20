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
