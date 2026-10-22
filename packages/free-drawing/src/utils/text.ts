import { Container } from 'konva/lib/Container';
import { Text } from 'konva/lib/shapes/Text';
import type { DrawingShape } from '@/@types/drawer';
import { getShapes } from '@/utils/hit';
import { getFrameOfTitle, isFrame } from '@/utils/frame';

/**
 * Texts of shapes and of their groups (not shapes of frames, nor titles of frames)
 * @param shapes drawing shapes (selection)
 * @returns texts among the shapes and in their groups at any depth
 */
export function getTexts(shapes: DrawingShape[]): Text[] {
  return shapes
    .flatMap((shape) => (isFrame(shape) ? [] : getShapes(shape)))
    .filter((shape): shape is Text => shape instanceof Text && !getFrameOfTitle(shape));
}

/**
 * Width of a text box fitting its content: longest line as konva measures it, and padding
 * @param text text node, measured with its style (font, size, padding)
 * @returns width in text coordinates, rounded up, 1 at least
 */
export function getContentWidth(text: Text): number {
  const attrs = { ...text.getAttrs() };

  // measured by a text of the same style with automatic width
  delete attrs.width;

  return Math.max(1, Math.ceil(new Text(attrs).width()));
}

/**
 * Fit width of a text to its content (lines no longer wrapped), its lines stay in place whatever their alignment
 * @param text text node to resize (moved along its x axis for center or right alignment)
 * @returns true if width changed
 */
export function fitTextWidth(text: Text): boolean {
  const width = getContentWidth(text);

  if (width === text.width()) return false;

  const align = text.align();
  // centered or right aligned lines move with box size
  const shift = (text.width() - width) * (align === 'center' ? 0.5 : align === 'right' ? 1 : 0);
  // along its own x axis (rotation, scale, flip)
  const transform = text.getTransform();
  const origin = transform.point({ x: 0, y: 0 });
  const moved = transform.point({ x: shift, y: 0 });

  text.setAttrs({ width, x: text.x() + moved.x - origin.x, y: text.y() + moved.y - origin.y });

  return true;
}

/**
 * Fonts of texts not loaded yet by the browser (a text drawn before its font is loaded uses a fallback font: exports,
 * preview of the export dialog)
 * @param shapes drawing shapes (texts of groups and frames included)
 * @returns fonts of the canvas (style, size, family) to load, each once
 */
export function getFontsToLoad(shapes: DrawingShape[]): string[] {
  if (!document.fonts) return [];

  const texts = shapes.flatMap((shape) =>
    shape instanceof Text ? [shape] : shape instanceof Container ? shape.find<Text>('Text') : []
  );
  const fonts = new Set(texts.map((text) => text._getContextFont()));

  return [...fonts].filter((font) => !document.fonts.check(font));
}

/**
 * Loads fonts (see `getFontsToLoad`), an unavailable one keeps the fallback font
 * @param fonts fonts of the canvas (style, size, family)
 */
export async function loadFonts(fonts: string[]) {
  await Promise.all(fonts.map((font) => document.fonts.load(font).catch(() => [])));
}
