import { describe, expect, it, vi } from 'vitest';
import type { Drawer } from '@/Drawer';
import { DrawerError, getErrorText } from '@/utils/errors';
import { createDrawer } from './helpers';

const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

/** Texts of the toasts shown */
const toasts = (drawer: Drawer) =>
  [...drawer.$drawerContainer.querySelectorAll('.drawer-toast')].map(($toast) => $toast.textContent?.trim());

describe('Errors shown in the language of the drawer', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  it('Errors of the library and known errors of the browser translated, other messages kept', () => {
    const { t } = createDrawer({ language: 'fr' }).i18n;

    expect(getErrorText(new DrawerError('error.nothingToExport', 'nothing to export'), t)).toBe('rien à exporter');
    expect(getErrorText(new DOMException('quota exceeded', 'QuotaExceededError'), t)).toBe(
      'stockage du navigateur plein'
    );
    expect(getErrorText(new DOMException('Write permission denied.', 'NotAllowedError'), t)).toBe(
      'autorisation refusée par le navigateur'
    );
    // server, app: already in the language of the user
    expect(getErrorText(new Error('Trop de dessins'), t)).toBe('Trop de dessins');
    expect(getErrorText('offline', t)).toBe('offline');
  });

  it('Damaged link, invalid file, full storage: details in the language of the drawer', async () => {
    window.location.hash = '#drawing=z%%%';
    const drawer = createDrawer({ language: 'fr' });

    await wait();
    expect(toasts(drawer)).toContain('Lien de dessin invalide : lien incomplet ou abîmé');

    // file: invalid JSON or not a drawing, message in English for developers
    expect(() => drawer.loadDrawing('not json')).toThrow(DrawerError);
    expect(() => drawer.loadDrawing('{}')).toThrow('not a drawing file');

    // browser storage full
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
      if (!key.endsWith('-tool')) throw new DOMException('quota exceeded', 'QuotaExceededError');
    });

    try {
      await drawer.save();
      expect(toasts(drawer)).toContain("Le dessin n'a pas pu être enregistré : stockage du navigateur plein");
    } finally {
      setItem.mockRestore();
    }
  });
});
