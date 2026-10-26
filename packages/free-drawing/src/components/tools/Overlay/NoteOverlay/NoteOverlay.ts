import type { Drawer } from '@/Drawer';
import type { ColorLike } from '@/@types/drawer';
import '@/components/tools/Overlay/overlay.scss';
import { ColorPicker } from '@/components/ColorPicker/ColorPicker';
import { createOverlaySection } from '@/components/tools/Overlay/section';
import { noteColors } from '@/utils/note';

/**
 * Options of the note tool: color of new notes (light colors or custom), its own, not the colors of other tools
 */
export class NoteOverlay {
  /** Panel element (region) in floating region, shown with `show` */
  readonly $overlayContainer: HTMLDivElement;
  /** Color choice among `noteColors` or custom */
  readonly colorPicker: ColorPicker;

  /**
   * Create the panel (color section) in floating region, hidden until `show`
   * @param drawer Drawer of the note widget
   * @param color Color of new notes
   * @param onChange Called with the color chosen
   */
  constructor(drawer: Drawer, color: ColorLike, onChange: (color: ColorLike) => void) {
    this.$overlayContainer = document.createElement('div');
    this.$overlayContainer.classList.add('drawer-overlay-container', 'tool');
    this.$overlayContainer.setAttribute('role', 'region');
    drawer.i18n.translate((t) => this.$overlayContainer.setAttribute('aria-label', t('overlay.note')));

    const colors = createOverlaySection(drawer, 'overlay.color');

    this.colorPicker = new ColorPicker(colors.$buttons, {
      i18n: drawer.i18n,
      colors: noteColors,
      attr: 'data-note-color',
      buttonClass: 'overlay-picker__button',
      onChange: (chosen) => {
        this.colorPicker.setColor(chosen);
        onChange(chosen);
      },
    });
    this.colorPicker.setColor(color);
    this.$overlayContainer.append(colors.$container);
    drawer.layout.add('floating', this.$overlayContainer);
  }

  /**
   * Show panel (note tool active)
   */
  show() {
    this.$overlayContainer.classList.add('show');
  }

  /**
   * Hide panel (other tool, selection shown)
   */
  hide() {
    this.$overlayContainer.classList.remove('show');
  }
}
