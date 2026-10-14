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
  type: 'free-drawing';
  version: 1;
  background: ColorLike;
  shapes: ShapeState[];
};

// files and links can come from anyone: only drawing shapes are created
const shapeClasses = ['Line', 'Arrow', 'Rect', 'Ellipse', 'Text'];

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
    shapes: data.shapes
      .filter((shape: ShapeState) => shapeClasses.includes(shape?.className) && typeof shape.attrs === 'object')
      // no children (konva would add them)
      .map(({ attrs, className }: ShapeState) => ({ attrs, className })),
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

function fromBase64Url(data: string): Uint8Array {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
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
}) => Promise<{ createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }> }>;

/**
 * Save text in a file: browser save dialog when available (Chromium), else download
 * @throws {DOMException} `AbortError` when dialog is canceled
 */
export async function saveFile(name: string, content: string) {
  const showSaveFilePicker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

  if (showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'Drawing', accept: { 'application/json': [drawingFileExtension] } }],
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

  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
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
