import { describe, expect, it, vi, afterEach } from 'vitest';
import { I18n, getLanguage, languages } from '@/i18n/I18n';
import { en } from '@/i18n/en';
import type { BaseWidget } from '@/components/toolbar/widgets/BaseWidget';
import { createDrawer, keydown } from './helpers';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();

describe('Languages', () => {
  document.body.innerHTML = `<div id="test"></div>`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Every language translates every text, with same placeholders', () => {
    Object.values(languages).forEach(({ translations }) => {
      expect(Object.keys(translations).sort()).toEqual(Object.keys(en).sort());
      Object.entries(en).forEach(([key, text]) => {
        const translation = translations[key as keyof typeof en];

        expect(translation, key).not.toBe('');
        expect(placeholders(translation), key).toEqual(placeholders(text));
      });
    });
  });

  it('Language of browser locale, English when not supported', () => {
    expect(getLanguage('fr-FR')).toBe('fr');
    expect(getLanguage('de')).toBe('de');
    expect(getLanguage('ES-mx')).toBe('es');
    expect(getLanguage('pt-BR')).toBe('en');
    expect(getLanguage(undefined)).toBe('en');
  });

  it('Texts with placeholders, custom texts replace default ones', () => {
    const i18n = new I18n('fr', { fr: { 'menu.open': 'Ouvrir un dessin' } });

    expect(i18n.t('zoom.reset', { percentage: '50 %' })).toBe('Réinitialiser le zoom (50 %)');
    expect(i18n.t('menu.open')).toBe('Ouvrir un dessin');
    // unknown placeholder kept
    expect(i18n.t('layers.hide')).toBe('Masquer {name}');

    const update = vi.fn((t) => t('menu.open'));

    i18n.translate(update);
    i18n.setLanguage('en');
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveLastReturnedWith('Open');
  });

  it('Language option translates interface', () => {
    const drawer = createDrawer({ language: 'fr' });

    expect(drawer.language).toBe('fr');
    expect(drawer.$drawerContainer.lang).toBe('fr');
    expect(drawer.$drawerContainer.getAttribute('aria-label')).toBe('Planche à dessin');
    expect(drawer.setting.$openButton.textContent).toContain('Ouvrir');
    expect(drawer.setting.$button.getAttribute('aria-label')).toBe('Menu');
    expect(drawer.getWidget<BaseWidget>('brush')!.$button.getAttribute('aria-label')).toBe('Pinceau');
    expect(drawer.undoRedo.$btnUndo.getAttribute('aria-label')).toBe('Annuler');
    expect(drawer.undoRedo.$btnUndo.title).toBe('Annuler (Ctrl+Z)');
    expect(drawer.help.$modalBody.textContent).toContain('Raccourcis clavier');
    expect(drawer.t('shapes.rect')).toBe('Rectangle');
  });

  it('Browser language by default', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES');
    const drawer = createDrawer();

    expect(drawer.languageChoice).toBe('auto');
    expect(drawer.language).toBe('es');
    expect(drawer.setting.$languageSelect.value).toBe('auto');
    expect(drawer.setting.$languageSelect.options[0].text).toBe('Automático (navegador)');
  });

  it('Language chosen in menu translates every text at once, choice saved', () => {
    const drawer = createDrawer({ language: 'en' });
    const onLanguage = vi.fn();
    const $select = drawer.setting.$languageSelect;

    drawer.on('language.change', onLanguage);
    expect([...$select.options].map(($option) => $option.value)).toEqual(['auto', 'en', 'fr', 'es', 'de']);
    // names in their language
    expect([...$select.options].map(($option) => $option.text).slice(1)).toEqual([
      'English',
      'Français',
      'Español',
      'Deutsch',
    ]);

    $select.value = 'de';
    $select.dispatchEvent(new Event('change'));

    expect(onLanguage).toHaveBeenCalledWith('de');
    expect(drawer.$drawerContainer.lang).toBe('de');
    expect(drawer.setting.$clearCanvasButton.textContent).toContain('Zeichnung löschen');
    expect(drawer.getWidget<BaseWidget>('selection')!.$button.title).toBe('Auswählen');
    expect(drawer.zoom!.$btnReset.title).toMatch(/^Zoom zurücksetzen/);
    expect(drawer.help.$modal.querySelector('.drawer-modal-title')!.textContent).toBe('Hilfe');
    // tools list of help uses translated titles
    expect(drawer.help.$modalBody.querySelector('[data-help-tools]')!.textContent).toContain('Auswählen');
    expect(JSON.parse(localStorage.getItem(`${drawer.options.localStorageKey}-preferences`)!).language).toBe('de');

    // saved choice used instead of option
    const reloaded = createDrawer({ localStorageKey: drawer.options.localStorageKey, language: 'fr' });

    expect(reloaded.language).toBe('de');
    expect(reloaded.setting.$languageSelect.value).toBe('de');

    // set by api: select follows
    drawer.setLanguage('es');
    expect($select.value).toBe('es');
    expect(drawer.setting.$openButton.textContent).toContain('Abrir');
  });

  it('Keys typed in language select are not drawer shortcuts', () => {
    const drawer = createDrawer();
    const $select = drawer.setting.$languageSelect;
    const tool = drawer.activeTool;

    drawer.setting.show();
    $select.dispatchEvent(
      new KeyboardEvent('keydown', { key: drawer.getWidget<BaseWidget>('eraser')!.shortcut, bubbles: true })
    );
    expect(drawer.activeTool).toBe(tool);

    // Escape closes menu
    $select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(drawer.setting.isShown()).toBe(false);
    // same key out of select is a shortcut
    keydown(drawer, { key: drawer.getWidget<BaseWidget>('eraser')!.shortcut });
    expect(drawer.activeTool).toBe('eraser');
  });

  it('Custom translations option replaces texts', () => {
    const drawer = createDrawer({ language: 'fr', translations: { fr: { 'menu.open': 'Ouvrir un dessin' } } });

    expect(drawer.setting.$openButton.textContent).toContain('Ouvrir un dessin');
  });
});
