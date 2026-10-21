import { Fragment } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import { Link } from 'react-router';
import type { PeerSample } from './module-animation';
import { fileRoute } from './routes';
import './dspark-study.css';

const root = `${import.meta.env.BASE_URL}blender/dspark-study/`;
const path = 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py';
const codeLines = [68, 72, 74, 85, 92, 95, 98];

type Props = {
  sources: Record<string, string> | null;
  sourceError: boolean;
  peers: Record<string, PeerSample> | null;
  peerError: boolean;
};

export function DsparkStudy({ sources, sourceError, peers, peerError }: Props) {
  const sourceLines = sources?.[path]?.split('\n');
  const peer = peers?.['dspark-vllm-budget'];
  return <section className="dspark-study" aria-label="DSpark allocation visual study">
    <div className="blender-copy-label">ONE WORKED EXAMPLE</div>
    <h3>Two requests, one shared budget.</h3>
    <p>Start with two continuing requests and five query tokens. One token per request is reserved; the remaining three go to the highest predicted prefix scores across the batch.</p>
    <figure>
      <div className="dspark-diagram-scroll"><img src={`${root}01-budget.svg`} alt="A worked example: cumulative scores for A are .90, .72 and .504; for B they are .80, .32 and .288. A1, B1 and A2 win the three extra slots, so the target verifies query lengths of three and two."/></div>
      <figcaption>Illustrative example with three draft positions per request; production DSpark drafts five. <span className="dspark-scroll-hint">Scroll sideways to see the full diagram.</span></figcaption>
    </figure>
    <div className="dspark-video-heading"><div><div className="blender-copy-label">THE SAME EXAMPLE IN MOTION</div><h3>Watch the budget move.</h3></div><span>3D BLENDER STUDY · SILENT</span></div>
    <div className="blender-player"><video controls preload="none" playsInline poster={`${root}03-allocation.jpg`} aria-label="DSpark shared verification budget animated in Blender">
      <source src={`${root}03-allocation.mp4`} type="video/mp4"/>Your browser does not support embedded video. <a href={`${root}03-allocation.mp4`}>Download the animation</a>.
    </video></div>
    <ol className="dspark-beats" aria-label="Animation sequence">
      <li><strong>Predict.</strong> Multiply the per-position confidence rates to score each prefix. For B, .80 × .40 × .90 = .288.</li>
      <li><strong>Allocate.</strong> After two base tokens, the three remaining slots go to A1, B1 and A2 across the batch.</li>
      <li><strong>Verify.</strong> Group the selected slots back into query lengths A=3 and B=2; the target model determines acceptance.</li>
    </ol>
    <a className="blender-download" href={`${root}03-allocation.blend`} download><Download size={15}/> Download editable Blender scene</a>
    <details className="dspark-details"><summary>From SVG to ImageGen to Blender</summary><p>The SVG fixes the logic and labels. This ImageGen study explores a restrained material treatment for the same example; the Blender scene rebuilds the pieces as editable objects.</p><img src={`${root}02-imagegen.png`} loading="lazy" alt="Image-generated material study based on the DSpark SVG diagram"/><a href={`${root}01-budget.svg`}>Open the original SVG <ArrowUpRight size={13}/></a></details>
    <details className="dspark-details"><summary>Six other ways to draw the same allocator</summary><p>Ribbons, ranking, tickets, trains, a checkpoint and a counterfactual each reveal a different part of the same decision.</p><div className="dspark-diagram-scroll"><img src={`${root}04-visual-directions.svg`} loading="lazy" alt="Six sketches of DSpark's shared budget: probability ribbons, a ranking wall, shared tickets, linked trains, target verification and a paired counterfactual."/></div><p className="dspark-scroll-hint">Scroll sideways to see all six sketches.</p><a href={`${root}04-visual-directions.svg`}>Open the comparison sheet <ArrowUpRight size={13}/></a><p className="dspark-styles"><strong>Possible visual styles:</strong> a scientific textbook, a transit map, paper stop-motion, a component cross-section, a blackboard build-up, or an interactive instrument.</p></details>
    <details className="dspark-details"><summary>Inspect the allocation code</summary><p>DeepInfer takes cumulative scores, ranks all draft positions, and adds the winning positions to each sequence’s base. vLLM’s comparable allocator uses a batch-wide top-k.</p>
      <div className="dspark-code-grid"><div className="module-code"><div className="module-code-header"><div><span>DEEPINFER · REFERENCE</span><strong>{path}</strong></div><Link to={fileRoute(path, 68)}>Annotated source <ArrowUpRight size={13}/></Link></div>
        {sourceLines ? <pre><code>{codeLines.map((n, i) => <Fragment key={n}>{i > 0 && n !== codeLines[i-1] + 1 && <span className="dspark-code-gap">···</span>}<span className="module-code-line"><Link to={fileRoute(path, n)} aria-label={`Open line ${n}`}>{n}</Link><span>{sourceLines[n-1]}</span></span></Fragment>)}</code></pre> : <p className="module-code-status">{sourceError || sources ? 'Source unavailable; open the annotated source above.' : 'Loading pinned source…'}</p>}
      </div><div className="module-code"><div className="module-code-header"><div><span>VLLM · COMPARABLE ALLOCATION</span><strong>{peer?.path ?? 'adaptive_verification.py'}</strong></div>{peer && <a href={peer.url} target="_blank" rel="noreferrer">Upstream source <ArrowUpRight size={13}/></a>}</div>
        {peer ? <pre><code>{peer.lines.map((line, i) => <span className="module-code-line" key={i}><a href={`${peer.url.split('#')[0]}#L${peer.start+i}`} target="_blank" rel="noreferrer">{peer.start+i}</a><span>{line}</span></span>)}</code></pre> : <p className="module-code-status">{peerError || peers ? 'Comparison source unavailable.' : 'Loading comparison source…'}</p>}
      </div></div>
    </details>
  </section>;
}
