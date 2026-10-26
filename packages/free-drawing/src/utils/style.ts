import type { Group } from 'konva/lib/Group';
import { Shape, type ShapeConfig } from 'konva/lib/Shape';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';
import type { ColorLike, OptionsChange, TextStyle } from '@/@types/drawer';
import { edgesShapes, fillShapes, shapeName, strokeStyleShapes } from '@/constants';
import { getArrowheads, getArrowType } from '@/utils/arrow';
import { getShapes } from '@/utils/hit';
import { getEdges, getStrokeStyle } from '@/utils/stroke';

/**
 * Text style of a text node, as the text options show it
 * @param text Text whose style is read
 * @returns Font family, size, style, decoration and alignment of the text
 */
export function getTextStyle(text: Text): TextStyle {
  return {
    fontFamily: text.fontFamily(),
    fontSize: text.fontSize(),
    fontStyle: text.fontStyle() as TextStyle['fontStyle'],
    textDecoration: text.textDecoration() as TextStyle['textDecoration'],
    align: text.align() as TextStyle['align'],
  };
}

/**
 * Color of a shape as the color setters give it (`SelectWidget.setColor`)
 * @param shape Drawing shape
 * @returns Fill of lines (freehand strokes, highlights) and texts, stroke of other shapes, undefined for images and
 * shapes without stroke (notes)
 */
function colorOf(shape: Shape<ShapeConfig>): ColorLike | undefined {
  if (shape.hasName(shapeName.image)) return undefined;
  if (shape instanceof Line || shape instanceof Text) return (shape.fill() as ColorLike) || undefined;

  return (shape.stroke() as ColorLike) || undefined;
}

/**
 * Style of shapes, each part read from the first shape it applies to (color, background of rectangles, ellipses and
 * path shapes, width of outlines, stroke style, corners, path and heads of arrows, text style); parts applying to
 * none of them are left out
 * @param nodes Drawing shapes or groups (their shapes are read)
 * @returns Style as options of the drawer (see `OptionsChange`), opacity of the first shape
 */
export function getShapesStyle(nodes: (Shape<ShapeConfig> | Group)[]): OptionsChange {
  const shapes = nodes.flatMap(getShapes).filter((node): node is Shape<ShapeConfig> => node instanceof Shape);
  const find = (names: string[]) => shapes.find((shape) => names.some((name) => shape.hasName(name)));
  const color = shapes.map(colorOf).find((value) => !!value);
  const filled = find(fillShapes);
  // width and style of outlines: shapes drawn with a stroke (not notes without one), not highlights (their outline),
  // texts nor images
  const stroked = (shape: Shape<ShapeConfig>) =>
    !!shape.stroke() &&
    !(shape instanceof Text) &&
    !shape.hasName(shapeName.highlighter) &&
    !shape.hasName(shapeName.image);
  const outlined = shapes.find(stroked);
  const dashed = shapes.find((shape) => stroked(shape) && strokeStyleShapes.some((name) => shape.hasName(name)));
  const cornered = find(edgesShapes);
  const arrow = shapes.find((shape): shape is Arrow => shape instanceof Arrow);
  const text = shapes.find((shape): shape is Text => shape instanceof Text);
  const style: OptionsChange = {};

  if (color) style.strokeColor = color;
  // no fill is transparent
  if (filled) style.fillColor = (filled.fill() || 'transparent') as ColorLike;
  if (outlined) style.strokeWidth = outlined.strokeWidth();
  if (dashed) style.strokeStyle = getStrokeStyle(dashed.dash());
  if (cornered) style.edges = getEdges(cornered.getAttr('cornerRadius'));
  if (arrow) Object.assign(style, { arrowType: getArrowType(arrow), arrowheads: getArrowheads(arrow) });
  if (text) style.textStyle = getTextStyle(text);
  if (nodes.length) style.opacity = nodes[0].opacity();

  return style;
}
