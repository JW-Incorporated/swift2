import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, safeBlockedOrigin, summarize } from './route';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('safeBlockedOrigin', () => {
  it('reduces a full blocked URL to its bare origin', () => {
    expect(safeBlockedOrigin('https://upload.wikimedia.org/a/b/taylor-2009.jpg')).toBe(
      'https://upload.wikimedia.org',
    );
    expect(safeBlockedOrigin('https://open.spotify.com/embed/album/xyz?utm_source=generator')).toBe(
      'https://open.spotify.com',
    );
  });

  it('passes through CSP keyword values, which carry no URL', () => {
    expect(safeBlockedOrigin('inline')).toBe('inline');
    expect(safeBlockedOrigin('eval')).toBe('eval');
    expect(safeBlockedOrigin('data')).toBe('data');
  });

  it('never echoes something it cannot parse', () => {
    expect(safeBlockedOrigin('/some/private/path?q=whatever')).toBe('other');
    expect(safeBlockedOrigin(undefined)).toBe('unknown');
    expect(safeBlockedOrigin(42)).toBe('unknown');
  });
});

describe('summarize', () => {
  it('reads the report-uri shape', () => {
    expect(
      summarize({
        'csp-report': {
          'effective-directive': 'frame-src',
          'blocked-uri': 'https://www.instagram.com/p/abc/embed/captioned',
          'document-uri': 'https://www.longlivets.com/?moment=private-detail',
          referrer: 'https://www.longlivets.com/',
        },
      }),
    ).toEqual([{ directive: 'frame-src', blocked: 'https://www.instagram.com' }]);
  });

  it('reads the report-to shape', () => {
    const body = [
      {
        type: 'csp-violation',
        body: { effectiveDirective: 'img-src', blockedURL: 'https://i.ytimg.com/vi/x/hq.jpg' },
      },
    ];
    expect(summarize(body as never)).toEqual([
      { directive: 'img-src', blocked: 'https://i.ytimg.com' },
    ]);
  });
});

describe('POST', () => {
  const post = (body: unknown) =>
    POST(new Request('https://x/api/csp-report', { method: 'POST', body: JSON.stringify(body) }));

  it('logs directive + origin and nothing else about the visitor', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await post({
      'csp-report': {
        'effective-directive': 'img-src',
        'blocked-uri': 'https://cdn.example.com/private/photo-42.jpg',
        // Everything below is visitor browsing detail. None of it may be logged.
        'document-uri': 'https://www.longlivets.com/?moment=some-moment',
        referrer: 'https://mail.example.com/inbox',
        'script-sample': 'const secret = "…"',
      },
    });

    expect(res.status).toBe(204);
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('img-src');
    expect(logged).toContain('https://cdn.example.com');
    expect(logged).not.toContain('photo-42.jpg');
    expect(logged).not.toContain('some-moment');
    expect(logged).not.toContain('mail.example.com');
    expect(logged).not.toContain('secret');
  });

  it('swallows a malformed body without throwing', async () => {
    const res = await POST(
      new Request('https://x/api/csp-report', { method: 'POST', body: 'not json' }),
    );
    expect(res.status).toBe(204);
  });
});
