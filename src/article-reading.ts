/** Editorial context for the source-linked deployment reading. This is original
 * explanatory prose, not a transcription of the linked translation. */
export interface ReadingSection {
  opening: string[];
  claim: { annotationId: string; text: string };
}

export const articleReading: Record<string, ReadingSection> = {
  goals: {
    opening: [
      'Serving a model at scale is a systems problem as much as a model problem. A useful deployment must turn diverse requests into tokens quickly, keep expensive accelerators busy, and avoid repeating work when a conversation or agent returns to the same context.',
      'DeepSeek describes a production system built around those pressures. The numbers below are the company’s reports about that system; they should be read separately from the offline examples in the public repository.'
    ],
    claim: { annotationId: 'release-boundary', text: 'The open release contains the inference engine, but the article describes a larger production service.' },
  },
  system: {
    opening: [
      'A multimodal request can use three kinds of work: a vision encoder turns images into representations, prefill processes the prompt, and decode generates the continuation. These stages have different resource needs, so DeepSeek places them on separately managed resources.',
      'The resulting design must still transfer intermediate state and decide where each piece of work runs. Disaggregation creates new scheduling and communication problems even as it allows the stages to scale independently.'
    ],
    claim: { annotationId: 'epd', text: 'Vision encoding, prefill and decode are separated so their resources can be managed independently.' },
  },
  recipe: {
    opening: [
      'Before a model can process a request, a conversation expressed in an API protocol has to become a model-specific prompt and token sequence. After generation, the process runs in reverse: a stream of model tokens becomes text, reasoning events, or tool calls in the caller’s protocol.',
      'DeepSeek describes this boundary as a separate project, DeepSeek Recipe. Its parsing and encoding choices affect both security and latency, especially when a prompt is long or output arrives incrementally.'
    ],
    claim: { annotationId: 'special-tokens', text: 'Only explicitly inserted control tokens receive control-token identities; lookalike text remains content.' },
  },
  balancing: {
    opening: [
      'Splitting a fleet into specialized stages is only useful if work is distributed well within each stage. Request length, attention state, image size and expert popularity create different kinds of imbalance, so DeepSeek describes several distinct balancing decisions.',
      'The external replica routers and the expert balancer solve related but different problems. The latter can be inspected in the released engine; the production-level routing and scaling services are described in the accompanying material.'
    ],
    claim: { annotationId: 'expert-balancing', text: 'Request placement and expert placement are separate balancing problems.' },
  },
  cache: {
    opening: [
      'A cache lets a later request reuse attention state for a prefix that has already been processed. For agent conversations, the same history may recur many times; the benefit depends on how long useful prefixes remain available and how cheaply they can be retrieved.',
      'DeepSeek distinguishes the longer-lived paged block cache from shorter-lived sliding-window attention state. Their lifetimes and recovery costs differ, so the production system stores and serves them differently.'
    ],
    claim: { annotationId: 'cache-tiers', text: 'Long-lived block KV and short-lived sliding-window state use different storage paths.' },
  },
  replay: {
    opening: [
      'A missing cache entry need not force an engine to recompute an entire conversation. The harder question is which state can be reconstructed cheaply enough to make persistent storage unnecessary.',
      'The bounded replay described here trades some exactness for a fixed amount of reconstruction work. That makes the boundary between an implementation optimization and a model-quality assumption especially important.'
    ],
    claim: { annotationId: 'approximate-replay', text: 'Bounded replay reconstructs a limited suffix, producing an approximation rather than an exact recovery.' },
  },
  speculation: {
    opening: [
      'Autoregressive decoding normally advances one token at a time. Speculative decoding asks a smaller draft model to propose multiple future tokens, then lets the target model verify them; the benefit depends on how many proposals survive and what verification costs on the hardware.',
      'DeepSeek’s DSpark work adds a second decision: how much of each proposed draft should receive verification compute. A uniform length can waste work where the draft is unlikely to be accepted.'
    ],
    claim: { annotationId: 'verification-budget', text: 'Verification budget can be distributed according to expected acceptance and the hardware’s throughput curve.' },
  },
  async: {
    opening: [
      'Even a fast kernel cannot use a GPU while the host is waiting to decide what comes next. A decode iteration includes CPU scheduling and post-processing as well as device execution and sampling.',
      'The engine pipelines work from adjacent steps so the CPU can prepare future work while the GPU executes the current step. The resulting dependencies still matter: data produced by a running step may not be available to the next CPU scheduling decision.'
    ],
    claim: { annotationId: 'zos-pipeline', text: 'Overlapping adjacent CPU and GPU work aims to reduce idle gaps between decode steps.' },
  },
  structured: {
    opening: [
      'Some applications need output that follows a particular grammar, such as JSON with a specified schema. Asking for that format in a prompt alone does not guarantee that every generated token preserves the constraint.',
      'A constrained decoder can compile the requested format and consult it during generation. The constraint controls syntax; application code still needs to decide whether the resulting values are meaningful.'
    ],
    claim: { annotationId: 'grammar', text: 'A grammar matcher can mask illegal next tokens before the sampler chooses among the remaining ones.' },
  },
  references: {
    opening: [
      'The deployment write-up sits within a larger research lineage. Its references connect the production design to disaggregated inference, distributed storage, model architecture, speculative decoding and overlapping execution.',
      'A cited paper is useful context, but its complete design should not automatically be attributed to DeepInfer. Follow the links to see the specific mechanism being compared and the implementation evidence available in the release.'
    ],
    claim: { annotationId: 'article-references', text: 'Research comparisons explain the design space; they do not imply that every cited technique ships in this release.' },
  },
};

export const additionalArticleClaims: Record<string, string> = {
  economics: 'DeepSeek reports 155 trillion tokens per day and $38 in revenue per GPU-hour for one cluster at off-peak pricing.',
  'production-table': 'The reported production figures include a 96% input cache-hit rate and 400 ms mean time to first token.',
  'prefill-balancing': 'Prefill requests are grouped by context length and scheduled against a fitted compute-time budget.',
  'cache-sizing': 'DeepSeek reports roughly 100 PiB of SSD cache capacity, with three-day agent and seven-day chatbot retention.',
};
