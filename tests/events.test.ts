import { describe, expect, it, beforeAll } from 'vitest';
import { Drawer } from '../src/Drawer';
import { SelectWidget } from '../src/components/toolbar/widgets/Select/Select';

beforeAll(() => {
  function noOp() {}

  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
  }
});

describe('Test drawer event', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Ctrl + A', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);
    const selectWidget = drawer.getWidget<SelectWidget>('selection');

    expect(selectWidget?.transformer.nodes().length).eq(0);

    drawer.$drawerContainer.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', ctrlKey: true }))

    expect(drawer.background.fill()).toBe('#3ee551');
  });

});
