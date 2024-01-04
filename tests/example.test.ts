import { describe, expect, it } from 'vitest';

describe('Example', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Simple test', () => {
    expect(document.querySelector('#test')).toBeInstanceOf(HTMLDivElement);
  });
});
