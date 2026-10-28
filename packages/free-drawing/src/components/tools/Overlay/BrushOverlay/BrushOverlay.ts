import type { Drawer } from '@/Drawer';
import { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import { drawerEvents } from '@/constants';
import { createSwitch, uniqueId } from '@/utils/dom';

/**
 * Overlay of brush: color, width and opacity, no stroke style (freehand strokes are filled outlines), shapes recognized
 * in strokes
 */
export class BrushOverlay extends BaseOverlay {
  /** Switch of the shapes recognized in brush strokes (`shapeRecognition` preference) */
  $recognition: HTMLInputElement;

  /**
   * Create the brush panel without stroke style section, with the switch of shape recognition at its end (follows the
   * preference)
   * @param drawer Drawer whose brush options the fields change
   */
  constructor(drawer: Drawer) {
    super(drawer, { styleBtns: false, label: 'overlay.brush' });

    const $label = document.createElement('label');
    const $text = document.createElement('span');
    const $hint = document.createElement('span');

    this.$recognition = createSwitch(drawer.options.shapeRecognition);
    $label.className = 'overlay-switch';
    // shapes recognized, read by screen readers with the switch
    $hint.id = uniqueId('overlay-recognition');
    $hint.hidden = true;
    this.$recognition.setAttribute('aria-describedby', $hint.id);
    $label.append($text, this.$recognition, $hint);
    drawer.i18n.translate((t) => {
      $text.textContent = t('overlay.recognizeShapes');
      $hint.textContent = t('overlay.recognizeShapesHint');
      $label.title = $hint.textContent;
    });
    this.$recognition.addEventListener('change', () => drawer.setShapeRecognition(this.$recognition.checked));
    drawer.on(drawerEvents.preferencesChange, () => {
      this.$recognition.checked = drawer.options.shapeRecognition;
    });
    this.$overlayContainer.append($label);
  }
}
