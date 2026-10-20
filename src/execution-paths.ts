/** Static source traces for deepseek-ai/DeepInfer at 774ce24, not execution logs. */
export interface ExecutionStep {
  title: string;
  explanation: string;
  path: string;
  line: number;
}

export interface ExecutionPath {
  id: string;
  title: string;
  summary: string;
  conditions: string[];
  steps: ExecutionStep[];
  related: string[];
}

export const executionPaths: ExecutionPath[] = [
  {
    id: "offline-setup",
    title: "Offline setup → loaded model",
    summary: "An example resolves a checkpoint and launches ranks, then each engine initializes workers, loads a model, profiles memory, and creates its scheduler.",
    conditions: [
      "This follows examples/offline_inference.py, not an HTTP serving endpoint. The checkpoint and supported accelerator environment are required to run it.",
      "The example sets chunked_prefill and may enable EPLB; library defaults are not necessarily the same as the example's settings.",
    ],
    steps: [
      { title: "Resolve the checkpoint", explanation: "The shared example helper accepts a local HF directory or downloads a model ID via snapshot_download; the default model can be overridden by DEEPINFER_HF_MODEL_DIR.", path: "examples/_config.py", line: 35 },
      { title: "Start data-parallel ranks", explanation: "The launcher spawns processes for the ranks assigned to this node. A single rank runs in the current process.", path: "examples/_launch.py", line: 27 },
      { title: "Set up before importing torch", explanation: "create_llm resolves the path and visible devices first, then imports LLM. It supplies chunked_prefill=True and decode_sequence=False for these examples.", path: "examples/_config.py", line: 86 },
      { title: "Build engine configuration", explanation: "LLM creates EngineArgs. Its post-init sets zero-overhead scheduling on by default for NORMAL and COMPLETION engines, off for PROMPT, unless explicitly set in the environment.", path: "deepinfer/engine/arg_utils.py", line: 48 },
      { title: "Parse checkpoint configuration", explanation: "EngineArgs creates model, cache, parallel, and scheduler configs. The model config is loaded from the HF directory; this release requires a vision aligner and recognizes the registered V4.1 architecture.", path: "deepinfer/engine/arg_utils.py", line: 62 },
      { title: "Initialize workers", explanation: "The engine creates a driver worker and, when context parallelism is greater than one, follower processes; workers initialize devices and distributed communication before model loading.", path: "deepinfer/engine/llm_engine.py", line: 368 },
      { title: "Build and materialize weights", explanation: "The loader validates checkpoint coverage, builds parameter containers on the meta device, materializes the parameters, loads HF weights, and adapts them into runtime modules. Dummy loading follows a separate branch.", path: "deepinfer/model_executor/models/deepseek.py", line: 446 },
      { title: "Profile cache and warm up", explanation: "The worker measures peak usage, reserves state and cache space, and all-reduces block counts. The implementation sums the counts and uses a rounded-down average; the engine's docstring says minimum, so it should not be taken as a description of this code.", path: "deepinfer/worker/base.py", line: 211 },
      { title: "Create scheduler", explanation: "After cache initialization, the engine constructs block and state managers and connects them to the C++ scheduler. Non-NORMAL stage types call a split hook, but the release does not supply complete disaggregated orchestration.", path: "deepinfer/engine/llm_engine.py", line: 248 },
    ],
    related: ["request-flow", "model", "cache", "parallelism", "service-boundary"],
  },
  {
    id: "offline-generate",
    title: "Prompt → sequence → generated output",
    summary: "The offline facade enqueues all requests, repeatedly advances the engine, collects pooled outputs, and flushes in-flight work.",
    conditions: [
      "Inputs may be prompt text or token IDs, with optional per-request sampling parameters and image data.",
      "With zero-overhead scheduling, a step may return a previous step's output; the final flush is necessary.",
    ],
    steps: [
      { title: "Submit the batch", explanation: "LLM.generate normalizes a single prompt to a list, checks inputs, applies default sampling parameters, and enqueues each request before running the engine.", path: "deepinfer/entrypoints/llm.py", line: 90 },
      { title: "Tokenize and identify", explanation: "_add_request creates a request ID, tokenizes text when token IDs were not supplied, and passes int32 IDs to LLMEngine.", path: "deepinfer/entrypoints/llm.py", line: 144 },
      { title: "Create sequence state", explanation: "add_request validates IDs, expands image placeholders if appropriate, constructs a Sequence, and either enqueues immediately or waits for a structured-output matcher.", path: "deepinfer/engine/llm_engine.py", line: 521 },
      { title: "Ask for the next batch", explanation: "Each engine step calls the native scheduler to produce sequence metadata and scheduling outputs, then submits the plan to the worker.", path: "deepinfer/engine/llm_engine.py", line: 881 },
      { title: "Execute and process", explanation: "The worker launches the current model forward, processes an earlier step if present, and launches current sampling. Prompt or non-ZOS output is processed immediately; ZOS decode output is deferred.", path: "deepinfer/worker/worker.py", line: 89 },
      { title: "Update request state", explanation: "The engine translates sampler tensors into scheduler output processing; the native scheduler advances cache and generation state and creates request outputs.", path: "deepinfer/engine/llm_engine.py", line: 687 },
      { title: "Collect and flush", explanation: "The facade clones pooled outputs before the next step can release them, flushes in-flight requests after scheduling ends, orders results by request ID, and optionally decodes tokens.", path: "deepinfer/entrypoints/llm.py", line: 168 },
    ],
    related: ["request-flow", "scheduler", "overlap", "sampling"],
  },
  {
    id: "prefill-decode-scheduling",
    title: "Choose prefill or decode",
    summary: "The scheduler coordinates step type across data-parallel ranks, admits prompt chunks, and selects running sequences for decode.",
    conditions: [
      "PROMPT runs prefill only; COMPLETION runs decode only; NORMAL can run either. COMPLETION requires stop_preempted_request=true because it cannot recompute prefill.",
      "The production Q&A describes a fitted prefill time-quota policy. The visible open scheduler uses token, sequence, and cache limits; do not assume the production quota policy is present here.",
    ],
    steps: [
      { title: "Select the engine mode", explanation: "The native scheduler branches on NORMAL, PROMPT, and COMPLETION. In NORMAL, all ranks agree on step type; periodic ALL and ANY votes coordinate when prefill may run.", path: "csrc/engine/scheduler.hpp", line: 275 },
      { title: "Check prefill eligibility", explanation: "A rank wants prefill only if work is waiting and cache use is at or below the prefill watermark. A second vote falls back to decode if no rank actually scheduled prompt work.", path: "csrc/engine/scheduler.hpp", line: 308 },
      { title: "Schedule prompt chunks", explanation: "The waiting queue is checked against sequence capacity, context limits, block availability, and batched-token budget. Chunking and image-aware boundaries affect how much prompt work fits.", path: "csrc/engine/scheduler.hpp", line: 347 },
      { title: "Admit decode requests", explanation: "Prompted sequences move into the running set, allocating MTP slots; a forked sequence may clone state and its last cache block first.", path: "csrc/engine/scheduler.hpp", line: 579 },
      { title: "Schedule under cache pressure", explanation: "The implementation sorts output lengths descending, schedules from the shorter end, and preempts from the longer end when it needs blocks. The nearby comment says shortest-output preemption, which conflicts with this ordering.", path: "csrc/engine/scheduler.hpp", line: 622 },
      { title: "Stop or recompute", explanation: "Preempted requests stop when configured to do so, and active structured-output requests also stop because recomputation is unsupported. Other preempted NORMAL requests reset and return to waiting.", path: "csrc/engine/scheduler.hpp", line: 766 },
      { title: "Apply sampled results", explanation: "After a forward/sampling step, native output processing advances sequences and corrects optimistic cache accounting for accepted draft tokens.", path: "csrc/engine/scheduler.hpp", line: 872 },
    ],
    related: ["scheduler", "cache", "overlap", "speculation", "service-boundary"],
  },
  {
    id: "model-attention",
    title: "Batch metadata → model → attention",
    summary: "The worker prepares phase-specific metadata and runs checkpoint-configured decoder layers, which combine sliding-window and compressed attention where configured.",
    conditions: [
      "The driver builds input metadata; CP followers receive it. Graph replay is a decode path when enabled and captured graphs exist; prefill uses the non-graph path here.",
      "Compression, sparse index selection, cross-layer sharing, and YOCO depend on checkpoint configuration and environment settings.",
    ],
    steps: [
      { title: "Choose metadata preparation", explanation: "ModelMetadata selects prompt preparation or decode preparation; decode uses a distinct zero-overhead variant when ZOS is enabled.", path: "deepinfer/model_executor/model_metadata_utils.py", line: 142 },
      { title: "Choose graph or eager", explanation: "The driver chooses a captured graph for eligible decode batches, padding metadata to a graph size, or constructs metadata and moves it to the device. CP followers receive the metadata.", path: "deepinfer/worker/model_runner.py", line: 171 },
      { title: "Launch forward", explanation: "execute_main_model invokes graph replay or self.model in a region that forbids CUDA synchronization, then returns model output and metadata.", path: "deepinfer/worker/model_runner.py", line: 308 },
      { title: "Iterate decoder layers", explanation: "DeepseekModel embeds input IDs, sets up cross-layer runtime state, optionally partitions prefill for context parallelism, and invokes each layer with its cache.", path: "deepinfer/model_executor/models/deepseek.py", line: 154 },
      { title: "Attention then MoE", explanation: "Each decoder layer applies attention-side normalization, attention, FFN-side normalization, and its MLP. Optional Engram and DFlash feature hooks attach at selected layers.", path: "deepinfer/model_executor/models/decoder_layer.py", line: 97 },
      { title: "Build compressed indices", explanation: "Where a layer has packed KV and a local indexer, it stores the compressed main KV and computes top-k compressed positions. Other layers can reuse shared indices or metadata-defined indices.", path: "deepinfer/model_executor/models/v4_modules/attn.py", line: 525 },
      { title: "Run phase-specific attention", explanation: "Prefill assembles sliding-window and compressed indices; decode reads cache slots. Both call the backend with phase-specific metadata.", path: "deepinfer/model_executor/models/v4_modules/attn.py", line: 589 },
      { title: "Select backend kernel", explanation: "The FlashMLA wrapper has fused and regular branches; the regular path pads head counts to supported sizes. The Ascend platform may replace underlying imports or kernels, so a static name alone does not establish a hardware execution.", path: "deepinfer/model_executor/layers/attention_backend.py", line: 26 },
    ],
    related: ["model", "attention", "parallelism", "kernels", "yoco"],
  },
  {
    id: "expert-routing",
    title: "Gate → experts → combine",
    summary: "MoE selects logical experts for each token, maps them to physical placements, and chooses either a fused Mega path or explicit dispatch and combine.",
    conditions: [
      "The Mega branch is selected only for supported precision and an expert group within a scale-up domain, with a further GPU-or-fp8×fp4 condition.",
      "Expert rearrangement is disabled when its interval is zero, the library environment default. The offline example explicitly sets a nonzero interval when EPLB is enabled.",
    ],
    steps: [
      { title: "Resolve physical expert count", explanation: "The loader rounds the requested minimum number of redundant experts so physical expert slots divide evenly across the EP group.", path: "deepinfer/model_executor/model_loader.py", line: 83 },
      { title: "Choose execution branch", explanation: "DeepseekMoE records activation/weight precision and group topology, then determines whether the Mega path is available.", path: "deepinfer/model_executor/models/v4_modules/mlp.py", line: 177 },
      { title: "Select experts", explanation: "The gate produces top-k indices and weights, applies the logical-to-physical expert mapping and records loads. A GPU-specific mega gate and a regular gate are alternative paths.", path: "deepinfer/model_executor/models/v4_modules/mlp.py", line: 359 },
      { title: "Fused Mega path", explanation: "If use_mega_moe is true, routing writes into a symmetric buffer and a DeepGEMM mega kernel executes the expert computation and can fuse shared-expert work.", path: "deepinfer/model_executor/models/v4_modules/mlp.py", line: 528 },
      { title: "Explicit path", explanation: "Otherwise the forward path dispatches activations, runs grouped expert GEMMs and SwiGLU, computes the shared expert, and combines outputs back to their originating ranks.", path: "deepinfer/model_executor/models/v4_modules/mlp.py", line: 565 },
      { title: "Observe and rebalance", explanation: "After sampling, EPLB updates expert counts and statistics. A nonzero rearrangement interval enables periodic placement changes; the policy gives redundant slots to hot experts and shuffle code moves weights.", path: "deepinfer/model_executor/eplb/__init__.py", line: 131 },
    ],
    related: ["moe", "parallelism", "model", "kernels"],
  },
  {
    id: "cache-yoco",
    title: "Cache allocation and YOCO replay",
    summary: "The runtime holds paged KV and per-sequence state on the accelerator; optional YOCO compact prefill keeps a bounded set of consumer query rows.",
    conditions: [
      "YOCO truncation defaults to off. When enabled, keep tokens must cover the configured sliding window plus maximum backtracking.",
      "This trace covers in-flight cache and bounded replay. The production distributed KV store and service-level prefix routing are outside the release.",
    ],
    steps: [
      { title: "Derive block size", explanation: "The model metadata resolves a 128-token block and the engine creates a CacheConfig using the checkpoint and runtime settings.", path: "deepinfer/model_executor/model_metadata_utils.py", line: 133 },
      { title: "Allocate blocks and state", explanation: "CacheEngine computes model-specific layouts and allocates GPU block and per-sequence state tensors; layers receive views through GPUCacheInterface.", path: "deepinfer/worker/cache_engine.py", line: 851 },
      { title: "Manage block lifetime", explanation: "The native free list reserves block zero, allocates IDs, pins references, and returns a block to the free list when its reference count reaches zero.", path: "csrc/engine/block_manager.hpp", line: 27 },
      { title: "Find YOCO consumers", explanation: "A configured n_prefill_layer below num_hidden_layers identifies the consumer portion of the model.", path: "deepinfer/model_executor/models/v4_modules/yoco.py", line: 14 },
      { title: "Switch at the boundary", explanation: "During prompt processing, compact mode switches to a consumer metadata view and retains full metadata for the full-source KV path; mask mode uses a mask view.", path: "deepinfer/model_executor/models/deepseek.py", line: 190 },
      { title: "Compact retained queries", explanation: "The boundary gathers the query rows needed by consumer layers, with extra redistribution if CP is active. Full shared hidden can still feed main/index KV storage.", path: "deepinfer/model_executor/models/v4_modules/yoco.py", line: 55 },
      { title: "Understand the approximation", explanation: "DeepSeek's deployment Q&A says bounded replay limits attention to within the replayed segment, so it is approximate. The repository's mask-versus-compact checks do not prove identity with the full, untruncated model.", path: "doc/inference_deployment_qa.md", line: 179 },
    ],
    related: ["cache", "yoco", "attention", "validation", "service-boundary"],
  },
  {
    id: "speculative-verification",
    title: "Draft → verify → choose the next budget",
    summary: "DFlash proposes draft tokens, the main sampler verifies their accepted prefix, and optional confidence scheduling allocates verification work across requests.",
    conditions: [
      "DEEPINFER_USE_NEXTN_DECODE defaults to 5; explicitly setting 0 disables speculative decoding. Dynamic allocation additionally requires DEEPINFER_ENABLE_MTP_VARLEN=1 and a usable profiled curve.",
      "If the curve is empty, the C++ scheduler uses 1 + the available draft count per sequence. This can occur when graph profiling is not performed.",
    ],
    steps: [
      { title: "Construct draft heads", explanation: "V41Builder adds DFlash prediction blocks when the checkpoint specifies next-token layers, and the runtime creates a DFlash module when nextn is nonzero.", path: "deepinfer/model_executor/models/v4_modules/builder.py", line: 93 },
      { title: "Save target features", explanation: "The main model collects configured target-layer features and updates the draft model's main cache after the forward pass.", path: "deepinfer/model_executor/models/deepseek.py", line: 172 },
      { title: "Verify the previous drafts", explanation: "Decode sampling maps rows to requests and positions, applies any grammar masks, processes main-model logits, and determines the accepted draft prefix and final token.", path: "deepinfer/model_executor/layers/sampler.py", line: 411 },
      { title: "Propose the next drafts", explanation: "When speculative inputs exist, the sampler invokes DFlash; its draft forward can be captured as a graph or run eagerly, and its sampling writes token IDs, logprobs, and optional confidence to a pool.", path: "deepinfer/model_executor/models/mtp/dflash.py", line: 279 },
      { title: "Profile the curve", explanation: "During warmup, when graphs are enabled and variable MTP is requested, the worker profiles decode performance and passes the curve to the scheduler.", path: "deepinfer/worker/base.py", line: 274 },
      { title: "Choose total verification work", explanation: "MTPVarlen uses a profiled graph-time curve, recent runtime and sorted acceptance estimates to find an expected-throughput maximum; an empty curve takes the full-draft fallback.", path: "csrc/engine/mtp_varlen.hpp", line: 150 },
      { title: "Correct overlapping batches", explanation: "When previous and current batches overlap, zero-overhead scheduling may need device-side sequence-length corrections. If variable MTP is enabled, newer confidence values redistribute the fixed total query budget on device.", path: "deepinfer/worker/worker.py", line: 191 },
      { title: "Read the allocation reference", explanation: "The PyTorch reference computes cumulative confidence products, stable-ranks all candidate positions, and gives each request one base query plus its winning draft positions.", path: "deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py", line: 35 },
    ],
    related: ["speculation", "overlap", "scheduler", "sampling"],
  },
  {
    id: "image-input",
    title: "Image placeholder → vision embeddings",
    summary: "For image inputs, the engine expands placeholders, processes image data in workers, and merges vision embeddings into the language-model input.",
    conditions: [
      "The multimodal processor is constructed only for a registered model with a mapper and an engine type other than COMPLETION.",
      "The Q&A's production vision-encoder disaggregation and load balancer are separate from this offline path.",
    ],
    steps: [
      { title: "Enable the processor", explanation: "Engine initialization detects the model's multimodal mapper and creates a MultimodalProcessor for eligible engine types.", path: "deepinfer/engine/llm_engine.py", line: 207 },
      { title: "Resolve image token and workers", explanation: "The processor loads the checkpoint's image-processing configuration, checks that the tokenizer's image token matches, and starts preprocessing worker processes.", path: "deepinfer/ve/multimodal_processor.py", line: 59 },
      { title: "Expand the prompt", explanation: "Each image placeholder is replaced with an image sentinel and the estimated number of image padding positions; text and image spans are recorded as segments.", path: "deepinfer/ve/multimodal_processor.py", line: 105 },
      { title: "Process segments", explanation: "The VL mapper converts image/text segments to tensors, bypassing image work for fully cached prefix segments where possible.", path: "deepinfer/model_executor/models/deepseek_vl.py", line: 105 },
      { title: "Encode and merge", explanation: "The VL model starts from text embeddings, runs the vision-language tuner when raw image data exists, and passes fused embeddings to the main model.", path: "deepinfer/model_executor/models/deepseek_vl.py", line: 194 },
      { title: "Vision transformer", explanation: "The vision pipeline includes a transformer that encodes image patches; an aligner maps vision features for the language-model pathway.", path: "deepinfer/model_executor/models/vision_encoder/vit.py", line: 168 },
    ],
    related: ["multimodal", "request-flow", "model", "service-boundary"],
  },
  {
    id: "grammar-constraint",
    title: "Schema → matcher → legal-token mask",
    summary: "A constrained request compiles an XGrammar matcher before scheduling, then the sampler applies masks as token state advances.",
    conditions: [
      "This path applies when SamplingParams.so_args is set. With normal enqueueing, compilation is asynchronous; enqueue=False builds synchronously.",
      "Active structured-output requests stop if preempted, because that recomputation path is not supported in this release.",
    ],
    steps: [
      { title: "Submit grammar before enqueue", explanation: "add_request waits for the matcher before adding an ordinary constrained request to the scheduler; a failed matcher is marked as a structured-output failure.", path: "deepinfer/engine/llm_engine.py", line: 606 },
      { title: "Compile in a thread pool", explanation: "SOMatcherBuilder owns a compiler and pending futures. The main engine pumps completed futures and only then calls their enqueue callbacks.", path: "deepinfer/structure_output/so_matcher_builder.py", line: 19 },
      { title: "Choose grammar type", explanation: "The compiler dispatches JSON schema, regex, or EBNF to XGrammar; unsupported types raise an error.", path: "deepinfer/structure_output/compiler.py", line: 54 },
      { title: "Advance and mask", explanation: "The matcher accepts emitted tokens, fills a bitmask for legal next tokens, and can roll back speculative state.", path: "deepinfer/structure_output/matcher.py", line: 134 },
      { title: "Apply to logits", explanation: "The sampler prepares grammar masks while logits are computed and applies them before prompt sampling or draft verification.", path: "deepinfer/model_executor/layers/sampler.py", line: 114 },
      { title: "Handle speculative positions", explanation: "The mask-building path advances through candidate draft tokens and prepares per-step masks, with rollback for speculative state.", path: "deepinfer/model_executor/layers/sampler.py", line: 302 },
    ],
    related: ["sampling", "speculation", "scheduler", "request-flow"],
  },
  {
    id: "platform-selection",
    title: "Platform → libraries → execution backend",
    summary: "The platform is initialized lazily, selects distributed and TileLang backends, and configures different paths for NVIDIA GPUs and Ascend NPUs.",
    conditions: [
      "The README lists NVIDIA SM100 and Huawei Ascend 950 on Linux as supported hardware; this trace alone verifies neither target at runtime.",
      "Batch-invariant inference is rejected by worker kernel setup on NPU in this release.",
    ],
    steps: [
      { title: "Select native extension", explanation: "The package adds an accelerator-and-architecture-tagged native-extension directory to its package path before later heavy initialization.", path: "deepinfer/__init__.py", line: 9 },
      { title: "Initialize platform lazily", explanation: "Accessing PLATFORM imports and caches the selected platform after visible devices have been configured.", path: "deepinfer/__init__.py", line: 53 },
      { title: "GPU path", explanation: "PlatformGPU uses the CUDA TileLang backend and NCCL distributed backend; it configures NCCL options and host memory registration.", path: "deepinfer/platform.py", line: 55 },
      { title: "Ascend path", explanation: "PlatformNPU uses the Ascend TileLang backend and HCCL, checks visible-device settings, imports torch_npu's CUDA-to-NPU compatibility layer, and registers selected import patches.", path: "deepinfer/platform.py", line: 86 },
      { title: "Load device kernels", explanation: "The TileLang operation registry imports modules from the selected platform backend and raises an error if a requested kernel is unavailable.", path: "deepinfer/model_executor/layers/tilelang_ops/ops.py", line: 13 },
      { title: "Configure worker kernels", explanation: "Worker setup enables GPU-specific settings; on NPU it asserts batch invariance is disabled and selects deterministic algorithms for certain libraries.", path: "deepinfer/worker/runtime_config.py", line: 54 },
      { title: "Create communication groups", explanation: "ParallelProcessGroup builds DP, CP, EP, and other groups using the platform backend and separate Gloo groups for CPU coordination.", path: "deepinfer/model_executor/parallel_utils/parallel_state.py", line: 70 },
    ],
    related: ["kernels", "parallelism", "model", "validation"],
  },
];
