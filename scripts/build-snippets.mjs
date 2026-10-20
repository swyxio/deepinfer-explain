import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';

// Embed small, line-numbered excerpts from the pinned local checkout. This also
// validates every tour reference before a build can be shipped.
const revision = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const checkout = execFileSync('git', ['-C', 'DeepInfer', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (checkout !== revision) throw new Error(`Expected DeepInfer ${revision}; checkout is ${checkout}`);
const dirty = execFileSync('git', ['-C', 'DeepInfer', 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim();
if (dirty) throw new Error('DeepInfer has tracked changes; source excerpts must match the pinned revision.');
const source = await readFile('src/modules.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { modules } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const result = {};
for (const entry of modules) {
  for (const file of entry.files) {
    const target = path.resolve('DeepInfer', file.path);
    if (!target.startsWith(path.resolve('DeepInfer') + path.sep)) throw new Error(`Invalid source path: ${file.path}`);
    const contents = (await readFile(target, 'utf8')).split('\n');
    if (!Number.isInteger(file.line) || file.line < 1 || file.line > contents.length) throw new Error(`Invalid source line: ${file.path}:${file.line}`);
    result[`${file.path}:${file.line}`] = { start: file.line, lines: contents.slice(file.line - 1, file.line + 10) };
  }
}
await writeFile('src/snippets.json', JSON.stringify(result, null, 2) + '\n');
console.log(`Validated and embedded ${Object.keys(result).length} source excerpts from ${modules.length} chapters.`);
