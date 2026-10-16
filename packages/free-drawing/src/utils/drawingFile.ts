import type { ColorLike } from '@/@types/drawer';
import type { ShapeState } from '@/components/tools/UndoRedo/History';

/**
 * Extension of drawing files (JSON)
 */
export const drawingFileExtension = '.freedrawing';

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

// files and links can come from anyone: only drawing shapes and groups of them are created
const shapeClasses = ['Line', 'Arrow', 'Rect', 'Ellipse', 'Text', 'Path'];

/**
 * Drawing shape or group of a file, null for other nodes
 */
function parseShape(shape: ShapeState): ShapeState | null {
  if (typeof shape?.attrs !== 'object' || shape.attrs === null) return null;

  // groups, frames
  if (shape.className === 'Group' || shape.className === 'Frame') {
    const children = Array.isArray(shape.children) ? shape.children.map(parseShape) : [];

    return {
      attrs: shape.attrs,
      className: shape.className,
      children: children.filter((child): child is ShapeState => !!child),
    };
  }

  // no children (konva would add them)
  return shapeClasses.includes(shape.className) ? { attrs: shape.attrs, className: shape.className } : null;
}

/**
 * Drawing file from its JSON, shapes other than drawing ones are ignored
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

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';

  // by chunks: too many arguments for one call on big drawings
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(data: string): Uint8Array<ArrayBuffer> {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function transform(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Response(bytes).body!.pipeThrough(stream)).arrayBuffer());
}

/**
 * Text as link data (base64url), compressed when browser can: `z` prefix, else `j`
 */
export async function encodeLinkData(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);

  if (typeof CompressionStream === 'undefined') return 'j' + toBase64Url(bytes);

  return 'z' + toBase64Url(await transform(bytes, new CompressionStream('deflate-raw')));
}

/**
 * Text of link data (see `encodeLinkData`)
 */
export async function decodeLinkData(data: string): Promise<string> {
  const bytes = fromBase64Url(data.slice(1));

  return new TextDecoder().decode(data[0] === 'z' ? await transform(bytes, new DecompressionStream('deflate-raw')) : bytes);
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }> }>;

/**
 * Save content in a file: browser save dialog when available (Chromium), else download
 * @param name File name with extension
 * @param type Mime type of content
 * @throws {DOMException} `AbortError` when dialog is canceled
 */
export async function saveFile(name: string, content: Blob | string, type: string = 'application/json') {
  const extension = name.slice(name.lastIndexOf('.'));
  const showSaveFilePicker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

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
