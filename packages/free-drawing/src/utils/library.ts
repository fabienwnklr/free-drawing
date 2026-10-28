import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import { Node } from 'konva/lib/Node';
import type { Vector2d } from 'konva/lib/types';
import type { Drawer } from '@/Drawer';
import type { DrawingShape } from '@/@types/drawer';
import type { LibraryFile, LibraryItem, ShapeState } from '@/@types/file';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { getStateInDrawing } from '@/components/tools/UndoRedo/History';
import { inDrawingOrder } from '@/utils/order';
import { drawerEvents } from '@/constants';
import { bindingAttrs } from '@/utils/binding';
import { getBoundText, isBoundText } from '@/utils/boundText';
import { parseShape, pickFile, saveFile } from '@/utils/drawingFile';
import { DrawerError, getErrorText } from '@/utils/errors';
import { getExportBox, renderSvg } from '@/utils/export';
import { createId } from '@/utils/functions';
import { getFileIds, parseFiles, setupImages } from '@/utils/image';

/** Extension of library files */
export const libraryFileExtension = '.freedrawinglib';

/** Type of the data of an item of the library dragged onto the drawing */
export const libraryDragType = 'application/x-free-drawing-library';

/** Length of the name of an item, at most */
const maxNameLength = 100;

/**
 * Nodes of a drawing shape in the order of its state: the shape, then the nodes of groups and frames (depth first)
 * @param shape Drawing shape or group
 * @returns Shape and its descendants
 */
const nodesOf = (shape: Node): Node[] => [shape, ...(shape instanceof Group ? shape.find(() => true) : [])];

/**
 * Item of a library read from storage or a file (not trusted): only drawing shapes, as in drawing files
 * @param value Item to check
 * @returns Item with valid shapes and files, null without id or shapes
 */
export function parseLibraryItem(value: unknown): LibraryItem | null {
  if (typeof value !== 'object' || value === null) return null;

  const { id, name, shapes, files, created } = value as Record<string, unknown>;

  if (typeof id !== 'string' || !/^[\w-]{1,64}$/.test(id) || !Array.isArray(shapes)) return null;

  const states = shapes.map((shape) => parseShape(shape as ShapeState)).filter((shape) => !!shape);
  const images = parseFiles(files);

  if (!states.length) return null;

  return {
    id,
    name: typeof name === 'string' ? name.slice(0, maxNameLength) : '',
    shapes: states,
    ...(Object.keys(images).length > 0 && { files: images }),
    created: typeof created === 'number' && Number.isFinite(created) ? created : Date.now(),
  };
}

/**
 * Items of a library file (or of the library kept in the browser)
 * @param json Content of a `.freedrawinglib` file
 * @returns Valid items, invalid ones left out
 * @throws {DrawerError} not a library file
 */
export function parseLibraryFile(json: string): LibraryItem[] {
  let data: Partial<LibraryFile> | null;

  try {
    data = JSON.parse(json);
  } catch {
    data = null;
  }
  if (data?.type !== 'free-drawing-library' || !Array.isArray(data.items)) {
    throw new DrawerError('error.notLibraryFile', 'not a library file');
  }

  return data.items.map(parseLibraryItem).filter((item) => !!item);
}

/**
 * Library of a drawer (`drawer.library`): shapes saved as items (`add`) inserted again in any drawing (`insert`),
 * kept in the browser (`<localStorageKey>-library`, shared by the drawings of the drawer), exported and imported as
 * `.freedrawinglib` files; `library.change` event on each change
 */
export class Library {
  /** Drawer whose shapes are saved and receiving the inserted ones */
  drawer: Drawer;
  /** Items, oldest first */
  #items: LibraryItem[];
  /** Previews of items (svg data URLs), by id */
  #previews = new Map<string, string>();

  /**
   * Library kept in the browser
   * @param drawer Drawer whose shapes are saved and receiving the inserted ones
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.#items = this._read();
  }

  /**
   * Items of the library, oldest first
   * @returns Items (not to modify: use `add`, `remove`, `rename`, `setItems`)
   */
  get items(): readonly LibraryItem[] {
    return this.#items;
  }

  /**
   * Save shapes as a new item: the shapes, their texts, groups and frames with their shapes, files of their images
   * @param shapes Shapes to save (selection by default)
   * @param name Name of the item, by default the name of its shape (its text) or the number of its shapes
   * @returns New item, null without shape
   */
  add(shapes: DrawingShape[] = this.drawer.getSelectedShapes(), name?: string): LibraryItem | null {
    // as drawn: bottom first
    const saved = inDrawingOrder(shapes.filter((shape) => shape.getLayer()));

    if (!saved.length) return null;

    // shapes of groups or of frames: at their place in the drawing
    const states = saved.map(getStateInDrawing);
    const files = Object.fromEntries(
      getFileIds(saved)
        .filter((id) => this.drawer.files.has(id))
        .map((id) => [id, this.drawer.files.get(id)!])
    );
    const item: LibraryItem = {
      id: createId(),
      name: (name ?? this._defaultName(saved)).slice(0, maxNameLength),
      shapes: states,
      ...(Object.keys(files).length > 0 && { files }),
      created: Date.now(),
    };

    this.#items = [...this.#items, item];
    this._changed();

    return item;
  }

  /**
   * Remove an item
   * @param id Id of the item
   */
  remove(id: string) {
    if (!this.#items.some((item) => item.id === id)) return;

    this.#items = this.#items.filter((item) => item.id !== id);
    this.#previews.delete(id);
    this._changed();
  }

  /**
   * Rename an item
   * @param id Id of the item
   * @param name New name (empty: name kept)
   */
  rename(id: string, name: string) {
    const trimmed = name.trim().slice(0, maxNameLength);

    if (!trimmed) return;

    this.#items = this.#items.map((item) => (item.id === id ? { ...item, name: trimmed } : item));
    this._changed();
  }

  /**
   * Replace the items (library of an app: account, server...), invalid ones left out
   * @param items Items of the library, oldest first
   */
  setItems(items: LibraryItem[]) {
    this.#items = items.map(parseLibraryItem).filter((item) => !!item);
    this.#previews.clear();
    this._changed();
  }

  /**
   * Insert the shapes of an item in the drawing (new ids, links of its arrows and texts of its shapes kept between
   * them), centered on a point, in the frame there, selected with the selection tool: one change
   * @param item Item or its id
   * @param center Center of the inserted shapes in drawing coordinates, center of the view by default
   * @returns Inserted shapes, none for an unknown item
   */
  insert(item: LibraryItem | string, center?: Vector2d): DrawingShape[] {
    const { drawer } = this;
    const found = typeof item === 'string' ? this.#items.find(({ id }) => id === item) : item;

    if (!found) return [];

    if (found.files) drawer.addFiles(found.files);

    // ids of the item to ids of the inserted nodes (same order: depth first)
    const ids = new Map<string, string>();
    const inserted = found.shapes.map((state) => {
      const copy = structuredClone(state);
      const previous: string[] = [];
      // new ids given by addShape
      const removeIds = ({ attrs, children }: ShapeState) => {
        previous.push(String(attrs.id ?? ''));
        delete attrs.id;
        children?.forEach(removeIds);
      };

      removeIds(copy);

      const shape = drawer.addShape(Node.create(copy) as DrawingShape);
      const nodes = nodesOf(shape);

      previous.forEach((id, i) => {
        if (id && nodes[i]) ids.set(id, nodes[i].id());
      });
      return shape;
    });

    // arrows linked to shapes of the item, texts in them, unlinked from others
    for (const node of inserted.flatMap(nodesOf)) {
      for (const attr of [...bindingAttrs, 'containerId']) {
        if (node.getAttr(attr)) node.setAttr(attr, ids.get(node.getAttr(attr)));
      }
    }

    const box = getExportBox(inserted, drawer.drawLayer);
    const view = drawer.getViewArea();
    const target = center ?? { x: view.x + view.width / 2, y: view.y + view.height / 2 };

    if (box) {
      const offset = {
        x: Math.round(target.x - box.x - box.width / 2),
        y: Math.round(target.y - box.y - box.height / 2),
      };

      for (const shape of inserted) shape.move(offset);
    }

    drawer.placeInFrames(inserted);

    const selectWidget = drawer.getWidget<SelectWidget>('selection');

    if (selectWidget) {
      selectWidget.setActive(true);
      selectWidget.select(inserted);
    }
    drawer.stage.fire('change');

    return inserted;
  }

  /**
   * Preview of an item: svg image of its shapes (fonts of the page not loaded in it), kept until the item is removed
   * @param item Item of the library
   * @returns Data URL of the svg image
   */
  getPreview(item: LibraryItem): string {
    const known = this.#previews.get(item.id);

    if (known) return known;

    const layer = new Layer();
    const files = new Map(Object.entries(item.files ?? {}));
    const elements = new Map<string, HTMLImageElement>();
    const shapes = item.shapes.map((state) => {
      const shape = Node.create(structuredClone(state)) as DrawingShape;

      layer.add(shape);
      setupImages(shape, files, elements);
      return shape;
    });
    const box = getExportBox(shapes, layer);
    const svg = box ? renderSvg(shapes, box) : '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    layer.destroy();
    this.#previews.set(item.id, url);

    return url;
  }

  /**
   * Content of a library file of the items
   * @returns Library file (`.freedrawinglib` JSON)
   */
  toFile(): LibraryFile {
    return { type: 'free-drawing-library', version: 1, items: [...this.#items] };
  }

  /**
   * Add the items of a library file, items already in the library (same id) left out
   * @param json Content of a `.freedrawinglib` file
   * @returns Number of items added
   * @throws {DrawerError} not a library file
   */
  import(json: string): number {
    const known = new Set(this.#items.map(({ id }) => id));
    const added = parseLibraryFile(json).filter(({ id }) => !known.has(id));

    if (added.length) {
      this.#items = [...this.#items, ...added];
      this._changed();
    }
    return added.length;
  }

  /**
   * Import a library file chosen by the user, toast of the items added or of the error
   */
  async importFile() {
    const content = await pickFile(`${libraryFileExtension},.json,application/json`);

    if (content === null) return;

    try {
      this.drawer.toast(this.drawer.t('toast.libraryImported', { count: this.import(content) }), 'info');
    } catch (error) {
      this.drawer.toast(
        this.drawer.t('toast.invalidFile', { error: getErrorText(error, this.drawer.i18n.t) }),
        'error'
      );
    }
  }

  /**
   * Save the library in a `.freedrawinglib` file, with the save dialog of the browser when available, else downloaded
   * @param name File name without extension
   */
  async exportFile(name: string = 'library') {
    try {
      await saveFile(name + libraryFileExtension, JSON.stringify(this.toFile()));
    } catch (error) {
      // dialog canceled
      if ((error as Error).name !== 'AbortError') {
        this.drawer.toast(
          this.drawer.t('toast.saveFailed', { error: getErrorText(error, this.drawer.i18n.t) }),
          'error'
        );
      }
    }
  }

  /**
   * Key of the library in the browser storage: shared by the drawings of the drawer
   * @returns localStorage key
   */
  private _key() {
    return `${this.drawer.options.localStorageKey}-library`;
  }

  /**
   * Items kept in the browser
   * @returns Valid items, none when missing or invalid
   */
  private _read(): LibraryItem[] {
    try {
      const json = localStorage.getItem(this._key());

      return json ? parseLibraryFile(json) : [];
    } catch {
      return [];
    }
  }

  /**
   * Library changed: kept in the browser (toast when the storage is full), `library.change` event
   */
  private _changed() {
    try {
      localStorage.setItem(this._key(), JSON.stringify(this.toFile()));
    } catch (error) {
      this.drawer.toast(
        this.drawer.t('toast.libraryNotSaved', { error: getErrorText(error, this.drawer.i18n.t) }),
        'error'
      );
    }
    this.drawer.trigger(drawerEvents.libraryChange, this.#items);
  }

  /**
   * Name of a new item: the first line of the text of its shape or the name of its shape, else its number of shapes
   * @param shapes Saved shapes
   * @returns Name in the current language
   */
  private _defaultName(shapes: DrawingShape[]): string {
    // texts of shapes counted with them
    const main = shapes.filter((shape) => !isBoundText(shape));

    if (main.length !== 1) return this.drawer.t('library.shapes', { count: main.length || shapes.length });

    const text = getBoundText(main[0], this.drawer.drawLayer)?.text().split('\n')[0].trim();

    return text || this.drawer.getShapeLabel(main[0]);
  }
}
