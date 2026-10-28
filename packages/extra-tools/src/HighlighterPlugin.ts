import {
  ColorPicker,
  FreehandWidget,
  Plugin,
  createButton,
  createOverlaySection,
  setLabel,
  setPressed,
  shapeName,
  type Choice,
  type ColorLike,
  type Drawer,
  type TranslationKey,
} from '@fabwcie/free-drawing';
import { highlighterIcon, widthIcon } from './icons.js';
import { texts } from './texts.js';
import type { HighlighterChange, HighlighterOverlayOptions } from './types.js';

/** Fluorescent colors of highlighter, yellow first (default) */
export const highlighterColors: Choice<ColorLike>[] = [
  { value: '#ffe066', label: 'color.yellow' },
  { value: '#8ce99a', label: 'color.green' },
  { value: '#74c0fc', label: 'color.blue' },
  { value: '#faa2c1', label: 'color.pink' },
  { value: '#ffc078', label: 'color.orange' },
];

/** Widths of highlighter strokes, medium by default */
export const highlighterSizes: Choice<number>[] = [
  { value: 12, label: 'width.thin' },
  { value: 20, label: 'width.medium' },
  { value: 32, label: 'width.thick' },
];

/**
 * Options of highlighter: its own colors and widths, not those of other tools
 */
export class HighlighterOverlay {
  /** Panel element (region) in floating region, shown with `show` */
  readonly $overlayContainer: HTMLDivElement;
  /** Color choice among `highlighterColors` or custom */
  readonly colorPicker: ColorPicker;
  /** Width buttons, one per `highlighterSizes` (width in `data-size`) */
  readonly $sizeButtons: HTMLButtonElement[];

  /**
   * Create the panel (color and width sections) in floating region, hidden until `show`
   * @param drawer Drawer of the highlighter widget
   * @param options Choices of the widget, shown by the fields and changed in place by `setChange`
   */
  constructor(
    drawer: Drawer,
    /** Choices of the widget, changed in place by `setChange` */
    private readonly options: HighlighterOverlayOptions
  ) {
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');
    this.$overlayContainer.setAttribute('role', 'region');
    // text of the plugin (`texts`), found by the texts of the drawer
    drawer.i18n.translate((t) =>
      this.$overlayContainer.setAttribute('aria-label', t('highlighter.options' as TranslationKey))
    );

    const colors = createOverlaySection(drawer, 'overlay.color');
    const sizes = createOverlaySection(drawer, 'overlay.strokeWidth');

    this.colorPicker = new ColorPicker(colors.$buttons, {
      i18n: drawer.i18n,
      colors: highlighterColors,
      attr: 'data-highlighter-color',
      buttonClass: 'overlay-picker__button',
      onChange: (color) => this.setChange({ color }),
    });
    this.$sizeButtons = highlighterSizes.map(({ value: size, label }) => {
      const $btn = createButton('drawer-button', 'overlay-picker__button');

      $btn.innerHTML = widthIcon(size / 3);
      $btn.dataset.size = String(size);
      drawer.i18n.translate((t) => setLabel($btn, t(label)));
      $btn.addEventListener('click', () => this.setChange({ size }));
      return $btn;
    });
    sizes.$buttons.append(...this.$sizeButtons);
    this.$overlayContainer.append(colors.$container, sizes.$container);
    drawer.layout.add('floating', this.$overlayContainer);
    this._update();
  }

  /**
   * Color or size chosen: fields updated, widget told
   * @param change Chosen color or width, merged into the widget choices
   */
  setChange(change: HighlighterChange) {
    Object.assign(this.options, change);
    this._update();
    this.options.onChange(change);
  }

  /**
   * Show panel (highlighter active)
   */
  show() {
    this.$overlayContainer.classList.add('show');
  }

  /**
   * Hide panel (other tool, selection shown)
   */
  hide() {
    this.$overlayContainer.classList.remove('show');
  }

  /**
   * Fields show the current color and width
   */
  private _update() {
    this.colorPicker.setColor(this.options.color);
    for (const $btn of this.$sizeButtons) {
      setPressed($btn, Number($btn.dataset.size) === this.options.size);
    }
  }
}

/**
 * Highlighter: wide strokes of fluorescent color (its own, yellow by default), multiplied with the drawing under
 * them so texts and lines stay readable
 */
export class HighlighterWidget extends FreehandWidget {
  overlay: HighlighterOverlay;
  /** Color of strokes, see `highlighterColors` */
  color: ColorLike = highlighterColors[0].value;
  /** Width of strokes, see `highlighterSizes` */
  size: number = highlighterSizes[1].value;

  /**
   * Create the highlighter tool, shortcut M, with its overlay of colors and sizes
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'highlighter', 'Highlighter', highlighterIcon, 'm');

    this.overlay = new HighlighterOverlay(drawer, {
      color: this.color,
      size: this.size,
      onChange: ({ color, size }) => {
        this.color = color ?? this.color;
        this.size = size ?? this.size;
      },
    });
  }

  /**
   * Style of highlighter strokes
   * @returns Fill of highlighter color without stroke, multiply blending, name of highlighter strokes
   */
  protected lineStyle() {
    return {
      /** Outline of the stroke filled with highlighter color (no stroke: it would be darker, multiplied) */
      fill: this.color,
      /** No stroke around the outline */
      strokeWidth: 0,
      /** Multiplied with the drawing under it: texts and lines stay readable */
      globalCompositeOperation: 'multiply' as const,
      /** Shape name of highlighter strokes */
      name: shapeName.highlighter,
    };
  }

  /**
   * Width of highlighter strokes
   * @returns Size chosen in the overlay
   */
  protected strokeSize() {
    return this.size;
  }

  /**
   * Settings of perfect-freehand of a marker
   * @returns Constant width, medium smoothing and stabilization
   */
  protected freehandSettings() {
    return {
      /** Same width all along, as a marker */
      thinning: 0,
      /** Softness of stroke edges */
      smoothing: 0.5,
      /** Stabilization of stroke */
      streamline: 0.5,
    };
  }
}

/**
 * Highlighter tool (M): wide strokes of fluorescent colors, its own colors and widths, multiplied with the drawing
 * under them. In the "More tools" group of the toolbar by default (`widgetGroups` option)
 */
export class HighlighterPlugin extends Plugin {
  /** Unique name: `drawer.plugins.get('Highlighter')` */
  static readonly pluginName = 'Highlighter';
  /** Plugins required: none */
  static readonly requires = [];

  /**
   * Texts and tool of the highlighter, before the toolbar is created
   * @param drawer Drawer of the plugin
   */
  constructor(drawer: Drawer) {
    super(drawer);
    this.addTranslations(texts);
    this.addWidget('highlighter', HighlighterWidget);
  }
}
