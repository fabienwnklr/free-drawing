import type { Drawer } from '@/Drawer';
import './overlay.scss';
import type { ColorLike } from '@/@types/drawer';
export class BaseOverlay {
  $overlayContainer: HTMLDivElement;
  drawer: Drawer;
  $strokeColorContainer!: HTMLDivElement;
  $strokeColorBtnContainer!: HTMLDivElement;
  $strokeWidthContainer!: HTMLDivElement;
  $strokeWidthBtnContainer!: HTMLDivElement;

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

    const strokeSize = [5, 10, 15];

    strokeSize.forEach((width) => {
      const $btn = document.createElement('button');
      $btn.classList.add('drawer-button');
      $btn.addEventListener('click', () => {
        this.$strokeWidthBtnContainer.querySelector('.drawer-button.active')?.classList.remove('active');
        $btn.classList.add('active');
      });

      if (this.drawer.options.strokeWidth === width) {
        $btn.classList.add('active');
      }
      $strokeWidthButtons.push($btn);
    });
    this.$strokeWidthBtnContainer.append(...$strokeWidthButtons);
    this.$strokeWidthContainer.append(this.$strokeWidthBtnContainer);
    // End stroke width
    this.appendContent([this.$strokeColorContainer, this.$strokeWidthContainer]);
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
