/**
 * Function returned by `throttle`: same parameters and result as the throttled function
 * @template T throttled function
 */
export declare type ThrottledFunction<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T>;

/**
 * Function calling `callback` once calls stop for `delay` ms: each call within the delay restarts the timer
 *
 * @template T debounced function
 * @param callback function to call, with the arguments of the last call
 * @param delay time without call before calling `callback` (ms)
 * @returns debounced function
 *
 * @example
 * // Define the function that updates the layout
 * function updateLayout() {
 * // Update the layout...
 * }
 * // Create a debounced version of the function
 * const debouncedUpdateLayout = debounce(updateLayout, 250);
 *
 * // Listen for window resize events and call the debounced function
 * window.addEventListener("resize", debouncedUpdateLayout);
 */
export function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => callback(...args), delay);
  };
}

/**
 * Function calling `func` at most once every `limit` ms, for events fired very often (scroll, resize, mouse move...):
 * calls in between are ignored and return the last result
 *
 * @template T throttled function
 * @param func function to call
 * @param limit time before `func` can be called again (ms)
 * @returns throttled function
 *
 * @example
 * // Define the function that updates the layout
 * function updateLayout() {
 *   // Update the layout...
 * }
 *
 * // Create a throttled version of the function
 * const throttledUpdateLayout = throttle(updateLayout, 250);
 *
 * // Listen for window scroll events and call the throttled function
 * window.addEventListener("scroll", throttledUpdateLayout);
 */
export function throttle<T extends (...args: any) => any>(func: T, limit: number = 100): ThrottledFunction<T> {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true;

      setTimeout(() => (inThrottle = false), limit);

      lastResult = func.apply(this, args);
    }

    return lastResult;
  };
}

/**
 * Measure time executing function, logged in console
 * @template T measured function
 * @param func function called without arguments
 * @param label label of the time in console
 */
export function measureTime<T extends (...args: any[]) => any>(func: T, label: string) {
  if (typeof func !== 'function') {
    console.error(`func must be a valid function, ${typeof func} provided`);
    return;
  }
  console.time(label);
  func();
  console.timeEnd(label);
}
