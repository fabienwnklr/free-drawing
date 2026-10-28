// Extra tools of free-drawing, as plugins: `new Drawer($el, { plugins: [ExtraShapesPlugin, HighlighterPlugin] })`
export {
  BlockArrowWidget,
  BubbleWidget,
  CheckboxWidget,
  CloudWidget,
  ExtraShapesPlugin,
  HeartWidget,
  HexagonWidget,
  StarWidget,
} from './ExtraShapesPlugin.js';
export {
  HighlighterOverlay,
  HighlighterPlugin,
  HighlighterWidget,
  highlighterColors,
  highlighterSizes,
} from './HighlighterPlugin.js';
export { texts } from './texts.js';
export type { HighlighterChange, HighlighterOverlayOptions } from './types.js';
