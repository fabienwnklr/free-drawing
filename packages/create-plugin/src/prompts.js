// @ts-check
import { createInterface } from 'node:readline';

/**
 * @typedef {object} Choice Option of a question with a choice
 * @property {string} value value given back
 * @property {string} label text shown
 * @property {string} [hint] details, after the label
 */

/**
 * @typedef {object} TextOptions Options of a text question
 * @property {string} [default] value of an empty answer
 * @property {string} [hint] example shown after the question
 * @property {(value: string) => string | null} [validate] error of a value, null when valid
 */

/**
 * @typedef {object} Prompter Questions asked to the developer. `id` names the question (answers given by tests and
 * `--yes`)
 * @property {(id: string, message: string, options?: TextOptions) => Promise<string>} text free text, validated
 * @property {(id: string, message: string, defaultValue: boolean) => Promise<boolean>} confirm yes or no
 * @property {(id: string, message: string, choices: Choice[], defaultValue: string) => Promise<string>} select one
 * choice
 * @property {(id: string, message: string, choices: Choice[], defaults: string[]) => Promise<string[]>} multiselect
 * several choices, or none
 * @property {(text: string) => void} print message to the developer
 * @property {() => void} close end of the questions
 */

/**
 * Colors of a terminal, plain text elsewhere (pipe, file)
 * @param {NodeJS.WritableStream & { isTTY?: boolean }} output stream written to
 * @returns {Record<'bold' | 'dim' | 'cyan' | 'green' | 'red', (text: string) => string>} color functions
 */
export function colors(output) {
  /** @param {number} code ANSI code @returns {(text: string) => string} color function */
  const color = (code) => (text) => (output.isTTY && !process.env.NO_COLOR ? `\x1b[${code}m${text}\x1b[0m` : text);

  return { bold: color(1), dim: color(2), cyan: color(36), green: color(32), red: color(31) };
}

/**
 * Questions asked in the terminal: default values in brackets (Enter keeps them), choices by number, invalid answers
 * asked again. Ctrl + C cancels
 * @param {{ input?: NodeJS.ReadableStream, output?: NodeJS.WritableStream & { isTTY?: boolean } }} [streams] input and
 * output of the terminal
 * @returns {Prompter} questions in the terminal
 */
export function createPrompter({ input = process.stdin, output = process.stdout } = {}) {
  const rl = createInterface({ input, output });
  const c = colors(output);
  /** @type {string[]} lines typed (or piped) before they are asked for */
  const lines = [];
  /** @type {{ resolve: (line: string) => void, reject: (error: Error) => void } | null} question waiting for a line */
  let waiting = null;
  let closed = false;
  /** @returns {Promise<string>} next line of the input, rejected once it is closed */
  const nextLine = () => {
    const line = lines.shift();

    if (line !== undefined) return Promise.resolve(line);
    if (closed) return Promise.reject(new Error('Cancelled: no answer'));

    return new Promise((resolve, reject) => (waiting = { resolve, reject }));
  };
  /** @param {string} message question @param {string} [shown] default shown @returns {Promise<string>} answer */
  const question = async (message, shown) => {
    rl.setPrompt(`${c.cyan('?')} ${c.bold(message)}${shown ? c.dim(` (${shown})`) : ''} `);
    rl.prompt();

    const answer = (await nextLine()).trim();

    // piped answers are not echoed by the terminal
    if (!(/** @type {{ isTTY?: boolean }} */ (input).isTTY)) output.write(`${answer}\n`);

    return answer;
  };

  rl.on('line', (line) => {
    const question = waiting;

    waiting = null;
    if (question) question.resolve(line);
    else lines.push(line);
  });
  rl.on('close', () => {
    closed = true;
    waiting?.reject(new Error('Cancelled: no answer'));
    waiting = null;
  });
  rl.on('SIGINT', () => {
    output.write(`\n${c.red('Cancelled')}\n`);
    process.exit(130);
  });

  return {
    async text(_id, message, { default: defaultValue = '', hint, validate } = {}) {
      for (;;) {
        const answer = (await question(message, defaultValue || hint)) || defaultValue;
        const error = validate?.(answer);

        if (!error) return answer;
        output.write(`  ${c.red(error)}\n`);
      }
    },
    async confirm(_id, message, defaultValue) {
      for (;;) {
        const answer = (await question(message, defaultValue ? 'Y/n' : 'y/N')).toLowerCase();

        if (!answer) return defaultValue;
        if (['y', 'yes', 'o', 'oui'].includes(answer)) return true;
        if (['n', 'no', 'non'].includes(answer)) return false;
        output.write(`  ${c.red('Answer y or n')}\n`);
      }
    },
    async select(_id, message, choices, defaultValue) {
      const index = choices.findIndex((choice) => choice.value === defaultValue);

      output.write(`${c.cyan('?')} ${c.bold(message)}\n`);
      for (const [i, { label, hint }] of choices.entries()) {
        output.write(`  ${c.cyan(String(i + 1))}. ${label}${hint ? c.dim(` - ${hint}`) : ''}\n`);
      }
      for (;;) {
        const answer = await question(`Choice 1-${choices.length}`, String(index + 1));
        const chosen = answer ? choices[Number(answer) - 1] : choices[index];

        if (chosen) return chosen.value;
        output.write(`  ${c.red(`Answer a number from 1 to ${choices.length}`)}\n`);
      }
    },
    async multiselect(_id, message, choices, defaults) {
      const numbers = defaults.map((value) => choices.findIndex((choice) => choice.value === value) + 1);

      output.write(`${c.cyan('?')} ${c.bold(message)}\n`);
      for (const [i, { label }] of choices.entries()) output.write(`  ${c.cyan(String(i + 1))}. ${label}\n`);
      for (;;) {
        const answer = await question('Numbers separated by commas, "none" for none', numbers.join(',') || 'none');

        if (!answer) return defaults;
        if (answer.toLowerCase() === 'none') return [];

        const chosen = answer.split(/[\s,]+/).map((n) => choices[Number(n) - 1]);

        if (chosen.every(Boolean)) return [...new Set(chosen.map((choice) => choice.value))];
        output.write(`  ${c.red(`Answer numbers from 1 to ${choices.length}`)}\n`);
      }
    },
    print(text) {
      output.write(`${text}\n`);
    },
    close() {
      rl.close();
    },
  };
}

/**
 * Questions answered without the terminal: given answers, else defaults (`--yes`, tests). An invalid answer throws
 * @param {Record<string, string | boolean | string[]>} [answers] answers by question id
 * @param {(text: string) => void} [print] messages to the developer
 * @returns {Prompter} questions answered at once
 */
export function createAnswersPrompter(answers = {}, print = () => {}) {
  return {
    async text(id, message, { default: defaultValue = '', validate } = {}) {
      const answer = String(answers[id] ?? defaultValue);
      const error = validate?.(answer);

      if (error) throw new Error(`${message}: ${error}`);
      return answer;
    },
    async confirm(id, _message, defaultValue) {
      return Boolean(answers[id] ?? defaultValue);
    },
    async select(id, message, choices, defaultValue) {
      const answer = String(answers[id] ?? defaultValue);

      if (!choices.some((choice) => choice.value === answer)) throw new Error(`${message}: unknown choice "${answer}"`);
      return answer;
    },
    async multiselect(id, _message, _choices, defaults) {
      const answer = answers[id];

      return Array.isArray(answer) ? answer : defaults;
    },
    print,
    close() {},
  };
}
