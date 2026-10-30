import type { Drawer } from '@/Drawer';

/**
 * Disable an element: `aria-disabled` and `disabled` class, `disabled` property of buttons. Focused (by its own
 * action: undo at the end of history, next slide at the last one...), the focus stays in the drawer: the browser would
 * give it to the page (not in a modal dialog: it keeps its focus)
 * @param $el button, menu item or other element to disable
 */
export function disableElement($el: HTMLElement) {
  const focused = $el.contains(document.activeElement);

  $el.setAttribute('aria-disabled', 'true');
  $el.classList.add('disabled');

  if ($el instanceof HTMLButtonElement) {
    $el.disabled = true;
  }
  if (focused && !$el.closest('[aria-modal="true"]')) {
    $el.closest<HTMLElement>('.drawer-container')?.focus({ preventScroll: true });
  }
}

/**
 * Element the focus can't stay on: removed, hidden (also by a parent, or by zen mode) or disabled
 * @param $el Element focused before a change (button hidden by its own action...)
 * @returns true when the focus has to go elsewhere
 */
export function isUnreachable($el: Element): boolean {
  return (
    !$el.isConnected ||
    !!$el.closest('[hidden]') ||
    ($el instanceof HTMLButtonElement && $el.disabled) ||
    // zen mode
    (!!$el.closest('.drawer-zen-hidden') && !!$el.closest('.is-zen'))
  );
}

/**
 * Enable an element disabled by `disableElement`
 * @param $el element to enable
 */
export function enableElement($el: HTMLElement) {
  $el.removeAttribute('aria-disabled');
  $el.classList.remove('disabled');

  if ($el instanceof HTMLButtonElement) {
    $el.disabled = false;
  }
}

/**
 * Button with given classes, `type="button"`: default type `submit` would submit a form of the page
 * @param classNames CSS classes of the button
 * @returns new button, not added to the page
 */
export function createButton(...classNames: string[]) {
  const $btn = document.createElement('button');

  $btn.type = 'button';
  $btn.classList.add(...classNames);

  return $btn;
}

/**
 * On / off switch: checkbox announced as a switch (state read as on / off), keyboard (Space) and pointer as a checkbox
 * @param checked initial state, on when true
 * @returns new checkbox with role `switch`, not added to the page
 */
export function createSwitch(checked = false) {
  const $switch = document.createElement('input');

  $switch.type = 'checkbox';
  $switch.setAttribute('role', 'switch');
  $switch.checked = checked;

  return $switch;
}

/** Number of the last id given by `uniqueId` */
let lastId = 0;

/**
 * Unique element id, for aria references (aria-labelledby, aria-controls...)
 * @param prefix kind of element, put in the id
 * @returns `drawer-<prefix>-<number>` id, unique in the page
 */
export function uniqueId(prefix: string) {
  return `drawer-${prefix}-${++lastId}`;
}

/**
 * Address of the page replaced (room joined, link opened or left), state of its history kept: the router of the host
 * app (React Router, Next.js...) keeps its own there
 * @param url New address of the page
 */
export function replaceUrl(url: string) {
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Accessible name of an element (icon button...), also shown as tooltip
 * @param $el element to name
 * @param label translated name, set as `aria-label` and `title`
 */
export function setLabel($el: HTMLElement, label: string) {
  $el.setAttribute('aria-label', label);
  $el.title = label;
}

/**
 * Toggle button state: active class and aria-pressed (aria-checked for menu items)
 * @param $el toggle button or `menuitemcheckbox` item
 * @param pressed true when on
 */
export function setPressed($el: HTMLElement, pressed: boolean) {
  const attr = $el.getAttribute('role') === 'menuitemcheckbox' ? 'aria-checked' : 'aria-pressed';

  $el.classList.toggle('active', pressed);
  $el.setAttribute(attr, String(pressed));
}

/**
 * Key pressed while a text is composed with an input method (Chinese, Japanese, Korean...): its Enter or Escape ends
 * the composition, it does not validate nor close the field (Safari ends it with a key of code 229, not composing)
 * @param e Key pressed in a field
 * @returns True when the key belongs to a composition
 */
export function isComposing(e: KeyboardEvent): boolean {
  return e.isComposing || e.keyCode === 229;
}

/** Space kept below an element fitted in the drawer (px), see `fitHeight` */
const bottomMargin = 12;

/**
 * Menu or panel shown below its button kept in the drawer and the window (small screens): its height is limited to the
 * space below it, the rest scrolls
 * @param $el Element shown (its top is read)
 */
export function fitHeight($el: HTMLElement) {
  const $drawer = $el.closest('.drawer-container');
  const bottom = Math.min($drawer?.getBoundingClientRect().bottom ?? Infinity, window.innerHeight);
  const space = bottom - $el.getBoundingClientRect().top - bottomMargin;

  // no layout (tests): no limit
  $el.style.maxHeight = space > 0 ? `${space}px` : '';
}

/**
 * Focus taken by an element out of the container (field of the page, another drawer), e.g. by the click hiding a
 * menu or a dialog: a component hidden then gives focus back to the drawer only without it
 * @param $container Container of the component (drawer)
 * @returns True when an element out of the container has focus (not the body: focus lost)
 */
export function hasFocusOutside($container: HTMLElement): boolean {
  const $active = document.activeElement;

  return !!$active && $active !== document.body && !$container.contains($active);
}

/**
 * Arrow keys move focus between items (last to first and back), Home / End to first / last item.
 * Handled keys and arrows of the other orientation are not propagated, so drawer shortcuts (e.g. arrows moving
 * selection) are not triggered from an item.
 * @param $container element listening to keydown of its items
 * @param getItems items in navigation order, read on each key (disabled buttons skipped)
 * @param orientation horizontal: left / right arrows, vertical: up / down arrows
 * @param onMove called with the newly focused item
 */
export function arrowNavigation(
  $container: HTMLElement,
  getItems: () => HTMLElement[],
  orientation: 'horizontal' | 'vertical',
  onMove?: ($item: HTMLElement) => void
) {
  const [prevKey, nextKey] = orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];

  $container.addEventListener('keydown', (e) => {
    // disabled buttons can not be focused
    const items = getItems().filter(($item) => !($item as HTMLButtonElement).disabled);
    const index = items.indexOf(e.target as HTMLElement);

    if (index === -1) return;
    if (![prevKey, nextKey, 'Home', 'End'].includes(e.key)) {
      // arrows of the other orientation: default kept, not a drawer shortcut either (moving selected shapes)
      if (e.key.startsWith('Arrow')) e.stopPropagation();
      return;
    }

    const last = items.length - 1;
    const targets: Record<string, number> = {
      [prevKey]: index === 0 ? last : index - 1,
      [nextKey]: index === last ? 0 : index + 1,
      Home: 0,
      End: last,
    };
    const $item = items[targets[e.key]];

    e.preventDefault();
    e.stopPropagation();
    $item.focus();
    onMove?.($item);
  });
}

/**
 * Element placed in view: absolute position in the drawer container (floating region) from view coordinates
 * @param drawer drawer holding the element
 * @param $el element of the floating region
 * @param left left of the element in view (px)
 * @param top top of the element in view (px)
 */
export function placeInView(drawer: Drawer, $el: HTMLElement, left: number, top: number) {
  const view = drawer.$stageContainer.getBoundingClientRect();
  const container = drawer.$drawerContainer.getBoundingClientRect();

  $el.style.left = `${left + view.left - container.left}px`;
  $el.style.top = `${top + view.top - container.top}px`;
}
