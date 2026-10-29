import type { AttrCheck, ShapeState, DrawingFile, FilePickerWindow } from '@/@types/file';
import type { ColorLike } from '@/@types/drawer';
import { DrawerError } from '@/utils/errors';
import { groupClasses, shapeClasses } from '@free-drawing/protocol';
import { Konva } from 'konva/lib/Global';
import type { Node } from 'konva/lib/Node';
import { parseLink } from '@/utils/link';
import { frameParts } from '@/utils/frame';
import { pathShapes, shapeName } from '@/constants';
import { parseFiles } from '@/utils/image';
import { createId } from '@/utils/functions';

/** Longest id of a shape: collaboration servers refuse a change holding a longer one */
export const maxShapeIdLength = 200;

/** Longest background color: collaboration servers refuse a change holding a longer one */
const maxBackgroundLength = 100;

/**
 * Ids of the shapes of a drawing file made unique and short enough (`maxShapeIdLength`): a repeated id is replaced, a
 * long one too, with the links of arrows and texts to it; shapes without id get one when added
 * @param shapes States of the shapes of the file (changed)
 */
export function fixIds(shapes: ShapeState[]) {
  const states: ShapeState[] = [];
  const visit = (state: ShapeState) => {
    states.push(state);
    state.children?.forEach(visit);
  };
  const seen = new Set<string>();
  const renamed = new Map<string, string>();

  shapes.forEach(visit);
  for (const { attrs } of states) {
    const { id } = attrs;

    if (typeof id !== 'string' || !id) {
      delete attrs.id;
    } else if (id.length > maxShapeIdLength || seen.has(id)) {
      attrs.id = createId();
      // links follow a long id (a repeated one links to its first shape)
      if (!seen.has(id) && !renamed.has(id)) renamed.set(id, attrs.id as string);
    }
    if (typeof attrs.id === 'string') seen.add(attrs.id);
  }
  for (const { attrs } of states) {
    for (const key of ['containerId', 'startBinding', 'endBinding']) {
      const target = renamed.get(attrs[key] as string);

      if (target) attrs[key] = target;
    }
  }
}

/**
 * Extension of drawing files (JSON)
 */
export const drawingFileExtension = '.freedrawing';

// files, links and shapes of other users of a collaboration can come from anyone: only drawing shapes and groups of
// them are created (`shapeClasses`, `groupClasses` of the protocol, also checked by the server), with attributes of
// the expected types (a wrong one would throw while creating or drawing the shape)

/**
 * Number attribute
 * @param value Value read
 * @returns True for a finite number
 */
const isNumber: AttrCheck = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * Text attribute
 * @param value Value read
 * @returns True for a string
 */
const isString: AttrCheck = (value) => typeof value === 'string';

/**
 * On / off attribute
 * @param value Value read
 * @returns True for a boolean
 */
const isBoolean: AttrCheck = (value) => typeof value === 'boolean';

/**
 * Attribute of numbers (points, dash)
 * @param value Value read
 * @returns True for an array of finite numbers
 */
const isNumbers: AttrCheck = (value) => Array.isArray(value) && value.every(isNumber);

/** Attributes of drawing shapes read by konva or the library, with the check of their value */
const attrChecks: Record<string, AttrCheck> = {
  ...Object.fromEntries(
    [
      'x',
      'y',
      'width',
      'height',
      'radius',
      'radiusX',
      'radiusY',
      'innerRadius',
      'outerRadius',
      'rotation',
      'scaleX',
      'scaleY',
      'skewX',
      'skewY',
      'offsetX',
      'offsetY',
      'opacity',
      'strokeWidth',
      'fontSize',
      'lineHeight',
      'padding',
      'letterSpacing',
      'tension',
      'pointerLength',
      'pointerWidth',
      'clipX',
      'clipY',
      'clipWidth',
      'clipHeight',
      'dashOffset',
      'miterLimit',
      'shadowBlur',
      'shadowOpacity',
      'shadowOffsetX',
      'shadowOffsetY',
      // bend of curved arrows, middle segment of elbow ones
      'bend',
      'elbowMid',
    ].map((key) => [key, isNumber])
  ),
  ...Object.fromEntries(
    [
      'id',
      'name',
      'label',
      'fill',
      'stroke',
      'data',
      'text',
      'fontFamily',
      'fontStyle',
      'fontVariant',
      'textDecoration',
      'align',
      'verticalAlign',
      'wrap',
      'direction',
      'lineCap',
      'lineJoin',
      'globalCompositeOperation',
      'shadowColor',
      'startBinding',
      'endBinding',
      'startAnchor',
      'endAnchor',
      // file of an image (`files` of the drawing)
      'fileId',
      // shape holding a text
      'containerId',
      // path and heads of arrows
      'arrowType',
      'startHead',
      'endHead',
    ].map((key) => [key, isString])
  ),
  ...Object.fromEntries(
    [
      'visible',
      'listening',
      'draggable',
      'closed',
      'bezier',
      'pointerAtBeginning',
      'pointerAtEnding',
      'fillEnabled',
      'strokeEnabled',
      'strokeScaleEnabled',
      'perfectDrawEnabled',
      'shadowEnabled',
      'shadowForStrokeEnabled',
      'dashEnabled',
      'fillAfterStrokeEnabled',
      'ellipsis',
    ].map((key) => [key, isBoolean])
  ),
  points: isNumbers,
  dash: isNumbers,
  // radius of every corner, or of each one
  cornerRadius: (value) => isNumber(value) || isNumbers(value),
  hitStrokeWidth: (value) => isNumber(value) || value === 'auto',
};

/**
 * Konva sets this attribute with a method of the class (`setAttrs`): a property of konva (patterns, functions,
 * filters, z-index...) or a method (`attrs`...), not an attribute of data
 * @param className Konva class of the node
 * @param key Name of the attribute
 * @returns True when the class has a `set<Key>` method
 */
const isKonvaProperty = (className: string, key: string) => {
  const NodeClass = (Konva as unknown as Record<string, typeof Node | undefined>)[className];
  const prototype = NodeClass?.prototype as unknown as Record<string, unknown> | undefined;

  return typeof prototype?.[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] === 'function';
};

/**
 * Attributes of a node state: attributes of drawing shapes of the expected type (`attrChecks`), other attributes
 * kept as data (plugins...) unless konva reads them, without `__proto__` (konva would set it as prototype of the node
 * attributes) nor a link other than a web page or an email address (`parseLink`)
 * @param attrs Attributes read from a file or a change (not trusted)
 * @param className Konva class of the node
 * @returns Valid attributes, in a new object
 */
const parseAttrs = (attrs: object, className: string): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(attrs)
      .filter(([key, value]) => {
        if (key === '__proto__') return false;
        if (key === 'link') return !!parseLink(value);

        const check = attrChecks[key];

        return check ? check(value) : !isKonvaProperty(className, key);
      })
      .map(([key, value]) => [key, key === 'link' ? parseLink(value) : value])
  );

/** Names of the parts of frames: given to the children of a frame only */
const framePartNames: string[] = Object.values(frameParts);

/**
 * Names of nodes of the drawer found by name (layers, background, nodes of the selection layer) and of the parts of
 * frames: not given to drawing shapes (a shape named `selection` would be found as the selection layer)
 */
const reservedNames = new Set([
  'background',
  'grid',
  'draw',
  'selection',
  shapeName.background,
  shapeName.selection,
  shapeName.guideLine,
  shapeName.gridLine,
  ...framePartNames,
]);

/** Classes of the shapes named by the library: the name of a shape of another class is dropped (read as this kind) */
const namedClasses: Record<string, string[]> = {
  [shapeName.line]: ['Line'],
  [shapeName.highlighter]: ['Line'],
  [shapeName.straightLine]: ['Line', 'Arrow'],
  [shapeName.rect]: ['Rect'],
  [shapeName.note]: ['Rect'],
  [shapeName.ellipse]: ['Ellipse'],
  [shapeName.arrow]: ['Arrow'],
  ...Object.fromEntries(pathShapes.map((name) => [name, ['Path']])),
  [shapeName.text]: ['Text'],
  [shapeName.image]: ['Image'],
  [shapeName.group]: ['Group'],
  [shapeName.frame]: ['Frame'],
};

/**
 * Name of a shape of a file: reserved names and names of other kinds of shapes dropped
 * @param name Names of the shape, separated by spaces
 * @param className Class of the shape
 * @param framePart Child of a frame: names of the parts of frames kept
 * @returns Names kept, separated by spaces
 */
const parseName = (name: string, className: string, framePart: boolean) =>
  name
    .split(' ')
    .filter(
      (word) =>
        word &&
        (!reservedNames.has(word) || (framePart && framePartNames.includes(word))) &&
        (namedClasses[word]?.includes(className) ?? true)
    )
    .join(' ');

/**
 * Frame with only its parts, as created by `createFrame`: box, title, group of its shapes
 * @param frame Frame state, its attributes and children parsed
 * @returns Frame state with its parts in this order, null when one is missing
 */
function parseFrame(frame: ShapeState): ShapeState | null {
  const part = (name: string, className: string) =>
    frame.children?.find(
      (child) =>
        child.className === className &&
        String(child.attrs.name ?? '')
          .split(' ')
          .includes(name)
    );
  const parts = [part(frameParts.box, 'Rect'), part(frameParts.title, 'Text'), part(frameParts.content, 'Group')];

  return parts.every((child) => !!child) ? { ...frame, children: parts as ShapeState[] } : null;
}

/**
 * Drawing shape or group of a file, null for other nodes
 * @param shape node state read from the file (not trusted)
 * @param framePart Child of a frame: may be one of its parts
 * @returns state with only `attrs`, `className` and valid children (groups and frames), null for other classes,
 * without attributes or frames without their parts; names reserved by the drawer dropped
 */
export function parseShape(shape: ShapeState, framePart = false): ShapeState | null {
  if (typeof shape?.attrs !== 'object' || shape.attrs === null) return null;

  const { className } = shape;
  const attrsOf = () => {
    const attrs = parseAttrs(shape.attrs, className);

    if (typeof attrs.name === 'string') attrs.name = parseName(attrs.name, className, framePart);
    return attrs;
  };

  // groups, frames
  if (groupClasses.includes(className)) {
    const children = Array.isArray(shape.children)
      ? shape.children.map((child) => parseShape(child, className === 'Frame'))
      : [];
    const state = {
      attrs: attrsOf(),
      className,
      children: children.filter((child): child is ShapeState => !!child),
    };

    return className === 'Frame' ? parseFrame(state) : state;
  }

  // no children (konva would add them)
  return shapeClasses.includes(className) ? { attrs: attrsOf(), className } : null;
}

/**
 * Drawing shape received from another user of a collaboration, checked as shapes of files
 * @param json JSON of a shape state (konva `toObject`), not trusted
 * @returns state with only drawing shapes (see `parseDrawingFile`), null for other nodes, without id or invalid JSON
 */
export function parseShapeState(json: unknown): ShapeState | null {
  try {
    const state = typeof json === 'string' ? parseShape(JSON.parse(json)) : null;

    return state && typeof state.attrs.id === 'string' && state.attrs.id ? state : null;
  } catch {
    return null;
  }
}

/**
 * Drawing file from its JSON, shapes other than drawing ones are ignored
 * @param json content of a `.freedrawing` file or of a link
 * @returns drawing file of version 1, white background when missing or invalid, ids of shapes unique (`fixIds`)
 * @throws {Error} not a drawing file
 */
export function parseDrawingFile(json: string): DrawingFile {
  // content checked below
  let data: ReturnType<typeof JSON.parse>;

  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new DrawerError('error.notDrawingFile', 'not a drawing file (invalid JSON)', { cause: error });
  }
  if (data?.type !== 'free-drawing' || !Array.isArray(data.shapes)) {
    throw new DrawerError('error.notDrawingFile', 'not a drawing file');
  }

  // valid image files only
  const files = parseFiles(data.files);
  const shapes = data.shapes
    .map((shape: ShapeState) => parseShape(shape))
    .filter((shape: ShapeState | null): shape is ShapeState => !!shape);
  const { background } = data;

  fixIds(shapes);

  return {
    type: 'free-drawing',
    version: 1,
    background:
      typeof background === 'string' && background && background.length <= maxBackgroundLength
        ? (background as ColorLike)
        : '#fff',
    shapes,
    ...(Object.keys(files).length > 0 && { files }),
  };
}

/**
 * Base64url text of bytes (URL safe: `-` and `_`, no padding)
 * @param bytes data to encode
 * @returns encoded text
 */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';

  // by chunks: too many arguments for one call on big drawings
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Bytes of base64url text (see `toBase64Url`)
 * @param data encoded text, without padding
 * @returns decoded bytes
 * @throws {DOMException} `InvalidCharacterError` when not base64
 */
export function fromBase64Url(data: string): Uint8Array<ArrayBuffer> {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * Bytes compressed or decompressed by a stream
 * @param bytes data to transform
 * @param stream compression (`deflate-raw`) or decompression stream
 * @returns transformed bytes
 */
async function transform(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Response(bytes).body!.pipeThrough(stream)).arrayBuffer());
}

/**
 * Text as link data (base64url), compressed when browser can: `z` prefix, else `j`
 * @param text JSON of a drawing file
 * @returns data to put in a link hash
 */
export async function encodeLinkData(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);

  if (typeof CompressionStream === 'undefined') return `j${toBase64Url(bytes)}`;

  return `z${toBase64Url(await transform(bytes, new CompressionStream('deflate-raw')))}`;
}

/**
 * Text of link data (see `encodeLinkData`)
 * @param data data of a link hash, with its `z` or `j` prefix
 * @returns decoded text (JSON of a drawing file)
 */
export async function decodeLinkData(data: string): Promise<string> {
  try {
    const bytes = fromBase64Url(data.slice(1));

    return new TextDecoder().decode(
      data[0] === 'z' ? await transform(bytes, new DecompressionStream('deflate-raw')) : bytes
    );
  } catch (error) {
    // cut or changed link
    throw new DrawerError('error.damagedLink', 'damaged link data', { cause: error });
  }
}

/**
 * Save content in a file: browser save dialog when available (Chromium), else download
 * @param name File name with extension
 * @param content file content: text or binary data (exported image)
 * @param type Mime type of content
 * @throws {DOMException} `AbortError` when dialog is canceled
 */
export async function saveFile(name: string, content: Blob | string, type: string = 'application/json') {
  const extension = name.slice(name.lastIndexOf('.'));
  const { showSaveFilePicker } = window as FilePickerWindow;

  if (showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: name,
        types: [{ description: `${extension.slice(1).toUpperCase()} file`, accept: { [type]: [extension] } }],
      });
      const writable = await handle.createWritable();

      await writable.write(content);
      await writable.close();
      return;
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      // not allowed (cross origin frame...): download
    }
  }

  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const $link = document.createElement('a');

  $link.href = url;
  $link.download = name;
  $link.click();
  URL.revokeObjectURL(url);
}

/**
 * File chosen by user, null if canceled
 * @param accept File types (input `accept` attribute)
 * @returns promise of the file, of null when canceled or no file chosen
 */
export function pickBlob(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const $input = document.createElement('input');

    $input.type = 'file';
    $input.accept = accept;
    $input.addEventListener('change', () => resolve($input.files?.[0] ?? null));
    $input.addEventListener('cancel', () => resolve(null));
    $input.click();
  });
}

/**
 * Text of a file chosen by user, null if canceled
 * @param accept File types (input `accept` attribute)
 * @returns promise of the file text, of null when canceled or no file chosen
 */
export async function pickFile(accept: string): Promise<string | null> {
  const file = await pickBlob(accept);

  return file ? file.text() : null;
}
