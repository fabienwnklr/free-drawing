export function disableElement($el: HTMLElement) {
  $el.setAttribute('aria-disabled', 'true');
  $el.classList.add('disabled');

  if ($el instanceof HTMLButtonElement) {
    $el.disabled = true;
  }
}

export function enableElement($el: HTMLElement) {
  $el.removeAttribute('aria-disabled');
  $el.classList.remove('disabled');

  if ($el instanceof HTMLButtonElement) {
    $el.disabled = false;
  }
}

/**
 * Button with given classes, `type="button"`: default type `submit` would submit a form of the page
 */
export function createButton(...classNames: string[]) {
  const $btn = document.createElement('button');

  $btn.type = 'button';
  $btn.classList.add(...classNames);

  return $btn;
}

/**
 * On / off switch: checkbox announced as a switch (state read as on / off), keyboard (Space) and pointer as a checkbox
 */
export function createSwitch(checked = false) {
  const $switch = document.createElement('input');

  $switch.type = 'checkbox';
  $switch.setAttribute('role', 'switch');
  $switch.checked = checked;

  return $switch;
}

let lastId = 0;

/**
 * Unique element id, for aria references (aria-labelledby, aria-controls...)
 */
export function uniqueId(prefix: string) {
  return `drawer-${prefix}-${++lastId}`;
}

/**
 * Accessible name of an element (icon button...), also shown as tooltip
 */
export function setLabel($el: HTMLElement, label: string) {
  $el.setAttribute('aria-label', label);
  $el.title = label;
}

/**
 * Toggle button state: active class and aria-pressed (aria-checked for menu items)
 */
export function setPressed($el: HTMLElement, pressed: boolean) {
  const attr = $el.getAttribute('role') === 'menuitemcheckbox' ? 'aria-checked' : 'aria-pressed';

  $el.classList.toggle('active', pressed);
  $el.setAttribute(attr, String(pressed));
}

/**
 * Arrow keys move focus between items (last to first and back), Home / End to first / last item.
 * Handled keys are not propagated, so drawer shortcuts (e.g. arrows moving selection) are not triggered.
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

    if (index === -1 || ![prevKey, nextKey, 'Home', 'End'].includes(e.key)) return;

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
