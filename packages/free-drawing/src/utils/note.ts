import type { Node } from 'konva/lib/Node';
import type { Container } from 'konva/lib/Container';
import type { Context } from 'konva/lib/Context';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Vector2d } from 'konva/lib/types';
import type { ColorLike } from '@/@types/drawer';
import type { Choice } from '@/@types/ui';
import { shapeName } from '@/constants';

/**
 * Sticky notes: rectangles (named `rect` and `note`) of a light color holding a text (see utils/boundText), drawn with
 * a shadow; they grow with their text
 */

/** Colors of notes, yellow first (default): the light colors of backgrounds */
export const noteColors: Choice<ColorLike>[] = [
  { value: '#ffec99', label: 'color.lightYellow' },
  { value: '#ffc9c9', label: 'color.lightRed' },
  { value: '#b2f2bb', label: 'color.lightGreen' },
  { value: '#a5d8ff', label: 'color.lightBlue' },
];

/** Size of a new note (drawing units): a square */
export const noteSize = 200;

/** Space between the text of a note and its sides (drawing units) */
export const notePadding = 16;

/** Shadow of notes: blur and offset below them in drawing units, opacity */
const noteShadow = { blur: 12, offsetY: 4, opacity: 0.18 };

/**
 * Color of the shadow of notes
 * @param dark Drawer in dark mode: light shadow, made dark again by the filter of the drawing
 * @returns Css color
 */
const shadowColor = (dark: boolean) => `rgba(${dark ? '255, 255, 255' : '0, 0, 0'}, ${noteShadow.opacity})`;

/** Shadow of notes in svg exports (css filter, drawing units), as drawn */
export const noteShadowFilter = `drop-shadow(0 ${noteShadow.offsetY}px ${noteShadow.blur}px ${shadowColor(false)})`;

/**
 * Shape is a sticky note
 * @param node Node of the drawing
 * @returns True for a note
 */
export const isNote = (node: Node): node is Rect => node instanceof Rect && node.hasName(shapeName.note);

/**
 * Attributes of a new note centered on a point
 * @param center Center of the note, in drawing coordinates
 * @param color Background color of the note
 * @param opacity Opacity of the note (`opacity` option)
 * @returns Attributes of the rectangle of the note
 */
export const noteAttrs = (center: Vector2d, color: ColorLike, opacity: number) => ({
  name: `${shapeName.rect} ${shapeName.note}`,
  x: Math.round(center.x - noteSize / 2),
  y: Math.round(center.y - noteSize / 2),
  width: noteSize,
  height: noteSize,
  fill: color,
  cornerRadius: 4,
  opacity,
});

/**
 * Draw a note with its shadow: dark below it, light in a drawer in dark mode (the filter of the drawing makes it
 * dark again), never saved (not an attribute)
 * @param context Context of the canvas
 * @param note Note drawn
 */
function drawNote(context: Context, note: Rect) {
  // hit region: exact colors, no shadow
  if ('hitCanvas' in context.canvas) {
    Rect.prototype._sceneFunc.call(note, context);
    return;
  }

  const dark = !!note.getStage()?.container().closest('.drawer-dark');
  const scale = note.getAbsoluteScale();
  // shadows of canvas are in pixels: scaled with the zoom and the pixel ratio, as konva does
  const ratio = context.canvas.getPixelRatio() * Math.min(Math.abs(scale.x), Math.abs(scale.y));
  const native = context._context;

  native.save();
  native.shadowColor = shadowColor(dark);
  native.shadowBlur = noteShadow.blur * ratio;
  native.shadowOffsetY = noteShadow.offsetY * ratio;
  Rect.prototype._sceneFunc.call(note, context);
  native.restore();
}

/**
 * Notes of a drawing shape drawn with their shadow: called when shapes are added or loaded (the drawing function is
 * not saved)
 * @param node Drawing shape or group
 */
export function setupNotes(node: Node) {
  const notes = isNote(node) ? [node] : 'find' in node ? (node as Container).find<Rect>(isNote) : [];

  for (const note of notes) note.sceneFunc(drawNote);
}
