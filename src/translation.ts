import translation from './article-translation.txt?raw';

// Line numbers refer to the unedited, user-supplied translation. They let the
// guide attach commentary without changing the underlying text.
export const translationLines = translation.split('\n');
export const translationSections = [
  { id: 'goals', label: 'Introduction', start: 1 },
  { id: 'system', label: 'Overview of Reasoning System Design', start: 11 },
  { id: 'recipe', label: 'DeepSeek Recipe', start: 26 },
  { id: 'balancing', label: 'Load balancing', start: 40 },
  { id: 'cache', label: 'KVCache Storage', start: 61 },
  { id: 'replay', label: 'SWA Bounded Replay', start: 79 },
  { id: 'speculation', label: 'DSpark Speculative Decoding', start: 84 },
  { id: 'async', label: 'Asynchronous Scheduling', start: 88 },
  { id: 'structured', label: 'Structured output', start: 91 },
  { id: 'references', label: 'References', start: 97 },
];

export function translationSectionLines(id: string) {
  const index = translationSections.findIndex(section => section.id === id);
  if (index < 0) return [];
  const start = translationSections[index].start;
  const end = translationSections[index + 1]?.start ?? translationLines.length + 1;
  return translationLines.slice(start - 1, end - 1).map((text, offset) => ({ line: start + offset, text }));
}

export const translationHeadings = new Set([11, 26, 40, 61, 79, 84, 88, 91, 97]);
export const translationSubheadings = new Set([23, 24, 27, 30, 36, 42, 48, 50, 52, 56, 65, 69, 72, 74]);

export const translationAnnotations: Record<number, string[]> = {
  3: ['three-goals'], 8: ['economics'], 10: ['release-boundary'],
  15: ['epd'], 16: ['independent-load-balancers'], 22: ['parallelism'],
  23: ['production-table'], 24: ['prefill-pareto', 'decode-pareto'],
  28: ['protocol-adaptation'], 33: ['special-tokens'], 38: ['streaming-parser'],
  47: ['prefill-balancing'], 49: ['decode-balancing'], 51: ['vision-balancing'],
  55: ['expert-balancing'], 60: ['autoscaling'], 64: ['cache-tiers'],
  67: ['cache-sizing'], 68: ['cache-fetch'], 71: ['swa-layout'], 78: ['3fs-resilience'],
  80: ['why-replay'], 81: ['approximate-replay'], 82: ['encoder-replay'], 83: ['decoder-replay'],
  85: ['draft'], 86: ['verification-budget'], 87: ['async-confidence'],
  90: ['zos-pipeline'], 96: ['grammar'], 103: ['article-references'],
};

export const translationHighlights: Record<number, string[]> = {
  8: ['155 trillion tokens/day', '$38 per card per hour'],
  10: ['not yet fully open source'],
  20: ['EP2～8/DP2～8'], 21: ['EP64~128/DP64~128'],
  67: ['100 PiB of SSD storage', '3 days', '7 days'],
  73: ['L - 134', 'L1 - 128'],
  81: ['recalculating only the most recent 128 tokens'],
  86: ['variable-length validation', 'improves throughput by 6%'],
  90: ['asynchronous scheduling between the GPU and the CPU'],
  92: ['strictly conform to a specified format'],
};

export const translationDiagrams: Record<number, string> = {
  18: 'system', 68: 'cache', 81: 'replay', 86: 'speculation', 90: 'async',
};
