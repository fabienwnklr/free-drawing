/**
 * Check if an item is an object: arrays and functions are not, dates and class instances are
 * @param item - The item that needs to be checked
 * @returns Whether or not `item` is an object
 */
export function isObject(item: any): boolean {
  return item === Object(item) && !Array.isArray(item) && typeof item !== 'function';
}

/**
 * Check if an item is set: not undefined, null or empty string (false and 0 are)
 * @param t - The item that needs to be checked
 * @returns Whether or not `t` is set
 */
export function isTruthy(t: any): boolean {
  return typeof t !== 'undefined' && t !== '' && t !== null;
}

/**
 * Merge deeply 2 object with check of validity
 * @param target default values (e.g. `defaultOptions`), not modified
 * @param source given values: replace those of `target`, except undefined, null and empty string; arrays replaced,
 * objects merged into objects
 * @returns Merged object
 */
export function deepMerge<T extends object>(target: T, source: Partial<T> | T): T {
  if (!source) return target;
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      // merged into default object, else kept as given (e.g. object replacing false or null, class instance)
      if (isObject(source[key as keyof T]) && isObject(target[key as keyof T])) {
        output[key as keyof object] = deepMerge(target[key as keyof object], source[key as keyof object]);
      } else if (isTruthy(source[key as keyof T])) {
        Object.assign(output, { [key]: source[key as keyof T] });
      }
    });
  }
  return output;
}

/**
 * Unique id of a drawing shape (collaboration), `crypto.randomUUID` needs a secure context (https)
 * @returns id of time and random characters (base 36)
 */
export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Element created from HTML code (its first element)
 * @template T type of the element
 * @param string HTML code of one element
 * @returns first element of the code, not added to the page (null without element)
 */
export function stringToNode<T>(string: string): T {
  const placeholder = document.createElement('div');
  placeholder.innerHTML = string;
  return placeholder.firstElementChild as T;
}
