import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';

const revision = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const checkout = execFileSync('git', ['-C', 'DeepInfer', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (checkout !== revision) throw new Error(`Expected DeepInfer ${revision}; checkout is ${checkout}`);
const dirty = execFileSync('git', ['-C', 'DeepInfer', 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim();
if (dirty) throw new Error('DeepInfer has tracked changes; the codemap must match the pinned revision.');

const entries = execFileSync('git', ['-C', 'DeepInfer', 'ls-files', '--stage', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const submoduleConfig = execFileSync('git', ['config', '-f', 'DeepInfer/.gitmodules', '--get-regexp', '^submodule\\..*\\.(path|url)$'], { encoding: 'utf8' });
const submodulePairs = new Map();
for (const line of submoduleConfig.trim().split('\n')) {
  const match = line.match(/^(submodule\..+)\.(path|url) (.+)$/);
  if (!match) throw new Error(`Invalid submodule configuration: ${line}`);
  const pair = submodulePairs.get(match[1]) || {};
  pair[match[2]] = match[3];
  submodulePairs.set(match[1], pair);
}
const submoduleUrls = new Map([...submodulePairs.values()].map(pair => [pair.path, pair.url]));
async function loadData(filename) {
  let source = await readFile(filename, 'utf8');
  if (source.includes("from './routes'")) {
    const routes = await readFile('src/routes.ts', 'utf8');
    const compiledRoutes = ts.transpileModule(routes, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
    const routesUrl = `data:text/javascript;base64,${Buffer.from(compiledRoutes).toString('base64')}`;
    source = source.replace("from './routes'", `from '${routesUrl}'`);
  }
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
async function loadTranslation() {
  const [source, translation] = await Promise.all([readFile('src/translation.ts', 'utf8'), readFile('src/article-translation.txt', 'utf8')]);
  if (!source.includes("import translation from './article-translation.txt?raw';")) throw new Error('Translation import not found.');
  const images = [...source.matchAll(/^import (\w+) from '(\.\/assets\/article\/[^']+\.png)';$/gm)];
  await Promise.all(images.map(([, , path]) => readFile(`src/${path.slice(2)}`)));
  const prepared = source.replace("import translation from './article-translation.txt?raw';", `const translation = ${JSON.stringify(translation)};`)
    .replace(/^import (\w+) from '(\.\/assets\/article\/[^']+\.png)';$/gm, (_, name, path) => `const ${name} = ${JSON.stringify(path)};`);
  const compiled = ts.transpileModule(prepared, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const [{ fileNotes, folderNotes }, { executionPaths }, { modules }, { articleSections }, { kernelSymbolNotes }, { runtimeSymbolNotes }, { supportSymbolNotes }, { additionalSymbolNotes }, { requestFlowStages, requestFlowGroups, requestFlowTransitions }, { readings }, { coverageRows, modelComparisons, modelSources, modelStageSources }, { visualStories }, translation] = await Promise.all([
  loadData('src/file-notes.ts'), loadData('src/execution-paths.ts'), loadData('src/modules.ts'), loadData('src/article-notes.ts'),
  loadData('src/symbol-notes-kernels.ts'), loadData('src/symbol-notes-runtime.ts'), loadData('src/symbol-notes-support.ts'),
  loadData('src/symbol-notes-additional.ts'),
  loadData('src/request-flow.ts'), loadData('src/research.ts'), loadData('src/model-support.ts'), loadData('src/visual-stories-data.ts'), loadTranslation(),
]);
const manifest = [];
const contents = {};
for (const entry of entries) {
  const [header, filename] = entry.split('\t');
  const [mode, object] = header.split(' ');
  if (mode === '160000') {
    const url = submoduleUrls.get(filename);
    if (!url) throw new Error(`Missing upstream URL for submodule ${filename}`);
    manifest.push({ path: filename, kind: 'submodule', object, url: url.replace(/\.git$/, '') });
    continue;
  }
  const bytes = await readFile(`DeepInfer/${filename}`);
  const isText = !bytes.includes(0) && !/\.(png|jpe?g|gif|webp|pdf)$/i.test(filename);
  if (!isText) {
    manifest.push({ path: filename, kind: 'binary', size: bytes.length });
    continue;
  }
  const content = bytes.toString('utf8');
  const lines = content.split('\n');
  const symbols = [];
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*(?:(?:async\s+)?(def|class)\s+([A-Za-z_]\w*)\s*[(:]|(class|struct|enum(?:\s+class)?)\s+([A-Za-z_]\w*)\b)/);
    if (match) symbols.push({ name: match[2] || match[4], kind: match[1] || match[3], line: index + 1 });
  }
  manifest.push({ path: filename, kind: 'text', size: bytes.length, lines: lines.length, symbols });
  contents[filename] = content;
}
const firstParty = manifest.filter(entry => entry.kind !== 'submodule').map(entry => entry.path);
const missingNotes = firstParty.filter(filename => !fileNotes[filename]);
const extraNotes = Object.keys(fileNotes).filter(filename => !firstParty.includes(filename));
if (missingNotes.length || extraNotes.length) throw new Error(`File note coverage mismatch. Missing: ${missingNotes.join(', ')}; extra: ${extraNotes.join(', ')}`);
const folderPaths = new Set(['.']);
for (const entry of manifest) {
  const parts = entry.path.split('/');
  for (let i = 1; i < parts.length; i++) folderPaths.add(parts.slice(0, i).join('/'));
  if (entry.kind === 'submodule') folderPaths.add(entry.path);
}
const missingFolders = [...folderPaths].filter(folder => !folderNotes[folder]);
const extraFolders = Object.keys(folderNotes).filter(folder => !folderPaths.has(folder));
if (missingFolders.length || extraFolders.length) throw new Error(`Folder note coverage mismatch. Missing: ${missingFolders.join(', ')}; extra: ${extraFolders.join(', ')}`);
function verifyAnchor(filename, line, label) {
  const text = contents[filename];
  if (text === undefined || !Number.isInteger(line) || line < 1 || line > text.split('\n').length) throw new Error(`Invalid ${label} anchor: ${filename}:${line}`);
}
for (const row of coverageRows) verifyAnchor(row.source.path, row.source.line, `model coverage ${row.feature}`);
for (const source of [...Object.values(modelSources), ...modelStageSources]) verifyAnchor(source.path, source.line, 'model explorer');
if (new Set(modelComparisons.map(model => model.id)).size !== modelComparisons.length) throw new Error('Model comparison IDs must be unique.');
const listedModels = modelComparisons.filter(model => model.listed);
if (listedModels.length !== 1 || listedModels[0].id !== 'deepseek-v41-flash' || listedModels[0].stages.length !== modelStageSources.length) throw new Error('Model explorer stages must match the listed architecture.');
for (const model of modelComparisons) new URL(model.gallery);
const articleLines = translation.translationSections.flatMap(section => translation.translationSectionLines(section.id));
if (articleLines.map(line => line.text).join('\n') !== await readFile('src/article-translation.txt', 'utf8')) throw new Error('Translation sections do not preserve the supplied text.');
const articleNoteIds = articleSections.flatMap(section => section.annotations.map(note => note.id));
const placedArticleNotes = Object.entries(translation.translationAnnotations).flatMap(([line, ids]) => {
  if (!articleLines.some(item => item.line === Number(line))) throw new Error(`Invalid translation note line ${line}`);
  return ids;
});
if (new Set(placedArticleNotes).size !== placedArticleNotes.length || placedArticleNotes.length !== articleNoteIds.length || placedArticleNotes.some(id => !articleNoteIds.includes(id))) throw new Error('Translation notes must place every annotation exactly once.');
for (const [line, highlights] of Object.entries(translation.translationHighlights)) for (const highlight of highlights) if (!translation.translationLines[Number(line) - 1]?.includes(highlight)) throw new Error(`Translation highlight missing on line ${line}`);
const moduleIds = new Set(modules.map(module => module.id));
const readingIds = new Set(readings.map(reading => reading.id));
if (visualStories.length !== 5 || new Set(visualStories.map(story => story.id)).size !== visualStories.length) throw new Error('Expected five unique visual stories.');
for (const story of visualStories) {
  if (story.stages.length !== 4) throw new Error(`Visual story ${story.id} must have four stages.`);
  for (const link of story.links) {
    const parts = link.href.split('/').filter(Boolean);
    if (parts[0] === 'file' && parts.length >= 3 && /^L[1-9]\d*$/.test(parts.at(-1))) verifyAnchor(decodeURIComponent(parts.slice(1, -1).join('/')), Number(parts.at(-1).slice(1)), `visual story ${story.id}`);
    else if (parts[0] === 'research' && parts.length === 2 && readingIds.has(parts[1])) continue;
    else if (parts[0] === 'article' && parts.length === 3 && articleSections.some(section => section.id === parts[1] && section.annotations.some(note => note.id === parts[2]))) continue;
    else throw new Error(`Invalid visual story link ${story.id}: ${link.href}`);
  }
}
const stageIds = new Set(requestFlowStages.map(stage => stage.id));
const groupedStageIds = requestFlowGroups.flat();
if (stageIds.size !== requestFlowStages.length || groupedStageIds.length !== stageIds.size || new Set(groupedStageIds).size !== stageIds.size || groupedStageIds.some(id => !stageIds.has(id))) throw new Error('Request flow groups must contain every stage exactly once.');
if (Object.keys(requestFlowTransitions).length !== stageIds.size || Object.keys(requestFlowTransitions).some(id => !stageIds.has(id))) throw new Error('Request flow transitions must be defined for every stage.');
for (const [index, group] of requestFlowGroups.entries()) for (const id of group) {
  const depicted = new Set([...(requestFlowGroups[index + 1] || []), ...(id === 'update' ? ['schedule'] : [])]);
  const linked = new Set(requestFlowTransitions[id].map(transition => transition.id));
  if (depicted.size !== linked.size || [...depicted].some(target => !linked.has(target))) throw new Error(`Diagram and next links disagree at request flow ${id}`);
}
for (const stage of requestFlowStages) {
  if (!stage.code.length || !stage.research.length) throw new Error(`Request flow stage ${stage.id} needs source and research links.`);
  for (const link of stage.code) verifyAnchor(link.path, link.line, `request flow ${stage.id}`);
  for (const id of stage.research) if (!readingIds.has(id)) throw new Error(`Unknown research ${id} in request flow ${stage.id}`);
  for (const id of stage.chapters) if (!moduleIds.has(id)) throw new Error(`Unknown chapter ${id} in request flow ${stage.id}`);
  for (const transition of requestFlowTransitions[stage.id]) if (!stageIds.has(transition.id) || !transition.label) throw new Error(`Invalid transition from request flow ${stage.id}`);
}
for (const module of modules) for (const file of module.files) verifyAnchor(file.path, file.line, `chapter ${module.id}`);
let symbolNoteCount = 0;
const annotatedFiles = new Set();
for (const dataset of [kernelSymbolNotes, runtimeSymbolNotes, supportSymbolNotes, additionalSymbolNotes]) {
  for (const [filename, notes] of Object.entries(dataset)) {
    if (!Array.isArray(notes) || !notes.length) throw new Error(`Empty symbol notes: ${filename}`);
    for (const note of notes) {
      verifyAnchor(filename, note.line, `symbol ${note.symbol}`);
      if (!note.symbol?.trim() || !note.note?.trim()) throw new Error(`Incomplete symbol note: ${filename}:${note.line}`);
      symbolNoteCount++;
    }
    annotatedFiles.add(filename);
  }
}
const unannotatedSource = manifest.filter(entry => entry.kind === 'text' && entry.size > 0 && /\.(pyi?|cpp|hpp|h|cu|cuh|sh|md)$/i.test(entry.path) && !annotatedFiles.has(entry.path));
if (unannotatedSource.length) throw new Error(`Missing detailed notes for nonempty source or documentation: ${unannotatedSource.map(entry => entry.path).join(', ')}`);
for (const trace of executionPaths) {
  for (const id of trace.related) if (!moduleIds.has(id)) throw new Error(`Unknown chapter ${id} in trace ${trace.id}`);
  for (const step of trace.steps) verifyAnchor(step.path, step.line, `trace ${trace.id}`);
}
const sourcePrefix = `https://github.com/deepseek-ai/DeepInfer/blob/${revision}/`;
for (const section of articleSections) for (const annotation of section.annotations) {
  for (const link of [...annotation.evidence, ...annotation.code, ...annotation.related]) {
    new URL(link.url);
    if (link.url.startsWith(sourcePrefix)) {
      const [filename, hash] = link.url.slice(sourcePrefix.length).split('#L');
      verifyAnchor(filename, Number(hash), `article ${annotation.id}`);
    }
  }
}
await writeFile('src/source-manifest.json', JSON.stringify(manifest) + '\n');
await writeFile('public/source-data.json', JSON.stringify(contents) + '\n');
console.log(`Indexed ${manifest.length} tracked entries: ${Object.keys(contents).length} text files, ${manifest.filter(x => x.kind === 'binary').length} binary assets, ${manifest.filter(x => x.kind === 'submodule').length} submodules.`);
console.log(`Validated ${firstParty.length} file notes, ${folderPaths.size} folder and vendor notes, ${symbolNoteCount} detailed anchors across ${annotatedFiles.size} files, ${executionPaths.reduce((n, trace) => n + trace.steps.length, 0)} trace anchors, ${requestFlowStages.length} request-flow stages, ${visualStories.length} visual stories, article and model-support source anchors, and ${placedArticleNotes.length} translation notes.`);
