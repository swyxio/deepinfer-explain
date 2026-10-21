import { fileRoute as file } from './routes';

export type StoryLink = { label: string; href: string; external?: boolean };
export type WorkshopScene = {
  id: string;
  title: string;
  category: string;
  description: string;
  context: string;
  explanation: string[];
  social: { text: string; quote: string; quoteBy: string; links: StoryLink[] };
  links: StoryLink[];
};

export const blenderScenes: WorkshopScene[] = [
  {
    id: 'story-cache', title: 'The conversation comes back', category: '01 / REUSE',
    description: 'A customer returns with the same dossier and a new page. The workshop retrieves the prepared state for the matching prefix, then works on the new material.',
    context: 'The archive represents cached intermediate KV state, not a saved answer or literal copies of the text. Shared storage and stage disaggregation describe DeepSeek’s production service; they are not a complete service in the release.',
    explanation: [
      'An agent or chat session often sends earlier messages, tool results, and instructions again as part of the next request. If the beginning of the token sequence matches a stored prefix, the system can reuse its attention state instead of repeating all of its prefill computation. A changed earlier token, a cold cache, expiry, or a different workload can reduce reuse.',
      'DeepSeek reports an average input cache-hit rate of 96% in its production table. It does not establish that every request or deployment achieves that rate, and the table does not fully specify how the average is aggregated. Repeated prefixes create the opportunity; in the described production system, compressed state, a roughly 100 PiB shared 3FS store, and retention of roughly 3 days for agents and 7 days for chat help preserve it. The short-lived SWA state is handled separately.',
    ],
    social: { quote: 'this is typical for agentic coding-heavy workloads', quoteBy: 'Yngkvn', text: 'Yngkvn connected the high figure to agentic workloads. That is an interpretation, not proof of the mix behind DeepSeek’s aggregate.', links: [
      { label: 'Yngkvn on Latent Space’s post', href: 'https://x.com/Yngkvn/status/2112647381468541057', external: true },
      { label: 'swyx’s note', href: 'https://x.com/swyx/status/2112587397380943953', external: true },
    ] },
    links: [
      { label: 'DeepSeek’s performance table', href: '/article/goals/production-table' },
      { label: 'Production cache and retention', href: file('doc/inference_deployment_qa.md', 129) },
      { label: 'Engine block manager', href: file('csrc/engine/block_manager.hpp', 14) },
      { label: 'PagedAttention research', href: '/research/pagedattention' },
    ],
  },
  {
    id: 'story-replay', title: 'Rebuild just the recent window', category: '02 / RECONSTRUCT',
    description: 'The long-lived dossier is still in the archive, but the workbench’s recent notes have expired. Replay the last window to rebuild those notes and continue.',
    context: 'This shows the encoder cache-miss path. Rebuilt sliding-window attention state is approximate; the persistent block KV is reused. Decoder replay is a separate use of the same idea.',
    explanation: [
      'DeepSeek separates long-lived block KV from short-lived sliding-window attention (SWA) state. The latter is kept in local host memory, with cross-machine retrieval available, rather than occupying the long-lived 3FS cache.',
      'If the block prefix is available but its SWA state is missing, the encoder replays the last 128 tokens of the hit prefix and continues with the new suffix. The attention window is truncated during replay, so this reconstruction is approximate. The model’s encoder–decoder design also uses bounded replay to reduce decoder prefill work.',
    ],
    social: { quote: 'SWA Bounded Replay recomputes only the most recent 128 tokens', quoteBy: 'Sophia Yang', text: 'Her end-to-end walkthrough connects cache storage, replay, and the rest of the serving stack. The rebuilt SWA state is approximate.', links: [
      { label: 'Sophia Yang on swyx’s post', href: 'https://x.com/sophiamyang/status/2112628190904742124', external: true },
    ] },
    links: [
      { label: 'Encoder and decoder replay', href: file('doc/inference_deployment_qa.md', 179) },
      { label: 'Annotated replay chapter', href: '/module/yoco' },
      { label: 'V4.1 model report', href: '/research/v41' },
      { label: 'YOCO comparison', href: '/research/yoco' },
    ],
  },
  {
    id: 'story-experts', title: 'Share the busy work', category: '03 / EXPERT PARALLELISM',
    description: 'The router sends token tiles to specialist workstations. When one specialist gets a queue, a second workstation gets a copy of that same specialist.',
    context: 'The workshop is a small schematic. Expert replicas are physical copies of the same logical expert; the router’s expert choices and the placement policy are different decisions.',
    explanation: [
      'Mixture-of-experts models activate selected experts for each token. In DeepSeek’s production setup, decode spreads experts widely across GPUs, increasing the effective batch and reducing per-step expert memory traffic. Prefill and decode use different parallelism because their work differs.',
      'A popular expert can hold up the whole group. DeepSeek describes measuring recent demand, placing redundant copies of hot experts, and periodically updating those placements. This helps spread work; the animation does not depict actual GPU counts or measured speedups.',
    ],
    social: { quote: 'efficiency on multiple dimensions all at once', quoteBy: 'GDP', text: 'GDP highlights Wide-EP as one part of a broader efficiency design. The vLLM team also pointed to DeepInfer’s lineage.', links: [
      { label: 'GDP’s breakdown', href: 'https://x.com/bookwormengr/status/2112636749293949122', external: true },
      { label: 'vLLM’s response', href: 'https://x.com/vllm_project/status/2112480719952138301', external: true },
    ] },
    links: [
      { label: 'Expert placement policy', href: file('deepinfer/model_executor/eplb/policy.py', 73) },
      { label: 'Wide-EP and load balancing', href: file('doc/inference_deployment_qa.md', 45) },
      { label: 'Annotated MoE chapter', href: '/module/moe' },
    ],
  },
  {
    id: 'story-dspark', title: 'Draft, then check', category: '04 / SPECULATIVE DECODING',
    description: 'A small drafting assistant proposes a strip of next-token tiles. The main model checks the candidates: an accepted prefix moves forward, while the remainder is discarded.',
    context: 'The number of drafts and accepted tokens is illustrative. Acceptance and speed depend on the model, traffic, and hardware; variable-length verification must be enabled.',
    explanation: [
      'Generating one token at a time can leave the model underused. Speculative decoding proposes several candidates cheaply, then checks them with the target model. Only the accepted prefix advances; the rest does not become output.',
      'DSpark adds a confidence head and allocates a verification budget across candidate positions. Promising prefixes can receive more verification work than unlikely ones. DeepSeek reports gains for particular operating points, not a universal speedup.',
    ],
    social: { quote: 'They also use their DSpark speculative decoding', quoteBy: 'GDP', text: 'GDP and Sophia Yang place DSpark alongside the other serving choices, rather than treating speculative decoding as an isolated trick.', links: [
      { label: 'GDP’s breakdown', href: 'https://x.com/bookwormengr/status/2112636749293949122', external: true },
      { label: 'Sophia Yang’s walkthrough', href: 'https://x.com/sophiamyang/status/2112628190904742124', external: true },
    ] },
    links: [
      { label: 'Allocate verification budget', href: file('deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 11) },
      { label: 'Deployment measurements', href: file('doc/inference_deployment_qa.md', 239) },
      { label: 'DSpark research', href: '/research/dspark' },
    ],
  },
  {
    id: 'story-overlap', title: 'Keep both workbenches moving', category: '05 / ASYNCHRONOUS SCHEDULING',
    description: 'First the device waits for the scheduler. Then the CPU prepares the next batch while the GPU executes the current one.',
    context: 'The lanes illustrate a scheduling dependency, not measured timing. The optimization overlaps adjacent decode steps and still has synchronization and correctness constraints.',
    explanation: [
      'Without overlap, CPU scheduling and result handling can create gaps between GPU steps. DeepInfer’s asynchronous scheduler prepares step N+1 while the device runs step N, with earlier post-processing also pipelined where possible.',
      'This is a serving technique with prior art: DeepSeek credits SGLang and NanoFlow. It reduces avoidable idle time; the name “zero overhead” should not be read as a measured guarantee of zero idle time for every workload.',
    ],
    social: { quote: 'CPU and GPU are pipelined asynchronously', quoteBy: 'Sophia Yang', text: 'Her walkthrough includes scheduling overlap. vLLM’s response is a reminder that DeepInfer builds on a larger inference-systems ecosystem.', links: [
      { label: 'Sophia Yang’s walkthrough', href: 'https://x.com/sophiamyang/status/2112628190904742124', external: true },
      { label: 'vLLM’s response', href: 'https://x.com/vllm_project/status/2112480719952138301', external: true },
    ] },
    links: [
      { label: 'Engine scheduling step', href: file('deepinfer/engine/llm_engine.py', 860) },
      { label: 'Scheduling Q&A and prior art', href: file('doc/inference_deployment_qa.md', 266) },
      { label: 'NanoFlow comparison', href: '/research/nanoflow' },
    ],
  },
  {
    id: 'story-system', title: 'Step back: one connected system', category: 'FINALE / THE WHOLE WORKSHOP',
    description: 'Zoom out from the archive to prefill, optional replay, expert work, draft verification, scheduling, and the returning answer.',
    context: 'The scene is a conceptual map, not a cluster topology or a literal trace. It separates the described production archive from the released engine; real request paths include additional routing, transfer, and model steps. Experts participate in model layers during both prefill and decode.',
    explanation: [
      'The pieces solve different problems: a shared cache avoids repeated prefill, replay repairs missing local state, experts and speculation make model execution more efficient, and overlap helps keep the device busy. Prefill and decode can be scaled separately in the production architecture.',
      'V4.1-Flash’s model architecture and serving system are designed together: its encoder–decoder structure, cross-layer KV reuse and compressed cache make the runtime’s storage and replay choices possible. Engram is another model-side memory component, not a generic feature invented by the inference engine.',
      'The release includes an offline inference engine and many underlying mechanisms. DeepSeek says the full shared KV service, VE/prefill/decode disaggregation service, and data-parallel replica load balancing are not included, although much of the engine functionality for disaggregation exists.',
    ],
    social: { quote: 'there are a few key missing pieces', quoteBy: 'Halex', text: 'Halex asks what remains outside the open release; GDP emphasizes how the optimizations fit together. DeepSeek’s README is the authority on the release boundary.', links: [
      { label: 'Halex on DeepSeek’s post', href: 'https://x.com/Halex623/status/2112691395400175753', external: true },
      { label: 'GDP on Latent Space’s post', href: 'https://x.com/bookwormengr/status/2112636749293949122', external: true },
    ] },
    links: [
      { label: 'Interactive request flow', href: '/codemap' },
      { label: 'Production architecture', href: file('doc/inference_deployment_qa.md', 23) },
      { label: 'What the release includes', href: file('README.md', 38) },
      { label: 'V4.1 model report', href: '/research/v41' },
      { label: 'DistServe comparison', href: '/research/distserve' },
    ],
  },
];
