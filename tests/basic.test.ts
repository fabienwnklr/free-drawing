import { describe, expect, it, beforeAll } from 'vitest';
import { Drawer } from '../src/Drawer';
import { Toolbar } from '../src/components/toolbar/Toolbar';

beforeAll(() => {
  function noOp () { }

if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: noOp})
}
});

describe('Basic integration', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Basic init', () => {
    const drawer = new Drawer(document.getElementById('test') as HTMLDivElement);

    expect(drawer).instanceOf(Drawer);
    expect(drawer.toolbar).instanceOf(Toolbar);
    expect(drawer.toolbar.$toolbarContainer).instanceOf(HTMLDivElement);
    expect(drawer.toolbar.widgets.size).eq(4);
    expect(drawer.toolbar.activeWidget).not.toBe(null);
    expect(drawer.toolbar.activeWidget.id).eq('brush');
    expect(drawer.toolbar.activeWidget.$button.classList.contains('active')).eq(true);
  });
});
