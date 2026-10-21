import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileRoute, folderRoute, legacyPath, parseFileRoute, routeFromPath } from '../src/routes.ts';

test('root and trailing slashes resolve to the expected page', () => {
  assert.equal(routeFromPath('/'), 'overview');
  assert.equal(routeFromPath('/models/'), 'models');
  assert.equal(routeFromPath('/article/goals/production-table'), 'article/goals/production-table');
});

test('source paths are readable, escaped by segment, and round-trip with lines', () => {
  assert.equal(fileRoute('deepinfer/engine/llm engine.py', 42), '/file/deepinfer/engine/llm%20engine.py/L42');
  assert.deepEqual(parseFileRoute('file/deepinfer/engine/llm%20engine.py/L42'), { path: 'deepinfer/engine/llm engine.py', line: 42 });
  assert.deepEqual(parseFileRoute('file/README.md'), { path: 'README.md', line: undefined });
  assert.equal(folderRoute('deepinfer/engine'), '/folder/deepinfer/engine');
  assert.equal(folderRoute('.'), '/codemap');
});

test('published fragment URLs redirect to paths without hijacking normal anchors', () => {
  assert.equal(legacyPath('/', '#overview'), '/');
  assert.equal(legacyPath('/', '#file/doc%2Finference_deployment_qa.md/L17'), '/file/doc/inference_deployment_qa.md/L17');
  assert.equal(legacyPath('/', '#article/goals/production-table'), '/article/goals/production-table');
  assert.equal(legacyPath('/models', '#local-anchor'), undefined);
  assert.equal(legacyPath('/', '#local-anchor'), undefined);
});
