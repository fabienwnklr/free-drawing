import type {
  AvailableTools,
  ToolbarWidgetName,
  WidgetGroupOptions,
  WidgetOptions,
  WidgetsOptions,
} from '@/@types/toolbar';
import { extraTools, widgetNames } from '@/constants';

/**
 * Names of widgets option (list or object), in given order, unknown names are ignored
 * @param widgets `widgets` option: list of names, or options by name
 * @param known Names of existing widgets: of the library, and of plugins
 * @returns known widget names (a warning for each unknown one)
 */
export function getWidgetNames(
  widgets: WidgetsOptions,
  known: readonly ToolbarWidgetName[] = widgetNames
): ToolbarWidgetName[] {
  const names = Array.isArray(widgets) ? widgets : (Object.keys(widgets) as ToolbarWidgetName[]);

  return names.filter((name) => {
    const exists = known.includes(name);
    const plugin = extraTools[name];

    if (!exists && plugin) {
      console.warn(`[free-drawing] tool "${name}" is in @fabwcie/free-drawing-extra-tools: add ${plugin} to plugins`);
    } else if (!exists) {
      console.warn(`[free-drawing] unknown widget "${name}" ignored`);
    }
    return exists;
  });
}

/**
 * Groups of widgets option with widgets of toolbar only (a widget in one group), groups without widgets ignored
 * @param groups `widgetGroups` option
 * @param names Widgets of toolbar
 * @returns copies of the groups with their valid widgets (a widget only in its first group)
 */
export function getWidgetGroups(groups: WidgetGroupOptions[], names: ToolbarWidgetName[]): WidgetGroupOptions[] {
  const grouped = new Set<ToolbarWidgetName>();

  return groups
    .map((group) => ({
      ...group,
      widgets: (group.widgets ?? []).filter((name) => {
        if (!names.includes(name) || grouped.has(name)) return false;
        grouped.add(name);
        return true;
      }),
    }))
    .filter((group) => group.widgets.length > 0);
}

/**
 * Options of a widget from widgets option (empty with list form)
 * @param widgets `widgets` option: list of names, or options by name
 * @param id name of the widget
 * @returns options given for the widget, empty object when none
 */
export function getWidgetOptions<T extends WidgetOptions = WidgetOptions>(
  widgets: WidgetsOptions,
  id: AvailableTools
): T {
  if (Array.isArray(widgets)) return {} as T;

  return (widgets[id as ToolbarWidgetName] ?? {}) as T;
}
