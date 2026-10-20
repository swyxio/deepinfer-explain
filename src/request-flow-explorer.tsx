import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Code2, CornerUpLeft } from 'lucide-react';
import { modules } from './modules';
import { readings } from './research';
import { requestFlowGroups, requestFlowStages, requestFlowTransitions } from './request-flow';
import './request-flow-explorer.css';

const stageRoute = (id: string) => `#codemap/${id}`;
const stagesInMap = requestFlowGroups.flat().map(id => requestFlowStages.find(stage => stage.id === id)!);

export function RequestFlowExplorer({ selected, sourceRoute }: { selected?: string; sourceRoute: (path: string, line?: number) => string }) {
  const index = Math.max(0, stagesInMap.findIndex(stage => stage.id === selected));
  const stage = stagesInMap[index];
  const viewport = useRef<HTMLDivElement>(null);
  const next = requestFlowTransitions[stage.id];
  const papers = stage.research.map(id => readings.find(reading => reading.id === id)).filter((item): item is typeof readings[number] => Boolean(item));
  const chapters = stage.chapters.map(id => modules.find(module => module.id === id)).filter((item): item is typeof modules[number] => Boolean(item));
  const pan = (direction: -1 | 1) => { if (viewport.current) viewport.current.scrollLeft += direction * viewport.current.clientWidth * .8; };

  useEffect(() => {
    const container = viewport.current;
    const current = container?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!container || !current) return;
    const left = container.scrollLeft + current.getBoundingClientRect().left - container.getBoundingClientRect().left - (container.clientWidth - current.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [stage.id]);

  return <section className="request-map" aria-labelledby="request-map-title">
    <div className="request-map-heading">
      <div><div className="request-map-eyebrow">INTERACTIVE REQUEST FLOW · OFFLINE RELEASE</div><h2 id="request-map-title">Follow a request through DeepInfer.</h2><p>Select a component to see what happens, read the annotated code, and follow the ideas behind it.</p></div>
      <span className="request-map-counter">{String(index + 1).padStart(2, '0')} / {String(stagesInMap.length).padStart(2, '0')}</span>
    </div>
    <nav className="request-map-navigation" aria-label="Request flow steps">
      <div className="request-map-pan"><span>Pan the map to see every component</span><button type="button" aria-label="Scroll request flow left" onClick={() => pan(-1)}><ArrowLeft size={15}/></button><button type="button" aria-label="Scroll request flow right" onClick={() => pan(1)}><ArrowRight size={15}/></button></div>
      <div className="request-map-scroll" ref={viewport}>
        <ol className="request-map-track">{requestFlowGroups.map((group, groupIndex) => <li key={group.join('-')}>
          <div className={group.length > 1 ? 'request-map-branch' : 'request-map-single'} role={group.length > 1 ? 'group' : undefined} aria-label={group.length > 1 ? 'Scheduler chooses prefill or decode' : undefined}>{group.map(id => {
            const item = stagesInMap.find(candidate => candidate.id === id)!;
            const number = stagesInMap.indexOf(item) + 1;
            return <a key={item.id} href={stageRoute(item.id)} className={item.id === stage.id ? 'request-map-stage is-current' : 'request-map-stage'} aria-current={item.id === stage.id ? 'step' : undefined}>
              <span>{String(number).padStart(2, '0')} <small>{item.phase}</small></span><strong>{item.title}</strong>
            </a>;
          })}</div>{groupIndex < requestFlowGroups.length - 1 && <span className="request-map-connector"><ArrowRight size={16} className="request-map-arrow" aria-hidden="true"/>{group[0] === 'update' && <small>all finished</small>}</span>}
        </li>)}</ol>
      </div>
    </nav>
    <div className="request-map-loop"><CornerUpLeft size={16} aria-hidden="true"/><span>After state updates, unfinished prompt chunks or generated sequences return to <a href={stageRoute('schedule')}>scheduling</a>. The two branches are alternatives, not sequential stages.</span></div>
    <p className="sr-only" aria-live="polite">Component {index + 1} of {stagesInMap.length}: {stage.title}</p>
    <article className="request-map-detail" aria-labelledby="request-map-stage-title">
      <div className="request-map-stage-label">COMPONENT {String(index + 1).padStart(2, '0')} · {stage.phase}</div>
      <h3 id="request-map-stage-title">{stage.title}</h3>
      <p className="request-map-summary">{stage.summary}</p>
      <p className="request-map-explanation">{stage.detail}</p>
      {stage.condition && <p className="request-map-condition"><strong>Branch or condition</strong> {stage.condition}</p>}
      <div className="request-map-evidence">
        <section><h4><Code2 size={15}/> Annotated code</h4><div className="request-map-links">{stage.code.map(source => <a href={sourceRoute(source.path, source.line)} key={`${source.path}:${source.line}`}><span><strong>{source.label}</strong><small>{source.path}:{source.line}</small></span><ArrowUpRight size={15}/></a>)}</div></section>
        <section><h4><BookOpen size={15}/> Research & context</h4><div className="request-map-links">{papers.map(paper => <a href={`#research/${paper.id}`} key={paper.id}><span><strong>{paper.title}</strong><small>{paper.kind} · {paper.year}</small></span><ArrowUpRight size={15}/></a>)}{chapters.map(chapter => <a href={`#module/${chapter.id}`} key={chapter.id}><span><strong>{chapter.title}</strong><small>Subsystem chapter</small></span><ArrowUpRight size={15}/></a>)}</div></section>
      </div>
      <div className="request-map-controls"><span>{next.length ? 'NEXT IN THE FLOW' : 'END OF THIS REQUEST'}</span><div>{next.length ? next.map(item => <a href={stageRoute(item.id)} key={item.id}>{item.label} <ArrowRight size={15}/></a>) : <a href={stageRoute('input')}>Start the walkthrough again <ArrowRight size={15}/></a>}</div></div>
    </article>
    <p className="request-map-disclaimer">A source-traced guide to the released offline engine, not a runtime recording. Real batches can mix requests and take optional branches. <a href="#execution">Explore detailed execution paths <ArrowRight size={12}/></a></p>
  </section>;
}
