import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, defangGitHub, titleFrom, bodyFrom } from './route';

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
  it('marks the ticket user-submitted and blockquotes the message', () => {
    const body = bodyFrom('the polaroid image is broken', { eraId: '1989', eraName: '1989' });
    expect(body).toContain('<!-- feedback:user -->');
    expect(body).toContain('🧑 User');
    expect(body).toContain('> the polaroid image is broken');
    expect(body).toContain('`1989`');
  });

  it('defangs mentions/refs in the message body (blockquotes do NOT stop autolinking)', () => {
    const body = bodyFrom('ping @maintainer about #1', {});
    expect(body).not.toMatch(/@[A-Za-z0-9]/);
    expect(body).not.toMatch(/#[0-9]/);
    expect(body).toContain(`@${ZWSP}maintainer`);
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
