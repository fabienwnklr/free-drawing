import './export-modal.scss';
import type { Drawer, ExportImageOptions } from '@/Drawer';
import { Modal } from '@/components/Modal/Modal';
import type { ImageFormat } from '@/utils/export';
import { drawingFileExtension, saveFile } from '@/utils/drawingFile';
import { createButton, setLabel, uniqueId } from '@/utils/dom';

/**
 * Export dialog: preview, options (selected shapes or whole drawing, background, dark mode, scale),
 * image or drawing file saved, image copied to clipboard
 */
export class ExportModal extends Modal {
  /** Rendered image, replaced on each update */
  $preview: HTMLCanvasElement;
  $previewContainer: HTMLDivElement;
  $empty: HTMLParagraphElement;
  $selected: HTMLInputElement;
  $background: HTMLInputElement;
  $dark: HTMLInputElement;
  $scales: HTMLInputElement[];
  $buttons: HTMLButtonElement[];

  constructor(drawer: Drawer) {
    super(drawer, { title: 'Export image' });
    this.$modal.classList.add('drawer-modal-export');

    this.$previewContainer = document.createElement('div');
    this.$previewContainer.classList.add('drawer-export-preview');
    this.$preview = document.createElement('canvas');
    this.$empty = document.createElement('p');
    this.$empty.classList.add('text-muted');
    this.$empty.textContent = 'Nothing to export';
    this.$previewContainer.append(this.$preview, this.$empty);

    const $options = document.createElement('div');

    $options.classList.add('drawer-export-options');
    $options.setAttribute('role', 'group');
    $options.setAttribute('aria-label', 'Export options');
    this.$selected = this._createCheckbox($options, 'Only selected shapes');
    this.$background = this._createCheckbox($options, 'Background', true);
    this.$dark = this._createCheckbox($options, 'Dark mode');

    const $scales = document.createElement('div');
    const scaleName = uniqueId('export-scale');

    $scales.classList.add('drawer-export-scales');
    $scales.setAttribute('role', 'radiogroup');
    $scales.setAttribute('aria-label', 'Scale (png, pdf)');
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

    const formats: { format: ImageFormat | 'json'; label: string }[] = [
      { format: 'png', label: 'PNG' },
      { format: 'svg', label: 'SVG' },
      { format: 'pdf', label: 'PDF' },
      { format: 'json', label: 'JSON' },
    ];

    this.$buttons = formats.map(({ format, label }) => {
      const $btn = createButton('drawer-button', 'drawer-button-neutral');

      $btn.textContent = label;
      setLabel($btn, format === 'json' ? `Save as ${drawingFileExtension} file` : `Save as ${label}`);
      $btn.addEventListener('click', () => this.save(format));
      return $btn;
    });

    const $copy = createButton('drawer-button', 'drawer-button-primary');

    $copy.textContent = 'Copy to clipboard';
    $copy.addEventListener('click', () => this.copy());
    this.$buttons.push($copy);
    this.$modalFooter.append(...this.$buttons);
  }

  private _createCheckbox($container: HTMLElement, text: string, checked = false) {
    const $label = document.createElement('label');
    const $checkbox = document.createElement('input');

    $checkbox.type = 'checkbox';
    $checkbox.checked = checked;
    $label.append($checkbox, text);
    $container.append($label);

    return $checkbox;
  }

  /**
   * Options chosen in dialog
   */
  get exportOptions(): Required<ExportImageOptions> {
    return {
      selected: this.$selected.checked,
      background: this.$background.checked,
      dark: this.$dark.checked,
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
    super.show();
    this.updatePreview();
  }

  /**
   * Preview rendered at once (canvas shown as is: no image encoding), at screen resolution
   */
  updatePreview() {
    const scale = window.devicePixelRatio || 1;
    const $canvas = this.drawer.exportCanvas({ ...this.exportOptions, scale });

    this.$empty.hidden = !!$canvas;
    this.$buttons.forEach(($btn) => ($btn.disabled = !$canvas));
    this.$preview.hidden = !$canvas;
    if (!$canvas) return;

    // konva canvas is absolutely positioned
    $canvas.style.cssText = '';
    // drawing size, sharp on high density screens
    $canvas.style.width = `${$canvas.width / scale}px`;
    $canvas.style.height = `${$canvas.height / scale}px`;
    $canvas.setAttribute('role', 'img');
    $canvas.setAttribute('aria-label', 'Preview of exported image');
    this.$preview.replaceWith($canvas);
    this.$preview = $canvas;
  }

  /**
   * Save image or drawing file (selected shapes or whole drawing)
   */
  async save(format: ImageFormat | 'json') {
    try {
      if (format === 'json') {
        const file = this.drawer.getDrawingFile(this.drawer.getExportShapes(this.exportOptions.selected));

        await saveFile('drawing' + drawingFileExtension, JSON.stringify(file));
      } else {
        const blob = await this.drawer.exportImage(format, this.exportOptions);

        await saveFile(`drawing.${format}`, blob, blob.type);
      }
    } catch (error) {
      // save dialog canceled
      if ((error as Error).name !== 'AbortError') this.drawer.toast(`Export failed: ${(error as Error).message}`, 'error');
    }
  }

  /**
   * Copy png image to clipboard
   */
  async copy() {
    try {
      // secure context (https) only
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('clipboard unavailable');

      // image promise: Safari needs clipboard write during the click
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': this.drawer.exportImage('png', this.exportOptions) })]);
      this.drawer.toast('Image copied', 'info');
    } catch (error) {
      this.drawer.toast(`Image can't be copied: ${(error as Error).message}`, 'warning');
    }
  }
}
