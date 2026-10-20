// @ts-check
// Before `npm pack` / `npm publish` (prepack): complete template of the repository copied in the package (`template/`)
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const template = fileURLToPath(new URL('../../plugin-template/', import.meta.url));
const copy = fileURLToPath(new URL('../template/', import.meta.url));

rmSync(copy, { recursive: true, force: true });
for (const folder of ['src', 'tests']) cpSync(`${template}${folder}`, `${copy}${folder}`, { recursive: true });
console.log('Template copied in template/');
