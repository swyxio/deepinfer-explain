export interface Reading {
  id: string;
  title: string;
  authors: string;
  year: string;
  kind: string;
  description: string;
  relevance: string;
  url: string;
}

export const readings: Reading[] = [
  {
    id: 'deployment-qa',
    title: 'DeepSeek V4.1 Flash Inference Deployment Q&A',
    authors: 'DeepSeek-AI',
    year: '2026',
    kind: 'Production notes',
    description: 'DeepSeek describes its vision, prefill and decode fleet, expert and replica load balancing, cache storage, scheduling and operational trade-offs.',
    relevance: 'The best map of the larger production service. Its distributed cache and replica load balancers are described, but are not part of this offline release; reported production figures are company claims.',
    url: 'https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md',
  },
  {
    id: 'v41',
    title: 'DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression',
    authors: 'DeepSeek-AI',
    year: '2026',
    kind: 'Model report',
    description: 'Introduces the causal encoder-decoder, CSA2, Engram, DSpark, FP4 KV cache and SWA bounded replay.',
    relevance: 'The model specification behind the runtime: its reported 890 bytes/token is the global HBM KV footprint; bounded replay reconstructs SWA states approximately.',
    url: 'https://arxiv.org/abs/2609.19969',
  },
  {
    id: 'v4',
    title: 'DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence',
    authors: 'DeepSeek-AI',
    year: '2026',
    kind: 'Model report',
    description: 'Describes the preceding V4 family and its hybrid compressed sparse and heavily compressed attention.',
    relevance: 'The natural comparison for V4.1’s cross-layer reuse, cache compression and bounded replay. V4-Flash is not listed as a supported model in this release.',
    url: 'https://arxiv.org/abs/2606.19348',
  },
  {
    id: 'v3',
    title: 'DeepSeek-V3 Technical Report',
    authors: 'DeepSeek-AI',
    year: '2024',
    kind: 'Model report',
    description: 'Presents the V3 mixture-of-experts model with multi-head latent attention, auxiliary-loss-free balancing and multi-token prediction.',
    relevance: 'A prior-generation reference for MoE and MLA, not a supported checkpoint in this release. Its jointly trained MTP differs from the later DSpark drafter.',
    url: 'https://arxiv.org/abs/2412.19437',
  },
  {
    id: 'yoco',
    title: 'You Only Cache Once: Decoder-Decoder Architectures for Language Models',
    authors: 'Yutao Sun et al.',
    year: '2024',
    kind: 'Architecture paper',
    description: 'A self-decoder builds global KV state that a cross-decoder reuses, enabling early exit during prefill.',
    relevance: 'A useful conceptual ancestor for V4.1’s causal encoder-decoder and the repository’s YOCO-named paths; V4.1 is its own architecture, not an identical implementation.',
    url: 'https://arxiv.org/abs/2405.05254',
  },
  {
    id: 'dspark',
    title: 'DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation',
    authors: 'Xin Cheng et al.',
    year: '2026',
    kind: 'Decoding paper',
    description: 'Combines mostly parallel drafting with a lightweight sequential correction and allocates verification to drafts with higher expected returns.',
    relevance: 'Explains the draft model and variable-length verification paths. Its reported live-traffic speedups compare against MTP-1 at matched throughput, not every DeepInfer deployment.',
    url: 'https://arxiv.org/abs/2607.05147',
  },
  {
    id: 'dflash',
    title: 'DFlash: Block Diffusion for Flash Speculative Decoding',
    authors: 'Jian Chen, Yesheng Liang and Zhijian Liu',
    year: '2026',
    kind: 'Decoding paper',
    description: 'Uses a lightweight block-diffusion model to draft tokens in parallel for target-model verification.',
    relevance: 'A useful alternative to DSpark’s semi-autoregressive draft head. Individual paper speedups use different models and setups and should not be compared directly.',
    url: 'https://arxiv.org/abs/2602.06036',
  },
  {
    id: 'engram',
    title: 'Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models',
    authors: 'Xin Cheng et al.',
    year: '2026',
    kind: 'Modeling paper',
    description: 'Introduces Engram, a conditional memory using token-derived n-gram lookups alongside neural computation.',
    relevance: 'Explains why V4.1 has large sparsely accessed memory tables as well as MoE experts: lookup sparsity and expert-compute sparsity are different mechanisms.',
    url: 'https://arxiv.org/abs/2601.07372',
  },
  {
    id: 'mhc',
    title: 'mHC: Manifold-Constrained Hyper-Connections',
    authors: 'Zhenda Xie et al.',
    year: '2025',
    kind: 'Modeling paper',
    description: 'Constrains residual-stream mixing to preserve an identity-mapping property and improve training stability.',
    relevance: 'The background for V4.1’s single-pass mHC and its fused runtime. The V4.1 report describes the revised variant.',
    url: 'https://arxiv.org/abs/2512.24880',
  },
  {
    id: 'deepseek-moe',
    title: 'DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models',
    authors: 'Damai Dai et al.',
    year: '2024',
    kind: 'Modeling paper',
    description: 'Explores fine-grained routed experts and shared experts to increase specialization while controlling active computation.',
    relevance: 'Background for the model’s sparse feed-forward layers and the inference engine’s expert dispatch, communication and load balancing.',
    url: 'https://arxiv.org/abs/2401.06066',
  },
  {
    id: 'dualpath',
    title: 'DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference',
    authors: 'Yongtong Wu et al.',
    year: '2026',
    kind: 'Systems paper',
    description: 'Studies KV storage I/O in disaggregated serving and introduces storage-to-decode as another cache-loading path.',
    relevance: 'The deployment Q&A references its intra-group scheduling heuristic. That reference alone does not establish that the entire DualPath design is in the release.',
    url: 'https://arxiv.org/abs/2602.21548',
  },
  {
    id: 'pagedattention',
    title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention',
    authors: 'Woosuk Kwon et al.',
    year: '2023',
    kind: 'Systems paper',
    description: 'Introduces vLLM and block-based KV memory management inspired by virtual-memory paging.',
    relevance: 'A foundation for understanding paged KV and dynamic batching. DeepInfer says it was originally built primarily on vLLM.',
    url: 'https://arxiv.org/abs/2309.06180',
  },
  {
    id: 'sglang',
    title: 'SGLang: Efficient Execution of Structured Language Model Programs',
    authors: 'Lianmin Zheng et al.',
    year: '2023',
    kind: 'Systems paper',
    description: 'Introduces a language-model programming frontend and runtime, including RadixAttention for prefix reuse and structured decoding.',
    relevance: 'An acknowledged influence on DeepInfer. Contrast cache-aware prefix reuse with the production Q&A’s shared storage and routing without prefix affinity.',
    url: 'https://arxiv.org/abs/2312.07104',
  },
  {
    id: 'tensorrt-llm',
    title: 'TensorRT-LLM',
    authors: 'NVIDIA',
    year: '2023–',
    kind: 'Runtime documentation',
    description: 'An NVIDIA inference runtime and toolkit with optimized model execution and distributed serving components.',
    relevance: 'Another acknowledged DeepInfer influence and a different hardware focus: TensorRT-LLM targets NVIDIA GPUs, while the released DeepInfer also targets Ascend 950.',
    url: 'https://github.com/NVIDIA/TensorRT-LLM',
  },
];

export interface Comparison {
  name: string;
  category: string;
  focus: string;
  design: string;
  contrast: string;
  source: string;
}

export const comparisons: Comparison[] = [
  {
    name: 'DeepInfer',
    category: 'Inference engine',
    focus: 'Specialized execution',
    design: 'Offline V4.1-Flash inference on NVIDIA SM100 and Ascend 950 with model-specific kernels, expert parallelism and DSpark.',
    contrast: 'The published engine is not the complete online service: distributed KV storage, disaggregation and replica load balancing still need integration.',
    source: 'https://github.com/deepseek-ai/DeepInfer',
  },
  {
    name: 'vLLM',
    category: 'Inference engine',
    focus: 'General serving and KV management',
    design: 'PagedAttention manages dynamically growing KV caches in blocks and shares them across requests.',
    contrast: 'DeepInfer credits vLLM as its original foundation but specializes this release around one DeepSeek model and deployment shape.',
    source: 'https://arxiv.org/abs/2309.06180',
  },
  {
    name: 'SGLang',
    category: 'Inference engine',
    focus: 'Structured programs and prefix reuse',
    design: 'Its original runtime combines RadixAttention for prefix reuse with structured decoding and a programming frontend.',
    contrast: 'The production deployment Q&A describes a shared storage cluster so any prefill engine can access a prefix, instead of routing for prefix affinity.',
    source: 'https://arxiv.org/abs/2312.07104',
  },
  {
    name: 'TensorRT-LLM',
    category: 'Inference engine',
    focus: 'NVIDIA-optimized execution',
    design: 'Provides optimized inference runtimes and model support for NVIDIA GPUs.',
    contrast: 'DeepInfer acknowledges it as an influence; the released DeepInfer also supports Huawei Ascend 950, with different platform-specific implementations.',
    source: 'https://github.com/NVIDIA/TensorRT-LLM',
  },
  {
    name: 'DeepSeek-V4.1-Flash',
    category: 'Model',
    focus: 'Input-heavy, multimodal workloads',
    design: 'A causal encoder-decoder with 552B backbone and 196B Engram parameters, activating 8B parameters per prefill token and 16B per decode token.',
    contrast: 'The model architecture is what DeepInfer executes; its report attributes lower KV use to CSA2 reuse, FP4 caching and approximate bounded replay.',
    source: 'https://arxiv.org/abs/2609.19969',
  },
  {
    name: 'DeepSeek-V4-Flash',
    category: 'Model',
    focus: 'Earlier long-context model',
    design: 'Uses hybrid compressed sparse and heavily compressed attention with DeepSeekMoE.',
    contrast: 'V4.1 adds cross-layer cache reuse and bounded replay. Its authors report roughly one-quarter the global HBM KV and one-eighth the persistent KV footprint versus V4-Flash.',
    source: 'https://arxiv.org/abs/2609.19969',
  },
  {
    name: 'DeepSeek-V3',
    category: 'Model',
    focus: 'Earlier sparse Transformer',
    design: 'Combines multi-head latent attention and DeepSeekMoE, with a multi-token prediction objective trained with the backbone.',
    contrast: 'V4.1 uses a different attention and encoder-decoder design and a separately introduced DSpark drafter. V3 is not listed as supported by this release.',
    source: 'https://arxiv.org/abs/2412.19437',
  },
  {
    name: 'YOCO',
    category: 'Research architecture',
    focus: 'Cross-layer cache reuse',
    design: 'A self-decoder computes global KV once for a cross-decoder to reuse, permitting prefill early exit.',
    contrast: 'It is a conceptual point of comparison for V4.1’s causal encoder-decoder; V4.1 adds its own compressed attention and sliding-window replay.',
    source: 'https://arxiv.org/abs/2405.05254',
  },
];
