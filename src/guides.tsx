import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Code2, GitBranch, Layers3 } from 'lucide-react';
import { articleSections, articleSource, type ArticleLink } from './article-notes';
import { executionPaths } from './execution-paths';
import { modules } from './modules';
import { fileRoute, loadSources } from './codemap';
import './guides.css';

const revision = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const repoPrefix = `https://github.com/deepseek-ai/DeepInfer/blob/${revision}/`;
function EvidenceLink({ item }: { item: ArticleLink }) {
  if (item.url.startsWith(repoPrefix)) {
    const [path, hash] = item.url.slice(repoPrefix.length).split('#L');
    const line = hash ? Number(hash) : undefined;
    return <a href={fileRoute(path, line)}>{item.label} <ArrowUpRight size={12}/></a>;
  }
  return <a href={item.url} target="_blank" rel="noreferrer">{item.label} <ArrowUpRight size={12}/></a>;
}
function LinkGroup({ title, items }: { title: string; items: ArticleLink[] }) {
  if (!items.length) return null;
  return <div className="annotation-links"><span>{title}</span>{items.map((item, i) => <EvidenceLink key={`${item.url}-${i}`} item={item}/>)}</div>;
}
export function ArticleGuide({ section, annotation }: { section?: string; annotation?: string }) {
  useEffect(() => { if (!section) return; requestAnimationFrame(() => { const node = document.getElementById(`article-section-${section}`) as HTMLDetailsElement | null; if (node) { node.open = true; (annotation ? document.getElementById(`annotation-${annotation}`) : node)?.scrollIntoView({ block: 'start' }); } }); }, [section, annotation]);
  return <><section className="article-hero"><div className="article-hero-copy"><div className="article-eyebrow"><span/> AN ANNOTATED READING</div><h1>Inside DeepSeek’s<br/><em>inference system.</em></h1><p>Start with Latent Space’s English translation of DeepSeek’s deployment article. Follow each idea into the released code, related research and other approaches.</p><div className="article-hero-actions"><a href="https://x.com/latentspacepod/status/2112588380416647205" target="_blank" rel="noreferrer" className="button primary">Read the article <ArrowUpRight size={16}/></a><a href="#codemap">Explore the codemap <ArrowRight size={15}/></a></div><div className="article-hero-meta">SOURCE-TRACED AT <a href={`https://github.com/deepseek-ai/DeepInfer/commit/${revision}`} target="_blank" rel="noreferrer">774ce24</a> <span>·</span> NO ACCELERATOR RUN</div></div><div className="article-art" aria-hidden="true"><span className="art-kicker">A READING MAP</span><div className="art-stack"><div><span>01</span> Production architecture</div><div><span>02</span> Runtime & model</div><div><span>03</span> Cache & scheduling</div><div><span>04</span> Research & alternatives</div></div><span className="art-foot">ARTICLE → CODE → CONTEXT</span></div></section><div className="article-source"><BookOpen size={18}/><div><strong>{articleSource.title}</strong><p>{articleSource.note}</p><div>{articleSource.links.map((item, i) => <EvidenceLink item={item} key={`${item.url}-${i}`}/>)}</div></div></div><section className="article-index"><div className="guide-heading"><div><span>THE DEPLOYMENT ARTICLE</span><h2>Read it, section by section.</h2><p>These annotations follow the article’s structure. Expand a section for its claims, implementation boundaries, source links and comparisons.</p></div><small>{articleSections.length} SECTIONS</small></div><div className="article-sections">{articleSections.map((section, sectionIndex) => <details className="article-section" key={section.id} id={`article-section-${section.id}`} open={sectionIndex === 0 || undefined}><summary><span className="article-section-number">{String(sectionIndex + 1).padStart(2, '0')}</span><span className="article-section-title"><strong>{section.title.replace(/^\d+ \/ /, '')}</strong><small>{section.intro}</small></span><span className="article-section-count">{section.annotations.length} notes</span><ChevronDown size={17}/></summary><div className="article-annotations">{section.annotations.map(note => <article className="annotation" key={note.id} id={`annotation-${note.id}`}><div className="annotation-heading"><h3>{note.title}</h3><span>{note.status}</span></div><p>{note.explanation}</p><LinkGroup title="EVIDENCE" items={note.evidence}/><LinkGroup title="IN THE RELEASE" items={note.code}/><LinkGroup title="RESEARCH & COMPARISONS" items={note.related}/></article>)}</div></details>)}</div></section><section className="guide-next"><div><span>CONTINUE INTO THE CODE</span><h2>See how the pieces connect.</h2><p>Open a file, browse its folder, or follow a source-traced execution path.</p></div><div><a href="#codemap"><Layers3 size={16}/> Codemap <ArrowRight size={15}/></a><a href="#execution"><GitBranch size={16}/> Execution paths <ArrowRight size={15}/></a></div></section></>;
}

const questions: Record<string, string> = {
  'offline-setup': 'How does an offline example become a loaded engine?',
  'offline-generate': 'How does a prompt become generated output?',
  'prefill-decode-scheduling': 'How does the scheduler choose prefill or decode?',
  'model-attention': 'How does a batch move through the model and attention?',
  'expert-routing': 'How are tokens routed through experts?',
  'cache-yoco': 'How are cache blocks allocated and YOCO replayed?',
  'speculative-verification': 'How are drafts proposed and verified?',
  'image-input': 'How does an image reach the language model?',
  'grammar-constraint': 'How does a grammar constrain the next token?',
  'platform-selection': 'How is the execution backend selected?',
};
function CodePreview({ path, line, sources }: { path: string; line: number; sources?: Record<string, string> }) {
  const source = sources?.[path];
  if (source === undefined) return <div className="trace-preview-state">{sources ? 'Source preview unavailable.' : 'Loading source preview…'}</div>;
  const lines = source.split('\n').slice(line - 1, line + 5);
  return <pre className="trace-preview"><code>{lines.map((text, i) => <span key={i}><i>{line + i}</i>{text || ' '}</span>)}</code></pre>;
}
export function ExecutionGuide({ target }: { target?: string }) {
  const [sources, setSources] = useState<Record<string, string>>();
  const [loadError, setLoadError] = useState(false);
  useEffect(() => { let active = true; loadSources().then(data => { if (active) setSources(data); }).catch(() => { if (active) setLoadError(true); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!target) return; requestAnimationFrame(() => { const node = document.getElementById(`trace-${target}`) as HTMLDetailsElement | null; if (node) { node.open = true; node.scrollIntoView({ block: 'start' }); } }); }, [target]);
  return <><div className="execution-intro"><div className="section-label">FOLLOW THE CODE · 10 SOURCE TRACES</div><h1>What happens when<br/>the engine runs?</h1><p>These are static traces through the pinned release, organized as question-led code maps. Each numbered card points to the actual file and line; conditions explain which branches apply.</p><div className="execution-evidence"><Code2 size={17}/><span><strong>Evidence:</strong> Source inspection, not an accelerator execution trace. Production-only services are labeled separately.</span></div><a href="#codemap">Browse the full source tree <ArrowRight size={15}/></a></div><div className="execution-layout"><article><div className="trace-list">{executionPaths.map((path, pathIndex) => <details className="trace-section" key={path.id} id={`trace-${path.id}`} open={pathIndex === 0 || undefined}><summary><span className="trace-index">{String(pathIndex + 1).padStart(2, '0')}</span><span><strong>{questions[path.id] || path.title}</strong><small>{path.summary}</small></span><ChevronDown size={18}/></summary><div className="trace-body"><div className="trace-motivation"><span>MOTIVATION</span><p>{path.summary}</p></div><div className="trace-conditions"><span>CONDITIONS & BOUNDARIES</span><ul>{path.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul></div><div className="trace-flow-label">CODE MAP · {path.steps.length} SOURCE POINTS</div><div className="trace-steps">{path.steps.map((step, index) => <React.Fragment key={`${step.path}:${step.line}`}><div className="trace-step"><div className="trace-step-heading"><div><span>[{pathIndex + 1}{String.fromCharCode(97 + index)}]</span><h3>{step.title}</h3></div><a href={fileRoute(step.path, step.line)}>Open file <ArrowUpRight size={13}/></a></div><p>{step.explanation}</p><a className="trace-source-path" href={fileRoute(step.path, step.line)}>{step.path}:{step.line} <ArrowUpRight size={12}/></a><CodePreview path={step.path} line={step.line} sources={loadError ? {} : sources}/></div>{index < path.steps.length - 1 && <div className="trace-arrow"><ArrowDown size={15}/></div>}</React.Fragment>)}</div><div className="trace-related"><span>RELATED CHAPTERS</span><div>{path.related.map(id => modules.find(module => module.id === id)).filter((item): item is typeof modules[number] => Boolean(item)).map(item => <a href={`#module/${item.id}`} key={item.id}>{item.title} <ArrowUpRight size={12}/></a>)}</div></div></div></details>)}</div></article><aside className="execution-aside"><div><span>ON THIS PAGE</span>{executionPaths.map((path, i) => <button key={path.id} onClick={() => { const node = document.getElementById(`trace-${path.id}`) as HTMLDetailsElement | null; if (node) { node.open = true; node.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}>{String(i + 1).padStart(2, '0')} {path.title}</button>)}</div></aside></div></>;
}
