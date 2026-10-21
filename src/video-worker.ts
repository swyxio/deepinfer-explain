type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

// Static assets currently return the whole MP4 to Range requests. Serve a
// single byte range from the uncompressed asset so video seeking works.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const rangeHeader = request.headers.get('Range');
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith('/blender/') || !pathname.endsWith('.mp4') || !['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }
    if (request.method === 'HEAD' || !rangeHeader) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 200 || !/^video\/mp4(?:;|$)/i.test(asset.headers.get('Content-Type') ?? '') || asset.headers.has('Content-Encoding')) return asset;
      const headers = new Headers(asset.headers);
      headers.set('Accept-Ranges', 'bytes');
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
    }

    const headers = new Headers(request.headers);
    headers.delete('Range');
    headers.delete('If-Range');
    headers.set('Accept-Encoding', 'identity');
    const asset = await env.ASSETS.fetch(new Request(request, { headers }));

    // Preserve conditional responses, missing assets and any encoded response.
    if (asset.status !== 200 || !/^video\/mp4(?:;|$)/i.test(asset.headers.get('Content-Type') ?? '') || asset.headers.has('Content-Encoding')) {
      return asset;
    }

    const ifRange = request.headers.get('If-Range');
    if (ifRange && (ifRange.startsWith('W/') || (ifRange !== asset.headers.get('ETag') && ifRange !== asset.headers.get('Last-Modified')))) {
      return asset;
    }

    // Ignore malformed, multi-range, and unsupported-unit headers. A server
    // may ignore Range when it does not support multipart responses.
    const normalizedRange = rangeHeader.trim();
    const match = /^bytes=(\d*)-(\d*)$/i.exec(normalizedRange);
    if (!match && normalizedRange.toLowerCase() !== 'bytes=') return asset;
    const first = match?.[1] ? Number(match[1]) : undefined;
    const last = match?.[2] ? Number(match[2]) : undefined;
    if ((first !== undefined && !Number.isSafeInteger(first)) || (last !== undefined && !Number.isSafeInteger(last))) return asset;

    const bytes = new Uint8Array(await asset.arrayBuffer());
    const size = bytes.byteLength;
    let start: number;
    let end: number;
    if (first === undefined) {
      const suffix = last ?? 0;
      start = Math.max(size - suffix, 0);
      end = size - 1;
    } else {
      start = first;
      end = Math.min(last ?? size - 1, size - 1);
    }

    const responseHeaders = new Headers(asset.headers);
    responseHeaders.set('Accept-Ranges', 'bytes');
    if (start >= size || end < start) {
      responseHeaders.set('Content-Range', `bytes */${size}`);
      responseHeaders.set('Content-Length', '0');
      return new Response(null, { status: 416, headers: responseHeaders });
    }

    const partial = bytes.slice(start, end + 1);
    responseHeaders.set('Content-Range', `bytes ${start}-${end}/${size}`);
    responseHeaders.set('Content-Length', String(partial.byteLength));
    return new Response(partial, { status: 206, headers: responseHeaders });
  },
};
