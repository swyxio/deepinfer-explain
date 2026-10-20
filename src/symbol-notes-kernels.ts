// Source-anchored native and accelerator notes at DeepInfer 774ce24.
export const kernelSymbolNotes: Record<string, {line: number; symbol: string; note: string}[]> = {
  "csrc/asc_utils.cpp": [
    {
      "line": 32,
      "symbol": "import_ipc_tensor",
      "note": "Imports an NPU IPC handle as a tensor and requests peer access; the deleter closes the imported handle."
    },
    {
      "line": 56,
      "symbol": "export_ipc_tensor",
      "note": "Exports device allocation metadata and an IPC handle for transfer to another process."
    }
  ],
  "csrc/cuda_utils.cpp": [
    {
      "line": 34,
      "symbol": "import_ipc_tensor",
      "note": "Opens a CUDA IPC memory handle and wraps the imported pointer in a device tensor whose deleter closes it."
    },
    {
      "line": 54,
      "symbol": "export_ipc_tensor",
      "note": "Serializes a CUDA IPC handle and allocation size so another process can import the device memory."
    }
  ],
  "csrc/cuda_utils.hpp": [
    {
      "line": 39,
      "symbol": "make_from_blob",
      "note": "Selects backend-specific tensor wrapping for a raw device pointer; the NPU path avoids dtype problems with generic from_blob."
    }
  ],
  "csrc/engine/block_manager.hpp": [
    {
      "line": 27,
      "symbol": "Blocks",
      "note": "Maintains the free-list and per-block reference counts; block zero is reserved as an empty sentinel."
    },
    {
      "line": 119,
      "symbol": "BlockManager",
      "note": "Wraps block allocation and reference management with synchronization for the scheduler."
    }
  ],
  "csrc/engine/flops_estimator.hpp": [
    {
      "line": 28,
      "symbol": "FlopsEstimator",
      "note": "Estimates target-model FP8-equivalent work; draft, padding, vision, and small arithmetic are outside this estimate."
    },
    {
      "line": 39,
      "symbol": "calc_flops",
      "note": "Computes attention and total model work for a scheduled query/key shape, with phase and YoCo parameters."
    }
  ],
  "csrc/engine/input_metadata/block_load_plan.cpp": [
    {
      "line": 23,
      "symbol": "append_paged_range",
      "note": "Splits a token interval into segments over its paged block table."
    },
    {
      "line": 37,
      "symbol": "append_ring_range",
      "note": "Splits a token interval around a circular block boundary."
    }
  ],
  "csrc/engine/input_metadata/block_load_plan.hpp": [
    {
      "line": 19,
      "symbol": "BlockLoadPlanBuilder",
      "note": "Collects cache-load segments and zero-fill segments into a host-side plan."
    }
  ],
  "csrc/engine/input_metadata/prepare_tensor_input.hpp": [
    {
      "line": 20,
      "symbol": "PrepareArgs",
      "note": "Packages sequence metadata, phase, parallelism and V4 settings for native tensor preparation."
    }
  ],
  "csrc/engine/input_metadata/prepare_tensor_input_base.cpp": [
    {
      "line": 65,
      "symbol": "prepare_common_base",
      "note": "Builds common pinned-host positions and sequence-level input tensors shared by prefill and decode."
    },
    {
      "line": 142,
      "symbol": "prepare_prompt_base",
      "note": "Adds prompt-specific tensors on top of the shared metadata preparation."
    },
    {
      "line": 160,
      "symbol": "prepare_decode_base",
      "note": "Adds decode-specific tensors on top of the shared metadata preparation."
    }
  ],
  "csrc/engine/input_metadata/prepare_tensor_input_v4.cpp": [
    {
      "line": 26,
      "symbol": "update_common_v4",
      "note": "Adds compressed-attention position and slot metadata derived from the scheduled sequences."
    },
    {
      "line": 203,
      "symbol": "fill_yoco_truncation_metadata",
      "note": "Constructs metadata for the configured YoCo prefill truncation and consumer visibility."
    },
    {
      "line": 391,
      "symbol": "prepare_prompt_v4",
      "note": "Builds base prompt inputs and V4-specific attention, compression and optional YoCo metadata."
    },
    {
      "line": 562,
      "symbol": "prepare_decode_v4",
      "note": "Builds decode tensors and V4 attention/cache metadata for the scheduled batch."
    }
  ],
  "csrc/engine/mtp_varlen.hpp": [
    {
      "line": 20,
      "symbol": "SamplerRuntimeEstimator",
      "note": "Uses a sliding window of timing samples to estimate sampling runtime from a median."
    },
    {
      "line": 48,
      "symbol": "ForwardRuntimeEstimator",
      "note": "Tracks normalized forward-time residuals by graph size to adjust its latency estimate."
    },
    {
      "line": 133,
      "symbol": "MTPVarlen",
      "note": "Selects a variable speculative-query budget using performance and acceptance estimates, with a fixed-length fallback when no curve is available."
    }
  ],
  "csrc/engine/outputs.hpp": [
    {
      "line": 18,
      "symbol": "RequestOutput",
      "note": "Stores a generated token, request state, log probabilities and optional prompt log-probability data."
    },
    {
      "line": 45,
      "symbol": "RequestOutputPool",
      "note": "Reuses native output allocations; consumers must respect the pool's release lifetime."
    }
  ],
  "csrc/engine/prepare_sample.cpp": [
    {
      "line": 40,
      "symbol": "prepare_sampler_inputs",
      "note": "Builds flattened sampling and prompt-logprob inputs from scheduled sequence metadata, with pinned host buffers and device copies."
    }
  ],
  "csrc/engine/prepare_sample.hpp": [
    {
      "line": 58,
      "symbol": "SamplerInputs",
      "note": "Defines grouped prompt, decode, driver and kernel sampling input structures shared with Python bindings."
    }
  ],
  "csrc/engine/process_output.hpp": [
    {
      "line": 9,
      "symbol": "update_prompt_logprobs",
      "note": "Reconstructs per-request prompt log probabilities while preserving requests that did not request them."
    }
  ],
  "csrc/engine/pybind.cpp": [
    {
      "line": 5,
      "symbol": "pymodule_init",
      "note": "Calls the separate sequence, scheduler and output binding initializers."
    }
  ],
  "csrc/engine/pybind.hpp": [
    {
      "line": 11,
      "symbol": "pybind_engine_scheduler",
      "note": "Declares the scheduler binding initializer alongside the output and sequence initializers."
    }
  ],
  "csrc/engine/pybind_output.cpp": [
    {
      "line": 9,
      "symbol": "pybind_engine_output",
      "note": "Registers request outputs, pooling, preparation structures and native output-related helpers in Python."
    }
  ],
  "csrc/engine/pybind_scheduler.cpp": [
    {
      "line": 10,
      "symbol": "pybind_engine_scheduler",
      "note": "Exposes native scheduler, block manager, sequence metadata and FLOPs estimator to Python."
    }
  ],
  "csrc/engine/pybind_sequence.cpp": [
    {
      "line": 50,
      "symbol": "pybind_engine_sequence",
      "note": "Binds native sequence construction, status and data properties to Python."
    }
  ],
  "csrc/engine/scheduler.hpp": [
    {
      "line": 79,
      "symbol": "Scheduler",
      "note": "Owns waiting/running request queues, cache allocation and distributed scheduling decisions."
    },
    {
      "line": 275,
      "symbol": "_schedule",
      "note": "Chooses the phase by engine type and coordinates NORMAL-mode prefill/decode decisions across ranks."
    },
    {
      "line": 351,
      "symbol": "_schedule_prefill",
      "note": "Admits prompt chunks subject to sequence, token and block limits, returning no prompt work when a NORMAL rank cannot schedule."
    },
    {
      "line": 559,
      "symbol": "_schedule_decode",
      "note": "Admits running sequences, preempts under block pressure and requests query lengths from variable-length MTP scheduling."
    },
    {
      "line": 766,
      "symbol": "_preempt",
      "note": "Stops structured-output or configured requests; otherwise resets their cache state and returns them to the waiting queue for recomputation."
    },
    {
      "line": 872,
      "symbol": "process_outputs",
      "note": "Applies sampled outputs and draft acceptance to scheduled sequence state and creates pooled request results."
    }
  ],
  "csrc/engine/sequence.hpp": [
    {
      "line": 30,
      "symbol": "SequenceStatus",
      "note": "Defines waiting, running and terminal statuses used by native scheduler decisions."
    },
    {
      "line": 118,
      "symbol": "MtpState",
      "note": "Tracks draft-token and multi-token prediction state belonging to a sequence."
    },
    {
      "line": 200,
      "symbol": "KvCacheState",
      "note": "Holds cache blocks, token counts and state identifiers for a request."
    },
    {
      "line": 275,
      "symbol": "Sequence",
      "note": "Combines request, input, cache, schedule, generation and structured-output state."
    },
    {
      "line": 325,
      "symbol": "SequenceMetadata",
      "note": "Provides the step-specific sequence view passed from scheduling into metadata and sampling preparation."
    }
  ],
  "csrc/engine/utils.hpp": [
    {
      "line": 27,
      "symbol": "sprint_vars_impl",
      "note": "Formats named variables for native diagnostic messages."
    }
  ],
  "csrc/engine/zos.cpp": [
    {
      "line": 31,
      "symbol": "prepare_token_inputs",
      "note": "Creates host token inputs, distinguishing fresh rows from rows reused from prior device output when batches overlap."
    },
    {
      "line": 142,
      "symbol": "prepare_zos_inputs",
      "note": "Builds remapping and related inputs for overlapped scheduling across consecutive batches."
    },
    {
      "line": 198,
      "symbol": "prepare_decode_zos_inputs",
      "note": "Prepares decode-side metadata and device-transfer inputs for ZOS."
    }
  ],
  "csrc/engine/zos.hpp": [
    {
      "line": 20,
      "symbol": "prepare_zos_inputs",
      "note": "Declares host preparation for the overlap path and its optional tensors."
    }
  ],
  "csrc/graph_timer/graph_timer.hpp": [
    {
      "line": 15,
      "symbol": "GraphHandle",
      "note": "Represents a captured graph and exposes its event-record nodes."
    },
    {
      "line": 33,
      "symbol": "EventHandle",
      "note": "Declares event recording, synchronization, query and elapsed-time operations."
    }
  ],
  "csrc/graph_timer/graph_timer_asc.cpp": [
    {
      "line": 9,
      "symbol": "EventHandle::record",
      "note": "The Ascend implementation currently throws because NPU graph-timer primitives are not implemented."
    }
  ],
  "csrc/graph_timer/graph_timer_cuda.cpp": [
    {
      "line": 19,
      "symbol": "EventHandle::record",
      "note": "Records a CUDA event on the specified stream, including the capture-external option."
    },
    {
      "line": 67,
      "symbol": "GraphHandle::get_event_record_nodes",
      "note": "Inspects the captured CUDA graph and returns handles to event-record nodes."
    }
  ],
  "csrc/graph_timer/pybind.cpp": [
    {
      "line": 5,
      "symbol": "pymodule_init",
      "note": "Exposes graph, event and graph event-record-node handles to Python."
    }
  ],
  "csrc/pybind.cpp": [
    {
      "line": 7,
      "symbol": "PYBIND11_MODULE",
      "note": "Creates the compiled extension's cuda_utils, engine, and graph_timer Python submodules."
    }
  ],
  "csrc/utils/lockable.hpp": [
    {
      "line": 13,
      "symbol": "Lockable",
      "note": "Wraps native pthread mutex operations used by shared engine structures."
    }
  ],
  "csrc/utils/log.hpp": [
    {
      "line": 47,
      "symbol": "write",
      "note": "Formats and serializes native log lines under the configured log level."
    }
  ],
  "csrc/utils/object_pool.hpp": [
    {
      "line": 17,
      "symbol": "ObjectPoolPyObject",
      "note": "Reuses native C++ objects while retaining associated Python objects in a pool."
    }
  ],
  "deepinfer/model_executor/layers/attention_backend.py": [
    {
      "line": 8,
      "symbol": "_pad_attention_heads",
      "note": "Pads attention heads to 64 or 128 for the regular FlashMLA path; larger head counts are rejected."
    },
    {
      "line": 26,
      "symbol": "prefill_attn_varlen_sparse",
      "note": "Selects fused norm/RoPE/attention/cast when arguments are supplied; otherwise pads heads and calls sparse prefill attention."
    },
    {
      "line": 77,
      "symbol": "decode_mla_mqa_sparse",
      "note": "Selects fused decode or a padded-head FlashMLA KV-cache path; optional extra cache indices extend the lookup."
    }
  ],
  "deepinfer/model_executor/layers/layernorm.py": [
    {
      "line": 14,
      "symbol": "RMSNorm",
      "note": "Provides RMS normalization in the model runtime."
    }
  ],
  "deepinfer/model_executor/layers/linear.py": [
    {
      "line": 13,
      "symbol": "get_fp8_casting_granularity",
      "note": "Determines the activation casting granularity used by linear operations."
    },
    {
      "line": 27,
      "symbol": "bf16_gemm_nt",
      "note": "Runs a BF16 matrix multiplication with transposed weights through the GEMM backend."
    },
    {
      "line": 36,
      "symbol": "ReplicatedLinear",
      "note": "Implements a linear layer whose weights are replicated across parallel ranks."
    }
  ],
  "deepinfer/model_executor/layers/mtp_info_pool.py": [
    {
      "line": 14,
      "symbol": "MTPInfoPool",
      "note": "Preallocates device buffers for draft-token, probability and optional confidence information."
    },
    {
      "line": 54,
      "symbol": "store",
      "note": "Stores the results of a multi-token prediction into the shared MTP pool."
    }
  ],
  "deepinfer/model_executor/layers/rotary_embedding.py": [
    {
      "line": 44,
      "symbol": "RotaryEmbedding",
      "note": "Builds and applies cached rotary-position embeddings."
    },
    {
      "line": 153,
      "symbol": "YaRNScalingRotaryEmbedding",
      "note": "Adjusts rotary frequencies using YaRN scaling for extended contexts."
    },
    {
      "line": 224,
      "symbol": "get_rope",
      "note": "Selects a rotary embedding implementation from configuration."
    }
  ],
  "deepinfer/model_executor/layers/sampler.py": [
    {
      "line": 59,
      "symbol": "Sampler",
      "note": "Coordinates logits processing, grammar constraints and token sampling for prefill and decode."
    },
    {
      "line": 114,
      "symbol": "Sampler.forward",
      "note": "Builds sampling inputs and selects prompt sampling or decode verification depending on metadata."
    },
    {
      "line": 302,
      "symbol": "Sampler._get_so_mask",
      "note": "Builds grammar masks, including per-step masks for candidate speculative tokens."
    },
    {
      "line": 411,
      "symbol": "Sampler._verification",
      "note": "Processes logits and draft probabilities to select accepted speculative tokens and the next output."
    }
  ],
  "deepinfer/model_executor/layers/sampler_utils.py": [
    {
      "line": 20,
      "symbol": "get_logits",
      "note": "Computes model logits from hidden states and the output head."
    },
    {
      "line": 81,
      "symbol": "compute_prompt_logprobs",
      "note": "Computes requested prompt-token log probabilities in chunks."
    },
    {
      "line": 113,
      "symbol": "process_sampling",
      "note": "Applies sampling preparation and produces token-selection outputs."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/candidate_blocks.py": [
    {
      "line": 9,
      "symbol": "candidate_block_max_tl",
      "note": "Ascend implementation: Computes per-block candidate maxima used by sparse-attention selection. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 230,
      "symbol": "get_candidate_compact_lens_tl",
      "note": "Ascend implementation: Determines candidate lengths after compaction. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 283,
      "symbol": "restore_candidate_indices_inplace_tl",
      "note": "Ascend implementation: Restores selected candidate indices to their original positions. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/compress.py": [
    {
      "line": 12,
      "symbol": "compress_and_update_state_prefill_tl",
      "note": "Ascend implementation: Compresses prefill latents and updates the state cache; query and compressed-sequence metadata control placement. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 204,
      "symbol": "compress_and_update_state_decode_tl",
      "note": "Ascend implementation: Compresses decode inputs and updates the state for the affected sequences. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/compute_seqlens_k_zos.py": [
    {
      "line": 15,
      "symbol": "compute_seqlens_k_zos_tl",
      "note": "Ascend implementation: Computes key lengths for decode metadata when steps overlap. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/dflash.py": [
    {
      "line": 14,
      "symbol": "confidence_head_fused_tl",
      "note": "Ascend implementation: Computes the DFlash confidence head used to estimate draft acceptance. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 103,
      "symbol": "dflash_input_store_tl",
      "note": "Ascend implementation: Stores DFlash input data for the subsequent draft-model step. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/dflash_copy.py": [
    {
      "line": 15,
      "symbol": "copy_dflash_decode_input_tl",
      "note": "Ascend implementation: Copies DFlash decode inputs into the preallocated destination buffers. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/flash_mla_utils.py": [
    {
      "line": 14,
      "symbol": "convert_kv_index_tl",
      "note": "Ascend implementation: Converts KV indices into the layout consumed by FlashMLA. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/fused_sample.py": [
    {
      "line": 83,
      "symbol": "fused_sample_tl",
      "note": "Ascend implementation: Applies sampling transformations and samples from the resulting token distribution. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/fused_transform.py": [
    {
      "line": 739,
      "symbol": "fused_norm_rope_hadamard_cast_store_kvcache_tl",
      "note": "Ascend implementation: Fuses configured normalization, rotary embedding, Hadamard transform, casting and cache-store operations; arguments choose which outputs are active."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/gather.py": [
    {
      "line": 16,
      "symbol": "gather_tl",
      "note": "Ascend implementation: Gathers selected rows; the shared interface handles invalid indices and output allocation. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/gather_engram_tokens_zos.py": [
    {
      "line": 29,
      "symbol": "gather_engram_tokens_zos_tl",
      "note": "Ascend implementation: Gathers Engram token windows using the overlap-path input mapping. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/gather_input_ids_zos.py": [
    {
      "line": 15,
      "symbol": "gather_input_ids_zos_tl",
      "note": "Ascend implementation: Gathers fresh or previously produced input IDs for an overlapping decode batch. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/get_kv_index.py": [
    {
      "line": 7,
      "symbol": "load_kv_index_tl",
      "note": "Ascend implementation: Expands offset/length pairs into contiguous, paged, or ring-buffer indices; unused columns become -1. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 115,
      "symbol": "get_fused_dflash_get_input_tl",
      "note": "Ascend implementation: Constructs per-request DFlash input positions and cache indices, handling padding requests. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/image_embed_ops.py": [
    {
      "line": 16,
      "symbol": "replace_input_embeds_tl",
      "note": "Ascend implementation: Replaces selected text-embedding rows with image features. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 146,
      "symbol": "rgb_pad_to_patches_tl",
      "note": "Ascend implementation: Pads RGB image data into the patch layout consumed by vision encoding. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 250,
      "symbol": "batch_downsample_tl",
      "note": "Ascend implementation: Downsamples batches of vision features. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/kv_index_cat.py": [
    {
      "line": 9,
      "symbol": "kv_index_cat_tl",
      "note": "Ascend implementation: Concatenates cache index tensors for attention. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/kv_quant.py": [
    {
      "line": 32,
      "symbol": "build_reciprocal_table",
      "note": "Ascend implementation: Builds an Ascend vector-register lookup table for reciprocal scale calculation."
    },
    {
      "line": 48,
      "symbol": "make_kv_scale_impl",
      "note": "Ascend implementation: Builds FP4/FP8 KV scale encoding and inverse-scale operations, with an optional reciprocal lookup table."
    },
    {
      "line": 97,
      "symbol": "make_kv_quant_impl",
      "note": "Ascend implementation: Builds Ascend register-only KV quantization operations for the selected format."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/load_paged_kv_cache.py": [
    {
      "line": 17,
      "symbol": "load_paged_kv_cache_tl",
      "note": "Ascend implementation: Loads cache entries using paged segment metadata. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/norm.py": [
    {
      "line": 54,
      "symbol": "norm_tl",
      "note": "Ascend implementation: Normalizes inputs with the selected output format and optional scale handling. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/prepare_cp_mirror.py": [
    {
      "line": 15,
      "symbol": "prepare_cp_mirror_tl",
      "note": "Ascend implementation: Prepares mirrored context-parallel positions and index metadata. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 337,
      "symbol": "yoco_cp_boundary_fused_tl",
      "note": "Ascend implementation: Builds data needed for the YoCo compaction boundary under context parallelism. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/prepare_v4_decode_metadata.py": [
    {
      "line": 15,
      "symbol": "copy_block_tables_tl",
      "note": "Ascend implementation: Copies the selected block-table metadata into decode buffers. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 78,
      "symbol": "prepare_v4_decode_metadata_tl",
      "note": "Ascend implementation: Constructs V4 decode metadata, including compact block-table information. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/random_sampling.py": [
    {
      "line": 183,
      "symbol": "random_sampling_tl",
      "note": "Ascend implementation: Draws a token from each probability row using a seed and position so results are independent of batch order. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/rstd_1ulp.py": [
    {
      "line": 16,
      "symbol": "split_fp32",
      "note": "Ascend implementation: Splits a floating-point constant into high and low FP32 components for compensated computation."
    },
    {
      "line": 30,
      "symbol": "compensated_rsqrt",
      "note": "Ascend implementation: Refines a reciprocal-square-root estimate against high and low input components."
    },
    {
      "line": 77,
      "symbol": "make_rstd_impl",
      "note": "Ascend implementation: Constructs compensated reciprocal standard deviation for the supplied hidden size and epsilon."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/sampler.py": [
    {
      "line": 17,
      "symbol": "prepare_verification_metadata_tl",
      "note": "Ascend implementation: Maps speculative-token rows to request and verification positions. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 81,
      "symbol": "expand_sampling_params_tl",
      "note": "Ascend implementation: Expands per-request sampling parameters across speculative-token rows. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 124,
      "symbol": "map_lookup_tl",
      "note": "Ascend implementation: Looks up values using the request-to-row mapping. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 206,
      "symbol": "remap_draft_topk_tl",
      "note": "Ascend implementation: Remaps draft top-k data into the layout used for verification. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 321,
      "symbol": "get_accept_result_tl",
      "note": "Ascend implementation: Determines which speculative-token positions are accepted. The factory queries the Ascend vector-core count for its launch."
    },
    {
      "line": 379,
      "symbol": "finalize_verification_tl",
      "note": "Ascend implementation: Combines verification results into finalized accepted-token and output metadata. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/schedule_mtp_varlen.py": [
    {
      "line": 16,
      "symbol": "compute_seqlens_q_by_confidence_rates_tl",
      "note": "Ascend implementation: Allocates query lengths across requests using draft-confidence rates and a fixed query budget. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/state_cache.py": [
    {
      "line": 73,
      "symbol": "select_state_slice_tl",
      "note": "Ascend implementation: Selects state-cache slices for storage or movement."
    },
    {
      "line": 90,
      "symbol": "load_state_to_cache_tl",
      "note": "Ascend implementation: Loads stored state slices back into cache tensors."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/store_kv_cache.py": [
    {
      "line": 27,
      "symbol": "store_kv_cache_tl",
      "note": "Ascend implementation: Writes KV values into cache slots using the supplied mappings. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/store_mtp_info.py": [
    {
      "line": 9,
      "symbol": "store_mtp_info_tl",
      "note": "Ascend implementation: Writes draft-token and sampling information into the MTP pool. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/structure_output.py": [
    {
      "line": 17,
      "symbol": "apply_token_bitmask_by_step_inplace_tl",
      "note": "Ascend implementation: Masks forbidden vocabulary tokens for the selected structured-output step. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/sum_smaller_probs.py": [
    {
      "line": 15,
      "symbol": "sum_smaller_probs_tl",
      "note": "Ascend implementation: Computes the inclusive probability CDF through the sampled token, with equal probabilities ordered by token index. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/asc/swa_index.py": [
    {
      "line": 12,
      "symbol": "expand_swa_index_tl",
      "note": "Ascend implementation: Expands sliding-window-attention index metadata. The factory queries the Ascend vector-core count for its launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cache_common.py": [
    {
      "line": 171,
      "symbol": "get_kv_cache_format",
      "note": "Shared interface: Selects the format used to encode KV-cache values and scale factors."
    },
    {
      "line": 190,
      "symbol": "resolve_kv_cache_layout",
      "note": "Shared interface: Resolves the storage layout and byte sizing for a KV-cache format."
    },
    {
      "line": 214,
      "symbol": "KVCacheTensors",
      "note": "Shared interface: Groups the tensor views that represent a KV cache."
    },
    {
      "line": 255,
      "symbol": "alloc_kv_cache",
      "note": "Shared interface: Allocates the cache and its views according to the selected format."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/candidate_blocks.py": [
    {
      "line": 12,
      "symbol": "candidate_block_max",
      "note": "Shared interface: Computes per-block candidate maxima used by sparse-attention selection. It selects the platform kernel through ops."
    },
    {
      "line": 77,
      "symbol": "get_candidate_compact_lens",
      "note": "Shared interface: Determines candidate lengths after compaction. It selects the platform kernel through ops."
    },
    {
      "line": 114,
      "symbol": "restore_candidate_indices_inplace",
      "note": "Shared interface: Restores selected candidate indices to their original positions. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/common.py": [
    {
      "line": 30,
      "symbol": "is_power_of_two",
      "note": "Shared interface: Tests whether an integer is a power of two for operator layout constraints."
    },
    {
      "line": 34,
      "symbol": "ceil_div",
      "note": "Shared interface: Rounds an integer division upward for tile and launch sizing."
    },
    {
      "line": 38,
      "symbol": "align",
      "note": "Shared interface: Rounds a dimension up to the requested alignment."
    },
    {
      "line": 42,
      "symbol": "customized_finfo_amax",
      "note": "Shared interface: Provides a numeric maximum used by quantized operator formats."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/compress.py": [
    {
      "line": 20,
      "symbol": "compress_and_update_state_prefill",
      "note": "Shared interface: Compresses prefill latents and updates the state cache; query and compressed-sequence metadata control placement. It selects the platform kernel through ops."
    },
    {
      "line": 74,
      "symbol": "compress_and_update_state_decode",
      "note": "Shared interface: Compresses decode inputs and updates the state for the affected sequences. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/compute_seqlens_k_zos.py": [
    {
      "line": 10,
      "symbol": "compute_seqlens_k_zos",
      "note": "Shared interface: Computes key lengths for decode metadata when steps overlap. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/conftest.py": [
    {
      "line": 74,
      "symbol": "pytest_collect_file",
      "note": "Makes operator modules available for pytest collection in this kernel-test directory."
    },
    {
      "line": 101,
      "symbol": "pytest_runtest_call",
      "note": "Handles kernel-test execution and backend-unavailable test behavior."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/candidate_blocks.py": [
    {
      "line": 16,
      "symbol": "candidate_block_max_tl",
      "note": "CUDA implementation: Computes per-block candidate maxima used by sparse-attention selection. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 135,
      "symbol": "get_candidate_compact_lens_tl",
      "note": "CUDA implementation: Determines candidate lengths after compaction. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 182,
      "symbol": "restore_candidate_indices_inplace_tl",
      "note": "CUDA implementation: Restores selected candidate indices to their original positions. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/compress.py": [
    {
      "line": 31,
      "symbol": "compress_and_update_state_prefill_tl",
      "note": "CUDA implementation: Compresses prefill latents and updates the state cache; query and compressed-sequence metadata control placement. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 187,
      "symbol": "compress_and_update_state_decode_tl",
      "note": "CUDA implementation: Compresses decode inputs and updates the state for the affected sequences. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/compute_seqlens_k_zos.py": [
    {
      "line": 15,
      "symbol": "compute_seqlens_k_zos_tl",
      "note": "CUDA implementation: Computes key lengths for decode metadata when steps overlap. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/dflash.py": [
    {
      "line": 12,
      "symbol": "confidence_head_fused_tl",
      "note": "CUDA implementation: Computes the DFlash confidence head used to estimate draft acceptance. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 82,
      "symbol": "dflash_input_store_tl",
      "note": "CUDA implementation: Stores DFlash input data for the subsequent draft-model step. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/dflash_copy.py": [
    {
      "line": 13,
      "symbol": "copy_dflash_decode_input_tl",
      "note": "CUDA implementation: Copies DFlash decode inputs into the preallocated destination buffers. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/flash_mla_utils.py": [
    {
      "line": 13,
      "symbol": "convert_kv_index_tl",
      "note": "CUDA implementation: Converts KV indices into the layout consumed by FlashMLA. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/fused_sample.py": [
    {
      "line": 19,
      "symbol": "fused_sample_tl",
      "note": "CUDA implementation: Applies sampling transformations and samples from the resulting token distribution. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/fused_transform.py": [
    {
      "line": 17,
      "symbol": "fused_norm_rope_hadamard_cast_store_kvcache_tl",
      "note": "CUDA implementation: Fuses configured normalization, rotary embedding, Hadamard transform, casting and cache-store operations; arguments choose which outputs are active. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/gather.py": [
    {
      "line": 14,
      "symbol": "gather_tl",
      "note": "CUDA implementation: Gathers selected rows; the shared interface handles invalid indices and output allocation. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/gather_engram_tokens_zos.py": [
    {
      "line": 13,
      "symbol": "gather_engram_tokens_zos_tl",
      "note": "CUDA implementation: Gathers Engram token windows using the overlap-path input mapping. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/gather_input_ids_zos.py": [
    {
      "line": 15,
      "symbol": "gather_input_ids_zos_tl",
      "note": "CUDA implementation: Gathers fresh or previously produced input IDs for an overlapping decode batch. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/get_kv_index.py": [
    {
      "line": 15,
      "symbol": "load_kv_index_tl",
      "note": "CUDA implementation: Expands offset/length pairs into contiguous, paged, or ring-buffer indices; unused columns become -1. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 77,
      "symbol": "get_fused_dflash_get_input_tl",
      "note": "CUDA implementation: Constructs per-request DFlash input positions and cache indices, handling padding requests. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/image_embed_ops.py": [
    {
      "line": 12,
      "symbol": "replace_input_embeds_tl",
      "note": "CUDA implementation: Replaces selected text-embedding rows with image features. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 65,
      "symbol": "rgb_pad_to_patches_tl",
      "note": "CUDA implementation: Pads RGB image data into the patch layout consumed by vision encoding. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 198,
      "symbol": "batch_downsample_tl",
      "note": "CUDA implementation: Downsamples batches of vision features. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/kv_index_cat.py": [
    {
      "line": 14,
      "symbol": "kv_index_cat_tl",
      "note": "CUDA implementation: Concatenates cache index tensors for attention. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/load_paged_kv_cache.py": [
    {
      "line": 14,
      "symbol": "load_paged_kv_cache_tl",
      "note": "CUDA implementation: Loads cache entries using paged segment metadata. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/norm.py": [
    {
      "line": 18,
      "symbol": "norm_tl",
      "note": "CUDA implementation: Normalizes inputs with the selected output format and optional scale handling. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/outlier_detection.py": [
    {
      "line": 9,
      "symbol": "detect_outlier_and_abort_tl",
      "note": "CUDA implementation: Checks numerical values for outliers and triggers the associated abort path. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/prepare_cp_mirror.py": [
    {
      "line": 16,
      "symbol": "prepare_cp_mirror_tl",
      "note": "CUDA implementation: Prepares mirrored context-parallel positions and index metadata. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 179,
      "symbol": "yoco_cp_boundary_fused_tl",
      "note": "CUDA implementation: Builds data needed for the YoCo compaction boundary under context parallelism. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/prepare_decode_metadata.py": [
    {
      "line": 15,
      "symbol": "prepare_v4_decode_metadata_tl",
      "note": "CUDA implementation: Constructs V4 decode metadata, including compact block-table information. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 165,
      "symbol": "copy_block_tables_tl",
      "note": "CUDA implementation: Copies the selected block-table metadata into decode buffers. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/quant.py": [
    {
      "line": 5,
      "symbol": "ue8m0_exp_scale",
      "note": "CUDA implementation: Rounds a scale to a power-of-two exponent for UE8M0 quantization."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/random_sampling.py": [
    {
      "line": 207,
      "symbol": "random_sampling_tl",
      "note": "CUDA implementation: Draws a token from each probability row using a seed and position so results are independent of batch order. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/sampler.py": [
    {
      "line": 16,
      "symbol": "prepare_verification_metadata_tl",
      "note": "CUDA implementation: Maps speculative-token rows to request and verification positions. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 52,
      "symbol": "expand_sampling_params_tl",
      "note": "CUDA implementation: Expands per-request sampling parameters across speculative-token rows. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 94,
      "symbol": "map_lookup_tl",
      "note": "CUDA implementation: Looks up values using the request-to-row mapping. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 155,
      "symbol": "remap_draft_topk_tl",
      "note": "CUDA implementation: Remaps draft top-k data into the layout used for verification. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 228,
      "symbol": "get_accept_result_tl",
      "note": "CUDA implementation: Determines which speculative-token positions are accepted. The kernel configures CUDA threads in its TileLang launch."
    },
    {
      "line": 288,
      "symbol": "finalize_verification_tl",
      "note": "CUDA implementation: Combines verification results into finalized accepted-token and output metadata. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/schedule_mtp_varlen.py": [
    {
      "line": 14,
      "symbol": "compute_seqlens_q_by_confidence_rates_tl",
      "note": "CUDA implementation: Allocates query lengths across requests using draft-confidence rates and a fixed query budget. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/state_cache.py": [
    {
      "line": 16,
      "symbol": "select_state_slice_tl",
      "note": "CUDA implementation: Selects state-cache slices for storage or movement."
    },
    {
      "line": 80,
      "symbol": "load_state_to_cache_tl",
      "note": "CUDA implementation: Loads stored state slices back into cache tensors. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/store_kv_cache.py": [
    {
      "line": 27,
      "symbol": "store_kv_cache_tl",
      "note": "CUDA implementation: Writes KV values into cache slots using the supplied mappings. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/store_mtp_info.py": [
    {
      "line": 13,
      "symbol": "store_mtp_info_tl",
      "note": "CUDA implementation: Writes draft-token and sampling information into the MTP pool. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/structure_output.py": [
    {
      "line": 18,
      "symbol": "apply_token_bitmask_by_step_inplace_tl",
      "note": "CUDA implementation: Masks forbidden vocabulary tokens for the selected structured-output step. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/sum_smaller_probs.py": [
    {
      "line": 16,
      "symbol": "sum_smaller_probs_tl",
      "note": "CUDA implementation: Computes the inclusive probability CDF through the sampled token, with equal probabilities ordered by token index. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/cuda/swa_index.py": [
    {
      "line": 8,
      "symbol": "expand_swa_index_tl",
      "note": "CUDA implementation: Expands sliding-window-attention index metadata. The kernel configures CUDA threads in its TileLang launch."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/dflash.py": [
    {
      "line": 10,
      "symbol": "confidence_head_fused",
      "note": "Shared interface: Computes the DFlash confidence head used to estimate draft acceptance. It selects the platform kernel through ops."
    },
    {
      "line": 130,
      "symbol": "dflash_input_store",
      "note": "Shared interface: Stores DFlash input data for the subsequent draft-model step. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/dflash_copy.py": [
    {
      "line": 34,
      "symbol": "copy_dflash_decode_input",
      "note": "Shared interface: Copies DFlash decode inputs into the preallocated destination buffers. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/flash_mla_utils.py": [
    {
      "line": 10,
      "symbol": "convert_kv_index",
      "note": "Shared interface: Converts KV indices into the layout consumed by FlashMLA. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/fused_sample.py": [
    {
      "line": 18,
      "symbol": "fused_sample",
      "note": "Shared interface: Applies sampling transformations and samples from the resulting token distribution. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/fused_transform.py": [
    {
      "line": 189,
      "symbol": "fused_norm_rope_hadamard_cast_store_kvcache",
      "note": "Shared interface: Fuses configured normalization, rotary embedding, Hadamard transform, casting and cache-store operations; arguments choose which outputs are active. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/gather.py": [
    {
      "line": 24,
      "symbol": "gather",
      "note": "Shared interface: Gathers selected rows; the shared interface handles invalid indices and output allocation. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/gather_engram_tokens_zos.py": [
    {
      "line": 10,
      "symbol": "gather_engram_tokens_zos",
      "note": "Shared interface: Gathers Engram token windows using the overlap-path input mapping. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/gather_input_ids_zos.py": [
    {
      "line": 10,
      "symbol": "gather_input_ids_zos",
      "note": "Shared interface: Gathers fresh or previously produced input IDs for an overlapping decode batch. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/get_kv_index.py": [
    {
      "line": 24,
      "symbol": "get_kv_ca_index_prefill",
      "note": "Shared interface: Expands compressed-attention offsets and lengths into contiguous prefill indices, padding invalid positions with -1. It selects the platform kernel through ops."
    },
    {
      "line": 60,
      "symbol": "get_kv_ca_index_decode",
      "note": "Shared interface: Resolves compressed-attention token offsets through block tables to paged decode slots. It selects the platform kernel through ops."
    },
    {
      "line": 97,
      "symbol": "get_kv_swa_index_decode",
      "note": "Shared interface: Builds sliding-window decode indices using the window and ring-buffer block size. It selects the platform kernel through ops."
    },
    {
      "line": 209,
      "symbol": "get_fused_dflash_get_input",
      "note": "Shared interface: Constructs per-request DFlash input positions and cache indices, handling padding requests. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/image_embed_ops.py": [
    {
      "line": 11,
      "symbol": "replace_input_embeds",
      "note": "Shared interface: Replaces selected text-embedding rows with image features. It selects the platform kernel through ops."
    },
    {
      "line": 43,
      "symbol": "rgb_pad_to_patches",
      "note": "Shared interface: Pads RGB image data into the patch layout consumed by vision encoding. It selects the platform kernel through ops."
    },
    {
      "line": 485,
      "symbol": "batch_downsample",
      "note": "Shared interface: Downsamples batches of vision features. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/kv_index_cat.py": [
    {
      "line": 10,
      "symbol": "kv_index_cat",
      "note": "Shared interface: Concatenates cache index tensors for attention. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/load_paged_kv_cache.py": [
    {
      "line": 28,
      "symbol": "load_paged_kv_cache",
      "note": "Shared interface: Loads cache entries using paged segment metadata. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/norm.py": [
    {
      "line": 65,
      "symbol": "norm",
      "note": "Shared interface: Normalizes inputs with the selected output format and optional scale handling. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/ops.py": [
    {
      "line": 15,
      "symbol": "backend registry",
      "note": "Imports the platform-selected CUDA or Ascend package and re-exports each public factory ending in _tl; name collisions are rejected."
    },
    {
      "line": 25,
      "symbol": "KernelUnavailableError",
      "note": "Reports a missing backend kernel factory while preserving AttributeError semantics for attribute lookup."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/outlier_detection.py": [
    {
      "line": 10,
      "symbol": "detect_outlier_and_abort",
      "note": "Shared interface: Checks numerical values for outliers and triggers the associated abort path. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/prepare_cp_mirror.py": [
    {
      "line": 11,
      "symbol": "prepare_cp_mirror",
      "note": "Shared interface: Prepares mirrored context-parallel positions and index metadata. It selects the platform kernel through ops."
    },
    {
      "line": 79,
      "symbol": "yoco_cp_boundary_fused",
      "note": "Shared interface: Builds data needed for the YoCo compaction boundary under context parallelism. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/prepare_v4_decode_metadata.py": [
    {
      "line": 10,
      "symbol": "prepare_v4_decode_metadata",
      "note": "Shared interface: Constructs V4 decode metadata, including compact block-table information. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/random_sampling.py": [
    {
      "line": 11,
      "symbol": "random_sampling",
      "note": "Shared interface: Draws a token from each probability row using a seed and position so results are independent of batch order. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/sampler.py": [
    {
      "line": 28,
      "symbol": "prepare_verification_metadata",
      "note": "Shared interface: Maps speculative-token rows to request and verification positions. It selects the platform kernel through ops."
    },
    {
      "line": 69,
      "symbol": "expand_sampling_params",
      "note": "Shared interface: Expands per-request sampling parameters across speculative-token rows. It selects the platform kernel through ops."
    },
    {
      "line": 130,
      "symbol": "map_lookup",
      "note": "Shared interface: Looks up values using the request-to-row mapping. It selects the platform kernel through ops."
    },
    {
      "line": 165,
      "symbol": "remap_draft_topk",
      "note": "Shared interface: Remaps draft top-k data into the layout used for verification. It selects the platform kernel through ops."
    },
    {
      "line": 251,
      "symbol": "get_accept_result",
      "note": "Shared interface: Determines which speculative-token positions are accepted. It selects the platform kernel through ops."
    },
    {
      "line": 403,
      "symbol": "finalize_verification",
      "note": "Shared interface: Combines verification results into finalized accepted-token and output metadata. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py": [
    {
      "line": 11,
      "symbol": "compute_seqlens_q_by_confidence_rates",
      "note": "Shared interface: Allocates query lengths across requests using draft-confidence rates and a fixed query budget. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/state_cache.py": [
    {
      "line": 12,
      "symbol": "select_state_slice",
      "note": "Shared interface: Selects state-cache slices for storage or movement. It selects the platform kernel through ops."
    },
    {
      "line": 48,
      "symbol": "load_state_to_cache",
      "note": "Shared interface: Loads stored state slices back into cache tensors. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/store_kv_cache.py": [
    {
      "line": 33,
      "symbol": "store_kv_cache",
      "note": "Shared interface: Writes KV values into cache slots using the supplied mappings. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/store_mtp_info.py": [
    {
      "line": 10,
      "symbol": "store_mtp_info",
      "note": "Shared interface: Writes draft-token and sampling information into the MTP pool. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/structure_output.py": [
    {
      "line": 12,
      "symbol": "apply_token_bitmask_by_step_inplace",
      "note": "Shared interface: Masks forbidden vocabulary tokens for the selected structured-output step. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/sum_smaller_probs.py": [
    {
      "line": 10,
      "symbol": "get_sum_smaller_probs",
      "note": "Shared interface: Computes the inclusive probability CDF through the sampled token, with equal probabilities ordered by token index. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/tilelang_ops/swa_index.py": [
    {
      "line": 10,
      "symbol": "expand_swa_index",
      "note": "Shared interface: Expands sliding-window-attention index metadata. It selects the platform kernel through ops."
    }
  ],
  "deepinfer/model_executor/layers/vocab_parallel_embedding.py": [
    {
      "line": 10,
      "symbol": "VocabParallelEmbedding",
      "note": "Implements vocabulary-sharded token embeddings."
    },
    {
      "line": 27,
      "symbol": "ParallelLMHead",
      "note": "Projects hidden states to vocabulary logits using a parallel language-model head."
    }
  ],
  "deepinfer/npu_ops/__init__.py": [
    {
      "line": 3,
      "symbol": "patch_imports",
      "note": "Registers the Ascend replacements for DeepSelect top-k and vision attention when this package is imported."
    }
  ],
  "deepinfer/npu_ops/deep_select.py": [
    {
      "line": 21,
      "symbol": "topk",
      "note": "Uses torch.topk when values are requested because NPU sampler support is unfinished; index-only selection uses the DeepSelect kernel."
    }
  ],
  "deepinfer/npu_ops/patch_imports.py": [
    {
      "line": 33,
      "symbol": "Lazy",
      "note": "Defers loading a patched import target until it is used."
    },
    {
      "line": 55,
      "symbol": "_hooked_import",
      "note": "Intercepts selected absolute from-imports and substitutes lazy targets while avoiding self-patch recursion."
    },
    {
      "line": 96,
      "symbol": "patch_imports",
      "note": "Installs the configured mappings in the import hook; it does not replace entire modules in sys.modules."
    }
  ],
  "deepinfer/npu_ops/vit_attn.py": [
    {
      "line": 9,
      "symbol": "_flash_attn_fwd",
      "note": "Uses NPU fusion attention for noncausal variable-length vision attention, with cumulative lengths for each image segment."
    }
  ]
};
