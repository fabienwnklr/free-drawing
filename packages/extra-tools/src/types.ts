import type { ColorLike } from '@fabwcie/free-drawing';

/**
 * Color or size of highlighter strokes chosen in its overlay
 */
export type HighlighterChange = {
  /** Color chosen */
  color?: ColorLike;
  /** Width chosen */
  size?: number;
};

/**
 * Current choices of highlighter widget, updated by the overlay
 */
export type HighlighterOverlayOptions = {
  /** Color of strokes, one of `highlighterColors` or custom */
  color: ColorLike;
  /** Width of strokes, one of `highlighterSizes` */
  size: number;
  /** Color or size chosen */
  onChange: (change: HighlighterChange) => void;
};
