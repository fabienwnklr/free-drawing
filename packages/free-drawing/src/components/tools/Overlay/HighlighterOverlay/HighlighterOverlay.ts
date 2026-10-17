import type { Drawer } from '@/Drawer';
import type { ColorLike } from '@/@types/drawer';
import type { TranslationKey } from '@/i18n/en';
import LineIcon from '@/icons/line.svg?raw';
import '@/components/tools/Overlay/overlay.scss';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { createButton, setLabel, setPressed, uniqueId } from '@/utils/dom';

/** Fluorescent colors of highlighter, yellow first (default) */
export const highlighterColors: {
  /** Color of strokes */
  color: ColorLike;
  /** Accessible name of its button */
  label: TranslationKey;
}[] = [
  { color: '#ffe066', label: 'color.yellow' },
  { color: '#8ce99a', label: 'color.green' },
  { color: '#74c0fc', label: 'color.blue' },
  { color: '#faa2c1', label: 'color.pink' },
  { color: '#ffc078', label: 'color.orange' },
];

/** Widths of highlighter strokes, medium by default */
export const highlighterSizes: {
  /** Width of strokes */
  size: number;
  /** Accessible name of its button */
  label: TranslationKey;
}[] = [
  { size: 12, label: 'width.thin' },
  { size: 20, label: 'width.medium' },
  { size: 32, label: 'width.thick' },
];

/**
 * Current choices of highlighter widget, updated by the overlay
 */
export type HighlighterOverlayOptions = {
  /** Color of strokes, one of `highlighterColors` or custom */
  color: ColorLike;
  /** Width of strokes, one of `highlighterSizes` */
  size: number;
  /** Color or size chosen */
  onChange: (change: { color?: ColorLike; size?: number }) => void;
};

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
    /** Drawer of the highlighter widget */
    private readonly drawer: Drawer,
    /** Choices of the widget, changed in place by `setChange` */
    private readonly options: HighlighterOverlayOptions
  ) {
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');
    this.$overlayContainer.setAttribute('role', 'region');
    drawer.i18n.translate((t) => this.$overlayContainer.setAttribute('aria-label', t('overlay.highlighter')));

    const colors = this._createSection('overlay.color');
    const sizes = this._createSection('overlay.strokeWidth');

    this.colorPicker = new ColorPicker(colors.$buttons, {
      i18n: drawer.i18n,
      colors: highlighterColors,
      attr: 'data-highlighter-color',
      buttonClass: 'overlay-picker__button',
      onChange: (color) => this.setChange({ color }),
    });
    this.$sizeButtons = highlighterSizes.map(({ size, label }) => {
      const $btn = createButton('drawer-button', 'overlay-picker__button');

      $btn.innerHTML = LineIcon.replace('stroke-width="2.5"', `stroke-width="${size / 3}"`);
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
  setChange(change: { color?: ColorLike; size?: number }) {
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

  /**
   * Group of fields named by its title (as other overlays)
   * @param title Key of the section title, translated again on language change
   * @returns Section element (title then buttons element) and its buttons element, not appended yet
   */
  private _createSection(title: TranslationKey) {
    /** Section element: group named by its title */
    const $container = document.createElement('div');
    const $title = document.createElement('h6');
    /** Element of the section buttons, after its title */
    const $buttons = document.createElement('div');

    $title.classList.add('title');
    $title.id = uniqueId('overlay-title');
    this.drawer.i18n.translate((t) => ($title.textContent = t(title)));
    $container.classList.add('overlay-picker-container');
    $container.setAttribute('role', 'group');
    $container.setAttribute('aria-labelledby', $title.id);
    $buttons.classList.add('overlay-picker-btn-container');
    $container.append($title, $buttons);

    return { $container, $buttons };
  }
}
