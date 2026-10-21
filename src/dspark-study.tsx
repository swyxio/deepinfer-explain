import { Fragment, useRef } from 'react';
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
  const video = useRef<HTMLVideoElement>(null);
  const sourceLines = sources?.[path]?.split('\n');
  const peer = peers?.['dspark-vllm-budget'];
  const seek = (seconds: number) => {
    if (!video.current) return;
    video.current.currentTime = seconds;
    void video.current.play().catch(() => {});
  };
  return <section className="dspark-study" aria-label="DSpark allocation visual study">
    <div className="blender-copy-label">ONE WORKED EXAMPLE</div>
    <h3>Build the DSpark decode loop.</h3>
    <p>Start with one draft prefix, then add a second request, the shared budget, target verification and the next decode step. The animation uses illustrative numbers and three draft positions; production DSpark drafts five.</p>
    <div className="blender-player"><video ref={video} controls preload="metadata" playsInline poster={`${root}03-allocation.jpg`} aria-label="DSpark decode loop built up in five animated layers">
      <source src={`${root}03-allocation.mp4`} type="video/mp4"/>Your browser does not support embedded video. <a href={`${root}03-allocation.mp4`}>Download the animation</a>.
    </video></div>
    <ol className="dspark-chapters" aria-label="Animation chapters">
      <li><button onClick={() => seek(0)}><span>00:00 · 01</span><strong>Why prefixes?</strong></button><p>A later draft is useful only if earlier ones survive. B’s predicted rates multiply: .80 × .40 × .90 = .288. <Link to={fileRoute(path, 68)}>Cumulative scores ↗</Link></p></li>
      <li><button onClick={() => seek(24)}><span>00:24 · 02</span><strong>Choose the budget</strong></button><p>The CPU estimates output per unit of forward and sampling time. In the toy profile, five queries yield 4.42 ÷ 1.40 = 3.16 expected tokens/ms. <Link to={fileRoute('csrc/engine/mtp_varlen.hpp', 228)}>Throughput estimate ↗</Link></p></li>
      <li><button onClick={() => seek(42)}><span>00:42 · 03</span><strong>Allocate across requests</strong></button><p>Five queries include two base inputs. The three remaining slots go to A1, B1 and A2; the GPU counts wins per request. <Link to={fileRoute(path, 70)}>Allocation reference ↗</Link></p></li>
      <li><button onClick={() => seek(61)}><span>01:01 · 04</span><strong>Verify the prefixes</strong></button><p>The target processes A=[base, A1, A2] and B=[base, B1]. A separate toy sampling outcome accepts A1 and rejects A2; the first rejection triggers residual sampling. <Link to={fileRoute('deepinfer/model_executor/layers/tilelang_ops/fused_sample.py', 227)}>Rejection sampling ↗</Link></p></li>
      <li><button onClick={() => seek(83)}><span>01:23 · 05</span><strong>Close the loop</strong></button><p>The CPU’s budget estimate uses older rates; the GPU remaps the preceding sampler’s confidence. The sampler then produces drafts and confidence for the next step. <Link to={fileRoute('deepinfer/worker/worker.py', 209)}>GPU correction ↗</Link> · <Link to={fileRoute('deepinfer/model_executor/layers/sampler.py', 74)}>Sampler ↗</Link></p></li>
    </ol>
    <a className="blender-download" href={`${root}03-allocation.blend`} download><Download size={15}/> Download editable Blender scene</a>
    <details className="dspark-details"><summary>Worked allocation diagram</summary><p>The original SVG shows the same cumulative scores and the three selected slots.</p><div className="dspark-diagram-scroll"><img src={`${root}01-budget.svg`} loading="lazy" alt="A worked example: cumulative scores for A are .90, .72 and .504; for B they are .80, .32 and .288. A1, B1 and A2 win the three extra slots, so the target verifies query lengths of three and two."/></div><p className="dspark-scroll-hint">Scroll sideways to see the full diagram.</p><a href={`${root}01-budget.svg`}>Open the SVG <ArrowUpRight size={13}/></a></details>
    <details className="dspark-details"><summary>From SVG to ImageGen to Blender</summary><p>The SVG fixes the allocation. The ImageGen study explores a restrained material treatment; the Blender scene builds the full decode loop from those ideas.</p><img src={`${root}02-imagegen.png`} loading="lazy" alt="Image-generated material study based on the DSpark SVG diagram"/></details>
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
