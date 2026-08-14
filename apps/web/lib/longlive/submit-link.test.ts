import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  validateUrl,
  domainFromUrl,
  platformGuessFromDomain,
  hashClientId,
  postGitHubIssue,
  postToSheet,
  sendSubmissionEmail,
  submitLink,
  type SubmissionRecord,
} from './submit-link';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('validateUrl', () => {
  it('accepts a plain https URL', () => {
    const res = validateUrl('https://reddit.com/r/TaylorSwift');
    expect(res.ok).toBe(true);
  });

  it('accepts http', () => {
    expect(validateUrl('http://example.com').ok).toBe(true);
  });

  it('rejects non-http(s) schemes', () => {
    expect(validateUrl('javascript:alert(1)').ok).toBe(false);
    expect(validateUrl('data:text/html,hi').ok).toBe(false);
    expect(validateUrl('file:///etc/passwd').ok).toBe(false);
  });

  it('rejects empty/missing input', () => {
    expect(validateUrl('').ok).toBe(false);
    expect(validateUrl('   ').ok).toBe(false);
    expect(validateUrl(undefined).ok).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(validateUrl('not a url').ok).toBe(false);
  });

  it('rejects overly long input', () => {
    const long = `https://example.com/${'a'.repeat(600)}`;
    expect(validateUrl(long).ok).toBe(false);
  });
});

describe('domainFromUrl', () => {
  it('strips a leading www. and lowercases', () => {
    expect(domainFromUrl('https://WWW.Reddit.com/r/x')).toBe('reddit.com');
  });

  it('keeps subdomains that are not www', () => {
    expect(domainFromUrl('https://old.reddit.com/r/x')).toBe('old.reddit.com');
  });
});

describe('platformGuessFromDomain', () => {
  it.each([
    ['reddit.com', 'reddit'],
    ['old.reddit.com', 'reddit'],
    ['discord.gg', 'discord'],
    ['facebook.com', 'facebook'],
    ['instagram.com', 'instagram'],
    ['tiktok.com', 'tiktok'],
    ['x.com', 'x'],
    ['twitter.com', 'x'],
    ['tumblr.com', 'tumblr'],
    ['etsy.com', 'etsy'],
    ['some-random-fansite.com', 'other'],
  ])('guesses %s → %s', (domain, expected) => {
    expect(platformGuessFromDomain(domain)).toBe(expected);
  });
});

describe('hashClientId', () => {
  it('is deterministic and never returns the raw input', () => {
    const a = hashClientId('1.2.3.4');
    const b = hashClientId('1.2.3.4');
    expect(a).toBe(b);
    expect(a).not.toContain('1.2.3.4');
  });

  it('differs for different inputs', () => {
    expect(hashClientId('1.2.3.4')).not.toBe(hashClientId('5.6.7.8'));
  });
});

const baseRecord: SubmissionRecord = {
  url: 'https://reddit.com/r/TaylorSwift',
  domain: 'reddit.com',
  platformGuess: 'reddit',
  section: 'community',
  submittedAt: '2026-08-14T00:00:00.000Z',
  clientHash: 'abc123',
};

describe('postGitHubIssue', () => {
  it('is not attempted without GITHUB_FEEDBACK_TOKEN', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await postGitHubIssue(baseRecord);
    expect(res).toEqual({ attempted: false, ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('files a distinctly-labeled issue when a token is set', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 7, html_url: 'http://gh/7' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const res = await postGitHubIssue(baseRecord);
    expect(res).toEqual({ attempted: true, ok: true, number: 7, url: 'http://gh/7' });

    const [, init] = fetchSpy.mock.calls[0];
    const sent = JSON.parse(init.body as string);
    expect(sent.labels).toEqual(['link-submission']);
    expect(sent.body).toContain('reddit.com');
  });

  it('reports failure without throwing on a non-ok GitHub response', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad', { status: 500 })));
    const res = await postGitHubIssue(baseRecord);
    expect(res).toEqual({ attempted: true, ok: false });
  });
});

describe('postToSheet', () => {
  it('is not attempted without SUBMISSIONS_SHEET_WEBHOOK_URL', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await postToSheet(baseRecord);
    expect(res).toEqual({ attempted: false, ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts the row when the webhook URL is set', async () => {
    vi.stubEnv('SUBMISSIONS_SHEET_WEBHOOK_URL', 'https://script.google.com/hook');
    const fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const res = await postToSheet(baseRecord);
    expect(res).toEqual({ attempted: true, ok: true });
    expect(fetchSpy).toHaveBeenCalledWith('https://script.google.com/hook', expect.any(Object));
  });

  it('reports failure without throwing when the webhook errors', async () => {
    vi.stubEnv('SUBMISSIONS_SHEET_WEBHOOK_URL', 'https://script.google.com/hook');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const res = await postToSheet(baseRecord);
    expect(res).toEqual({ attempted: true, ok: false });
  });
});

describe('sendSubmissionEmail', () => {
  it('is not attempted without RESEND_API_KEY + SUBMISSIONS_EMAIL_FROM', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await sendSubmissionEmail(baseRecord);
    expect(res).toEqual({ attempted: false, ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('is not attempted when only one of the two env vars is set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'key');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await sendSubmissionEmail(baseRecord);
    expect(res).toEqual({ attempted: false, ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends via a plain fetch to Resend when both are set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'key');
    vi.stubEnv('SUBMISSIONS_EMAIL_FROM', 'submissions@longlivets.com');
    const fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const res = await sendSubmissionEmail(baseRecord);
    expect(res).toEqual({ attempted: true, ok: true });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const sent = JSON.parse(init.body as string);
    expect(sent.to).toEqual(['sffan15@gmail.com']);
  });
});

describe('submitLink', () => {
  it('never throws, even when every sink is unconfigured', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const outcome = await submitLink(baseRecord);
    expect(outcome.githubIssue.attempted).toBe(false);
    expect(outcome.sheet.attempted).toBe(false);
    expect(outcome.email.attempted).toBe(false);
  });
});
