/** Four source-synchronized phases, each covering four seconds of a 16-second scene. */
export const STEP_SECONDS = 4;

export type AnimationSource = {
  path: string;
  start: number;
  end: number;
  highlightStart: number;
  highlightEnd: number;
  kind?: 'code' | 'documentation';
};

export type AnimationStep = {
  title: string;
  explanation: string;
  takeaway: string;
  source: AnimationSource;
  peerId?: string;
  alternatePeerId?: string;
};

export type AnimationTimeline = { id: string; steps: AnimationStep[] };

export const animationTimelines: Record<string, AnimationTimeline> = {
  'story-cache': {
    id: 'story-cache',
    steps: [
      {
        title: 'Match the prefix before routing',
        explanation: 'The production Entrypoint asks the CHECK role to match a hash chain over KV metadata. The hit length is known before choosing a prefill machine.',
        takeaway: 'A repeated prefix identifies reusable KV blocks.',
        source: { path: 'doc/inference_deployment_qa.md', start: 155, end: 157, highlightStart: 157, highlightEnd: 157, kind: 'documentation' },
        peerId: 'cache-vllm-lookup',
      },
      {
        title: 'Fetch and swap in the hit',
        explanation: 'A separate process fetches matched blocks from 3FS into host shared memory. An engine thread uses GDR to swap layers into GPU memory while forward computation runs.',
        takeaway: '3FS → host shared memory → per-layer GPU memory.',
        source: { path: 'doc/inference_deployment_qa.md', start: 155, end: 157, highlightStart: 157, highlightEnd: 157, kind: 'documentation' },
      },
      {
        title: 'Own the local blocks',
        explanation: 'The released engine allocates in-flight blocks and tracks shared ownership with reference counts. A block returns to the free list only after its final reference is released.',
        takeaway: 'allocate → pin → free → free: reference count 1 → 2 → 1 → 0.',
        source: { path: 'csrc/engine/block_manager.hpp', start: 82, end: 103, highlightStart: 88, highlightEnd: 103 },
      },
      {
        title: 'Compare prefix lookups',
        explanation: 'DeepSeek matches a metadata hash chain before routing. vLLM finds a hit using block hashes; SGLang matches a prefix through its radix cache.',
        takeaway: 'DeepSeek: metadata CHECK · vLLM: block hashes · SGLang: radix tree.',
        source: { path: 'doc/inference_deployment_qa.md', start: 155, end: 157, highlightStart: 157, highlightEnd: 157, kind: 'documentation' },
        peerId: 'cache-vllm-lookup',
        alternatePeerId: 'cache-sglang-match',
      },
    ],
  },
  'story-replay': {
    id: 'story-replay',
    steps: [
      {
        title: 'Check block KV and SWA state',
        explanation: 'The block KV hit determines the candidate prefix. If the corresponding sliding-window state is unavailable, the encoder backs off one 128-token block.',
        takeaway: 'Block KV hit + SWA miss → replay one block.',
        source: { path: 'doc/inference_deployment_qa.md', start: 189, end: 191, highlightStart: 191, highlightEnd: 191, kind: 'documentation' },
        peerId: 'replay-vllm-schedule',
      },
      {
        title: 'Replay the end of the hit',
        explanation: 'The last 128 tokens of the matched prefix run through the encoder again to reconstruct approximate SWA state. The matched block KV remains in place; the uncached suffix continues through prefill.',
        takeaway: 'Retain block KV; rebuild the recent SWA window.',
        source: { path: 'doc/inference_deployment_qa.md', start: 181, end: 185, highlightStart: 183, highlightEnd: 185, kind: 'documentation' },
        peerId: 'replay-vllm-mark',
      },
      {
        title: 'Clamp the visible window',
        explanation: 'The input metadata bounds each query by the sliding-window start, the truncation boundary and valid_start. During zero-state replay, the query cannot attend to slots before valid_start.',
        takeaway: 'abs_lo = max(window start, truncation boundary, valid_start).',
        source: { path: 'csrc/engine/input_metadata/prepare_tensor_input_v4.cpp', start: 145, end: 155, highlightStart: 149, highlightEnd: 155 },
      },
      {
        title: 'Compare bounded replay',
        explanation: 'vLLM caps replay at the available hit and marks its start in the scheduler. SGLang can fold encoder SWA replay into the extend pass or run it before the pass when the feature is enabled.',
        takeaway: 'Each engine can retain cached block KV while reconstructing a bounded tail.',
        source: { path: 'doc/inference_deployment_qa.md', start: 189, end: 191, highlightStart: 191, highlightEnd: 191, kind: 'documentation' },
        peerId: 'replay-vllm-mark',
        alternatePeerId: 'replay-sglang-run',
      },
    ],
  },
  'story-experts': {
    id: 'story-experts',
    steps: [
      {
        title: 'Start with logical and physical experts',
        explanation: 'The rebalancer consumes token counts by step, layer and logical expert. It initializes one physical slot per logical expert and reserves additional slots for replicas.',
        takeaway: 'Logical expert = model identity; physical expert = a placed copy.',
        source: { path: 'deepinfer/model_executor/eplb/policy.py', start: 89, end: 103, highlightStart: 93, highlightEnd: 103 },
        peerId: 'experts-vllm-replicate',
      },
      {
        title: 'Choose redundant replicas',
        explanation: 'For each spare slot, the policy evaluates the historical per-copy loads and chooses the expert whose replication best reduces the sum of step-wise peak loads.',
        takeaway: 'Hot experts gain copies; logical expert identities stay the same.',
        source: { path: 'deepinfer/model_executor/eplb/policy.py', start: 105, end: 123, highlightStart: 110, highlightEnd: 123 },
        peerId: 'experts-vllm-replicate',
      },
      {
        title: 'Place replicas across ranks',
        explanation: 'After assigning copies, _batch_greedy_indices distributes physical experts across GPU ranks, accounting for the historical load vector and each rank’s fixed capacity.',
        takeaway: 'Replication changes the maps; placement decides which rank holds each copy.',
        source: { path: 'deepinfer/model_executor/eplb/policy.py', start: 53, end: 69, highlightStart: 58, highlightEnd: 65 },
        peerId: 'experts-vllm-pack',
      },
      {
        title: 'Compare replica policies',
        explanation: 'vLLM’s default policy gives each additional copy to the expert with the largest aggregate weight per copy. DeepInfer evaluates candidates against peak load across historical steps; SGLang’s selectable vector policy uses the same replica objective.',
        takeaway: 'Aggregate weight per copy versus a sum of step-wise peaks.',
        source: { path: 'deepinfer/model_executor/eplb/policy.py', start: 105, end: 123, highlightStart: 110, highlightEnd: 123 },
        peerId: 'experts-vllm-replicate',
        alternatePeerId: 'experts-sglang-vec',
      },
    ],
  },
  'story-dspark': {
    id: 'story-dspark',
    steps: [
      {
        title: 'Remap confidence to this batch',
        explanation: 'The reference scheduler gathers the previous batch’s per-position confidence using the sequence remap. A fresh sequence receives zero confidence for its draft positions.',
        takeaway: 'Previous GPU confidence → current batch rows.',
        source: { path: 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', start: 54, end: 65, highlightStart: 57, highlightEnd: 65 },
        peerId: 'dspark-vllm-score',
      },
      {
        title: 'Score each draft prefix',
        explanation: 'A cumulative product gives the score for reaching each successive draft position: later positions depend on acceptance of earlier positions.',
        takeaway: 'Confidence [0.9, 0.8, 0.7] → prefix scores [0.9, 0.72, 0.504].',
        source: { path: 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', start: 64, end: 74, highlightStart: 67, highlightEnd: 68 },
        peerId: 'dspark-vllm-score',
      },
      {
        title: 'Allocate a global budget',
        explanation: 'For A scores [0.9, 0.72, 0.504] and B scores [0.8, 0.32, 0.288], a total query budget of five reserves one token per sequence and selects the three highest remaining scores.',
        takeaway: 'A₁, B₁, A₂ win → query lengths A=3, B=2.',
        source: { path: 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', start: 72, end: 98, highlightStart: 84, highlightEnd: 98 },
        peerId: 'dspark-vllm-budget',
      },
      {
        title: 'Compare adaptive verification',
        explanation: 'vLLM likewise takes cumulative confidence and selects a batch-wide top-k budget; SGLang’s DSpark planner dispatches a top-k verification-length kernel. DeepInfer’s reference uses a stable ranking and its execution path calls a TileLang kernel.',
        takeaway: 'The three engines can allocate verification work across requests.',
        source: { path: 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py', start: 91, end: 98, highlightStart: 94, highlightEnd: 98 },
        peerId: 'dspark-vllm-budget',
        alternatePeerId: 'dspark-sglang-allocate',
      },
    ],
  },
  'story-overlap': {
    id: 'story-overlap',
    steps: [
      {
        title: 'Launch the current forward',
        explanation: 'After the engine schedules a batch, Worker.execute_model_step calls the model runner with the batch metadata, GPU cache and corrected sequence lengths.',
        takeaway: 'Step N: launch the current model forward.',
        source: { path: 'deepinfer/worker/worker.py', start: 113, end: 124, highlightStart: 120, highlightEnd: 124 },
        peerId: 'overlap-sglang-launch',
      },
      {
        title: 'Process the previous result',
        explanation: 'The worker post-processes its retained previous step after launching the current forward. This is the key ordering that lets CPU work overlap device execution.',
        takeaway: 'Current forward N overlaps post-processing N−1.',
        source: { path: 'deepinfer/worker/worker.py', start: 139, end: 144, highlightStart: 143, highlightEnd: 144 },
        peerId: 'overlap-sglang-previous',
      },
      {
        title: 'Sample and retain current state',
        explanation: 'The current sampler output becomes WorkerStepState. Prompt and non-overlapped steps are processed immediately; zero-overhead decode keeps the state for the next iteration.',
        takeaway: 'Decode N becomes prev_step_state for N+1.',
        source: { path: 'deepinfer/worker/worker.py', start: 170, end: 187, highlightStart: 182, highlightEnd: 187 },
        peerId: 'overlap-sglang-sample',
      },
      {
        title: 'Compare the overlap loop',
        explanation: 'SGLang’s overlap loop launches the current batch and processes the last batch before sampling the current result. When configured with a batch queue, vLLM can enqueue a future and schedule further work before waiting for a result.',
        takeaway: 'DeepInfer and SGLang pipeline adjacent steps; vLLM can queue in-flight batches.',
        source: { path: 'deepinfer/worker/worker.py', start: 139, end: 144, highlightStart: 143, highlightEnd: 144 },
        peerId: 'overlap-sglang-previous',
        alternatePeerId: 'overlap-vllm-enqueue',
      },
    ],
  },
  'story-system': {
    id: 'story-system',
    steps: [
      {
        title: 'Add requests to the engine',
        explanation: 'LLM.generate iterates over the supplied prompts or token IDs, calls _add_request for each, then enters the engine loop.',
        takeaway: 'LLM.generate → _add_request → _run_engine.',
        source: { path: 'deepinfer/entrypoints/llm.py', start: 129, end: 142, highlightStart: 129, highlightEnd: 142 },
      },
      {
        title: 'Schedule prefill or decode',
        explanation: 'The native scheduler dispatches a PROMPT engine to prefill and a COMPLETION engine to decode. A NORMAL engine decides between the two for each step.',
        takeaway: 'Engine type → _schedule_prefill() or _schedule_decode().',
        source: { path: 'csrc/engine/scheduler.hpp', start: 288, end: 295, highlightStart: 288, highlightEnd: 295 },
        peerId: 'system-vllm-schedule',
      },
      {
        title: 'Run the scheduled batch',
        explanation: 'Cached block KV and, when needed, reconstructed SWA feed attention; expert placement shapes the MoE forward. The sampler produces output and DSpark confidence, and overlapping decode carries the current step into the next iteration.',
        takeaway: 'KV + replay → attention / MoE → sample + DSpark → next step.',
        source: { path: 'deepinfer/worker/worker.py', start: 113, end: 124, highlightStart: 120, highlightEnd: 124 },
        peerId: 'system-vllm-execute',
      },
      {
        title: 'Compare the engine loop',
        explanation: 'DeepInfer dispatches execute_model_step to its workers with scheduler outputs. vLLM’s engine core schedules and executes the model; SGLang’s normal scheduler loop runs the selected batch and processes its result.',
        takeaway: 'Each loop connects scheduled work to model execution and results.',
        source: { path: 'deepinfer/engine/llm_engine.py', start: 961, end: 973, highlightStart: 964, highlightEnd: 973 },
        peerId: 'system-vllm-execute',
        alternatePeerId: 'system-sglang-run',
      },
    ],
  },
};
