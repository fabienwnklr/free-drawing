import '@/components/ColorPicker/color-picker.scss';
import type { ColorLike } from '@/@types/drawer';
import { createButton, setLabel, setPressed } from '@/utils/dom';
import { normalizeColor, toHexColor } from '@/utils/color';
import { toDarkColor } from '@/utils/export';
import type { ColorPickerOptions } from '@/@types/ui';

/**
 * Palette buttons, optional transparent button and custom color input, added to given container
 */
export class ColorPicker {
  /** Palette buttons (transparent button last), pressed for the current color */
  readonly $buttons: HTMLButtonElement[] = [];
  /** Native color input for a color out of the palette, highlighted when the current color is not in it */
  readonly $customInput: HTMLInputElement;
  /** Options given on creation */
  private readonly options: ColorPickerOptions;

  /**
   * Create palette buttons and custom color input, none pressed until `setColor`
   * @param $container Element receiving the buttons, then the custom input
   * @param options Palette, attribute and class of buttons, transparent button, change callback and texts
   */
  constructor($container: HTMLElement, options: ColorPickerOptions) {
    this.options = options;

    const colors = [...options.colors];

    if (options.transparent) colors.push({ value: 'transparent', label: 'color.transparent' });

    colors.forEach(({ value: color, label }) => {
      const $btn = createButton(options.buttonClass);

      $btn.setAttribute(options.attr, color);
      if (color === 'transparent') {
        $btn.classList.add('drawer-color-transparent');
      } else {
        // as drawing shows it, also in dark mode (inverted)
        $btn.classList.add('drawer-color-swatch');
        $btn.style.setProperty('--swatch-color', color);
        $btn.style.setProperty('--swatch-dark-color', toDarkColor(color));
      }
      options.i18n.translate((t) => setLabel($btn, t(label)));
      setPressed($btn, false);
      $btn.addEventListener('click', () => options.onChange(color));
      this.$buttons.push($btn);
    });

    // native color picker
    this.$customInput = document.createElement('input');
    this.$customInput.type = 'color';
    this.$customInput.classList.add('drawer-color-input');
    options.i18n.translate((t) => setLabel(this.$customInput, t('color.custom')));
    // when picker is closed, not on each move in picker (history)
    this.$customInput.addEventListener('change', () => options.onChange(this.$customInput.value as ColorLike));
    // menu containing it (settings) stays open while picking
    this.$customInput.addEventListener('click', (e) => e.stopPropagation());

    $container.append(...this.$buttons, this.$customInput);
  }

  /**
   * Show current color: its palette button, or custom input when not in palette
   * @param color Current color, compared with palette colors once normalized
   */
  setColor(color: ColorLike) {
    const normalized = normalizeColor(color);
    let inPalette = false;

    this.$buttons.forEach(($btn) => {
      const active = normalizeColor($btn.getAttribute(this.options.attr) ?? '') === normalized;

      inPalette ||= active;
      setPressed($btn, active);
    });

    const hex = toHexColor(color);

    // picker opens on current color, shown as the drawing shows it (dark mode)
    if (hex) {
      this.$customInput.value = hex;
      this.$customInput.style.setProperty('--swatch-color', hex);
      this.$customInput.style.setProperty('--swatch-dark-color', toDarkColor(hex));
    }
    this.$customInput.classList.toggle('active', !inPalette && !!hex);
  }
}
