import type { StrokeStyle } from '@/@types/drawer';

/**
 * Dash of a stroke style, proportional to stroke width.
 * Shapes use round line caps: drawn dashes are longer and gaps shorter by stroke width.
 */
export function getDash(style: StrokeStyle, strokeWidth: number): number[] | undefined {
  if (style === 'dashed') return [strokeWidth * 2, strokeWidth * 3];
  // zero length dashes: round dots of stroke width
  if (style === 'dotted') return [0, strokeWidth * 2];

  return undefined;
}

/**
 * Stroke style of a dash (other dashes, of previous versions, are dashed)
 */
export function getStrokeStyle(dash: number[] | undefined): StrokeStyle {
  if (!dash?.length) return 'solid';

  return dash[0] === 0 ? 'dotted' : 'dashed';
}
