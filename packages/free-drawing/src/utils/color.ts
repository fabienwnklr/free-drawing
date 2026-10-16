import type { ColorLike } from '@/@types/drawer';

/** Canvas context normalizing colors, created on first use */
let context: CanvasRenderingContext2D | null = null;

/**
 * Konva fill of a background color: none when transparent, so inside is not hit (eraser), as before fill colors
 * @param color background color (`fillColor` option or chosen color)
 * @returns the color, undefined when transparent
 */
export function toFill(color: ColorLike): ColorLike | undefined {
  return color === 'transparent' ? undefined : color;
}

/**
 * Color as canvas normalizes it: `#rrggbb` when opaque, `rgba(...)` else (e.g. `#000` and `black` give `#000000`)
 * @param color any CSS color
 * @returns normalized color in lower case (`#000000` for an invalid color), the color itself without canvas context
 */
export function normalizeColor(color: string): string {
  context ??= document.createElement('canvas').getContext('2d');

  if (!context) return color;

  // invalid color keeps previous value
  context.fillStyle = '#000';
  context.fillStyle = color;

  return String(context.fillStyle).toLowerCase();
}

/**
 * `#rrggbb` value of an opaque color (color input value), undefined for transparent colors
 * @param color any CSS color
 * @returns lower case `#rrggbb` color, undefined when not opaque
 */
export function toHexColor(color: string): string | undefined {
  const normalized = normalizeColor(color);

  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : undefined;
}
