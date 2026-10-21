import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/video-worker.ts';

const contents = '0123456789';
const baseHeaders = { 'Content-Type': 'video/mp4', ETag: '"video-v1"', 'Last-Modified': 'Wed, 01 Jan 2025 00:00:00 GMT' };

function environment(options = {}) {
  const requests = [];
  return {
    requests,
    ASSETS: { fetch: async request => {
      requests.push(request);
      if (options.status === 404) return new Response('missing', { status: 404 });
      if (request.headers.get('If-None-Match') === baseHeaders.ETag) return new Response(null, { status: 304, headers: baseHeaders });
      return new Response(request.method === 'HEAD' ? null : contents, { headers: options.headers ?? baseHeaders });
    } },
  };
}

async function ask(range, extraHeaders = {}, url = 'https://example.test/blender/story-cache.mp4') {
  const env = environment();
  const response = await worker.fetch(new Request(url, { headers: { ...extraHeaders, ...(range ? { Range: range } : {}) } }), env);
  return { response, env };
}

test('closed, open-ended, clipped, and suffix ranges return exact bytes', async () => {
  for (const [range, expected, contentRange] of [
    ['bytes=3-6', '3456', 'bytes 3-6/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=8-99', '89', 'bytes 8-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
    ['bytes=-99', contents, 'bytes 0-9/10'],
  ]) {
    const { response, env } = await ask(range);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), contentRange);
    assert.equal(response.headers.get('Content-Length'), String(expected.length));
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(await response.text(), expected);
    assert.equal(env.requests[0].headers.get('Range'), null);
  }
});

test('unsatisfiable ranges return 416; malformed and multipart ranges are ignored', async () => {
  for (const range of ['bytes=10-', 'bytes=8-2', 'bytes=-0', 'bytes=-', 'bytes=']) {
    const { response } = await ask(range);
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), 'bytes */10');
    assert.equal(await response.text(), '');
  }
  for (const range of ['items=0-2', 'bytes=bad', 'bytes=0-1,4-5', 'bytes=999999999999999999999-']) {
    const { response } = await ask(range);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), contents);
  }
});

test('conditional requests and If-Range validators retain their HTTP behavior', async () => {
  assert.equal((await ask('bytes=1-2', { 'If-None-Match': '"video-v1"' })).response.status, 304);
  assert.equal((await ask('bytes=1-2', { 'If-Range': '"video-v1"' })).response.status, 206);
  assert.equal((await ask('bytes=1-2', { 'If-Range': '"old"' })).response.status, 200);
  assert.equal((await ask('bytes=1-2', { 'If-Range': 'W/"video-v1"' })).response.status, 200);
  assert.equal((await ask('bytes=1-2', { 'If-Range': baseHeaders['Last-Modified'] })).response.status, 206);
});

test('non-video routes, HEAD requests, missing and encoded assets pass through', async () => {
  const env = environment();
  const image = new Request('https://example.test/blender/image.jpg', { headers: { Range: 'bytes=0-1' } });
  await worker.fetch(image, env);
  assert.equal(env.requests[0], image);
  const head = new Request('https://example.test/blender/story-cache.mp4', { method: 'HEAD', headers: { Range: 'bytes=0-1' } });
  const headResponse = await worker.fetch(head, env);
  assert.equal(env.requests[1], head);
  assert.equal(headResponse.headers.get('Accept-Ranges'), 'bytes');
  const full = await worker.fetch(new Request('https://example.test/blender/story-cache.mp4'), env);
  assert.equal(full.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(await full.text(), contents);
  const missing = environment({ status: 404 });
  assert.equal((await worker.fetch(new Request('https://example.test/blender/missing.mp4', { headers: { Range: 'bytes=0-1' } }), missing)).status, 404);
  const encoded = environment({ headers: { ...baseHeaders, 'Content-Encoding': 'gzip' } });
  assert.equal((await worker.fetch(new Request('https://example.test/blender/story-cache.mp4', { headers: { Range: 'bytes=0-1' } }), encoded)).status, 200);
});
