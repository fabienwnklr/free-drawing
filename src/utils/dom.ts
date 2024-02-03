export function disableElement($el: HTMLElement) {
    $el.ariaDisabled = 'true';
    $el.classList.add('disabled');

    if ($el instanceof HTMLButtonElement) {
        $el.disabled = true;
    }
}

export function enableElement($el: HTMLElement) {
    $el.removeAttribute('aria-disabled')
    $el.classList.remove('disabled');

    if ($el instanceof HTMLButtonElement) {
        $el.disabled = false;
    }
}
