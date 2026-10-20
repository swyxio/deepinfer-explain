import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Code2, GitBranch, Layers3 } from 'lucide-react';
import { articleSections, articleSource, type ArticleLink } from './article-notes';
import { articleReading, articleContext, additionalArticleClaims } from './article-reading';
import { ArticleDiagram } from './article-diagrams';
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
  useEffect(() => {
    if (!section) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(annotation ? `annotation-${annotation}` : `article-section-${section}`);
      (target || document.getElementById(`article-section-${section}`))?.scrollIntoView({ block: 'start' });
    });
  }, [section, annotation]);

  return <>
    <section className="article-hero reading-hero">
      <div className="article-hero-copy">
        <div className="article-eyebrow"><span/> AN ANNOTATED READING</div>
        <h1>Inside DeepSeek’s<br/><em>inference system.</em></h1>
        <p>A source-linked guide to the deployment article, from production architecture to the code and research behind each idea.</p>
        <div className="article-hero-actions">
          <a href={articleSource.links[0].url} target="_blank" rel="noreferrer" className="button primary">Read the translation <ArrowUpRight size={16}/></a>
          <a href="#codemap">Explore the codemap <ArrowRight size={15}/></a>
        </div>
        <div className="article-hero-meta">SOURCE-TRACED AT <a href={`https://github.com/deepseek-ai/DeepInfer/commit/${revision}`} target="_blank" rel="noreferrer">774ce24</a> <span>·</span> NO ACCELERATOR RUN</div>
      </div>
    </section>
    <div className="article-source"><BookOpen size={18}/><div>
      <strong>{articleSource.title}</strong><p>{articleSource.note}</p>
      <div>{articleSource.links.map((item, i) => <EvidenceLink item={item} key={`${item.url}-${i}`}/>)}</div>
    </div></div>
    <details className="reading-mobile-toc"><summary>In this reading <ChevronDown size={16}/></summary><nav aria-label="Article contents">{articleSections.map((item, i) => <a key={item.id} href={`#article/${item.id}`}><small>{String(i + 1).padStart(2, '0')}</small>{item.title.replace(/^\d+ \/ /, '')}</a>)}</nav></details>
    <div className="reading-layout">
      <article className="article-index">
        <div className="guide-heading"><div><span>THE DEPLOYMENT ARTICLE</span><h2>A guided reading.</h2><p>Read straight through, follow a highlighted claim, or jump into the source and research beside each idea.</p></div></div>
        <div className="article-sections">{articleSections.map((item, sectionIndex) => {
          const reading = articleReading[item.id];
          return <section className="reading-section" key={item.id} id={`article-section-${item.id}`}>
            <div className="reading-section-header"><span>{String(sectionIndex + 1).padStart(2, '0')} / {String(articleSections.length).padStart(2, '0')}</span><h2>{item.title.replace(/^\d+ \/ /, '')}</h2><p>{item.intro}</p></div>
            {reading?.opening.map((paragraph, index) => <p className="reading-prose" key={index}>{paragraph}</p>)}
            <ArticleDiagram sectionId={item.id}/>
            <div className="reading-entries">{item.annotations.map(note => <section className="reading-entry" key={note.id} id={`annotation-${note.id}`}>
              <h3>{note.title} <a className="reading-anchor" aria-label={`Link to ${note.title}`} href={`#article/${item.id}/${note.id}`}>#</a></h3>
              {articleContext[note.id] && <p className="reading-prose">{articleContext[note.id]}</p>}
              <p className="reading-prose">{note.explanation}</p>
              {(reading?.claim.annotationId === note.id || additionalArticleClaims[note.id]) && <aside className="reading-claim"><span>CORE ASSERTION</span><p><mark>{reading?.claim.annotationId === note.id ? reading.claim.text : additionalArticleClaims[note.id]}</mark></p></aside>}
              <div className="reading-evidence"><div className="reading-evidence-label">ANNOTATION <span>·</span> {note.status}</div>
                <LinkGroup title="SOURCE" items={note.evidence}/>
                <LinkGroup title="CODE" items={note.code}/>
                <LinkGroup title="RESEARCH" items={note.related}/>
              </div>
            </section>)}</div>
          </section>;
        })}</div>
      </article>
      <aside className="reading-toc" aria-label="Article contents"><div><span>IN THIS READING</span>{articleSections.map((item, i) => <a key={item.id} href={`#article/${item.id}`}><small>{String(i + 1).padStart(2, '0')}</small>{item.title.replace(/^\d+ \/ /, '')}</a>)}<a className="reading-toc-source" href={articleSource.links[0].url} target="_blank" rel="noreferrer">Original translation <ArrowUpRight size={12}/></a></div></aside>
    </div>
    <section className="guide-next"><div><span>CONTINUE INTO THE CODE</span><h2>See how the pieces connect.</h2><p>Open a file, browse its folder, or follow a source-traced execution path.</p></div><div><a href="#codemap"><Layers3 size={16}/> Codemap <ArrowRight size={15}/></a><a href="#execution"><GitBranch size={16}/> Execution paths <ArrowRight size={15}/></a></div></section>
  </>;
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
