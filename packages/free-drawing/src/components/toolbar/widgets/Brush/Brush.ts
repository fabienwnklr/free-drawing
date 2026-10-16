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

/**
 * Brush: freehand strokes of stroke color, width and opacity, thinner when drawn fast (settings of perfect-freehand
 * from brush widget options)
 */
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
      /** Stroke color (`strokeColor` option) */
      stroke: strokeColor,
      /** Outline of the stroke filled with stroke color */
      fill: strokeColor,
      /** Opacity (`opacity` option) */
      opacity,
      /** Stroke width (`strokeWidth` option) */
      strokeWidth,
      /** Drawn over the drawing (normal blending) */
      globalCompositeOperation: 'source-over' as const,
      /** Shape name of brush strokes */
      name: shapeName.line,
    };
  }

  protected strokeSize() {
    return this.drawer.options.strokeWidth;
  }

  protected freehandSettings() {
    const { thinning, smoothing, streamline } = { ...freehandDefaults, ...this.options };

    return {
      /** Effect of drawing speed on stroke width (`thinning` option, 0.6 by default) */
      thinning,
      /** Softness of stroke edges (`smoothing` option, 1 by default) */
      smoothing,
      /** Stabilization of stroke (`streamline` option, 0.5 by default) */
      streamline,
    };
  }
}
