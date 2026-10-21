import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocateVerification, chooseBudget, contiguousPlacement, expertTraffic, placeExperts, rankLoads, replayPlan, simulateSession, timeline } from '../src/mechanisms-model.ts';

test('prefix hits are whole blocks under the L − 134 cap, and shared storage beats per-machine', () => {
  const base = { system: 6000, perTurnInput: 1500, perTurnOutput: 400, turns: 30, persistDecode: true, machines: 8 };
  const shared = simulateSession({ ...base, storage: 'shared' });
  const local = simulateSession({ ...base, storage: 'local' });
  for (const t of shared.turns) {
    assert.equal(t.cached % 128, 0);
    assert.ok(t.cached <= t.length - 134);
  }
  assert.ok(shared.hitRate > 0.9 && shared.hitRate < 0.97, `shared ${shared.hitRate}`);
  assert.ok(local.hitRate < shared.hitRate - 0.2);
  const noDecode = simulateSession({ ...base, perTurnOutput: 4000, storage: 'shared', persistDecode: false });
  const withDecode = simulateSession({ ...base, perTurnOutput: 4000, storage: 'shared' });
  assert.ok(withDecode.hitRate > noDecode.hitRate);
});

test('SWA hit policy matches the deployment Q&A', () => {
  // L1 is the block hit under the cap; a missing SWA state backs off one 128-token block.
  assert.deepEqual(replayPlan(10_000, true), { cap: 9866, blockHit: 9856, hit: 9856, replay: 0, fresh: 144 });
  assert.deepEqual(replayPlan(10_000, false), { cap: 9866, blockHit: 9856, hit: 9728, replay: 128, fresh: 272 });
  assert.equal(replayPlan(200, false).hit, 0);
});

test('EPLB greedy fills every slot and lowers imbalance against contiguous placement', () => {
  const history = expertTraffic(48, 10, 1.0, 3);
  const greedy = placeExperts(history, 8, 1);
  assert.equal(greedy.capacity, 7);
  assert.ok(greedy.placement.every(r => r.length === greedy.capacity));
  assert.equal(greedy.copies.reduce((a, b) => a + b, 0), 56);
  const naive = contiguousPlacement(48, 8);
  assert.ok(rankLoads(history[0], greedy.placement, greedy.copies).lb < rankLoads(history[0], naive.placement, naive.copies).lb);
});

test('DSpark allocation reproduces the toy example and always picks prefixes', () => {
  const requests = [{ id: 'A', confidence: [0.9, 0.8, 0.7] }, { id: 'B', confidence: [0.8, 0.4, 0.9] }];
  const result = allocateVerification(requests, 5);
  assert.deepEqual(result.lengths, [3, 2]);
  for (const row of result.chosen) assert.ok(row.every((c, j) => !c || j === 0 || row[j - 1]));
  const free = chooseBudget(requests, 1, 0);
  assert.equal(free.best.q, 8, 'free verification verifies every draft');
});

test('overlap turns step time from a sum into a max', () => {
  assert.ok(Math.abs(timeline(4, 1.6, 1.2, 6, false).perStep - 8.8) < 1e-9);
  assert.equal(timeline(4, 1.6, 1.2, 6, true).perStep, 6);
  const gpu = timeline(4, 1.6, 1.2, 6, true).spans.filter(s => s.lane === 'gpu');
  for (let i = 1; i < gpu.length; i++) assert.ok(Math.abs(gpu[i].start - gpu[i - 1].end) < 1e-9, 'GPU never idles');
});
