/** Static reading notes for the pinned DeepInfer checkout. A symbol anchor is
 * evidence of source behavior, not proof that a particular device executed it. */
export const runtimeSymbolNotes: Record<string, {line: number; symbol: string; note: string}[]> = {
  'deepinfer/engine/arg_utils.py': [
    {line: 18, symbol: 'EngineArgs', note: 'Collects offline engine options including model path, parallelism, cache sizing, and scheduler limits.'},
    {line: 48, symbol: 'EngineArgs.__post_init__', note: 'Chooses zero-overhead scheduling from the engine type when no explicit choice is supplied.'},
    {line: 62, symbol: 'EngineArgs.create_engine_configs', note: 'Translates user-facing options into model, cache, parallel and scheduler configurations.'},
  ],
  'deepinfer/engine/engine_type.py': [
    {line: 4, symbol: 'EngineType', note: 'Distinguishes normal, prompt, and completion engine roles; these names alone do not establish a working remote serving stack.'},
    {line: 16, symbol: 'EngineType.default_zero_overhead_scheduling', note: 'Defaults the overlapping scheduler on for normal and completion roles, and off for the prompt role.'},
  ],
  'deepinfer/engine/llm_engine.py': [
    {line: 67, symbol: 'DeferredRelease', note: 'Keeps sequence metadata, outputs and clone pins alive until the worker step can release them safely.'},
    {line: 130, symbol: 'LLMEngine', note: 'Coordinates requests, the native scheduler, workers, cache, multimodal preprocessing and output processing.'},
    {line: 307, symbol: 'LLMEngine._create_scheduler', note: 'Constructs the native scheduler with the configured block and sequence limits.'},
    {line: 368, symbol: 'LLMEngine._init_workers', note: 'Creates a driver worker and launches follower processes when the configured parallel group requires them.'},
    {line: 416, symbol: 'LLMEngine._init_cache', note: 'Profiles capacity before initializing cache engines. WorkerBase actually averages per-rank available blocks with an all-reduce, despite this method’s minimum-across-workers comment.'},
    {line: 472, symbol: 'LLMEngine.add_request', note: 'Validates and constructs a sequence, starts optional image and grammar preparation, and adds the request to scheduling.'},
    {line: 801, symbol: 'LLMEngine.init_pd_split', note: 'This base hook is empty; adjacent cache-transfer hooks are also stubs. Their presence does not prove a complete disaggregated service.'},
    {line: 830, symbol: 'LLMEngine.pre_sampler_sync', note: 'Pumps pending structured-output matcher work and coordinates work that must finish before sampling.'},
    {line: 860, symbol: 'LLMEngine.step', note: 'Schedules a batch, executes a worker step, and handles deferred results; zero-overhead scheduling changes when the prior result is consumed.'},
    {line: 977, symbol: 'LLMEngine.flush_inflight_reqs', note: 'Drains overlapping work so final outstanding results can be processed before exit.'},
  ],
  'deepinfer/engine/profile_server.py': [
    {line: 107, symbol: 'ProfileManager', note: 'Optional per-engine HTTP profiling collects the driver worker only; a multi-process context-parallel run is not a whole-cluster trace.'},
    {line: 136, symbol: 'ProfileManager.start_http_server', note: 'Lazily imports the web server and logs missing dependencies or bind errors without failing engine startup.'},
    {line: 256, symbol: 'ProfileManager.step', note: 'The engine thread picks up and advances requested profiling; trace export is handed to an IO worker.'},
  ],
  'deepinfer/engine/stats_logger.py': [
    {line: 129, symbol: 'StatsLogger', note: 'Aggregates windows of step statistics and emits throughput, utilization and optional MoE/speculation metrics.'},
    {line: 195, symbol: 'StatsLogger._throughput', note: 'Derives a rate from a rolling window and elapsed time, rather than reading an independently measured benchmark.'},
    {line: 438, symbol: 'StatsLogger.log_step', note: 'Records and periodically emits the current step’s collected statistics.'},
  ],
  'deepinfer/entrypoints/llm.py': [
    {line: 23, symbol: 'LLM', note: 'Offline Python entry point wrapping engine construction and a request loop.'},
    {line: 90, symbol: 'LLM.generate', note: 'Accepts prompts and sampling parameters, queues requests, and runs until their outputs are complete.'},
    {line: 168, symbol: 'LLM._run_engine', note: 'Repeatedly advances the engine while work remains and collects finished request outputs.'},
  ],
  'deepinfer/worker/base.py': [
    {line: 49, symbol: 'WorkerBase', note: 'Owns per-process device, distributed, model and cache initialization shared by workers.'},
    {line: 212, symbol: 'WorkerBase.profile_num_available_blocks', note: 'Profiles model memory, all-reduces the available block count and divides by world size, then rounds to an even count; it is not a per-rank minimum.'},
    {line: 274, symbol: 'WorkerBase.warm_up_model', note: 'Runs model warmup and graph capture using the configured cache after initialization.'},
  ],
  'deepinfer/worker/cache_engine.py': [
    {line: 206, symbol: 'KVCache', note: 'Describes attention cache views passed to each layer, separating logical access from backing storage.'},
    {line: 221, symbol: 'StateBlock', note: 'Describes recurrent compression/index state storage alongside the KV block cache.'},
    {line: 309, symbol: 'KVCacheManager', note: 'Plans and slices cache and state buffers according to the model’s attention configuration and shared-layer ownership.'},
    {line: 376, symbol: 'KVCacheManager.process', note: 'Lays out cache and state for an attention module; shared source mappings affect which layer owns data.'},
    {line: 540, symbol: 'GPUCacheInterface', note: 'Provides layer-indexed views into GPU cache and state; it also handles state slices for save/load paths.'},
    {line: 851, symbol: 'CacheEngine', note: 'Calculates cache sizes and allocates the buffers used by the worker, rather than implementing request scheduling itself.'},
  ],
  'deepinfer/worker/cuda_graph_runner.py': [
    {line: 41, symbol: 'build_graph_batch_sizes', note: 'Constructs the discrete batch sizes for captured graph buckets.'},
    {line: 69, symbol: 'CudaGraphRunner', note: 'Owns graph capture and reusable inputs/outputs for supported model batch sizes.'},
    {line: 143, symbol: 'CudaGraphRunner.select', note: 'Selects a captured graph bucket for a token count; graph replay uses its static shape.'},
  ],
  'deepinfer/worker/decode_perf_cache.py': [
    {line: 26, symbol: 'DecodePerfCache', note: 'Caches decode profiling results under a key derived from model and parallel configuration.'},
    {line: 126, symbol: 'DecodePerfCache.load_decode_perf_cache', note: 'Loads usable cached results if present; a cache hit is not a fresh performance measurement.'},
  ],
  'deepinfer/worker/dflash_cuda_graph_runner.py': [
    {line: 31, symbol: 'DFlashCudaGraphRunner', note: 'Captures separate draft-model graphs by request count and whether sampling is enabled.'},
    {line: 84, symbol: 'DFlashCudaGraphRunner.replay', note: 'Replays a captured DFlash decode graph with the supplied decode input.'},
  ],
  'deepinfer/worker/model_runner.py': [
    {line: 53, symbol: 'ModelRunner', note: 'Bridges worker batches to model inputs, forward execution, sampling, profiling and graph capture.'},
    {line: 96, symbol: 'ModelRunner.load_model', note: 'Loads the model through the loader and attaches the sampling and optional draft-model runtime.'},
    {line: 171, symbol: 'ModelRunner._prepare_input_driver', note: 'Prepares the driver’s batch metadata and chooses graph inputs when applicable; follower preparation is separate.'},
    {line: 308, symbol: 'ModelRunner.execute_main_model', note: 'Dispatches the main model forward, using captured graph replay when a suitable graph is selected.'},
    {line: 337, symbol: 'ModelRunner.execute_sample', note: 'Turns model outputs into sampled tokens, integrating draft information when enabled.'},
    {line: 562, symbol: 'ModelRunner.profile_decode_perf', note: 'Profiles decode configurations for scheduling decisions; its results depend on the actual hardware and settings.'},
  ],
  'deepinfer/worker/runtime_config.py': [
    {line: 29, symbol: 'configure_worker_environment', note: 'Sets worker process environment, including optional JIT cache directory configuration.'},
    {line: 54, symbol: 'configure_worker_kernels', note: 'Enables GPU programmatic dependent launch; batch-invariant mode or NPU uses deterministic algorithms, and NPU rejects batch-invariant mode here.'},
  ],
  'deepinfer/worker/worker.py': [
    {line: 51, symbol: 'Worker', note: 'Runs each scheduled batch and coordinates overlap with the previous worker step.'},
    {line: 89, symbol: 'Worker.execute_model_step', note: 'Prepares inputs, executes model and sampler, and retains step state for output processing; the overlap path changes synchronization.'},
    {line: 191, symbol: 'Worker._correct_seqlens_qk', note: 'Corrects query/key lengths for an overlapping decode step using prior sampled results and remapping.'},
    {line: 248, symbol: 'Worker._post_process_step', note: 'Waits for the relevant step and returns results through the engine’s post-processing callback.'},
  ],
  'deepinfer/worker/zos_status.py': [
    {line: 10, symbol: 'WorkerStepState', note: 'Keeps scheduler metadata, sampler output and completion events alive across overlapping steps.'},
    {line: 24, symbol: 'MetadataZOS', note: 'Stores GPU lengths and the CPU/GPU remap relating the current batch to the previous batch.'},
  ],
  'deepinfer/hugging_face/__init__.py': [
    {line: 40, symbol: '__getattr__', note: 'Lazily imports the public Hugging Face integration symbols and caches each resolved export.'},
  ],
  'deepinfer/hugging_face/config.py': [
    {line: 51, symbol: '_assert_supported', note: 'Checks the accepted HF architecture and configuration rather than treating every Transformers model as compatible.'},
    {line: 68, symbol: '_shared_layer_cfg', note: 'Translates HF source-layer settings into runtime maps for shared attention resources.'},
    {line: 146, symbol: '_build_attn_module_list', note: 'Builds the per-layer attention specification, including window and compression variants.'},
    {line: 237, symbol: 'load_hf_model_config', note: 'Reads the HF configuration and builds DeepInfer’s text, vision, MoE, DFlash and other runtime settings where present.'},
  ],
  'deepinfer/hugging_face/loading.py': [
    {line: 28, symbol: 'prepare_hf_coverage', note: 'Builds the mapping of available checkpoint tensors to expected model parameters before loading.'},
    {line: 69, symbol: 'cover_tied_parameters', note: 'Accounts for tied parameters in the coverage mapping.'},
    {line: 86, symbol: 'validate_hf_shapes', note: 'Checks checkpoint tensor shapes against model targets before the actual load.'},
  ],
  'deepinfer/hugging_face/names.py': [
    {line: 24, symbol: 'resolve_hf_name', note: 'Resolves a requested checkpoint name against available names, including supported naming alternatives.'},
    {line: 147, symbol: 'hf_to_model', note: 'Maps supported HF checkpoint paths to native model parameter paths, including layer-specific rules.'},
  ],
  'deepinfer/hugging_face/parameters.py': [
    {line: 14, symbol: 'model_params', note: 'Collects registered parameters and persistent buffers by model path, retaining tied parameters across distinct modules.'},
    {line: 30, symbol: 'set_ue8m0_sf', note: 'Prepares scales for ordinary 2D E4M3 FP8 parameters; FP4 and Engram follow dedicated paths.'},
  ],
  'deepinfer/hugging_face/processor.py': [
    {line: 19, symbol: 'load_processor_config', note: 'Requires V4.1 image geometry from config.json and validates required numeric settings.'},
    {line: 46, symbol: 'build_mm_processor', note: 'Constructs text and any-resolution image processors with HF-derived geometry; image normalization happens later in the model path.'},
  ],
  'deepinfer/hugging_face/tokenizer.py': [
    {line: 33, symbol: '_apply_release_fixups', note: 'Applies release-specific tokenizer corrections after loading.'},
    {line: 77, symbol: 'get_hf_tokenizer', note: 'Loads the HF tokenizer; release compatibility applies token fixups, while native compatibility leaves the supplied policy intact.'},
  ],
  'deepinfer/hugging_face/weights.py': [
    {line: 59, symbol: 'HFCoverage', note: 'Records checkpoint coverage and associated mappings used to resolve model targets.'},
    {line: 88, symbol: 'build_coverage', note: 'Classifies checkpoint names into normal, expert and Engram coverage for the configured model.'},
    {line: 182, symbol: '_TensorReader', note: 'Reads tensors from indexed checkpoint shards and manages open file resources.'},
    {line: 389, symbol: 'load_covered_params', note: 'Loads covered model tensors, including specialized expert and Engram handling, from checkpoint shards.'},
  ],
  'deepinfer/model_executor/input_metadata/dflash.py': [
    {line: 27, symbol: 'DFlashMetadataMixin', note: 'Holds draft-model input metadata alongside the main batch metadata.'},
    {line: 36, symbol: 'DFlashMetadataMixin.build_dflash_input', note: 'Builds the DFlash-specific inputs needed for draft execution from the current metadata.'},
  ],
  'deepinfer/model_executor/input_metadata/input_metadata.py': [
    {line: 27, symbol: 'InputMetadata', note: 'Carries batch lengths, positions, block tables and execution flags from scheduler preparation into model layers.'},
    {line: 170, symbol: 'InputMetadata.prepare_for_mirror_cp', note: 'Prepares metadata for mirrored context-parallel layout when that mode is used.'},
    {line: 218, symbol: 'InputMetadataV4', note: 'Extends input metadata with V4 attention, compression and model-specific fields.'},
    {line: 343, symbol: 'InputMetadataV4.compute_attn_info', note: 'Derives attention metadata for configured layer types and cache layouts.'},
    {line: 472, symbol: 'InputMetadataV4VL', note: 'Adds vision-language batch fields to the V4 metadata.'},
  ],
  'deepinfer/model_executor/input_metadata/prepare_tensor_input_zos.py': [
    {line: 39, symbol: 'prepare_decode_inputs_zos', note: 'Constructs decode inputs for zero-overhead scheduling using current metadata and prior-step results.'},
    {line: 181, symbol: 'prepare_token_ids_zos', note: 'Remaps prior sampled token IDs into the current batch, handling fresh and continuing sequences.'},
    {line: 307, symbol: 'prepare_decode_v4_zos', note: 'Prepares the V4-specific decode metadata in the overlapping scheduling path.'},
  ],
  'deepinfer/model_executor/input_metadata/yoco.py': [
    {line: 32, symbol: 'YocoMetadataMixin', note: 'Holds the producer/consumer views and indices needed when YOCO compacts prefill tokens.'},
    {line: 86, symbol: 'YocoMetadataMixin.get_mask_view', note: 'Returns the relevant mask view for a layer’s YOCO role.'},
    {line: 94, symbol: 'YocoMetadataMixin.get_consumer_view', note: 'Provides compacted consumer metadata after the YOCO boundary.'},
  ],
  'deepinfer/model_executor/eplb/__init__.py': [
    {line: 21, symbol: 'resolve_num_extra_experts', note: 'Pads the requested redundant experts until the physical expert count is divisible by expert-parallel size.'},
    {line: 42, symbol: 'ExpertLoadBalancer', note: 'Tracks logical-to-physical maps and expert counts, and periodically rearranges weights when configured.'},
    {line: 131, symbol: 'ExpertLoadBalancer.step', note: 'Advances load-balancing bookkeeping; rearrangement is conditional on its configured interval.'},
    {line: 223, symbol: 'ExpertLoadBalancer._rearrange_experts', note: 'Uses the selected shuffle path to move or replicate expert weights into the new layout.'},
  ],
  'deepinfer/model_executor/eplb/policy.py': [
    {line: 73, symbol: 'rebalance_experts_global', note: 'Computes a new global physical-expert placement from observed expert loads and the redundancy budget.'},
  ],
  'deepinfer/model_executor/eplb/shuffle.py': [
    {line: 65, symbol: 'expert_model_parallel_shuffle_inplace', note: 'Moves expert weights according to a new placement across the expert-parallel group.'},
    {line: 150, symbol: 'expert_model_parallel_shuffle_inplace_intranode', note: 'Provides a separate intra-node expert shuffle path.'},
  ],
  'deepinfer/model_executor/parallel_utils/communication_op.py': [
    {line: 12, symbol: 'gather', note: 'Implements a distributed gather helper used by parallel execution.'},
    {line: 51, symbol: 'broadcast_tensor_dict', note: 'Broadcasts metadata and tensor values to the participating process group.'},
  ],
  'deepinfer/model_executor/parallel_utils/cp.py': [
    {line: 9, symbol: 'CPManager', note: 'Owns DeepEP bucket storage and sessions for context-parallel communication; outputs alias reusable session storage.'},
    {line: 42, symbol: 'CPManager.all_gather', note: 'Starts an all-gather and returns a wait callback that concatenates rank shards along the token axis.'},
  ],
  'deepinfer/model_executor/parallel_utils/nccl_memory.py': [
    {line: 13, symbol: 'NCCLMemoryStatsLogger', note: 'Tracks and logs NCCL communication memory statistics.'},
  ],
  'deepinfer/model_executor/parallel_utils/parallel_state.py': [
    {line: 51, symbol: 'ParallelProcessGroup', note: 'Holds the process-group topology used to identify data, context and expert parallel participants.'},
    {line: 70, symbol: 'ParallelProcessGroup.create_process_groups', note: 'Creates named groups from the configured ranks and topology.'},
    {line: 196, symbol: 'init_parallel_groups', note: 'Initializes the runtime’s parallel process groups after distributed setup.'},
  ],
  'deepinfer/model_executor/parallel_utils/userbuffer.py': [
    {line: 54, symbol: '_UserBufferManager', note: 'Owns communication buffers used by context, expert and Engram operations.'},
    {line: 63, symbol: '_UserBufferManager.allocate_ep', note: 'Allocates the expert-parallel buffer required by the configured dispatch path.'},
    {line: 120, symbol: '_UserBufferManager.cp_session', note: 'Scopes access to context-parallel buffer storage and its asynchronous operations.'},
  ],
  'deepinfer/model_executor/models/__init__.py': [
    {line: 20, symbol: 'ModelRegistry', note: 'The registry maps only DeepseekV41ForCausalLM to its runtime class in this checkout; unregistered architecture names return None.'},
  ],
  'deepinfer/model_executor/models/decoder_layer.py': [
    {line: 48, symbol: 'DeepseekDecoderLayer', note: 'Connects attention, normalization, residual or hyper-connection mixing, and the MoE block for a decoder layer.'},
    {line: 97, symbol: 'DeepseekDecoderLayer.forward', note: 'Executes the layer with cache and input metadata; cross-layer and YOCO state affect which attention data is reused.'},
    {line: 178, symbol: 'DFlashDecoderLayer', note: 'Specializes the decoder for the draft-model path.'},
  ],
  'deepinfer/model_executor/models/deepseek.py': [
    {line: 154, symbol: 'DeepseekModel.forward', note: 'Runs embeddings and decoder layers with batch metadata, cache views and cross-layer state.'},
    {line: 251, symbol: 'DeepseekForCausalLM', note: 'Wraps the decoder with prediction and sampling machinery for causal generation.'},
    {line: 383, symbol: 'DeepseekForCausalLM.sample', note: 'Delegates output to the sampler with optional DFlash information, then advances expert-load-balancing bookkeeping if active.'},
    {line: 446, symbol: 'DeepseekForCausalLM.load_model', note: 'Builds and loads the model weights before runtime conversion and execution.'},
  ],
  'deepinfer/model_executor/models/deepseek_vl.py': [
    {line: 26, symbol: 'DeepseekVLForCausalLM', note: 'Extends the language model with vision input processing and image-embedding integration.'},
    {line: 42, symbol: 'DeepseekVLForCausalLM._split_cached_prefix', note: 'Separates image spans already represented by cached prompt tokens from those needing visual computation.'},
    {line: 105, symbol: 'DeepseekVLForCausalLM.multi_modal_mapper', note: 'Maps processor outputs to the image metadata and shared-memory handles consumed by the model.'},
    {line: 194, symbol: 'DeepseekVLForCausalLM.get_input_embeddings', note: 'Uses vision-language processing when image inputs are present and otherwise supplies text embeddings.'},
  ],
  'deepinfer/model_executor/models/mtp/dflash.py': [
    {line: 46, symbol: 'ConfidenceHead', note: 'Computes draft confidence information for the speculative decoding path.'},
    {line: 82, symbol: 'DFlash', note: 'Owns the draft model and its cache, and orchestrates speculative draft execution.'},
    {line: 198, symbol: 'DFlash.update_main_cache', note: 'Updates draft-side state from the main-model result before further speculation.'},
    {line: 241, symbol: 'DFlash.forward_drafts', note: 'Runs draft layers to produce candidate hidden states.'},
    {line: 279, symbol: 'DFlash.sample_drafts', note: 'Samples draft tokens and packages predictions for verification by the main model.'},
    {line: 379, symbol: 'DFlash.decode_forward', note: 'Entry point for draft decode execution; captured graphs may be used through the worker runner.'},
  ],
  'deepinfer/model_executor/models/v4_modules/attn.py': [
    {line: 228, symbol: 'V4Attention', note: 'Runtime attention combines sliding-window and configured compressed attention with cache and shared-layer state.'},
    {line: 308, symbol: 'V4Attention._init_compressor_and_indexer', note: 'Builds compressor and indexer components only for attention configurations that need them.'},
    {line: 525, symbol: 'V4Attention._compute_kv_ca_index', note: 'Computes or obtains cached compressed KV and candidate indices for the layer’s attention path.'},
    {line: 589, symbol: 'V4Attention._prefill_attention', note: 'Runs attention over prompt tokens with prefill-specific metadata and available KV.'},
    {line: 628, symbol: 'V4Attention._decode_attention', note: 'Uses the decode attention path and cache representation; sparse/indexed behavior depends on configuration.'},
    {line: 752, symbol: 'V4Attention.forward', note: 'Projects and positions queries and KV, updates cache, selects prefill or decode, and projects the result.'},
    {line: 883, symbol: 'DFlashAttention', note: 'Attention specialization for DFlash draft layers.'},
  ],
  'deepinfer/model_executor/models/v4_modules/builder.py': [
    {line: 34, symbol: 'V41Builder', note: 'Builds the native V4.1 parameter containers from the translated HF configuration.'},
    {line: 45, symbol: 'V41Builder._build_block', note: 'Constructs each decoder block with its configured attention and shared topology.'},
    {line: 93, symbol: 'V41Builder.build_model', note: 'Assembles model parameters, shared index resources and configured optional components.'},
  ],
  'deepinfer/model_executor/models/v4_modules/compress.py': [
    {line: 32, symbol: 'KProject', note: 'Projects keys and provides a pre-normalization operation for compressed attention.'},
    {line: 56, symbol: 'Compressor', note: 'Transforms token states into compressed KV, using state where the configured compression requires it.'},
    {line: 131, symbol: 'Compressor.forward_store_kv_cache', note: 'Writes the resulting compressed KV into the designated cache layout.'},
  ],
  'deepinfer/model_executor/models/v4_modules/containers.py': [
    {line: 16, symbol: 'GPTEmbedding', note: 'Defines the native text-embedding parameter container used by HF loading.'},
    {line: 26, symbol: 'MultimodalEmbedding', note: 'Contains the multimodal embedding parameters in their expected checkpoint structure.'},
    {line: 37, symbol: 'HFModelParameters', note: 'Holds assembled model modules and parameter paths for checkpoint loading.'},
    {line: 62, symbol: 'materialize_hf_parameter', note: 'Materializes an HF parameter on the requested device, including packed-FP4 handling when requested.'},
  ],
  'deepinfer/model_executor/models/v4_modules/cross_layer.py': [
    {line: 22, symbol: 'SharedLayerTopology', note: 'Validates and maps which layers supply shared KV, index keys and candidates to other layers.'},
    {line: 277, symbol: 'CrossLayerRuntime', note: 'Keeps shared attention results and derived metadata during a forward pass.'},
    {line: 339, symbol: 'build_shared_layer_topology', note: 'Builds the optional topology from configuration; a missing topology means ordinary per-layer ownership.'},
  ],
  'deepinfer/model_executor/models/v4_modules/engram.py': [
    {line: 35, symbol: 'CompressedTokenizer', note: 'Initializes and applies the compressed token mapping used before n-gram hashing.'},
    {line: 69, symbol: 'NgramEmbedding', note: 'Owns runtime access to a partition of the n-gram embedding table and its optional scale factors.'},
    {line: 107, symbol: 'Engram', note: 'Projects fetched n-gram embeddings and gate-fuses them with hidden states, with an image-token mask when supplied.'},
    {line: 164, symbol: 'EngramRuntime', note: 'Allocates the communication buffer and coordinates fetches for configured Engram layers.'},
    {line: 214, symbol: 'EngramRuntime.fetch', note: 'Starts the hash-indexed embedding fetches and exposes callbacks for their results.'},
  ],
  'deepinfer/model_executor/models/v4_modules/engram_metadata.py': [
    {line: 16, symbol: 'CompressedVocabulary', note: 'Builds compressed vocabulary metadata from a tokenizer.'},
    {line: 59, symbol: 'EngramLayout', note: 'Describes n-gram embedding dimensions and per-layer vocabulary sizes derived from configuration.'},
    {line: 98, symbol: 'NgramHashMapping', note: 'Constructs the configured mapping used to hash n-grams into embedding tables.'},
  ],
  'deepinfer/model_executor/models/v4_modules/engram_parameters.py': [
    {line: 16, symbol: 'NgramEmbeddingParameters', note: 'Partitions and aligns table rows across the Engram parallel group and records metadata for loading.'},
    {line: 43, symbol: 'EngramEmbedding', note: 'Preserves checkpoint parameter paths; the actual forward is implemented by Engram.'},
  ],
  'deepinfer/model_executor/models/v4_modules/hc.py': [
    {line: 57, symbol: 'HCLayerMixin', note: 'Implements the runtime hyper-connection mixing around attention and feed-forward sublayers.'},
    {line: 119, symbol: 'HCLayerMixin.attn_norm_forward', note: 'Prepares the attention input from hyper-connection residual streams and normalization.'},
    {line: 141, symbol: 'HCLayerMixin.ffn_norm_forward', note: 'Prepares the feed-forward input after attention and its residual mixing.'},
    {line: 229, symbol: 'HCLayerMixin._mega_mhc', note: 'Uses a fused hyper-connection implementation when its runtime branch is selected.'},
    {line: 367, symbol: 'HCHead', note: 'Mixes hyper-connection streams into the language-model head input.'},
  ],
  'deepinfer/model_executor/models/v4_modules/hc_blocks.py': [
    {line: 15, symbol: 'SigmoidHCBlockMixin', note: 'Defines per-block hyper-connection parameters in the checkpoint-compatible container.'},
    {line: 50, symbol: 'SigmoidHCHeadMixin', note: 'Defines the hyper-connection parameters used by a prediction head.'},
    {line: 66, symbol: 'MoeDecoderBlockHC', note: 'Combines attention and MoE parameter containers with hyper-connection parameters.'},
  ],
  'deepinfer/model_executor/models/v4_modules/hc_lazy.py': [
    {line: 15, symbol: 'HCLazyPostData', note: 'Carries residual and mixing tensors whose post-operation can be deferred until the next stage.'},
    {line: 27, symbol: 'HCLazyPostData.clear_post', note: 'Releases deferred post-mix fields while retaining the rest of the container.'},
  ],
  'deepinfer/model_executor/models/v4_modules/heads.py': [
    {line: 15, symbol: 'GPTHead', note: 'Contains the final normalization and vocabulary projection parameters.'},
    {line: 26, symbol: 'MarkovGPTHead', note: 'Adds the first-order Markov correction parameters used by the DFlash final head.'},
    {line: 37, symbol: 'AcceptRatePredictor', note: 'Defines the DFlash acceptance-rate prediction projection.'},
    {line: 65, symbol: 'DFlashNextPredictHeadHC', note: 'Configures a draft block’s first/last-shift projections and optional final prediction heads.'},
  ],
  'deepinfer/model_executor/models/v4_modules/index_attn.py': [
    {line: 56, symbol: 'MQA', note: 'Implements the indexer used to find candidate positions for indexed compressed attention.'},
    {line: 133, symbol: 'MQA.store_index_kv', note: 'Projects, normalizes, rotates and quantizes index keys into the index cache when this layer owns them.'},
    {line: 327, symbol: 'MQA._topk_prefill', note: 'Selects candidates using the prefill layout.'},
    {line: 456, symbol: 'MQA._topk_decode', note: 'Selects candidates using decode metadata and cache layout.'},
    {line: 516, symbol: 'MQA.forward', note: 'Dispatches index computation and candidate selection according to the current batch.'},
  ],
  'deepinfer/model_executor/models/v4_modules/linear.py': [
    {line: 8, symbol: 'ReplicatedLinear', note: 'A full linear parameter container carrying optional FP8 GEMM metadata.'},
    {line: 23, symbol: 'ParallelRoutedLinear', note: 'Stores a local shard of routed expert linear weights with expert and precision metadata.'},
  ],
  'deepinfer/model_executor/models/v4_modules/mhc_modeling.py': [
    {line: 22, symbol: 'mhc_head', note: 'Combines normalization and stream mixing for the final language-model head.'},
    {line: 72, symbol: 'mhc_pre_big_fuse', note: 'Inference-only fused prenorm, mixing and Sinkhorn path with BF16 residuals and FP32 parameters.'},
  ],
  'deepinfer/model_executor/models/v4_modules/mhc_ops.py': [
    {line: 25, symbol: 'expand_to_mhc', note: 'Expands hidden states into the configured number of hyper-connection streams.'},
    {line: 95, symbol: 'sinkhorn_normalize', note: 'Iteratively normalizes the connection matrix using the configured repetitions and epsilon.'},
  ],
  'deepinfer/model_executor/models/v4_modules/mla_attn.py': [
    {line: 26, symbol: 'ColumnParallelLora', note: 'Defines a low-rank column-parallel projection parameter container.'},
    {line: 100, symbol: 'MQAIndexer', note: 'Defines the indexer’s query/key projection and associated parameters.'},
    {line: 156, symbol: 'LoraRopeCompressFlashMHAAutoRecomp', note: 'Defines the attention parameter structure from which the V4 runtime attention is assembled.'},
    {line: 295, symbol: 'runtime_attn_sink', note: 'Returns the attention sink parameter from the configured attention module.'},
  ],
  'deepinfer/model_executor/models/v4_modules/mlp.py': [
    {line: 148, symbol: 'DeepseekMoE', note: 'Runtime MoE combines routing, expert-parallel dispatch, expert computation and combination with any shared expert.'},
    {line: 359, symbol: 'DeepseekMoE.gate_forward', note: 'Computes routing selections and can apply expert-load-balancing mappings.'},
    {line: 461, symbol: 'DeepseekMoE.dispatch', note: 'Sends selected token activations to expert owners using the configured communication path.'},
    {line: 493, symbol: 'DeepseekMoE.combine', note: 'Combines routed expert outputs back into the originating token layout.'},
    {line: 528, symbol: 'DeepseekMoE.mega_moe_forward', note: 'Uses the fused MegaMoE route only under its precision, platform and topology conditions; ordinary dispatch and grouped GEMM remain a separate path.'},
    {line: 565, symbol: 'DeepseekMoE.forward', note: 'Chooses the eligible MoE execution path and includes shared-expert work where configured.'},
  ],
  'deepinfer/model_executor/models/v4_modules/moe.py': [
    {line: 24, symbol: 'ReplicatedSharedExpert', note: 'Concatenates shared expert widths in a replicated pair of linear layers.'},
    {line: 40, symbol: 'TopKGate', note: 'Defines gate parameters and asserts sqrtsoftplus scoring, noaux_tc selection, and normalized top-k probabilities.'},
    {line: 70, symbol: 'FusedExperts', note: 'Allocates logical plus redundant physical experts, sharded across the expert-parallel group.'},
  ],
  'deepinfer/model_executor/models/v4_modules/norm.py': [
    {line: 13, symbol: 'DropoutAddRMSNorm', note: 'Checkpoint-compatible RMSNorm parameter container; the runtime normalization is constructed separately.'},
    {line: 36, symbol: 'DropoutAddRMSNorm.get_weight', note: 'Returns no weight when disabled, or exponentiates the parameter for exponential norm.'},
  ],
  'deepinfer/model_executor/models/v4_modules/rope.py': [
    {line: 19, symbol: 'RotaryEmbeddingYarn', note: 'Stores YaRN interpolation parameters; it is a configuration container rather than a warmed runtime cache.'},
    {line: 42, symbol: 'build_rotary_emb', note: 'Selects base or YaRN RoPE and rejects unsupported variants.'},
  ],
  'deepinfer/model_executor/models/v4_modules/utils.py': [
    {line: 19, symbol: 'convert_rope', note: 'Converts rotary configuration into the runtime representation and position cache.'},
    {line: 109, symbol: 'convert_rmsnorm', note: 'Transfers a checkpoint norm container’s settings and weight into runtime RMSNorm.'},
  ],
  'deepinfer/model_executor/models/v4_modules/yoco.py': [
    {line: 14, symbol: 'yoco_enabled', note: 'Enables YOCO when the configured number of prefill layers is smaller than the number of hidden layers.'},
    {line: 24, symbol: 'yoco_shared_hidden_required', note: 'Determines whether consumer layers need the shared hidden state for window or compressed KV production.'},
    {line: 55, symbol: 'yoco_boundary_compact', note: 'Keeps consumer queries at the producer/consumer boundary; context parallelism adds gather and rank-specific selection.'},
    {line: 93, symbol: 'compact_yoco_boundary', note: 'Compacts hidden/residual and shared candidate state, then clears derived caches whose query layout changed.'},
  ],
  'deepinfer/model_executor/models/vision_encoder/mlp_projector.py': [
    {line: 10, symbol: 'MlpProjector', note: 'Builds the downsample-then-MLP GELU aligner and asserts that this is the supported projector type.'},
  ],
  'deepinfer/model_executor/models/vision_encoder/vit.py': [
    {line: 69, symbol: 'PatchEmbedFlatten', note: 'Projects image patches into the vision transformer embedding space.'},
    {line: 90, symbol: 'Attention', note: 'Implements vision attention over image patch sequences with rotary positions.'},
    {line: 168, symbol: 'VisionTransformer', note: 'Runs the vision patch embedding and transformer blocks on the image inputs.'},
  ],
  'deepinfer/model_executor/models/vision_encoder/vl_aligner.py': [
    {line: 10, symbol: 'VisionLanguageInstructTuner', note: 'Reuses loaded vision and aligner parameters and image-specific token embeddings.'},
    {line: 47, symbol: 'VisionLanguageInstructTuner._encode_images', note: 'Runs the vision transformer, downsamples patch features and projects them to language-model width.'},
    {line: 79, symbol: 'VisionLanguageInstructTuner._merge_image_embeds', note: 'Replaces image and special-token positions in the input embedding tensor.'},
  ],
  'deepinfer/distributed/shm_broadcast.py': [
    {line: 33, symbol: 'ShmRingBuffer', note: 'Stores broadcast payloads and per-reader metadata in a shared-memory ring.'},
    {line: 162, symbol: 'MessageQueue', note: 'Coordinates local shared-memory readers and process-group participants for broadcast messages.'},
    {line: 321, symbol: 'MessageQueue.acquire_write', note: 'Acquires a reusable ring slot for a writer, with a timeout-aware wait for readers.'},
    {line: 360, symbol: 'MessageQueue.acquire_read', note: 'Waits for and acquires the next slot for a reader, then marks its progress.'},
    {line: 424, symbol: 'MessageQueue.broadcast_object', note: 'Sends or receives a serialized object according to the caller’s queue role.'},
  ],
  'deepinfer/model_executor/model_loader.py': [
    {line: 37, symbol: '_get_model_architecture', note: 'Resolves the model architecture through the explicitly supported registry and rejects unsupported architectures.'},
    {line: 65, symbol: 'get_model', note: 'Constructs the resolved model and invokes its model-loading path.'},
    {line: 83, symbol: '_configure_moe_redundancy', note: 'Resolves expert redundancy against the configured parallel layout before model allocation.'},
    {line: 128, symbol: 'build_model_on_meta', note: 'Builds the model parameter tree on the meta device before checkpoint materialization.'},
    {line: 136, symbol: 'load_hf_checkpoint', note: 'Checks coverage and shapes, then loads mapped HF checkpoint tensors into model parameters.'},
  ],
  'deepinfer/model_executor/model_metadata_utils.py': [
    {line: 29, symbol: 'derive_compress_ratios', note: 'Classifies configured compression ratios into dense and indexed sparse attention sets.'},
    {line: 42, symbol: 'ModelMetadata', note: 'Derives runtime dimensions, cache, YOCO and multimodal properties; this checkout rejects C4/C128 and compression overlap.'},
    {line: 142, symbol: 'ModelMetadata.get_input_metadata_class_and_prepare_inputs_func', note: 'Selects V4 or V4VL metadata and chooses ordinary versus zero-overhead decode preparation.'},
    {line: 146, symbol: 'ModelMetadata.prepare_inputmetadata_dict', note: 'Fills the native prepare arguments from the batch and model configuration, including YOCO and compression settings.'},
  ],
  'deepinfer/model_executor/model_output.py': [
    {line: 10, symbol: 'CausalLMForwardOutput', note: 'Wraps the hidden states that feed the language-model head, with narrow and copy operations for graph buffers.'},
  ],
  'deepinfer/model_executor/sampling_inputs.py': [
    {line: 31, symbol: 'MTPSamplingInput', note: 'Carries speculative sampling data and can create or trim graph-padding inputs.'},
    {line: 69, symbol: 'MTPDriverInput', note: 'Carries driver-side speculative inputs and supports padded graph shapes.'},
    {line: 95, symbol: 'MTPDecodeInput', note: 'Groups the inputs required for a DFlash decode step and exposes its request count.'},
  ],
  'deepinfer/model_executor/layer_utils.py': [
    {line: 6, symbol: 'iter_runtime_attn_modules', note: 'Walks configured attention modules while skipping the language-model head slot and translating configuration to runtime layer IDs.'},
  ],
  'deepinfer/model_executor/utils.py': [
    {line: 13, symbol: 'set_random_seed', note: 'Seeds the random generators used by the model runtime.'},
    {line: 22, symbol: 'reconstruct_param', note: 'Wraps an existing tensor as a parameter for runtime module construction.'},
    {line: 66, symbol: 'Movable', note: 'Provides a single-transfer container for ownership-sensitive runtime values.'},
  ],
  'deepinfer/_C/cuda_utils.pyi': [
    {line: 7, symbol: 'alloc_tensor', note: 'Type declaration for a native allocation function; implementation lives in the extension, not this stub.'},
    {line: 11, symbol: 'export_ipc_tensor', note: 'Declares export of an allocation as IPC bytes; this interface alone does not specify allocator lifetime guarantees.'},
    {line: 15, symbol: 'import_ipc_tensor', note: 'Declares importing IPC bytes into a tensor through the native extension.'},
  ],
  'deepinfer/_C/engine.pyi': [
    {line: 9, symbol: 'BlockManager', note: 'Type declaration for native block allocation, pinning and free-count operations; actual scheduling behavior is in the native implementation.'},
    {line: 51, symbol: 'FlopsEstimator', note: 'Declares a native model FLOPs estimator with prompt and YOCO settings; estimates are not measured device utilization.'},
    {line: 80, symbol: 'PrepareArgs', note: 'Exposes native input-preparation parameters including block size, compression ratios, context parallelism and YOCO.'},
    {line: 180, symbol: 'RequestOutput', note: 'Declares native request output accessors including generated tokens, finish reason, log probabilities and draft statistics.'},
  ],
  'deepinfer/_C/graph_timer.pyi': [
    {line: 7, symbol: 'EventHandle', note: 'Declares the native graph timing event interface, including recording, querying and elapsed time.'},
    {line: 45, symbol: 'GraphHandle', note: 'Declares access to event-record nodes in a captured graph for graph timing.'},
  ],
  'deepinfer/structure_output/compiler.py': [
    {line: 14, symbol: 'XGrammarCompiler', note: 'Owns grammar compilation resources for constrained generation.'},
    {line: 54, symbol: 'XGrammarCompiler.dispatch_and_compile', note: 'Dispatches a supported schema type to the appropriate XGrammar compilation operation.'},
  ],
  'deepinfer/structure_output/mask.py': [
    {line: 10, symbol: 'allocate_vocab_mask', note: 'Lazily imports the grammar mask allocator so unconstrained sampling does not eagerly import XGrammar.'},
    {line: 25, symbol: 'XGrammarUtils.apply_vocab_mask_by_step_inplace', note: 'Applies the token bitmask in place to logits through a kernel, requiring device-local int32 indices.'},
  ],
  'deepinfer/structure_output/matcher.py': [
    {line: 24, symbol: '_kmp_failure', note: 'Builds a failure table for matching a trigger-token sequence.'},
    {line: 58, symbol: 'XGrammarMatcher', note: 'Tracks grammar state, trigger and bound behavior for one constrained request.'},
    {line: 134, symbol: 'XGrammarMatcher.accept_token', note: 'Advances trigger or grammar state as tokens arrive and reports whether a token is accepted.'},
    {line: 181, symbol: 'XGrammarMatcher.fill_vocab_mask', note: 'Fills the vocabulary mask when constraints are active for the request.'},
    {line: 206, symbol: 'XGrammarMatcher.rollback', note: 'Rewinds matcher state for speculative or backtracking paths.'},
    {line: 261, symbol: 'XGrammarMatcherFuture', note: 'Wraps pending compilation and exposes completed or aborted matcher results.'},
  ],
  'deepinfer/structure_output/so_matcher_builder.py': [
    {line: 19, symbol: 'SOMatcherBuilder', note: 'Manages asynchronous grammar compilation and matcher construction for requests.'},
    {line: 58, symbol: 'SOMatcherBuilder.build', note: 'Builds a matcher future from structured-output arguments and optional replay tokens.'},
    {line: 109, symbol: 'SOMatcherBuilder.pump', note: 'Advances pending grammar work so ready matchers can be attached to requests.'},
  ],
  'deepinfer/ve/multimodal_processor.py': [
    {line: 29, symbol: 'MultimodalProcessor', note: 'Manages asynchronous multimodal preprocessing workers and shared-memory results.'},
    {line: 105, symbol: 'MultimodalProcessor.overwrite_prompt', note: 'Expands image placeholders into prompt segments and image-token layout before the request is scheduled.'},
    {line: 219, symbol: 'MultimodalProcessor._compute_and_strip_cached_images', note: 'Identifies image segments already covered by cached prefix tokens so their raw image work can be skipped.'},
    {line: 248, symbol: 'MultimodalProcessor.add', note: 'Queues image processing for a request, carrying the count of already cached tokens.'},
    {line: 281, symbol: 'MultimodalProcessor.fetch', note: 'Collects completed worker results and maps them back to requests.'},
  ],
  'deepinfer/ve/prepare_tensor_input_vl.py': [
    {line: 32, symbol: '_chunk_mm_metadata', note: 'Slices per-token multimodal metadata to the current prompt chunk and selects intersecting image data.'},
    {line: 78, symbol: 'prepare_input_metadata_vl', note: 'Batches image metadata for a model step; images fully covered by cache do not require vision transformer work.'},
    {line: 142, symbol: '_prepare_raw_image_transform_inputs', note: 'Builds raw image sizes and byte offsets for the aligner, or clears the fields when no raw image is needed.'},
  ],
  'deepinfer/ve/schema.py': [
    {line: 32, symbol: 'free_multi_modal_pool_handles', note: 'Frees owned image shared-memory blocks on abort or exceptional paths.'},
    {line: 53, symbol: 'defer_expiring_pool_handles', note: 'Transfers ownership of finished prefill blocks and records an event after asynchronous host-to-device copies.'},
    {line: 68, symbol: 'free_deferred_pool_handles', note: 'Synchronizes the copy event before returning deferred pinned blocks to the pool.'},
  ],
  'deepinfer/ve/processor/common.py': [
    {line: 18, symbol: 'ImageInput', note: 'Describes image dimensions and optional raw bytes in a multimodal segment.'},
    {line: 25, symbol: 'TextLengthInput', note: 'Represents text length only; actual text token IDs remain on the engine side.'},
    {line: 41, symbol: 'merge_tensor_dicts', note: 'Concatenates like-named tensor outputs in segment order while chaining image lists.'},
  ],
  'deepinfer/ve/processor/image_processor.py': [
    {line: 24, symbol: 'decode_image', note: 'Decodes image bytes for the vision preprocessing pipeline.'},
    {line: 95, symbol: 'solve_resize_ratio', note: 'Solves image scaling subject to patch geometry and token constraints.'},
    {line: 155, symbol: 'compute_image_layout', note: 'Derives resized image layout and token counts from image dimensions and processor settings.'},
    {line: 245, symbol: 'ImageProcessorAnyRes', note: 'Processes variable-size images using configured resizing, patch and downsample settings.'},
    {line: 282, symbol: 'ImageProcessorAnyRes.process', note: 'Produces image layout metadata and a deferred image loader; decoding and resizing are performed when the loader runs.'},
  ],
  'deepinfer/ve/processor/mm_processor.py': [
    {line: 10, symbol: 'MMProcessor', note: 'Dispatches segment types to the corresponding text or image processor.'},
    {line: 23, symbol: 'MMProcessor.convert_segments_to_tensor_dict', note: 'Processes segments in order and seeds an empty token-type tensor so empty or fully cached inputs keep a stable key.'},
  ],
  'deepinfer/ve/processor/text_processor.py': [
    {line: 10, symbol: 'TextTokenProcessor', note: 'Produces zero-valued multimodal token types for the supplied text length; it does not generate the text token IDs.'},
  ],
  'deepinfer/__init__.py': [
    {line: 9, symbol: '_so_platform_tag', note: 'Determines the platform tag used to locate the native extension shared library.'},
    {line: 53, symbol: '__getattr__', note: 'Lazily initializes PLATFORM after visible device configuration; other missing attributes raise AttributeError.'},
  ],
  'deepinfer/attrdict.py': [
    {line: 12, symbol: 'merge', note: 'Recursively merges mappings to construct combined configuration values.'},
    {line: 30, symbol: 'AttrDict', note: 'Wraps nested mappings to support both attribute and dictionary access in model configuration.'},
  ],
  'deepinfer/config.py': [
    {line: 19, symbol: 'ModelConfig', note: 'Loads model configuration and validates runtime model settings.'},
    {line: 125, symbol: 'CacheConfig', note: 'Stores and validates cache and memory sizing configuration.'},
    {line: 150, symbol: 'ParallelConfig', note: 'Stores and validates the requested process parallelism.'},
    {line: 185, symbol: 'SchedulerConfig', note: 'Defines sequence and token limits used by scheduler and worker preparation.'},
  ],
  'deepinfer/environ.py': [
    {line: 31, symbol: 'EnvVar', note: 'Descriptor for typed environment settings that caches its parsed value.'},
    {line: 97, symbol: 'envs', note: 'Centralizes feature switches, cache settings and other environment-controlled runtime options.'},
    {line: 213, symbol: 'rearm', note: 'Clears the cached value of a named environment descriptor so it can be read again.'},
  ],
  'deepinfer/load_class.py': [
    {line: 4, symbol: 'load_class_from_file', note: 'Loads a named Python class from a supplied file path.'},
  ],
  'deepinfer/logger.py': [
    {line: 33, symbol: 'NewLineFormatter', note: 'Formats multiline log records consistently.'},
    {line: 96, symbol: 'init_logger', note: 'Initializes and returns a named logger using DeepInfer logging setup.'},
    {line: 121, symbol: 'install_excepthook', note: 'Installs exception hooks that print a crash header, with optional process exit on thread exceptions.'},
  ],
  'deepinfer/model_config_loader.py': [
    {line: 8, symbol: 'load_model_config', note: 'Loads the runtime model configuration from the supplied model path through the HF integration.'},
  ],
  'deepinfer/multimodal_tokens.py': [
    {line: 17, symbol: 'ImageTokenOffset', note: 'Defines offsets used to represent image-related token types.'},
    {line: 31, symbol: 'TokenType', note: 'Enumerates text/image token categories used when building and replacing multimodal embeddings.'},
  ],
  'deepinfer/platform.py': [
    {line: 55, symbol: 'PlatformGPU', note: 'Provides GPU-specific host-memory registration and distributed configuration.'},
    {line: 86, symbol: 'PlatformNPU', note: 'Provides the NPU-specific device, memory registration and distributed setup branch.'},
    {line: 223, symbol: 'get_platform', note: 'Selects the runtime platform based on available device support; platform branches do not establish feature parity.'},
  ],
  'deepinfer/sampling_params.py': [
    {line: 13, symbol: 'SamplingParams', note: 'Stores request sampling choices such as temperature, top-p, top-k, output limits and optional structured output.'},
    {line: 93, symbol: 'SamplingParams._verify_args', note: 'Checks the supplied sampling arguments before request execution.'},
  ],
  'deepinfer/sequence.py': [
    {line: 39, symbol: 'DeepInferTopkInfo', note: 'Carries optional top-token and probability information through sampling.'},
    {line: 77, symbol: 'MTPPredictInfo', note: 'Carries speculative token predictions and confidence information.'},
    {line: 114, symbol: 'SampledInfo', note: 'Groups sampled token IDs and associated optional probabilities for a batch.'},
    {line: 172, symbol: 'SamplerOutput', note: 'Exposes main and speculative sampled outputs to worker and engine post-processing.'},
  ],
  'deepinfer/shared_memory.py': [
    {line: 24, symbol: 'SharedMemory', note: 'Wraps a named shared-memory mapping with close, unlink and process-transfer support.'},
    {line: 80, symbol: 'SharedTorchMemoryPool', note: 'Manages a shared tensor-backed memory pool with aligned allocation and free-list metadata.'},
    {line: 167, symbol: 'SharedTorchMemoryPool.alloc', note: 'Allocates a block and returns a handle that can be passed between processes.'},
    {line: 217, symbol: 'SharedTorchMemoryPool.free', note: 'Returns a block to the pool and updates its free-list bookkeeping.'},
    {line: 360, symbol: 'get_multi_modal_pool', note: 'Returns the process’s configured shared pool for multimodal data, if present.'},
  ],
  'deepinfer/testing.py': [
    {line: 4, symbol: 'cal_diff', note: 'Computes numerical difference statistics for two tensors.'},
    {line: 15, symbol: 'assert_close', note: 'Checks a tensor comparison against the specified tolerance and reports the named comparison.'},
  ],
  'deepinfer/timer.py': [
    {line: 48, symbol: 'CPUTimer', note: 'Records host elapsed time in named timer buckets.'},
    {line: 78, symbol: 'CUDAGraphTimer', note: 'Binds timing events to captured graph nodes so graph replay can be measured.'},
    {line: 223, symbol: 'CUDATimer', note: 'Uses device events to record and flush named GPU timing measurements.'},
  ],
  'deepinfer/utils.py': [
    {line: 52, symbol: 'CudaIPCWrapper', note: 'Exports and reconstructs a CUDA tensor through the native IPC helpers.'},
    {line: 119, symbol: 'forbid_cuda_sync', note: 'Creates a scoped guard for detecting unwanted CUDA synchronization.'},
    {line: 135, symbol: 'allow_cuda_sync', note: 'Temporarily permits synchronization inside the debug guard.'},
    {line: 198, symbol: 'batch_tensor_dict_list', note: 'Batches tensor dictionaries used in runtime input preparation.'},
    {line: 222, symbol: 'get_distributed_init_method', note: 'Constructs the distributed initialization address, including IPv6 handling.'},
  ],
};
