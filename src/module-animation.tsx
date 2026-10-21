import { useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Link } from 'react-router';
import { animationTimelines, STEP_SECONDS } from './animation-timelines';
import { fileRoute } from './routes';
import './module-animation.css';

export type PeerSample = { system: string; path: string; start: number; lines: string[]; url: string };
type Props = {
  sceneId: string;
  title: string;
  sources: Record<string, string> | null;
  sourceError: boolean;
  peers: Record<string, PeerSample> | null;
  peerError: boolean;
};

const asset = (id: string, extension: string) => `${import.meta.env.BASE_URL}blender/${id}.${extension}`;
/** A single clock drives the clip, its step selector, and the source highlight. */
export function ModuleAnimation({ sceneId, title, sources, sourceError, peers, peerError }: Props) {
  const timeline = animationTimelines[sceneId];
  const video = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const step = timeline.steps[index];
  const selected = step.source;
  const sourceLines = sources?.[selected.path]?.split('\n');
  const peerIds = [step.peerId, step.alternatePeerId].filter((id): id is string => Boolean(id));

  function selectStep(next: number) {
    const clamped = Math.max(0, Math.min(timeline.steps.length - 1, next));
    if (video.current) {
      video.current.pause();
      video.current.currentTime = clamped * STEP_SECONDS;
    }
    setIndex(clamped);
  }

  function syncStep(time: number) {
    setIndex(Math.min(timeline.steps.length - 1, Math.max(0, Math.floor(time / STEP_SECONDS))));
  }

  return <section className="module-animation" aria-label={`${title} animated code walkthrough`}>
    <div className="module-animation-head"><div><div className="blender-copy-label">ANIMATED CODE WALKTHROUGH</div><h3>Follow the module, step by step.</h3></div><span>PLAY · PAUSE · SELECT A STEP</span></div>
    <div className="module-animation-grid">
      <div className="module-animation-visual">
        <div className="module-animation-player"><video ref={video} controls preload="metadata" playsInline poster={asset(sceneId, 'jpg')} aria-label={`${title}, a 16-second silent source walkthrough`} onTimeUpdate={event => syncStep(event.currentTarget.currentTime)} onSeeked={event => syncStep(event.currentTarget.currentTime)} onEnded={() => setIndex(timeline.steps.length - 1)}>
          <source src={asset(sceneId, 'mp4')} type="video/mp4"/>Your browser does not support video. <a href={asset(sceneId, 'mp4')}>Download the animation</a>.
        </video></div>
        <div className="module-animation-controls">
          <button type="button" onClick={() => selectStep(index - 1)} disabled={index === 0} aria-label="Previous animation step"><ChevronLeft size={16}/></button>
          <span>STEP {index + 1} / {timeline.steps.length}</span>
          <button type="button" onClick={() => selectStep(index + 1)} disabled={index === timeline.steps.length - 1} aria-label="Next animation step"><ChevronRight size={16}/></button>
          <a href={asset(sceneId, 'blend')} download><Download size={14}/> Editable Blender scene</a>
        </div>
        <ol className="module-animation-steps" aria-label={`${title} steps`}>{timeline.steps.map((item, i) => <li key={item.title}><button type="button" onClick={() => selectStep(i)} aria-current={i === index ? 'step' : undefined}><span>{String(i + 1).padStart(2, '0')}</span>{item.title}</button></li>)}</ol>
        <div className="module-animation-takeaway"><strong>{step.title}</strong><p>{step.explanation}</p><small>{step.takeaway}</small></div>
      </div>
      <div className="module-animation-code-column">
        <div className="module-code">
          <div className="module-code-header"><div><span>{selected.kind === 'documentation' ? 'DEEPSEEK DEPLOYMENT NOTES' : 'DEEPINFER · PINNED SOURCE'}</span><strong>{selected.path}</strong></div><Link to={fileRoute(selected.path, selected.highlightStart)}>Open annotated source <ArrowUpRight size={13}/></Link></div>
          {sourceLines ? <pre className={selected.kind === 'documentation' ? 'module-code-document' : undefined}><code>{sourceLines.slice(selected.start - 1, selected.end).map((line, offset) => {
            const number = selected.start + offset;
            const active = number >= selected.highlightStart && number <= selected.highlightEnd;
            return <span className={active ? 'module-code-line is-highlighted' : 'module-code-line'} key={number}><Link to={fileRoute(selected.path, number)} aria-label={`Open DeepInfer line ${number}`}>{number}</Link><span>{line || ' '}</span></span>;
          })}</code></pre> : <p className="module-code-status">{sourceError || (sources && !sources[selected.path]) ? 'Source unavailable. Open the annotated source above.' : 'Loading pinned source…'}</p>}
        </div>
        {peerIds.map(peerId => {
          const peer = peers?.[peerId];
          return <div className="module-code module-code-peer" key={peerId}>
            {peer ? <><div className="module-code-header"><div><span>{peer.system.toUpperCase()} · COMPARABLE PATH</span><strong>{peer.path}</strong></div><a href={peer.url} target="_blank" rel="noreferrer">Open upstream <ArrowUpRight size={13}/></a></div>
              <pre><code>{peer.lines.map((line, offset) => <span className="module-code-line is-highlighted" key={offset}><a href={`${peer.url.split('#')[0]}#L${peer.start + offset}`} target="_blank" rel="noreferrer" aria-label={`Open ${peer.system} line ${peer.start + offset}`}>{peer.start + offset}</a><span>{line || ' '}</span></span>)}</code></pre></> : <p className="module-code-status">{peerError || peers ? 'Comparison source unavailable.' : 'Loading comparison source…'}</p>}
          </div>;
        })}
      </div>
    </div>
  </section>;
}
