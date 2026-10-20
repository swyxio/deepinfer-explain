/** Model comparisons are a curated subset of the architecture gallery, not a
 * claim that DeepInfer supports the models in the gallery. */
export type ModelComparison = {
  id: string;
  name: string;
  family: string;
  listed: boolean;
  scale: string;
  architecture: string;
  attention: string;
  context: string;
  summary: string;
  stages: string[];
  gallery: string;
};

const gallery = (id: string) => `https://sebastianraschka.com/llm-architecture-gallery/#card-${id}`;

export const modelSources = {
  registry: { path: 'deepinfer/model_executor/models/__init__.py', line: 14 },
  config: { path: 'deepinfer/hugging_face/config.py', line: 237 },
  nvidia: { path: 'deepinfer/platform.py', line: 55 },
  ascend: { path: 'deepinfer/platform.py', line: 86 },
  setup: { path: 'README.md', line: 44 },
  features: { path: 'README.md', line: 9 },
};
export const modelStageSources = [
  { path: 'deepinfer/entrypoints/llm.py', line: 90 },
  { path: 'deepinfer/model_executor/models/v4_modules/builder.py', line: 93 },
  { path: 'deepinfer/model_executor/models/v4_modules/cross_layer.py', line: 24 },
  { path: 'deepinfer/model_executor/models/decoder_layer.py', line: 48 },
  { path: 'deepinfer/model_executor/layers/sampler.py', line: 59 },
];

export const modelComparisons: ModelComparison[] = [
  {
    id: 'deepseek-v41-flash', name: 'DeepSeek V4.1-Flash', family: 'DeepSeek · released target', listed: true,
    scale: '552B backbone + 196B Engram', architecture: 'Causal encoder–decoder MoE',
    attention: 'CSA2 + sliding window; shared KV and index', context: '1,048,576 tokens',
    summary: 'The gallery depicts the text backbone: 20 encoder and 20 decoder layers, with cross-layer cache sharing. DeepInfer’s examples default to the separate 1017 checkpoint; a different checkpoint must still satisfy the runtime’s config and weight checks.',
    stages: ['Input', 'Encoder · 20 layers', 'Shared global KV', 'Decoder · 20 layers', 'Output'],
    gallery: gallery('deepseek-v4-1-flash'),
  },
  {
    id: 'deepseek-v4-flash', name: 'DeepSeek V4-Flash', family: 'DeepSeek · architecture comparison', listed: false,
    scale: '284B total · 13B active', architecture: 'Decoder-only sparse MoE',
    attention: 'Compressed sparse / heavily compressed attention', context: '1,048,576 tokens',
    summary: 'The earlier V4-Flash uses compressed attention and mixture-of-experts blocks. Its published config identifies a V4 architecture; that is not the V4.1 architecture registered by this DeepInfer release.',
    stages: ['Input', 'Compressed attention', 'Routed experts', 'Output'], gallery: gallery('deepseek-v4-flash'),
  },
  {
    id: 'deepseek-v4-pro', name: 'DeepSeek V4-Pro', family: 'DeepSeek · architecture comparison', listed: false,
    scale: '1.6T total · 49B active', architecture: 'Decoder-only sparse MoE',
    attention: 'Compressed sparse / heavily compressed attention', context: '1,048,576 tokens',
    summary: 'The larger V4 model shares the V4 family’s compressed-attention and MoE ideas. Similar components do not make it a registered V4.1-Flash checkpoint.',
    stages: ['Input', 'Compressed attention', 'Routed experts', 'Output'], gallery: gallery('deepseek-v4-pro'),
  },
  {
    id: 'deepseek-v32', name: 'DeepSeek V3.2', family: 'DeepSeek · architecture comparison', listed: false,
    scale: '671B total · 37B active', architecture: 'Decoder-only sparse MoE',
    attention: 'MLA + DeepSeek Sparse Attention', context: '128,000 tokens',
    summary: 'V3.2 extends the V3-style decoder with sparse attention. It is a useful ancestor for discussing attention and experts, but is not listed as a DeepInfer model in this release.',
    stages: ['Input', 'MLA + sparse selection', 'Routed experts', 'Output'], gallery: gallery('deepseek-v3-2'),
  },
  {
    id: 'deepseek-v3', name: 'DeepSeek V3', family: 'DeepSeek · architecture comparison', listed: false,
    scale: '671B total · 37B active', architecture: 'Decoder-only sparse MoE',
    attention: 'Multi-head latent attention (MLA)', context: '128,000 tokens',
    summary: 'V3 combines MLA and MoE, with a dense prefix and shared expert. Its published architecture is distinct from the one registered in this DeepInfer release.',
    stages: ['Input', 'MLA', 'Dense / MoE blocks', 'Output'], gallery: gallery('deepseek-v3'),
  },
  {
    id: 'deepseek-r1', name: 'DeepSeek R1', family: 'DeepSeek · architecture comparison', listed: false,
    scale: '671B total · 37B active', architecture: 'V3-family sparse MoE',
    attention: 'Multi-head latent attention (MLA)', context: '128,000 tokens',
    summary: 'The gallery describes R1 as a reasoning-tuned model built on the V3 architecture. A related model family is not evidence of a compatible DeepInfer runtime.',
    stages: ['Input', 'MLA', 'Dense / MoE blocks', 'Output'], gallery: gallery('deepseek-r1'),
  },
  {
    id: 'llama-3', name: 'Llama 3 · 8B', family: 'Meta · architecture comparison', listed: false,
    scale: '8B parameters', architecture: 'Dense decoder',
    attention: 'Grouped-query attention (GQA)', context: '8,192 tokens',
    summary: 'A dense GQA decoder gives a useful contrast to V4.1’s causal encoder–decoder and routed experts. It is not an advertised DeepInfer target in this release.',
    stages: ['Input', 'GQA', 'Dense feed-forward', 'Output'], gallery: gallery('llama-3-8b'),
  },
  {
    id: 'qwen3-moe', name: 'Qwen3 · 235B-A22B', family: 'Alibaba · architecture comparison', listed: false,
    scale: '235B total · 22B active', architecture: 'Decoder-only sparse MoE',
    attention: 'GQA with QK normalization', context: '128,000 tokens',
    summary: 'Qwen3 is another sparse MoE design, but it uses a different attention stack and model architecture. The shared MoE label does not imply runtime compatibility.',
    stages: ['Input', 'GQA', 'Routed experts', 'Output'], gallery: gallery('qwen3-235b-a22b'),
  },
];

export type CoverageStatus = 'Documented' | 'Tests defined' | 'Optional' | 'Not supported' | 'Unspecified' | 'Not included';
export interface CoverageRow {
  feature: string;
  nvidia: CoverageStatus;
  ascend: CoverageStatus;
  note: string;
  source: { label: string; path: string; line: number };
}

/** Feature-level claims are intentionally narrower than README's general list. */
export const coverageRows: CoverageRow[] = [
  { feature: 'V4.1-Flash offline inference', nvidia: 'Documented', ascend: 'Documented', note: 'The README names SM100 GPUs and Ascend 950 NPUs. This is source documentation, not a run by this guide.', source: { label: 'Supported model and hardware', path: 'README.md', line: 33 } },
  { feature: 'Text and image examples', nvidia: 'Tests defined', ascend: 'Tests defined', note: 'The offline samples include text and image prompts; the offline test has both CI markers. We have not run it on either platform.', source: { label: 'Offline test', path: 'tests/models/test_offline_inference.py', line: 161 } },
  { feature: 'Structured output', nvidia: 'Tests defined', ascend: 'Tests defined', note: 'The marked offline test enables regex, JSON and EBNF checks. A test definition is not proof of an observed passing run.', source: { label: 'Example checks', path: 'examples/README.md', line: 13 } },
  { feature: 'Batch-invariant inference', nvidia: 'Optional', ascend: 'Not supported', note: 'Enabled with DEEPINFER_BATCH_INVARIANT=1 on NVIDIA. The NPU worker explicitly rejects this mode.', source: { label: 'Platform guard', path: 'deepinfer/worker/runtime_config.py', line: 54 } },
  { feature: 'Deterministic sampling recipe', nvidia: 'Optional', ascend: 'Unspecified', note: 'The README documents a fixed-seed recipe for NVIDIA only; it also disables variable-length verification. An Ascend equivalent is not established here.', source: { label: 'Sampling configuration', path: 'README.md', line: 27 } },
  { feature: 'DSpark variable verification', nvidia: 'Unspecified', ascend: 'Unspecified', note: 'Listed as a release feature, with an opt-in setting. The README does not give a complete per-platform qualification.', source: { label: 'Feature configuration', path: 'README.md', line: 24 } },
  { feature: 'SWA bounded replay', nvidia: 'Unspecified', ascend: 'Unspecified', note: 'Listed as a release feature; this table does not infer identical support for every backend and setting.', source: { label: 'Replay configuration', path: 'README.md', line: 25 } },
  { feature: 'Asynchronous scheduling', nvidia: 'Unspecified', ascend: 'Unspecified', note: 'Listed and enabled by default, but the README does not provide a complete backend-by-backend qualification.', source: { label: 'Scheduling configuration', path: 'README.md', line: 26 } },
  { feature: 'Complete online serving system', nvidia: 'Not included', ascend: 'Not included', note: 'Persistent KV storage, complete stage disaggregation and replica load balancing remain outside the release.', source: { label: 'Release boundary', path: 'README.md', line: 38 } },
];
