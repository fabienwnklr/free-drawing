import type { Context } from 'konva/lib/Context';
import { Shape } from 'konva/lib/Shape';
import type { IRect } from 'konva/lib/types';
import type { Drawer } from '@/Drawer';
import type { TranslationKey } from '@/@types/i18n';
import type { SlideshowOptions, SlideshowState } from '@/@types/ui';
import '@/components/Slideshow/slideshow.scss';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { drawerEvents } from '@/constants';
import ChevronIcon from '@/icons/chevron.svg?raw';
import CloseIcon from '@/icons/close.svg?raw';
import { createButton, hasFocusOutside, isComposing, setLabel } from '@/utils/dom';
import { type Frame, isFrame } from '@/utils/frame';
import { keyLetter } from '@/utils/HotKey';
import { formatShortcut } from '@/utils/shortcut';
import { getSlides, getSlideTitle } from '@/utils/slides';

/** Name of the mask around the slide shown, in the selection layer */
export const slideMaskName = 'drawer-slideshow-mask';

/** Space kept around a slide in the view, on screen in px */
const slideMargin = 16;

/** Keys showing the next slide */
const nextKeys = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];

/** Keys showing the previous slide */
const previousKeys = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];

/**
 * Presentation of the frames of the drawing, one after the other as slides (reading order): each one fills the view,
 * around it masked, the interface hidden but a bar (previous, number, next, stop), the laser as pointer, on the whole
 * screen when the browser allows it. Keys: arrows, Page Up / Down and Space go from one slide to the next, Home / End
 * to the first / last one, Escape stops. The owner of a collaboration session presents its slides: other users follow
 * them. The view, the tool and the size of the drawer come back once it stops
 */
export class Slideshow {
  /** Drawer whose frames are presented */
  drawer: Drawer;
  /** Bar of the slideshow: previous, number and title of the slide, next, stop */
  $bar: HTMLDivElement;
  /** Number of the slide shown and of the slides */
  $count: HTMLSpanElement;
  /** Title of the slide shown (name of its frame) */
  $title: HTMLSpanElement;
  /** Button showing the previous slide */
  $previousButton: HTMLButtonElement;
  /** Button showing the next slide */
  $nextButton: HTMLButtonElement;
  /** Button stopping the slideshow */
  $stopButton: HTMLButtonElement;
  /** Frames presented, in reading order (found again when the drawing changes) */
  slides: Frame[] = [];
  /** Index of the slide shown in `slides`, -1 when the slideshow is stopped */
  index = -1;
  /** State of the drawer before the slideshow, given back once it stops */
  #state: SlideshowState | null = null;
  /** Presentation of the collaboration session started by the slideshow (owner): stopped with it */
  #presenting = false;
  /** Drawer on the whole screen for the slideshow: leaving it stops the slideshow */
  #fullscreen = false;
  /** Mask around the slide shown, in the selection layer (created again once the layer is emptied) */
  #mask: Shape | null = null;
  /** Area of the slide shown alone, null without mask */
  #maskArea: IRect | null = null;
  /** Box of the slide shown (JSON): shown again when it changes (moved, resized by another user) */
  #shownBox = '';

  /**
   * Create the hidden bar in the floating region; slides found again when the drawing changes, the slide fitted again
   * to the view when the drawer is resized
   * @param drawer Drawer whose frames are presented
   */
  constructor(drawer: Drawer) {
    this.drawer = drawer;

    this.$bar = document.createElement('div');
    this.$bar.classList.add('drawer-slideshow-bar', 'tool');
    this.$bar.setAttribute('role', 'group');
    this.$bar.hidden = true;
    this.$previousButton = this._createButton(ChevronIcon, 'slideshow.previous', 'Left', () => this.previous());
    this.$previousButton.classList.add('drawer-slideshow-previous');
    this.$count = document.createElement('span');
    this.$count.classList.add('drawer-slideshow-count');
    this.$title = document.createElement('span');
    this.$title.classList.add('drawer-slideshow-title', 'text-muted');
    this.$nextButton = this._createButton(ChevronIcon, 'slideshow.next', 'Right', () => this.next());
    this.$stopButton = this._createButton(CloseIcon, 'slideshow.stop', 'Escape', () => this.stop());
    drawer.i18n.translate((t) => {
      this.$bar.setAttribute('aria-label', t('slideshow.label'));
      this._updateBar();
    });
    this.$bar.append(this.$previousButton, this.$count, this.$title, this.$nextButton, this.$stopButton);
    drawer.layout.add('floating', this.$bar);

    // frames added, removed, moved (also by other users)
    drawer.on(drawerEvents.change, () => {
      if (this.active) this._update();
    });
    drawer.stage.on('widthChange.slideshow heightChange.slideshow', () => {
      if (this.active) this._show();
    });
    document.addEventListener('fullscreenchange', () => this._onFullscreenChange(), { signal: drawer.signal });
  }

  /**
   * Slideshow going on
   * @returns True while a slide is shown
   */
  get active(): boolean {
    return this.index >= 0;
  }

  /**
   * Frame of the slide shown
   * @returns Frame shown, null without slideshow
   */
  get current(): Frame | null {
    return this.slides[this.index] ?? null;
  }

  /**
   * Start the slideshow from a frame: from the selected frame by default, else from the first one. Without frame, told
   * in a toast. Its first slide is shown at once, on the whole screen once the browser allows it
   * @param from Frame shown first
   * @param options Whole screen (`fullscreen`, true by default)
   * @returns True when it started (or showed this frame), false without frame
   */
  start(from?: Frame, { fullscreen = true }: SlideshowOptions = {}): boolean {
    const { drawer } = this;

    if (this.active) {
      if (from) this.goTo(this.slides.indexOf(from));
      return true;
    }

    const slides = getSlides(drawer.getDrawingShapes(), drawer.drawLayer);

    if (!slides.length) {
      drawer.toast(drawer.t('slideshow.noFrames'), 'info');
      return false;
    }

    const first = from ?? drawer.getSelectedShapes().find(isFrame);
    const { collaboration } = drawer;

    this.slides = slides;
    this.index = first ? Math.max(0, slides.indexOf(first)) : 0;
    this.#state = {
      position: drawer.stage.position(),
      scale: drawer.getZoomLevel(),
      tool: drawer.activeWidget ?? null,
      size: drawer.stage.size(),
    };
    drawer.getWidget<SelectWidget>('selection')?.clearSelection();
    // pointer of the presenter: laser (also in read only), else pan
    this._activate(drawer.getWidget<BaseWidget>('laser') ?? drawer.getWidget<BaseWidget>('pan') ?? null);
    drawer.$drawerContainer.classList.add('is-presenting');
    this.$bar.hidden = false;
    // owner of a session: other users follow the slides
    if (collaboration?.isOwner && !collaboration.presenting) {
      this.#presenting = true;
      collaboration.present(true);
    }
    this._show(true);
    if (fullscreen) this._enterFullscreen();
    drawer.focus();
    drawer.trigger(drawerEvents.slideshowChange, this.index);

    return true;
  }

  /**
   * Show the next slide (nothing after the last one)
   */
  next() {
    this.goTo(this.index + 1);
  }

  /**
   * Show the previous slide (nothing before the first one)
   */
  previous() {
    this.goTo(this.index - 1);
  }

  /**
   * Show a slide: fitted to the view, around it masked, its number read
   * @param index Index of the slide (kept in the slides), the slide shown fitted again when it is the same
   */
  goTo(index: number) {
    if (!this.active) return;

    const target = Math.min(Math.max(index, 0), this.slides.length - 1);

    if (target === this.index) {
      // moved or zoomed meanwhile
      this._show();
      return;
    }
    this.index = target;
    this._show(true);
    this.drawer.trigger(drawerEvents.slideshowChange, this.index);
  }

  /**
   * Stop the slideshow: interface, tool, size and view of the drawer given back, presentation of the session stopped
   * when the slideshow started it
   */
  stop() {
    if (!this.active) return;

    const { drawer } = this;
    const state = this.#state!;

    this.index = -1;
    this.slides = [];
    this.#state = null;
    this.#shownBox = '';
    this.$bar.hidden = true;
    drawer.$drawerContainer.classList.remove('is-presenting');
    this.hideMask();
    this._exitFullscreen();
    if (drawer.stage.width() !== state.size.width || drawer.stage.height() !== state.size.height) {
      drawer.setSize(state.size.width, state.size.height);
    }
    drawer._setView(state.position, state.scale);
    this._activate(state.tool && !state.tool.isDisabled ? state.tool : null);
    if (this.#presenting) {
      this.#presenting = false;
      drawer.collaboration?.present(false);
    }
    if (!hasFocusOutside(drawer.$drawerContainer)) drawer.focus();
    drawer.trigger(drawerEvents.slideshowChange, -1);
  }

  /**
   * Keys of the drawer during the slideshow (see `HotKey`): next, previous, first, last slide, stop. Other keys do
   * nothing in the drawer, shortcuts of the browser (Ctrl / Cmd) are kept
   * @param e Key pressed in the drawer
   */
  handleKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || isComposing(e)) return;
    // button of the bar pressed with the keyboard: its own action
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).closest('button')) return;

    if (e.altKey) {
      if (!e.shiftKey || keyLetter(e) !== 'p') return;
      this.stop();
    } else if (nextKeys.includes(e.key)) {
      this.next();
    } else if (previousKeys.includes(e.key)) {
      this.previous();
    } else if (e.key === 'Home') {
      this.goTo(0);
    } else if (e.key === 'End') {
      this.goTo(this.slides.length - 1);
    } else if (e.key === 'Escape') {
      this.stop();
    } else {
      return;
    }
    e.preventDefault();
  }

  /**
   * Area of the slide shown, presented to other users of a collaboration session
   * @returns Box of the frame shown, in drawing coordinates, null without slideshow
   */
  getSlideArea(): IRect | null {
    return this.current?.getClientRect({ relativeTo: this.drawer.drawLayer }) ?? null;
  }

  /**
   * Area of a slide shown alone: fitted to the view (space around it), around it masked. Slides of the owner presenting
   * them to the users of a session
   * @param area Area of the slide, in drawing coordinates
   */
  showSlideArea(area: IRect) {
    this.drawer.showArea(area, undefined, slideMargin);
    this.showMask(area);
  }

  /**
   * Area of a slide of another user no longer shown alone (presentation stopped, view moved), unless this user presents
   * its own slides
   */
  hideSlideArea() {
    if (!this.active) this.hideMask();
  }

  /**
   * Mask of the drawing around an area (background color of the drawing), above the drawing, under the cursors and
   * lasers of the selection layer
   * @param area Area shown, in drawing coordinates
   */
  showMask(area: IRect) {
    this.#maskArea = area;
    // selection layer emptied (drawing loaded): created again
    if (!this.#mask?.getLayer()) {
      this.#mask = new Shape({
        name: slideMaskName,
        listening: false,
        sceneFunc: (context) => this._drawMask(context),
      });
      this.drawer.selectionLayer.add(this.#mask);
    }
    this.#mask.moveToBottom();
    this.drawer.selectionLayer.batchDraw();
  }

  /**
   * Mask removed: whole drawing shown again
   */
  hideMask() {
    this.#maskArea = null;
    if (!this.#mask) return;

    this.#mask.destroy();
    this.#mask = null;
    this.drawer.selectionLayer.batchDraw();
  }

  /**
   * Slide shown: fitted to the view, around it masked, bar updated
   * @param announce Number and title of the slide read by screen readers (slide changed)
   */
  private _show(announce: boolean = false) {
    const area = this.getSlideArea();

    if (!area) return;

    this.#shownBox = JSON.stringify(area);
    this.showSlideArea(area);
    this._updateBar();
    if (announce) this.drawer._announce(this._describe());
  }

  /**
   * Slides found again once the drawing changed: the slide shown kept (shown again when its box changed), the slideshow
   * stopped without frame
   */
  private _update() {
    const id = this.current?.id();
    const slides = getSlides(this.drawer.getDrawingShapes(), this.drawer.drawLayer);

    if (!slides.length) {
      this.stop();
      return;
    }

    // by id: a frame changed by another user is replaced (collaboration)
    const index = slides.findIndex((frame) => frame.id() === id);

    this.slides = slides;
    this.index = index >= 0 ? index : Math.min(this.index, slides.length - 1);
    if (index < 0 || JSON.stringify(this.getSlideArea()) !== this.#shownBox) this._show(index < 0);
    else this._updateBar();
  }

  /**
   * Number and title of the slide shown in the bar, buttons enabled where there is a slide to go to
   */
  private _updateBar() {
    const { t } = this.drawer.i18n;
    const title = this.current ? getSlideTitle(this.current) : '';

    this.$count.textContent = this.active
      ? t('slideshow.count', { current: this.index + 1, total: this.slides.length })
      : '';
    this.$title.textContent = title;
    this.$title.hidden = !title;
    this.$previousButton.disabled = this.index <= 0;
    this.$nextButton.disabled = this.index >= this.slides.length - 1;
  }

  /**
   * Slide shown, as read by screen readers
   * @returns Number of the slide and of the slides, with its title
   */
  private _describe(): string {
    const title = this.current ? getSlideTitle(this.current) : '';
    const params = { current: this.index + 1, total: this.slides.length, title };

    return this.drawer.t(title ? 'slideshow.slideTitled' : 'slideshow.slide', params);
  }

  /**
   * Mask drawn around the area: 4 rectangles from the edges of the view (and beyond) to the area, in the background color
   * of the drawing (white without one)
   * @param context Konva context of the selection layer
   */
  private _drawMask(context: Context) {
    const area = this.#maskArea;

    if (!area) return;

    const view = this.drawer.getViewArea();
    const fill = this.drawer.background.fill();
    // beyond the view: no edge seen while it moves
    const x0 = view.x - view.width;
    const y0 = view.y - view.height;
    const x1 = view.x + view.width * 2;
    const y1 = view.y + view.height * 2;
    const left = Math.min(Math.max(area.x, x0), x1);
    const right = Math.min(Math.max(area.x + area.width, left), x1);
    const top = Math.min(Math.max(area.y, y0), y1);
    const bottom = Math.min(Math.max(area.y + area.height, top), y1);

    context.beginPath();
    context.rect(x0, y0, x1 - x0, top - y0);
    context.rect(x0, bottom, x1 - x0, y1 - bottom);
    context.rect(x0, top, left - x0, bottom - top);
    context.rect(right, top, x1 - right, bottom - top);
    context.setAttr('fillStyle', typeof fill === 'string' && fill && fill !== 'transparent' ? fill : '#fff');
    context.fill();
  }

  /**
   * Tool activated (laser during the slideshow, the previous tool after it), none deactivates the active one
   * @param tool Tool to activate, null for none
   */
  private _activate(tool: BaseWidget | null) {
    if (tool && !tool.isDisabled) tool.setActive(true);
    else this.drawer.activeWidget?.setActive(false);
  }

  /**
   * Drawer on the whole screen, when the browser allows it (else the slideshow stays in the drawer)
   */
  private _enterFullscreen() {
    const $container = this.drawer.$drawerContainer;

    if (typeof $container.requestFullscreen !== 'function' || document.fullscreenElement) return;
    $container.requestFullscreen().catch(() => {
      // refused (no user action, iframe): in the drawer
    });
  }

  /**
   * Whole screen left by the slideshow
   */
  private _exitFullscreen() {
    if (!this.#fullscreen) return;

    this.#fullscreen = false;
    if (document.fullscreenElement === this.drawer.$drawerContainer) document.exitFullscreen().catch(() => {});
  }

  /**
   * Whole screen entered: stage of the size of the screen; left by the browser (Escape): slideshow stopped
   */
  private _onFullscreenChange() {
    const $container = this.drawer.$drawerContainer;

    if (this.active && document.fullscreenElement === $container) {
      this.#fullscreen = true;
      this.drawer.setSize($container.clientWidth, $container.clientHeight);
    } else if (this.#fullscreen) {
      this.#fullscreen = false;
      this.stop();
    }
  }

  /**
   * Icon button of the bar, named by its translated label, its key in its tooltip
   * @param icon SVG markup of the icon
   * @param label Key of the accessible name and tooltip (translated again when language changes)
   * @param shortcut Key of the same action
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
