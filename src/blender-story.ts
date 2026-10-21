import { fileRoute as file } from './routes';
const code = (label: string, path: string, line: number): StoryLink => ({ label, href: file(path, line) });

export type StoryLink = { label: string; href: string; external?: boolean };
type StoryParagraph = { text: string; sources: StoryLink[] };
export type CodeSample = { title: string; path: string; ranges: [number, number][]; insight: string };
type Comparison = { title: string; text: string; links: StoryLink[] };
export type WorkshopScene = {
  id: string;
  title: string;
  category: string;
  description: string;
  context: string;
  implementation: StoryLink;
  sample: CodeSample;
  explanation: StoryParagraph[];
  comparison?: Comparison;
  social: { text: string; quote: string; quoteBy: string; links: StoryLink[] };
  links: StoryLink[];
};

export const blenderScenes: WorkshopScene[] = [
  {
    id: 'story-cache', title: '96% cache hits and a 100 PiB KV store', category: '01 / PREFIX REUSE',
    description: 'DeepSeek reports a 96% average input cache-hit rate, a roughly 100 PiB shared 3FS store, and retention of roughly 3 days for agents and 7 days for chat.',
    context: 'A shared store lets every prefill machine access every cached prefix. The engine manages in-flight blocks; the production KV store is a separate service.',
    implementation: code('Blocks::allocate() / free()', 'csrc/engine/block_manager.hpp', 82),
    sample: { title: 'In-flight KV block ownership', path: 'csrc/engine/block_manager.hpp', ranges: [[82, 86], [95, 103]], insight: 'allocate() removes a free block and increments its reference count. free() returns it to the list only when the last reference is released. The 3FS prefix store is a separate production service.' },
    explanation: [
      { text: 'Repeated conversation prefixes create reuse: previous instructions, messages and tool results remain at the start of subsequent requests. DeepSeek persists decode-produced KV as well as prefill KV, then allows any prefill machine to retrieve a matching prefix. This decouples prefix reuse from routing affinity, so requests can be load-balanced across machines.', sources: [code('Production KV design', 'doc/inference_deployment_qa.md', 137)] },
      { text: 'The Entrypoint matches a hash chain over metadata before routing. A separate process asynchronously fetches matched blocks from 3FS into host shared memory; an engine thread then swaps layers into GPU memory using GDR, overlapping transfers with forward computation.', sources: [code('Match, fetch, swap-in', 'doc/inference_deployment_qa.md', 155), code('Engine block allocation', 'csrc/engine/block_manager.hpp', 82)] },
      { text: 'Long retention matters because chat has a heavy tail of repeated hits. DeepSeek reports that reducing chatbot TTL to roughly 3 days costs 0.5%–1% of KV cache hit rate; its 100 PiB 3FS deployment keeps chatbot KV for roughly 7 days and agent KV for 3.', sources: [code('Retention and hit rate', 'doc/inference_deployment_qa.md', 151)] },
    ],
    comparison: { title: 'vLLM block hashes and SGLang’s radix tree', text: 'vLLM V1 hashes each full block together with its preceding prefix and asks KVCacheManager for the longest computed hit. SGLang’s RadixCache instead matches the longest prefix in a radix tree; its HiCache can also use a distributed store, including 3FS. DeepSeek’s production design makes that shared store accessible from every prefill machine.', links: [
      { label: 'vLLM: get_computed_blocks()', href: 'https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/v1/core/kv_cache_manager.py#L264-L305', external: true },
      { label: 'SGLang: match_prefix()', href: 'https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/mem_cache/radix_cache.py#L364-L399', external: true },
      { label: 'SGLang HiCache', href: 'https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/docs/docs/advanced_features/hicache_design.mdx#L10-L20', external: true },
    ] },
    social: { quote: 'this is typical for agentic coding-heavy workloads', quoteBy: 'Yngkvn', text: 'Yngkvn connected the high hit rate to repeated prefixes in agentic coding workloads.', links: [
      { label: 'Yngkvn on Latent Space’s post', href: 'https://x.com/Yngkvn/status/2112647381468541057', external: true },
      { label: 'swyx’s note', href: 'https://x.com/swyx/status/2112587397380943953', external: true },
    ] },
    links: [
      { label: 'DeepSeek’s performance table', href: '/article/goals/production-table' },
      code('3FS storage design', 'doc/inference_deployment_qa.md', 83),
      { label: 'PagedAttention research', href: '/research/pagedattention' },
    ],
  },
  {
    id: 'story-replay', title: 'Bounded replay and the SWA cache', category: '02 / RECONSTRUCT',
    description: 'When block KV hits but sliding-window attention state misses, DeepInfer backs off one 128-token block and reconstructs the missing window.',
    context: 'Block KV lives on 3FS. SWA state lives in host memory and is stored at 128-token boundaries.',
    implementation: code('StateBlock layout', 'deepinfer/worker/cache_engine.py', 221),
    sample: { title: 'Clamp the visible SWA window', path: 'csrc/engine/input_metadata/prepare_tensor_input_v4.cpp', ranges: [[149, 150], [155, 155]], insight: 'abs_lo is the maximum of the sliding-window boundary, the truncation boundary and valid_start. During replay, valid_start prevents attention from reading state before the reconstructed segment.' },
    explanation: [
      { text: 'StateBlock separates stored SWA state from YOCO consumer SWA and compression accumulators. For V4.1, the stored region is 20 layers × 134 tokens × 528 bytes, or 1,415,040 bytes per sequence. A directory locates a remote host when the producing machine is not local.', sources: [code('StateBlock', 'deepinfer/worker/cache_engine.py', 221), code('SWA storage', 'doc/inference_deployment_qa.md', 161)] },
      { text: 'The block-KV hit determines the prefix length. On an SWA miss, the encoder replays the final 128 tokens of that prefix while retaining the block KV. Attention is restricted to the replayed segment, yielding an approximate SWA state; the input metadata code clamps its valid start accordingly.', sources: [code('Replay policy', 'doc/inference_deployment_qa.md', 179), code('SWA visibility clamp', 'csrc/engine/input_metadata/prepare_tensor_input_v4.cpp', 149)] },
      { text: 'The hit is capped at L − 134: a 128-token window plus six tokens for speculative backtracking. Decoder bounded replay also limits decoder prefill to the last 128 tokens, using the encoder’s projected block KV.', sources: [code('Hit-length policy', 'doc/inference_deployment_qa.md', 187), code('V4.1 replay settings', 'README.md', 25)] },
    ],
    comparison: { title: 'vLLM hybrid KV groups', text: 'vLLM’s hybrid KV manager handles models with different attention types by checking cache hits across the relevant KV groups, including sliding-window groups. DeepInfer’s V4.1 path separates persistent block KV from SWA state and can reconstruct the latter with bounded replay.', links: [
      { label: 'vLLM hybrid prefix caching', href: 'https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/docs/design/hybrid_kv_cache_manager.md#L156-L180', external: true },
      code('DeepInfer replay policy', 'doc/inference_deployment_qa.md', 179),
    ] },
    social: { quote: 'SWA Bounded Replay recomputes only the most recent 128 tokens', quoteBy: 'Sophia Yang', text: 'Sophia Yang traced bounded replay through the serving stack.', links: [
      { label: 'Sophia Yang on swyx’s post', href: 'https://x.com/sophiamyang/status/2112628190904742124', external: true },
    ] },
    links: [
      { label: 'Annotated replay chapter', href: '/module/yoco' },
      { label: 'V4.1 model report', href: '/research/v41' },
      { label: 'YOCO comparison', href: '/research/yoco' },
    ],
  },
  {
    id: 'story-experts', title: 'Wide-EP and hot expert replicas', category: '03 / EXPERT PARALLELISM',
    description: 'DeepSeek uses EP2–8 for prefill and EP64–128 for decode, then replicates hot experts to keep the slowest GPU rank from dominating each step.',
    context: 'The router selects logical experts; expert-parallel load balancing places physical replicas across GPU ranks.',
    implementation: code('rebalance_experts_global()', 'deepinfer/model_executor/eplb/policy.py', 73),
    sample: { title: 'Assign redundant expert replicas', path: 'deepinfer/model_executor/eplb/policy.py', ranges: [[110, 123]], insight: 'Each iteration estimates per-replica load, chooses a logical expert for another copy, and updates both physical-to-logical and logical-to-physical maps.' },
    explanation: [
      { text: 'Wide-EP spreads decode experts over more GPUs, reducing per-step expert weight traffic while increasing the effective expert batch size. DeepSeek selects smaller prefill EP groups to fit HBM and larger decode EP groups to use the available GPUs.', sources: [code('EP configurations', 'doc/inference_deployment_qa.md', 45)] },
      { text: 'rebalance_experts_global() uses historical tokens per expert to assign redundant physical copies, then greedily distributes those copies across ranks to reduce peak historical load. It returns physical-to-logical and logical-to-physical mappings plus replica counts.', sources: [code('Replica allocation', 'deepinfer/model_executor/eplb/policy.py', 73), code('Rank placement', 'deepinfer/model_executor/eplb/policy.py', 31)] },
      { text: 'DeepSeek describes a 100-step load window and 1,000-step reassignment for prefill, versus a 1,000-step window and 10,000-step reassignment for decode. Its reported decode slowest-rank / mean load is 1.090.', sources: [code('Production EPLB settings', 'doc/inference_deployment_qa.md', 93)] },
    ],
    comparison: { title: 'vLLM expert parallel load balancing', text: 'vLLM also tracks logical-to-physical expert mappings, load history and redundant expert copies. DeepInfer’s policy exposes its own replica-selection and rank-placement algorithm; the operational EP widths and refresh intervals above are DeepSeek’s deployment choices.', links: [
      { label: 'vLLM EPLB state', href: 'https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/distributed/eplb/eplb_state.py#L245-L289', external: true },
      code('DeepInfer EPLB policy', 'deepinfer/model_executor/eplb/policy.py', 73),
    ] },
    social: { quote: 'efficiency on multiple dimensions all at once', quoteBy: 'GDP', text: 'GDP highlighted Wide-EP as one component of the overall efficiency design.', links: [
      { label: 'GDP’s breakdown', href: 'https://x.com/bookwormengr/status/2112636749293949122', external: true },
      { label: 'vLLM’s response', href: 'https://x.com/vllm_project/status/2112480719952138301', external: true },
    ] },
    links: [
      { label: 'Annotated MoE chapter', href: '/module/moe' },
      code('EP8 vs. EP64', 'doc/inference_deployment_qa.md', 55),
    ],
  },
  {
    id: 'story-dspark', title: 'DSpark: allocate verification where it pays', category: '04 / SPECULATIVE DECODING',
    description: 'DSpark drafts five tokens, predicts their acceptance probabilities, and assigns the verification budget across requests by expected return.',
    context: 'At 60 sequences per rank, DeepSeek reports verifying 3.58 drafts on average instead of five, with an estimated 5.4% throughput gain.',
    implementation: code('compute_seqlens_q_by_confidence_rates()', 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 11),
    sample: { title: 'Allocate the verification budget', path: 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', ranges: [[67, 74], [84, 85], [94, 98]], insight: 'The readable reference implementation multiplies confidence along each draft prefix, ranks candidates across requests, and adds the winning positions to each sequence’s base query length. Production invokes the TileLang kernel above it.' },
    explanation: [
      { text: 'A confidence head estimates draft-token acceptance. Rather than always verifying five candidates per request, DSpark uses those probabilities and a profiled hardware throughput curve to allocate the available verification work.', sources: [code('DSpark scheduling', 'doc/inference_deployment_qa.md', 241)] },
      { text: 'The reference scheduler computes cumulative confidence by position, ranks candidate positions across the batch, and distributes the extra token budget. In the overlapping pipeline, the worker runs the TileLang allocation on the GPU using confidence from the previous sampler output.', sources: [code('Confidence allocation', 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 54), code('Worker GPU scheduling', 'deepinfer/worker/worker.py', 209)] },
      { text: 'At EP64/DP64 and 60 sequences per rank, the reported fixed-5 versus dynamic comparison is 5.00 versus 3.58 verified drafts, 3.30 versus 3.21 accepted, and estimated 13,730 versus 14,466 tokens/s/rank. Enable variable-length verification with DEEPINFER_ENABLE_MTP_VARLEN=1.', sources: [code('Benchmark table', 'doc/inference_deployment_qa.md', 245), code('Feature flag', 'README.md', 24)] },
    ],
    comparison: { title: 'vLLM’s adaptive verification uses the same idea', text: 'vLLM also implements confidence-based adaptive verification. Its budget allocator computes cumulative survival scores, selects the highest-scoring draft positions across the batch and counts wins per request. DeepInfer’s reference uses cumulative products and a stable ranking before assigning 1 + wins.', links: [
      { label: 'vLLM: _assign_draft_token_budget()', href: 'https://github.com/vllm-project/vllm/blob/c835207fccae327531d7d64d2d6fe719a601477f/vllm/v1/worker/gpu/spec_decode/adaptive_verification.py#L46-L72', external: true },
      code('DeepInfer reference', 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', 54),
    ] },
    social: { quote: 'They also use their DSpark speculative decoding', quoteBy: 'GDP', text: 'GDP and Sophia Yang called out DSpark alongside the serving architecture.', links: [
      { label: 'GDP’s breakdown', href: 'https://x.com/bookwormengr/status/2112636749293949122', external: true },
      { label: 'Sophia Yang’s walkthrough', href: 'https://x.com/sophiamyang/status/2112628190904742124', external: true },
    ] },
    links: [{ label: 'DSpark research', href: '/research/dspark' }],
  },
  {
    id: 'story-overlap', title: 'Overlap scheduling with GPU execution', category: '05 / ASYNCHRONOUS SCHEDULING',
    description: 'While the GPU runs forward and sampling for step N, the CPU schedules and launches step N+1 and post-processes step N−1.',
    context: 'The worker defers decode post-processing and corrects sequence lengths using the previous step’s GPU results.',
    implementation: code('Worker step pipeline', 'deepinfer/worker/worker.py', 144),
    sample: { title: 'Forward, post-process, sample, defer', path: 'deepinfer/worker/worker.py', ranges: [[120, 124], [143, 144], [154, 159], [182, 187]], insight: 'The worker launches the current forward, post-processes the previous step, and samples the current output. In overlapped decode, it saves this step for the next iteration.' },
    explanation: [
      { text: 'Without overlap, the CPU waits for sampling, post-processes step N, and schedules N+1 before the GPU continues. DeepInfer pipelines those operations; the documented design credits SGLang and NanoFlow.', sources: [code('Pipeline description', 'doc/inference_deployment_qa.md', 266), { label: 'NanoFlow', href: '/research/nanoflow' }] },
      { text: 'LLMEngine.step() calls scheduler.schedule() and dispatches execute_model_step. For decode with zero-overhead scheduling enabled, the worker retains the current step state for post-processing on the next iteration.', sources: [code('LLMEngine.step()', 'deepinfer/engine/llm_engine.py', 860), code('Deferred post-processing', 'deepinfer/worker/worker.py', 182)] },
      { text: 'There is a dependency with DSpark: when the CPU schedules N+1, step N confidence has not returned. The CPU fixes the total token budget; a GPU kernel remaps the previous output and computes per-request verification lengths.', sources: [code('Async DSpark dependency', 'doc/inference_deployment_qa.md', 262), code('Sequence-length correction', 'deepinfer/worker/worker.py', 191)] },
    ],
    comparison: { title: 'SGLang’s overlap loop', text: 'SGLang’s overlap scheduler similarly schedules and launches a batch before processing the previous result. DeepInfer’s worker makes the step dependency visible in the retained previous-step state and GPU-side sequence-length correction.', links: [
      { label: 'SGLang overlap event loop', href: 'https://github.com/sgl-project/sglang/blob/93088901fb413e5a81eeb81b675fc21b4adc5b1f/python/sglang/srt/managers/scheduler.py#L2011-L2078', external: true },
      code('DeepInfer worker step', 'deepinfer/worker/worker.py', 89),
    ] },
    social: { quote: 'CPU and GPU are pipelined asynchronously', quoteBy: 'Sophia Yang', text: 'Sophia Yang connected scheduling overlap with the other serving choices.', links: [
      { label: 'Sophia Yang’s walkthrough', href: 'https://x.com/sophiamyang/status/2112628190904742124', external: true },
      { label: 'vLLM’s response', href: 'https://x.com/vllm_project/status/2112480719952138301', external: true },
    ] },
    links: [{ label: 'Interactive request flow', href: '/codemap' }],
  },
  {
    id: 'story-system', title: 'The production system, end to end', category: 'FINALE / SYSTEM ARCHITECTURE',
    description: 'Vision encoding, prefill and decode scale independently; a shared KV store and stage-specific load balancers connect them.',
    context: 'The open engine contains scheduling, state management, expert placement and replay. The production KV service and orchestration are separate components.',
    implementation: code('Release boundary', 'README.md', 38),
    sample: { title: 'An engine step dispatches a scheduled batch', path: 'deepinfer/engine/llm_engine.py', ranges: [[881, 887], [951, 952]], insight: 'LLMEngine asks the native scheduler for sequence metadata and scheduler outputs, then sends that batch to the worker. The loop repeats for prefill chunks and decode steps.' },
    explanation: [
      { text: 'DeepSeek’s production architecture disaggregates vision encoding, prefill and decode. It pairs each stage with its own load balancer and uses shared KV storage to avoid repeated prefill. The decode fleet uses Wide-EP, expert replicas, speculative verification and asynchronous scheduling together.', sources: [code('System overview', 'doc/inference_deployment_qa.md', 23), code('Stage parallelism', 'doc/inference_deployment_qa.md', 41)] },
      { text: 'V4.1-Flash’s encoder–decoder architecture and compressed KV shape the serving design: decoder block KV is projected from encoder state, while bounded replay reconstructs the shorter SWA state required for decoding.', sources: [code('Decoder replay', 'doc/inference_deployment_qa.md', 183), { label: 'V4.1 model report', href: '/research/v41' }] },
      { text: 'DeepInfer releases the offline engine and disaggregation-related engine functionality. The shared KV service, VE/prefill/decode service orchestration and data-parallel replica load balancing belong to the production system described in the deployment notes.', sources: [code('README: service components', 'README.md', 38)] },
    ],
    social: { quote: 'there are a few key missing pieces', quoteBy: 'Halex', text: 'Halex discussed the release boundary; GDP focused on the combined optimizations.', links: [
      { label: 'Halex on DeepSeek’s post', href: 'https://x.com/Halex623/status/2112691395400175753', external: true },
      { label: 'GDP on Latent Space’s post', href: 'https://x.com/bookwormengr/status/2112636749293949122', external: true },
    ] },
    links: [
      { label: 'Interactive request flow', href: '/codemap' },
      { label: 'DistServe comparison', href: '/research/distserve' },
    ],
  },
];
