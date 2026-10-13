import './position.scss';
import type { Drawer } from '@/Drawer';
import type { Vector2d } from 'konva/lib/types';
import RecenterIcon from '@/icons/recenter.svg?raw';
import { createButton, setLabel } from '@/utils/dom';

/**
 * Position of view (x / y), with a button back to origin: not to get lost when moving
 */
export class Position {
  drawer: Drawer;
  $positionContainer: HTMLDivElement;
  $coordinates: HTMLSpanElement;
  $btnRecenter: HTMLButtonElement;
  #$x: HTMLSpanElement;
  #$y: HTMLSpanElement;

  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$positionContainer = document.createElement('div');
    this.$positionContainer.classList.add('drawer-position-container', 'tool');
    this.$positionContainer.setAttribute('role', 'group');
    this.$positionContainer.setAttribute('aria-label', 'Position');

    this.$coordinates = document.createElement('span');
    this.$coordinates.classList.add('drawer-position-coordinates');
    this.#$x = this._createAxis('x');
    this.#$y = this._createAxis('y');

    this.$btnRecenter = createButton('drawer-button', 'drawer-button-neutral');
    this.$btnRecenter.innerHTML = RecenterIcon;
    setLabel(this.$btnRecenter, 'Back to origin');
    this.$btnRecenter.addEventListener('click', () => this.recenter());

    this.$positionContainer.append(this.$coordinates, this.$btnRecenter);
    this.drawer.$headerContainer.append(this.$positionContainer);

    this.update();
  }

  /**
   * Axis name and its value
   * @returns value element
   */
  private _createAxis(axis: 'x' | 'y') {
    const $name = document.createElement('span');
    const $value = document.createElement('span');

    $name.classList.add('text-muted');
    $name.textContent = axis;
    $value.classList.add('drawer-position-value');
    this.$coordinates.append($name, ' ', $value, ' ');

    return $value;
  }

  /**
   * Move of view center from origin, in canvas coordinates: 0, 0 at start, zoom on view center does not change it
   */
  getPosition(): Vector2d {
    const { stage } = this.drawer;
    const scale = this.drawer.getZoomLevel();
    const center = { x: stage.width() / 2, y: stage.height() / 2 };

    return {
      // + 0: no -0
      x: Math.round((center.x - stage.x()) / scale - center.x) + 0,
      y: Math.round((center.y - stage.y()) / scale - center.y) + 0,
    };
  }

  /**
   * Move view back to origin (view center at its start place), zoom is kept
   */
  recenter() {
    const { stage } = this.drawer;
    const scale = this.drawer.getZoomLevel();

    stage.position({ x: (stage.width() / 2) * (1 - scale), y: (stage.height() / 2) * (1 - scale) });
    this.drawer._update();
  }

  /**
   * Show current position, called after each view move or zoom
   */
  update() {
    const { x, y } = this.getPosition();
    // minus sign (not hyphen)
    const format = (n: number) => n.toString().replace('-', '−');

    this.#$x.textContent = format(x);
    this.#$y.textContent = format(y);
  }
}
