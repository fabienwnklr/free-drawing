import type { AttrCheck, ShapeState, DrawingFile, FilePickerWindow } from '@/@types/file';
import { groupClasses, shapeClasses } from '@free-drawing/protocol';
import { Konva } from 'konva/lib/Global';
import type { Node } from 'konva/lib/Node';
import { parseLink } from '@/utils/link';
import { frameParts } from '@/utils/frame';

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
 * @returns state with only `attrs`, `className` and valid children (groups and frames), null for other classes,
 * without attributes or frames without their parts
 */
function parseShape(shape: ShapeState): ShapeState | null {
  if (typeof shape?.attrs !== 'object' || shape.attrs === null) return null;

  const { className } = shape;

  // groups, frames
  if (groupClasses.includes(className)) {
    const children = Array.isArray(shape.children) ? shape.children.map(parseShape) : [];
    const state = {
      attrs: parseAttrs(shape.attrs, className),
      className,
      children: children.filter((child): child is ShapeState => !!child),
    };

    return className === 'Frame' ? parseFrame(state) : state;
  }

  // no children (konva would add them)
  return shapeClasses.includes(className) ? { attrs: parseAttrs(shape.attrs, className), className } : null;
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
 * @returns drawing file of version 1, white background when missing
 * @throws {Error} not a drawing file
 */
export function parseDrawingFile(json: string): DrawingFile {
  const data = JSON.parse(json);

  if (data?.type !== 'free-drawing' || !Array.isArray(data.shapes)) throw new Error('not a drawing file');

  return {
    type: 'free-drawing',
    version: 1,
    background: typeof data.background === 'string' ? data.background : '#fff',
    shapes: data.shapes.map(parseShape).filter((shape: ShapeState | null): shape is ShapeState => !!shape),
  };
}

/**
 * Base64url text of bytes (URL safe: `-` and `_`, no padding)
 * @param bytes data to encode
 * @returns encoded text
 */
function toBase64Url(bytes: Uint8Array): string {
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
function fromBase64Url(data: string): Uint8Array<ArrayBuffer> {
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
  const bytes = fromBase64Url(data.slice(1));

  return new TextDecoder().decode(
    data[0] === 'z' ? await transform(bytes, new DecompressionStream('deflate-raw')) : bytes
  );
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
 * Text of a file chosen by user, null if canceled
 * @param accept File types (input `accept` attribute)
 * @returns promise of the file text, of null when canceled or no file chosen
 */
export function pickFile(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const $input = document.createElement('input');

    $input.type = 'file';
    $input.accept = accept;
    $input.addEventListener('change', () => {
      const file = $input.files?.[0];

      resolve(file ? file.text() : null);
    });
    $input.addEventListener('cancel', () => resolve(null));
    $input.click();
  });
}
