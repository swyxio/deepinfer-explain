import { ArrowRight, ArrowUpRight, Cpu, FileCode2, GitBranch, Layers3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { fileRoute } from './codemap';
import { coverageRows, modelComparisons, modelSources, modelStageSources, type CoverageStatus } from './model-support';
import './model-support.css';

const routeFor = (source: { path: string; line: number }) => fileRoute(source.path, source.line);
const registry = routeFor(modelSources.registry);
const config = routeFor(modelSources.config);
const galleryUrl = 'https://sebastianraschka.com/llm-architecture-gallery/';
const v41Stages = modelStageSources.map(routeFor);
function Status({ status }: { status: CoverageStatus }) {
  const tone = status === 'Documented' || status === 'Tests defined' || status === 'Optional' ? 'positive' : status === 'Unspecified' ? 'unknown' : 'limited';
  return <span className={`model-status ${tone}`}>{status}</span>;
}
function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children} <ArrowUpRight size={13} aria-hidden="true"/></a>;
}

export function ModelSupportPage({ target }: { target?: string }) {
  const selected = modelComparisons.find(model => model.id === target) || modelComparisons[0];
  return <div className="models-page">
    <header className="models-intro">
      <div className="models-intro-copy"><p className="models-kicker">Model compatibility · DeepInfer 774ce24</p><h1>Which models run,<br/>and where?</h1><p>The release names <strong>one model family</strong> and <strong>two accelerator targets</strong>. Explore nearby architectures without mistaking a family resemblance for runtime support.</p><div className="models-intro-links"><a href={registry}><FileCode2 size={15}/> Inspect the model registry</a><External href={galleryUrl}>Raschka’s architecture gallery</External></div></div>
      <div className="models-scope"><div><strong>1</strong><span>registered architecture</span></div><div><strong>2</strong><span>documented hardware targets</span></div><p>Based on source inspection of the pinned release. No accelerator run was performed for this guide.</p></div>
    </header>

    <section className="models-section" aria-labelledby="model-gallery-title">
      <div className="models-section-heading"><div><h2 id="model-gallery-title">Models in context</h2><p>Select a model to see its architecture and its relationship to the release.</p></div><span>Gallery-inspired comparison</span></div>
      <div className="model-explorer">
        <nav className="model-list" aria-label="Choose a model">{modelComparisons.map(model => <a href={`#models/${model.id}`} key={model.id} className={selected.id === model.id ? 'selected' : ''} aria-current={selected.id === model.id ? 'true' : undefined}><span><strong>{model.name}</strong><small>{model.family}</small></span><span className={`model-list-dot ${model.listed ? 'listed' : ''}`} aria-label={model.listed ? 'Listed by DeepInfer' : 'Comparison only'}/></a>)}</nav>
        <article className="model-detail" aria-live="polite">
          <div className="model-detail-heading"><div><span className={`model-classification ${selected.listed ? 'listed' : 'comparison'}`}>{selected.listed ? 'Listed by DeepInfer' : 'Comparison only · not listed'}</span><h3>{selected.name}</h3></div><External href={selected.gallery}>View gallery card</External></div>
          <p className="model-detail-summary">{selected.summary}</p>
          <dl className="model-facts"><div><dt>Scale</dt><dd>{selected.scale}</dd></div><div><dt>Architecture</dt><dd>{selected.architecture}</dd></div><div><dt>Attention</dt><dd>{selected.attention}</dd></div><div><dt>Model context</dt><dd>{selected.context}</dd></div></dl>
          <div className="model-blueprint"><div className="model-blueprint-heading"><strong>Text backbone, simplified</strong><span>{selected.listed ? 'Select a stage to inspect the code' : 'Select a stage to open the gallery'}</span></div><div className="model-blueprint-flow">{selected.stages.map((stage, index) => <span className="model-stage-wrap" key={stage}><a href={selected.listed ? v41Stages[index] : selected.gallery} {...(!selected.listed ? { target: '_blank', rel: 'noreferrer' } : {})}><small>{index === 0 || index === selected.stages.length - 1 ? 'I/O' : 'BACKBONE'}</small><strong>{stage}</strong></a>{index < selected.stages.length - 1 && <ArrowRight size={15} aria-hidden="true"/>}</span>)}</div><p>This is a conceptual sketch, not a complete layer graph. {selected.listed ? 'Engram, vision processing, and other paths are not shown.' : 'Model architecture similarity does not establish runtime support.'}</p></div>
          <div className="model-detail-footer">{selected.listed ? <><a href={config}>See checkpoint constraints <ArrowUpRight size={13}/></a><a href="#module/model">Read the V4.1 model chapter <ArrowUpRight size={13}/></a><a href="#research/v41">Open the technical report <ArrowUpRight size={13}/></a></> : <><a href={registry}>Why it is not listed <ArrowUpRight size={13}/></a><a href="#compare">Compare designs <ArrowUpRight size={13}/></a></>}</div>
        </article>
      </div>
      <p className="models-note">Architecture facts and the illustrated model variants are from <External href={galleryUrl}>Sebastian Raschka’s gallery</External>. Its V4.1 card describes the base model’s text backbone; DeepInfer’s default is the 1017 checkpoint. Model context is not the same as the limits configured in an example run.</p>
    </section>

    <section className="models-section" aria-labelledby="hardware-title">
      <div className="models-section-heading"><div><h2 id="hardware-title">Where the release runs</h2><p>The README lists these platforms for V4.1-Flash offline inference.</p></div></div>
      <div className="platform-grid"><article><div className="platform-icon"><Cpu size={19}/></div><div><h3>NVIDIA SM100</h3><p>CUDA 13 · NCCL · CUDA TileLang</p><a href={routeFor(modelSources.nvidia)}>Inspect the GPU platform <ArrowUpRight size={13}/></a></div></article><article><div className="platform-icon ascend"><Cpu size={19}/></div><div><h3>Huawei Ascend 950</h3><p>CANN 9.2 · HCCL · Ascend TileLang</p><a href={routeFor(modelSources.ascend)}>Inspect the NPU platform <ArrowUpRight size={13}/></a></div></article></div>
      <p className="models-note">Common prerequisites include Linux, GCC 13+ and Python 3.12. Choose the accelerator at build time; the published performance plots are specifically for SM100 and should not be interpreted as Ascend results. <a href={routeFor(modelSources.setup)}>Read the setup and benchmark conditions <ArrowUpRight size={12}/></a></p>
    </section>

    <section className="models-section" aria-labelledby="coverage-title">
      <div className="models-section-heading"><div><h2 id="coverage-title">Feature coverage</h2><p>What the pinned release documents or tests for the listed model—not a cross-hardware benchmark.</p></div></div>
      <div className="coverage-legend"><span><i className="legend-dot positive"/> Documented, optional, or tests defined</span><span><i className="legend-dot unknown"/> Backend qualification unspecified</span><span><i className="legend-dot limited"/> Restricted or absent</span></div>
      <div className="coverage-wrap"><table className="coverage-table"><thead><tr><th scope="col">Feature</th><th scope="col">NVIDIA SM100</th><th scope="col">Ascend 950</th><th scope="col">Conditions & evidence</th></tr></thead><tbody>{coverageRows.map(row => <tr key={row.feature}><th scope="row">{row.feature}</th><td data-label="NVIDIA SM100"><Status status={row.nvidia}/></td><td data-label="Ascend 950"><Status status={row.ascend}/></td><td data-label="Conditions & evidence"><p>{row.note}</p><a href={fileRoute(row.source.path, row.source.line)}>{row.source.label} <ArrowUpRight size={12}/></a></td></tr>)}</tbody></table></div>
      <p className="models-note">“Tests defined” refers to test markers in the repository, not observed CI results. “Unspecified” means the release lists the feature but this guide has not established a backend-specific claim. <a href={routeFor(modelSources.features)}>See the release feature list <ArrowUpRight size={12}/></a></p>
    </section>

    <section className="model-next"><div><Layers3 size={19}/><div><strong>Follow a supported request</strong><p>Trace the released offline path from input through scheduling and generation.</p></div></div><a href="#codemap"><GitBranch size={15}/> Open the request flow <ArrowRight size={15}/></a></section>
  </div>;
}
