import type { Layer } from 'konva/lib/Layer';
import type { Drawer } from '@/Drawer';
import LaserIcon from '@/icons/laser.svg?raw';
import { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { Trail } from '@/components/toolbar/widgets/Eraser/Trail';
import { crosshairCursor } from '@/constants';

/** Color of laser of this user (other users: color of their cursor) */
export const laserColor = '#ff3b30';

/**
 * Glowing trail of a laser, fading after a second
 * @param layer Layer of the trail (selection layer: not saved)
 * @param color Color of the trail and its glow: of this user, or of the cursor of another user
 * @returns Trail to start, then fed with pointer positions
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

  /**
   * Create the laser pointer tool, shortcut K
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'laser', 'Laser pointer', LaserIcon, 'k');
  }

  /**
   * New trail on pointer down (shared with collaborators), fed on move, faded out on pointer up
   */
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

  /**
   * Tool changed: laser stopped
   */
  protected onDesactive(): void {
    this._stop();
  }

  /**
   * Stop laser (pointer up or tool changed): trail fades out, pointer action ended, collaborators notified
   */
  private _stop() {
    this.#trail?.stop();
    this.#trail = null;
    if (this.inAction) this.endAction();
    this.drawer.collaboration?.setLaser(false);
  }
}
