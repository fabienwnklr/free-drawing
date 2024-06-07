import { describe, expect, it, beforeAll } from 'vitest';
import { Drawer } from '../src/Drawer';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

describe('Use drawer api', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('setBgColor', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);

    expect(drawer.background.fill()).toBe('#fff');

    drawer.setBgColor('#3ee551');

    expect(drawer.background.fill()).toBe('#3ee551');
  });

  it('setColor', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);

    expect(drawer.options.strokeColor).toBe(drawer.options.strokeColor);

    drawer.setStrokeColor('#2f9e44');

    expect(drawer.options.strokeColor).toBe('#2f9e44');

    // TODO: Write test button color width data-stroke-color=#2f9e44 on brush overlay is active
    // (same for width style and opacity)
  });


});
