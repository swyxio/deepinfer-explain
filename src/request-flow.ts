/** A source-traced offline request at DeepInfer revision 774ce24, not a runtime log. */
export interface RequestFlowStage {
  id: string;
  title: string;
  phase: string;
  summary: string;
  detail: string;
  condition?: string;
  code: { path: string; line: number; label: string }[];
  research: string[];
  chapters: string[];
}

export const requestFlowStages: RequestFlowStage[] = [
  {
    id: 'input',
    title: 'Accept and tokenize',
    phase: 'Input',
    summary: 'The offline LLM facade accepts prompt text or token IDs and creates a request for each item.',
    detail: 'LLM.generate normalizes a single prompt to a list and supplies default sampling parameters. _add_request copies those parameters, creates an ID, encodes text only when token IDs were not supplied, and converts the IDs to int32. This is an in-process API. DistServe studies disaggregated prefill and decode, while DeepSeek’s deployment notes describe a separate production fleet whose orchestration is not included in this release.',
    condition: 'Tokenization is skipped when the caller supplies prompt_token_ids.',
    code: [
      { path: 'deepinfer/entrypoints/llm.py', line: 90, label: 'LLM.generate: validate and enqueue the batch' },
      { path: 'deepinfer/entrypoints/llm.py', line: 144, label: 'Assign an ID and tokenize' },
      { path: 'README.md', line: 38, label: 'Components absent from the release' },
    ],
    research: ['deployment-qa', 'distserve'],
    chapters: ['request-flow', 'service-boundary'],
  },
  {
    id: 'enqueue',
    title: 'Create sequence and enqueue',
    phase: 'Admission',
    summary: 'The engine validates the request, creates sequence state and submits it to the scheduler.',
    detail: 'LLMEngine.add_request checks the token range, may expand image placeholders, and creates a Sequence containing the prompt, sampling settings, and request identity. A structured-output request can wait for its grammar matcher to compile before the enqueue callback runs. XGrammar explains the grammar mechanism; it is optional for this path.',
    condition: 'Image preprocessing and structured-output grammar compilation run only when requested.',
    code: [
      { path: 'deepinfer/engine/llm_engine.py', line: 542, label: 'Expand multimodal input and validate tokens' },
      { path: 'deepinfer/engine/llm_engine.py', line: 593, label: 'Create the sequence' },
      { path: 'deepinfer/engine/llm_engine.py', line: 606, label: 'Compile constraints and enqueue' },
      { path: 'deepinfer/structure_output/compiler.py', line: 14, label: 'Compile a grammar with XGrammar' },
    ],
    research: ['xgrammar', 'sglang'],
    chapters: ['request-flow', 'multimodal', 'sampling'],
  },
  {
    id: 'schedule',
    title: 'Choose the next batch',
    phase: 'Scheduling',
    summary: 'Each engine step asks the native scheduler for prompt or decode work and per-sequence metadata.',
    detail: 'In NORMAL mode, ranks coordinate their choice of prefill versus decode; the scheduler considers waiting work and a cache watermark. PROMPT and COMPLETION modes take their respective branches. This released scheduler uses its own queue and capacity rules; the separately described production prefill time-quota policy should not be assumed to be present. PagedAttention provides background on serving with block-managed KV memory, not proof of identical scheduling.',
    condition: 'A NORMAL engine may return to this decision many times while a request is active.',
    code: [
      { path: 'deepinfer/engine/llm_engine.py', line: 881, label: 'Schedule an engine step' },
      { path: 'csrc/engine/scheduler.hpp', line: 275, label: 'Choose engine mode and step type' },
      { path: 'csrc/engine/scheduler.hpp', line: 667, label: 'Build scheduler outputs and metadata' },
    ],
    research: ['pagedattention', 'deployment-qa'],
    chapters: ['scheduler', 'cache', 'service-boundary'],
  },
  {
    id: 'prefill',
    title: 'Admit a prompt chunk',
    phase: 'Prefill',
    summary: 'The scheduler admits waiting prompt tokens within batch, sequence, context and cache limits.',
    detail: 'The prompt path allocates sequence state and cache blocks, limits the token workload, and can split a prompt into chunks. Once a chunk is executed, an unfinished prompt returns to the waiting queue for another scheduling decision; the last chunk can produce the first output token. Block management is conceptually related to PagedAttention, while DeepInfer has its own implementation and model-specific cache layout.',
    condition: 'This branch runs for prompt work. Chunking depends on configuration and the token budget.',
    code: [
      { path: 'csrc/engine/scheduler.hpp', line: 347, label: 'Select waiting prompts' },
      { path: 'csrc/engine/scheduler.hpp', line: 460, label: 'Limit and chunk the prompt workload' },
      { path: 'csrc/engine/scheduler.hpp', line: 1011, label: 'Requeue an unfinished prompt' },
      { path: 'csrc/engine/block_manager.hpp', line: 27, label: 'Allocate and release cache blocks' },
    ],
    research: ['pagedattention', 'v41'],
    chapters: ['scheduler', 'cache'],
  },
  {
    id: 'worker',
    title: 'Prepare and launch the worker',
    phase: 'Execution',
    summary: 'The engine sends the scheduled plan to a worker, which prepares phase-specific metadata and launches the model.',
    detail: 'The driver prepares prompt or decode metadata and can distribute it to context-parallel followers. Eligible decode shapes may replay a captured graph; otherwise the model runs directly. The worker launches the current forward, post-processes a previous step when present, then samples the current step. NanoFlow also studies overlap, but its intra-device scheduling is distinct from this CPU/device pipeline.',
    condition: 'Graph replay is used only for eligible decode when graphs are enabled and available; prefill takes the non-graph path.',
    code: [
      { path: 'deepinfer/engine/llm_engine.py', line: 951, label: 'Dispatch the scheduled step' },
      { path: 'deepinfer/worker/worker.py', line: 89, label: 'Forward, previous post-process, sample' },
      { path: 'deepinfer/worker/model_runner.py', line: 171, label: 'Choose graph or direct execution' },
      { path: 'deepinfer/worker/model_runner.py', line: 308, label: 'Launch the main model' },
    ],
    research: ['nanoflow', 'deployment-qa'],
    chapters: ['overlap', 'parallelism', 'kernels'],
  },
  {
    id: 'model',
    title: 'Run attention and experts',
    phase: 'Model',
    summary: 'The model embeds inputs and runs decoder layers containing attention and expert computation.',
    detail: 'Each decoder layer applies attention and its MLP. Depending on the checkpoint and layer, attention can combine sliding-window state with compressed or sparse KV; the MoE gate selects experts and takes a fused Mega or explicit dispatch path. FlashAttention is useful context for IO-aware attention, but V4.1’s compressed/sparse architecture and its kernels are different from the paper’s exact dense-attention algorithm.',
    condition: 'Compression, sparse indexing, expert routing, and YOCO behavior depend on model configuration and runtime settings.',
    code: [
      { path: 'deepinfer/model_executor/models/deepseek.py', line: 154, label: 'Embed inputs and iterate decoder layers' },
      { path: 'deepinfer/model_executor/models/decoder_layer.py', line: 143, label: 'Attention followed by MLP' },
      { path: 'deepinfer/model_executor/models/v4_modules/attn.py', line: 525, label: 'Compressed KV and index selection' },
      { path: 'deepinfer/model_executor/models/v4_modules/mlp.py', line: 565, label: 'Choose fused or explicit MoE execution' },
    ],
    research: ['v41', 'flashattention', 'deepseek-moe'],
    chapters: ['model', 'attention', 'moe', 'yoco'],
  },
  {
    id: 'sample',
    title: 'Sample and verify tokens',
    phase: 'Sampling',
    summary: 'The sampler converts model output to logits, applies any grammar constraints and produces token candidates.',
    detail: 'Prompt sampling and decode sampling take separate paths. During decode, the sampler verifies any draft tokens and may invoke the draft model to propose the next set. DSpark describes confidence-scheduled speculation; DFlash is a related block-diffusion drafting approach, and neither implies that every request uses the same draft configuration.',
    condition: 'Grammar masks and speculative drafting are conditional; prefill does not verify draft tokens.',
    code: [
      { path: 'deepinfer/model_executor/layers/sampler.py', line: 114, label: 'Prepare logits and optional grammar masks' },
      { path: 'deepinfer/model_executor/layers/sampler.py', line: 171, label: 'Separate prefill and decode sampling' },
      { path: 'deepinfer/model_executor/layers/sampler.py', line: 411, label: 'Verify draft candidates' },
      { path: 'deepinfer/model_executor/models/mtp/dflash.py', line: 279, label: 'Generate the next drafts' },
    ],
    research: ['dspark', 'dflash', 'xgrammar'],
    chapters: ['sampling', 'speculation'],
  },
  {
    id: 'update',
    title: 'Update sequence state',
    phase: 'Results',
    summary: 'The engine feeds sampled results back to the scheduler, advances cache state and checks for completion.',
    detail: 'The scheduler commits accepted tokens and corrects optimistic cache accounting for rejected drafts. It checks stopping conditions as tokens are appended. An incomplete prompt chunk returns to waiting; a completed prompt or ongoing decode can continue, while finished requests produce their results. With zero-overhead scheduling, decode post-processing can be deferred until the next worker step.',
    condition: 'Prompt steps and non-overlapped steps post-process immediately; overlapped decode may be one step behind.',
    code: [
      { path: 'deepinfer/worker/worker.py', line: 182, label: 'Immediate or deferred post-processing' },
      { path: 'deepinfer/engine/llm_engine.py', line: 725, label: 'Send sampler output back to scheduler' },
      { path: 'csrc/engine/scheduler.hpp', line: 927, label: 'Advance cache and commit accepted tokens' },
      { path: 'csrc/engine/scheduler.hpp', line: 1035, label: 'Check stop conditions' },
    ],
    research: ['dspark', 'deployment-qa'],
    chapters: ['scheduler', 'overlap', 'sampling'],
  },
  {
    id: 'decode',
    title: 'Schedule the next decode',
    phase: 'Decode loop',
    summary: 'Unfinished generated sequences return to scheduling for another decode batch.',
    detail: 'The scheduler admits prompted sequences and selects running sequences under block and sequence limits. Depending on memory pressure, it can preempt work; variable-length speculation can change the verification budget. The resulting batch returns to worker execution, model forward, sampling and state update, potentially multiple times. In NORMAL mode a scheduling decision can instead select waiting prefill work.',
    condition: 'Decode repeats until a stop condition, error, abort, or other termination. Prefill chunks also repeat through scheduling.',
    code: [
      { path: 'csrc/engine/scheduler.hpp', line: 579, label: 'Admit prompted sequences' },
      { path: 'csrc/engine/scheduler.hpp', line: 622, label: 'Select decode sequences and preempt if needed' },
      { path: 'csrc/engine/mtp_varlen.hpp', line: 150, label: 'Choose a speculative verification budget' },
      { path: 'deepinfer/entrypoints/llm.py', line: 174, label: 'Keep stepping while requests remain' },
    ],
    research: ['dspark', 'pagedattention'],
    chapters: ['scheduler', 'speculation', 'cache'],
  },
  {
    id: 'return',
    title: 'Flush and return output',
    phase: 'Output',
    summary: 'The facade collects per-step outputs, flushes in-flight work and returns results in input order.',
    detail: 'Request outputs come from a pool, so the facade clones them before the next step releases them. Once no requests remain, it flushes any deferred work, sorts by request ID, and optionally detokenizes to text. With decode_sequence disabled it returns the collected RequestOutput lists instead.',
    condition: 'Detokenization happens only when decode_sequence is enabled; flushing matters especially with overlapped decode.',
    code: [
      { path: 'deepinfer/entrypoints/llm.py', line: 168, label: 'Collect, clone, sort and optionally decode' },
      { path: 'deepinfer/engine/llm_engine.py', line: 977, label: 'Flush in-flight results' },
      { path: 'deepinfer/worker/worker.py', line: 274, label: 'Finish deferred worker post-processing' },
    ],
    research: ['deployment-qa'],
    chapters: ['request-flow', 'overlap'],
  },
];

// The two middle nodes are alternative scheduler outcomes, not consecutive steps.
export const requestFlowGroups = [['input'], ['enqueue'], ['schedule'], ['prefill', 'decode'], ['worker'], ['model'], ['sample'], ['update'], ['return']];
export const requestFlowTransitions: Record<string, { id: string; label: string }[]> = {
  input: [{ id: 'enqueue', label: 'Enqueue' }],
  enqueue: [{ id: 'schedule', label: 'Schedule' }],
  schedule: [{ id: 'prefill', label: 'Prompt work' }, { id: 'decode', label: 'Decode work' }],
  prefill: [{ id: 'worker', label: 'Run prompt work' }],
  decode: [{ id: 'worker', label: 'Run decode work' }],
  worker: [{ id: 'model', label: 'Run the model' }],
  model: [{ id: 'sample', label: 'Sample' }],
  sample: [{ id: 'update', label: 'Update state' }],
  update: [{ id: 'schedule', label: 'More work' }, { id: 'return', label: 'All requests finished' }],
  return: [],
};
