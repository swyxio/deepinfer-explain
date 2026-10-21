import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { animationTimelines, STEP_SECONDS } from '../src/animation-timelines.ts';

const sources = JSON.parse(readFileSync(new URL('../public/source-data.json', import.meta.url), 'utf8'));
const peers = JSON.parse(readFileSync(new URL('../public/peer-source-data.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../public/blender/module-manifest.json', import.meta.url), 'utf8'));
const scenes = ['story-cache', 'story-replay', 'story-experts', 'story-dspark', 'story-overlap', 'story-system'];

test('each animated phase points to real source lines and a valid peer excerpt', () => {
  assert.deepEqual(Object.keys(animationTimelines).sort(), scenes.sort());
  for (const [id, timeline] of Object.entries(animationTimelines)) {
    assert.equal(timeline.id, id);
    assert.equal(timeline.steps.length, 4, `${id}: four timed phases`);
    assert.ok(timeline.steps.at(-1).peerId, `${id}: final phase compares code`);
    for (const step of timeline.steps) {
      const { path, start, end, highlightStart, highlightEnd } = step.source;
      const lines = sources[path]?.split('\n');
      assert.ok(lines, `${id}: source exists: ${path}`);
      assert.ok(start > 0 && start <= highlightStart && highlightStart <= highlightEnd && highlightEnd <= end && end <= lines.length, `${id}: valid highlight in ${path}`);
      assert.ok(lines.slice(highlightStart - 1, highlightEnd).some(line => line.trim()), `${id}: highlight contains source`);
      for (const peerId of [step.peerId, step.alternatePeerId].filter(Boolean)) assert.ok(peers[peerId], `${id}: comparison exists: ${peerId}`);
    }
  }
});

test('rendered scenes and interactive source panels share the same phase clock and lines', () => {
  assert.equal(manifest.phaseFrames / manifest.fps, STEP_SECONDS);
  assert.deepEqual(manifest.chapters.map(chapter => chapter.id).sort(), [...scenes].sort());
  for (const chapter of manifest.chapters) {
    const steps = animationTimelines[chapter.id].steps;
    assert.equal(chapter.beats.length, steps.length, chapter.id);
    chapter.beats.forEach((beat, index) => {
      const step = steps[index];
      const { path, lines, peerId } = beat.source;
      const label = `${chapter.id}, step ${index + 1}`;
      assert.ok(lines.length, `${label}: source lines are present`);
      if (peerId) {
        assert.ok([step.peerId, step.alternatePeerId].includes(peerId), `${label}: matching comparison`);
        const peer = peers[peerId];
        assert.equal(path, peer.path, `${label}: matching comparison file`);
        assert.ok(lines.every(line => line >= peer.start && line < peer.start + peer.lines.length), `${label}: video lines appear in comparison panel`);
      } else {
        assert.equal(path, step.source.path, `${label}: matching source file`);
        assert.ok(lines.some(line => line >= step.source.highlightStart && line <= step.source.highlightEnd), `${label}: video lines intersect highlighted source`);
        const source = sources[path]?.split('\n');
        assert.ok(source && lines.every(line => line > 0 && line <= source.length && source[line - 1].trim()), `${label}: video lines exist`);
      }
    });
  }
});

test('peer excerpts link to the pinned file and line range', () => {
  for (const [id, peer] of Object.entries(peers)) {
    assert.ok(['vLLM', 'SGLang'].includes(peer.system), id);
    assert.ok(peer.start > 0 && peer.lines.length > 0, id);
    const url = new URL(peer.url);
    assert.equal(url.hostname, 'github.com', id);
    assert.ok(url.pathname.endsWith(`/${peer.path}`), id);
    assert.equal(url.hash, `#L${peer.start}-L${peer.start + peer.lines.length - 1}`, id);
  }
});
