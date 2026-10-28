import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { main, packageManager } from '../src/cli.js';
import { createAnswersPrompter } from '../src/prompts.js';

/** Folders created by the tests */
const folders = [];

/**
 * Output of the command, kept as text
 * @returns {{ text: string, write: (chunk: string) => boolean }} output stream
 */
const createOutput = () => ({
  text: '',
  write(chunk) {
    this.text += chunk;
    return true;
  },
});

/**
 * Empty folder of a test
 * @returns {string} path
 */
const createFolder = () => {
  const folder = mkdtempSync(join(tmpdir(), 'create-plugin-'));

  folders.push(folder);
  return folder;
};

describe('Command', () => {
  afterEach(() => {
    for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
  });

  it('Answers asked, summary, package written, next steps of the package manager', async () => {
    const cwd = createFolder();
    const output = createOutput();
    const prompter = createAnswersPrompter({ name: 'Sticky notes', tool: 'shape' });
    const code = await main([], { prompter, cwd, output, userAgent: 'yarn/1.22.22 npm/? node/v24' });
    const dir = join(cwd, 'free-drawing-plugin-sticky-notes');

    expect(code).toBe(0);
    expect(output.text).toContain('Plugin    StickyNotesPlugin, pluginName');
    expect(output.text).toContain('Created free-drawing-plugin-sticky-notes (15 files)');
    expect(output.text).toContain('  yarn\n  yarn test\n  yarn build');
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name).toBe('free-drawing-plugin-sticky-notes');
    expect(existsSync(join(dir, 'src', 'StickyNotesWidget.ts'))).toBe(true);
  });

  it('Folder of the command line, complete template; a folder not empty is refused unless --force', async () => {
    const cwd = createFolder();
    const output = createOutput();

    writeFileSync(join(cwd, 'file.txt'), '');
    expect(await main(['.', '--name', 'My stamps', '--yes', '--template'], { cwd, output })).toBe(1);
    expect(output.text).toContain('. is not empty: choose another folder, or use --force');
    expect(await main(['.', '--name', 'My stamps', '--yes', '--template', '--force'], { cwd, output })).toBe(0);
    expect(existsSync(join(cwd, 'src', 'MyStampsCounterPlugin.ts'))).toBe(true);
  });

  it('Help, --yes without name, cancelled creation, package managers', async () => {
    const output = createOutput();
    const cwd = createFolder();

    expect(await main(['--help'], { output })).toBe(0);
    expect(output.text).toContain('npm create @fabwcie/free-drawing-plugin@latest');
    expect(await main(['--yes'], { output })).toBe(1);
    expect(output.text).toContain('--yes needs --name');
    expect(await main([], { cwd, output, prompter: createAnswersPrompter({ name: 'Notes', create: false }) })).toBe(1);
    expect(existsSync(join(cwd, 'free-drawing-plugin-notes'))).toBe(false);
    // scripts of the package run by Bun (not its test runner and bundler)
    const bunOutput = createOutput();

    await main([], {
      cwd,
      output: bunOutput,
      prompter: createAnswersPrompter({ name: 'Bun notes', tool: 'shape' }),
      userAgent: 'bun/1.2.0',
    });
    expect(bunOutput.text).toContain('  bun install\n  bun run test\n  bun run build');
    expect(['npm/11 node/v24', 'pnpm/9 npm/? node/v24', 'bun/1', ''].map(packageManager)).toEqual([
      'npm',
      'pnpm',
      'bun',
      'npm',
    ]);
  });
});
