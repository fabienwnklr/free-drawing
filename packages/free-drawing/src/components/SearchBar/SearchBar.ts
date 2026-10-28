import { Group } from 'konva/lib/Group';
import { Rect } from 'konva/lib/shapes/Rect';
import type { Text } from 'konva/lib/shapes/Text';
import type { Drawer } from '@/Drawer';
import type { TranslationKey } from '@/@types/i18n';
import '@/components/SearchBar/search-bar.scss';
import { drawerEvents } from '@/constants';
import ChevronIcon from '@/icons/chevron.svg?raw';
import CloseIcon from '@/icons/close.svg?raw';
import SearchIcon from '@/icons/search.svg?raw';
import { createButton, disableElement, enableElement, hasFocusOutside, isComposing, setLabel } from '@/utils/dom';
import { findTexts } from '@/utils/search';
import { ariaShortcut, formatShortcut } from '@/utils/shortcut';

/** Name of the group of highlights of the texts found, in the selection layer */
export const searchHighlightsName = 'drawer-search-highlights';

/** Space around a text found and its highlight, on screen in px */
const highlightPadding = 4;

/**
 * Search of the texts of the drawing (Ctrl+F): bar at the top of the drawer, texts found highlighted (the current one
 * outlined), Enter / Shift + Enter or its buttons go from one to the next, the view moves to show the current one;
 * found again when the drawing changes
 */
export class SearchBar {
  /** Drawer whose texts are searched */
  drawer: Drawer;
  /** Bar (`search` region): field, count, previous, next and close buttons */
  $bar: HTMLDivElement;
  /** Search field */
  $input: HTMLInputElement;
  /** Number of the current text and of the texts found */
  $count: HTMLSpanElement;
  /** Button showing the previous text found (Shift+Enter) */
  $previousButton: HTMLButtonElement;
  /** Button showing the next text found (Enter) */
  $nextButton: HTMLButtonElement;
  /** Button closing the search (Escape) */
  $closeButton: HTMLButtonElement;
  /** Texts found, in reading order */
  results: Text[] = [];
  /** Index of the current text in `results`, -1 without */
  index = -1;
  /** Highlights in the selection layer, created again once it is emptied (drawing loaded) */
  #highlights: Group | null = null;
  /** Nothing searched yet: a first search finding nothing is read */
  #first = true;

  /**
   * Create the hidden bar in the floating region, texts found again when the drawing changes, highlights following it
   * @param drawer Drawer whose texts are searched
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$bar = document.createElement('div');
    this.$bar.classList.add('drawer-search-bar', 'tool');
    this.$bar.setAttribute('role', 'search');
    this.$bar.hidden = true;

    const $icon = document.createElement('span');

    $icon.classList.add('drawer-search-icon');
    $icon.innerHTML = SearchIcon;
    this.$input = document.createElement('input');
    this.$input.type = 'search';
    this.$input.classList.add('drawer-search-input');
    this.$input.setAttribute('aria-keyshortcuts', ariaShortcut('Ctrl+F'));
    this.$count = document.createElement('span');
    this.$count.classList.add('drawer-search-count', 'text-muted');
    this.$previousButton = this._createButton(ChevronIcon, 'search.previous', 'Shift+Enter', () => this.previous());
    this.$previousButton.classList.add('drawer-search-previous');
    this.$nextButton = this._createButton(ChevronIcon, 'search.next', 'Enter', () => this.next());
    this.$nextButton.classList.add('drawer-search-next');
    this.$closeButton = this._createButton(CloseIcon, 'search.close', 'Escape', () => this.hide());
    drawer.i18n.translate((t) => {
      setLabel(this.$input, t('search.label'));
      this.$input.placeholder = t('search.label');
      this.$bar.setAttribute('aria-label', t('search.label'));
      this._updateCount();
    });
    this.$bar.append($icon, this.$input, this.$count, this.$previousButton, this.$nextButton, this.$closeButton);
    drawer.layout.add('floating', this.$bar);

    this.$input.addEventListener('input', () => this._search());
    this.$bar.addEventListener('keydown', (e) => {
      // keys of the bar are not shortcuts of the drawer (Delete, arrows...)
      e.stopPropagation();
      if (isComposing(e)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hide();
      } else if (e.key === 'Enter' && e.target === this.$input) {
        e.preventDefault();
        if (e.shiftKey) this.previous();
        else this.next();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        // again: search selected, not the search of the browser
        e.preventDefault();
        this.$input.select();
      }
    });

    // texts edited, added, removed (also by other users)
    drawer.on(drawerEvents.change, () => {
      if (this.isVisible()) this._search(false);
    });
    // highlights follow moves and zoom
    drawer.drawLayer.on('draw.search', () => {
      if (this.isVisible()) this._highlight();
    });
  }

  /**
   * Whether the bar is shown
   * @returns True while the bar is shown
   */
  isVisible() {
    return !this.$bar.hidden;
  }

  /**
   * Show the bar, focus in its field (its text selected), texts searched
   * @param search Text to search, the previous one by default
   */
  show(search?: string) {
    if (search !== undefined) this.$input.value = search;
    this.$bar.hidden = false;
    // narrow drawer: panels at its place hidden (see search-bar.scss)
    this.drawer.$drawerContainer.classList.add('is-searching');
    this.$input.focus();
    this.$input.select();
    this._search();
  }

  /**
   * Hide the bar and the highlights, focus back on the drawer (unless an element out of it took it)
   */
  hide() {
    if (!this.isVisible()) return;

    this.$bar.hidden = true;
    this.drawer.$drawerContainer.classList.remove('is-searching');
    this.results = [];
    this.index = -1;
    this.#highlights?.destroyChildren();
    this.drawer.selectionLayer.batchDraw();
    if (!hasFocusOutside(this.drawer.$drawerContainer)) this.drawer.focus();
  }

  /**
   * Show the next text found (the first one after the last one)
   */
  next() {
    if (!this.results.length) return;

    this.index = (this.index + 1) % this.results.length;
    this._showCurrent();
  }

  /**
   * Show the previous text found (the last one before the first one)
   */
  previous() {
    if (!this.results.length) return;

    this.index = (this.index - 1 + this.results.length) % this.results.length;
    this._showCurrent();
  }

  /**
   * Texts found again: the current one kept when still found, else the first one
   * @param show Move the view to the current text (search typed), not after a change of the drawing
   */
  private _search(show: boolean = true) {
    const current = this.results[this.index];
    const found = this.results.length > 0;

    this.results = findTexts(this.drawer.drawLayer, this.$input.value);
    this.index = this.results.length ? Math.max(0, this.results.indexOf(current as Text)) : -1;
    if (show && this.index >= 0) {
      this._showCurrent();
      return;
    }
    this._updateCount();
    this._highlight();
    // search typed finding nothing (once, not at each key): read
    if (show && (found || this.#first) && !this.results.length && this.$input.value.trim()) {
      this.drawer._announce(this.$count.textContent ?? '');
    }
    this.#first = !this.$input.value.trim();
  }

  /**
   * Current text shown in the view (moved to it, zoomed out when it does not fit), highlighted, its number read
   */
  private _showCurrent() {
    const { drawer } = this;
    const text = this.results[this.index];

    drawer._showInView(text.getClientRect({ relativeTo: drawer.drawLayer }));
    this._updateCount();
    this._highlight();
    drawer._announce(this.$count.textContent ?? '');
  }

  /**
   * Number of the current text and of the texts found, buttons enabled with texts found
   */
  private _updateCount() {
    const { t } = this.drawer.i18n;
    const searched = !!this.$input.value.trim();

    this.$count.textContent = !searched
      ? ''
      : this.results.length
      ? t('search.count', { current: this.index + 1, total: this.results.length })
      : t('search.none');
    for (const $button of [this.$previousButton, this.$nextButton]) {
      (this.results.length ? enableElement : disableElement)($button);
    }
  }

  /**
   * Texts found highlighted in the selection layer, the current one outlined; same padding and width on screen
   * whatever the zoom
   */
  private _highlight() {
    const { drawer } = this;

    // selection layer emptied (drawing loaded): created again
    if (!this.#highlights?.getLayer()) {
      this.#highlights = new Group({ name: searchHighlightsName, listening: false });
      drawer.selectionLayer.add(this.#highlights);
    }

    const unit = 1 / drawer.getZoomLevel();
    const padding = highlightPadding * unit;

    this.#highlights.destroyChildren();
    this.results.forEach((text, i) => {
      const box = text.getClientRect({ relativeTo: drawer.drawLayer });
      const current = i === this.index;

      this.#highlights!.add(
        new Rect({
          x: box.x - padding,
          y: box.y - padding,
          width: box.width + padding * 2,
          height: box.height + padding * 2,
          cornerRadius: 4 * unit,
          fill: 'rgba(255, 212, 59, 0.35)',
          stroke: current ? '#f08c00' : undefined,
          strokeWidth: 2 * unit,
        })
      );
    });
    this.#highlights.moveToBottom();
    drawer.selectionLayer.batchDraw();
  }

  /**
   * Icon button of the bar, named by its translated label, its key in its tooltip
   * @param icon SVG markup of the icon
   * @param label Key of the accessible name and tooltip (translated again when language changes)
   * @param shortcut Key of the same action in the field (`Enter`, `Escape`)
   * @param action Run on click
   * @returns Button, to add to the bar
   */
  private _createButton(icon: string, label: TranslationKey, shortcut: string, action: () => void) {
    const $btn = createButton('drawer-button', 'drawer-button-neutral');

    $btn.innerHTML = icon;
    this.drawer.i18n.translate((t) => {
      setLabel($btn, t(label));
      $btn.title = `${t(label)} (${formatShortcut(shortcut, t)})`;
    });
    $btn.addEventListener('click', action);

    return $btn;
  }
}
