import { afterEach, describe, expect, it, vi } from 'vitest';

import { USER_AGENT, check, createHostGate } from './link-probe.mjs';

const html = (title: string, body = 'hello', status = 200, url = '') => {
  const res = new Response(`<html><head><title>${title}</title></head><body>${body}</body></html>`, { status, headers: { 'content-type': 'text/html' } });
  if (url) Object.defineProperty(res, 'url', { value: url });
  return res;
};

describe('link probe verdicts (#4324)', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('sends an honest user agent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(html('Story'));
    vi.stubGlobal('fetch', fetchMock);
    await check('https://press.example.net/story');
    expect(fetchMock.mock.calls[0][1].headers['user-agent']).toBe(USER_AGENT);
    expect(USER_AGENT).toMatch(/LongLiveLinkSweep/);
  });

  it('classifies a 200 "page not found" title as soft-404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(html('Page Not Found | Example')));
    await expect(check('https://press.example.net/gone')).resolves.toMatchObject({ verdict: 'soft-404' });
  });

  it('treats a redirect to the site root as dead (removed product / article)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(html('Example', 'home', 200, 'https://shop.example.net/')));
    await expect(check('https://shop.example.net/products/old-dress')).resolves.toMatchObject({ verdict: 'dead' });
  });

  it('treats a redirect that still lands on a real page as alive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(html('Story', 'x', 200, 'https://press.example.net/articles/story-2')));
    await expect(check('https://press.example.net/story')).resolves.toMatchObject({ verdict: 'redirect' });
  });

  it('reports a bot challenge as blocked, never dead', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(html('Just a moment...')));
    await expect(check('https://press.example.net/a')).resolves.toMatchObject({ verdict: 'blocked' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));
    await expect(check('https://press.example.net/b')).resolves.toMatchObject({ verdict: 'blocked' });
  });

  it('flags sold-out only in product mode', async () => {
    const page = () => html('Tee', 'This item is sold out');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => page()));
    await expect(check('https://shop.example.net/p', { product: true })).resolves.toMatchObject({ verdict: 'sold-out' });
    await expect(check('https://shop.example.net/p')).resolves.toMatchObject({ verdict: 'ok' });
  });

  it('uses YouTube oEmbed: removed video is dead, embedding-disabled is alive, private needs a look', async () => {
    const statuses: Record<string, number> = { gone: 404, noembed: 401, priv: 403, fine: 200 };
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (u: string) => {
      const id = decodeURIComponent(String(u)).match(/v=(\w+)/)?.[1] ?? '';
      return new Response('{}', { status: statuses[id] });
    }));
    const verdict = async (id: string) => (await check(`https://www.youtube.com/watch?v=${id}`)).verdict;
    expect(await verdict('gone')).toBe('dead');
    expect(await verdict('noembed')).toBe('ok');
    expect(await verdict('priv')).toBe('suspect');
    expect(await verdict('fine')).toBe('ok');
  });

  it('reports a domain that never resolves as dead, other network failures as unverified', async () => {
    vi.useFakeTimers();
    const dns = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(dns));
    const dead = check('https://gone.example.net/x');
    await vi.runAllTimersAsync();
    await expect(dead).resolves.toMatchObject({ verdict: 'dead' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const flaky = check('https://slow.example.net/x');
    await vi.runAllTimersAsync();
    await expect(flaky).resolves.toMatchObject({ verdict: 'unverified' });
  });
});

describe('createHostGate', () => {
  it('serialises the same host and lets different hosts overlap', async () => {
    const gate = createHostGate(1);
    const log: string[] = [];
    const job = (name: string, ms: number) => async () => { log.push(`start ${name}`); await new Promise((r) => setTimeout(r, ms)); log.push(`end ${name}`); };
    await Promise.all([gate('a.test', job('a1', 15)), gate('a.test', job('a2', 1)), gate('b.test', job('b1', 1))]);
    expect(log.indexOf('end a1')).toBeLessThan(log.indexOf('start a2'));
    expect(log.indexOf('start b1')).toBeLessThan(log.indexOf('end a1'));
  });
});

describe('confirmDead', () => {
  it('drops a transient 404 when the re-probe is alive, keeps a real one', async () => {
    const { confirmDead } = await import('./link-probe.mjs');
    const probe = vi.fn().mockImplementation(async (url: string) => (url.includes('flaky') ? { url, verdict: 'ok', status: 200 } : { url, verdict: 'dead', status: 404 }));
    const out = await confirmDead(
      [{ url: 'https://a.test/flaky', verdict: 'dead' }, { url: 'https://a.test/gone', verdict: 'dead' }, { url: 'https://a.test/fine', verdict: 'ok' }],
      { probe, pauseMs: 0 },
    );
    expect(out.map((r: { verdict: string }) => r.verdict)).toEqual(['ok', 'dead', 'ok']);
    expect(out[1]).toMatchObject({ confirmed: true });
    expect(probe).toHaveBeenCalledTimes(2);
  });
});
