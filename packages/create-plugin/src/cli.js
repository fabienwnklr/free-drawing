// @ts-check
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { generate, guideUrl } from './generate.js';
import { colors, createAnswersPrompter, createPrompter } from './prompts.js';
import { ask, summarize } from './questions.js';
import { generateFromTemplate } from './template.js';

/**
 * @typedef {import('./prompts.js').Prompter} Prompter
 * @typedef {import('./generate.js').Files} Files
 */

/**
 * @typedef {object} Context Environment of the command (tests give their own)
 * @property {Prompter} [prompter] questions, in the terminal by default
 * @property {string} [cwd] folder the package folder is relative to
 * @property {NodeJS.WritableStream & { isTTY?: boolean }} [output] messages
 * @property {string} [userAgent] user agent of the package manager running the command
 */

/** Help of the command */
export const usage = `Create a plugin of free-drawing: questions, then a package ready to test, build and publish

Usage:
  npm create @fabwcie/free-drawing-plugin@latest [folder] [-- options]
  yarn create @fabwcie/free-drawing-plugin [folder] [options]

Options:
  --name <name>  name of the plugin (e.g. "Sticky notes"), classes and ids are derived from it
  --template     start from the complete template (stamps)
  -y, --yes      default answers (needs --name)
  --force        write in a folder that is not empty
  -h, --help     this help

Guide: ${guideUrl}`;

/**
 * Package manager running the command, from its user agent (`npm_config_user_agent`)
 * @param {string} userAgent user agent (`yarn/1.22.22 npm/? node/v24`)
 * @returns {'npm' | 'yarn' | 'pnpm' | 'bun'} package manager, npm by default
 */
export function packageManager(userAgent) {
  return /** @type {const} */ (['yarn', 'pnpm', 'bun']).find((name) => userAgent.startsWith(name)) ?? 'npm';
}

/**
 * Commands of a package manager in a new package: install, test, build
 * @param {'npm' | 'yarn' | 'pnpm' | 'bun'} manager package manager
 * @returns {{ install: string, run: (script: string) => string }} install command, command running a script
 */
function commands(manager) {
  return {
    install: manager === 'yarn' ? 'yarn' : `${manager} install`,
    run: (script) => (manager === 'npm' && script !== 'test' ? `npm run ${script}` : `${manager} ${script}`),
  };
}

/**
 * Files written in a folder, created with its sub folders
 * @param {string} dir folder of the package
 * @param {Files} files contents by path
 */
export function writeFiles(dir, files) {
  for (const [path, content] of files) {
    const file = join(dir, ...path.split('/'));

    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}

/**
 * Command: questions, summary, files of the package written, next steps
 * @param {string[]} [argv] arguments of the command
 * @param {Context} [context] environment
 * @returns {Promise<number>} exit code: 0 created, 1 error or cancelled
 */
export async function main(argv = process.argv.slice(2), context = {}) {
  const output = context.output ?? process.stdout;
  const c = colors(output);
  const cwd = context.cwd ?? process.cwd();
  /** @param {string} message error */
  const fail = (message) => {
    output.write(`${c.red(message)}\n`);
    return 1;
  };
  /** @type {{ values: { name?: string, template?: boolean, yes?: boolean, force?: boolean, help?: boolean }, positionals: string[] }} */
  let args;

  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        name: { type: 'string' },
        template: { type: 'boolean' },
        yes: { type: 'boolean', short: 'y' },
        force: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    return fail(`${/** @type {Error} */ (error).message}\n\n${usage}`);
  }

  const { values, positionals } = args;

  if (values.help) {
    output.write(`${usage}\n`);
    return 0;
  }
  if (values.yes && !values.name) return fail('--yes needs --name: the name of the plugin has no default');

  /** @param {string} dir folder of the package @returns {string | null} error, null when it can be written */
  const checkDirectory = (dir) => {
    const target = resolve(cwd, dir);

    return existsSync(target) && readdirSync(target).length && !values.force
      ? `${dir} is not empty: choose another folder, or use --force`
      : null;
  };
  const folderError = positionals[0] ? checkDirectory(positionals[0]) : null;

  if (folderError) return fail(folderError);

  const prompter =
    context.prompter ??
    (values.yes ? createAnswersPrompter({}, (text) => output.write(`${text}\n`)) : createPrompter({ output }));

  try {
    output.write(`\n${c.bold('@fabwcie/create-free-drawing-plugin')}  ${c.dim(guideUrl)}\n\n`);

    const answers = await ask(prompter, {
      name: values.name,
      directory: positionals[0],
      template: values.template,
      checkDirectory,
    });

    output.write(
      `\n${summarize(answers)
        .map((line) => `  ${line}`)
        .join('\n')}\n\n`
    );
    if (!(await prompter.confirm('create', 'Create the plugin?', true))) return fail('Cancelled');

    const files = answers.start === 'template' ? generateFromTemplate(answers) : generate(answers);
    const { install, run } = commands(packageManager(context.userAgent ?? process.env.npm_config_user_agent ?? ''));

    writeFiles(resolve(cwd, answers.directory), files);
    output.write(
      [
        '',
        `${c.green('Created')} ${answers.directory} (${files.size} files)`,
        '',
        'Next:',
        `  cd ${answers.directory}`,
        `  ${install}`,
        answers.tests && `  ${run('test')}`,
        `  ${run('build')}`,
        '',
        `Plugins guide: ${guideUrl}`,
        '',
      ]
        .filter((line) => typeof line === 'string')
        .join('\n')
    );

    return 0;
  } catch (error) {
    return fail(/** @type {Error} */ (error).message);
  } finally {
    prompter.close();
  }
}
