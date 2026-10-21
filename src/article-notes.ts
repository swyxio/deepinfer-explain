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
  note: 'The translation below is reproduced from the supplied text. Commentary, highlights and diagrams are added by this guide. The pasted text does not include the original figures; figure links and related source material are provided alongside it.',
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
        explanation: "Prefill processes the prompt in batches; decode generates the answer token by token. They put different demands on the hardware, so DeepSeek sizes them separately. The third goal, keeping KV cache for days, makes it cheaper to serve a conversation when its earlier context comes back.",
        evidence: [article, qa(7)], code: [repo('Supported hardware and release scope', 'README.md', 1)], related: [model],
      },
      {
        id: 'economics', title: '155 trillion tokens per day and $38 per GPU-hour', status: 'Company-reported production figures',
        explanation: "One clue to the scale: the table below reports a 96% input cache-hit rate. In a multi-turn agent session, the conversation history comes back with every request; reusing that prefix replaces repeated prefill with a cache read. That helps explain why DeepSeek invests so much in storage and cache placement.",
        evidence: [article, qa(17)], code: [], related: [],
      },
      {
        id: 'production-table', title: 'The production performance table', status: 'Company-reported production figures',
        explanation: "The table reports 1.5 million cache-inclusive input tokens per second per GPU, versus 60,000 uncached. That is a 25× difference in reported throughput, not a 25× faster GPU: the cache-inclusive number counts reused input. The reported input cache-hit rate is 96%.",
        evidence: [article, { label: 'Production performance table', url: 'https://pbs.twimg.com/media/HVFr4wZaQAA0QYY.jpg' }], code: [], related: [],
      },
      {
        id: 'prefill-pareto', title: 'Offline prefill: throughput versus latency', status: 'Author-reported offline benchmark',
        explanation: "Going from 4,096 to 32,768 tokens per rank raises uncached throughput from about 60K to 87K tokens/s/GPU, while a prefill step grows from roughly 70 ms to 375 ms. Bigger batches help, but the curve shows diminishing returns. This offline sweep ran on four SM100 GPUs.",
        evidence: [{ label: 'Prefill benchmark figure', url: 'https://pbs.twimg.com/media/HVFrsSZaAAAJBn_.jpg' }, repo('Benchmark conditions', 'README.md', 77)], code: [repo('Benchmark sweep runner', 'examples/sweep/run_sweep.sh', 1)], related: [],
      },
      {
        id: 'decode-pareto', title: 'Offline decode: throughput versus interactivity', status: 'Author-reported offline benchmark',
        explanation: "At eight requests per rank, each user gets about 325 tokens/s; at 256, about 100 tokens/s. Aggregate throughput per GPU rises roughly tenfold. That is the speed-versus-utilization tradeoff in this 64-GPU offline sweep, which assumes three draft tokens and 75% per-token acceptance.",
        evidence: [{ label: 'Decode benchmark figure', url: 'https://pbs.twimg.com/media/HVFruFba0AAPduf.jpg' }, repo('Benchmark conditions', 'README.md', 77)], code: [repo('Benchmark sweep runner', 'examples/sweep/run_sweep.sh', 1)], related: [dspark],
      },
      {
        id: 'release-boundary', title: 'What ships in the release', status: 'Release boundary',
        explanation: "DeepInfer ships the offline inference engine for V4.1 Flash on SM100 and Ascend 950. To build the full service described here, you still need a shared KV cache, integration between vision, prefill and decode, and load balancing across replicas.",
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
        explanation: "A long prompt and a stream of one-token decode steps have different hardware needs. Separating vision, prefill and decode lets DeepSeek scale each stage independently, but intermediate state has to travel between them. DistServe explores the same prefill/decode split.",
        evidence: [qa(23), { label: 'Production architecture diagram', url: 'https://pbs.twimg.com/media/HVFrkgCbAAAg6uD.jpg' }, repo('Release boundary', 'README.md', 38)], code: [], related: [distserve],
      },
      {
        id: 'parallelism', title: 'Small prefill EP, wide decode EP', status: 'Production configuration',
        explanation: "Decode spreads experts across 64–128 GPUs, so each GPU reads less expert-weight data per step. The gain comes with communication: tokens have to reach the right experts and return. Prefill uses smaller groups of 2–8 GPUs, where the prompt supplies more work per step.",
        evidence: [qa(45)], code: [repo('Parallel state', 'deepinfer/model_executor/parallel_utils/parallel_state.py', 1), repo('Expert-parallel balancing', 'deepinfer/model_executor/eplb/__init__.py', 42)], related: [repo('Offline sweep settings', 'examples/sweep/run_sweep.sh', 1)],
      },
      {
        id: 'independent-load-balancers', title: 'Four distinct balancing jobs', status: 'Production design',
        explanation: "These balancers solve two different problems. The prefill, decode and vision routers choose where requests or images run; the expert balancer moves copies of popular experts between GPUs. An evenly routed fleet can still have a hot expert holding up a batch.",
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
        explanation: "Recipe gives Chat Completions, Responses and Messages a common route into the model. Each API format maps to a shared conversation representation and model-specific prompt templates; generated text, reasoning and tool calls are then translated back to the caller’s format. The implementation is Rust with Python bindings.",
        evidence: [article, qa(290)], code: [], related: [recipe],
      },
      {
        id: 'special-tokens', title: 'Explicit control tokens versus ordinary text', status: 'Separate open-source component',
        explanation: "A string that looks like a role delimiter is not automatically a control token. Recipe inserts real control-token IDs itself and encodes user and tool text as ordinary tokens; that also gives it known boundaries for parallel tokenization. This prevents control-token spoofing, not every kind of prompt injection.",
        evidence: [qa(298)], code: [], related: [recipe],
      },
      {
        id: 'streaming-parser', title: 'Streaming across chunk boundaries', status: 'Separate open-source component',
        explanation: "A token chunk can end halfway through a UTF-8 character, a delimiter or a tool argument. Recipe keeps the partial match and parser state until the next chunk arrives, then emits whatever is complete. That lets tool arguments stream without repeatedly parsing the whole response.",
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
        explanation: "A 100K-token prompt with 90K tokens already cached has much less new prefill work than a cold 100K prompt. DeepSeek buckets requests by length, estimates the remaining work with a fitted cost model, and chooses a chunk that fits the step’s time budget. Shared cache lets the router choose a less-loaded engine without prefix affinity.",
        evidence: [qa(107)], code: [repo('Per-engine chunk-size adjustment', 'csrc/engine/scheduler.hpp', 235)], related: [sglang],
      },
      {
        id: 'decode-balancing', title: 'Decode: balance concurrency and KV length', status: 'Production design',
        explanation: "Two GPUs can have the same number of active requests and very different attention costs: one may be holding much longer contexts. DeepSeek balances request count and total KV length together, using the intra-group heuristic described in DualPath.",
        evidence: [qa(117)], code: [], related: [dualpath],
      },
      {
        id: 'vision-balancing', title: 'Vision: route by image patches', status: 'Production design',
        explanation: "Two images can be very different amounts of work. DeepSeek estimates each image’s work from its dimensions and patch size, then assigns it to the GPU with the fewest patches already queued on the chosen vision machine.",
        evidence: [qa(121)], code: [repo('Multimodal processor', 'deepinfer/ve/multimodal_processor.py', 1)], related: [model],
      },
      {
        id: 'expert-balancing', title: 'Expert replicas and periodic rearrangement', status: 'Released mechanism + production settings',
        explanation: "An MoE layer can stall on the GPU hosting its busiest experts. DeepSeek keeps extra expert copies and periodically moves them based on recent demand. Its production settings start with four redundant experts per GPU for prefill and one for decode; the released engine contains the expert balancer.",
        evidence: [article, qa(93)], code: [repo('ExpertLoadBalancer', 'deepinfer/model_executor/eplb/__init__.py', 42), repo('Expert weight shuffle', 'deepinfer/model_executor/eplb/shuffle.py', 65)], related: [{ label: 'DeepSeekMoE paper', url: 'https://arxiv.org/abs/2401.06066' }],
      },
      {
        id: 'autoscaling', title: 'Scaling and failed wide-EP groups', status: 'Production design',
        explanation: "Prefill capacity follows demand for uncached input tokens; decode capacity follows running requests. With wide expert parallelism, one failed GPU can affect its whole group, so DeepSeek also keeps spare capacity and reroutes work. Scaling down decode includes a grace period and request/KV forwarding.",
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
        explanation: "Block KV goes to shared 3FS storage, so any prefill machine can reuse a prefix. Short-lived sliding-window attention (SWA) state stays in host memory. Compare vLLM’s PagedAttention: both use blocks, while this shared store also makes prefix reuse available across machines. The distributed cache service is outside the release.",
        evidence: [qa(129), qa(137), { label: 'Article cache placement table', url: 'https://pbs.twimg.com/media/HVFrzbNaEAATgZ2.png' }], code: [repo('In-engine CacheEngine', 'deepinfer/worker/cache_engine.py', 851), repo('Paged block manager', 'csrc/engine/block_manager.hpp', 14)], related: [threefs, paged],
      },
      {
        id: 'cache-sizing', title: 'Capacity, retention and throughput', status: 'Company-reported production figures',
        explanation: "DeepSeek reports roughly 100 PiB of SSD cache, retaining agent traffic for three days and chatbot traffic for seven. The longer chatbot window reflects a long tail: some prefixes are revisited many times over several days. Retention is a workload choice, with storage capacity on one side and recomputation on the other.",
        evidence: [article, qa(149)], code: [], related: [threefs],
      },
      {
        id: 'cache-fetch', title: 'A three-part cache hit path', status: 'Production design',
        explanation: "A cache hit has three steps: find the matching prefix, fetch its KV blocks from 3FS into host memory, then move them to the GPU. The router needs the match length before it can decide where to send the request; the later fetch and transfers can overlap with computation.",
        evidence: [qa(155)], code: [], related: [dualpath],
      },
      {
        id: 'swa-layout', title: '128-token boundaries and the 134-token ring', status: 'Production design + released state layout',
        explanation: "Block KV is stored in 128-token units. The SWA ring holds 134 positions: a 128-token window plus six for speculative backtracking. A hit must leave room for that window; if the needed SWA state is missing, the policy backs up one block and recomputes it.",
        evidence: [article, qa(159), qa(189)], code: [repo('SWA block sizing', 'deepinfer/worker/cache_engine.py', 88), repo('StateBlock', 'deepinfer/worker/cache_engine.py', 221)], related: [model],
      },
      {
        id: '3fs-resilience', title: 'Erasure coding and garbage collection', status: 'Production design',
        explanation: "DeepSeek’s deployment uses 10+2 erasure coding: two parity pieces for every ten data pieces, or 20% extra storage, with tolerance for two node failures. A read asks 11 storage nodes and needs only 10 replies, so one slow node need not hold it up.",
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
        explanation: "DeepSeek says the earlier approach spent nearly half of persistent KV capacity on SWA state, even though it is mostly reused for minutes. Block KV can stay useful for days. V4.1 keeps SWA in memory and reconstructs it on a miss, freeing persistent storage for longer-lived prefixes.",
        evidence: [article, qa(179)], code: [], related: [{ label: 'V4 technical report', url: 'https://arxiv.org/abs/2606.19348' }, model],
      },
      {
        id: 'approximate-replay', title: 'A storage–compute–accuracy trade-off', status: 'Model and production design',
        explanation: "Replaying the last 128 tokens is cheaper than rebuilding the entire sliding-window history, but the first replayed tokens cannot attend to context before that segment. The recovered state is therefore approximate. The V4.1 report calls for stress-testing cache-resumption cases outside its evaluated boundaries.",
        evidence: [qa(181), model], code: [repo('Truncation configuration', 'deepinfer/environ.py', 188)], related: [yoco],
      },
      {
        id: 'encoder-replay', title: 'Encoder cache miss', status: 'Production design',
        explanation: "Suppose a cached prefix ends at token 1,024 but its SWA state is gone. The encoder replays the last 128 tokens of that prefix alongside the uncached suffix to rebuild the local window. It keeps the already cached block KV instead of recomputing or overwriting it.",
        evidence: [qa(185)], code: [], related: [model],
      },
      {
        id: 'decoder-replay', title: 'Decoder prefill compaction', status: 'Released implementation',
        explanation: "Exact decoder recovery would run the last 2,560 tokens through 20 layers. DeepSeek instead replays 128 prompt tokens and uses the result for decoding, without adding it to the prefix cache. The released default retains 140 tokens to cover the window and backtracking.",
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
        explanation: "DSpark proposes a block of tokens in parallel, then adds a lightweight correction based on the preceding token. That gives each proposal some local context without making the whole draft serial. DFlash is the comparison point for parallel drafting; the target model still verifies what the draft proposes.",
        evidence: [article, model], code: [repo('Draft model and confidence head', 'deepinfer/model_executor/models/mtp/dflash.py', 46)], related: [dspark, dflash],
      },
      {
        id: 'verification-budget', title: 'Confidence-scheduled verification', status: 'Released mechanism + company benchmark',
        explanation: "DeepSeek drafts five tokens per request, but a later draft token may be unlikely to survive verification. The scheduler uses predicted acceptance and the hardware’s throughput curve to decide how much of each prefix to verify. DeepSeek reports a 6% online throughput gain; its Q&A shows results varying with batch size.",
        evidence: [article, qa(239)], code: [repo('Variable-length scheduling kernel', 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 1)], related: [dspark],
      },
      {
        id: 'async-confidence', title: 'Where confidence meets overlap', status: 'Released mechanism',
        explanation: "The CPU is already scheduling the next step before the GPU has returned the current step’s confidence scores. It therefore chooses a total verification budget first; a GPU kernel uses the later scores to divide that budget across requests.",
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
        explanation: "In a synchronous loop, the GPU waits while the CPU handles the last sample and schedules the next batch. DeepInfer overlaps CPU work for one step with GPU execution for another. NanoFlow explores a related idea at a different level: overlapping work across resources within the GPU.",
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
        explanation: "A grammar matcher tracks what can legally come next and masks the other tokens before sampling. For a JSON schema, that can enforce the requested structure; it cannot tell whether a generated value is true. DeepInfer compiles the constraint before the request enters the engine.",
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
        explanation: "The references are a useful reading map: DualPath covers KV movement in disaggregated serving; 3FS covers storage; the V4.1 report explains the model and replay; DSpark covers drafting and verification; SGLang and NanoFlow cover serving execution. Follow the links to trace each idea to its source.",
        evidence: [article], code: [], related: [dualpath, model, threefs, dspark, sglang, nanoflow],
      },
    ],
  },
];
