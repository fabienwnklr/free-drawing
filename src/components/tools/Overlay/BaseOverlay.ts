import type { Drawer } from '@/Drawer';
import type { ColorLike, OptionsChange } from '@/@types/drawer';
import LineIcon from '@/icons/line.svg?raw';
import LineDashedSmIcon from '@/icons/line-dashed-sm.svg?raw';
import LineDashedIcon from '@/icons/line-dashed.svg?raw';
import './overlay.scss';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { dataAttributes } from '@/constants';

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
    this.$strokeColorContainer = document.createElement('div');
    this.$strokeColorContainer.classList.add(this.selectors.container);

    const $strokeTitle = document.createElement('h6');
    $strokeTitle.classList.add('title');
    $strokeTitle.innerText = this.options?.colorTitle ?? 'Stroke';
    this.$strokeColorContainer.append($strokeTitle);

    this.$strokeColorBtnContainer = document.createElement('div');
    this.$strokeColorBtnContainer.classList.add(this.selectors.buttonContainer);
    const $strokeColorButtons: HTMLButtonElement[] = [];

    const strokeColors = ['#000', '#e03131', '#2f9e44', '#1971c2', '#f08c00'] as ColorLike[];

    strokeColors.forEach((color) => {
      const $btn = document.createElement('button');
      $btn.classList.add(this.selectors.button);
      $btn.style.backgroundColor = color;
      $btn.setAttribute(dataAttributes.strokeColor, color.toString());
      $btn.addEventListener('click', () => this.drawer.setStrokeColor(color));
      $strokeColorButtons.push($btn);
    });
    this.$strokeColorBtnContainer.append(...$strokeColorButtons);
    this.$strokeColorContainer.append(this.$strokeColorBtnContainer);
  }

  private _createStrokeWidthFields() {
    this.$strokeWidthContainer = document.createElement('div');
    this.$strokeWidthContainer.classList.add(this.selectors.container);

    const $widthTitle = document.createElement('h6');
    $widthTitle.classList.add('title');
    $widthTitle.innerText = 'Stroke width';
    this.$strokeWidthContainer.append($widthTitle);

    this.$strokeWidthBtnContainer = document.createElement('div');
    this.$strokeWidthBtnContainer.classList.add(this.selectors.buttonContainer);
    const $strokeWidthButtons: HTMLButtonElement[] = [];

    const strokeSize = [3, 5, 8, 12];

    strokeSize.forEach((width) => {
      const $btn = document.createElement('button');

      $btn.innerHTML = LineIcon.replace('stroke-width="2.5"', `stroke-width="${width}"`);
      $btn.setAttribute(dataAttributes.strokeWidth, width.toString());
      $btn.classList.add('drawer-button', this.selectors.button);
      $btn.addEventListener('click', () => this.drawer.setStrokeWidth(width));
      $strokeWidthButtons.push($btn);
    });
    this.$strokeWidthBtnContainer.append(...$strokeWidthButtons);
    this.$strokeWidthContainer.append(this.$strokeWidthBtnContainer);

    if (this.options?.widthBtns === false) this.$strokeWidthContainer.style.display = 'none';
  }

  private _createStrokeStyleFields() {
    this.$strokeStyleContainer = document.createElement('div');
    this.$strokeStyleContainer.classList.add(this.selectors.container);

    const $styleTitle = document.createElement('h6');
    $styleTitle.classList.add('title');
    $styleTitle.innerText = 'Stroke style';
    this.$strokeStyleContainer.append($styleTitle);

    this.$strokeStyleBtnContainer = document.createElement('div');
    this.$strokeStyleBtnContainer.classList.add(this.selectors.buttonContainer);
    const $strokeWidthButtons: HTMLButtonElement[] = [];

    const strokeDashed = [
      {
        icon: LineIcon,
        dash: undefined,
      },
      {
        icon: LineDashedIcon,
        dash: [33, 10],
      },
      {
        icon: LineDashedSmIcon,
        dash: [33, 33],
      },
    ];

    strokeDashed.forEach((dashed) => {
      const $btn = document.createElement('button');

      $btn.setAttribute(dataAttributes.strokeStyle, dashed.dash?.toString() ?? '');
      $btn.classList.add('drawer-button', this.selectors.button);
      $btn.innerHTML = dashed.icon;
      $btn.addEventListener('click', () => this.drawer.setStrokeStyle(dashed.dash));
      $strokeWidthButtons.push($btn);
    });
    this.$strokeStyleBtnContainer.append(...$strokeWidthButtons);
    this.$strokeStyleContainer.append(this.$strokeStyleBtnContainer);

    this.toggleStyleBtns(!!this.options?.styleBtns);
  }

  private _createOpacityField() {
    this.$opacityContainer = document.createElement('div');
    this.$opacityContainer.classList.add('opacity-container');

    const $opacityTitle = document.createElement('h6');
    $opacityTitle.classList.add('title');
    $opacityTitle.innerText = 'Opacity';
    this.$opacityContainer.append($opacityTitle);

    this.$opacityRange = document.createElement('input');
    this.$opacityRange.type = 'range';
    this.$opacityRange.min = '0';
    this.$opacityRange.max = '10';
    this.$opacityRange.step = '1';

    this.$opacityRange.addEventListener('change', () => {
      const opacity = Number(this.$opacityRange.value) / 10;
      this.drawer.setOpacity(opacity);
    });

    this.$opacityContainer.append(this.$opacityRange);
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
    $btnContainer.querySelector(`.${this.selectors.button}.active`)?.classList.remove('active');
    $btn?.classList.add('active');
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
