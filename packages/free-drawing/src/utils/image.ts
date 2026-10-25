import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import type { Context } from 'konva/lib/Context';
import { Image } from 'konva/lib/shapes/Image';
import type { DrawingFiles, DrawingImage } from '@/@types/file';
import { DrawerError } from '@/utils/errors';
import { createId } from '@/utils/functions';

/** Longest side of an image kept in a drawing (px): bigger images are reduced when added */
export const maxImageSize = 2048;

/** Longest data URL of an image file read from a file, a link or another user (characters) */
const maxFileLength = 8_000_000;

/** Data URL of an image file: raster formats only (an SVG file is turned into a raster image when added) */
const imageData = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

/** Id of an image file */
const fileIdPattern = /^[\w-]{1,64}$/;

/** Filter of the dark mode of the drawing (`$dark-drawing-filter`): applied to images too, their colors come back */
const darkFilter = 'invert(93%) hue-rotate(180deg)';

/**
 * Data URL of an image file that a drawing can keep
 * @param value Value read from a file, a link or another user (not trusted)
 * @returns True for a data URL of a PNG, JPEG, WebP or GIF image of a reasonable size
 */
export const isImageData = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= maxFileLength && imageData.test(value);

/**
 * Image files of a drawing, only valid ones (files, links and other users can send anything)
 * @param files Files read (not trusted)
 * @returns Files with a valid id and data, in a new object
 */
export function parseFiles(files: unknown): DrawingFiles {
  if (typeof files !== 'object' || files === null || Array.isArray(files)) return {};

  return Object.fromEntries(
    Object.entries(files).filter(([id, data]) => id !== '__proto__' && fileIdPattern.test(id) && isImageData(data))
  );
}

/**
 * Id of an image file: hash of its content (the same image added twice is kept once), random without `crypto.subtle`
 * (page out of a secure context)
 * @param data Data URL of the image
 * @returns Id of 32 characters
 */
export async function getFileId(data: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return createId();

  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)));

  return [...hash.slice(0, 16)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Image of a file chosen or pasted by the user, ready for a drawing: reduced to `maxImageSize`, encoded as WebP
 * (else PNG with transparency, JPEG without), so it stays small in files, links and collaboration
 * @param source Image file (PNG, JPEG, WebP, GIF, SVG...)
 * @returns Data URL and size of the image
 * @throws {DrawerError} `error.notImage` when the browser can't read it
 */
export async function readImage(source: Blob): Promise<DrawingImage> {
  const url = URL.createObjectURL(source);
  const element = document.createElement('img');

  try {
    element.src = url;
    await element.decode();
  } catch (error) {
    throw new DrawerError('error.notImage', 'not an image', { cause: error });
  } finally {
    URL.revokeObjectURL(url);
  }

  // svg without size: default size of an image
  const [naturalWidth, naturalHeight] = [element.naturalWidth || 300, element.naturalHeight || 150];
  const scale = Math.min(1, maxImageSize / Math.max(naturalWidth, naturalHeight));
  const canvas = document.createElement('canvas');

  canvas.width = Math.max(1, Math.round(naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(naturalHeight * scale));

  const context = canvas.getContext('2d');

  if (!context) throw new DrawerError('error.notImage', 'no canvas to read the image');
  context.drawImage(element, 0, 0, canvas.width, canvas.height);

  let data = canvas.toDataURL('image/webp', 0.9);

  // browser without WebP encoder (Safari): PNG keeps transparency
  if (!data.startsWith('data:image/webp')) {
    const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height);
    const transparent = pixels.some((value, i) => i % 4 === 3 && value < 255);

    data = transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
  }

  return { data, width: canvas.width, height: canvas.height };
}

/**
 * Images of a node (itself, or images of a group or a frame)
 * @param node Drawing shape or group
 * @returns Konva images
 */
export const findImages = (node: Node): Image[] =>
  node instanceof Image ? [node] : 'find' in node ? (node as Container).find<Image>('Image') : [];

/**
 * Ids of the files of images
 * @param nodes Drawing shapes or groups
 * @returns Ids of their files, each one once
 */
export const getFileIds = (nodes: Node[]): string[] => [
  ...new Set(nodes.flatMap(findImages).map((image) => String(image.getAttr('fileId') ?? ''))),
];

/**
 * Draw an image: in dark mode, filtered as the drawing (filtered twice, its colors come back), not in exports
 * (stage out of the drawer)
 * @param context Context of the canvas
 * @param shape Image drawn
 */
function drawImage(context: Context, shape: Image) {
  const dark = !!shape.getStage()?.container().closest('.drawer-dark');

  if (dark) context._context.filter = darkFilter;
  shape._sceneFunc(context);
  if (dark) context._context.filter = 'none';
}

/**
 * Element of an image file, created once, its node drawn again once it is loaded
 * @param image Image showing it
 * @param files Files of the drawing
 * @param elements Elements of the files of the drawing, by id
 */
function showImage(image: Image, files: ReadonlyMap<string, string>, elements: Map<string, HTMLImageElement>) {
  const fileId = String(image.getAttr('fileId') ?? '');
  const data = files.get(fileId);

  // file not received yet (collaboration): shown once added (`drawer.addFiles`)
  if (!data) return;

  let element = elements.get(fileId);

  if (!element) {
    element = document.createElement('img');
    element.src = data;
    elements.set(fileId, element);
  }
  if (!element.complete) {
    element.addEventListener('load', () => image.getLayer()?.batchDraw(), { once: true });
  }
  image.image(element);
}

/**
 * State of an image without its element: its file is in the files of the drawing (`fileId`), not in its attributes
 * @param this Image saved, copied, sent
 * @returns Konva state of the image
 */
function imageToObject(this: Image) {
  const state = Image.prototype.toObject.call(this);

  delete state.attrs.image;
  return state;
}

/**
 * Images of a drawing shape shown from the files of the drawing (again when their file changes), drawn as the
 * drawing in dark mode, saved without their element. Called when shapes are added or loaded
 * @param node Drawing shape or group
 * @param files Files of the drawing
 * @param elements Elements of the files of the drawing, by id
 */
export function setupImages(node: Node, files: ReadonlyMap<string, string>, elements: Map<string, HTMLImageElement>) {
  for (const image of findImages(node)) {
    image.toObject = imageToObject;
    // element of a saved state (not drawable): from the file
    if (!(image.image() instanceof HTMLImageElement)) image.image(undefined);
    image.sceneFunc(drawImage);
    image.off('fileIdChange.image');
    image.on('fileIdChange.image', () => showImage(image, files, elements));
    showImage(image, files, elements);
  }
}
