// @ts-check
// Packages generated with several answers, checked as a developer would: type check, tests, build.
// In the repository (`.generated/`, ignored by git): the library (built with `yarn build`), Konva and the tools of tests
// are found in node_modules of the repository.
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { writeFiles } from '../src/cli.js';
import { generate } from '../src/generate.js';
import { createAnswersPrompter } from '../src/prompts.js';
import { ask } from '../src/questions.js';
import { generateFromTemplate } from '../src/template.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = fileURLToPath(new URL('../.generated/', import.meta.url));
const tsc = `${root}node_modules/typescript/lib/tsc.js`;
const vitest = `${root}node_modules/vitest/vitest.mjs`;

/** Answers of each checked package, by folder */
const variants = {
  // defaults: click tool, command in the context menu, options, French texts, tests
  defaults: { name: 'Sticky notes' },
  shape: {
    name: 'Mind map',
    tool: 'shape',
    toolShortcut: 'g',
    commandShortcut: 'Alt+Shift+M',
    contextMenu: false,
    header: true,
    css: true,
    languages: ['fr', 'es', 'de'],
  },
  bare: { name: 'Bare', tool: 'none', command: false, options: false, tests: false },
  noShortcuts: { name: 'Quiet', toolShortcut: '', commandShortcut: '', header: true, languages: [] },
  template: { name: 'My stamps', start: 'template' },
};

if (!existsSync(`${root}packages/free-drawing/dist/index.d.ts`)) {
  console.error('Build the library first: yarn build');
  process.exit(1);
}
rmSync(output, { recursive: true, force: true });

let failed = false;

for (const [folder, given] of Object.entries(variants)) {
  const answers = await ask(createAnswersPrompter({ ...given, directory: folder }));
  const dir = `${output}${folder}`;
  /**
   * Run a step in the package, its output shown when it fails
   * @param {string} step name of the step
   * @param {string[] | string} command arguments of node, or a command of the shell
   */
  const run = (step, command) => {
    try {
      if (typeof command === 'string') execSync(command, { cwd: dir, stdio: 'pipe' });
      else execFileSync(process.execPath, command, { cwd: dir, stdio: 'pipe' });
      console.log(`  ok ${step}`);
    } catch (error) {
      failed = true;
      console.log(`  FAILED ${step}\n${/** @type {{ stdout: Buffer }} */ (error).stdout}`);
    }
  };

  writeFiles(dir, answers.start === 'template' ? generateFromTemplate(answers) : generate(answers));
  console.log(`${folder}: ${answers.packageName}`);
  run('typecheck', [tsc, '-p', '.']);
  if (answers.tests) run('tests', [vitest, 'run']);
  // build script of the package: tsc of the repository first in PATH
  run('build', 'npm run build');

  const dist = ['index.js', 'index.d.ts', ...(answers.css ? ['style.css'] : [])];

  if (!dist.every((file) => existsSync(`${dir}/dist/${file}`))) {
    failed = true;
    console.log(`  FAILED dist: ${dist.join(', ')} expected`);
  }
}

process.exitCode = failed ? 1 : 0;
