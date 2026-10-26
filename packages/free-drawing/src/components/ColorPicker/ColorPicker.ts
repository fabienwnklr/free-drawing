import '@/components/ColorPicker/color-picker.scss';
import type { ColorLike } from '@/@types/drawer';
import { createButton, setLabel, setPressed } from '@/utils/dom';
import { fromDarkColor, normalizeColor, toHexColor } from '@/utils/color';
import EyedropperIcon from '@/icons/eyedropper.svg?raw';
import { toDarkColor } from '@/utils/export';
import type { ColorPickerOptions, EyeDropperWindow } from '@/@types/ui';

/**
 * Palette buttons, optional transparent button, custom color input and eyedropper (browsers with the EyeDropper API),
 * added to given container
 */
export class ColorPicker {
  /** Palette buttons (transparent button last), pressed for the current color */
  readonly $buttons: HTMLButtonElement[] = [];
  /** Native color input for a color out of the palette, highlighted when the current color is not in it */
  readonly $customInput: HTMLInputElement;
  /** Button picking a color anywhere on the screen (EyeDropper API of Chromium), undefined without it */
  readonly $pickButton?: HTMLButtonElement;
  /** Options given on creation */
  private readonly options: ColorPickerOptions;

  /**
   * Create palette buttons, custom color input and eyedropper, none pressed until `setColor`
   * @param $container Element receiving the buttons, then the custom input and the eyedropper
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

    // color picked anywhere on the screen (the drawing, an image, another window)
    const { EyeDropper } = window as EyeDropperWindow;

    if (!EyeDropper) return;

    const $pick = createButton(options.buttonClass, 'drawer-color-pick');

    $pick.innerHTML = EyedropperIcon;
    options.i18n.translate((t) => setLabel($pick, t('color.pick')));
    $pick.addEventListener('click', async (e) => {
      // menu containing it (settings) stays open
      e.stopPropagation();
      try {
        const { sRGBHex } = await new EyeDropper().open();
        // drawing shown inverted in dark mode: its own color
        const dark = !!$pick.closest('.drawer-dark');

        options.onChange((dark ? fromDarkColor(sRGBHex) : toHexColor(sRGBHex) ?? sRGBHex) as ColorLike);
      } catch {
        // cancelled (Escape)
      }
    });
    this.$pickButton = $pick;
    $container.append($pick);
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
