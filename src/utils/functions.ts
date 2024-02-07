/**
 * @description Method to check if an item is an object. Date and Function are considered
 * an object, so if you need to exclude those, please update the method accordingly.
 * @param item - The item that needs to be checked
 * @return {Boolean} Whether or not @item is an object
 */
export function isObject(item: any): boolean {
  return item === Object(item) && !Array.isArray(item) && typeof item !== 'function';
}

/**
 * @description Method to check if an item is truthy
 * @param {any} t - The item that needs to be checked
 * @return {Boolean} Whether or not @item is truthy
 */
export function isTruthy(t: any): boolean {
  return typeof t !== 'undefined' && t !== '' && t !== null;
}

/**
 * Merge deeply 2 object with check of validity
 * @param target
 * @param source
 * @returns {Object} Merged object
 */
export function deepMerge<T extends object>(target: T, source: Partial<T> | T): T {
  if (!source) return target;
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key as keyof T])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof T] });
        } else {
          output[key as keyof object] = deepMerge(target[key as keyof object], source[key as keyof object]);
        }
      } else if (isTruthy(source[key as keyof T])) {
        Object.assign(output, { [key]: source[key as keyof T] });
      }
    });
  }
  return output;
}

export function stringToNode<T>(string: string): T {
  const placeholder = document.createElement('div');
  placeholder.innerHTML = string;
  return placeholder.firstElementChild as T;
}

/**
 * Convert simple array into two-dimensional array (matrix)
 *
 * @param list The array
 * @param width The num of elements per sub-array
 * @return the new matrix
 */
export function listToMatrix<T>(list: T[], width: number): T[][] {
  const matrix: T[][] = [];

  for (let i = 0, k = -1; i < list.length; i++) {
    if (i % width === 0) {
      k++;
      matrix[k] = [];
    }
    matrix[k].push(list[i]);
  }

  return matrix;
};

/**
 * Convert two-dimensional array (matrix) into simple array
 *
 * @param list The 2d array
 * @return the 1d array
 */
export function matrixToList(list: number[][]): number[] {
  const array: number[] = list.reduce((acc, value) => acc.concat(value), []);
  
  return array;
};
