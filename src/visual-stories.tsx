import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Code2, Pause, Play, RotateCcw } from 'lucide-react';
import { visualStories, type VisualStory } from './visual-stories-data';
import './visual-stories.css';

const conversation = [
  { author: '@swyx', text: 'Points readers to the deployment writeup and its production economics.', url: 'https://x.com/swyx/status/2112587397380943953' },
  { author: '@Yuchenj_UW', text: 'Highlights the reported token volume and revenue per GPU-hour.', url: 'https://x.com/yuchenj_uw/status/2112591074409742733' },
  { author: '@antirez', text: 'Frames DeepInfer as an engine specialized for a particular model and hardware.', url: 'https://x.com/antirez/status/2112582293621445029' },
  { author: '@vllm_project', text: 'Describes the engine’s vLLM roots and the flow of ideas back to vLLM.', url: 'https://x.com/vllm_project/status/2112480719952138301' },
  { author: '@Thom_Wolf', text: 'Places the release in DeepSeek’s larger ecosystem of kernels and infrastructure.', url: 'https://x.com/thom_wolf/status/2112513796866813956' },
  { author: '@SuJinYan123', text: 'Highlights the wider production design, expert parallelism, cache I/O and variable verification.', url: 'https://x.com/SuJinYan123/status/2112485918527590435' },
  { author: '@deepseek_ai', text: 'Names speculative decoding, bounded replay and other released features.', url: 'https://x.com/deepseek_ai/status/2112476498598957056' },
];

function Wire({ active }: { active: boolean }) {
  return <span className={`vs-wire ${active ? 'active' : ''}`} aria-hidden="true"><i/></span>;
}
function Box({ title, detail, active = false, tint = '' }: { title: string; detail: string; active?: boolean; tint?: string }) {
  return <div className={`vs-box ${active ? 'active' : ''} ${tint}`}><strong>{title}</strong><small>{detail}</small></div>;
}
function CacheScene({ step }: { step: number }) {
  return <div className="vs-scene-content cache-scene" role="img" aria-label="A repeated prompt prefix is matched and its cached state fetched, while the new suffix goes through prefill before decode.">
    <div className="vs-scene-label">AN ILLUSTRATIVE REPEATED REQUEST</div>
    <div className="cache-request"><div><span>Repeated prefix</span><div className="cache-blocks">{Array.from({ length: 8 }, (_, i) => <i key={i} className={step >= 1 ? 'reused' : ''}/>)}</div></div><b>+</b><div><span>New suffix</span><div className="cache-blocks">{Array.from({ length: 2 }, (_, i) => <i key={i} className="new"/>)}</div></div></div>
    <div className="cache-lanes">
      <div><Box title="Prefix match" detail="Look up prior context" active={step === 1}/><Wire active={step === 1}/><Box title="3FS cache" detail="Fetch stored block KV" active={step === 1} tint="mint"/><Wire active={step === 2}/><Box title="Reuse state" detail="Load into the engine" active={step === 2} tint="mint"/></div>
      <div><Box title="New suffix" detail="Unseen tokens" active={step === 2} tint="amber"/><Wire active={step === 2}/><Box title="Prefill" detail="Compute new state" active={step === 2} tint="amber"/><Wire active={step === 3}/><Box title="Decode" detail="Generate an answer" active={step === 3}/></div>
    </div><div className="vs-scene-foot">The persistent cache is production infrastructure; the open release includes offline inference.</div>
  </div>;
}
function SplitScene({ step }: { step: number }) {
  return <div className="vs-scene-content split-scene" role="img" aria-label="A production request passes through a small prefill group, transfers its state, and then uses a wide decode group.">
    <div className="vs-scene-label">PRODUCTION TOPOLOGY · CONCEPTUAL</div>
    <div className="split-path"><Box title="Request" detail="Image path optional" active={step === 0}/><Wire active={step === 1}/><Box title="Prefill" detail="Process the prompt" active={step === 1} tint="amber"/><Wire active={step === 2}/><Box title="Transfer KV" detail="Move prepared state" active={step === 2} tint="mint"/><Wire active={step === 3}/><Box title="Decode" detail="Generate tokens" active={step === 3}/></div>
    <div className="split-resources"><div className={step === 1 ? 'lit' : ''}><span>SMALLER EP GROUP</span><div className="gpu-tiles">{Array.from({length: 8}, (_, i) => <i key={i}/>)}</div><strong>Prefill: EP 2–8</strong></div><div className={step === 3 ? 'lit' : ''}><span>WIDE EXPERT PARALLELISM</span><div className="gpu-tiles wide">{Array.from({length: 32}, (_, i) => <i key={i}/>)}</div><strong>Decode: EP 64–128</strong></div></div>
    <div className="vs-scene-foot">Tiles are symbolic, not a literal count of GPUs. The split service is not included in the release.</div>
  </div>;
}
function ReplayScene({ step }: { step: number }) {
  return <div className="vs-scene-content replay-scene" role="img" aria-label="Most of a cached prefix is reused. When encoder sliding-window state is missing, a bounded suffix is replayed to reconstruct approximate state before processing new tokens.">
    <div className="vs-scene-label">ENCODER SWA MISS · CONCEPTUAL, NOT TO SCALE</div>
    <div className="replay-labels"><span>Cached prefix</span><span>New suffix</span></div>
    <div className="replay-strip">{Array.from({length: 16}, (_, i) => <i key={i} className={`${i < 11 ? 'cached' : i < 14 ? 'window' : 'fresh'} ${step >= 2 && i >= 11 && i < 14 ? 'replaying' : ''}`}/>)}</div>
    <div className="replay-key"><span><i className="key-cached"/> available block KV</span><span><i className="key-window"/> final 128 tokens</span><span><i className="key-new"/> new tokens</span></div>
    <div className="replay-bottom"><div className={`replay-state ${step === 1 ? 'missing' : ''} ${step >= 3 ? 'rebuilt' : ''}`}><strong>{step >= 3 ? 'Approximate SWA restored' : step === 1 ? 'SWA state missing' : 'Sliding-window state'}</strong><span>{step >= 3 ? 'Rebuilt from a bounded suffix' : step === 1 ? 'Earlier context is unavailable to replay attention' : 'A separate kind of cache state'}</span></div><Wire active={step === 2}/><Box title="Continue prefill" detail="Process the new suffix" active={step === 3} tint="amber"/></div>
  </div>;
}
const draftNames = ['Request A', 'Request B', 'Request C'];
const draftLengths = [3, 2, 1];
const draftAccepted = [2, 1, 1];
const draftConfidence = [[90, 72, 56, 36, 20], [83, 65, 48, 30, 15], [76, 55, 40, 24, 10]];
function DraftScene({ step }: { step: number }) {
  return <div className="vs-scene-content draft-scene" role="img" aria-label="Three requests propose candidates. An illustrative budget is distributed across prefixes based on confidence, then verified tokens are accepted until the first rejection.">
    <div className="vs-scene-label">THREE REQUESTS · ILLUSTRATIVE CANDIDATES</div>
    <div className="draft-grid">{draftNames.map((name, row) => <div className="draft-row" key={name}><strong>{name}</strong><div className="draft-tokens">{Array.from({length: 5}, (_, col) => {
      const selected = col < draftLengths[row];
      const accepted = col < draftAccepted[row];
      const rejected = col === draftAccepted[row] && selected;
      const status = step === 3 ? accepted ? 'accepted' : rejected ? 'rejected' : 'muted' : step >= 2 ? selected ? 'chosen' : 'muted' : '';
      return <span className={`draft-token ${status}`} key={col}><i>{step === 3 && selected ? accepted ? '✓' : '×' : col + 1}</i><small>{step === 1 ? ['higher', '', '', '', 'lower'][col] : ''}</small>{step === 1 && <span className="draft-meter"><span style={{width: `${draftConfidence[row][col]}%`}}/></span>}</span>;
    })}</div></div>)}</div>
    <div className="draft-legend">{step < 2 ? 'Candidate positions have different confidence.' : step === 2 ? 'Example: distribute six verification positions across three prefixes.' : '✓ accepted prefix  ·  × first rejected draft; target corrects it'}</div>
    <div className="vs-scene-foot">Illustrative choices and outcomes, not actual model probabilities or a measured speedup.</div>
  </div>;
}
function OverlapScene({ step }: { step: number }) {
  return <div className="vs-scene-content overlap-scene" role="img" aria-label="A conceptual timeline compares serial CPU and GPU work with scheduling and post-processing overlapped across adjacent decode steps.">
    <div className="vs-scene-label">DECODE SCHEDULING · CONCEPTUAL TIMELINE</div>
    <div className="overlap-caption">{step === 0 ? 'Without overlap, the GPU waits for CPU work.' : 'Adjacent steps can run together.'}</div>
    <div className="timeline-labels"><span/><span>EARLIER</span><span/><span/><span>LATER →</span></div>
    <div className="timeline"><b>CPU</b><div className={`time-block schedule ${step === 0 ? 'visible' : ''}`}>Schedule N</div><div className={`time-block next ${step >= 1 ? 'visible' : ''}`}>Schedule N+1</div><div className={`time-block post ${step >= 2 ? 'visible' : ''}`}>Post-process N−1</div><div className={`time-block done ${step === 0 ? 'visible' : ''}`}>Post-process N</div></div>
    <div className="timeline"><b>GPU</b><div className="time-gap">wait</div><div className="time-block forward visible">Forward + sample N</div><div className={`time-block forward-next ${step >= 3 ? 'visible' : ''}`}>Forward N+1</div><div className={`time-gap ${step === 0 ? '' : 'hidden'}`}>wait</div></div>
    <div className="vs-scene-foot">Timing is schematic. Decode post-processing may be deferred; prompt and non-overlapped steps differ.</div>
  </div>;
}
function Scene({ story, step, playing }: { story: VisualStory; step: number; playing: boolean }) {
  const scene = story.id === 'cache' ? <CacheScene step={step}/> : story.id === 'split' ? <SplitScene step={step}/> : story.id === 'replay' ? <ReplayScene step={step}/> : story.id === 'draft' ? <DraftScene step={step}/> : <OverlapScene step={step}/>;
  return <div className={`vs-scene ${playing ? 'animating' : ''}`} key={`${story.id}-${step}-${playing}`}>{scene}</div>;
}
function Story({ story, index }: { story: VisualStory; index: number }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= story.stages.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [playing, step, story.stages.length]);
  const jump = (index: number) => { setPlaying(false); setStep(index); };
  const toggle = () => { if (playing) setPlaying(false); else { if (step === story.stages.length - 1) setStep(0); setPlaying(true); } };
  return <article className="visual-story" id={`visual-${story.id}`} aria-labelledby={`visual-title-${story.id}`}>
    <div className="visual-story-header"><span className="visual-number">{String(index + 1).padStart(2, '0')}</span><div><div className="visual-kicker">{story.kicker}</div><h2 id={`visual-title-${story.id}`}>{story.title}</h2><p>{story.hook}</p></div></div>
    <div className="visual-player"><div className="visual-player-top"><span>ANIMATED EXPLAINER</span><div className="visual-top-actions"><span>STEP {step + 1} / {story.stages.length}</span><button type="button" className="vs-play" onClick={toggle} aria-label={`${playing ? 'Pause' : step === story.stages.length - 1 ? 'Replay' : 'Play'} ${story.title} animation`}>{playing ? <Pause size={14}/> : step === story.stages.length - 1 ? <RotateCcw size={14}/> : <Play size={14}/>} {playing ? 'Pause' : step === story.stages.length - 1 ? 'Replay' : 'Play'}</button></div></div><Scene story={story} step={step} playing={playing}/>
      <div className="visual-steps" aria-label={`${story.title} animation steps`}>{story.stages.map((stage, i) => <button key={stage.label} type="button" className={i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined} onClick={() => jump(i)}><span>{String(i + 1).padStart(2, '0')}</span>{stage.label}</button>)}</div>
      <div className="visual-caption"><div aria-live="polite"><strong>{story.stages[step].label}</strong><p>{story.stages[step].caption}</p></div><div className="visual-controls"><button type="button" className="vs-control-icon" onClick={() => jump(Math.max(0, step - 1))} disabled={step === 0} aria-label={`Previous step in ${story.title}`}><ArrowLeft size={15}/></button><button type="button" className="vs-control-icon" onClick={() => jump(Math.min(story.stages.length - 1, step + 1))} disabled={step === story.stages.length - 1} aria-label={`Next step in ${story.title}`}><ArrowRight size={15}/></button></div></div>
    </div>
    <div className="visual-story-notes"><p><strong>Why it matters.</strong> {story.why}</p><p><strong>Keep the boundary in mind.</strong> {story.boundary}</p><div className="visual-evidence"><span>EXPLORE THE EVIDENCE</span>{story.links.map(link => <Link to={link.href} key={`${link.href}-${link.label}`}>{link.kind === 'code' ? <Code2 size={14}/> : <BookOpen size={14}/>} {link.label} <ArrowUpRight size={12}/></Link>)}</div></div>
  </article>;
}

export function VisualStoriesPage({ target }: { target?: string }) {
  useEffect(() => { if (target) requestAnimationFrame(() => document.getElementById(`visual-${target}`)?.scrollIntoView({ block: 'start' })); }, [target]);
  return <div className="visuals-page"><header className="visuals-intro"><div className="visual-kicker">FIVE IDEAS · EXPLAINED IN MOTION</div><h1>DeepInfer, in motion.</h1><p>The launch conversation pointed to a bigger story than a list of kernels. Here are five ideas worth understanding, with animations that connect the production design to the released code.</p><div className="visuals-intro-note">A curated selection from public X posts on October 20, 2026—not a popularity ranking. Diagrams are conceptual and the production figures are DeepSeek’s claims.</div></header>
    <nav className="visuals-index" aria-label="Jump to a visual explanation">{visualStories.map((story, i) => <Link to={`/visuals/${story.id}`} key={story.id}><span>{String(i + 1).padStart(2, '0')}</span><strong>{story.title}</strong><ArrowRight size={15}/></Link>)}</nav>
    <section className="conversation-panel"><div><div className="visual-kicker">WHAT PEOPLE WERE TALKING ABOUT</div><h2>Start with the conversation.</h2><p>These posts informed our selection; the explanations below are checked against DeepSeek’s own Q&amp;A and source rather than treating commentary as proof.</p></div><div className="conversation-links">{conversation.map(post => <a href={post.url} target="_blank" rel="noreferrer" key={post.author}><span><strong>{post.author}</strong><small>{post.text}</small></span><ArrowUpRight size={15}/></a>)}</div></section>
    <div className="visuals-stories">{visualStories.map((story, index) => <Story story={story} index={index} key={story.id}/>)}</div>
    <div className="visuals-end"><strong>Want the full execution path?</strong><p>Move from these simplified ideas into the annotated source and request-flow map.</p><Link to="/codemap">Explore the code map <ArrowRight size={15}/></Link></div>
  </div>;
}
