import type { Edges, StrokeStyle } from '@/@types/drawer';

/**
 * Dash of a stroke style, proportional to stroke width.
 * Shapes use round line caps: drawn dashes are longer and gaps shorter by stroke width.
 * @param style stroke style name
 * @param strokeWidth stroke width of the shape (shape units)
 * @returns konva dash (lengths of dashes and gaps), undefined for solid strokes
 */
export function getDash(style: StrokeStyle, strokeWidth: number): number[] | undefined {
  if (style === 'dashed') return [strokeWidth * 2, strokeWidth * 3];
  // zero length dashes: round dots of stroke width
  if (style === 'dotted') return [0, strokeWidth * 2];

  return undefined;
}

/**
 * Stroke style of a dash (other dashes, of previous versions, are dashed)
 * @param dash konva dash of a shape
 * @returns solid without dash, dotted when dashes have a zero length, else dashed
 */
export function getStrokeStyle(dash: number[] | undefined): StrokeStyle {
  if (!dash?.length) return 'solid';

  return dash[0] === 0 ? 'dotted' : 'dashed';
}

/**
 * Radius of corners of a rectangle: none (sharp), a quarter of its smallest side, 32 at most (round), or given one
 * @param width width of the rectangle (negative when drawn leftwards)
 * @param height height of the rectangle (negative when drawn upwards)
 * @param edges edges option: 'sharp', 'round' or radius
 * @returns konva `cornerRadius`, 0 or more, rounded to 2 decimals for round edges
 */
export function getCornerRadius(width: number, height: number, edges: Edges = 'round'): number {
  if (typeof edges === 'number') return Math.max(0, edges);
  if (edges === 'sharp') return 0;

  return Math.round(Math.min(32, Math.min(Math.abs(width), Math.abs(height)) / 4) * 100) / 100;
}

/**
 * Edges of a shape from its corner radius (konva: number or radius of each corner): sharp or radius
 * @param cornerRadius konva `cornerRadius` of a rectangle
 * @returns largest radius rounded to 2 decimals, 'sharp' without radius
 */
export function getEdges(cornerRadius: number | number[] | undefined): Edges {
  const radius = Array.isArray(cornerRadius) ? Math.max(...cornerRadius) : cornerRadius;

  return radius ? Math.round(radius * 100) / 100 : 'sharp';
}
