/**
 * Pure models behind the interactive mechanism figures. Each mirrors the policy described in
 * DeepInfer's deployment Q&A or implemented in the pinned source; inputs are illustrative.
 */

export const BLOCK = 128;
export const SWA_WINDOW = 128;
export const BACKTRACK = 6;

/** Deterministic PRNG so figures do not reshuffle on every render. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1_000_000) / 1_000_000; };
}

// ── 1. Prefix reuse ──────────────────────────────────────────────────────────

export type SessionInput = { system: number; perTurnInput: number; perTurnOutput: number; turns: number; persistDecode: boolean; storage: 'shared' | 'local'; machines: number; seed?: number };
export type TurnResult = { turn: number; length: number; cached: number; computed: number; machine: number };

/**
 * One agent session. Request t sends the whole history. What can hit is the longest prefix
 * already stored as full 128-token blocks, capped at L − 134 (the SWA/YOCO cap), and only if
 * the store holding it is reachable from the machine the request is routed to.
 */
export function simulateSession(input: SessionInput): { turns: TurnResult[]; hitRate: number; computed: number; total: number } {
  const random = rng(input.seed ?? 7);
  const stored = new Map<number, number>(); // machine (or 0 for shared) -> stored prefix length
  const turns: TurnResult[] = [];
  let history = input.system;
  for (let t = 0; t < input.turns; t++) {
    const length = history + input.perTurnInput;
    const machine = input.storage === 'shared' ? 0 : Math.floor(random() * input.machines);
    const reachable = stored.get(machine) ?? 0;
    const cap = Math.max(0, length - (SWA_WINDOW + BACKTRACK));
    const cached = Math.floor(Math.min(reachable, cap) / BLOCK) * BLOCK;
    turns.push({ turn: t + 1, length, cached, computed: length - cached, machine });
    // Prefill writes the prompt's KV; decode KV is written too only if enabled.
    const written = input.persistDecode ? length + input.perTurnOutput : length;
    stored.set(machine, Math.max(stored.get(machine) ?? 0, Math.floor(written / BLOCK) * BLOCK));
    history = length + input.perTurnOutput;
  }
  const total = turns.reduce((sum, t) => sum + t.length, 0);
  const computed = turns.reduce((sum, t) => sum + t.computed, 0);
  return { turns, hitRate: total ? 1 - computed / total : 0, computed, total };
}

// ── 2. SWA bounded replay ────────────────────────────────────────────────────

/** Hit policy from the Q&A: block KV fixes the hit length; a missing SWA state backs off one block. */
export function replayPlan(length: number, swaPresent: boolean) {
  const cap = Math.max(0, length - (SWA_WINDOW + BACKTRACK));
  const blockHit = Math.floor(cap / BLOCK) * BLOCK; // L1
  const hit = swaPresent || blockHit === 0 ? blockHit : blockHit - BLOCK;
  const replay = swaPresent ? 0 : Math.min(BLOCK, blockHit);
  return { cap, blockHit, hit, replay, fresh: length - hit };
}

/** Tokens an exact SWA rebuild needs at the top of a stack of `layers` sliding-window layers. */
export const exactReceptiveField = (layers: number, window = SWA_WINDOW) => layers * window;

// ── 3. Expert-parallel load balancing ────────────────────────────────────────

/** Zipf-like per-expert popularity with slow drift between steps. */
export function expertTraffic(experts: number, steps: number, skew: number, seed = 3, drift = 0.35) {
  const random = rng(seed);
  const order = Array.from({ length: experts }, (_, i) => i).sort(() => random() - 0.5);
  const base = order.map(rank => 1 / Math.pow(rank + 1, skew));
  return Array.from({ length: steps }, () => base.map(b => b * (1 - drift / 2 + drift * random())));
}

/**
 * The two greedy phases of `rebalance_experts_global` for a single layer:
 * (1) give each redundant slot to the expert whose copy most lowers the peak per-replica load,
 * (2) place replicas heaviest-first on the rank that least raises Σ_step max_rank load.
 */
export function placeExperts(history: number[][], ranks: number, redundantPerRank: number) {
  const experts = history[0].length;
  const totals = history[0].map((_, e) => history.reduce((s, step) => s + step[e], 0));
  const copies = new Array(experts).fill(1);
  const slots = Math.ceil((experts + redundantPerRank * ranks) / ranks) * ranks;
  for (let i = experts; i < slots; i++) {
    let best = 0;
    for (let e = 1; e < experts; e++) if (totals[e] / copies[e] > totals[best] / copies[best]) best = e;
    copies[best] += 1;
  }
  const replicas = copies.flatMap((c, e) => Array.from({ length: c }, () => e)).sort((a, b) => totals[b] / copies[b] - totals[a] / copies[a]);
  const capacity = slots / ranks;
  const loads = Array.from({ length: ranks }, () => new Array(history.length).fill(0));
  const peaks = new Array(history.length).fill(0);
  const occupancy = new Array(ranks).fill(0);
  const placement: number[][] = Array.from({ length: ranks }, () => []);
  for (const e of replicas) {
    let bestRank = -1, bestScore = Infinity;
    for (let r = 0; r < ranks; r++) {
      if (occupancy[r] === capacity) continue;
      let score = 0;
      for (let s = 0; s < history.length; s++) score += Math.max(peaks[s], loads[r][s] + history[s][e] / copies[e]);
      if (score < bestScore) { bestScore = score; bestRank = r; }
    }
    placement[bestRank].push(e);
    occupancy[bestRank] += 1;
    for (let s = 0; s < history.length; s++) { loads[bestRank][s] += history[s][e] / copies[e]; peaks[s] = Math.max(peaks[s], loads[bestRank][s]); }
  }
  return { placement, copies, capacity };
}

/** Naive contiguous placement: rank r owns experts [r·E/R, (r+1)·E/R). */
export function contiguousPlacement(experts: number, ranks: number) {
  const per = Math.ceil(experts / ranks);
  return { placement: Array.from({ length: ranks }, (_, r) => Array.from({ length: per }, (_, i) => r * per + i).filter(e => e < experts)), copies: new Array(experts).fill(1), capacity: per };
}

/** Per-rank load for one step; replicas split an expert's tokens evenly. */
export function rankLoads(step: number[], placement: number[][], copies: number[]) {
  const loads = placement.map(experts => experts.reduce((s, e) => s + step[e] / copies[e], 0));
  const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
  return { loads, mean, max: Math.max(...loads), lb: Math.max(...loads) / mean };
}

// ── 4. DSpark variable-length verification ───────────────────────────────────

export type DraftRequest = { id: string; confidence: number[] };

/** GPU reference: cumprod per row, rank all cells globally, every row gets 1 + cells it won. */
export function allocateVerification(requests: DraftRequest[], totalQ: number) {
  const cum = requests.map(r => { let p = 1; return r.confidence.map(c => (p *= c)); });
  const flat = cum.flatMap((row, i) => row.map((rate, j) => ({ rate, i, j, flat: i * row.length + j })));
  flat.sort((a, b) => b.rate - a.rate || a.flat - b.flat);
  const extra = Math.max(0, totalQ - requests.length);
  const rank = cum.map(row => row.map(() => 0));
  flat.forEach((cell, index) => { rank[cell.i][cell.j] = index; });
  const chosen = rank.map(row => row.map(r => r < extra));
  const lengths = chosen.map(row => 1 + row.filter(Boolean).length);
  const expected = requests.length + flat.slice(0, extra).reduce((s, c) => s + c.rate, 0);
  return { cum, rank, chosen, lengths, expected };
}

/**
 * CPU budget search from `mtp_varlen.hpp`: walk cells in confidence order, track
 * expected tokens / modeled step time, keep the best total_q. Time model is linear here.
 */
export function chooseBudget(requests: DraftRequest[], baseMs: number, msPerToken: number) {
  const n = requests.length;
  const { cum } = allocateVerification(requests, n);
  const rates = cum.flat().sort((a, b) => b - a);
  const curve: { q: number; expected: number; ms: number; throughput: number }[] = [];
  let expected = n;
  const push = (q: number) => { const ms = baseMs + msPerToken * q; curve.push({ q, expected, ms, throughput: expected / ms }); };
  push(n);
  rates.forEach((rate, i) => { expected += rate; push(n + i + 1); });
  const best = curve.reduce((a, b) => (b.throughput > a.throughput ? b : a));
  return { curve, best };
}

export function sampleDrafts(requests: DraftRequest[], lengths: number[], seed: number) {
  const random = rng(seed);
  // Accept draft j while every earlier draft was accepted; the bonus token comes from the target.
  return requests.map((r, i) => {
    let accepted = 0;
    for (let j = 0; j < lengths[i] - 1; j++) { if (random() < r.confidence[j]) accepted++; else break; }
    return accepted;
  });
}

// ── 5. CPU/GPU overlap ───────────────────────────────────────────────────────

export type Span = { lane: 'cpu' | 'gpu'; step: number; label: string; start: number; end: number };

/** Lay out `steps` decode steps either serially or with the CPU one step ahead. */
export function timeline(steps: number, cpuSchedule: number, cpuPost: number, gpu: number, overlap: boolean) {
  const spans: Span[] = [];
  if (!overlap) {
    let t = 0;
    for (let n = 0; n < steps; n++) {
      spans.push({ lane: 'cpu', step: n, label: `S${n}`, start: t, end: t += cpuSchedule });
      spans.push({ lane: 'gpu', step: n, label: `forward + sample ${n}`, start: t, end: t += gpu });
      spans.push({ lane: 'cpu', step: n, label: `P${n}`, start: t, end: t += cpuPost });
    }
    return { spans, perStep: cpuSchedule + gpu + cpuPost, end: t };
  }
  // CPU runs schedule(N+1) then post(N−1) while GPU runs step N.
  let cpuT = 0, gpuT = 0;
  const scheduled: number[] = [];
  const gpuEnd: number[] = [];
  spans.push({ lane: 'cpu', step: 0, label: 'S0', start: 0, end: (cpuT = cpuSchedule) });
  scheduled[0] = cpuT;
  for (let n = 0; n < steps; n++) {
    const start = Math.max(gpuT, scheduled[n]);
    spans.push({ lane: 'gpu', step: n, label: `forward + sample ${n}`, start, end: (gpuT = start + gpu) });
    gpuEnd[n] = gpuT;
    cpuT = Math.max(cpuT, start);
    if (n + 1 < steps) { spans.push({ lane: 'cpu', step: n + 1, label: `S${n + 1}`, start: cpuT, end: (cpuT += cpuSchedule) }); scheduled[n + 1] = cpuT; }
    if (n > 0) { const s = Math.max(cpuT, gpuEnd[n - 1]); spans.push({ lane: 'cpu', step: n - 1, label: `P${n - 1}`, start: s, end: (cpuT = s + cpuPost) }); }
  }
  const s = Math.max(cpuT, gpuEnd[steps - 1]);
  spans.push({ lane: 'cpu', step: steps - 1, label: `P${steps - 1}`, start: s, end: s + cpuPost });
  return { spans, perStep: Math.max(gpu, cpuSchedule + cpuPost), end: s + cpuPost };
}
