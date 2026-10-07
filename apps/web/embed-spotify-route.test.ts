import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from './proxy';
import { GET } from './app/embed/spotify/[type]/[id]/route';

const ID = '1A2b3C4d5E6f7G8h9I0jKl';

const protections = (path: string) => {
  const res = proxy(new NextRequest(`http://localhost${path}`));
  const csp = res.headers.get('Content-Security-Policy') ?? '';
  return {
    xfo: res.headers.get('X-Frame-Options'),
    frameAncestors: csp.includes('frame-ancestors'),
  };
};

describe('/embed/spotify/<type>/<id> framing exemption', () => {
  it.each(['album', 'track', 'playlist'])('exempts exactly a valid %s', (type) => {
    expect(protections(`/embed/spotify/${type}/${ID}`)).toEqual({ xfo: null, frameAncestors: false });
    expect(protections(`/embed/spotify/${type}/${ID}?x=1`)).toEqual({ xfo: null, frameAncestors: false });
  });

  it.each([
    ['extra segment', `/embed/spotify/album/${ID}/x`],
    ['trailing slash', `/embed/spotify/album/${ID}/`],
    ['encoded slash', `/embed/spotify/album/${ID}%2Fx`],
    ['encoded slash in id', '/embed/spotify/album/1A2b3C4d5E6f7G8h9I0j%2F'],
    ['uppercase path', `/EMBED/spotify/album/${ID}`],
    ['uppercase segment', `/embed/Spotify/album/${ID}`],
    ['uppercase type', `/embed/spotify/Album/${ID}`],
    ['unknown type', `/embed/spotify/artist/${ID}`],
    ['short id', '/embed/spotify/album/short'],
    ['long id', `/embed/spotify/album/${ID}X`],
    ['missing type', `/embed/spotify/${ID}`],
    ['dash in id', '/embed/spotify/album/1A2b3C4d5E6f7G8h9I0j-K'],
  ])('keeps every protection: %s', (_name, path) => {
    expect(protections(path)).toEqual({ xfo: 'DENY', frameAncestors: true });
  });

  it('proxy matcher has no `missing` (prefetch) exclusion', () => {
    expect(config.matcher.every((m) => typeof m === 'string' || !('missing' in m))).toBe(true);
  });

  it('serves minimal HTML for a valid type/id and 404s anything else', async () => {
    const ok = await GET(new Request('http://localhost'), { params: Promise.resolve({ type: 'album', id: ID }) });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('Content-Type')).toContain('text/html');
    const html = await ok.text();
    expect(html).toContain(`https://open.spotify.com/embed/album/${ID}?utm_source=generator&amp;theme=0`);
    expect(html).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(html).toContain('allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script src="/embed-bridge.js" data-provider="spotify"></script>');

    const bad: [string, string][] = [
      ['artist', ID],
      ['Album', ID],
      ['album', 'short'],
      ['album', `${ID}X`],
      ['album', `${ID.slice(0, 21)}/`],
      ['album', `${ID.slice(0, 21)}%`],
    ];
    for (const [type, id] of bad) {
      const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ type, id }) });
      expect(res.status).toBe(404);
    }
  });
});
