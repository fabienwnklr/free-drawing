/** Time a message stays in its live region (ms): read once, the same message is read again later */
const messageLifetime = 7000;

/**
 * Live region read by screen readers (messages of toasts), kept in the page: a region added with its text is not always
 * announced. One in the drawer, one in each dialog (out of an `aria-modal` dialog shown, nothing is read)
 * @returns Visually hidden element holding a polite region (`status`) and an urgent one (`alert`)
 */
export function createLiveRegion(): HTMLDivElement {
  const $region = document.createElement('div');

  $region.className = 'drawer-live-region';
  for (const role of ['status', 'alert']) {
    const $part = document.createElement('div');

    $part.setAttribute('role', role);
    $region.append($part);
  }

  return $region;
}

/**
 * Message read by screen readers: added to a live region (see `createLiveRegion`), removed after a while
 * @param $region Live region (of the drawer or of the dialog shown)
 * @param message Text read
 * @param urgent Read at once (problems), else when the user is idle
 */
export function announce($region: HTMLElement, message: string, urgent: boolean) {
  const $message = document.createElement('div');

  $message.textContent = message;
  $region.querySelector(`[role="${urgent ? 'alert' : 'status'}"]`)?.append($message);
  setTimeout(() => $message.remove(), messageLifetime);
}
