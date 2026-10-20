// @ts-check
import {
  checkCommandShortcut,
  checkName,
  checkPackageName,
  checkToolId,
  checkToolShortcut,
  formatShortcut,
  getNames,
  suggestCommandShortcut,
  suggestToolShortcut,
} from './names.js';

/**
 * @typedef {import('./names.js').Names} Names
 * @typedef {import('./prompts.js').Prompter} Prompter
 */

/**
 * @typedef {object} Answers What to generate
 * @property {Names} names names of the plugin
 * @property {string} packageName name of the npm package
 * @property {string} directory folder of the package
 * @property {'custom' | 'template'} start new plugin from the answers, or the complete template
 * @property {'click' | 'shape' | 'none'} tool tool of the toolbar: a click adds a shape, a shape drawn by dragging, none
 * @property {string} toolId id of the tool (camelCase)
 * @property {string} toolShortcut letter of the tool, empty for none
 * @property {boolean} command command of the palette (shortcut, help)
 * @property {string} commandShortcut shortcut of the command (`Alt+N`), empty for none
 * @property {boolean} contextMenu command also in the context menu of the drawing
 * @property {boolean} options options given by the app (`pluginOptions`)
 * @property {boolean} header button in the header of the drawer
 * @property {boolean} css style sheet of the plugin
 * @property {string[]} languages languages of texts besides English (`fr`, `es`, `de`)
 * @property {boolean} tests tests with Vitest
 */

/**
 * Answer of an optional value: "none" (or nothing) for none
 * @param {string} value answer
 * @returns {string} value, empty for none
 */
function withoutNone(value) {
  return value.trim().toLowerCase() === 'none' ? '' : value.trim();
}

/** Languages of the drawer besides English */
export const languages = [
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
];

/**
 * Questions of a new plugin, defaults derived from its name
 * @param {Prompter} prompter questions asked to the developer
 * @param {{ name?: string, directory?: string, template?: boolean, checkDirectory?: (dir: string) => string | null }}
 * [given] answers given on the command line, check of the folder (not empty)
 * @returns {Promise<Answers>} answers
 */
export async function ask(prompter, given = {}) {
  const title =
    given.name && !checkName(given.name)
      ? given.name
      : await prompter.text('name', 'Name of the plugin', { hint: 'e.g. Sticky notes', validate: checkName });
  const names = getNames(title);
  const packageName = await prompter.text('packageName', 'Name of the package', {
    default: `free-drawing-plugin-${names.kebab}`,
    validate: checkPackageName,
  });
  const directory =
    given.directory ??
    (await prompter.text('directory', 'Folder', {
      default: packageName.replace(/^@[^/]+\//, ''),
      validate: given.checkDirectory,
    }));
  const start = given.template
    ? 'template'
    : await prompter.select(
        'start',
        'Start from',
        [
          { value: 'custom', label: 'A new plugin built from your answers' },
          {
            value: 'template',
            label: 'The complete template',
            hint: 'stamps: two tools, commands, options, a second plugin, styles and tests, to adapt',
          },
        ],
        'custom'
      );
  /** @type {Answers} */
  const answers = {
    names,
    packageName,
    directory,
    start: start === 'template' ? 'template' : 'custom',
    tool: 'none',
    toolId: names.camel,
    toolShortcut: '',
    command: false,
    commandShortcut: '',
    contextMenu: false,
    options: false,
    header: false,
    css: true,
    languages: languages.map(({ value }) => value),
    tests: true,
  };

  // the template has every part (options: symbols, colors, size, limit)
  if (answers.start === 'template') return { ...answers, options: true };

  const tool = await prompter.select(
    'tool',
    'Tool in the toolbar',
    [
      { value: 'click', label: 'Yes, a click adds a shape', hint: 'BaseWidget' },
      { value: 'shape', label: 'Yes, a shape drawn by dragging', hint: 'ShapeWidget' },
      { value: 'none', label: 'No tool' },
    ],
    'click'
  );

  answers.tool = tool === 'click' || tool === 'shape' ? tool : 'none';
  if (answers.tool !== 'none') {
    answers.toolId = await prompter.text('toolId', 'Id of the tool', { default: names.camel, validate: checkToolId });
    answers.toolShortcut = withoutNone(
      await prompter.text('toolShortcut', 'Shortcut of the tool (a letter, "none" for none)', {
        default: suggestToolShortcut(names.title) || 'none',
        validate: (value) => checkToolShortcut(withoutNone(value)),
      })
    ).toLowerCase();
  }

  answers.command = await prompter.confirm('command', 'A command (command palette, shortcut, help)?', true);
  if (answers.command) {
    answers.commandShortcut = formatShortcut(
      withoutNone(
        await prompter.text('commandShortcut', 'Shortcut of the command (e.g. Alt+N, "none" for none)', {
          default: suggestCommandShortcut(names.title, answers.toolShortcut) || 'none',
          validate: (value) => checkCommandShortcut(withoutNone(value)),
        })
      )
    );
    answers.contextMenu = await prompter.confirm('contextMenu', 'Command in the context menu of the drawing?', true);
  }
  answers.options = await prompter.confirm('options', 'Options given by the app (pluginOptions)?', true);
  answers.header = await prompter.confirm('header', 'Button in the header of the drawer (number of shapes)?', false);
  answers.css = await prompter.confirm('css', 'Style sheet (style.css)?', answers.header);
  answers.languages = await prompter.multiselect('languages', 'Languages of the texts, besides English', languages, [
    'fr',
  ]);
  answers.tests = await prompter.confirm('tests', 'Tests (Vitest)?', true);

  return answers;
}

/**
 * Summary of the answers, shown before the package is created
 * @param {Answers} answers answers
 * @returns {string[]} lines: label and value
 */
export function summarize({ names, packageName, directory, start, ...answers }) {
  const label = (/** @type {string} */ text) => text.padEnd(10);
  const lines = [
    `${label('Package')}${packageName} (folder ${directory})`,
    `${label('Plugin')}${names.pascal}Plugin, pluginName '${names.pascal}'`,
  ];

  if (start === 'template') return [...lines, `${label('From')}the complete template (stamps)`];

  if (answers.tool !== 'none') {
    const kind = answers.tool === 'click' ? 'a click adds a shape' : 'a shape drawn by dragging';
    const shortcut = answers.toolShortcut ? `, shortcut ${answers.toolShortcut.toUpperCase()}` : '';

    lines.push(`${label('Tool')}${answers.toolId}: ${kind}${shortcut}`);
  }
  if (answers.command) {
    const where = [answers.commandShortcut, 'palette', answers.contextMenu && 'context menu'].filter(Boolean);

    lines.push(`${label('Command')}${where.join(', ')}`);
  }
  const others = languages.filter(({ value }) => answers.languages.includes(value)).map((l) => l.label);

  lines.push(`${label('Texts')}${names.camel}.*: English${others.map((l) => `, ${l}`).join('')}`);
  if (answers.options) lines.push(`${label('Options')}pluginOptions.${names.pascal}`);
  if (answers.header) lines.push(`${label('Header')}button with the number of shapes`);
  if (answers.css) lines.push(`${label('Styles')}style.css`);
  if (answers.tests) lines.push(`${label('Tests')}Vitest`);

  return lines;
}
