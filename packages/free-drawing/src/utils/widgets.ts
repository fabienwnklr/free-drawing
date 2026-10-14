import type { AvailableTools, WidgetName, WidgetOptions, WidgetsOptions } from '@/@types/toolbar';
import { widgetNames } from '@/constants';

/**
 * Names of widgets option (list or object), in given order, unknown names are ignored
 * @param {WidgetsOptions} widgets
 */
export function getWidgetNames(widgets: WidgetsOptions): WidgetName[] {
  const names = Array.isArray(widgets) ? widgets : (Object.keys(widgets) as WidgetName[]);

  return names.filter((name) => {
    const known = widgetNames.includes(name);
    if (!known) console.warn(`[free-drawing] unknown widget "${name}" ignored`);
    return known;
  });
}

/**
 * Options of a widget from widgets option (empty with list form)
 * @param {WidgetsOptions} widgets
 * @param {AvailableTools} id
 */
export function getWidgetOptions<T extends WidgetOptions = WidgetOptions>(widgets: WidgetsOptions, id: AvailableTools): T {
  if (Array.isArray(widgets)) return {} as T;

  return (widgets[id as WidgetName] ?? {}) as T;
}
