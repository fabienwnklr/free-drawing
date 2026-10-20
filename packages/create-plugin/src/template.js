// @ts-check
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageFiles, readme } from './generate.js';

/**
 * @typedef {import('./questions.js').Answers} Answers
 * @typedef {import('./generate.js').Files} Files
 */

/** Folder of this file */
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Folder of the complete template: copied in the published package (`prepack`), else the one of the repository
 * @returns {string} folder holding `src` and `tests` of the template
 */
export function findTemplate() {
  const folder = [join(here, '../template'), join(here, '../../plugin-template')].find((dir) =>
    existsSync(join(dir, 'src'))
  );

  if (!folder) throw new Error('Template of plugin not found');

  return folder;
}

/**
 * Files of a folder and of its sub folders
 * @param {string} dir folder
 * @param {string} [prefix] path of the folder in the result
 * @returns {string[]} paths relative to the first folder (`/` separators)
 */
function listFiles(dir, prefix = '') {
  return readdirSync(dir).flatMap((name) =>
    statSync(join(dir, name)).isDirectory() ? listFiles(join(dir, name), `${prefix}${name}/`) : [`${prefix}${name}`]
  );
}

/**
 * Names of the template replaced by the ones of the plugin: package, classes, `pluginName`, options type, text keys
 * (tools and shapes of the example keep their names: stamps, zones)
 * @param {string} text content or path of a file of the template
 * @param {Answers} answers answers
 * @returns {string} renamed text
 */
export function renameTemplate(text, { names: { pascal, camel }, packageName }) {
  return text
    .replaceAll('@free-drawing/plugin-template', packageName)
    .replace(/StampCounterPlugin/g, `${pascal}CounterPlugin`)
    .replace(/'StampCounter'/g, `'${pascal}Counter'`)
    .replace(/StampsPlugin/g, `${pascal}Plugin`)
    .replace(/StampsOptions/g, `${pascal}Options`)
    .replace(/\bStamps\b/g, pascal)
    .replace(/(['"`])stamps\./g, `$1${camel}.`);
}

/**
 * Extension `.js` added to relative imports (ES modules of apps need it, TypeScript resolves it to the `.ts` file),
 * `/index.js` for a folder
 * @param {string} text source of a file of the template
 * @param {string} folder folder of the file in the template
 * @returns {string} source with complete relative imports
 */
export function addExtensions(text, folder) {
  return text.replace(/(from\s+|import\s+)(['"])(\.{1,2}\/[^'"]*)\2/g, (match, keyword, q, path) => {
    if (/\.(js|ts|css|json)$/.test(path)) return match;

    const target = resolve(folder, path);
    const complete = existsSync(target) && statSync(target).isDirectory() ? `${path}/index.js` : `${path}.js`;

    return `${keyword}${q}${complete}${q}`;
  });
}

/**
 * Files of a plugin from the complete template: its sources and tests renamed, package files of the answers
 * @param {Answers} answers answers
 * @param {string} [template] folder of the template
 * @returns {Files} files of the package
 */
export function generateFromTemplate(answers, template = findTemplate()) {
  const files = packageFiles(answers);
  const { names, packageName } = answers;

  for (const path of [...listFiles(join(template, 'src'), 'src/'), ...listFiles(join(template, 'tests'), 'tests/')]) {
    const source = join(template, ...path.split('/'));
    let text = readFileSync(source, 'utf8').replace(/\r\n/g, '\n');

    if (path.endsWith('.ts')) text = addExtensions(text, dirname(source));
    // styles imported by the app, not by the code (any bundler)
    text = text.replace(/^import '\.\/style\.css';\n/m, `// styles: the app imports '${packageName}/style.css'\n`);
    files.set(
      renameTemplate(path, answers).replace(/^tests\/stamps\.test\.ts$/, `tests/${names.kebab}.test.ts`),
      renameTemplate(text, answers)
    );
  }
  files.set(
    'README.md',
    readme(answers, [
      '## Parts',
      '',
      '- Tool `stamp` (P): a press adds a stamp under the pointer, it follows the pointer until released, Shift keeps it on an axis.',
      '- Tool `zone` (Z): dashed rounded rectangles drawn in the dragged box.',
      `- Commands: stamp in the middle (Alt+P), select all stamps, remove selected stamps, count stamps.`,
      `- Options (\`pluginOptions.${names.pascal}\`): \`symbols\`, \`colors\`, \`size\`, \`max\` (limit disabling the plugin).`,
      `- ${names.pascal}CounterPlugin: button of the header with the number of stamps, requires ${names.pascal}Plugin.`,
      '',
      'Started from the complete template: rename the tools, texts and shapes of the example (stamps, zones) for your plugin.',
    ])
  );

  return files;
}
