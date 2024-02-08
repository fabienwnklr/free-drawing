import type { Drawer } from '@/Drawer';
import { ColorLike } from '@/@types/drawer';
import LineIcon from '@/icons/line.svg?raw';
import './overlay.scss';
export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;
  $strokeColorContainer!: HTMLDivElement;
  $strokeColorBtnContainer!: HTMLDivElement;
  $strokeWidthContainer!: HTMLDivElement;
  $strokeWidthBtnContainer!: HTMLDivElement;
  $opacityContainer!: HTMLDivElement;
  $opacityRange!: HTMLInputElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');

    this.drawer.$drawerContainer.append(this.$overlayContainer);

    this._init();
  }

  private _init() {
    // Start create stroke color management
    this.$strokeColorContainer = document.createElement('div');
    this.$strokeColorContainer.classList.add('stroke-color-container');

    const $strokeTitle = document.createElement('h6');
    $strokeTitle.classList.add('overlay-title');
    $strokeTitle.innerText = 'Stroke';
    this.$strokeColorContainer.append($strokeTitle);

    this.$strokeColorBtnContainer = document.createElement('div');
    this.$strokeColorBtnContainer.classList.add('stroke-color-btn-container');
    const $strokeColorButtons: HTMLButtonElement[] = [];

    const strokeColors = ['#000', '#e03131', '#2f9e44', '#1971c2', '#f08c00'] as ColorLike[];

    strokeColors.forEach((color) => {
      const $btn = document.createElement('button');
      $btn.classList.add('color-picker__button');
      $btn.style.backgroundColor = color;
      $btn.addEventListener('click', () => {
        this.$strokeColorBtnContainer.querySelector('.color-picker__button.active')?.classList.remove('active');
        $btn.classList.add('active');
        this.drawer.setColor(color);
      });

      if (this.drawer.options.strokeColor === color) {
        $btn.classList.add('active');
      }
      $strokeColorButtons.push($btn);
    });
    this.$strokeColorBtnContainer.append(...$strokeColorButtons);
    this.$strokeColorContainer.append(this.$strokeColorBtnContainer);
    // End stroke color

    // Start create stroke width
    this.$strokeWidthContainer = document.createElement('div');
    this.$strokeWidthContainer.classList.add('stroke-width-container');

    const $widthTitle = document.createElement('h6');
    $widthTitle.classList.add('overlay-title');
    $widthTitle.innerText = 'Stroke width';
    this.$strokeWidthContainer.append($widthTitle);

    this.$strokeWidthBtnContainer = document.createElement('div');
    this.$strokeWidthBtnContainer.classList.add('stroke-width-btn-container');
    const $strokeWidthButtons: HTMLButtonElement[] = [];

    const strokeSize = [3, 5, 8, 12];

    strokeSize.forEach((width) => {
      const $btn = document.createElement('button');
      console.log(LineIcon);
      $btn.innerHTML = LineIcon.replace('stroke-width="2.5"', `stroke-width="${width}"`);
      $btn.dataset.strokeWidth = width.toString();
      $btn.classList.add('drawer-button', 'stroke-picker__button');
      $btn.addEventListener('click', () => {
        this.$strokeWidthBtnContainer.querySelector('.drawer-button.active')?.classList.remove('active');
        $btn.classList.add('active');
        this.drawer.options.strokeWidth = Number($btn.dataset.strokeWidth);
      });

      if (this.drawer.options.strokeWidth === width) {
        $btn.classList.add('active');
      }
      $strokeWidthButtons.push($btn);
    });
    this.$strokeWidthBtnContainer.append(...$strokeWidthButtons);
    this.$strokeWidthContainer.append(this.$strokeWidthBtnContainer);
    // End stroke width

    // opacity
    this.$opacityContainer = document.createElement('div');
    this.$opacityContainer.classList.add('opacity-container');

    const $opacityTitle = document.createElement('h6');
    $opacityTitle.classList.add('overlay-title');
    $opacityTitle.innerText = 'Opacity';
    this.$opacityContainer.append($opacityTitle);

    this.$opacityRange = document.createElement('input');
    this.$opacityRange.type = 'range';
    this.$opacityRange.min = '0';
    this.$opacityRange.max = '10';
    this.$opacityRange.step = '1';

    this.$opacityRange.addEventListener('change', () => {
      this.drawer.options.opacity = Number(this.$opacityRange.value) / 10;
    });

    this.$opacityContainer.append(this.$opacityRange);

    this.appendContent([this.$strokeColorContainer, this.$strokeWidthContainer, this.$opacityContainer]);
  }

  appendContent(elements: HTMLElement[]) {
    this.$overlayContainer.append(...elements);
  }

  show() {
    this.$overlayContainer.classList.add('show');
  }

  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
