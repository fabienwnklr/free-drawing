// @ts-check
// TypeDoc plugin of the API pages: a module named like its folder (`components/Collaboration/Collaboration`) takes
// the name of the folder (`components/Collaboration`), so its page is not one level deeper than needed
import { Converter, ReflectionKind } from 'typedoc';

/**
 * Rename modules ending with the name of their folder
 * @param {import('typedoc').Application} app TypeDoc application
 */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context) => {
    for (const module of context.project.getReflectionsByKind(ReflectionKind.Module)) {
      const parts = module.name.split('/');

      if (parts.length > 1 && parts.at(-1) === parts.at(-2)) module.name = parts.slice(0, -1).join('/');
    }
  });
}
