import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './article-diagrams.css';

import { fileRoute as file } from './routes';

type Step = { title: string; detail: string; href: string; linkLabel: string };

function Steps({ steps }: { steps: Step[] }) {
  return <ol className="article-diagram-steps">{steps.map((step, index) => <li key={step.title}>
    <Link to={step.href} aria-label={`${step.title}: ${step.detail} ${step.linkLabel}`}>
      <span className="article-diagram-number">{String(index + 1).padStart(2, '0')}</span>
      <strong>{step.title}</strong><span>{step.detail}</span>
      <small>{step.linkLabel} <ArrowUpRight size={13}/></small>
    </Link>
  </li>)}</ol>;
}

function Diagram({ eyebrow, title, children, caption, links }: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  caption: ReactNode;
  links: { label: string; href: string }[];
}) {
  return <figure className="article-diagram">
    <div className="article-diagram-heading"><span>{eyebrow}</span><strong>{title}</strong></div>
    {children}
    <figcaption>{caption}</figcaption>
    <div className="article-diagram-links" aria-label="Explore related code and research">{links.map(link => <Link to={link.href} key={link.href}>{link.label} <ArrowUpRight size={13}/></Link>)}</div>
  </figure>;
}

/** Conceptual diagrams accompany the article. Links distinguish released code from production context. */
export function ArticleDiagram({ sectionId }: { sectionId: string }) {
  if (sectionId === 'system') return <Diagram eyebrow="PRODUCTION DESIGN · SIMPLIFIED" title="Separate the stages of a request" caption="Vision encoding is optional for image inputs. The article describes a production service; the links to prefill and decode lead to the related offline paths, not a released disaggregated service." links={[
    { label: 'Production Q&A', href: '/research/deployment-qa' },
    { label: 'Compare with DistServe', href: '/research/distserve' },
    { label: 'Release boundary', href: file('README.md', 38) },
  ]}>
    <Steps steps={[
      { title: 'Route request', detail: 'Choose resources in the production service.', href: '/research/deployment-qa', linkLabel: 'Deployment Q&A' },
      { title: 'Prefill', detail: 'Process input tokens and build state.', href: '/codemap/prefill', linkLabel: 'Offline prefill path' },
      { title: 'Decode', detail: 'Generate tokens using the prepared state.', href: '/codemap/decode', linkLabel: 'Offline decode path' },
    ]}/>
    <div className="article-diagram-branch"><span>OPTIONAL INPUT</span><Link to={file('deepinfer/ve/multimodal_processor.py', 1)}>Image → vision processing → prefill <ArrowUpRight size={13}/></Link></div>
  </Diagram>;

  if (sectionId === 'cache') return <Diagram eyebrow="PRODUCTION DESIGN · BLOCK KV FETCH" title="Fetch reusable context into the engine" caption="Stored SWA state is handled separately: it is kept in host memory and can be pulled between machines; active inference state also resides on device. The distributed KV store and its fetch orchestration are described in production, while the in-engine cache manager is in the release." links={[
    { label: 'Storage details in the Q&A', href: file('doc/inference_deployment_qa.md', 129) },
    { label: 'Related: PagedAttention', href: '/research/pagedattention' },
    { label: 'Related: DualPath', href: '/research/dualpath' },
  ]}>
    <Steps steps={[
      { title: '3FS storage', detail: 'Persistent main KV and indexer K.', href: file('doc/inference_deployment_qa.md', 137), linkLabel: 'Storage design' },
      { title: 'Host memory', detail: 'A separate process fetches block KV.', href: file('doc/inference_deployment_qa.md', 155), linkLabel: 'Fetch path' },
      { title: 'Device memory', detail: 'Transfer blocks while computation proceeds.', href: file('deepinfer/worker/cache_engine.py', 851), linkLabel: 'In-engine cache code' },
    ]}/>
    <div className="article-diagram-branch"><span>SEPARATE STATE</span><Link to={file('deepinfer/worker/cache_engine.py', 221)}>Stored SWA is kept in host memory; the release defines its state layout <ArrowUpRight size={13}/></Link></div>
  </Diagram>;

  if (sectionId === 'replay') return <Diagram eyebrow="PRODUCTION DESIGN · ENCODER SWA MISS" title="Rebuild a bounded suffix" caption="If encoder SWA is missing, the last 128 tokens of the hit prefix are replayed with the uncached suffix. Existing block KV is reused. The truncated replay produces approximate SWA state; the decoder has a separate replay path." links={[
    { label: 'Replay in the Q&A', href: file('doc/inference_deployment_qa.md', 179) },
    { label: 'V4.1 report', href: '/research/v41' },
    { label: 'Compare with YOCO', href: '/research/yoco' },
    { label: 'Decoder truncation setting', href: file('deepinfer/environ.py', 188) },
  ]}>
    <Steps steps={[
      { title: 'Earlier prefix', detail: 'Reuse available block KV.', href: file('doc/inference_deployment_qa.md', 185), linkLabel: 'Encoder replay' },
      { title: 'Replay window', detail: 'Recompute the final 128 tokens of the hit prefix.', href: file('doc/inference_deployment_qa.md', 179), linkLabel: 'Replay details' },
      { title: 'Uncached suffix', detail: 'Process the remaining new tokens.', href: '/codemap/prefill', linkLabel: 'Offline prefill path' },
    ]}/>
  </Diagram>;

  if (sectionId === 'speculation') return <Diagram eyebrow="RELEASED MECHANISM · WHEN ENABLED" title="Spend verification where drafts look promising" caption="Variable-length verification is optional. Confidence and the profiled throughput curve guide how many candidates to verify; accepted tokens advance the sequence and a rejected draft is corrected. The production configuration and gains are workload-dependent." links={[
    { label: 'DSpark paper', href: '/research/dspark' },
    { label: 'Compare with DFlash', href: '/research/dflash' },
    { label: 'Full sampling path', href: '/codemap/sample' },
  ]}>
    <Steps steps={[
      { title: 'Draft', detail: 'Propose candidate tokens and confidence.', href: file('deepinfer/model_executor/models/mtp/dflash.py', 46), linkLabel: 'Draft model' },
      { title: 'Allocate', detail: 'Select verification lengths from the budget.', href: file('deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 1), linkLabel: 'Scheduling kernel' },
      { title: 'Verify', detail: 'Check candidates against the target model.', href: file('deepinfer/model_executor/layers/sampler.py', 411), linkLabel: 'Verification code' },
      { title: 'Advance', detail: 'Commit accepted tokens and update state.', href: file('csrc/engine/scheduler.hpp', 927), linkLabel: 'Scheduler update' },
    ]}/>
  </Diagram>;

  if (sectionId === 'async') return <Diagram eyebrow="RELEASED MECHANISM · DECODE" title="Overlap work across adjacent steps" caption="This is a conceptual timing view, not a measurement. In zero-overhead scheduling mode, a decode step’s post-processing can be deferred to overlap with the next forward; prompt and non-overlapped steps are processed immediately." links={[
    { label: 'Worker step', href: file('deepinfer/worker/worker.py', 89) },
    { label: 'Scheduling and update', href: '/codemap/update' },
    { label: 'Compare with NanoFlow', href: '/research/nanoflow' },
  ]}>
    <div className="article-diagram-lanes" aria-label="Conceptual overlapping CPU and GPU work">
      <div><span>GPU</span><Link to={file('deepinfer/worker/worker.py', 89)}><strong>Forward + sample N</strong><small>Execute the current decode step <ArrowUpRight size={13}/></small></Link></div>
      <div><span>CPU</span><Link to={file('deepinfer/engine/llm_engine.py', 881)}><strong>Schedule N+1 and process N−1</strong><small>Work for adjacent steps can overlap <ArrowUpRight size={13}/></small></Link></div>
    </div>
  </Diagram>;

  return null;
}
