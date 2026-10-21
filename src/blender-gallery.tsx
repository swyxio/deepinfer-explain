import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Download, FileCode2, MessageCircle } from 'lucide-react';
import { blenderScenes, type StoryLink } from './blender-story';
import './blender-gallery.css';

export { blenderScenes } from './blender-story';

function asset(id: string, extension: string) {
  return `${import.meta.env.BASE_URL}blender/${id}.${extension}`;
}

function Evidence({ link }: { link: StoryLink }) {
  return <a href={link.href} {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}>{link.label} <ArrowUpRight size={13} aria-hidden="true"/></a>;
}

function CacheExample() {
  const [fresh, setFresh] = useState(400);
  const old = 8000;
  const total = old + fresh;
  const fraction = old / total * 100;
  return <div className="workshop-example">
    <div className="workshop-example-head"><div><span className="blender-copy-label">A SIMPLE EXAMPLE</span><h3>Why a small new message can make a big hit</h3></div><span className="example-badge">WARM CACHE</span></div>
    <p>Suppose a later request repeats 8,000 earlier tokens and adds a new message. Move the slider to see how the repeated share changes.</p>
    <label className="example-control" htmlFor="new-tokens"><span>New tokens <strong>{fresh.toLocaleString()}</strong></span><input id="new-tokens" type="range" min="100" max="8000" step="100" value={fresh} onChange={event => setFresh(Number(event.target.value))}/></label>
    <div className="example-bar" role="img" aria-label={`${fraction.toFixed(1)} percent repeated prefix and ${(100-fraction).toFixed(1)} percent new tokens`}><span style={{ width: `${fraction}%` }}/><i/></div>
    <div className="example-result"><span><i className="example-dot cached"/> {old.toLocaleString()} repeated tokens</span><span><i className="example-dot fresh"/> {fresh.toLocaleString()} new tokens</span><strong>{fraction.toFixed(1)}% repeated</strong></div>
    <small>This is a hypothetical warmed request, not DeepSeek’s aggregate measurement or exact hit policy. It omits cold starts, cache expiry, block alignment, and SWA backoff; repeated text must match the relevant token prefix.</small>
  </div>;
}

export function BlenderGallery({ target }: { target?: string }) {
  useEffect(() => {
    if (target) requestAnimationFrame(() => document.getElementById(`blender-${target}`)?.scrollIntoView({ block: 'start' }));
  }, [target]);

  return <div className="blender-page">
    <header className="blender-intro">
      <div className="blender-eyebrow">A CONNECTED VISUAL EXPLAINER · MADE IN BLENDER</div>
      <h1>A request walks into a workshop.</h1>
      <p>Follow one returning conversation through five ideas behind DeepInfer, then zoom out to see how they fit together. The workshop is an analogy; the code, papers, and production claims are linked at each stop.</p>
      <div className="workshop-legend" aria-label="Visual key"><span><i className="legend-state"/> Saved state</span><span><i className="legend-new"/> New or recomputed work</span><span><i className="legend-expert"/> Expert work</span><span><i className="legend-output"/> Output</span></div>
      <div className="blender-disclaimer">Six silent, conceptual animations · editable Blender files · not runtime traces or benchmarks</div>
      <a className="blender-download-all" href={asset('workshop-scenes', 'zip')} download><Download size={15}/> Download the six Blender files</a>
    </header>

    <section className="workshop-film" aria-labelledby="workshop-film-title">
      <div className="workshop-film-head"><div><div className="blender-eyebrow">THE COMPLETE JOURNEY</div><h2 id="workshop-film-title">Watch the workshop come together.</h2></div><span>~1 MIN · SILENT</span></div>
      <video controls preload="none" playsInline poster={asset('story-cache', 'jpg')} aria-label="The complete silent DeepInfer workshop animation">
        <source src={asset('story-full', 'mp4')} type="video/mp4"/>Your browser does not support embedded video. <a href={asset('story-full', 'mp4')}>Download the animation</a>.
      </video>
      <p>Watch straight through, or use the chapter guide below to pause on each idea. The explanations provide a text version of the visual story.</p>
    </section>

    <nav className="blender-index" aria-label="Jump to a workshop chapter">
      {blenderScenes.map((scene, index) => <a href={`#blender/${scene.id}`} key={scene.id}>
        <span>{index === 5 ? 'FINALE' : String(index + 1).padStart(2, '0')}</span><strong>{scene.title}</strong><ArrowRight size={15}/>
      </a>)}
    </nav>

    <div className="blender-scenes">
      {blenderScenes.map((scene, index) => <article className="blender-scene" id={`blender-${scene.id}`} key={scene.id} aria-labelledby={`blender-title-${scene.id}`}>
        <div className="blender-scene-heading">
          <span className="blender-number">{index === 5 ? '↗' : String(index + 1).padStart(2, '0')}</span>
          <div><div className="blender-eyebrow">{scene.category}</div><h2 id={`blender-title-${scene.id}`}>{scene.title}</h2></div>
        </div>
        <div className="blender-scene-grid">
          <div className="blender-player">
            <video controls preload="none" playsInline poster={asset(scene.id, 'jpg')} aria-label={`${scene.title}: silent Blender animation`}>
              <source src={asset(scene.id, 'mp4')} type="video/mp4" />
              Your browser does not support embedded video. <a href={asset(scene.id, 'mp4')}>Download the animation</a>.
            </video>
            <div className="blender-player-caption"><span>THE WORKSHOP · {index === 5 ? 'FINALE' : `CHAPTER ${index + 1}`}</span><span>10 SECONDS · SILENT</span></div>
          </div>
          <div className="blender-scene-copy">
            <div className="blender-copy-label">WHAT TO WATCH</div>
            <p className="workshop-lede">{scene.description}</p>
            <div className="blender-note">{scene.context}</div>
            <a className="blender-download" href={asset(scene.id, 'blend')} download><Download size={15}/> Download editable scene</a>
          </div>
        </div>
        <div className="workshop-detail-grid">
          <div className="workshop-explanation"><div className="blender-copy-label">HOW IT WORKS</div>{scene.explanation.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
          <aside className="workshop-conversation"><div className="workshop-conversation-title"><MessageCircle size={15}/><span>IN THE CONVERSATION</span></div><blockquote>“{scene.social.quote}”<cite>— {scene.social.quoteBy}</cite></blockquote><p>{scene.social.text}</p><div>{scene.social.links.map(link => <Evidence key={link.href} link={link}/>)}</div></aside>
        </div>
        {scene.id === 'story-cache' && <CacheExample/>}
        <div className="workshop-sources"><span><FileCode2 size={15}/> FOLLOW THE SOURCES</span>{scene.links.map(link => <Evidence key={link.href} link={link}/>)}</div>
      </article>)}
    </div>

    <section className="workshop-economics">
      <div className="blender-eyebrow">A NOTE ON THE NUMBERS</div>
      <h2>Revenue is not a profit margin.</h2>
      <p>DeepSeek reports $38 of revenue per GPU-hour at off-peak pricing for one cluster. Estimates of margin require assumptions about GPU, storage, network, power, and operating costs; those costs are not established by that figure.</p>
      <div><a href="https://x.com/swyx/status/2112587397380943953" target="_blank" rel="noreferrer">swyx’s estimate <ArrowUpRight size={13}/></a><a href="https://x.com/sigdel29/status/2112624964511707198" target="_blank" rel="noreferrer">A question from the conversation <ArrowUpRight size={13}/></a><Evidence link={{ label: 'DeepSeek’s reported figure', href: '#file/doc%2Finference_deployment_qa.md/L17' }}/></div>
    </section>
    <p className="workshop-method">Community posts show what people found interesting; they are commentary, not independent verification. This is a sample of quote-posts around <a href="https://x.com/deepseek_ai/status/2112476496283775135" target="_blank" rel="noreferrer">DeepSeek’s announcement</a>, <a href="https://x.com/swyx/status/2112587397380943953" target="_blank" rel="noreferrer">swyx’s note</a>, and <a href="https://x.com/latentspacepod/status/2112588380416647205" target="_blank" rel="noreferrer">Latent Space’s translation</a>, not a census. Code links are pinned to the revision used throughout this guide.</p>
  </div>;
}
