import { test, expect, describe } from 'vitest';
import { deepMerge, isObject, isTruthy, stringToNode } from '@/utils/functions';
import MicroEvent from '@/utils/MicroEvent';

describe('utilities', () => {
  test('Convert string to HTML element', () => {
    expect(stringToNode('<div></div>')).toBeInstanceOf(HTMLDivElement);
    expect(stringToNode('<canvas></canvas>')).toBeInstanceOf(HTMLCanvasElement);
    expect(stringToNode('<span></span>')).toBeInstanceOf(HTMLSpanElement);
  });

  test('merge objects refuse falsy value', () => {
    const target = { test: 'test' };
    const source = { test: '' };

    const final = deepMerge(target, source);

    expect(final.test).eq('test');
  });

  test('isObject', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject('')).toBe(false);
    expect(isObject(() => {})).toBe(false);
    expect(isObject({ prop: 'value'})).toBe(true);
  })

  test('isTruthy', () => {
    expect(isTruthy(null)).toBe(false);
    expect(isTruthy('')).toBe(false);
    expect(isTruthy(undefined)).toBe(false);
    expect(isTruthy(false)).toBe(true);
    expect(isTruthy(0)).toBe(true);
    expect(isTruthy(() => {})).toBe(true);
    expect(isTruthy({ prop: 'value'})).toBe(true);
  })

  test('MicroEvent off with unknown handler keeps other handlers', () => {
    const emitter = new MicroEvent();
    const calls: string[] = [];
    emitter.on('foo', () => calls.push('a'));

    emitter.off('foo', () => {});
    emitter.trigger('foo');

    expect(calls).toEqual(['a']);
  });
});
