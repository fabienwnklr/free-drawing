import '@/components/ExportModal/export-modal.scss';
import type { Drawer } from '@/Drawer';
import type { ExportImageOptions, ImageFormat } from '@/@types/file';
import { Modal } from '@/components/Modal/Modal';
import { drawingFileExtension, saveFile } from '@/utils/drawingFile';
import { createButton, createSwitch, setLabel, uniqueId } from '@/utils/dom';
import { getFontsToLoad, loadFonts } from '@/utils/text';
import type { TranslationKey } from '@/@types/i18n';
import { getErrorText } from '@/utils/errors';

/**
 * Export dialog: preview, options (selected shapes or whole drawing, background, dark mode, scale),
 * image or drawing file saved, image copied to clipboard
 */
export class ExportModal extends Modal {
  /** Rendered image, replaced on each update */
  $preview: HTMLCanvasElement;
  /** Container of the preview and of the empty message */
  $previewContainer: HTMLDivElement;
  /** Message shown instead of the preview when there is nothing to export */
  $empty: HTMLParagraphElement;
  /** Switch exporting selected shapes only, hidden without selection */
  $selected: HTMLInputElement;
  /** Switch exporting the background color (else transparent, pdf always has one) */
  $background: HTMLInputElement;
  /** Switch exporting colors of dark mode, checked on show when the drawer is dark */
  $dark: HTMLInputElement;
  /** Switch keeping the drawing in png and svg images, to open them again for editing */
  $withDrawing: HTMLInputElement;
  /** Radio buttons of the scale of the image (1×, 2×, 3×), 2× by default */
  $scales: HTMLInputElement[];
  /** Buttons of the footer: save as PNG, SVG, PDF, drawing file, then copy, disabled when nothing to export */
  $buttons: HTMLButtonElement[];

  /**
   * Build the dialog: preview, options (switches, scales) updating it, save and copy buttons
   * @param drawer Drawer whose drawing or selection is exported
   */
  constructor(drawer: Drawer) {
    super(drawer, { title: drawer.t('export.title') });
    this.$modal.classList.add('drawer-modal-export');

    this.$previewContainer = document.createElement('div');
    this.$previewContainer.classList.add('drawer-export-preview');
    this.$preview = document.createElement('canvas');
    this.$empty = document.createElement('p');
    this.$empty.classList.add('text-muted');
    this.$previewContainer.append(this.$preview, this.$empty);

    const $options = document.createElement('div');

    $options.classList.add('drawer-export-options');
    $options.setAttribute('role', 'group');
    this.$selected = this._createSwitch($options, 'export.selected');
    this.$background = this._createSwitch($options, 'export.background', true);
    this.$dark = this._createSwitch($options, 'export.dark');
    this.$withDrawing = this._createSwitch($options, 'export.withDrawing');

    const $scales = document.createElement('div');
    const scaleName = uniqueId('export-scale');

    $scales.classList.add('drawer-export-scales');
    $scales.setAttribute('role', 'radiogroup');
    this.$scales = [1, 2, 3].map((scale) => {
      const $label = document.createElement('label');
      const $radio = document.createElement('input');

      $radio.type = 'radio';
      $radio.name = scaleName;
      $radio.value = String(scale);
      $radio.checked = scale === 2;
      $label.append($radio, `${scale}×`);
      $scales.append($label);
      return $radio;
    });
    $options.append($scales);
    // preview follows options
    $options.addEventListener('change', () => this.updatePreview());

    this.$modalBody.append(this.$previewContainer, $options);

    const formats: (ImageFormat | 'json')[] = ['png', 'svg', 'pdf', 'json'];

    this.$buttons = formats.map((format) => {
      const $btn = createButton('drawer-button', 'drawer-button-neutral');
      const label = format.toUpperCase();

      $btn.textContent = label;
      drawer.i18n.translate((t) =>
        setLabel(
          $btn,
          format === 'json'
            ? t('export.saveFile', { extension: drawingFileExtension })
            : t('export.saveAs', { format: label })
        )
      );
      $btn.addEventListener('click', () => this.save(format));
      return $btn;
    });

    const $copy = createButton('drawer-button', 'drawer-button-primary');

    $copy.addEventListener('click', () => this.copy());
    this.$buttons.push($copy);
    this.$modalFooter.append(...this.$buttons);

    drawer.i18n.translate((t) => {
      this.setTitle(t('export.title'));
      this.$empty.textContent = t('export.empty');
      $options.setAttribute('aria-label', t('export.options'));
      $scales.setAttribute('aria-label', t('export.scale'));
      $copy.textContent = t('export.copy');
      this.$preview.setAttribute('aria-label', t('export.preview'));
    });
  }

  /**
   * Adds a switch with its translated label to the options
   * @param $container Group of options receiving the labelled switch
   * @param text Key of the label text (translated again when language changes)
   * @param checked Initial state of the switch
   * @returns the switch input
   */
  private _createSwitch($container: HTMLElement, text: TranslationKey, checked = false) {
    const $label = document.createElement('label');
    const $switch = createSwitch(checked);
    const $text = document.createTextNode('');

    $label.append($switch, $text);
    $container.append($label);
    this.drawer.i18n.translate((t) => ($text.data = t(text)));

    return $switch;
  }

  /**
   * Options chosen in dialog
   */
  get exportOptions(): Required<ExportImageOptions> {
    return {
      selected: this.$selected.checked,
      background: this.$background.checked,
      dark: this.$dark.checked,
      withDrawing: this.$withDrawing.checked,
      scale: Number(this.$scales.find(($radio) => $radio.checked)?.value ?? 2),
    };
  }

  /**
   * Show dialog, selected shapes exported when there is a selection (whole drawing can be chosen in dialog)
   */
  show() {
    const hasSelection = this.drawer.getSelectedShapes().length > 0;

    this.$selected.checked = hasSelection;
    this.$selected.parentElement!.hidden = !hasSelection;
    // as shown
    this.$dark.checked = this.drawer.isDarkMode();
    super.show();
    this.updatePreview();
  }

  /**
   * Preview rendered at once (canvas shown as is: no image encoding), at screen resolution, again once fonts of its texts
   * are loaded (drawn with a fallback font before)
   * @param fontsLoaded Fonts of texts loaded since the last preview: not loaded again
   */
  updatePreview(fontsLoaded = false) {
    const scale = window.devicePixelRatio || 1;
    const $canvas = this.drawer.exportCanvas({ ...this.exportOptions, scale });

    this.$empty.hidden = !!$canvas;
    for (const $btn of this.$buttons) $btn.disabled = !$canvas;
    this.$preview.hidden = !$canvas;
    if (!$canvas) return;

    // konva canvas is absolutely positioned
    $canvas.style.cssText = '';
    // drawing size, sharp on high density screens
    $canvas.style.width = `${$canvas.width / scale}px`;
    $canvas.style.height = `${$canvas.height / scale}px`;
    $canvas.setAttribute('role', 'img');
    $canvas.setAttribute('aria-label', this.drawer.t('export.preview'));
    this.$preview.replaceWith($canvas);
    this.$preview = $canvas;

    const fonts = fontsLoaded ? [] : getFontsToLoad(this.drawer.getExportShapes(this.exportOptions.selected));

    if (fonts.length) {
      loadFonts(fonts).then(() => {
        if (this.isVisible()) this.updatePreview(true);
      });
    }
  }

  /**
   * Save image or drawing file (selected shapes or whole drawing)
   * @param format Image format, or `json` for a drawing file (`.freedrawing`)
   */
  async save(format: ImageFormat | 'json') {
    try {
      if (format === 'json') {
        const file = this.drawer.getDrawingFile(this.drawer.getExportShapes(this.exportOptions.selected));

        await saveFile(`drawing${drawingFileExtension}`, JSON.stringify(file));
      } else {
        const blob = await this.drawer.exportImage(format, this.exportOptions);

        await saveFile(`drawing.${format}`, blob, blob.type);
      }
    } catch (error) {
      // save dialog canceled
      if ((error as Error).name !== 'AbortError') {
        this.drawer.toast(
          this.drawer.t('toast.exportFailed', { error: getErrorText(error, this.drawer.i18n.t) }),
          'error'
        );
      }
    }
  }

  /**
   * Copy png image to clipboard
   */
  async copy() {
    // clipboard images are encoded again by browsers: without the drawing
    await this.drawer.copyImage('png', { ...this.exportOptions, withDrawing: false });
  }
}
