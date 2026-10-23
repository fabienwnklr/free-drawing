import type { Stage } from 'konva/lib/Stage';
import type { Drawer } from '@/Drawer';
import { debounce } from '@/utils/perf';
import type { LayoutRegion, LayoutItemOptions } from '@/@types/ui';

/**
 * Layout of a drawer: its container in the element of the drawer (canvas of the stage, interface over it), regions of
 * the interface, size of the window followed by a drawer of window size, interface ignoring pointer during pointer
 * actions, zen mode.
 *
 * Order of container (stacking and tab order): canvas, header, floating elements added while the drawer is created,
 * footer, floating elements added later (dialogs, toasts, text editor).
 */
export class DrawerLayout {
  /** Container of the drawer: canvas and interface, keyboard shortcuts */
  readonly $container: HTMLDivElement;
  /** Top left interface: settings menu, layers button, position */
  readonly $header: HTMLDivElement;
  /** Bottom interface: its start, toolbar, help */
  readonly $footer: HTMLElement;
  /** Bottom left interface: zoom, undo / redo */
  readonly $footerStart: HTMLDivElement;
  /** Interface hidden but toolbar, menu and selection options, see `setZen` */
  zen: boolean = false;
  /** Drawer created: floating elements after the footer */
  #ready: boolean = false;

  /**
   * Container put in the element of the drawer (its content replaced) with header and footer regions
   * @param drawer Drawer of this layout (element, size, texts), resized with the window when it has its size
   */
  constructor(private readonly drawer: Drawer) {
    this.$container = document.createElement('div');
    this.$container.classList.add('drawer-container');
    // in tab order, keys go to drawer shortcuts (not to screen reader commands)
    this.$container.tabIndex = 0;
    this.$container.setAttribute('role', 'application');
    this.$container.lang = drawer.i18n.language;
    drawer.i18n.translate((t) => this.$container.setAttribute('aria-label', t('drawer.label')));

    this.$header = document.createElement('div');
    this.$header.classList.add('drawer-header-container');
    this.$footer = document.createElement('footer');
    this.$footer.classList.add('drawer-footer-container');
    this.$footerStart = document.createElement('div');
    this.$footerStart.classList.add('drawer-footer-left');
    this.$footer.append(this.$footerStart);
    this.$container.append(this.$header, this.$footer);
    drawer.$el.replaceChildren(this.$container);

    const { width, height } = drawer.options;
    const { clientWidth, clientHeight } = document.documentElement;

    if (width === clientWidth && height === clientHeight) this._followWindow();
  }

  /**
   * Stage created in container (konva empties it): its canvas, then header and footer drawn over it
   * @param stage Konva stage of the drawer, its content put first in container
   */
  setStage(stage: Stage) {
    this.$container.replaceChildren(stage.content, this.$header, this.$footer);
    stage.on('widthChange.layout', () => this.updateCompact());
  }

  /**
   * Drawer created: floating elements added from now on are after the footer, interface fitted to the drawer width
   */
  ready() {
    this.#ready = true;
    this.updateCompact();
    // header wraps in a narrow drawer: options panel below it (no layout observer in tests)
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() =>
      this.$container.style.setProperty('--drawer-header-height', `${this.$header.offsetHeight}px`)
    );

    observer.observe(this.$header);
    this.drawer.signal.addEventListener('abort', () => observer.disconnect());
  }

  /**
   * Compact interface (`is-compact` class) when the footer does not fit on one line (narrow drawer, phone): toolbar on
   * its own line (scrolls in it), header on several lines, options panel below the header. Checked when the drawer is
   * created or resized, in zen mode and when an element is added to the footer; to call after another change of it.
   */
  updateCompact() {
    this.$container.classList.remove('is-compact');
    // its parts wider than the drawer (no layout, tests: nothing measured)
    this.$container.classList.toggle('is-compact', this.$footer.scrollWidth > this.$footer.clientWidth);
  }

  /**
   * Add an element of the interface to a region
   * @param region Region receiving the element: `header`, `footerStart`, `footer` or `floating`
   * @param $element Element of the interface
   * @param options Hidden in zen mode (`hideInZen`), placed after an element (`after`) instead of end of region
   */
  add(region: LayoutRegion, $element: HTMLElement, { hideInZen = false, after }: LayoutItemOptions = {}) {
    $element.classList.toggle('drawer-zen-hidden', hideInZen);

    if (after?.parentElement) {
      after.after($element);
    } else if (region === 'header') {
      this.$header.append($element);
    } else if (region === 'footerStart') {
      this.$footerStart.append($element);
    } else if (region === 'footer') {
      this.$footer.append($element);
    } else if (this.#ready) {
      this.$container.append($element);
    } else {
      this.$footer.before($element);
    }
    // footer may no longer fit on one line
    if (this.#ready && this.$footer.contains($element)) this.updateCompact();
  }

  /**
   * Zen mode: elements added with `hideInZen` hidden
   * @param zen True hides these elements (`is-zen` class), false shows them
   */
  setZen(zen: boolean) {
    this.zen = zen;
    this.$container.classList.toggle('is-zen', zen);
    // footer start hidden: toolbar may fit on one line
    this.updateCompact();
  }

  /**
   * Interface receives pointer or not (during pointer actions: drawing, selecting...), see `--drawer-pointer-events`
   * @param state 'none' ignores pointer on panels, 'all' gives it back
   */
  setPointerEvents(state: 'all' | 'none') {
    // on drawer container, other drawers of the page are not concerned
    this.$container.style.setProperty('--drawer-pointer-events', state);
  }

  /**
   * Drawer of window size: it follows the size of the window
   */
  private _followWindow() {
    this.$container.classList.add('is-full');

    const resizeObserver = new ResizeObserver(
      debounce(() => {
        // not once destroyed
        if (this.drawer.signal.aborted) return;
        this.drawer.setSize(document.documentElement.clientWidth, document.documentElement.clientHeight);
      }, 250)
    );

    // to attach to the whole document
    resizeObserver.observe(document.documentElement);
    this.drawer.signal.addEventListener('abort', () => resizeObserver.disconnect());
  }
}
