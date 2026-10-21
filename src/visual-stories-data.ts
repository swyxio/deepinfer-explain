export type VisualStory = {
  id: 'cache' | 'split' | 'replay' | 'draft' | 'overlap';
  kicker: string;
  title: string;
  hook: string;
  why: string;
  stages: { label: string; caption: string }[];
  boundary: string;
  links: { label: string; href: string; kind: 'code' | 'paper' | 'context' }[];
};

const file = (path: string, line: number) => `#file/${encodeURIComponent(path)}/L${line}`;

export const visualStories: VisualStory[] = [
  {
    id: 'cache',
    kicker: '01 / Reuse',
    title: 'The prompt comes back',
    hook: 'A conversation can resend almost the same context again and again.',
    why: 'Reusing a matching prefix avoids repeating its prefill work. DeepSeek reports a 96% input cache-hit rate for its production workload; a cache hit is reused work, not faster GPU computation.',
    stages: [
      { label: 'Repeated request', caption: 'The conversation returns with a familiar prefix and a new suffix.' },
      { label: 'Find a match', caption: 'In production, prefix metadata identifies reusable blocks before routing; matching state is fetched from storage.' },
      { label: 'Reuse and prefill', caption: 'Load the matched blocks and prefill the uncached suffix.' },
      { label: 'Decode', caption: 'Generate the answer using the prepared state.' },
    ],
    boundary: 'This illustrates the described production cache path. The release includes in-engine block management, but not the shared KV storage service.',
    links: [
      { label: 'Reported production figures', href: '#article/goals/production-table', kind: 'context' },
      { label: 'Production cache design', href: file('doc/inference_deployment_qa.md', 129), kind: 'context' },
      { label: 'Prefix matching and fetching', href: file('doc/inference_deployment_qa.md', 155), kind: 'context' },
      { label: 'In-engine block manager', href: file('csrc/engine/block_manager.hpp', 14), kind: 'code' },
      { label: 'PagedAttention', href: '#research/pagedattention', kind: 'paper' },
    ],
  },
  {
    id: 'split',
    kicker: '02 / Scale',
    title: 'One request, different jobs',
    hook: 'Processing a long prompt and generating the next token place different demands on hardware.',
    why: 'DeepSeek separates vision, prefill and decode in production so it can allocate resources to each stage independently. Its decode configuration uses much wider expert parallelism than prefill.',
    stages: [
      { label: 'Request', caption: 'Text arrives; a separate vision encoder handles images when needed.' },
      { label: 'Prefill', caption: 'Process input tokens and prepare KV state using a smaller expert-parallel group.' },
      { label: 'Transfer', caption: 'Send the prepared state from prefill to decode.' },
      { label: 'Decode', caption: 'Generate the response over successive steps, using a wider expert-parallel group.' },
    ],
    boundary: 'This is the production design, not an included end-to-end disaggregated service. DeepSeek describes EP2–8 for prefill and EP64–128 for decode as its deployment choices, not requirements for every run.',
    links: [
      { label: 'Production architecture and parallelism', href: file('doc/inference_deployment_qa.md', 23), kind: 'context' },
      { label: 'Release boundary', href: file('README.md', 38), kind: 'context' },
      { label: 'Offline scheduler', href: file('csrc/engine/scheduler.hpp', 622), kind: 'code' },
      { label: 'DistServe', href: '#research/distserve', kind: 'paper' },
    ],
  },
  {
    id: 'replay',
    kicker: '03 / Reconstruct',
    title: 'Rebuild the missing window',
    hook: 'What if the long-lived prefix is cached, but its recent sliding-window state is gone?',
    why: 'Bounded replay trades a small amount of recomputation for less persistent storage. Replaying a suffix cannot recover the original attention context exactly, so the rebuilt state is approximate.',
    stages: [
      { label: 'Prefix hit', caption: 'The production cache still has the matching block KV.' },
      { label: 'Window miss', caption: 'The encoder’s sliding-window attention state is unavailable.' },
      { label: 'Replay a suffix', caption: 'Recompute the last 128 tokens of the hit prefix.' },
      { label: 'Continue', caption: 'Reuse block KV and process the new suffix with rebuilt local state.' },
    ],
    boundary: 'The illustration shows the production encoder-miss path. The release also has a separate, configurable decoder replay path; its documented compact setting retains 140 tokens.',
    links: [
      { label: 'Encoder and decoder replay', href: file('doc/inference_deployment_qa.md', 179), kind: 'context' },
      { label: 'Replay configuration', href: file('README.md', 25), kind: 'code' },
      { label: 'Truncation modes', href: file('deepinfer/environ.py', 188), kind: 'code' },
      { label: 'V4.1 model report', href: '#research/v41', kind: 'paper' },
      { label: 'YOCO', href: '#research/yoco', kind: 'paper' },
    ],
  },
  {
    id: 'draft',
    kicker: '04 / Speculate',
    title: 'Verify the promising drafts',
    hook: 'A draft model can propose several tokens before the larger model checks them.',
    why: 'Not every proposed token is equally likely to survive. DSpark uses confidence estimates and a verification budget to concentrate work on more promising prefixes.',
    stages: [
      { label: 'Draft', caption: 'Propose candidate tokens for each request.' },
      { label: 'Estimate', caption: 'Predict acceptance and calculate cumulative prefix confidence.' },
      { label: 'Allocate', caption: 'Share the verification budget among promising positions.' },
      { label: 'Verify', caption: 'The target model checks the candidates; accepted prefixes advance.' },
    ],
    boundary: 'Variable-length verification is optional and must be enabled. The animation is illustrative; actual acceptance and performance depend on the model, batch and workload.',
    links: [
      { label: 'Confidence head', href: file('deepinfer/model_executor/models/mtp/dflash.py', 46), kind: 'code' },
      { label: 'Allocate verification budget', href: file('deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 11), kind: 'code' },
      { label: 'Verify draft tokens', href: file('deepinfer/model_executor/layers/sampler.py', 411), kind: 'code' },
      { label: 'Settings and measured trade-offs', href: file('doc/inference_deployment_qa.md', 239), kind: 'context' },
      { label: 'DSpark paper', href: '#research/dspark', kind: 'paper' },
    ],
  },
  {
    id: 'overlap',
    kicker: '05 / Pipeline',
    title: 'Keep the device busy',
    hook: 'A device can sit idle while the CPU handles results and schedules the next batch.',
    why: 'Asynchronous scheduling overlaps CPU work with device execution across adjacent decode steps, reducing gaps between batches.',
    stages: [
      { label: 'The bubble', caption: 'Without overlap, the device waits while the CPU handles scheduling and results.' },
      { label: 'Schedule ahead', caption: 'While the device works on step N, the CPU prepares the next batch.' },
      { label: 'Process behind', caption: 'Post-processing an earlier decode step can overlap with device work.' },
      { label: 'Continue', caption: 'The next forward can proceed as the pipeline advances.' },
    ],
    boundary: 'This is a conceptual timeline, not a benchmark. Deferred post-processing applies to zero-overhead scheduling during decode; prompt and non-overlapped steps are processed immediately.',
    links: [
      { label: 'Worker execution order', href: file('deepinfer/worker/worker.py', 89), kind: 'code' },
      { label: 'Engine scheduling step', href: file('deepinfer/engine/llm_engine.py', 860), kind: 'code' },
      { label: 'Production pipeline explanation', href: file('doc/inference_deployment_qa.md', 266), kind: 'context' },
      { label: 'NanoFlow comparison', href: '#research/nanoflow', kind: 'paper' },
    ],
  },
];
