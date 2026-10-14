import type { AvailableTools, WidgetOptions } from '@/@types/toolbar';
import { Drawer } from '@/Drawer';
import { stringToNode } from '@/utils/functions';
import { getWidgetOptions } from '@/utils/widgets';
import type { KonvaEventListener } from 'konva/lib/Node';
import type { Stage } from 'konva/lib/Stage';
import type { Shape, ShapeConfig } from 'konva/lib/Shape';
import type { BaseOverlay } from '@/components/tools/Overlay/BaseOverlay';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import { createButton, disableElement, enableElement, setLabel, setPressed } from '@/utils/dom';

export abstract class BaseWidget {
  protected readonly $container: HTMLElement;
  private $icon: SVGElement;
  private disabled: boolean = false;
  $button: HTMLButtonElement;
  id: AvailableTools;
  shortcut: string | undefined;
  /** Options of the tool (color, width...), shown while widget is active (see `showOverlayOnActive`) */
  declare overlay?: BaseOverlay;
  /** Widget options given with drawer `widgets` option */
  readonly options: WidgetOptions;
  /** Pointer action in progress (drawing, erasing, selecting...), see `startAction` / `endAction` */
  inAction: boolean = false;
  /** Show `overlay` while widget is active (false when overlay depends on something else, e.g. selection) */
  protected showOverlayOnActive: boolean = true;
  /** Stage cursor while widget is active */
  protected cursor: string = 'default';

  constructor(
    protected drawer: Drawer,
    id: AvailableTools,
    title: string,
    $icon: SVGElement | string,
    shortcut?: string
  ) {
    this.id = id;
    this.options = getWidgetOptions(drawer.options.widgets, id);
    this.$container = document.createElement('div');
    this.$container.classList.add(
      `drawer-tool-container`,
      `drawer-tool-button-container`,
      `drawer-internal-widgetId--${id.replace(/\W/g, '-')}`
    );
    this.$button = createButton('drawer-button');
    setLabel(this.$button, this.options.title ?? title ?? id);
    setPressed(this.$button, false);
    this.$icon = typeof $icon === 'string' ? stringToNode<SVGElement>($icon) : $icon;
    // compared to lower case key (caps lock), false disables shortcut
    this.shortcut = this.options.shortcut === false ? undefined : (this.options.shortcut ?? shortcut)?.toLowerCase();
    if (this.shortcut) this.$button.setAttribute('aria-keyshortcuts', this.shortcut.toUpperCase());

    this._initEvents();
  }

  /**
   * Adds this to `parent`.
   * Returns the element that was just added to `parent`.
   * @internal
   */
  addTo(parent: HTMLElement) {
    this.$container.appendChild(this.$button);

    this.$button.append(this.$icon);
    if (this.shortcut) {
      const $shortcut = document.createElement('div');
      $shortcut.classList.add('tool-key-shortcut');
      // announced with aria-keyshortcuts
      $shortcut.setAttribute('aria-hidden', 'true');
      $shortcut.textContent = this.shortcut;
      this.$button.append($shortcut);
    }
    parent.appendChild(this.$container);
  }

  /**
   * Disable / enable widget, a disabled widget can not be activated
   */
  toggleDisable() {
    this.setDisabled(!this.disabled);
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;

    if (disabled) {
      disableElement(this.$button);
    } else {
      enableElement(this.$button);
    }
  }

  get isDisabled() {
    return this.disabled;
  }

  /**
   * Listen stage events while widget is active.
   * Events are namespaced with widget id, so they are removed on deactivation without removing other listeners.
   * @param events Space separated event names
   * @param handler
   */
  protected onStage(events: string, handler: KonvaEventListener<Stage, any>) {
    const namespaced = events
      .split(' ')
      .map((event) => `${event}.${this.id}`)
      .join(' ');

    this.drawer.stage.on(namespaced, handler);
  }

  /**
   * Add widget events (with `onStage`), called on activation
   */
  protected initEvents(): void {}

  /**
   * Remove widget events, called on deactivation
   */
  protected removeEvents(): void {
    this.drawer.stage.off(`.${this.id}`);
  }

  /**
   * Called on activation, after events, cursor and overlay setup
   */
  protected onActive(): void {}

  /**
   * Called on deactivation, after events removal and overlay hidden
   */
  protected onDesactive(): void {}

  /**
   * Shift pressed or released during a pointer action (square, circle, straight line...), without pointer move
   * @param constrain Shift pressed
   */
  protected onConstrainChange?(constrain: boolean): void;

  public updateCursor(): void {
    this.drawer.$stageContainer.style.cursor = this.cursor;
  }

  /**
   * Pointer action starts (pointer down): shortcuts are disabled and UI (toolbar, overlays...) ignores pointer
   */
  protected startAction() {
    this.inAction = true;
    this.drawer.UIPointerEvents('none');
  }

  /**
   * Pointer action ends (pointer up)
   */
  protected endAction() {
    this.inAction = false;
    this.drawer.UIPointerEvents('all');
    this.drawer._onActionEnd();
  }

  /**
   * Shapes being drawn shown to collaborators while drawing (final state is sent on change)
   */
  protected shareLive(...shapes: Shape<ShapeConfig>[]) {
    this.drawer.collaboration?.sendLive(shapes);
  }

  /**
   * Unselect shapes, with selection widget (implemented by it)
   */
  clearSelection() {
    this.drawer.getWidget<SelectWidget>('selection')?.clearSelection();
  }

  private _initEvents() {
    this.$button.addEventListener('click', () => {
      this.setActive(true);
    });

    const onShift = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && this.inAction && this.drawer.activeWidget === this) {
        this.onConstrainChange?.(e.type === 'keydown');
      }
    };

    this.drawer.$drawerContainer.addEventListener('keydown', onShift);
    this.drawer.$drawerContainer.addEventListener('keyup', onShift);
  }

  setActive(active: boolean) {
    if (active) {
      if (this.disabled) return;

      if (this.drawer.activeWidget) {
        this.drawer.activeWidget.setActive(false);
      }
      this.drawer.toolbar.setActiveWidget(this);
      setPressed(this.$button, true);
      this.initEvents();
      this.updateCursor();
      if (this.showOverlayOnActive) this.overlay?.show();
      this.onActive();
      this.drawer.focus();
    } else {
      // pointer action stopped by tool change: shortcuts and UI usable again
      if (this.inAction) this.endAction();
      this.removeEvents();
      if (this.showOverlayOnActive) this.overlay?.hide();
      this.onDesactive();
      setPressed(this.$button, false);
    }
  }
}
