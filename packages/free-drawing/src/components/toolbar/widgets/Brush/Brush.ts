import { Drawer } from '@/Drawer';
import BrushIcon from '@/icons/brush.svg?raw';
import { BrushOverlay } from '@/components/tools/Overlay/BrushOverlay/BrushOverlay';
import { FreehandWidget } from '@/components/toolbar/widgets/FreehandWidget';
import { shapeName } from '@/constants';
import type { BrushWidgetOptions } from '@/@types/toolbar';

/**
 * Freehand stroke settings used when not given in brush widget options
 */
const freehandDefaults = { thinning: 0.6, smoothing: 1, streamline: 0.5 };

export class BrushWidget extends FreehandWidget {
  overlay: BrushOverlay;
  declare readonly options: BrushWidgetOptions;

  constructor(drawer: Drawer) {
    super(drawer, 'brush', 'Brush', BrushIcon, 'b');

    this.overlay = new BrushOverlay(drawer);
  }

  protected lineStyle() {
    const { strokeColor, opacity, strokeWidth } = this.drawer.options;

    return {
      stroke: strokeColor,
      fill: strokeColor,
      opacity,
      strokeWidth,
      globalCompositeOperation: 'source-over' as const,
      name: shapeName.line,
    };
  }

  protected strokeSize() {
    return this.drawer.options.strokeWidth;
  }

  protected freehandSettings() {
    const { thinning, smoothing, streamline } = { ...freehandDefaults, ...this.options };

    return { thinning, smoothing, streamline };
  }
}
