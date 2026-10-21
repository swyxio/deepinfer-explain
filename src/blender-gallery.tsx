import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, Download, FileCode2, MessageCircle } from 'lucide-react';
import { blenderScenes, type StoryLink } from './blender-story';
import { ModuleAnimation, type PeerSample } from './module-animation';
import { fileRoute } from './routes';
import './blender-gallery.css';

export { blenderScenes } from './blender-story';

function asset(id: string, extension: string) {
  return `${import.meta.env.BASE_URL}blender/${id}.${extension}`;
}

function Evidence({ link }: { link: StoryLink }) {
  return link.external
    ? <a href={link.href} target="_blank" rel="noreferrer">{link.label} <ArrowUpRight size={13} aria-hidden="true"/></a>
    : <Link to={link.href}>{link.label} <ArrowUpRight size={13} aria-hidden="true"/></Link>;
}

function RequestPath() {
  const steps = [
    { title: 'LLM.generate', role: 'Accept prompts and enqueue requests', href: fileRoute('deepinfer/entrypoints/llm.py', 90) },
    { title: 'LLMEngine.step', role: 'Drive each inference iteration', href: fileRoute('deepinfer/engine/llm_engine.py', 860) },
    { title: 'Scheduler', role: 'Choose sequences and allocate KV blocks', href: fileRoute('csrc/engine/scheduler.hpp', 275) },
    { title: 'Worker + model', role: 'Forward, sample and post-process', href: fileRoute('deepinfer/worker/worker.py', 89) },
    { title: 'Scheduler loop', role: 'Commit tokens and schedule again', href: fileRoute('csrc/engine/scheduler.hpp', 927) },
  ];
  return <section className="story-request-path" aria-labelledby="story-request-path-title">
    <div className="blender-copy-label">START WITH THE RELEASED ENGINE</div>
    <h2 id="story-request-path-title">A request’s execution path</h2>
    <p>The offline API drives a loop through the Python engine, C++ scheduler and GPU worker. Open a module to follow its code.</p>
    <ol>{steps.map((step, index) => <li key={step.title}><Link to={step.href}><span>0{index + 1}</span><strong>{step.title}</strong><small>{step.role}</small></Link></li>)}</ol>
    <Link className="story-flow-link" to="/codemap">Explore the complete request flow <ArrowRight size={14}/></Link>
  </section>;
}

function CachePath() {
  const steps = [
    { name: 'Match', detail: 'Entrypoint matches prefix hashes before routing.', location: 'METADATA' },
    { name: 'Fetch', detail: 'A separate process pulls matched block KV from 3FS.', location: '3FS → HOST' },
    { name: 'Swap in', detail: 'GDR transfers KV layer by layer as forward runs.', location: 'HOST → HBM' },
    { name: 'Replay', detail: 'On an SWA miss, rebuild the last 128-token window.', location: 'GPU' },
  ];
  return <section className="cache-path" aria-labelledby="cache-path-title">
    <div className="blender-copy-label">PRODUCTION CACHE PATH</div>
    <h3 id="cache-path-title">From a prefix hit to GPU execution</h3>
    <ol>{steps.map((step, i) => <li key={step.name}><span className="cache-path-number">0{i + 1} / {step.location}</span><strong>{step.name}</strong><p>{step.detail}</p></li>)}</ol>
    <Link to={fileRoute('doc/inference_deployment_qa.md', 155)}>Read the cache path in DeepSeek’s deployment notes <ArrowUpRight size={13}/></Link>
  </section>;
}

export function BlenderGallery({ target }: { target?: string }) {
  const [sources, setSources] = useState<Record<string, string> | null>(null);
  const [sourceError, setSourceError] = useState(false);
  const [peers, setPeers] = useState<Record<string, PeerSample> | null>(null);
  const [peerError, setPeerError] = useState(false);
  useEffect(() => {
    if (target) requestAnimationFrame(() => document.getElementById(`blender-${target}`)?.scrollIntoView({ block: 'start' }));
  }, [target]);
  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}source-data.json`)
      .then(response => { if (!response.ok) throw new Error('Source data unavailable'); return response.json() as Promise<Record<string, string>>; })
      .then(data => { if (active) setSources(data); })
      .catch(() => { if (active) setSourceError(true); });
    fetch(`${import.meta.env.BASE_URL}peer-source-data.json`)
      .then(response => { if (!response.ok) throw new Error('Comparison source unavailable'); return response.json() as Promise<Record<string, PeerSample>>; })
      .then(data => { if (active) setPeers(data); })
      .catch(() => { if (active) setPeerError(true); });
    return () => { active = false; };
  }, []);

  return <div className="blender-page">
    <header className="blender-intro">
      <div className="blender-eyebrow">DEEPINFER · A VISUAL SYSTEMS EXPLAINER</div>
      <h1>Inside DeepInfer’s inference system.</h1>
      <p>DeepSeek reports an average input cache-hit rate of 96% in its production table, a roughly 100 PiB shared 3FS store, and retention of roughly 3 days for agents and 7 days for chat. <Link to="/article/goals/production-table">Performance table</Link> · <Link to={fileRoute('doc/inference_deployment_qa.md', 151)}>Storage design</Link></p>
      <p>Play or step through cache, replay, expert placement, speculative verification and scheduling. Each animation follows the source and compares the corresponding path in vLLM or SGLang.</p>
      <a className="blender-download-all" href={asset('workshop-scenes', 'zip')} download><Download size={15}/> Download the six Blender files</a>
    </header>

    <RequestPath/>

    <details className="workshop-film">
      <summary><span>Watch the complete walkthrough</span><small>~2 MIN · SILENT</small></summary>
      <video controls preload="none" playsInline poster={asset('story-cache', 'jpg')} aria-label="The complete silent DeepInfer workshop animation">
        <source src={asset('story-full', 'mp4')} type="video/mp4"/>Your browser does not support embedded video. <a href={asset('story-full', 'mp4')}>Download the animation</a>.
      </video>
      <p>Six module walkthroughs, from cache through the complete request path.</p>
    </details>

    <nav className="blender-index" aria-label="Jump to a workshop chapter">
      {blenderScenes.map((scene, index) => <Link to={`/blender/${scene.id}`} key={scene.id}>
        <span>{index === 5 ? 'FINALE' : String(index + 1).padStart(2, '0')}</span><strong>{scene.title}</strong><ArrowRight size={15}/>
      </Link>)}
    </nav>

    <div className="blender-scenes">
      {blenderScenes.map((scene, index) => <article className="blender-scene" id={`blender-${scene.id}`} key={scene.id} aria-labelledby={`blender-title-${scene.id}`}>
        <div className="blender-scene-heading">
          <span className="blender-number">{index === 5 ? '↗' : String(index + 1).padStart(2, '0')}</span>
          <div><div className="blender-eyebrow">{scene.category}</div><h2 id={`blender-title-${scene.id}`}>{scene.title}</h2></div>
        </div>
        <div className="blender-scene-copy">
          <div className="blender-copy-label">THE MECHANISM</div>
          <p className="workshop-lede">{scene.description}</p>
          <div className="blender-note">{scene.context}</div>
          <div className="scene-implementation"><span>IN THE CODE</span><Evidence link={scene.implementation}/></div>
        </div>
        <ModuleAnimation sceneId={scene.id} title={scene.title} sources={sources} sourceError={sourceError} peers={peers} peerError={peerError}/>
        <div className="workshop-detail-grid">
          <div className="workshop-explanation"><div className="blender-copy-label">HOW IT WORKS</div>{scene.explanation.map(paragraph => <p key={paragraph.text}>{paragraph.text} <span className="inline-sources">{paragraph.sources.map(link => <Evidence key={link.href} link={link}/>)}</span></p>)}</div>
          <aside className="workshop-conversation"><div className="workshop-conversation-title"><MessageCircle size={15}/><span>IN THE CONVERSATION</span></div><blockquote>“{scene.social.quote}”<cite>— {scene.social.quoteBy}</cite></blockquote><p>{scene.social.text}</p><div>{scene.social.links.map(link => <Evidence key={link.href} link={link}/>)}</div></aside>
        </div>
        {scene.comparison && <section className="story-comparison"><div className="blender-copy-label">COMPARE THE IMPLEMENTATION</div><h3>{scene.comparison.title}</h3><p>{scene.comparison.text}</p><div>{scene.comparison.links.map(link => <Evidence key={link.href} link={link}/>)}</div></section>}
        {scene.id === 'story-cache' && <CachePath/>}
        <div className="workshop-sources"><span><FileCode2 size={15}/> FOLLOW THE SOURCES</span>{scene.links.map(link => <Evidence key={link.href} link={link}/>)}</div>
      </article>)}
    </div>

    <section className="workshop-economics">
      <div className="blender-eyebrow">A NOTE ON THE NUMBERS</div>
      <h2>What $38 per GPU-hour measures</h2>
      <p>DeepSeek reports $38 of revenue per GPU-hour at off-peak pricing for one cluster. Estimating margin also requires GPU, storage, network, power and operating costs.</p>
      <div><a href="https://x.com/swyx/status/2112587397380943953" target="_blank" rel="noreferrer">swyx’s estimate <ArrowUpRight size={13}/></a><a href="https://x.com/sigdel29/status/2112624964511707198" target="_blank" rel="noreferrer">A question from the conversation <ArrowUpRight size={13}/></a><Evidence link={{ label: 'DeepSeek’s reported figure', href: fileRoute('doc/inference_deployment_qa.md', 17) }}/></div>
    </section>
    <p className="workshop-method">Follow the discussion around <a href="https://x.com/deepseek_ai/status/2112476496283775135" target="_blank" rel="noreferrer">DeepSeek’s announcement</a>, <a href="https://x.com/swyx/status/2112587397380943953" target="_blank" rel="noreferrer">swyx’s note</a>, and <a href="https://x.com/latentspacepod/status/2112588380416647205" target="_blank" rel="noreferrer">Latent Space’s translation</a>.</p>
  </div>;
}
