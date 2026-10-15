import type { Drawer } from '@/Drawer';
import type { ColorLike } from '@/@types/drawer';
import type { TranslationKey } from '@/i18n/en';
import LineIcon from '@/icons/line.svg?raw';
import '@/components/tools/Overlay/overlay.scss';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { createButton, setLabel, setPressed, uniqueId } from '@/utils/dom';

/** Fluorescent colors of highlighter, yellow first (default) */
export const highlighterColors: { color: ColorLike; label: TranslationKey }[] = [
  { color: '#ffe066', label: 'color.yellow' },
  { color: '#8ce99a', label: 'color.green' },
  { color: '#74c0fc', label: 'color.blue' },
  { color: '#faa2c1', label: 'color.pink' },
  { color: '#ffc078', label: 'color.orange' },
];

/** Widths of highlighter strokes, medium by default */
export const highlighterSizes: { size: number; label: TranslationKey }[] = [
  { size: 12, label: 'width.thin' },
  { size: 20, label: 'width.medium' },
  { size: 32, label: 'width.thick' },
];

export type HighlighterOverlayOptions = {
  color: ColorLike;
  size: number;
  /** Color or size chosen */
  onChange: (change: { color?: ColorLike; size?: number }) => void;
};

/**
 * Options of highlighter: its own colors and widths, not those of other tools
 */
export class HighlighterOverlay {
  readonly $overlayContainer: HTMLDivElement;
  readonly colorPicker: ColorPicker;
  readonly $sizeButtons: HTMLButtonElement[];

  constructor(
    private readonly drawer: Drawer,
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
   */
  setChange(change: { color?: ColorLike; size?: number }) {
    Object.assign(this.options, change);
    this._update();
    this.options.onChange(change);
  }

  show() {
    this.$overlayContainer.classList.add('show');
  }

  hide() {
    this.$overlayContainer.classList.remove('show');
  }

  private _update() {
    this.colorPicker.setColor(this.options.color);
    this.$sizeButtons.forEach(($btn) => setPressed($btn, Number($btn.dataset.size) === this.options.size));
  }

  /**
   * Group of fields named by its title (as other overlays)
   */
  private _createSection(title: TranslationKey) {
    const $container = document.createElement('div');
    const $title = document.createElement('h6');
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
