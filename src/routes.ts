/** Public paths for source browsing. Keep file paths readable while escaping each segment. */
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const fileRoute = (path: string, line?: number) => `/file/${encodePath(path)}${line ? `/L${line}` : ''}`;
export const folderRoute = (path: string) => path === '.' ? '/codemap' : `/folder/${encodePath(path)}`;
export const routeFromPath = (path: string) => path.replace(/^\/+|\/+$/g, '') || 'overview';

export function parseFileRoute(route: string): { path: string; line?: number } {
  const parts = route.slice('file/'.length).split('/');
  const line = parts.length > 1 ? parts.at(-1)?.match(/^L([1-9]\d*)$/)?.[1] : undefined;
  const encoded = parts.slice(0, line ? -1 : undefined).join('/');
  let path: string;
  try { path = decodeURIComponent(encoded); } catch { path = encoded; }
  return { path, line: line ? Number(line) : undefined };
}

/** Redirect previously published fragment links to their corresponding path once on arrival. */
export function legacyPath(pathname: string, hash: string): string | undefined {
  if (pathname !== '/' && pathname !== '/index.html') return;
  const route = hash.slice(1);
  if (!/^(?:overview|codemap|execution|source|models|module|research|compare|visuals|blender|article|file|folder|system)(?:\/|$)/.test(route)) return;
  return route === 'overview' ? '/' : `/${route.replace(/%2f/gi, '/')}`;
}
