import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, defangGitHub, titleFrom, bodyFrom } from './route';

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
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 7, html_url: 'http://gh/7' }), { status: 201 }),
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

    const [, init] = fetchSpy.mock.calls[0];
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
      const res = await POST(req({ headline: 'x', itemId: 'ci1' }, ip));
      expect(res.status).toBe(201);
    }
    const limited = await POST(req({ headline: 'x', itemId: 'ci1' }, ip));
    expect(limited.status).toBe(429);
  });
});
