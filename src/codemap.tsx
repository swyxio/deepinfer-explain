import { Link } from 'react-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, ChevronRight, FileCode2, Folder, GitBranch, Search } from 'lucide-react';
import { modules } from './modules';
import { executionPaths } from './execution-paths';
import { articleSections } from './article-notes';
import { readingForModule } from './connections';
import { readings } from './research';
import { fileNotes, folderNotes } from './file-notes';
import { kernelSymbolNotes } from './symbol-notes-kernels';
import { runtimeSymbolNotes } from './symbol-notes-runtime';
import { supportSymbolNotes } from './symbol-notes-support';
import { additionalSymbolNotes } from './symbol-notes-additional';
import { requestFlowStages } from './request-flow';
import { RequestFlowExplorer } from './request-flow-explorer';
import { fileRoute, folderRoute } from './routes';
import manifestData from './source-manifest.json';
import './codemap.css';

const revision = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const githubRoot = `https://github.com/deepseek-ai/DeepInfer/blob/${revision}`;
type SymbolEntry = { name: string; kind: string; line: number };
type SymbolNote = { line: number; symbol: string; note: string };
const symbolNotes = [kernelSymbolNotes, runtimeSymbolNotes, supportSymbolNotes, additionalSymbolNotes].reduce<Record<string, SymbolNote[]>>((all, dataset) => {
  for (const [path, notes] of Object.entries(dataset)) (all[path] ||= []).push(...notes);
  return all;
}, {});
export type SourceEntry = { path: string; kind: 'text' | 'binary' | 'submodule'; size?: number; lines?: number; symbols?: SymbolEntry[]; object?: string; url?: string };
export const sourceEntries = manifestData as SourceEntry[];
export { fileRoute } from './routes';
const parentPath = (path: string) => path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.';
const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);
const sourceHref = (path: string, line?: number) => `${githubRoot}/${path}${line ? `#L${line}` : ''}`;

const topicRules: Array<[RegExp, string[]]> = [
  [/^(README\.md|doc\/|deepinfer\/entrypoints\/)/, ['request-flow', 'service-boundary']],
  [/^(deepinfer\/engine\/|csrc\/engine\/)/, ['scheduler', 'request-flow']],
  [/(zos|zero_overhead|profile_server)/i, ['overlap']],
  [/(cache|block_manager|block_load)/i, ['cache']],
  [/(yoco|replay)/i, ['yoco']],
  [/(dflash|dspark|mtp|speculat)/i, ['speculation']],
  [/(moe|mlp|eplb|expert|deep_ep)/i, ['moe']],
  [/(attention|attn|flash_mla|swa|kv_index|compress)/i, ['attention']],
  [/(sample|sampler|structure_output|structured_output|grammar)/i, ['sampling']],
  [/(vision|image|multimodal|processor)/i, ['multimodal']],
  [/(distributed|parallel|topology|deep_cluster|communicat)/i, ['parallelism']],
  [/^(deepinfer\/model_executor\/models\/|deepinfer\/hugging_face\/|deepinfer\/model_config_loader)/, ['model']],
  [/(tilelang_ops|graph_timer|platform|cuda_utils|asc_utils)/i, ['kernels']],
  [/^(tests\/|eval\/|examples\/)/, ['validation']],
];

export function topicsForPath(path: string) {
  const ids = new Set<string>();
  modules.forEach(module => { if (module.files.some(file => file.path === path)) ids.add(module.id); });
  topicRules.forEach(([pattern, topics]) => { if (pattern.test(path)) topics.forEach(topic => ids.add(topic)); });
  return modules.filter(module => ids.has(module.id));
}

interface TreeNode { name: string; path: string; folders: TreeNode[]; files: SourceEntry[] }
function createTree(entries: SourceEntry[]): TreeNode {
  const root: TreeNode = { name: 'DeepInfer', path: '.', folders: [], files: [] };
  for (const entry of entries) {
    const parts = entry.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const path = parts.slice(0, i + 1).join('/');
      let next = current.folders.find(folder => folder.name === parts[i]);
      if (!next) { next = { name: parts[i], path, folders: [], files: [] }; current.folders.push(next); }
      current = next;
    }
    current.files.push(entry);
  }
  const sort = (node: TreeNode) => { node.folders.sort((a, b) => a.name.localeCompare(b.name)); node.files.sort((a, b) => baseName(a.path).localeCompare(baseName(b.path))); node.folders.forEach(sort); };
  sort(root);
  return root;
}
const tree = createTree(sourceEntries);
const folders: TreeNode[] = [];
function collectFolders(node: TreeNode) { folders.push(node); node.folders.forEach(collectFolders); }
collectFolders(tree);

function TreeFolder({ node, active, level = 0 }: { node: TreeNode; active: string; level?: number }) {
  const isActive = active === node.path;
  const shouldOpen = node.path === '.' || active.startsWith(`${node.path}/`) || isActive;
  return <details className="tree-folder" open={shouldOpen || undefined}>
    <summary style={{ paddingLeft: `${level * 13 + 10}px` }}><ChevronRight size={13} className="tree-chevron"/><Folder size={14}/><Link to={folderRoute(node.path)} onClick={e => e.stopPropagation()} className={isActive ? 'tree-active' : ''}>{node.name}</Link></summary>
    {node.folders.map(child => <TreeFolder node={child} active={active} level={level + 1} key={child.path}/>)}
    {node.files.map(file => <Link className={`tree-file ${active === file.path ? 'tree-active' : ''}`} style={{ paddingLeft: `${(level + 1) * 13 + 26}px` }} to={fileRoute(file.path)} key={file.path}><FileCode2 size={13}/><span>{baseName(file.path)}</span></Link>)}
  </details>;
}
function SourceTree({ active }: { active: string }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const matches = useMemo(() => term ? sourceEntries.filter(entry => `${entry.path} ${fileNotes[entry.path] || ''}`.toLowerCase().includes(term)).slice(0, 60) : [], [term]);
  return <aside className="code-tree" aria-label="Source file tree"><div className="tree-top"><span>FILES & FOLDERS</span><small>{sourceEntries.length} entries</small></div><label className="tree-search"><Search size={14}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a file…" aria-label="Find a file in the codemap"/></label><div className="tree-scroll">{term ? <div className="tree-results">{matches.map(file => <Link to={fileRoute(file.path)} key={file.path} className={active === file.path ? 'tree-active' : ''}><FileCode2 size={13}/><span>{file.path}</span></Link>)}{!matches.length && <p>No matching files.</p>}</div> : <TreeFolder node={tree} active={active}/>}</div></aside>;
}
function Related({ path, folder = false }: { path: string; folder?: boolean }) {
  const topicIds = folder ? new Set(sourceEntries.filter(entry => entry.path.startsWith(`${path}/`)).flatMap(entry => topicsForPath(entry.path).map(topic => topic.id))) : undefined;
  const topics = folder ? modules.filter(module => topicIds?.has(module.id)).slice(0, 9) : topicsForPath(path);
  const articleMatches = folder ? [] : articleSections.flatMap(section => section.annotations.filter(note => [...note.code, ...note.evidence].some(link => link.url.startsWith(`${githubRoot}/${path}#L`))).map(note => ({ title: note.title, href: `/article/${section.id}/${note.id}` })));
  const paperIds = [...new Set(topics.flatMap(topic => readingForModule[topic.id] || []))].slice(0, 5);
  const papers = paperIds.map(id => readings.find(reading => reading.id === id)).filter((x): x is typeof readings[number] => Boolean(x));
  if (!topics.length && !articleMatches.length) return null;
  return <section className="map-related"><div className="map-related-title">CONNECTED CONTEXT</div><div className="related-pills">{topics.map(topic => <Link to={`/module/${topic.id}`} key={topic.id}>{topic.title}<ArrowUpRight size={13}/></Link>)}</div>{papers.length > 0 && <div className="map-papers"><BookOpen size={15}/><span>Research:</span>{papers.map(paper => <Link to={`/research/${paper.id}`} key={paper.id}>{paper.title}</Link>)}<Link to="/compare">Compare approaches <ArrowUpRight size={12}/></Link></div>}{articleMatches.length > 0 && <div className="map-papers"><BookOpen size={15}/><span>Article notes:</span>{articleMatches.slice(0, 5).map(note => <Link key={note.href} to={note.href}>{note.title}</Link>)}{articleMatches.length > 5 && <Link to="/">More in the annotated article</Link>}</div>}<p>Topics connect {folder ? 'these files' : 'this file'} to a broader subsystem; they do not imply that every cited idea is implemented in every file.</p></section>;
}
function FolderView({ path }: { path: string }) {
  const node = folders.find(item => item.path === path);
  if (!node) return <p>Folder not found. <Link to="/codemap">Return to the codemap.</Link></p>;
  const descendantCount = sourceEntries.filter(item => path === '.' || item.path.startsWith(`${path}/`)).length;
  return <><div className="map-breadcrumb"><Link to="/codemap">DeepInfer</Link>{path !== '.' && <> <ChevronRight size={13}/> <span>{path}</span></>}</div><div className="map-file-header"><span className="map-kind">FOLDER · {descendantCount} TRACKED ENTRIES</span><h2>{path === '.' ? 'Repository map' : path}</h2><p>{folderNotes[path] || 'A repository folder. Open its contents to inspect the files and related chapters.'}</p></div>{path !== '.' && <Related path={path} folder/>}<div className="folder-contents"><div className="folder-list-label">CONTENTS</div>{node.folders.map(child => <Link to={folderRoute(child.path)} className="folder-row" key={child.path}><Folder size={16}/><span><strong>{child.name}/</strong><small>{folderNotes[child.path] || 'Open this folder to explore its contents.'}</small></span><ArrowUpRight size={16}/></Link>)}{node.files.map(file => <Link to={fileRoute(file.path)} className="folder-row" key={file.path}><FileCode2 size={16}/><span><strong>{baseName(file.path)}</strong><small>{fileNotes[file.path] || folderNotes[file.path] || (file.kind === 'submodule' ? 'Pinned external repository; integration boundary only.' : 'Open file details.')}</small></span><ArrowUpRight size={16}/></Link>)}</div></>;
}
let sourcePromise: Promise<Record<string, string>> | undefined;
export function loadSources() {
  sourcePromise ||= fetch(`${import.meta.env.BASE_URL}source-data.json`).then(response => {
    if (!response.ok) throw new Error(`Source snapshot could not be loaded (${response.status}).`);
    return response.json() as Promise<Record<string, string>>;
  }).catch(error => { sourcePromise = undefined; throw error; });
  return sourcePromise;
}
function FileView({ path, line }: { path: string; line?: number }) {
  const entry = sourceEntries.find(file => file.path === path);
  const [content, setContent] = useState<string | undefined>();
  const [error, setError] = useState('');
  useEffect(() => {
    setContent(undefined); setError('');
    if (!entry || entry.kind !== 'text') return;
    let active = true;
    loadSources().then(sources => { if (active) { if (!(path in sources)) setError('This file is missing from the source snapshot.'); else setContent(sources[path]); } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load the source snapshot.'); });
    return () => { active = false; };
  }, [path, entry]);
  useEffect(() => { if (content !== undefined && line) requestAnimationFrame(() => document.getElementById(`source-line-${line}`)?.scrollIntoView({ block: 'center' })); }, [content, line]);
  if (!entry) return <p>File not found. <Link to="/codemap">Return to the codemap.</Link></p>;
  const annotations = [
    ...modules.flatMap(module => module.files.filter(file => file.path === path).map(file => ({ line: file.line, label: file.label, note: file.note, chapter: module.title, href: `/module/${module.id}` }))),
    ...executionPaths.flatMap(trace => trace.steps.filter(step => step.path === path).map(step => ({ line: step.line, label: step.title, note: step.explanation, chapter: trace.title, href: `/execution/${trace.id}` }))),
    ...requestFlowStages.flatMap(stage => stage.code.filter(source => source.path === path).map(source => ({ line: source.line, label: source.label, note: stage.summary, chapter: 'Request flow', href: `/codemap/${stage.id}` }))),
    ...(symbolNotes[path] || []).map(note => ({ line: note.line, label: note.symbol, note: note.note, chapter: '', href: '' })),
  ];
  const annotatedSymbols = symbolNotes[path] || [];
  const lines = content?.split('\n');
  const type = entry.kind === 'submodule' ? 'VENDOR GITLINK' : entry.kind === 'binary' ? 'BINARY ASSET' : 'SOURCE FILE';
  return <><div className="map-breadcrumb"><Link to="/codemap">DeepInfer</Link><ChevronRight size={13}/><Link to={folderRoute(parentPath(path))}>{parentPath(path)}</Link><ChevronRight size={13}/><span>{baseName(path)}</span></div><div className="map-file-header"><span className="map-kind">{type}{entry.lines ? ` · ${entry.lines} LINES` : ''}{annotatedSymbols.length ? ` · ${annotatedSymbols.length} ANNOTATIONS` : ''}</span><h2>{path}</h2><p>{fileNotes[path] || folderNotes[path] || (entry.kind === 'submodule' ? 'A pinned external repository. This guide covers its integration boundary rather than its internals.' : 'No file-level annotation has been verified yet.')}</p><div className="map-file-actions"><a href={entry.kind === 'submodule' && entry.url && entry.object ? `${entry.url}/tree/${entry.object}` : sourceHref(path)} target="_blank" rel="noreferrer">Open pinned source <ArrowUpRight size={14}/></a>{entry.kind === 'submodule' && entry.object && <span>Gitlink {entry.object.slice(0, 12)}</span>}</div></div><Related path={path}/>{entry.kind === 'binary' && <p className="source-state">This binary asset is indexed but not embedded. Open it at the pinned source link above.</p>}{entry.kind === 'submodule' && <p className="source-state">The submodule internals are outside this guide’s scope; the pinned gitlink is recorded above.</p>}{entry.kind === 'text' && <>{annotatedSymbols.length > 0 && <details className="symbol-list annotated-symbols"><summary>Annotated source points <span>{annotatedSymbols.length}</span></summary><p>Open an annotation at its line in the pinned source.</p><div>{annotatedSymbols.map((note, index) => <Link key={`${note.line}-${index}`} to={fileRoute(path, note.line)}><span><strong>{note.symbol}</strong><br/>{note.note}</span><small>L{note.line}</small></Link>)}</div></details>}<div className="source-head"><div><span>PINNED SOURCE</span><strong>{baseName(path)}</strong></div><a href={sourceHref(path)} target="_blank" rel="noreferrer">View on GitHub <ArrowUpRight size={13}/></a></div>{error ? <p className="source-state">{error}</p> : lines ? <div className="full-source"><pre><code>{lines.map((text, index) => {
    const number = index + 1;
    const notes = annotations.filter(note => note.line === number);
    return <React.Fragment key={number}><span className={`full-source-line ${line === number ? 'line-selected' : ''}`} id={`source-line-${number}`}><Link to={fileRoute(path, number)} aria-label={`Link to line ${number}`}>{number}</Link><span>{text || ' '}</span></span>{notes.map((note, index) => <span className="inline-note" key={`${note.label}-${index}`}><strong>{note.label}</strong> {note.note} {note.href && <Link to={note.href}>{note.chapter} ↗</Link>}</span>)}</React.Fragment>;
  })}</code></pre></div> : <p className="source-state">Loading pinned source…</p>}{(entry.symbols?.length || 0) > 0 && <details className="symbol-list"><summary>Automatically indexed declarations <span>{entry.symbols?.length}</span></summary><p>Extracted declarations; open a line to inspect it in context.</p><div>{entry.symbols?.map((symbol, i) => <Link key={`${symbol.line}-${i}`} to={fileRoute(path, symbol.line)}><span>{symbol.kind} <strong>{symbol.name}</strong></span><small>L{symbol.line}</small></Link>)}</div></details>}</>}</>;
}

export function CodemapPage({ kind = 'overview', path = '.', line, flowStep }: { kind?: 'overview' | 'folder' | 'file'; path?: string; line?: number; flowStep?: string }) {
  const active = kind === 'overview' ? '.' : path;
  return <><div className="map-intro"><div className="section-label">THE COMPLETE CODEMAP · PINNED TO 774CE24</div><h1>Explore the source.</h1><p>Follow the runtime across the repository, then open any tracked file or folder. The map covers first-party source, tests, examples, configuration and assets; vendor projects are marked at their boundaries.</p><div className="map-intro-links"><Link to="/execution">Trace execution paths <ArrowRight size={15}/></Link><Link to="/source">Read the subsystem chapters <ArrowRight size={15}/></Link></div></div>{kind === 'overview' && <RequestFlowExplorer selected={flowStep} sourceRoute={fileRoute}/>}<div className="map-layout"><SourceTree active={active}/><article className="map-detail">{kind === 'file' ? <FileView path={path} line={line}/> : <FolderView path={active}/>}</article></div><div className="map-foot"><GitBranch size={14}/> Source snapshot <a href={`https://github.com/deepseek-ai/DeepInfer/commit/${revision}`} target="_blank" rel="noreferrer">774ce24 <ArrowUpRight size={12}/></a><span>·</span><a href="https://deepwiki.com/deepseek-ai/DeepInfer" target="_blank" rel="noreferrer">DeepWiki reference <ArrowDownRight size={12}/></a><span>·</span> The upstream source is authoritative.</div></>;
}
