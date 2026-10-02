import { describe, expect, it } from 'vitest';
import nextConfig from './next.config.mjs';

type Rule = { source: string; headers: { key: string; value: string }[] };

const rules = (await nextConfig.headers!()) as Rule[];

/** Path-to-regexp-lite: does a Next `source` pattern match this path? */
function matches(source: string, path: string): boolean {
  const re = new RegExp(
    '^' + source.replace(/\/:path\*$/, '(?:/.*)?').replace(/\//g, '\\/') + '$',
  );
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

  it('exposes only ETag, with no Vary/Allow-Methods/Allow-Headers on the content rule', () => {
    const rule = rules.find((r) => r.source === '/content/:path*')!;
    const keys = rule.headers.map((h) => h.key.toLowerCase()).sort();
    expect(keys).toEqual(['access-control-allow-origin', 'access-control-expose-headers']);
    expect(rule.headers.find((h) => h.key === 'Access-Control-Expose-Headers')!.value).toBe('ETag');
  });
});
