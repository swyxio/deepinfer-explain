import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Dices, RotateCcw } from 'lucide-react';
import { fileRoute } from './routes';
import {
  BLOCK, SWA_WINDOW, allocateVerification, chooseBudget, contiguousPlacement, expertTraffic, placeExperts,
  rankLoads, replayPlan, sampleDrafts, simulateSession, timeline, type DraftRequest,
} from './mechanisms-model';
import './mechanisms.css';

const QA = 'doc/inference_deployment_qa.md';
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

function Src({ path, line, children }: { path: string; line?: number; children: React.ReactNode }) {
  return <Link className="mx-src" to={fileRoute(path, line)}><code>{children}</code><small>{path.split('/').at(-1)}{line ? `:${line}` : ''}</small></Link>;
}
function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="mx-out" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={12} aria-hidden="true"/></a>;
}
function Slider({ label, value, min, max, step = 1, onChange, show }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; show?: string }) {
  return <label className="mx-slider"><span>{label}<b>{show ?? fmt(value)}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="mx-toggle" role="group" aria-label={label}><span>{label}</span><div>{options.map(([v, text]) => <button key={v} className={v === value ? 'on' : ''} aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>)}</div></div>;
}
function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'good' | 'bad' }) {
  return <div className={`mx-stat ${tone || ''}`}><small>{label}</small><strong>{value}</strong>{note && <span>{note}</span>}</div>;
}
function Section({ n, id, title, claim, children }: { n: number; id: string; title: string; claim: React.ReactNode; children: React.ReactNode }) {
  return <section className="mx-section" id={id}><header className="mx-head"><span className="mx-n">{String(n).padStart(2, '0')}</span><div><h2>{title}</h2><p>{claim}</p></div></header>{children}</section>;
}
function Notes({ notice, code, elsewhere, talk }: { notice: React.ReactNode[]; code: React.ReactNode; elsewhere: React.ReactNode; talk?: React.ReactNode }) {
  return <div className="mx-notes">
    <div><h3>What to notice</h3><ol>{notice.map((n, i) => <li key={i}>{n}</li>)}</ol></div>
    <div><h3>In the code</h3>{code}</div>
    <div><h3>vLLM / SGLang</h3>{elsewhere}{talk && <><h3 className="mx-talk-h">Why people noticed</h3>{talk}</>}</div>
  </div>;
}

// ── 01 Prefix reuse ──────────────────────────────────────────────────────────

function PrefixFigure() {
  const [system, setSystem] = useState(6000);
  const [input, setInput] = useState(1500);
  const [output, setOutput] = useState(400);
  const [turns, setTurns] = useState(30);
  const [persist, setPersist] = useState<'yes' | 'no'>('yes');
  const [storage, setStorage] = useState<'shared' | 'local'>('shared');
  const sim = useMemo(() => simulateSession({ system, perTurnInput: input, perTurnOutput: output, turns, persistDecode: persist === 'yes', storage, machines: 8 }), [system, input, output, turns, persist, storage]);
  const longest = sim.turns.at(-1)!.length;
  return <div className="mx-fig">
    <div className="mx-controls">
      <Slider label="System + tool schema" value={system} min={0} max={20000} step={500} onChange={setSystem}/>
      <Slider label="New input per turn (user / tool result)" value={input} min={100} max={12000} step={100} onChange={setInput}/>
      <Slider label="Model output per turn" value={output} min={50} max={4000} step={50} onChange={setOutput}/>
      <Slider label="Turns in session" value={turns} min={1} max={60} onChange={setTurns}/>
      <Toggle label="Write decode KV to store" value={persist} options={[['yes', 'yes (DeepInfer)'], ['no', 'prefill only']]} onChange={setPersist}/>
      <Toggle label="Where KV lives" value={storage} options={[['shared', 'shared 3FS'], ['local', 'per-machine, 8 machines']]} onChange={setStorage}/>
    </div>
    <div className="mx-canvas">
      <div className="mx-legend"><i className="c-hit"/>KV fetched, not recomputed<i className="c-miss"/>prefill computed<span>each row = one request; width = prompt length</span></div>
      <div className="mx-rows" style={{ ['--rows' as string]: sim.turns.length }}>
        {sim.turns.map(t => <div key={t.turn} className="mx-row" title={`turn ${t.turn}: ${fmt(t.length)} tokens, ${fmt(t.cached)} cached${storage === 'local' ? `, machine ${t.machine + 1}` : ''}`}>
          {storage === 'local' && <span className="mx-machine" style={{ ['--m' as string]: t.machine }}>{t.machine + 1}</span>}
          <div className="mx-bar" style={{ width: `${(t.length / longest) * 100}%` }}><span className="c-hit" style={{ flexGrow: t.cached }}/><span className="c-miss" style={{ flexGrow: t.computed }}/></div>
        </div>)}
      </div>
    </div>
    <div className="mx-stats">
      <Stat label="Input cache-hit rate" value={pct(sim.hitRate)} note="DeepSeek reports 96% average in production" tone={sim.hitRate > .9 ? 'good' : 'bad'}/>
      <Stat label="Prefill tokens computed" value={fmt(sim.computed)} note={`of ${fmt(sim.total)} input tokens`}/>
      <Stat label="Prefill work saved" value={`${(sim.total / Math.max(1, sim.computed)).toFixed(1)}×`} note="vs. recomputing every prompt"/>
    </div>
  </div>;
}

// ── 02 Bounded replay ────────────────────────────────────────────────────────

function ReplayFigure() {
  const [length, setLength] = useState(10_000);
  const [swa, setSwa] = useState<'present' | 'missing'>('missing');
  const [layers, setLayers] = useState(20);
  const plan = replayPlan(length, swa === 'present');
  // Zoom on the tail: show the last 6 blocks of context at full resolution.
  const viewStart = Math.max(0, Math.floor(length / BLOCK) * BLOCK - 5 * BLOCK);
  const span = length - viewStart;
  const at = (pos: number) => `${((Math.max(viewStart, pos) - viewStart) / span) * 100}%`;
  const blocks = Array.from({ length: Math.ceil(span / BLOCK) + 1 }, (_, i) => viewStart + i * BLOCK).filter(p => p <= length);
  const exact = layers * SWA_WINDOW;
  return <div className="mx-fig">
    <div className="mx-controls">
      <Slider label="Prompt length L" value={length} min={300} max={200_000} step={1} onChange={setLength}/>
      <Toggle label="SWA state for this prefix" value={swa} options={[['present', 'on this machine'], ['missing', 'evicted / lost']]} onChange={setSwa}/>
      <Slider label="Sliding-window layers to rebuild" value={layers} min={1} max={20} onChange={setLayers}/>
    </div>
    <div className="mx-canvas">
      <div className="mx-sub">A · Hit policy on the last few blocks of a {fmt(length)}-token prompt</div>
      <div className="mx-strip">
        <div className="mx-strip-seg c-hit" style={{ left: 0, width: at(plan.hit) }}><span>block KV hit · 3FS</span></div>
        {plan.replay > 0 && <div className="mx-strip-seg c-replay" style={{ left: at(plan.hit), width: `calc(${at(plan.hit + plan.replay)} - ${at(plan.hit)})` }}><span>replay 128</span></div>}
        <div className="mx-strip-seg c-miss" style={{ left: at(plan.hit + plan.replay), right: 0 }}><span>new</span></div>
        <div className="mx-cap" style={{ left: at(plan.cap) }}><span>L − 134 cap</span></div>
        {blocks.map(p => <i key={p} className="mx-tick" style={{ left: at(p) }}><small>{p >= 1000 ? `${(p / 1000).toFixed(p % 1000 ? 2 : 0)}k` : p}</small></i>)}
      </div>
      <div className="mx-sub">B · Why only 128 tokens: tokens each layer must see to rebuild the top layer's window exactly</div>
      <div className="mx-cone" style={{ ['--layers' as string]: layers }}>
        {Array.from({ length: layers }, (_, i) => {
          const depthFromTop = i + 1; // row 0 = top layer
          return <div key={i} className="mx-cone-row"><span>L{layers - i}</span><div className="mx-cone-track">
            <div className="mx-cone-exact" style={{ width: `${(depthFromTop * SWA_WINDOW / exact) * 100}%` }}/>
            <div className="mx-cone-bounded" style={{ width: `${(SWA_WINDOW / exact) * 100}%` }}/>
          </div></div>;
        })}
        <div className="mx-cone-axis"><span>← {fmt(exact)} tokens back</span><span>end of prompt</span></div>
      </div>
      <div className="mx-legend"><i className="c-exact"/>exact rebuild: each layer below needs another window of input<i className="c-replay"/>bounded replay: 128 tokens at every layer, attention clamped to the replayed span</div>
    </div>
    <div className="mx-stats">
      <Stat label="Hit length" value={fmt(plan.hit)} note={swa === 'present' ? 'L1 = block hit, SWA found in [L1−128, L1]' : 'L1 − 128: back off one block'}/>
      <Stat label="Tokens through prefill" value={fmt(plan.fresh)} note={`${pct(plan.fresh / length)} of the prompt`} tone={plan.fresh / length < .1 ? 'good' : undefined}/>
      <Stat label="Exact rebuild vs replay" value={`${fmt(exact)} vs ${SWA_WINDOW}`} note="tokens deep; replay cost is constant in L and depth"/>
    </div>
  </div>;
}

// ── 03 Wide-EP and hot-expert replicas ───────────────────────────────────────

const EXPERTS = 48;
function ExpertFigure() {
  const [ranks, setRanks] = useState(8);
  const [skew, setSkew] = useState(1.0);
  const [redundant, setRedundant] = useState(1);
  const [mode, setMode] = useState<'contiguous' | 'eplb'>('eplb');
  const [view, setView] = useState<'history' | 'next'>('next');
  const history = useMemo(() => expertTraffic(EXPERTS, 10, skew, 3), [skew]);
  const next = useMemo(() => expertTraffic(EXPERTS, 1, skew, 3, .35).map(s => s.map((v, i) => v * (0.75 + 0.5 * ((i * 7919) % 97) / 97)))[0], [skew]);
  const placed = useMemo(() => mode === 'eplb' ? placeExperts(history, ranks, redundant) : contiguousPlacement(EXPERTS, ranks), [mode, history, ranks, redundant]);
  const step = view === 'history' ? history[0] : next;
  const loads = rankLoads(step, placed.placement, placed.copies);
  const hottest = Math.max(...step);
  return <div className="mx-fig">
    <div className="mx-controls">
      <Toggle label="EP ranks (attention DP = EP)" value={String(ranks) as '4'} options={[['4', 'EP4'], ['8', 'EP8'], ['16', 'EP16']]} onChange={v => setRanks(Number(v))}/>
      <Slider label="Routing skew (Zipf α)" value={skew} min={0} max={1.6} step={.05} onChange={setSkew} show={skew.toFixed(2)}/>
      <Toggle label="Placement" value={mode} options={[['contiguous', 'experts in order'], ['eplb', 'EPLB greedy']]} onChange={setMode}/>
      <Slider label="Redundant slots per GPU" value={redundant} min={0} max={3} onChange={setRedundant}/>
      <Toggle label="Evaluate on" value={view} options={[['history', 'stats window'], ['next', 'next step (drifted)']]} onChange={setView}/>
    </div>
    <div className="mx-canvas">
      <div className="mx-legend"><span>each column = one GPU; blocks = expert replicas, height = tokens routed to that replica; darker = hotter expert</span></div>
      <div className="mx-ranks" style={{ ['--ranks' as string]: ranks }}>
        <div className="mx-mean" style={{ bottom: `calc(16px + (100% - 16px) * ${(loads.mean / loads.max).toFixed(4)})` }}><span>mean</span></div>
        {placed.placement.map((experts, r) => <div key={r} className={`mx-rank ${loads.loads[r] === loads.max ? 'slow' : ''}`}>
          <div className="mx-rank-stack" style={{ height: `${(loads.loads[r] / loads.max) * 100}%` }}>
            {experts.map((e, i) => <span key={`${e}-${i}`} title={`expert ${e}${placed.copies[e] > 1 ? ` (1 of ${placed.copies[e]} replicas)` : ''}`} className={placed.copies[e] > 1 ? 'rep' : ''} style={{ flexGrow: step[e] / placed.copies[e], ['--heat' as string]: (step[e] / hottest).toFixed(3) }}/>)}
          </div>
          <small>GPU {r}</small>
        </div>)}
      </div>
    </div>
    <div className="mx-stats">
      <Stat label="moe_lb = slowest / mean" value={loads.lb.toFixed(3)} note="DeepSeek: 1.090 decode, 1.045–1.074 prefill" tone={loads.lb < 1.15 ? 'good' : 'bad'}/>
      <Stat label="Step time lost to imbalance" value={pct(1 - loads.mean / loads.max, 0)} note="every rank waits for the slowest at the combine"/>
      <Stat label="Slots per GPU" value={`${placed.capacity}`} note={`${EXPERTS} experts${mode === 'eplb' ? ` + ${placed.capacity * ranks - EXPERTS} replicas` : ''} · illustrative layer`}/>
    </div>
  </div>;
}

// ── 04 DSpark ────────────────────────────────────────────────────────────────

const draftBatch = (seed: number): DraftRequest[] => {
  const kinds: [string, number][] = [['JSON tool call', .97], ['boilerplate code', .92], ['code edit', .82], ['chat reply', .7], ['reasoning', .6], ['creative prose', .45]];
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return kinds.map(([id, base]) => ({ id, confidence: Array.from({ length: 5 }, () => Math.min(.99, Math.max(.05, base + (r() - .5) * .3))) }));
};

function DsparkFigure() {
  const [cost, setCost] = useState(0.02);
  const [seed, setSeed] = useState(11);
  const [sample, setSample] = useState(0);
  const requests = useMemo(() => draftBatch(seed), [seed]);
  const n = requests.length;
  const BASE = 1;
  const { curve, best } = useMemo(() => chooseBudget(requests, BASE, cost), [requests, cost]);
  const alloc = allocateVerification(requests, best.q);
  const fixed = curve.at(-1)!;
  const accepted = sample ? sampleDrafts(requests, alloc.lengths, sample) : undefined;
  const maxT = Math.max(...curve.map(c => c.throughput)), minT = Math.min(...curve.map(c => c.throughput));
  const px = (q: number) => ((q - n) / (curve.length - 1)) * 100;
  const py = (t: number) => 100 - ((t - minT) / (maxT - minT || 1)) * 90 - 5;
  return <div className="mx-fig">
    <div className="mx-controls">
      <Slider label="Cost of one more verified token (relative to a step)" value={cost} min={0} max={.08} step={.0025} onChange={v => { setCost(v); setSample(0); }} show={cost < .008 ? `${cost.toFixed(3)} · memory-bound` : cost > .05 ? `${cost.toFixed(3)} · compute-bound` : cost.toFixed(3)}/>
      <div className="mx-buttons">
        <button onClick={() => setSample(s => s + 1 + seed)}><Dices size={14}/> Run target verification</button>
        <button onClick={() => { setSeed(s => s + 7); setSample(0); }}><RotateCcw size={14}/> New draft confidences</button>
      </div>
    </div>
    <div className="mx-canvas mx-ds">
      <div>
        <div className="mx-sub">Survival probability of each draft = cumulative product of confidence-head outputs. Cells are ranked across the whole batch; the top {best.q - n} win a verification slot.</div>
        <div className="mx-grid">
          <div className="mx-grid-head"><span/>{[1, 2, 3, 4, 5].map(j => <span key={j}>d{j}</span>)}<span>len</span></div>
          {requests.map((r, i) => <div key={r.id} className="mx-grid-row">
            <span className="mx-grid-name">{r.id}</span>
            {alloc.cum[i].map((p, j) => {
              const verdict = accepted ? (j < accepted[i] ? 'acc' : j === accepted[i] && alloc.chosen[i][j] ? 'rej' : '') : '';
              return <span key={j} className={`mx-cell ${alloc.chosen[i][j] ? 'win' : ''} ${verdict}`} style={{ ['--p' as string]: p.toFixed(3) }} title={`confidence ${r.confidence[j].toFixed(2)}, survival ${p.toFixed(3)}, global rank ${alloc.rank[i][j] + 1}`}>
                <b>{p.toFixed(2)}</b><small>#{alloc.rank[i][j] + 1}</small>
              </span>;
            })}
            <span className="mx-grid-len">{alloc.lengths[i]}{accepted && <small>+{accepted[i]}✓</small>}</span>
          </div>)}
        </div>
        <div className="mx-legend"><i className="c-win"/>selected for verification (always a prefix: survival only falls along a row)<i className="c-acc"/>accepted<i className="c-rej"/>first rejection</div>
      </div>
      <div className="mx-curve">
        <div className="mx-sub">CPU budget search: expected tokens ÷ modeled step time, for each total query budget</div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Throughput by query budget">
          <polyline points={curve.map(c => `${px(c.q)},${py(c.throughput)}`).join(' ')} fill="none" stroke="var(--mx-ink-2)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
          <line x1={px(best.q)} x2={px(best.q)} y1="0" y2="100" stroke="var(--mx-hit)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"/>
          <circle cx={px(best.q)} cy={py(best.throughput)} r="2.2" fill="var(--mx-hit)"/>
          <circle cx={px(fixed.q)} cy={py(fixed.throughput)} r="2.2" fill="var(--mx-miss)"/>
        </svg>
        <div className="mx-curve-axis"><span>q = {n} (no drafts)</span><span>q = {fixed.q} (fixed-5)</span></div>
      </div>
    </div>
    <div className="mx-stats">
      <Stat label="Chosen budget total_q" value={`${best.q}`} note={`${((best.q - n) / n).toFixed(2)} drafts/req vs 5.00 fixed`}/>
      <Stat label="Expected tokens / step" value={`${best.expected.toFixed(2)} vs ${fixed.expected.toFixed(2)}`} note="dynamic vs fixed-5"/>
      <Stat label="Modeled throughput vs fixed-5" value={`${best.throughput >= fixed.throughput ? '+' : ''}${pct(best.throughput / fixed.throughput - 1)}`} note="DeepSeek table: −1.5% at 16 seqs/rank → +11% at 96" tone="good"/>
    </div>
  </div>;
}

// ── 05 Overlap ───────────────────────────────────────────────────────────────

function OverlapFigure() {
  const [overlap, setOverlap] = useState<'sync' | 'async'>('async');
  const [schedule, setSchedule] = useState(1.6);
  const [post, setPost] = useState(1.2);
  const [gpu, setGpu] = useState(6);
  const STEPS = 4;
  const serial = timeline(STEPS, schedule, post, gpu, false);
  const plan = timeline(STEPS, schedule, post, gpu, overlap === 'async');
  const span = serial.end;
  const x = (t: number) => `${(t / span) * 100}%`;
  const gpuSpans = plan.spans.filter(s => s.lane === 'gpu');
  const gaps = gpuSpans.slice(1).map((s, i) => ({ start: gpuSpans[i].end, end: s.start })).filter(g => g.end - g.start > 1e-6);
  const stale = overlap === 'async' ? plan.spans.find(s => s.label === 'S2') : undefined;
  const sample1 = gpuSpans[1];
  return <div className="mx-fig">
    <div className="mx-controls">
      <Toggle label="Scheduler" value={overlap} options={[['sync', 'synchronous'], ['async', 'overlapped (DeepInfer)']]} onChange={setOverlap}/>
      <Slider label="CPU schedule(N) ms" value={schedule} min={.2} max={6} step={.1} onChange={setSchedule} show={schedule.toFixed(1)}/>
      <Slider label="CPU post-process(N) ms" value={post} min={.2} max={6} step={.1} onChange={setPost} show={post.toFixed(1)}/>
      <Slider label="GPU forward + sample ms" value={gpu} min={1} max={20} step={.5} onChange={setGpu} show={gpu.toFixed(1)}/>
    </div>
    <div className="mx-canvas">
      <div className="mx-legend"><span>Sn = schedule(n) · Pn = post-process(n) on the CPU; blue = forward + sample on the GPU; hatched = GPU idle</span></div>
      <div className="mx-gantt">
        {(['cpu', 'gpu'] as const).map(lane => <div key={lane} className="mx-lane"><span className="mx-lane-label">{lane.toUpperCase()}</span><div className="mx-lane-track">
          {lane === 'gpu' && gaps.map((g, i) => <div key={i} className="mx-gap" style={{ left: x(g.start), width: `calc(${x(g.end)} - ${x(g.start)})` }} title="GPU idle"/>)}
          {plan.spans.filter(s => s.lane === lane).map(s => <div key={s.label} className={`mx-span ${lane} st${s.step % 2} ${s.label.startsWith('P') ? 'post' : ''}`} style={{ left: x(s.start), width: `calc(${x(s.end)} - ${x(s.start)})` }} title={`${s.label}: ${s.start.toFixed(1)}–${s.end.toFixed(1)} ms`}><span>{s.label}</span></div>)}
        </div></div>)}
        {stale && sample1 && stale.start < sample1.end && <div className="mx-stale" style={{ left: `calc(64px + (100% - 64px) * ${stale.start / span})` }}><span>schedule 2 starts before step 1 is sampled → step-1 confidences and accept counts are not known yet</span></div>}
      </div>
    </div>
    <div className="mx-stats">
      <Stat label="Time per decode step" value={`${plan.perStep.toFixed(1)} ms`} note={overlap === 'async' ? `max(GPU, CPU) instead of ${serial.perStep.toFixed(1)} ms` : 'CPU + GPU + CPU'}/>
      <Stat label="GPU busy" value={pct(gpu / plan.perStep, 0)} tone={gpu / plan.perStep > .95 ? 'good' : 'bad'}/>
      <Stat label="Throughput gain" value={`${(serial.perStep / plan.perStep).toFixed(2)}×`} note="from removing the CPU bubble alone"/>
    </div>
  </div>;
}

// ── Zoom out ─────────────────────────────────────────────────────────────────

const pipeline: { id: string; title: string; detail: string; released: boolean; mech?: string }[] = [
  { id: 'entry', title: 'Entrypoint', detail: 'hash-chain prefix match on metadata → hit length, before routing', released: false, mech: 'prefix' },
  { id: 'plb', title: 'Prefill LB', detail: 'length tiers <16K / 16–64K / 64–256K / ≥256K; engines pull by compute quota; no prefix affinity', released: false },
  { id: 'prefill', title: 'Prefill · EP2–8', detail: '3FS → host shm (async) → HBM per layer over GDR; replay 128 tokens if SWA state missing', released: true, mech: 'replay' },
  { id: 'pd', title: 'P → D transfer', detail: 'block KV and SWA KV share one path', released: false },
  { id: 'decode', title: 'Decode · EP64–128', detail: 'Wide-EP with EPLB replicas; DSpark variable-length verification; overlapped scheduler', released: true, mech: 'experts' },
  { id: 'store', title: 'kvcache-store', detail: '~100 PiB 3FS, EC 10+2; TTL ≈3 d agents / 7 d chat; decode KV written back', released: false, mech: 'prefix' },
];

function ZoomOut() {
  return <div className="mx-fig mx-zoom">
    <div className="mx-pipe">{pipeline.map(p => <a key={p.id} href={p.mech ? `#${p.mech}` : undefined} className={`mx-node ${p.released ? 'rel' : 'prod'}`}>
      <small>{p.released ? 'in the open-source engine' : 'production only'}</small><strong>{p.title}</strong><span>{p.detail}</span>
    </a>)}</div>
    <p className="mx-zoom-note">The loop closes at the store: decode writes its KV back, so the next turn of the same session hits it from any prefill machine. The README is explicit that the full KV system, E/P/D disaggregation and DP load balancing are not in the release (<Out href="https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/README.md#L3-L43">README</Out>). Reported scale: 155 trillion tokens/day per cluster, US$38 revenue per GPU-hour at valley pricing.</p>
  </div>;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function MechanismsPage() {
  return <div className="mx-page">
    <div className="mx-intro">
      <div className="mx-kicker">HOW IT WORKS · FIVE MECHANISMS</div>
      <h1>Five decisions that make DeepSeek's serving cheap.</h1>
      <p>Each figure is a small working model of the policy in the source, not a recording. Move the inputs and the diagram recomputes. Where a number comes from DeepSeek's production report it is labeled; everything else is an illustrative input you control.</p>
      <nav className="mx-toc">{[['prefix', 'Prefix reuse'], ['replay', 'Bounded replay'], ['experts', 'Expert balance'], ['dspark', 'DSpark'], ['overlap', 'CPU/GPU overlap'], ['system', 'The whole loop']].map(([id, t], i) => <a key={id} href={`#${id}`}><span>{String(i + 1).padStart(2, '0')}</span>{t}</a>)}</nav>
    </div>

    <Section n={1} id="prefix" title="Prefix reuse: why 96% of input tokens are never recomputed" claim={<>An agent turn re-sends the whole conversation, so turn <i>t</i>'s prompt is turn <i>t−1</i>'s prompt plus its output plus the new input. If everything already seen is stored and reachable, only the newest slice runs through prefill. DeepSeek stores it on a shared 3FS cluster (~100 PiB, 3-day agent / 7-day chat TTL), so any prefill machine can hit any prefix.</>}>
      <PrefixFigure/>
      <Notes
        notice={[
          <>Hit rate is set by the <b>ratio of new tokens to history</b>, not by the cache algorithm. Long sessions with small tool outputs land in the mid-90s on their own; one huge tool dump per turn pulls it down.</>,
          <>Switch to <b>per-machine</b> storage with random routing: the same session drops to the 60s because most turns land on a machine that never saw the prefix. Engines without shared storage fix this with prefix-affinity routing, which fights load balancing. A shared store removes the conflict.</>,
          <>Writing <b>decode KV</b> matters most when outputs are long (raise output to 4k): otherwise the model's own previous answer is recomputed every turn.</>,
          <>Hits are whole 128-token blocks, capped at <code>L − 134</code> (the next mechanism explains the cap).</>,
        ]}
        code={<><Src path={QA} line={139}>block KV on 3FS, no affinity routing</Src><Src path={QA} line={147}>decode KV still written to disk</Src><Src path={QA} line={151}>TTL and the chat long tail</Src><Src path={QA} line={155}>match → fetch → per-layer swap-in</Src><Src path="csrc/engine/block_manager.hpp" line={82}>BlockManager::allocate</Src></>}
        elsewhere={<><p>vLLM hashes full blocks and looks them up in the local cache (<Out href="https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/v1/core/kv_cache_manager.py#L264-L305">kv_cache_manager.py</Out>); SGLang walks a radix tree (<Out href="https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/mem_cache/radix_cache.py#L400-L417">radix_cache.py</Out>) and can tier to host and storage with <Out href="https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/docs/docs/advanced_features/hicache_design.mdx#L10-L20">HiCache</Out>. The matching is similar; the difference is where the bytes live and how long.</p></>}
        talk={<p><Out href="https://x.com/Yngkvn/status/2112647381468541057">@Yngkvn</Out> on the 96%: “this is typical for agentic coding-heavy workloads”, which is the regime the left half of this figure models.</p>}
      />
    </Section>

    <Section n={2} id="replay" title="Bounded replay: losing the sliding-window state costs 128 tokens, not the prefix" claim={<>V4.1 keeps two kinds of KV. Block KV (main + indexer) is paged and persisted on 3FS. Sliding-window (SWA) KV is a 134-token ring per sequence (20 layers × 134 × 528 B ≈ 1.4 MB) kept only in the host memory of the machine that made it. A block hit without its SWA state would normally be useless; DeepInfer backs off one block and recomputes just those 128 tokens.</>}>
      <ReplayFigure/>
      <Notes
        notice={[
          <>With the SWA state <b>missing</b>, the hit shrinks by exactly one block and a 128-token replay segment appears. Drag <i>L</i> to 200k: the replay cost does not move.</>,
          <>Panel B is the reason it is approximate. Exactly rebuilding the top layer's window needs a window of inputs at the layer below, and another below that, so the requirement grows by 128 per layer: 2,560 tokens for 20 layers. Replay instead clamps every layer's attention to <code>max(s, i−127)…i</code> inside the replayed span.</>,
          <>The same trick halves V4.1 prefill: decoder layers only replay the last 128 prompt tokens to seed decode, and that state never enters the prefix cache.</>,
          <>The <code>L − 134</code> cap is the 128-token window plus 6 tokens of speculative backtracking, so a stored state always covers what decode may roll back.</>,
        ]}
        code={<><Src path={QA} line={161}>SWA lives in StateBlock, stored at 128 multiples</Src><Src path={QA} line={181}>bounded replay definition</Src><Src path={QA} line={189}>hit policy: L1 or L1 − 128</Src><Src path="deepinfer/worker/cache_engine.py" line={221}>StateBlock</Src><Src path="csrc/engine/input_metadata/prepare_tensor_input_v4.cpp" line={149}>visibility clamp</Src></>}
        elsewhere={<p>vLLM has the same shape of fix: on a hit without the window loaded it sets <code>replay_start = num_hit_tokens − prefix_replay_tokens</code> (<Out href="https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/v1/core/sched/scheduler.py#L3205-L3212">scheduler.py</Out>). SGLang runs an encoder-SWA replay pass before or folded into the extend (<Out href="https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/managers/tp_worker.py#L620-L632">tp_worker.py</Out>). Research: <Out href="https://arxiv.org/abs/2405.05254">YOCO</Out>.</p>}
        talk={<p><Out href="https://x.com/sophiamyang/status/2112628190904742124">@sophiamyang</Out> singled out bounded replay and the CPU/GPU pipeline (section 05) in her breakdown.</p>}
      />
    </Section>

    <Section n={3} id="experts" title="Expert balance: a wide-EP step is as slow as its busiest GPU" claim={<>Decode runs EP64–128: each GPU holds a few experts, and every token's top-k experts are spread across the group. Wider EP means fewer expert weights read per GPU per step and more tokens per expert per GEMM. The cost is that the all-to-all combine waits for the slowest rank, and routing is skewed. EPLB gives each GPU spare slots for replicas of hot experts and re-places them from recent traffic.</>}>
      <ExpertFigure/>
      <Notes
        notice={[
          <>With <b>experts in order</b> and skew around 1, one GPU holds the head of the distribution and every other GPU idles for a large share of the step.</>,
          <><b>EPLB greedy</b> mirrors the source's two passes: hand each spare slot to the expert whose copy most lowers the peak per-replica load, then place replicas heaviest-first on the rank that least raises Σ<sub>step</sub> max<sub>rank</sub> load.</>,
          <>Evaluate on the <b>next step</b>: the placement was fit to the past window, so drifted traffic leaves some imbalance. That is why production reports 1.090 rather than 1.000, and why decode re-places only every 10,000 steps (window 1,000).</>,
          <>At EP64 the Q&A's rounding gives 7 slots per GPU. Shuffles move weights over NVLink <code>symm_mem</code>.</>,
        ]}
        code={<><Src path="deepinfer/model_executor/eplb/policy.py" line={73}>rebalance_experts_global</Src><Src path="deepinfer/model_executor/eplb/policy.py" line={12}>_batch_greedy_indices</Src><Src path={QA} line={95}>prefill / decode EPLB settings</Src><Src path={QA} line={47}>EP2–8 prefill, EP64–128 decode</Src></>}
        elsewhere={<p>vLLM's default policy replicates by <code>argmax(weight / logcnt)</code> on step-summed load (<Out href="https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/distributed/eplb/policy/default.py#L90-L100">default.py</Out>), so a bursty expert and a steady one look the same. SGLang's <code>deepseek_vec</code> scores per step like DeepInfer (<Out href="https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/eplb/eplb_algorithms/deepseek_vec.py#L94-L108">deepseek_vec.py</Out>).</p>}
        talk={<p><Out href="https://x.com/bookwormengr/status/2112636749293949122">@bookwormengr</Out> framed Wide-EP and DSpark together as gains on several axes at once.</p>}
      />
    </Section>

    <Section n={4} id="dspark" title="DSpark: verify the drafts that are likely to survive, wherever they are in the batch" claim={<>The draft model proposes 5 tokens per request and a confidence head estimates each one's acceptance. Fixed-length verification spends the same 5 slots on a JSON call that will accept everything and on prose that will reject at d2. DSpark picks a total budget for the batch and gives each slot to the draft with the highest probability of surviving.</>}>
      <DsparkFigure/>
      <Notes
        notice={[
          <>Selection is a <b>global top-k</b> over cumulative products. Because survival can only fall along a row, the winners in each row are always a prefix, so no draft is verified without its predecessors.</>,
          <>Slide the cost from memory-bound (left) to compute-bound (right). When extra verified tokens are nearly free, the optimum is fixed-5. As they cost more, low-survival tails drop out. That is the shape of DeepSeek's table: −1.5% at 16 seqs/rank, +5.4% at 60, +11% at 96.</>,
          <>Selection is not acceptance. <b>Run target verification</b> samples outcomes: accepted length barely changes (DeepSeek: 3.29 → 3.20) while verified drafts fall about 30% (5.00 → 3.2–4.4).</>,
          <>The time curve here is linear for clarity. The engine uses a profiled curve per graph size plus a measured sampler time.</>,
        ]}
        code={<><Src path="csrc/engine/mtp_varlen.hpp" line={195}>CPU budget search over sorted rates</Src><Src path="csrc/engine/scheduler.hpp" line={1247}>confidence → cumulative accept_rates</Src><Src path="deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py" line={35}>GPU reference: cumprod, rank, 1 + wins</Src><Src path="deepinfer/worker/worker.py" line={191}>GPU-side length correction</Src><Src path={QA} line={245}>production numbers</Src></>}
        elsewhere={<p>vLLM's adaptive verification does the same cumprod then <code>flat.topk(draft_budget)</code> (<Out href="https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/v1/worker/gpu/spec_decode/adaptive_verification.py#L64-L72">adaptive_verification.py</Out>); SGLang has a DSpark planner with <code>ScheduleVerifyLensTopk</code> (<Out href="https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/speculative/dspark_components/dspark_planner.py#L535-L542">dspark_planner.py</Out>). Paper: <Out href="https://arxiv.org/abs/2607.05147">DSpark</Out>.</p>}
      />
    </Section>

    <Section n={5} id="overlap" title="Overlap: the CPU schedules step N+1 while the GPU runs step N" claim={<>A synchronous decode step is schedule → forward → sample → post-process, and the GPU idles during both CPU phases. DeepInfer, following SGLang and NanoFlow, runs <code>schedule(N+1) → launch(N+1) → post-process(N−1)</code> on the CPU while the GPU computes step N.</>}>
      <OverlapFigure/>
      <Notes
        notice={[
          <>Overlapped step time is <code>max(GPU, CPU)</code>. With a 6 ms GPU step, 2.8 ms of CPU work would otherwise be a 32% bubble.</>,
          <>Raise CPU time above GPU time and the bubble moves to the GPU again: overlap hides CPU cost, it does not remove it.</>,
          <>The price is <b>stale information</b>. When <code>schedule(N+1)</code> runs, step N's confidences and accepted counts do not exist yet. So DSpark's CPU uses rates from N−2 to fix only the total budget, and a TileLang kernel recomputes per-request lengths on the GPU from N−1's fresh confidences, writing them to a pinned buffer.</>,
        ]}
        code={<><Src path={QA} line={268}>async scheduling Q&A</Src><Src path="csrc/engine/mtp_varlen.hpp" line={160}>which round's rates feed which decision</Src><Src path="deepinfer/engine/llm_engine.py" line={860}>engine step</Src><Src path="deepinfer/worker/worker.py" line={144}>worker pipeline</Src></>}
        elsewhere={<p>SGLang's overlap event loop (<Out href="https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/managers/scheduler.py#L2011-L2078">scheduler.py</Out>) and vLLM's batch queue (<Out href="https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/v1/engine/core.py#L706-L743">core.py</Out>) solve the same bubble. DeepInfer's addition is making speculative length selection work under it. Precedent: <Out href="https://www.usenix.org/conference/osdi25/presentation/zhu-kan">NanoFlow</Out>.</p>}
      />
    </Section>

    <Section n={6} id="system" title="The whole loop" claim={<>One request, end to end. Blue stages ship in the open-source engine; grey ones are DeepSeek's production services described in the Q&A.</>}>
      <ZoomOut/>
    </Section>
  </div>;
}
