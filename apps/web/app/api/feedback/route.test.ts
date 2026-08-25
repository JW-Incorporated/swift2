import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, defangGitHub, titleFrom, bodyFrom, trustedClientIp } from './route';

const ZWSP = '​';

describe('defangGitHub', () => {
  it('neutralizes @mentions so they cannot ping real people', () => {
    const out = defangGitHub('cc @octocat and @wjduvall-cmd please');
    // No bare "@word" survives — a ZWSP is inserted right after each sigil.
    expect(out).not.toMatch(/@[A-Za-z0-9]/);
    expect(out).toBe(`cc @${ZWSP}octocat and @${ZWSP}wjduvall-cmd please`);
  });

  it('neutralizes #refs and owner/repo#refs so they cannot backlink issues', () => {
    expect(defangGitHub('see #123')).toBe(`see #${ZWSP}123`);
    expect(defangGitHub('Closes #451')).toBe(`Closes #${ZWSP}451`);
    expect(defangGitHub('JW-Incorporated/swift2#7')).toBe(`JW-Incorporated/swift2#${ZWSP}7`);
  });

  it('leaves ordinary text (and lone sigils) untouched', () => {
    expect(defangGitHub('no sigils here')).toBe('no sigils here');
    expect(defangGitHub('email me: a @ b, count # 3')).toBe('email me: a @ b, count # 3');
  });
});

describe('titleFrom', () => {
  it('prefixes, uses the first non-empty line, and truncates long titles', () => {
    expect(titleFrom('hello world\nsecond')).toBe('[Feedback] hello world');
    const long = 'x'.repeat(100);
    const t = titleFrom(long);
    expect(t.startsWith('[Feedback] ')).toBe(true);
    expect(t.endsWith('…')).toBe(true);
  });

  it('defangs mentions in the title', () => {
    expect(titleFrom('ping @someone')).toBe(`[Feedback] ping @${ZWSP}someone`);
  });
});

describe('bodyFrom', () => {
  it('marks the ticket user-submitted and fences the message as a code block', () => {
    const body = bodyFrom('the polaroid image is broken', { eraId: '1989', eraName: '1989' });
    expect(body).toContain('<!-- feedback:user -->');
    expect(body).toContain('🧑 User');
    expect(body).toContain('```\nthe polaroid image is broken\n```');
    expect(body).toContain('`1989`');
  });

  it('defangs mentions/refs in the message body (belt) even though the fence (suspenders) already neutralizes them', () => {
    const body = bodyFrom('ping @maintainer about #1', {});
    expect(body).not.toMatch(/@[A-Za-z0-9]/);
    expect(body).not.toMatch(/#[0-9]/);
    expect(body).toContain(`@${ZWSP}maintainer`);
  });

  it('neutralizes markdown link/image injection (#1974) by fencing the message as code', () => {
    const body = bodyFrom('click here [Reset your password](https://evil.example) ![x](https://evil.example/pixel.png)', {});
    // The raw markdown syntax survives literally INSIDE the fence (harmless —
    // GitHub renders fenced code verbatim, no link/image ever materializes)...
    expect(body).toContain('```\nclick here [Reset your password](https://evil.example) ![x](https://evil.example/pixel.png)\n```');
    // ...and nothing outside the fence carries the injected syntax.
    const outsideFence = body.split('```').filter((_, i) => i % 2 === 0).join('');
    expect(outsideFence).not.toContain('[Reset your password]');
    expect(outsideFence).not.toContain('![x]');
  });

  it('widens the fence past any backtick run already in the message so it cannot escape early', () => {
    const message = 'here is some code: ```js\nconsole.log(1)\n``` and more text';
    const body = bodyFrom(message, {});
    // The fence markers around the message must be longer than the longest
    // backtick run inside it (4 backticks beats the message's own 3).
    expect(body).toContain('````\n' + message + '\n````');
  });

  it('code-wraps client-supplied environment fields so markdown/mentions in them are inert', () => {
    const body = bodyFrom('hi', { pageTitle: 'ping @evil', userAgent: 'UA/#9', url: 'http://x/@evil' });
    // Rendered inside a code span → literal, no autolink (GitHub does not
    // linkify mentions/refs inside `code`), so the surrounding backticks ARE
    // the neutralization.
    expect(body).toContain('`ping @evil`');
    expect(body).toContain('`UA/#9`');
    expect(body).toContain('`http://x/@evil`');
  });
});

describe('trustedClientIp (#1973 spoofable-XFF fix)', () => {
  const headersReq = (headers: Record<string, string>) =>
    new Request('http://localhost/api/feedback', { headers });

  it('prefers x-real-ip (Vercel-set, not client-spoofable) over any x-forwarded-for value', () => {
    expect(
      trustedClientIp(headersReq({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })),
    ).toBe('9.9.9.9');
  });

  it("falls back to the RIGHTMOST x-forwarded-for hop (the one Vercel's own edge appended), not the client-supplied leftmost one", () => {
    expect(trustedClientIp(headersReq({ 'x-forwarded-for': '6.6.6.6, 9.9.9.9' }))).toBe('9.9.9.9');
  });

  it('returns "unknown" when neither header is present', () => {
    expect(trustedClientIp(headersReq({}))).toBe('unknown');
  });
});

describe('POST', () => {
  const req = (body: unknown, headers: Record<string, string> = {}) =>
    new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rate-limits a rotating-XFF attacker at the shared rightmost hop, closing #1973 (spoofable leftmost XFF bypass)', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'feedback-scoped-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 1 }), { status: 201 })),
    );

    // Simulates the #1973 attack: the client-supplied (leftmost) XFF segment
    // rotates every request, but the segment Vercel's own edge appends (the
    // rightmost hop) stays fixed at the attacker's one real connection. The
    // OLD code kept the leftmost segment as the rate-limit key, so every
    // request landed in a brand-new bucket and NONE were ever 429'd — this
    // is a direct regression test for that bypass. MAX_PER_WINDOW is 5.
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const res = await POST(
        req({ message: `attack ${i}` }, { 'x-forwarded-for': `6.6.6.${i}, 9.9.9.9` }),
      );
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5).every((s) => s !== 429)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('drops honeypot submissions silently (200, no GitHub call)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ message: 'spam', hp: 'i am a bot' }));
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects empty feedback with 400', async () => {
    const res = await POST(req({ message: '   ' }));
    expect(res.status).toBe(400);
  });

  it('degrades to 503 when no feedback token is configured (never uses a broad token)', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', '');
    vi.stubEnv('GITHUB_TOKEN', 'broad-token-that-must-not-be-used');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ message: 'real feedback' }));
    expect(res.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never writes the submitted text to logs on the unconfigured path', async () => {
    // Regression guard (privacy audit, 2026-08-11): this path used to
    // `console.warn(... message.slice(0, 120))`. The endpoint is public and
    // unauthenticated, so anything a visitor types — a name, an email, a
    // grievance — landed in a log they can neither see nor delete.
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn());

    const secret = 'my email is nobody@example.com and I hate the scrubber';
    const res = await POST(req({ message: secret }));
    expect(res.status).toBe(503);

    // The misconfiguration is still announced...
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('GITHUB_FEEDBACK_TOKEN');
    // ...and it is still diagnosable (we know a real submission was dropped)...
    expect(logged).toContain(String(secret.length));
    // ...but no fragment of what the user wrote appears anywhere.
    expect(logged).not.toContain('nobody@example.com');
    expect(logged).not.toContain('scrubber');
    for (const word of secret.split(' ')) {
      if (word.length > 3) expect(logged).not.toContain(word);
    }
  });

  it('files an issue with defanged content when a feedback token is set', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'feedback-scoped-token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 42, html_url: 'http://gh/42' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(req({ message: 'ping @evil see #1', location: { eraId: '1989' } }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, number: 42, url: 'http://gh/42' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    // Feedback-scoped token used, not the broad one.
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer feedback-scoped-token');
    const sent = JSON.parse(init.body as string);
    expect(sent.labels).toContain('user-feedback');
    expect(sent.body).not.toMatch(/@[A-Za-z0-9]/); // no live mention reached GitHub
    expect(sent.body).not.toMatch(/#[0-9]/); // no live issue ref reached GitHub
  });
});
