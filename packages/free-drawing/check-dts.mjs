// Declarations of the built `index.d.ts` all exported: a class or a type reachable from the public API (member of the
// drawer, type of an option) must be exported by `src/index.ts`, else apps can't name it. Run by the build
import { readFileSync } from 'node:fs';

const dts = readFileSync(new URL('./dist/index.d.ts', import.meta.url), 'utf8');
// `declare class X`, `declare type X`... of the rollup of api-extractor, exported or not
const declared = [...dts.matchAll(/^(export )?declare (?:abstract )?(?:class|type|interface|function|const|let|enum) (\w+)/gm)];
// `export { X, Y as Z }`, `export type { X }`: declared names
const listed = [...dts.matchAll(/^export (?:type )?\{([^}]*)\}/gm)].flatMap(([, names]) =>
  names
    .split(',')
    .map((name) => name.trim().split(/\s+as\s+/)[0])
    .filter(Boolean)
);
const exported = new Set([...declared.filter(([, direct]) => direct).map(([, , name]) => name), ...listed]);
const missing = declared.filter(([, direct, name]) => !direct && !exported.has(name)).map(([, , name]) => name);

if (missing.length) {
  console.error(`Declared by dist/index.d.ts, not exported by src/index.ts: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`dist/index.d.ts: ${declared.length} declarations, all exported`);
