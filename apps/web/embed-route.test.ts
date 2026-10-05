import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import nextConfig from './next.config.mjs';
import { config, proxy } from './proxy';
import { GET } from './app/embed/youtube/[id]/route';

const ID = 'dQw4w9WgXcQ';

const protections = (path: string) => {
  const res = proxy(new NextRequest(`http://localhost${path}`));
  const csp = res.headers.get('Content-Security-Policy') ?? '';
  return {
    xfo: res.headers.get('X-Frame-Options'),
    frameAncestors: csp.includes('frame-ancestors'),
  };
};

describe('/embed/youtube/<id> framing exemption (#4954)', () => {
  it('exempts exactly one valid id', () => {
    expect(protections(`/embed/youtube/${ID}`)).toEqual({ xfo: null, frameAncestors: false });
    expect(protections(`/embed/youtube/${ID}?autoplay=1`)).toEqual({
      xfo: null,
      frameAncestors: false,
    });
  });

  it.each([
    ['extra segment', `/embed/youtube/${ID}/x`],
    ['trailing slash', `/embed/youtube/${ID}/`],
    ['encoded slash', `/embed/youtube/${ID}%2Fx`],
    ['encoded slash inside id', '/embed/youtube/dQw4w9WgXc%2F'],
    ['uppercase path', `/EMBED/youtube/${ID}`],
    ['uppercase segment', `/embed/YouTube/${ID}`],
    ['short id', '/embed/youtube/short'],
    ['long id', `/embed/youtube/${ID}X`],
    ['other embed route', `/embed/spotify/${ID}`],
    ['root', '/'],
    ['page', '/terms'],
  ])('keeps every protection: %s', (_name, path) => {
    expect(protections(path)).toEqual({ xfo: 'DENY', frameAncestors: true });
  });

  it('proxy matcher has no `missing` (prefetch) exclusion', () => {
    expect(config.matcher.every((m) => typeof m === 'string' || !('missing' in m))).toBe(true);
  });

  it('next.config headers() sets no X-Frame-Options (proxy.ts owns it, case-sensitively)', async () => {
    const rules = await nextConfig.headers!();
    const keys = rules.flatMap((r) => r.headers.map((h) => h.key.toLowerCase()));
    expect(keys).not.toContain('x-frame-options');
  });

  it('serves minimal HTML for a valid id and 404s an invalid one', async () => {
    const ok = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: ID }) });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('Content-Type')).toContain('text/html');
    const html = await ok.text();
    expect(html).toContain(
      `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&amp;playsinline=1&amp;rel=0&amp;enablejsapi=1`,
    );
    expect(html).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script src="/embed-bridge.js" data-provider="youtube"></script>');

    for (const bad of ['short', `${ID}X`, 'dQw4w9WgXc/', 'dQw4w9WgXc%']) {
      const res = await GET(new Request('http://localhost'), {
        params: Promise.resolve({ id: bad }),
      });
      expect(res.status).toBe(404);
    }
  });
});

describe('embed CSP', () => {
  it('lets the wrapper load only same-origin scripts, no nonce/strict-dynamic', () => {
    const embedCsp = proxy(new NextRequest(`http://localhost/embed/youtube/${ID}`)).headers.get(
      'Content-Security-Policy',
    )!;
    expect(embedCsp).toMatch(/script-src 'self'( 'unsafe-eval')?(;|$)/);
    const pageCsp = proxy(new NextRequest('http://localhost/terms')).headers.get(
      'Content-Security-Policy',
    )!;
    expect(pageCsp).toContain("'strict-dynamic'");
  });
});
