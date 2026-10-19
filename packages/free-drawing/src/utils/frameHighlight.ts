import { Rect } from 'konva/lib/shapes/Rect';
import { Tween } from 'konva/lib/Tween';
import type { Layer } from 'konva/lib/Layer';
import type { FrameChanges } from '@/@types/shapes';
import { type Frame, frameTransform } from '@/utils/frame';

/** Name of highlights of frames, in the selection layer */
export const frameHighlightName = 'drawer-frame-highlight';

/** Color of highlights: primary color of the interface */
const highlightColor = '#646cff';

/** Fade out of highlights once shapes are dropped, in seconds */
const fadeDuration = 0.4;

/** Highlight of a frame receiving shapes: solid border, tinted inside */
const enteredStyle = {
  stroke: highlightColor,
  strokeWidth: 2,
  dash: undefined,
  fill: 'rgba(100, 108, 255, 0.08)',
};

/** Highlight of a frame losing shapes: dashed border */
const leftStyle = { stroke: highlightColor, strokeWidth: 1.5, dash: [6, 4], fill: undefined };

/**
 * Frames entered (solid border, tinted) and left (dashed border) by shapes being moved: shown while moving, faded out
 * once dropped, drawn in the selection layer under the transformer (frames themselves not changed: not saved nor sent)
 */
export class FrameHighlight {
  /** Layer of highlights (selection layer) */
  readonly layer: Layer;
  /** Highlights shown, by frame */
  #rects = new Map<Frame, Rect>();

  /**
   * Highlights of frames in a layer above the drawing
   * @param layer selection layer
   */
  constructor(layer: Layer) {
    this.layer = layer;
  }

  /**
   * Show frames entered and left by shapes being moved, others no more highlighted
   * @param changes frames entered (a frame both left and entered is entered) and left
   */
  show({ entered, left }: FrameChanges) {
    const styles = new Map<Frame, typeof enteredStyle | typeof leftStyle>();

    for (const frame of left) styles.set(frame, leftStyle);
    for (const frame of entered) styles.set(frame, enteredStyle);
    // selection layer emptied on load
    for (const [frame, rect] of this.#rects) {
      if (styles.has(frame) && rect.getLayer()) continue;
      rect.destroy();
      this.#rects.delete(frame);
    }
    for (const [frame, style] of styles) {
      let rect = this.#rects.get(frame);

      if (!rect) {
        rect = new Rect({ name: frameHighlightName, listening: false, strokeScaleEnabled: false, cornerRadius: 2 });
        this.layer.add(rect);
        // under transformer and guides
        rect.moveToBottom();
        this.#rects.set(frame, rect);
      }
      rect.setAttrs({ ...frameTransform(frame), width: frame.width(), height: frame.height(), ...style });
    }
  }

  /**
   * Highlights faded out (shapes dropped), removed after the same time without fading when the user prefers less
   * motion
   */
  fade() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    for (const rect of this.#rects.values()) {
      if (!rect.getLayer()) continue;
      if (reduceMotion) {
        setTimeout(() => rect.destroy(), fadeDuration * 1000);
      } else {
        new Tween({ node: rect, duration: fadeDuration, opacity: 0, onFinish: () => rect.destroy() }).play();
      }
    }
    this.#rects.clear();
  }

  /**
   * Frames entered and left by shapes moved at once (arrow keys): highlighted, then faded out
   * @param changes frames entered and left
   */
  flash(changes: FrameChanges) {
    if (!changes.entered.length && !changes.left.length) return;

    this.show(changes);
    this.fade();
  }
}
