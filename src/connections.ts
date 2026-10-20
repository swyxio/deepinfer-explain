// Literature mapped to the subsystem that provides its context, not a claim
// that every file in that subsystem implements every idea in the cited work.
export const readingForModule: Record<string, string[]> = {
  'request-flow': ['pagedattention', 'sglang'],
  scheduler: ['pagedattention', 'dspark', 'dualpath', 'deployment-qa'],
  overlap: ['dspark', 'deployment-qa', 'nanoflow'],
  model: ['v41', 'v4', 'engram', 'mhc', 'qwen35'],
  attention: ['v41', 'v4', 'pagedattention', 'flashattention'],
  cache: ['v41', 'pagedattention', 'dualpath'],
  yoco: ['v41', 'yoco', 'deployment-qa'],
  moe: ['deepseek-moe', 'v3', 'deployment-qa'],
  parallelism: ['deployment-qa', 'dualpath'],
  speculation: ['dspark', 'dflash', 'v41'],
  multimodal: ['v41', 'deployment-qa'],
  sampling: ['sglang', 'dspark', 'xgrammar'],
  kernels: ['deployment-qa', 'v41', 'flashattention'],
  validation: ['deployment-qa', 'v41'],
  'service-boundary': ['deployment-qa', 'dualpath', 'distserve'],
};
