import type { Drawer } from '@/Drawer';
import type { ColorLike, OptionsChange } from '@/@types/drawer';
import LineIcon from '@/icons/line.svg?raw';
import LineDashedSmIcon from '@/icons/line-dashed-sm.svg?raw';
import LineDashedIcon from '@/icons/line-dashed.svg?raw';
import './overlay.scss';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { dataAttributes } from '@/constants';
import { setLabel, setPressed, uniqueId } from '@/utils/dom';

/**
 * All common tool for all shape (color, opacity for now)
 */

export type OverlayOptions = {
  /** Show stroke style buttons (default false) */
  styleBtns: boolean;
  /** Show stroke width buttons (default true) */
  widthBtns: boolean;
  /** Title of color section (default 'Stroke') */
  colorTitle: string;
  /** Accessible name of overlay (default 'Tool options') */
  label: string;
};

export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;

  $strokeColorContainer!: HTMLDivElement;
  $strokeColorBtnContainer!: HTMLDivElement;

  $strokeWidthContainer!: HTMLDivElement;
  $strokeWidthBtnContainer!: HTMLDivElement;

  $strokeStyleContainer!: HTMLDivElement;
  $strokeStyleBtnContainer!: HTMLDivElement;

  $opacityContainer!: HTMLDivElement;
  $opacityRange!: HTMLInputElement;

  selectors = {
    container: 'overlay-picker-container',
    buttonContainer: 'overlay-picker-btn-container',
    button: 'overlay-picker__button',
  };

  options?: Partial<OverlayOptions>;

  constructor(drawer: Drawer, options?: Partial<OverlayOptions>) {
    this.options = options;
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');
    this.$overlayContainer.setAttribute('role', 'region');
    this.$overlayContainer.setAttribute('aria-label', options?.label ?? 'Tool options');

    this.drawer.$drawerContainer.append(this.$overlayContainer);

    this._init();

    // keep fields in sync with options, whatever changes them (any overlay, API...)
    this.drawer.on('fd.options.change', (change: OptionsChange) => this.updateFields(change));
  }

  private _init() {
    // stroke color
    this._createStrokeColorFields();
    // stroke width
    this._createStrokeWidthFields();
    // stroke style
    this._createStrokeStyleFields();
    // opacity
    this._createOpacityField();

    // Then append to dom
    this.appendContent([
      this.$strokeColorContainer,
      this.$strokeWidthContainer,
      this.$strokeStyleContainer,
      this.$opacityContainer,
    ]);
  }

  private _createStrokeColorFields() {
    const { $container, $btnContainer } = this._createSection(this.options?.colorTitle ?? 'Stroke');
    this.$strokeColorContainer = $container;
    this.$strokeColorBtnContainer = $btnContainer;

    const strokeColors: { color: ColorLike; label: string }[] = [
      { color: '#000', label: 'Black' },
      { color: '#e03131', label: 'Red' },
      { color: '#2f9e44', label: 'Green' },
      { color: '#1971c2', label: 'Blue' },
      { color: '#f08c00', label: 'Orange' },
    ];

    strokeColors.forEach(({ color, label }) => {
      const $btn = document.createElement('button');
      $btn.classList.add(this.selectors.button);
      $btn.style.backgroundColor = color;
      $btn.setAttribute(dataAttributes.strokeColor, color.toString());
      setLabel($btn, label);
      setPressed($btn, false);
      $btn.addEventListener('click', () => this.drawer.setStrokeColor(color));
      this.$strokeColorBtnContainer.append($btn);
    });
  }

  private _createStrokeWidthFields() {
    const { $container, $btnContainer } = this._createSection('Stroke width');
    this.$strokeWidthContainer = $container;
    this.$strokeWidthBtnContainer = $btnContainer;

    const strokeWidths = [
      { width: 3, label: 'Thin' },
      { width: 5, label: 'Medium' },
      { width: 8, label: 'Thick' },
      { width: 12, label: 'Extra thick' },
    ];

    strokeWidths.forEach(({ width, label }) => {
      const icon = LineIcon.replace('stroke-width="2.5"', `stroke-width="${width}"`);
      const $btn = this._createButton(icon, dataAttributes.strokeWidth, width.toString(), label);

      $btn.addEventListener('click', () => this.drawer.setStrokeWidth(width));
      this.$strokeWidthBtnContainer.append($btn);
    });

    if (this.options?.widthBtns === false) this.$strokeWidthContainer.style.display = 'none';
  }

  private _createStrokeStyleFields() {
    const { $container, $btnContainer } = this._createSection('Stroke style');
    this.$strokeStyleContainer = $container;
    this.$strokeStyleBtnContainer = $btnContainer;

    const strokeDashed = [
      {
        icon: LineIcon,
        dash: undefined,
        label: 'Solid',
      },
      {
        icon: LineDashedIcon,
        dash: [33, 10],
        label: 'Dashed',
      },
      {
        icon: LineDashedSmIcon,
        dash: [33, 33],
        label: 'Widely dashed',
      },
    ];

    strokeDashed.forEach((dashed) => {
      const value = dashed.dash?.toString() ?? '';
      const $btn = this._createButton(dashed.icon, dataAttributes.strokeStyle, value, dashed.label);

      $btn.addEventListener('click', () => this.drawer.setStrokeStyle(dashed.dash));
      this.$strokeStyleBtnContainer.append($btn);
    });

    this.toggleStyleBtns(!!this.options?.styleBtns);
  }

  private _createOpacityField() {
    this.$opacityContainer = document.createElement('div');
    this.$opacityContainer.classList.add('opacity-container');

    const $opacityTitle = this._createTitle('Opacity');
    this.$opacityContainer.append($opacityTitle);

    this.$opacityRange = document.createElement('input');
    this.$opacityRange.type = 'range';
    this.$opacityRange.min = '0';
    this.$opacityRange.max = '10';
    this.$opacityRange.step = '1';
    this.$opacityRange.setAttribute('aria-labelledby', $opacityTitle.id);

    this.$opacityRange.addEventListener('input', () => this._updateOpacityText());
    this.$opacityRange.addEventListener('change', () => {
      const opacity = Number(this.$opacityRange.value) / 10;
      this.drawer.setOpacity(opacity);
    });

    this.$opacityContainer.append(this.$opacityRange);
  }

  /**
   * Opacity announced as percentage (range is from 0 to 10)
   */
  private _updateOpacityText() {
    this.$opacityRange.setAttribute('aria-valuetext', `${Number(this.$opacityRange.value) * 10}%`);
  }

  /**
   * Section title, referenced by its fields
   */
  protected _createTitle(text: string) {
    const $title = document.createElement('h6');

    $title.classList.add('title');
    $title.id = uniqueId('overlay-title');
    $title.textContent = text;

    return $title;
  }

  /**
   * Group of fields named by its title
   */
  protected _createSection(title: string) {
    const $container = document.createElement('div');
    const $title = this._createTitle(title);
    const $btnContainer = document.createElement('div');

    $container.classList.add(this.selectors.container);
    $container.setAttribute('role', 'group');
    $container.setAttribute('aria-labelledby', $title.id);
    $btnContainer.classList.add(this.selectors.buttonContainer);
    $container.append($title, $btnContainer);

    return { $container, $btnContainer };
  }

  /**
   * Toggle button of a field, `label` is its accessible name (icon or short content)
   */
  protected _createButton(content: string, attr: string, value: string, label: string) {
    const $btn = document.createElement('button');

    $btn.innerHTML = content;
    $btn.setAttribute(attr, value);
    $btn.classList.add('drawer-button', this.selectors.button);
    setLabel($btn, label);
    setPressed($btn, false);

    return $btn;
  }

  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements);
  }

  show(shape?: (Shape<ShapeConfig> | Group)[]) {
    this.$overlayContainer.classList.add('show');

    const { strokeColor, strokeWidth, strokeDash, opacity } = this.drawer.options;
    let data: OptionsChange = { strokeColor, strokeWidth, strokeDash, opacity };

    if (shape && shape[0] instanceof Shape) {
      data = {
        // text color is stored in fill
        strokeColor: (shape[0].stroke() || shape[0].fill()) as ColorLike,
        strokeWidth: shape[0].strokeWidth(),
        strokeDash: shape[0].dash(),
        opacity: shape[0].opacity(),
      };
    }

    this.updateFields(data);
  }

  /**
   * Set given button active in its container (null to only remove active one)
   */
  protected _setActiveBtn($btnContainer: HTMLDivElement, $btn: Element | null) {
    $btnContainer
      .querySelectorAll<HTMLElement>(`.${this.selectors.button}`)
      .forEach(($b) => setPressed($b, $b === $btn));
  }

  /**
   * Update fields state, only given keys are updated
   * @param {OptionsChange} change
   */
  updateFields(change: OptionsChange) {
    if (change.strokeColor !== undefined) {
      this._setActiveBtn(
        this.$strokeColorBtnContainer,
        this.$strokeColorBtnContainer.querySelector(`[${dataAttributes.strokeColor}="${change.strokeColor}"]`)
      );
    }

    if (change.strokeWidth !== undefined) {
      this._setActiveBtn(
        this.$strokeWidthBtnContainer,
        this.$strokeWidthBtnContainer.querySelector(`[${dataAttributes.strokeWidth}="${change.strokeWidth}"]`)
      );
    }

    // undefined dash is a solid line
    if ('strokeDash' in change) {
      this._setActiveBtn(
        this.$strokeStyleBtnContainer,
        this.$strokeStyleBtnContainer.querySelector(
          `[${dataAttributes.strokeStyle}="${change.strokeDash?.toString() ?? ''}"]`
        )
      );
    }

    if (change.opacity !== undefined) {
      this.$opacityRange.value = (change.opacity * 10).toString();
      this._updateOpacityText();
    }
  }

  /**
   * Show / hide stroke style buttons (dash), only relevant for outline shapes
   * @param {boolean} visible
   */
  toggleStyleBtns(visible: boolean) {
    this.$strokeStyleContainer.style.display = visible ? '' : 'none';
  }

  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
