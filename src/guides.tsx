import { Link } from 'react-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Code2, GitBranch, Layers3 } from 'lucide-react';
import { articleSections, articleSource, type ArticleLink } from './article-notes';
import { translationSections, translationSectionLines, translationHeadings, translationSubheadings, translationAnnotations, translationHighlights, translationDiagrams, translationFigures } from './translation';
import { ArticleDiagram } from './article-diagrams';
import { executionPaths } from './execution-paths';
import { modules } from './modules';
import { fileRoute, loadSources } from './codemap';
import './guides.css';
import './translation.css';

const revision = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const repoPrefix = `https://github.com/deepseek-ai/DeepInfer/blob/${revision}/`;
const translationNoteById = new Map(articleSections.flatMap(section => section.annotations).map(note => [note.id, note]));
const translationNoteNumbers = new Map(Object.values(translationAnnotations).flat().map((id, index) => [id, index + 1]));
function EvidenceLink({ item }: { item: ArticleLink }) {
  if (item.url.startsWith(repoPrefix)) {
    const [path, hash] = item.url.slice(repoPrefix.length).split('#L');
    const line = hash ? Number(hash) : undefined;
    return <Link to={fileRoute(path, line)}>{item.label} <ArrowUpRight size={12}/></Link>;
  }
  return <a href={item.url} target="_blank" rel="noreferrer">{item.label} <ArrowUpRight size={12}/></a>;
}
function LinkGroup({ title, items }: { title: string; items: ArticleLink[] }) {
  if (!items.length) return null;
  return <div className="annotation-links"><span>{title}</span>{items.map((item, i) => <EvidenceLink key={`${item.url}-${i}`} item={item}/>)}</div>;
}
function OriginalText({ text, highlights = [], noteTriggers }: { text: string; highlights?: string[]; noteTriggers?: React.ReactNode }) {
  const segments: { start: number; end: number; kind: 'highlight' | 'link' }[] = [];
  for (const highlight of highlights) {
    const start = text.indexOf(highlight);
    if (start >= 0) segments.push({ start, end: start + highlight.length, kind: 'highlight' });
  }
  for (const match of text.matchAll(/https?:\/\/[^\s]+/g)) {
    const url = match[0].replace(/[.,;:]+$/, '');
    segments.push({ start: match.index, end: match.index + url.length, kind: 'link' });
  }
  segments.sort((a, b) => a.start - b.start);
  const lastHighlight = segments.filter(segment => segment.kind === 'highlight').at(-1)?.start;
  let cursor = 0;
  const parts: React.ReactNode[] = [];
  for (const segment of segments) {
    if (segment.start < cursor) continue;
    parts.push(text.slice(cursor, segment.start));
    const value = text.slice(segment.start, segment.end);
    parts.push(segment.kind === 'highlight' ? <mark key={segment.start}>{value}</mark> : <a key={segment.start} href={value} target="_blank" rel="noreferrer">{value}</a>);
    if (segment.start === lastHighlight) parts.push(noteTriggers);
    cursor = segment.end;
  }
  const tail = text.slice(cursor);
  const lastWord = lastHighlight === undefined && React.Children.count(noteTriggers) > 0 ? tail.match(/\S+\s*$/) : null;
  if (lastWord && lastWord[0].trim().length <= 32) {
    parts.push(tail.slice(0, lastWord.index), <span className="translation-marker-anchor" key="note-anchor">{lastWord[0]}{noteTriggers}</span>);
  } else {
    parts.push(tail);
    if (lastHighlight === undefined) parts.push(noteTriggers);
  }
  return <>{parts}</>;
}

function CacheHitCalculator() {
  const [length, setLength] = useState(32768);
  const [available, setAvailable] = useState(16384);
  const [hasSwa, setHasSwa] = useState(true);
  const cap = Math.max(0, length - 134);
  const blockHit = Math.floor(Math.min(cap, available) / 128) * 128;
  const hit = hasSwa ? blockHit : Math.max(0, blockHit - 128);
  const number = (value: string) => Math.max(0, Math.floor(Number(value) || 0));
  return <div className="translation-calculator">
    <p>Illustrate the article’s hit rule, assuming the available prefix consists of contiguous 128-token blocks.</p>
    <div className="translation-calculator-inputs">
      <label>Input tokens <input type="number" min="0" step="128" value={length} onChange={event => setLength(number(event.target.value))}/></label>
      <label>Available prefix tokens <input type="number" min="0" step="128" value={available} onChange={event => setAvailable(number(event.target.value))}/></label>
      <label className="translation-check"><input type="checkbox" checked={hasSwa} onChange={event => setHasSwa(event.target.checked)}/> SWA state available</label>
    </div>
    <output><strong>{hit.toLocaleString()} tokens reused</strong><span>Block hit: {blockHit.toLocaleString()} · cap: {cap.toLocaleString()}{!hasSwa && blockHit > 0 ? ' · 128-token replay' : ''}</span></output>
    <small>Illustration only; actual hits depend on cache contents and the implementation.</small>
  </div>;
}

export function ArticleGuide({ section, annotation }: { section?: string; annotation?: string }) {
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(annotation ? `annotation-panel-${annotation}` : `article-section-${section}`);
      (target || document.getElementById(`article-section-${section}`))?.scrollIntoView({ block: 'start' });
    });
  }, [section, annotation]);

  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const notes = Array.from(article.querySelectorAll<HTMLElement>('.translation-note-popover'));
    const rows = Array.from(article.querySelectorAll<HTMLElement>('.translation-row.has-notes'));
    let frame = 0;
    let disposed = false;
    const positionNotes = () => {
      article.style.removeProperty('--notes-overflow');
      rows.forEach(row => row.style.removeProperty('--note-space'));
      if (window.matchMedia('(max-width: 1120px)').matches) {
        notes.forEach(note => note.style.removeProperty('--note-top'));
        return;
      }
      let previousBottom = -Infinity;
      for (const row of rows) {
        const rowNotes = Array.from(row.querySelectorAll<HTMLElement>('.translation-note-popover'));
        const firstMarker = document.getElementById(`annotation-${rowNotes[0]?.dataset.annotationId}`);
        if (!firstMarker) continue;
        const space = Math.max(0, Math.ceil(previousBottom + 14 - firstMarker.getBoundingClientRect().top));
        if (space) row.style.setProperty('--note-space', `${space}px`);
        for (const note of rowNotes) {
          const marker = document.getElementById(`annotation-${note.dataset.annotationId}`);
          if (!marker) continue;
          const top = Math.max(marker.getBoundingClientRect().top, previousBottom + 14);
          note.style.setProperty('--note-top', `${top - row.getBoundingClientRect().top}px`);
          previousBottom = top + note.getBoundingClientRect().height;
        }
      }
      const overflow = Math.max(0, Math.ceil(previousBottom - article.getBoundingClientRect().bottom));
      if (overflow) article.style.setProperty('--notes-overflow', `${overflow}px`);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(positionNotes);
    };
    positionNotes();
    const observer = new ResizeObserver(schedule);
    observer.observe(article);
    notes.forEach(note => observer.observe(note));
    window.addEventListener('resize', schedule);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', schedule); };
  }, []);

  return <>
    <section className="article-hero reading-hero">
      <div className="article-hero-copy">
        <div className="article-eyebrow"><span/> AN ANNOTATED TRANSLATION</div>
        <h1>DeepSeek V4.1 Flash<br/><em>inference deployment.</em></h1>
        <p>The full supplied translation, with notes, source links and diagrams alongside the original text.</p>
        <div className="article-hero-actions">
          <a href={articleSource.links[0].url} target="_blank" rel="noreferrer" className="button primary">View the X article <ArrowUpRight size={16}/></a>
          <Link to="/codemap">Explore the codemap <ArrowRight size={15}/></Link>
        </div>
        <div className="article-hero-meta">CODE SOURCE-TRACED AT <a href={`https://github.com/deepseek-ai/DeepInfer/commit/${revision}`} target="_blank" rel="noreferrer">774ce24</a> <span>·</span> NO ACCELERATOR RUN</div>
      </div>
    </section>
    <div className="article-source"><BookOpen size={18}/><div>
      <strong>{articleSource.title}</strong><p>{articleSource.note}</p>
      <div>{articleSource.links.map((item, i) => <EvidenceLink item={item} key={`${item.url}-${i}`}/>)}</div>
    </div></div>
      <details className="translation-toc"><summary>In this article <ChevronDown size={16}/></summary><nav aria-label="Article contents">{translationSections.map((item, i) => <Link key={item.id} to={`/article/${item.id}`}><small>{String(i + 1).padStart(2, '0')}</small>{item.label}</Link>)}</nav></details>
    <div className="reading-layout translation-layout">
      <article className="article-index">
        <div className="guide-heading"><div><span>THE DEPLOYMENT ARTICLE</span><h2>Read the translation.</h2><p>Highlighted phrases are from the translation. Notes and explainers add our context.</p></div></div>
        <div className="article-sections" ref={articleRef}>{translationSections.map((item) => {
          return <section className="translation-section" key={item.id} id={`article-section-${item.id}`}>
            {translationSectionLines(item.id).map(({ line, text }) => {
              const notes = (translationAnnotations[line] || []).map(id => translationNoteById.get(id)).filter((note): note is NonNullable<typeof note> => Boolean(note));
              const noteTriggers = notes.map(note => <Link className="translation-note-marker" key={note.id} id={`annotation-${note.id}`} to={`/article/${item.id}/${note.id}`} aria-label={`Annotation ${translationNoteNumbers.get(note.id)}: ${note.title}`}>{translationNoteNumbers.get(note.id)}</Link>);
              const content = <OriginalText text={text} highlights={translationHighlights[line]} noteTriggers={noteTriggers}/>;
              const diagram = translationDiagrams[line];
              return <div className={`translation-row ${notes.length ? 'has-notes' : ''}`} key={line}>
                <div className="translation-body">
                  {translationHeadings.has(line) ? <h2 className="translation-heading">{content}</h2> : translationSubheadings.has(line) ? <h3 className="translation-subheading">{content}</h3> : text ? <p className="translation-original">{content}</p> : <div className="translation-blank"/>}
                  {translationFigures[line]?.map(figure => <figure className="translation-figure" key={figure.src}>
                    <a href={figure.src} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${figure.title}`}><img src={figure.src} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy"/></a>
                    <figcaption><span>DeepSeek · {figure.title}</span><a href={figure.src} target="_blank" rel="noreferrer">Open image <ArrowUpRight size={12}/></a></figcaption>
                  </figure>)}
                  {diagram && <details className="translation-extra"><summary>Explore our diagram <ChevronDown size={15}/></summary><ArticleDiagram sectionId={diagram}/></details>}
                  {line === 73 && <details className="translation-extra"><summary>Try the cache-hit calculator <ChevronDown size={15}/></summary><CacheHitCalculator/></details>}
                </div>
                {notes.map(note => <aside className="translation-note-popover" key={note.id} id={`annotation-panel-${note.id}`} data-annotation-id={note.id} aria-labelledby={`annotation-title-${note.id}`}>
                  <div className="translation-note-header"><span>NOTE {translationNoteNumbers.get(note.id)}</span></div>
                  <h3 id={`annotation-title-${note.id}`}>{note.title}</h3>
                  <div className="translation-note-body"><small>{note.status}</small><p>{note.explanation}</p>
                    <LinkGroup title="SOURCE" items={note.evidence}/><LinkGroup title="CODE" items={note.code}/><LinkGroup title="RESEARCH" items={note.related}/>
                    <Link className="translation-note-link" to={`/article/${item.id}/${note.id}`}>Link to this note <ArrowUpRight size={12}/></Link>
                  </div>
                </aside>)}
              </div>;
            })}
          </section>;
        })}</div>
      </article>
    </div>
    <section className="guide-next"><div><span>CONTINUE INTO THE CODE</span><h2>See how the pieces connect.</h2><p>Open a file, browse its folder, or follow a source-traced execution path.</p></div><div><Link to="/codemap"><Layers3 size={16}/> Codemap <ArrowRight size={15}/></Link><Link to="/execution"><GitBranch size={16}/> Execution paths <ArrowRight size={15}/></Link></div></section>
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
  return <><div className="execution-intro"><div className="section-label">FOLLOW THE CODE · 10 SOURCE TRACES</div><h1>What happens when<br/>the engine runs?</h1><p>These are static traces through the pinned release, organized as question-led code maps. Each numbered card points to the actual file and line; conditions explain which branches apply.</p><div className="execution-evidence"><Code2 size={17}/><span><strong>Evidence:</strong> Source inspection, not an accelerator execution trace. Production-only services are labeled separately.</span></div><Link to="/codemap">Browse the full source tree <ArrowRight size={15}/></Link></div><div className="execution-layout"><article><div className="trace-list">{executionPaths.map((path, pathIndex) => <details className="trace-section" key={path.id} id={`trace-${path.id}`} open={pathIndex === 0 || undefined}><summary><span className="trace-index">{String(pathIndex + 1).padStart(2, '0')}</span><span><strong>{questions[path.id] || path.title}</strong><small>{path.summary}</small></span><ChevronDown size={18}/></summary><div className="trace-body"><div className="trace-motivation"><span>MOTIVATION</span><p>{path.summary}</p></div><div className="trace-conditions"><span>CONDITIONS & BOUNDARIES</span><ul>{path.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul></div><div className="trace-flow-label">CODE MAP · {path.steps.length} SOURCE POINTS</div><div className="trace-steps">{path.steps.map((step, index) => <React.Fragment key={`${step.path}:${step.line}`}><div className="trace-step"><div className="trace-step-heading"><div><span>[{pathIndex + 1}{String.fromCharCode(97 + index)}]</span><h3>{step.title}</h3></div><Link to={fileRoute(step.path, step.line)}>Open file <ArrowUpRight size={13}/></Link></div><p>{step.explanation}</p><Link className="trace-source-path" to={fileRoute(step.path, step.line)}>{step.path}:{step.line} <ArrowUpRight size={12}/></Link><CodePreview path={step.path} line={step.line} sources={loadError ? {} : sources}/></div>{index < path.steps.length - 1 && <div className="trace-arrow"><ArrowDown size={15}/></div>}</React.Fragment>)}</div><div className="trace-related"><span>RELATED CHAPTERS</span><div>{path.related.map(id => modules.find(module => module.id === id)).filter((item): item is typeof modules[number] => Boolean(item)).map(item => <Link to={`/module/${item.id}`} key={item.id}>{item.title} <ArrowUpRight size={12}/></Link>)}</div></div></div></details>)}</div></article><aside className="execution-aside"><div><span>ON THIS PAGE</span>{executionPaths.map((path, i) => <button key={path.id} onClick={() => { const node = document.getElementById(`trace-${path.id}`) as HTMLDetailsElement | null; if (node) { node.open = true; node.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}>{String(i + 1).padStart(2, '0')} {path.title}</button>)}</div></aside></div></>;
}
