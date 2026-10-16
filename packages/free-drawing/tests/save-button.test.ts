import { describe, expect, it } from 'vitest';
import { Rect } from 'konva/lib/shapes/Rect';
import { createDrawer } from './helpers';

const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('Save button', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Shown in header while auto save is off, dot and name tell unsaved changes, saves on click', async () => {
    const drawer = createDrawer({ autoSave: true, language: 'en' });
    const { $container, $button } = drawer.saveButton!;

    expect(drawer.layout.$header.contains($container)).toBe(true);
    // after view position
    expect($container.previousElementSibling).toBe(drawer.position!.$positionContainer);
    expect($container.hidden).toBe(true);

    drawer.setAutoSave(false);
    await tick();
    expect($container.hidden).toBe(false);
    expect($button.getAttribute('aria-label')).toBe('Save now');
    expect($button.classList.contains('is-unsaved')).toBe(false);

    drawer.addShape(new Rect({ width: 10, height: 10 }));
    drawer.stage.fire('change');
    expect(drawer.hasUnsavedChanges()).toBe(true);
    expect($button.classList.contains('is-unsaved')).toBe(true);
    expect($button.getAttribute('aria-label')).toBe('Save now (Not saved)');

    $button.click();
    await tick();
    expect(drawer.hasUnsavedChanges()).toBe(false);
    expect($button.classList.contains('is-unsaved')).toBe(false);

    drawer.setAutoSave(true);
    await tick();
    expect($container.hidden).toBe(true);
  });

  it('Not created with saveButton option false', () => {
    const drawer = createDrawer({ saveButton: false });

    expect(drawer.saveButton).toBeUndefined();
    expect(drawer.layout.$header.querySelector('.drawer-save-button-container')).toBeNull();
  });
});
