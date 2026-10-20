export interface ArticleLink {
  label: string;
  url: string;
}

export interface ArticleAnnotation {
  id: string;
  title: string;
  explanation: string;
  status: string;
  evidence: ArticleLink[];
  code: ArticleLink[];
  related: ArticleLink[];
}

export interface ArticleSection {
  id: string;
  title: string;
  intro: string;
  annotations: ArticleAnnotation[];
}

const revision = '774ce244b87cc0eb8d4b94ab9f5de2ab22049f01';
const repo = (label: string, path: string, line: number): ArticleLink => ({
  label,
  url: `https://github.com/deepseek-ai/DeepInfer/blob/${revision}/${path}#L${line}`,
});
const qa = (line: number): ArticleLink => repo('DeepSeek deployment Q&A', 'doc/inference_deployment_qa.md', line);
const article: ArticleLink = { label: 'Latent Space translation', url: 'https://x.com/latentspacepod/status/2112588380416647205' };
const original: ArticleLink = { label: 'DeepSeek’s original Zhihu article', url: 'https://zhuanlan.zhihu.com/p/2095560295930508953' };
const model: ArticleLink = { label: 'V4.1-Flash technical report', url: 'https://arxiv.org/abs/2609.19969' };
const dualpath: ArticleLink = { label: 'DualPath paper', url: 'https://arxiv.org/abs/2602.21548' };
const sglang: ArticleLink = { label: 'SGLang / RadixAttention paper', url: 'https://arxiv.org/abs/2312.07104' };
const dspark: ArticleLink = { label: 'DSpark paper', url: 'https://arxiv.org/abs/2607.05147' };
const dflash: ArticleLink = { label: 'DFlash paper', url: 'https://arxiv.org/abs/2602.06036' };
const yoco: ArticleLink = { label: 'YOCO paper', url: 'https://arxiv.org/abs/2405.05254' };
const threefs: ArticleLink = { label: '3FS repository', url: 'https://github.com/deepseek-ai/3FS' };
const recipe: ArticleLink = { label: 'deepseek-recipe repository', url: 'https://github.com/deepseek-ai/deepseek-recipe' };
const distserve: ArticleLink = { label: 'DistServe paper', url: 'https://arxiv.org/abs/2401.09670' };
const paged: ArticleLink = { label: 'PagedAttention paper', url: 'https://arxiv.org/abs/2309.06180' };
const nanoflow: ArticleLink = { label: 'NanoFlow paper', url: 'https://www.usenix.org/conference/osdi25/presentation/zhu-kan' };

export const articleSource = {
  title: 'DeepSeek V4.1 Flash Large-Scale Inference Deployment Practice',
  note: 'Latent Space identifies this as an English translation of DeepSeek’s Zhihu article. The reading below is an independent explanation, not a reproduction of that translation. It follows the article’s structure and links to the original, the related Q&A, and the pinned release.',
  links: [article, original, qa(1)],
};

export const articleSections: ArticleSection[] = [
  {
    id: 'goals',
    title: '01 / Goals and the production claim',
    intro: 'Why DeepSeek built the system: different accelerators, hardware shaped around each inference stage, and long-lived cache reuse.',
    annotations: [
      {
        id: 'three-goals', title: 'Three deployment constraints', status: 'Production design',
        explanation: 'The article names multi-vendor accelerator support, 8-card prefill machines with 64–128-card decode supernodes, and KV retention beyond 72 hours. These are deployment goals, not requirements for every offline run.',
        evidence: [article, qa(7)], code: [repo('Supported hardware and release scope', 'README.md', 1)], related: [model],
      },
      {
        id: 'economics', title: '155 trillion tokens per day and $38 per GPU-hour', status: 'Company-reported production figures',
        explanation: 'DeepSeek reports those figures for one cluster at off-peak pricing. Cluster size, token mix, measurement window and total costs are not disclosed here; revenue is not profit, and the figures are not a benchmark of the open release.',
        evidence: [article, qa(17)], code: [], related: [],
      },
      {
        id: 'production-table', title: 'The production performance table', status: 'Company-reported production figures',
        explanation: 'The table reports 60K uncached and 1.5M cache-inclusive input tokens/s/GPU, a 96% input cache-hit rate, 400 ms mean and 1,000 ms P99 time to first token, and 77K average input tokens. Decode is reported at 14K output tokens/s/GPU and an output speed of 230 tokens/s (300 for coding); the table does not explicitly label the latter per user. These online operating figures do not specify enough workload and hardware detail for an independent comparison.',
        evidence: [article, { label: 'Production performance table', url: 'https://pbs.twimg.com/media/HVFr4wZaQAA0QYY.jpg' }], code: [], related: [],
      },
      {
        id: 'prefill-pareto', title: 'Offline prefill: throughput versus latency', status: 'Author-reported offline benchmark',
        explanation: 'The prefill plot varies batch size per DP rank and illustrates the throughput–latency trade-off for uncached input. Its configuration is EP4/DP4, 384 + 32 experts, 131,072 context and 140-token decoder replay. The README says the benchmark used four SM100 GPUs in one scale-up domain.',
        evidence: [{ label: 'Prefill benchmark figure', url: 'https://pbs.twimg.com/media/HVFrsSZaAAAJBn_.jpg' }, repo('Benchmark conditions', 'README.md', 77)], code: [repo('Benchmark sweep runner', 'examples/sweep/run_sweep.sh', 1)], related: [],
      },
      {
        id: 'decode-pareto', title: 'Offline decode: throughput versus interactivity', status: 'Author-reported offline benchmark',
        explanation: 'The decode plot varies requests per DP rank to show how aggregate output throughput trades off against per-user speed. It uses EP64/DP64, 384 + 64 experts, 131,072 context, fixed nextn=3 and 75% assumed per-token acceptance. The README says it used 64 SM100 GPUs in one scale-up domain; it is a different configuration from the prefill plot.',
        evidence: [{ label: 'Decode benchmark figure', url: 'https://pbs.twimg.com/media/HVFruFba0AAPduf.jpg' }, repo('Benchmark conditions', 'README.md', 77)], code: [repo('Benchmark sweep runner', 'examples/sweep/run_sweep.sh', 1)], related: [dspark],
      },
      {
        id: 'release-boundary', title: 'The release is not the whole service', status: 'Release boundary',
        explanation: 'The README describes offline inference for V4.1-Flash on SM100 and Ascend 950. The service-level KV storage system, VE/prefill/decode integration, and replica load balancing remain to be supplied for a complete service.',
        evidence: [qa(21), repo('README: what a complete service still needs', 'README.md', 31)], code: [repo('Offline entrypoint', 'deepinfer/entrypoints/llm.py', 23)], related: [],
      },
    ],
  },
  {
    id: 'system',
    title: '02 / System overview',
    intro: 'Separate vision encoding, prefill and decode, then distribute attention and MoE work differently across the fleet.',
    annotations: [
      {
        id: 'epd', title: 'Vision / prefill / decode disaggregation', status: 'Production design',
        explanation: 'DeepSeek separates the three stages so resource allocation and latency goals can be managed independently. Moving state between stages is a system cost; the README says full integration is not included in the release.',
        evidence: [qa(23), { label: 'Production architecture diagram', url: 'https://pbs.twimg.com/media/HVFrkgCbAAAg6uD.jpg' }, repo('Release boundary', 'README.md', 38)], code: [], related: [distserve],
      },
      {
        id: 'parallelism', title: 'Small prefill EP, wide decode EP', status: 'Production configuration',
        explanation: 'The article describes EP2–8/DP2–8 for prefill, EP64–128/DP64–128 for decode, and typically one GPU per vision instance. Wider EP can improve decode throughput by distributing expert weights; it requires communication and load balancing.',
        evidence: [qa(45)], code: [repo('Parallel state', 'deepinfer/model_executor/parallel_utils/parallel_state.py', 1), repo('Expert-parallel balancing', 'deepinfer/model_executor/eplb/__init__.py', 42)], related: [repo('Offline sweep settings', 'examples/sweep/run_sweep.sh', 1)],
      },
      {
        id: 'independent-load-balancers', title: 'Four distinct balancing jobs', status: 'Production design',
        explanation: 'Prefill, decode and vision load balancers place requests or images across replicas; expert-parallel balancing redistributes hot experts inside a parallel group. A released EPLB module does not mean the external replica balancers are included.',
        evidence: [qa(33), qa(93), qa(105)], code: [repo('ExpertLoadBalancer', 'deepinfer/model_executor/eplb/__init__.py', 42)], related: [dualpath],
      },
    ],
  },
  {
    id: 'recipe',
    title: '03 / DeepSeek Recipe',
    intro: 'API messages and model token sequences meet in a separate encoding, decoding and streaming component.',
    annotations: [
      {
        id: 'protocol-adaptation', title: 'One conversation format, three API families', status: 'Separate open-source component',
        explanation: 'Recipe converts Chat Completions, Responses and Messages requests into a shared representation, then maps parsed model events back to each protocol. The Q&A describes Rust implementation with Python bindings.',
        evidence: [article, qa(290)], code: [], related: [recipe],
      },
      {
        id: 'special-tokens', title: 'Explicit control tokens versus ordinary text', status: 'Separate open-source component',
        explanation: 'Explicitly inserted special tokens are recorded as token IDs; strings written by a user or produced as ordinary tokens remain ordinary content. Segments between known special tokens can be tokenized in parallel and concatenated in order.',
        evidence: [qa(298)], code: [], related: [recipe],
      },
      {
        id: 'streaming-parser', title: 'Streaming across chunk boundaries', status: 'Separate open-source component',
        explanation: 'An incremental parser buffers incomplete UTF-8, tracks reasoning/body/tool phases, and preserves partial delimiter matches. Tool arguments can be emitted in fragments instead of waiting for the full object.',
        evidence: [qa(306)], code: [], related: [recipe],
      },
    ],
  },
  {
    id: 'balancing',
    title: '04 / Load balancing and resilience',
    intro: 'The article describes four balancing strategies plus autoscaling and failure handling.',
    annotations: [
      {
        id: 'prefill-balancing', title: 'Prefill: buckets and a time budget', status: 'Production design',
        explanation: 'Requests are bucketed by total context length: under 16K, 16–64K, 64–256K and at least 256K. Across DP groups engines pull work by remaining quota; within a group each request goes to the least-loaded rank. Within a GPU, FIFO scheduling solves a fitted quadratic cost model for a chunk that fits the time budget. Any engine can access any stored prefix, so this router does not require prefix affinity.',
        evidence: [qa(107)], code: [repo('Per-engine chunk-size adjustment', 'csrc/engine/scheduler.hpp', 235)], related: [sglang],
      },
      {
        id: 'decode-balancing', title: 'Decode: balance concurrency and KV length', status: 'Production design',
        explanation: 'Decode routing considers both request count and total KV length. The article refers to DualPath’s intra-group heuristic; that citation does not show the entire DualPath design is included in the release.',
        evidence: [qa(117)], code: [], related: [dualpath],
      },
      {
        id: 'vision-balancing', title: 'Vision: route by image patches', status: 'Production design',
        explanation: 'The prefill machine selects a vision machine, then assigns each image to the device with the fewest queued patches, estimated from image dimensions and patch size.',
        evidence: [qa(121)], code: [repo('Multimodal processor', 'deepinfer/ve/multimodal_processor.py', 1)], related: [model],
      },
      {
        id: 'expert-balancing', title: 'Expert replicas and periodic rearrangement', status: 'Released mechanism + production settings',
        explanation: 'Each device can hold redundant expert replicas; observed load can inform periodic redistribution. The library default interval is zero (disabled); the offline example enables a 30-step interval when EPLB is enabled. Prefill starts with four redundant experts per GPU, measures 100 steps and rearranges every 1,000; decode starts with one, measures 1,000 steps and rearranges every 10,000. The article reports slowest-rank/mean prefill imbalance of 1.0320 at EP2 and 1.0618 at EP4; the Q&A reports 1.045 and 1.074 respectively. Both report 1.090 for decode, so the differing prefill figures should remain separately attributed.',
        evidence: [article, qa(93)], code: [repo('ExpertLoadBalancer', 'deepinfer/model_executor/eplb/__init__.py', 42), repo('Expert weight shuffle', 'deepinfer/model_executor/eplb/shuffle.py', 65)], related: [{ label: 'DeepSeekMoE paper', url: 'https://arxiv.org/abs/2401.06066' }],
      },
      {
        id: 'autoscaling', title: 'Scaling and failed wide-EP groups', status: 'Production design',
        explanation: 'Prefill scales by uncached-token demand, decode by running requests. A one-minute decode shutdown grace period is followed by request and KV forwarding; spare capacity and rerouting address faults. Scale-in is forbidden above 0.8 quota utilization. A failed device can invalidate its entire EP group; on restart the platform can recalculate EP size from the healthy devices.',
        evidence: [qa(193)], code: [], related: [distserve],
      },
    ],
  },
  {
    id: 'cache',
    title: '05 / KV cache storage',
    intro: 'The system treats long-lived block KV and short-lived sliding-window state as different storage problems.',
    annotations: [
      {
        id: 'cache-tiers', title: 'Global block KV versus SWA state', status: 'Production design',
        explanation: 'DeepSeek says paged main KV and indexer K are persisted in a dedicated 3FS cluster, while SWA state remains in host memory. The in-engine KV and state managers are released; the distributed cache service is not.',
        evidence: [qa(129), qa(137), { label: 'Article cache placement table', url: 'https://pbs.twimg.com/media/HVFrzbNaEAATgZ2.png' }], code: [repo('In-engine CacheEngine', 'deepinfer/worker/cache_engine.py', 851), repo('Paged block manager', 'csrc/engine/block_manager.hpp', 14)], related: [threefs, paged],
      },
      {
        id: 'cache-sizing', title: 'Capacity, retention and throughput', status: 'Company-reported production figures',
        explanation: 'The article reports about 100 PiB SSD, a three-day agent TTL and seven-day chatbot TTL. It also reports peak aggregate 10 TiB/s reads and 850 GiB/s writes, and ~180-second SWA TTL with over 98% hit rate. These are reported operating figures, not independently verified benchmarks.',
        evidence: [article, qa(149)], code: [], related: [threefs],
      },
      {
        id: 'cache-fetch', title: 'A three-part cache hit path', status: 'Production design',
        explanation: 'Hash-chain prefix matching is on the routing critical path; a separate process fetches KV to host shared memory, then device transfers are overlapped with computation. The Q&A describes GDR for fine-grained GPU transfers.',
        evidence: [qa(155)], code: [], related: [dualpath],
      },
      {
        id: 'swa-layout', title: '128-token boundaries and the 134-token ring', status: 'Production design + released state layout',
        explanation: 'The article describes 128-token storage granularity and a 134-token sliding-window ring: a 128-token window plus six backtracking positions. Prefill stores after its final chunk; decode snapshots as it crosses a boundary. For input length L, the described policy caps a cache hit at L−134. It checks block KV first and backs off one 128-token block if the needed SWA state is missing.',
        evidence: [article, qa(159), qa(189)], code: [repo('SWA block sizing', 'deepinfer/worker/cache_engine.py', 88), repo('StateBlock', 'deepinfer/worker/cache_engine.py', 221)], related: [model],
      },
      {
        id: '3fs-resilience', title: 'Erasure coding and garbage collection', status: 'Production design',
        explanation: 'The described 3FS layout uses 10+2 erasure coding and can tolerate two node failures in a group; it reads any 10 of 11 responses and garbage-collects least-recently-used data under a watermark.',
        evidence: [qa(83)], code: [], related: [threefs],
      },
    ],
  },
  {
    id: 'replay',
    title: '06 / SWA bounded replay',
    intro: 'Recompute a bounded suffix to avoid persisting every sliding-window state, accepting an approximation.',
    annotations: [
      {
        id: 'why-replay', title: 'Why keep SWA state out of persistent storage?', status: 'Production design rationale',
        explanation: 'The article contrasts long-lived, repeatedly reused block KV with SWA state reused over minutes. It describes V4 persistent SWA storage and exact reconstruction as costly, and says the exact-only Zero SWA Caching proposal from the V4 report was not adopted for V4.1 production because recomputation was too expensive.',
        evidence: [article, qa(179)], code: [], related: [{ label: 'V4 technical report', url: 'https://arxiv.org/abs/2606.19348' }, model],
      },
      {
        id: 'approximate-replay', title: 'A storage–compute–accuracy trade-off', status: 'Model and production design',
        explanation: 'The replay window is limited to the most recent 128 tokens and attention is truncated to that replay segment. Reconstructed SWA state is approximate; the report warns that behavior at untested cache-resumption boundaries still needs stress testing.',
        evidence: [qa(181), model], code: [repo('Truncation configuration', 'deepinfer/environ.py', 188)], related: [yoco],
      },
      {
        id: 'encoder-replay', title: 'Encoder cache miss', status: 'Production design',
        explanation: 'When encoder SWA is missing, the latest cached-prefix window is replayed together with the uncached suffix. The existing global block KV is reused rather than overwritten.',
        evidence: [qa(185)], code: [], related: [model],
      },
      {
        id: 'decoder-replay', title: 'Decoder prefill compaction', status: 'Released implementation',
        explanation: 'Decoder global KV is projected from the final encoder hidden state. Instead of exact reconstruction through 20 layers over 2,560 tokens, the described design replays 128 prompt tokens; this decoder state is used for decoding, not prefix storage. The release documents compact mode and a 140-token retained suffix for its default configuration.',
        evidence: [qa(187), repo('Decoder replay configuration', 'README.md', 25)], code: [repo('YOCO input metadata', 'deepinfer/model_executor/input_metadata/yoco.py', 1), repo('V4 attention', 'deepinfer/model_executor/models/v4_modules/attn.py', 228)], related: [model, yoco],
      },
    ],
  },
  {
    id: 'speculation',
    title: '07 / DSpark speculative decoding',
    intro: 'Draft likely tokens cheaply, then spend target-model verification where it has the greatest expected return.',
    annotations: [
      {
        id: 'draft', title: 'Parallel draft plus serial correction', status: 'Released implementation + research',
        explanation: 'DSpark uses a mostly parallel draft and a lightweight Markov correction that depends on the preceding token. DFlash is a useful comparison: it drafts a block in parallel using a block-diffusion model.',
        evidence: [article, model], code: [repo('Draft model and confidence head', 'deepinfer/model_executor/models/mtp/dflash.py', 46)], related: [dspark, dflash],
      },
      {
        id: 'verification-budget', title: 'Confidence-scheduled verification', status: 'Released mechanism + company benchmark',
        explanation: 'The described deployment generates five drafts and assigns verification budget according to estimated acceptance and profiled hardware throughput. In the release, variable scheduling is optional and an empty profiled curve falls back to all available drafts. The article reports ~6% at its online operating point; the Q&A’s benchmark ranges from −1.5% at 16 sequences/rank to +11% at 96, so it is workload-dependent.',
        evidence: [article, qa(239)], code: [repo('Variable-length scheduling kernel', 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 1)], related: [dspark],
      },
      {
        id: 'async-confidence', title: 'Where confidence meets overlap', status: 'Released mechanism',
        explanation: 'At the next CPU schedule, current-step confidence is not yet available. The Q&A says the CPU sets a total budget and a GPU kernel later computes per-request verification lengths.',
        evidence: [qa(262)], code: [repo('Variable-length scheduling kernel', 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 1), repo('Worker execution', 'deepinfer/worker/worker.py', 89)], related: [dspark],
      },
    ],
  },
  {
    id: 'async',
    title: '08 / Asynchronous scheduling',
    intro: 'Overlap CPU scheduling and post-processing with device work to reduce bubbles between decode steps.',
    annotations: [
      {
        id: 'zos-pipeline', title: 'Schedule, forward, sample, post-process', status: 'Released mechanism',
        explanation: 'In the synchronous path, the CPU must wait for sampling before post-processing and scheduling the next step. The documented pipeline overlaps CPU work for adjacent steps with device forward and sample. “Zero overhead” is the feature name, not proof that every workload has no idle time.',
        evidence: [qa(266)], code: [repo('Engine step', 'deepinfer/engine/llm_engine.py', 860), repo('Worker step state', 'deepinfer/worker/zos_status.py', 10)], related: [sglang, nanoflow],
      },
    ],
  },
  {
    id: 'structured',
    title: '09 / Structured output',
    intro: 'Compile a constraint once, then restrict legal tokens during each decoding step.',
    annotations: [
      {
        id: 'grammar', title: 'Compile, match, mask', status: 'Released mechanism',
        explanation: 'The system compiles regex, JSON schema or EBNF into a grammar automaton, advances a matcher at runtime and masks illegal tokens before sampling. A syntactically valid result is not necessarily factually or semantically correct.',
        evidence: [qa(276)], code: [repo('Grammar compilation', 'deepinfer/structure_output/compiler.py', 14), repo('Matcher', 'deepinfer/structure_output/matcher.py', 58), repo('Sampling', 'deepinfer/model_executor/layers/sampler.py', 59)], related: [sglang],
      },
    ],
  },
  {
    id: 'references',
    title: '10 / The article’s references',
    intro: 'Its six cited sources are a useful reading sequence: production storage and architecture first, then speculative decoding and execution overlap.',
    annotations: [
      {
        id: 'article-references', title: 'Six cited works', status: 'Source map',
        explanation: 'The article cites DualPath, the V4.1 report, 3FS, DSpark, SGLang and NanoFlow. These are research and source references; a citation does not establish that every technique in each paper is implemented in this release.',
        evidence: [article], code: [], related: [dualpath, model, threefs, dspark, sglang, nanoflow],
      },
    ],
  },
];
