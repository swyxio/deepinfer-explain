import { useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Download, FileCode2 } from 'lucide-react';
import './blender-gallery.css';

const source = 'https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';

export const blenderScenes = [
  {
    id: 'expert-traffic',
    title: 'Expert traffic jam',
    category: 'MIXTURE OF EXPERTS',
    description: 'Follow tokens toward experts, then see a busy expert get replicas on other GPUs to spread its load.',
    context: 'Replicas represent copies of a logical expert. Placement and traffic are simplified; this is not a trace of a running cluster.',
    chapter: 'moe',
    sourceLabel: 'Expert placement policy',
    sourceUrl: `${source}/deepinfer/model_executor/eplb/policy.py#L73`,
  },
  {
    id: 'near-far-attention',
    title: 'Near and far attention',
    category: 'ATTENTION',
    description: 'Compare the recent sliding window with compressed older KV; highlighted blocks suggest how sparse layers select older context.',
    context: 'Sparse selection depends on the layer. The moving highlight is a visual cue, not a literal sequential search.',
    chapter: 'attention',
    sourceLabel: 'Attention implementation',
    sourceUrl: `${source}/deepinfer/model_executor/models/v4_modules/attn.py#L589`,
  },
  {
    id: 'precision',
    title: 'The precision budget',
    category: 'LOW-PRECISION COMPUTATION',
    description: 'See expert weights, main KV and indexer KV highlighted as places where DeepSeek describes using FP4.',
    context: 'Colors and geometry are illustrative. FP4 formats and scaling differ between these components, and not every tensor uses FP4.',
    chapter: 'kernels',
    sourceLabel: 'Low-precision Q&A',
    sourceUrl: `${source}/doc/inference_deployment_qa.md#L213`,
  },
  {
    id: 'vision',
    title: 'How the model sees an image',
    category: 'MULTIMODAL INPUT',
    description: 'An image becomes patches and passes through a vision encoder, producing visual features alongside separately tokenized text.',
    context: 'The patches and features are schematic. The scene leaves out details such as image preprocessing and the exact embedding layout.',
    chapter: 'multimodal',
    sourceLabel: 'Multimodal processor',
    sourceUrl: `${source}/deepinfer/ve/multimodal_processor.py#L105`,
  },
  {
    id: 'parallelism',
    title: 'Fold a long prompt across GPUs',
    category: 'CONTEXT PARALLELISM',
    description: 'A prompt splits into eight slices; mirrored pairs travel to four GPUs so each receives an early and a late slice.',
    context: 'Four GPUs and eight slices are an example. This isolates the mirrored layout, not the complete communication or attention path.',
    chapter: 'parallelism',
    sourceLabel: 'Mirror preparation kernel',
    sourceUrl: `${source}/deepinfer/model_executor/layers/tilelang_ops/cuda/prepare_cp_mirror.py#L64`,
  },
] as const;

function asset(id: string, extension: string) {
  return `${import.meta.env.BASE_URL}blender/${id}.${extension}`;
}

export function BlenderGallery({ target }: { target?: string }) {
  useEffect(() => {
    if (target) requestAnimationFrame(() => document.getElementById(`blender-${target}`)?.scrollIntoView({ block: 'start' }));
  }, [target]);

  return <div className="blender-page">
    <header className="blender-intro">
      <div className="blender-eyebrow">FIVE MECHANISMS · MODELED IN BLENDER</div>
      <h1>DeepInfer in 3D.</h1>
      <p>Five visual experiments for exploring the machinery behind inference. Play a scene, then open the editable Blender file or follow it into the code.</p>
      <div className="blender-disclaimer">Early conceptual prototypes · silent six-second previews · not benchmarks, runtime traces, or complete implementations</div>
      <a className="blender-download-all" href={asset('deepinfer-scenes', 'zip')} download><Download size={15}/> Download all five Blender files</a>
    </header>

    <nav className="blender-index" aria-label="Jump to a Blender scene">
      {blenderScenes.map((scene, index) => <a href={`#blender/${scene.id}`} key={scene.id}>
        <span>{String(index + 1).padStart(2, '0')}</span><strong>{scene.title}</strong><ArrowRight size={15}/>
      </a>)}
    </nav>

    <div className="blender-scenes">
      {blenderScenes.map((scene, index) => <article className="blender-scene" id={`blender-${scene.id}`} key={scene.id} aria-labelledby={`blender-title-${scene.id}`}>
        <div className="blender-scene-heading">
          <span className="blender-number">{String(index + 1).padStart(2, '0')}</span>
          <div><div className="blender-eyebrow">{scene.category}</div><h2 id={`blender-title-${scene.id}`}>{scene.title}</h2></div>
        </div>
        <div className="blender-scene-grid">
          <div className="blender-player">
            <video controls preload="metadata" poster={asset(scene.id, 'jpg')} aria-label={`${scene.title}: silent Blender animation`}>
              <source src={asset(scene.id, 'mp4')} type="video/mp4" />
              Your browser does not support embedded video. <a href={asset(scene.id, 'mp4')}>Download the animation</a>.
            </video>
            <div className="blender-player-caption"><span>BLENDER ANIMATION</span><span>6 SECONDS · SILENT</span></div>
          </div>
          <div className="blender-scene-copy">
            <div className="blender-copy-label">WHAT TO WATCH</div>
            <p>{scene.description}</p>
            <div className="blender-note">{scene.context}</div>
            <div className="blender-links">
              <a className="blender-download" href={asset(scene.id, 'blend')} download><Download size={15}/> Download Blender file</a>
              <a href={`#module/${scene.chapter}`}><FileCode2 size={15}/> Annotated code <ArrowRight size={14}/></a>
              <a href={scene.sourceUrl} target="_blank" rel="noreferrer">{scene.sourceLabel} <ArrowUpRight size={14}/></a>
            </div>
          </div>
        </div>
      </article>)}
    </div>
  </div>;
}
