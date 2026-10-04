import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, defangGitHub, titleFrom, bodyFrom, itemMarker } from './route';

const ZWSP = '​';

describe('defangGitHub', () => {
  it('neutralizes @mentions and #refs so they cannot ping/backlink', () => {
    expect(defangGitHub('cc @octocat see #123')).toBe(`cc @${ZWSP}octocat see #${ZWSP}123`);
  });
});

describe('titleFrom', () => {
  it('prefixes and defangs the headline', () => {
    expect(titleFrom('ping @someone about it')).toBe(`[Intake] ping @${ZWSP}someone about it`);
  });
});

describe('bodyFrom', () => {
  it('includes the item id, era, status, headline and sources', () => {
    const body = bodyFrom({
      key: 'k',
      headline: 'Seen leaving rehearsal',
      summary: 'Fans spotted her leaving.',
      itemId: 'ci1',
      eraId: 'tloas',
      status: 'reported',
      sources: [{ name: 'People', url: 'https://people.com/x' }],
    });
    expect(body).toContain('<!-- intake:reader-verify -->');
    expect(body).toContain('`ci1`');
    expect(body).toContain('`tloas`');
    expect(body).toContain('`reported`');
    expect(body).toContain('> Seen leaving rehearsal');
    expect(body).toContain('- People: https://people.com/x');
  });

  it('defangs mentions/refs in the headline and summary', () => {
    const body = bodyFrom({
      key: 'k',
      headline: 'ping @maintainer',
      summary: 'see #1',
      itemId: 'ci1',
      eraId: '',
      status: '',
      sources: [],
    });
    expect(body).not.toMatch(/@[A-Za-z0-9]/);
    expect(body).not.toMatch(/#[0-9]/);
  });
});

describe('POST /api/intake', () => {
  const req = (body: unknown, ip: string) =>
    new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects a missing headline/itemId with 400', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ headline: '', itemId: '' }, '10.1.0.1'));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('degrades to 503 when no feedback token is configured', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ headline: 'x', itemId: 'ci1' }, '10.1.0.2'));
    expect(res.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('files an intake-labeled issue when a token is set', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'feedback-scoped-token');
    const fetchSpy = vi.fn().mockImplementation(
      async () => new Response(JSON.stringify({ number: 7, html_url: 'http://gh/7' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(
      req(
        {
          headline: 'Seen leaving rehearsal',
          summary: 'Fans spotted her.',
          itemId: 'ci1',
          eraId: 'tloas',
          status: 'reported',
          sources: [{ name: 'People', url: 'https://people.com/x' }],
        },
        '10.1.0.3',
      ),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, number: 7, url: 'http://gh/7' });

    const [, init] = fetchSpy.mock.calls.find(([, i]) => i?.method === 'POST')!;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer feedback-scoped-token');
    const sent = JSON.parse(init.body as string);
    expect(sent.labels).toEqual(['intake']);
  });

  it('rate-limits after 5 requests from the same IP within the window', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response(JSON.stringify({ number: 1 }), { status: 201 })),
    );
    const ip = '10.1.0.4';
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({ headline: 'x', itemId: `rl${i}` }, ip));
      expect(res.status).toBe(201);
    }
    const limited = await POST(req({ headline: 'x', itemId: 'rl9' }, ip));
    expect(limited.status).toBe(429);
  });

  describe('idempotency by itemId (#4883)', () => {
    type Item = {
      number: number;
      html_url: string;
      body: string;
      labels: { name: string }[];
    };
    const trusted = (id: string, over: Partial<Item> = {}): Item => ({
      number: 5,
      html_url: 'http://gh/5',
      body: `x
${itemMarker(id, 'token')}`,
      labels: [{ name: 'intake' }],
      ...over,
    });
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });

    // Routes by URL; `search` may return a Response, items, or throw.
    function mockGh(
      opts: {
        items?: Item[];
        search?: () => Promise<Response>;
        create?: () => Promise<Response>;
      } = {},
    ) {
      const spy = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('/search/issues')) {
          return opts.search ? opts.search() : json({ items: opts.items ?? [] });
        }
        if (init?.method === 'POST') {
          return opts.create ? opts.create() : json({ number: 11, html_url: 'http://gh/11' }, 201);
        }
        throw new Error(`unexpected ${url}`);
      });
      vi.stubGlobal('fetch', spy);
      return spy;
    }
    const posts = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.filter(([, i]) => i?.method === 'POST');
    const searches = (spy: ReturnType<typeof vi.fn>) =>
      spy.mock.calls.filter(([u]) => String(u).includes('/search/issues'));
    const call = (id: string, ip: string) => POST(req({ headline: 'x', itemId: id }, ip));

    beforeEach(() => {
      vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('a duplicate within the cache window does not create a second issue', async () => {
      const spy = mockGh();
      expect((await call('dup1', '10.2.0.1')).status).toBe(201);
      const second = await call('dup1', '10.2.0.1');
      expect(second.status).toBe(200);
      expect(await second.json()).toMatchObject({ ok: true, number: 11, url: 'http://gh/11', deduped: true });
      expect(posts(spy)).toHaveLength(1);
    });

    it('a trusted search hit returns the existing issue without creating, and is cached', async () => {
      const spy = mockGh({ items: [trusted('hit1')] });
      const res = await call('hit1', '10.2.0.2');
      expect(await res.json()).toMatchObject({ ok: true, number: 5, url: 'http://gh/5', deduped: true });
      await call('hit1', '10.2.0.2');
      expect(posts(spy)).toHaveLength(0);
      expect(searches(spy)).toHaveLength(1);
    });

    it('scopes the search to open intake-labeled issues with the HMAC needle and a timeout', async () => {
      const spy = mockGh();
      await call('scope1', '10.2.0.3');
      const q = decodeURIComponent(String(searches(spy)[0][0]));
      expect(q).toContain('label:intake');
      expect(q).toContain('is:open');
      expect(q).not.toContain('author:');
      expect(q).toContain(itemMarker('scope1', 'token').slice(5, -4));
      expect(searches(spy)[0][1].signal).toBeDefined();
    });

    it('ignores hits without the intake label or the exact marker', async () => {
      const spy = mockGh({
        items: [
          trusted('poison1', { labels: [] }),
          trusted('poison1', { body: 'no marker here' }),
          trusted('poison1', { body: itemMarker('poison1', 'other-key') }),
        ],
      });
      expect((await call('poison1', '10.2.0.4')).status).toBe(201);
      expect(posts(spy)).toHaveLength(1);
    });

    it('different keys give different markers for the same itemId', () => {
      expect(itemMarker('same', 'k1')).not.toBe(itemMarker('same', 'k2'));
    });

    it.each([
      ['an error', () => Promise.reject(new Error('boom'))],
      ['a timeout', () => Promise.reject(new DOMException('timed out', 'TimeoutError'))],
      ['a 403', async () => json({ message: 'rate limited' }, 403)],
      ['a 429', async () => json({ message: 'slow down' }, 429)],
    ])('search %s fails open and creates', async (_n, search) => {
      const spy = mockGh({ search });
      expect((await call(`open-${_n}`, '10.2.0.6')).status).toBe(201);
      expect(posts(spy)).toHaveLength(1);
    });

    it('distinct itemIds each create, and the marker is injective', async () => {
      const spy = mockGh();
      await call('da', '10.2.0.7');
      await call('db', '10.2.0.7');
      expect(posts(spy)).toHaveLength(2);
      expect(itemMarker('a/b', 'k')).not.toBe(itemMarker('a?b', 'k'));
      expect(itemMarker('a/b', 'k')).toMatch(/^<!-- intake-item:[0-9a-f]{32} -->$/);
    });

    it('concurrent requests for the same itemId create once', async () => {
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const spy = mockGh({
        create: async () => {
          await gate;
          return json({ number: 13, html_url: 'http://gh/13' }, 201);
        },
      });
      const a = call('conc1', '10.2.0.8');
      const b = call('conc1', '10.2.0.8');
      await new Promise((r) => setTimeout(r, 20));
      release();
      const [ra, rb] = await Promise.all([a, b]);
      expect([ra.status, rb.status].sort()).toEqual([200, 201]);
      expect(posts(spy)).toHaveLength(1);
    });

    it('re-searches after the cache TTL expires', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const spy = mockGh();
      await call('ttl1', '10.2.0.9');
      expect(searches(spy)).toHaveLength(1);
      vi.setSystemTime(Date.now() + 11 * 60_000);
      await call('ttl1', '10.2.0.9');
      expect(searches(spy)).toHaveLength(2);
    });
  });
});
