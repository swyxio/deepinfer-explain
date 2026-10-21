import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Boxes, ChevronDown, CircleHelp, Clapperboard, Code2, Cpu, ExternalLink, FileCode2, GitBranch, Layers3, Map, Menu, Search, Workflow, X } from 'lucide-react';
import { modules, type Module, type SourceFile } from './modules';
import { comparisons, readings } from './research';
import snippets from './snippets.json';
import { CodemapPage, sourceEntries, fileRoute } from './codemap';
import { fileNotes, folderNotes } from './file-notes';
import { ArticleGuide, ExecutionGuide } from './guides';
import { readingForModule } from './connections';
import { requestFlowStages } from './request-flow';
import { articleSections } from './article-notes';
import { translationSectionLines } from './translation';
import { ModelSupportPage } from './model-support-page';
import { modelComparisons } from './model-support';
import { VisualStoriesPage } from './visual-stories';
import { visualStories } from './visual-stories-data';
import './style.css';

const REVISION = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const ROOT = `https://github.com/deepseek-ai/DeepInfer/blob/${REVISION}`;
const sourceUrl = (path: string, line?: number) => `${ROOT}/${path}${line ? `#L${line}` : ''}`;
const snippetMap = snippets as Record<string, { start: number; lines: string[] }>;

const navItems = [
  { id: 'overview', title: 'Annotated deployment', icon: Layers3 },
  { id: 'visuals', title: 'Five visual stories', icon: Clapperboard },
  { id: 'codemap', title: 'Code map', icon: Map },
  { id: 'models', title: 'Models & hardware', icon: Cpu },
  { id: 'execution', title: 'Execution paths', icon: Workflow },
  { id: 'source', title: 'Subsystem chapters', icon: Code2 },
  { id: 'system', title: 'The bigger system', icon: Boxes },
  { id: 'compare', title: 'Comparisons', icon: GitBranch },
  { id: 'research', title: 'Research library', icon: BookOpen },
];

function currentRoute() { return window.location.hash.slice(1) || 'overview'; }
function routeTo(route: string) { window.location.hash = route; }
function LinkOut({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={14} aria-hidden="true" /></a>;
}
function SourceLink({ path, line, children }: { path: string; line?: number; children?: React.ReactNode }) {
  return <LinkOut href={sourceUrl(path, line)}>{children || `${path}${line ? `:${line}` : ''}`}</LinkOut>;
}
function Brand() {
  return <a href="#overview" className="brand" aria-label="DeepInfer explained home"><span className="brand-mark"><span></span><span></span><span></span></span><span><strong>DeepInfer</strong><small>EXPLAINED</small></span></a>;
}
function Sidebar({ route, open, close, openSearch }: { route: string; open: boolean; close: () => void; openSearch: () => void }) {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  useEffect(() => { const media = window.matchMedia('(max-width: 760px)'); const update = () => setNarrow(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [open, close]);
  const selected = route.startsWith('module/') ? 'source' : route.startsWith('research/') ? 'research' : route.startsWith('file/') || route.startsWith('folder/') || route.startsWith('codemap/') ? 'codemap' : route.startsWith('execution/') ? 'execution' : route.startsWith('article/') ? 'overview' : route.startsWith('models/') ? 'models' : route.startsWith('visuals/') ? 'visuals' : route;
  return <><div className={`mobile-scrim ${open ? 'show' : ''}`} onClick={close}></div><aside id="guide-navigation" className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Guide navigation" aria-hidden={narrow && !open ? true : undefined} inert={narrow && !open ? true : undefined}>
    <div className="side-top"><Brand/><button className="icon-button close-menu" onClick={close} aria-label="Close navigation"><X size={20}/></button></div>
    <button className="search-trigger" onClick={() => { close(); openSearch(); }}><Search size={16}/><span>Search the guide</span><kbd>⌘ K</kbd></button>
    <div className="side-label">THE GUIDE</div>
    <nav className="side-nav">{navItems.map(({ id, title, icon: Icon }) => <a key={id} className={selected === id ? 'active' : ''} href={`#${id}`} onClick={close}><Icon size={17}/><span>{title}</span>{selected === id && <span className="nav-dot"/>}</a>)}</nav>
    <div className="side-divider" />
    <div className="side-label side-section-title">CODEBASE <span>{modules.length} chapters</span></div>
    <div className="module-nav">{modules.map((m) => <a key={m.id} href={`#module/${m.id}`} className={route === `module/${m.id}` ? 'active' : ''} onClick={close}><span className="module-nav-dot"/>{m.title}</a>)}</div>
    <div className="side-foot"><span className="status-dot"/> Based on <a href={`https://github.com/deepseek-ai/DeepInfer/commit/${REVISION}`} target="_blank" rel="noreferrer">774ce24</a><small>Independent guide · October 2026</small></div>
  </aside></>;
}
function Header({ route, menu, openMenu, openSearch }: { route: string; menu: boolean; openMenu: () => void; openSearch: () => void }) {
  const title = route.startsWith('module/') ? modules.find(m => m.id === route.split('/')[1])?.title || 'Code tour' : route.startsWith('research/') ? 'Research library' : route.startsWith('file/') || route.startsWith('folder/') || route.startsWith('codemap/') ? 'Code map' : route.startsWith('execution/') ? 'Execution paths' : route.startsWith('article/') ? 'Annotated deployment' : route.startsWith('models/') ? 'Models & hardware' : route.startsWith('visuals/') ? 'Five visual stories' : navItems.find(n => n.id === route)?.title || 'Guide';
  return <header className="topbar"><button className="icon-button menu-button" onClick={openMenu} aria-label="Open navigation" aria-expanded={menu} aria-controls="guide-navigation"><Menu size={20}/></button><div className="breadcrumbs"><span>DeepInfer explained</span><span className="crumb-sep">/</span><strong>{title}</strong></div><div className="top-actions"><button className="icon-button top-search" onClick={openSearch} aria-label="Search guide"><Search size={18}/></button><LinkOut href="https://github.com/deepseek-ai/DeepInfer" className="repo-link"><GitBranch size={15}/>View repository</LinkOut></div></header>;
}
function SearchDialog({ close }: { close: () => void }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const pages = navItems.map(n => ({ id: n.id, title: n.title, subtitle: 'Guide', text: n.title }));
    const code = modules.map(m => ({ id: `module/${m.id}`, title: m.title, subtitle: m.category, text: [m.title, m.summary, m.why, ...m.details, ...m.files.map(f => f.path)].join(' ') }));
    const papers = readings.map(r => ({ id: `research/${r.id}`, title: r.title, subtitle: 'Research library', text: [r.title, r.authors, r.description, r.relevance].join(' ') }));
    const flow = term ? requestFlowStages.map(stage => ({ id: `codemap/${stage.id}`, title: stage.title, subtitle: 'Request flow', text: [stage.title, stage.phase, stage.summary, stage.detail, ...stage.code.map(source => source.path)].join(' ') })) : [];
    const models = term ? modelComparisons.map(model => ({ id: `models/${model.id}`, title: model.name, subtitle: model.listed ? 'Listed model' : 'Architecture comparison', text: [model.name, model.family, model.scale, model.architecture, model.attention, model.summary].join(' ') })) : [];
    const visuals = term ? visualStories.map(story => ({ id: `visuals/${story.id}`, title: story.title, subtitle: 'Visual story', text: [story.title, story.hook, story.why, ...story.stages.map(stage => stage.caption)].join(' ') })) : [];
    const article = term ? articleSections.flatMap(section => [
      { id: `article/${section.id}`, title: section.title.replace(/^\d+ \/ /, ''), subtitle: 'Annotated translation', text: [section.title, section.intro, ...translationSectionLines(section.id).map(line => line.text)].join(' ') },
      ...section.annotations.map(note => ({ id: `article/${section.id}/${note.id}`, title: note.title, subtitle: 'Article annotation', text: [note.title, note.explanation, note.status].join(' ') })),
    ]) : [];
    const files = term ? sourceEntries.map(file => ({ id: fileRoute(file.path).slice(1), title: file.path, subtitle: file.kind === 'submodule' ? 'Vendor submodule' : file.kind === 'binary' ? 'Binary asset' : 'Source file', text: [file.path, fileNotes[file.path] || folderNotes[file.path] || '', ...(file.symbols || []).map(symbol => symbol.name)].join(' ') })) : [];
    const gitlinks = new Set(sourceEntries.filter(entry => entry.kind === 'submodule').map(entry => entry.path));
    const folders = term ? Object.entries(folderNotes).filter(([path]) => !gitlinks.has(path)).map(([path, note]) => ({ id: path === '.' ? 'codemap' : `folder/${encodeURIComponent(path)}`, title: `${path}/`, subtitle: 'Source folder', text: `${path} ${note}` })) : [];
    return [...pages, ...visuals, ...models, ...article, ...flow, ...code, ...papers, ...folders, ...files].filter(x => !term || x.text.toLowerCase().includes(term)).slice(0, 12);
  }, [term]);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [close]);
  return <div className="dialog-backdrop" onClick={close}><div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search the guide" onClick={e => e.stopPropagation()}><div className="search-input-wrap"><Search size={20}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search components, concepts, papers…" aria-label="Search components, concepts, and papers"/><button className="icon-button" onClick={close} aria-label="Close search"><X size={19}/></button></div><div className="search-results"><div className="search-caption">{term ? `${matches.length} matching results` : 'Explore the guide'}</div>{matches.length ? matches.map((x, i) => <a href={`#${x.id}`} onClick={close} key={`${x.title}-${i}`}><span><strong>{x.title}</strong><small>{x.subtitle}</small></span><ArrowRight size={16}/></a>) : <p className="no-results">No results for “{query}”. Try a component, paper, or source path.</p>}</div><div className="search-footer">Press Esc to close</div></div></div>;
}
function Eyebrow({ children }: {children: React.ReactNode}) { return <div className="eyebrow"><span/> {children}</div>; }
function SectionHeading({ label, title, description, action }: {label: string; title: string; description?: string; action?: React.ReactNode}) { return <div className="section-heading"><div><div className="section-label">{label}</div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }
function PageIntro({ section, title, intro }: { section: string; title: string; intro: string }) { return <div className="page-intro"><Eyebrow>{section}</Eyebrow><h1>{title}</h1><p>{intro}</p></div>; }
function Pill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: string }) { return <span className={`pill ${tone}`}>{children}</span>; }

function SourceTour() {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(modules.map(m => m.category))];
  const filtered = filter === 'All' ? modules : modules.filter(m => m.category === filter);
  return <><PageIntro section="THE CODE TOUR" title="A map of the machinery." intro="Start anywhere. Each chapter explains what a component does, why it exists, and where to read the implementation at the pinned revision."/><div className="intro-callout"><Code2 size={19}/><p><strong>Read with the source open.</strong> Each chapter links directly to the relevant lines and includes short excerpts with annotations.</p></div><div className="filter-row" aria-label="Filter code chapters">{categories.map(c => <button key={c} className={filter === c ? 'chosen' : ''} onClick={() => setFilter(c)} aria-pressed={filter === c}>{c}</button>)}</div><div className="chapter-list">{filtered.map((m, i) => <a href={`#module/${m.id}`} className="chapter-row" key={m.id}><span className="chapter-num">{String(modules.indexOf(m) + 1).padStart(2, '0')}</span><div className="chapter-main"><div className="chapter-category">{m.category}</div><h3>{m.title}</h3><p>{m.summary}</p></div><div className="chapter-right"><span>{m.files.length} source points</span><ArrowUpRight size={19}/></div><span className="sr-only">Chapter {i + 1}</span></a>)}</div><div className="source-note">The chapters explain major subsystems. The codemap indexes every first-party file and folder; vendor submodules are documented at their integration boundaries.</div></>;
}
function FileExcerpt({ file }: { file: SourceFile }) {
  const snippet = snippetMap[`${file.path}:${file.line}`];
  return <details className="file-card"><summary><span className="file-icon"><FileCode2 size={18}/></span><span className="file-copy"><strong>{file.label}</strong><small>{file.path}:{file.line}</small></span><ChevronDown size={17} className="file-chevron"/></summary><div className="file-body"><p>{file.note}</p>{snippet && <div className="code-wrap"><div className="code-head"><span>Source excerpt</span><a href={fileRoute(file.path, file.line)}>Open full annotated file <ArrowUpRight size={14}/></a></div><pre><code>{snippet.lines.map((line, index) => <span className="code-line" key={index}><a href={sourceUrl(file.path, snippet.start + index)} target="_blank" rel="noreferrer">{snippet.start + index}</a><span>{line || ' '}</span></span>)}</code></pre></div>}{!snippet && <SourceLink path={file.path} line={file.line}>Open source</SourceLink>}</div></details>;
}
function ModulePage({ item }: { item: Module }) {
  const related = item.related.map(id => modules.find(m => m.id === id)).filter((m): m is Module => Boolean(m));
  const relatedReadings = (readingForModule[item.id] || []).map(id => readings.find(r => r.id === id)).filter((r): r is typeof readings[number] => Boolean(r));
  const index = modules.indexOf(item);
  const next = modules[index + 1];
  return <><a className="back-link" href="#source"><ArrowLeft size={15}/> All chapters</a><div className="module-intro"><div className="section-label">{item.category} <span>/</span> CHAPTER {String(index + 1).padStart(2,'0')}</div><h1>{item.title}</h1><p>{item.summary}</p></div><div className="module-layout"><article className="module-article"><div className="why-block"><span>WHY IT MATTERS</span><p>{item.why}</p></div><h2>How it works</h2>{item.details.map((p, i) => <p className="article-p" key={i}>{p}</p>)}<div className="article-section-head"><h2>Read the implementation</h2><span>{item.files.length} source points</span></div><p className="article-p">Open an annotation to inspect a short excerpt, then follow the line numbers into the repository.</p><div className="files-list">{item.files.map(f => <FileExcerpt key={`${f.path}:${f.line}`} file={f}/>)}</div>{relatedReadings.length > 0 && <><h2 className="related-heading">Research behind this chapter</h2><div className="chapter-readings">{relatedReadings.map(r => <a href={`#research/${r.id}`} key={r.id}><span><small>{r.kind} · {r.year}</small><strong>{r.title}</strong></span><ArrowUpRight size={17}/></a>)}</div></>}{related.length > 0 && <><h2 className="related-heading">Continue exploring</h2><div className="related-list">{related.map(m => <a key={m.id} href={`#module/${m.id}`}><span><small>{m.category}</small><strong>{m.title}</strong></span><ArrowUpRight size={18}/></a>)}</div></>}{next && <a className="next-chapter" href={`#module/${next.id}`}><span><small>NEXT CHAPTER</small><strong>{next.title}</strong></span><ArrowRight size={20}/></a>}</article><aside className="article-aside"><div className="aside-sticky"><span>IN THIS CHAPTER</span><a href="#" onClick={e => {e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});}}>Overview</a><a href={sourceUrl(item.files[0]?.path || 'README.md', item.files[0]?.line)} target="_blank" rel="noreferrer">First source point <ExternalLink size={12}/></a><div className="aside-rule"/><p>Every source link is pinned to the revision used for this guide.</p><a href={`https://github.com/deepseek-ai/DeepInfer/commit/${REVISION}`} target="_blank" rel="noreferrer">774ce24 <ArrowUpRight size={13}/></a></div></aside></div></>;
}
function SystemPage() {
  return <><PageIntro section="THE BIGGER SYSTEM" title="An engine inside a larger system." intro="DeepSeek’s deployment Q&A describes the production service around DeepInfer. It is useful context, but it is not a list of components shipped in this repository."/><div className="system-diagram"><div className="diagram-label">PRODUCTION ARCHITECTURE · CONCEPTUAL</div><div className="system-flow"><div><span>01</span><strong>Request & routing</strong><small>Protocol, tokenization, load balancing</small></div><ArrowRight className="diagram-arrow" size={20}/><div><span>02</span><strong>Vision / prefill</strong><small>Encode images and process input</small></div><ArrowRight className="diagram-arrow" size={20}/><div><span>03</span><strong>Decode</strong><small>Generate output tokens</small></div></div><div className="cache-strip"><span className="cache-dots">•••</span><div><strong>Shared KV storage</strong><small>Reuse previous computation across requests</small></div><Pill tone="white">Described in Q&amp;A</Pill></div><div className="diagram-caption">A simplified view of the architecture described by DeepSeek; arrows do not depict every data path.</div></div><div className="system-columns"><div><Pill>RELEASED ENGINE</Pill><h2>What you can inspect</h2><p>The repository exposes the offline LLM entry point, C++ scheduling, workers, model runtime, cache layouts, expert balancing and specialized kernels. It supports NVIDIA SM100 and Ascend 950.</p><SourceLink path="README.md" line={3}>Repository README</SourceLink></div><div><Pill tone="sand">PRODUCTION CONTEXT</Pill><h2>What sits around it</h2><p>The release does not include a complete persistent KV cache system, VE/prefill/decode disaggregation, or load balancing across data-parallel replicas. The Q&amp;A describes these operational systems.</p><SourceLink path="README.md" line={38}>Release boundaries</SourceLink></div></div><div className="system-long"><SectionHeading label="DESIGN CHOICES" title="Why split the work?"/><div className="explain-row"><span>01</span><div><h3>Different phases, different constraints</h3><p>Prefill and decode have different compute, bandwidth and latency profiles. Disaggregation lets an operator allocate and scale resources for each separately; it also introduces routing and state-transfer costs.</p></div></div><div className="explain-row"><span>02</span><div><h3>Share expensive context</h3><p>DeepSeek describes persistent block KV storage on a dedicated 3FS cluster, with sliding-window state handled separately. This system is production context, not an included cache service.</p></div></div><div className="explain-row"><span>03</span><div><h3>Keep experts balanced</h3><p>Mixture-of-experts routing is uneven. The Q&amp;A describes redundant experts and periodic placement updates to reduce slow-rank bottlenecks; the release includes expert balancing code.</p></div></div><div className="source-callout"><span>PRIMARY SOURCE</span><p>For the details, including cache tiers, Wide-EP and scheduling, read DeepSeek’s own deployment Q&amp;A.</p><SourceLink path="doc/inference_deployment_qa.md" line={23}>Open deployment Q&amp;A</SourceLink></div></div><div className="claim-box"><span>READING THE ANNOUNCEMENT</span><h2>Big numbers need their context.</h2><p>DeepSeek reports 155 trillion tokens per day per cluster and $38 of revenue per GPU-hour at valley pricing for its production service. These are company claims, not independent measurements of this open-source release. In his post, swyx uses an estimated $5–$10 per GPU-hour cost to suggest an approximately 80% serving margin. That is illustrative arithmetic: the actual cost basis and other expenses are not established by the announcement, so it is not a verified profit margin.</p><div className="link-group"><LinkOut href="https://x.com/deepseek_ai/status/2112476496283775135">DeepSeek’s post</LinkOut><LinkOut href="https://x.com/swyx/status/2112587397380943953">swyx’s post</LinkOut><SourceLink path="doc/inference_deployment_qa.md" line={17}>DeepSeek’s Q&amp;A</SourceLink></div></div></>;
}
function ComparePage() {
  const categories = [...new Set(comparisons.map(c => c.category))];
  return <><PageIntro section="COMPARISONS" title="Put the choices in context." intro="Models and inference engines solve different problems. These comparisons focus on architectural choices and intended workloads, not a universal speed ranking."/><div className="intro-callout"><CircleHelp size={19}/><p><strong>Compare like with like.</strong> Model capabilities, kernel performance and whole-service throughput are different measurements. Hardware, batch size, context and workload all matter.</p></div>{categories.map(cat => <section className="comparison-section" key={cat}><SectionHeading label={cat.toUpperCase()} title={cat === 'Model' ? 'Model architecture' : cat === 'Inference engine' ? 'Serving systems' : cat}/><div className="comparison-table"><div className="comparison-header"><span>Project</span><span>Design & context</span><span>Relation to DeepInfer</span></div>{comparisons.filter(c => c.category === cat).map(c => <div className="comparison-row" key={c.name}><div><strong>{c.name}</strong><small>{c.focus}</small><LinkOut href={c.source}>Primary source</LinkOut></div><p>{c.design}</p><p>{c.contrast}</p></div>)}</div></section>)}<div className="source-callout"><span>BENCHMARK CAUTION</span><p>DeepInfer’s published prefill and decode curves use different configurations: 4 and 64 SM100 GPUs respectively. Its benchmark documentation also describes decode throughput under a full-acceptance assumption for draft tokens. Neither is a direct cross-engine benchmark.</p><SourceLink path="examples/README.md" line={35}>Read the benchmark methodology</SourceLink></div></>;
}
function ResearchPage({ target }: { target?: string }) {
  const [filter, setFilter] = useState('All');
  useEffect(() => { if (target) requestAnimationFrame(() => document.getElementById(`reading-${target}`)?.scrollIntoView({ block: 'center' })); }, [target]);
  const kinds = ['All', ...new Set(readings.map(r => r.kind))];
  const shown = filter === 'All' ? readings : readings.filter(r => r.kind === filter);
  return <><PageIntro section="RESEARCH LIBRARY" title="Follow the ideas upstream." intro="A reading list for the model, the runtime and the systems around it. Each entry explains why the source matters to this particular codebase."/><div className="filter-row" aria-label="Filter research library">{kinds.map(k => <button key={k} className={filter === k ? 'chosen' : ''} onClick={() => setFilter(k)} aria-pressed={filter === k}>{k}</button>)}</div><div className="reading-list">{shown.map(r => <article className="reading-row" id={`reading-${r.id}`} key={r.id}><div className="reading-year">{r.year}</div><div><div className="reading-kind">{r.kind}</div><h3><a href={r.url} target="_blank" rel="noreferrer">{r.title} <ArrowUpRight size={17}/></a></h3><div className="reading-authors">{r.authors}</div><p>{r.description}</p><div className="reading-relevance"><strong>Why read it</strong> {r.relevance}</div></div><BookOpen size={19} className="reading-icon"/></article>)}</div><div className="source-note">Papers explain ideas and reported experiments; a paper’s results do not by themselves prove the behavior or performance of this release.</div></>;
}
function App() {
  const [route, setRoute] = useState(currentRoute);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => { const update = (event: HashChangeEvent) => { setRoute(currentRoute()); const sameExplorer = (prefix: string) => [event.oldURL, event.newURL].every(url => new RegExp(`^#${prefix}(?:/[^/]+)?$`).test(new URL(url).hash)); if (!sameExplorer('codemap') && !sameExplorer('models') && !sameExplorer('visuals')) window.scrollTo(0, 0); }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const module = route.startsWith('module/') ? modules.find(m => m.id === route.slice(7)) : undefined;
  let body: React.ReactNode;
  const decode = (value: string) => { try { return decodeURIComponent(value); } catch { return value; } };
  const fileParts = route.startsWith('file/') ? route.slice(5).split('/') : [];
  const line = fileParts[1]?.match(/^L([1-9]\d*)$/)?.[1];
  if (module) body = <ModulePage key={module.id} item={module}/>;
  else if (route === 'codemap' || route.startsWith('codemap/')) body = <CodemapPage flowStep={route.split('/')[1]}/>;
  else if (route === 'models' || route.startsWith('models/')) body = <ModelSupportPage target={route.split('/')[1]}/>;
  else if (route === 'visuals' || route.startsWith('visuals/')) body = <VisualStoriesPage target={route.split('/')[1]}/>;
  else if (route.startsWith('folder/')) body = <CodemapPage kind="folder" path={decode(route.slice(7))}/>;
  else if (route.startsWith('file/')) body = <CodemapPage kind="file" path={decode(fileParts[0])} line={line ? Number(line) : undefined}/>;
  else if (route === 'execution' || route.startsWith('execution/')) body = <ExecutionGuide target={route.split('/')[1]}/>;
  else if (route === 'source') body = <SourceTour/>;
  else if (route === 'system') body = <SystemPage/>;
  else if (route === 'compare') body = <ComparePage/>;
  else if (route === 'research' || route.startsWith('research/')) body = <ResearchPage key={route} target={route.split('/')[1]}/>;
  else if (route === 'overview' || route.startsWith('article/')) body = <ArticleGuide section={route.split('/')[1]} annotation={route.split('/')[2]}/>;
  else body = <div className="not-found"><PageIntro section="NOT FOUND" title="That chapter isn’t here." intro="Return to the code tour to find a component."/><button className="button primary" onClick={() => routeTo('source')}>Explore the code <ArrowRight size={17}/></button></div>;
  return <div className="app-shell"><Sidebar route={route} open={menu} close={() => setMenu(false)} openSearch={() => setSearch(true)}/><div className="main-shell"><Header route={route} menu={menu} openMenu={() => setMenu(true)} openSearch={() => setSearch(true)}/><main className={`content ${route === 'overview' ? 'overview-content' : ''}`}>{body}<footer className="footer"><span>DeepInfer, explained <span>·</span> An independent field guide <span>·</span> <a href="./DEEPINFER-LICENSE.txt">Source: Apache 2.0</a></span><a href="https://github.com/deepseek-ai/DeepInfer" target="_blank" rel="noreferrer">Source repository <ArrowDownRight size={14}/></a></footer></main></div>{search && <SearchDialog close={() => setSearch(false)}/>}</div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
