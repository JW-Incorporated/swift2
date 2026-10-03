import { describe, expect, it } from 'vitest';
import nextConfig from './next.config.mjs';

type Rule = { source: string; headers: { key: string; value: string }[] };

const rules = (await nextConfig.headers!()) as Rule[];

/** Path-to-regexp-lite: does a Next `source` pattern match this path? */
function matches(source: string, path: string): boolean {
  // Handle /:path* suffix specially - it becomes (?:/.*)?
  const hasPathSuffix = source.endsWith('/:path*');
  const prefix = hasPathSuffix ? source.slice(0, -7) : source; // -7 = length of '/:path*'

  // Escape all regex metacharacters in the prefix
  const escaped = prefix.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

  // Reconstruct: add the path suffix pattern if it was present
  const pattern = hasPathSuffix ? escaped + '(?:/.*)?' : escaped;

  const re = new RegExp('^' + pattern + '$');
  return re.test(path);
}

const acao = (path: string): string[] =>
  rules
    .filter((r) => matches(r.source, path))
    .flatMap((r) => r.headers)
    .filter((h) => h.key.toLowerCase() === 'access-control-allow-origin')
    .map((h) => h.value);

describe('next.config headers() — content CORS (WP0.3b)', () => {
  it('puts ACAO * on /content/**', () => {
    expect(acao('/content/manifest.json')).toEqual(['*']);
    expect(acao('/content/v1/eras.json')).toEqual(['*']);
  });

  it('puts no ACAO on /api/* or HTML routes', () => {
    expect(acao('/api/feedback')).toEqual([]);
    expect(acao('/api/devices/x/prefs')).toEqual([]);
    expect(acao('/')).toEqual([]);
    expect(acao('/vault')).toEqual([]);
  });

  it('sets only ACAO on the content rule (no Expose-Headers/Vary/Allow-Methods/Allow-Headers)', () => {
    const rule = rules.find((r) => r.source === '/content/:path*')!;
    const keys = rule.headers.map((h) => h.key.toLowerCase()).sort();
    expect(keys).toEqual(['access-control-allow-origin']);
  });
});
