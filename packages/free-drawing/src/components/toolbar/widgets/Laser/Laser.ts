import type { Layer } from 'konva/lib/Layer';
import { Drawer } from '@/Drawer';
import LaserIcon from '@/icons/laser.svg?raw';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { Trail } from '@/components/toolbar/widgets/Eraser/Trail';
import { crosshairCursor } from '@/constants';

/** Color of laser of this user (other users: color of their cursor) */
export const laserColor = '#ff3b30';

/**
 * Glowing trail of a laser, fading after a second
 * @param {Layer} layer
 * @param {string} color
 */
export function createLaserTrail(layer: Layer, color: string = laserColor): Trail {
  return new Trail(layer, { color, size: 6, duration: 1000, glow: color });
}

/**
 * Laser pointer: trail following pointer while pressed, not saved in drawing, shown to other users of a collaboration
 * session. Usable in read only (drawing not changed).
 */
export class LaserWidget extends BaseWidget {
  protected cursor = crosshairCursor;
  #trail: Trail | null = null;

  constructor(drawer: Drawer) {
    super(drawer, 'laser', 'Laser pointer', LaserIcon, 'k');
  }

  protected initEvents(): void {
    this.onStage('mousedown touchstart', (e) => {
      if (e.evt.button === 2) return;
      e.evt.preventDefault();

      const { x, y } = this.drawer._getRelativePointerPos();

      this.startAction();
      // previous trail fades out alone
      this.#trail = createLaserTrail(this.drawer.selectionLayer);
      this.#trail.start();
      this.#trail.add(x, y);
      this.drawer.collaboration?.setLaser(true);
    });

    this.onStage('mousemove touchmove', (e) => {
      if (!this.inAction || !this.#trail) return;
      e.evt.preventDefault();

      const { x, y } = this.drawer._getRelativePointerPos();

      this.#trail.add(x, y);
    });

    this.onStage('mouseup touchend', (e) => {
      if (!this.inAction) return;
      e.evt.preventDefault();
      this._stop();
    });
  }

  protected onDesactive(): void {
    this._stop();
  }

  private _stop() {
    this.#trail?.stop();
    this.#trail = null;
    if (this.inAction) this.endAction();
    this.drawer.collaboration?.setLaser(false);
  }
}
