import { Drawer } from '@/Drawer';
import HighlighterIcon from '@/icons/highlighter.svg?raw';
import type { ColorLike } from '@/@types/drawer';
import { FreehandWidget } from '@/components/toolbar/widgets/FreehandWidget';
import {
  HighlighterOverlay,
  highlighterColors,
  highlighterSizes,
} from '@/components/tools/Overlay/HighlighterOverlay/HighlighterOverlay';
import { shapeName } from '@/constants';

/**
 * Highlighter: wide strokes of fluorescent color (its own, yellow by default), multiplied with the drawing under
 * them so texts and lines stay readable
 */
export class HighlighterWidget extends FreehandWidget {
  overlay: HighlighterOverlay;
  /** Color of strokes, see `highlighterColors` */
  color: ColorLike = highlighterColors[0].color;
  /** Width of strokes, see `highlighterSizes` */
  size: number = highlighterSizes[1].size;

  constructor(drawer: Drawer) {
    super(drawer, 'highlighter', 'Highlighter', HighlighterIcon, 'm');

    this.overlay = new HighlighterOverlay(drawer, {
      color: this.color,
      size: this.size,
      onChange: ({ color, size }) => {
        this.color = color ?? this.color;
        this.size = size ?? this.size;
      },
    });
  }

  protected lineStyle() {
    return {
      // filled outline only: a stroke would be darker (multiplied)
      fill: this.color,
      strokeWidth: 0,
      globalCompositeOperation: 'multiply' as const,
      name: shapeName.highlighter,
    };
  }

  protected strokeSize() {
    return this.size;
  }

  protected freehandSettings() {
    // same width all along, as a marker
    return { thinning: 0, smoothing: 0.5, streamline: 0.5 };
  }
}
