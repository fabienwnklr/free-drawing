import '@/components/ColorPicker/color-picker.scss';
import type { ColorLike } from '@/@types/drawer';
import { createButton, setLabel, setPressed } from '@/utils/dom';
import { normalizeColor, toHexColor } from '@/utils/color';

export type ColorPickerOptions = {
  /** Palette, with accessible name of each color */
  colors: { color: ColorLike; label: string }[];
  /** Attribute of palette buttons, its value is the color */
  attr: string;
  /** Class of palette buttons */
  buttonClass: string;
  /** Transparent button (default false) */
  transparent?: boolean;
  /** Color chosen with a button or the custom input */
  onChange: (color: ColorLike) => void;
};

/**
 * Palette buttons, optional transparent button and custom color input, added to given container
 */
export class ColorPicker {
  readonly $buttons: HTMLButtonElement[] = [];
  readonly $customInput: HTMLInputElement;
  private readonly options: ColorPickerOptions;

  constructor($container: HTMLElement, options: ColorPickerOptions) {
    this.options = options;

    const colors = [...options.colors];

    if (options.transparent) colors.push({ color: 'transparent', label: 'Transparent' });

    colors.forEach(({ color, label }) => {
      const $btn = createButton(options.buttonClass);

      $btn.setAttribute(options.attr, color);
      if (color === 'transparent') {
        $btn.classList.add('drawer-color-transparent');
      } else {
        $btn.style.backgroundColor = color;
      }
      setLabel($btn, label);
      setPressed($btn, false);
      $btn.addEventListener('click', () => options.onChange(color));
      this.$buttons.push($btn);
    });

    // native color picker
    this.$customInput = document.createElement('input');
    this.$customInput.type = 'color';
    this.$customInput.classList.add('drawer-color-input');
    setLabel(this.$customInput, 'Custom color');
    // when picker is closed, not on each move in picker (history)
    this.$customInput.addEventListener('change', () => options.onChange(this.$customInput.value as ColorLike));
    // menu containing it (settings) stays open while picking
    this.$customInput.addEventListener('click', (e) => e.stopPropagation());

    $container.append(...this.$buttons, this.$customInput);
  }

  /**
   * Show current color: its palette button, or custom input when not in palette
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

    // picker opens on current color
    if (hex) this.$customInput.value = hex;
    this.$customInput.classList.toggle('active', !inPalette && !!hex);
  }
}
