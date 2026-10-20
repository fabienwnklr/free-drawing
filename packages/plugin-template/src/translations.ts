import type { PluginTranslations } from '@fabwcie/free-drawing';

/**
 * Texts of the plugins, by language. Keys are prefixed with the plugin (`stamps.*`) not to meet the keys of other
 * plugins, `tools.<id>` gives the title of a tool. Missing languages use English, the `translations` drawer option of
 * the app can replace any of these texts.
 */
export const translations: PluginTranslations = {
  en: {
    'tools.stamp': 'Stamp',
    'tools.zone': 'Zone',
    'stamps.center': 'Stamp in the middle',
    'stamps.selectAll': 'Select all stamps',
    'stamps.removeSelected': 'Remove selected stamps',
    'stamps.count': 'Count stamps',
    'stamps.counted': '{count} stamps in the drawing',
    'stamps.limit': 'Limit of {max} stamps reached: remove some to stamp again',
    'stamps.counter': 'Stamps: {count}',
  },
  fr: {
    'tools.stamp': 'Tampon',
    'tools.zone': 'Zone',
    'stamps.center': 'Tamponner au milieu',
    'stamps.selectAll': 'Sélectionner tous les tampons',
    'stamps.removeSelected': 'Retirer les tampons sélectionnés',
    'stamps.count': 'Compter les tampons',
    'stamps.counted': '{count} tampons dans le dessin',
    'stamps.limit': 'Limite de {max} tampons atteinte : retirez-en pour tamponner à nouveau',
    'stamps.counter': 'Tampons : {count}',
  },
  es: {
    'tools.stamp': 'Sello',
    'tools.zone': 'Zona',
    'stamps.center': 'Sellar en el centro',
    'stamps.selectAll': 'Seleccionar todos los sellos',
    'stamps.removeSelected': 'Quitar los sellos seleccionados',
    'stamps.count': 'Contar los sellos',
    'stamps.counted': '{count} sellos en el dibujo',
    'stamps.limit': 'Límite de {max} sellos alcanzado: quite algunos para sellar de nuevo',
    'stamps.counter': 'Sellos: {count}',
  },
  de: {
    'tools.stamp': 'Stempel',
    'tools.zone': 'Bereich',
    'stamps.center': 'In der Mitte stempeln',
    'stamps.selectAll': 'Alle Stempel auswählen',
    'stamps.removeSelected': 'Ausgewählte Stempel entfernen',
    'stamps.count': 'Stempel zählen',
    'stamps.counted': '{count} Stempel in der Zeichnung',
    'stamps.limit': 'Grenze von {max} Stempeln erreicht: entfernen Sie einige, um wieder zu stempeln',
    'stamps.counter': 'Stempel: {count}',
  },
};
