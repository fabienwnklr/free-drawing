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

/**
 * Color of the drawing shown at a color of the screen in dark mode: inverse of the filter `invert(93%)
 * hue-rotate(180deg)` of the drawing (see `toDarkColor` of utils/export), for a color picked on the screen
 * @param color Color seen on the screen
 * @returns `#rrggbb` color of the drawing; a color whose dark color the filter clamps (saturated or pale ones) comes
 * back near it, not exactly
 */
export function fromDarkColor(color: string): string {
  const hex = toHexColor(color) ?? '#000000';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  // hue rotate 180deg: its own inverse
  const inverted = [
    -0.574 * r + 1.43 * g + 0.144 * b,
    0.426 * r + 0.43 * g + 0.144 * b,
    0.426 * r + 1.43 * g - 0.856 * b,
  ];

  // invert 93%: c gives 0.93 - 0.86 c
  return `#${inverted
    .map((c) => Math.round(Math.min(1, Math.max(0, (0.93 - c) / 0.86)) * 255))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}
