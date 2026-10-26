import type { Drawer } from '@/Drawer';
import type { TranslationKey } from '@/@types/i18n';
import { uniqueId } from '@/utils/dom';

/**
 * Group of fields of a tool panel named by its title (as the sections of `BaseOverlay`)
 * @param drawer Drawer of the panel (texts)
 * @param title Key of the section title, translated again on language change
 * @returns Section element (title then buttons element) and its buttons element, not appended yet
 */
export function createOverlaySection(drawer: Drawer, title: TranslationKey) {
  /** Section element: group named by its title */
  const $container = document.createElement('div');
  const $title = document.createElement('h6');
  /** Element of the section buttons, after its title */
  const $buttons = document.createElement('div');

  $title.classList.add('title');
  $title.id = uniqueId('overlay-title');
  drawer.i18n.translate((t) => ($title.textContent = t(title)));
  $container.classList.add('overlay-picker-container');
  $container.setAttribute('role', 'group');
  $container.setAttribute('aria-labelledby', $title.id);
  $buttons.classList.add('overlay-picker-btn-container');
  $container.append($title, $buttons);

  return { $container, $buttons };
}
