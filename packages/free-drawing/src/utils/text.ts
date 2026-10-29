import { Container } from 'konva/lib/Container';
import type { Node } from 'konva/lib/Node';
import { Text } from 'konva/lib/shapes/Text';
import type { DrawingShape } from '@/@types/drawer';
import { getShapes } from '@/utils/hit';
import { getFrameOfTitle, isFrame } from '@/utils/frame';

/**
 * Family of the Ubuntu font of the library (`@font-face` of its style sheet): its own name, so the `Ubuntu` font of the
 * page (installed, with its other weights) is left to it
 */
export const libraryUbuntu = 'free-drawing-ubuntu';

/**
 * Font family of a text as the browser reads it: `Ubuntu` of drawings (texts, titles of frames) is the font of the
 * library, then an installed Ubuntu; other families as they are, names with spaces quoted (as konva does)
 * @param fontFamily font family of a text (CSS list)
 * @returns CSS list of font families
 */
export function cssFontFamily(fontFamily: string): string {
  return fontFamily
    .split(',')
    .map((family) => family.trim())
    .flatMap((family) =>
      family.replace(/["']/g, '').toLowerCase() === 'ubuntu' ? [libraryUbuntu, 'Ubuntu'] : [family]
    )
    .map((family) => (family.includes(' ') && !/["']/.test(family) ? `"${family}"` : family))
    .join(', ');
}

/**
 * Font of the canvas for a text: style, variant, size and family read by the browser (see `cssFontFamily`)
 * @returns CSS font of the text
 */
function contextFont(this: Text): string {
  return `${this.fontStyle()} ${this.fontVariant()} ${this.fontSize()}px ${cssFontFamily(this.fontFamily())}`;
}

/**
 * Texts of a node drawn and measured with the font of the library for `Ubuntu` (see `cssFontFamily`): their font family
 * is kept (saves, files, style of the selection). Konva clones do not keep it: copies of shapes are set up too
 * @param node drawing shape, group, frame, copy of one
 */
export function setupFonts(node: Node) {
  const texts = node instanceof Text ? [node] : node instanceof Container ? node.find<Text>('Text') : [];

  for (const text of texts) {
    if (text._getContextFont === contextFont) continue;
    text._getContextFont = contextFont;
    // lines measured again with it
    text._setTextData();
  }
}

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

  const measured = new Text(attrs);

  setupFonts(measured);
  return Math.max(1, Math.ceil(measured.width()));
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
