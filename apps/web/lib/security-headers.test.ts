import { describe, expect, it } from 'vitest';
import { securityHeaders, FRAME_SRC, CSP_REPORT_PATH } from './security-headers.mjs';

const get = (headers: { key: string; value: string }[], key: string): string =>
  headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value ?? '';

const directives = (policy: string): Map<string, string> =>
  new Map(
    policy
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...rest] = d.split(/\s+/);
        return [name!, rest.join(' ')] as const;
      }),
  );

describe('securityHeaders — the always-on set', () => {
  const headers = securityHeaders();

  it('ships every header the audit found missing', () => {
    expect(get(headers, 'Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains');
    expect(get(headers, 'X-Content-Type-Options')).toBe('nosniff');
    expect(get(headers, 'X-Frame-Options')).toBe('DENY');
    expect(get(headers, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(get(headers, 'Content-Security-Policy')).not.toBe('');
  });

  it('does not opt into HSTS preload (irreversible; Wyatt’s call)', () => {
    expect(get(headers, 'Strict-Transport-Security')).not.toContain('preload');
  });

  it('leaves the embed players’ Permissions-Policy features alone', () => {
    // Regression guard: Permissions-Policy gates what an iframe's `allow=`
    // attribute can grant. Denying any of these at the document level silently
    // kills the YouTube and Spotify players, whose `allow=` lists exactly them.
    const pp = get(headers, 'Permissions-Policy');
    for (const feature of [
      'autoplay',
      'encrypted-media',
      'fullscreen',
      'picture-in-picture',
      'clipboard-write',
      'accelerometer',
      'gyroscope',
    ]) {
      expect(pp).not.toContain(feature);
    }
    // ...while still denying what the app genuinely never uses.
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
  });
});

describe('the ENFORCED policy', () => {
  const csp = directives(get(securityHeaders(), 'Content-Security-Policy'));

  it('carries the clickjacking + injection-pivot controls', () => {
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(csp.get('base-uri')).toBe("'self'");
    expect(csp.get('form-action')).toBe("'self'");
    expect(csp.get('object-src')).toBe("'none'");
  });

  it('contains NO directive that can block a resource load', () => {
    // This is the whole safety argument for enforcing on day one: a content PR
    // adding a new image host, embed or script cannot be broken by any of
    // these. If someone adds a fetch directive here, they have to move it into
    // the report-only policy first and watch /api/csp-report.
    const fetchDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'font-src',
      'connect-src',
      'frame-src',
      'media-src',
      'worker-src',
      'manifest-src',
      'child-src',
    ];
    for (const d of fetchDirectives) expect(csp.has(d)).toBe(false);
  });
});

describe('the REPORT-ONLY policy', () => {
  const headers = securityHeaders();
  const ro = directives(get(headers, 'Content-Security-Policy-Report-Only'));

  it('is report-only, so nothing it says can blank a page', () => {
    expect(get(headers, 'Content-Security-Policy-Report-Only')).not.toBe('');
  });

  it('allows every embed host the components actually mount', () => {
    const frameSrc = ro.get('frame-src') ?? '';
    for (const host of FRAME_SRC) expect(frameSrc).toContain(host);
    // The four embeds on the site today.
    expect(frameSrc).toContain('youtube-nocookie.com');
    expect(frameSrc).toContain('open.spotify.com');
    expect(frameSrc).toContain('instagram.com');
  });

  it('keeps img-src permissive on purpose — ~500 hotlinked hosts and growing', () => {
    const img = ro.get('img-src') ?? '';
    expect(img).toContain('https:');
    expect(img).toContain('data:');
    // ...but still forbids plaintext image loads.
    expect(img).not.toContain('http:');
  });

  it('allows inline styles (every component uses style={{...}})', () => {
    expect(ro.get('style-src')).toContain("'unsafe-inline'");
  });

  it('allows the Vercel Analytics script + beacon on both prod and dev paths', () => {
    // Prod is same-origin (/_vercel/insights/*); dev pulls the debug build.
    expect(ro.get('script-src')).toContain("'self'");
    expect(ro.get('script-src')).toContain('https://va.vercel-scripts.com');
    expect(ro.get('connect-src')).toContain("'self'");
  });

  it('omits frame-ancestors (browsers ignore it report-only)', () => {
    expect(ro.has('frame-ancestors')).toBe(false);
  });

  it('points violations at the report sink', () => {
    expect(ro.get('report-uri')).toBe(CSP_REPORT_PATH);
    expect(get(headers, 'Reporting-Endpoints')).toContain(CSP_REPORT_PATH);
  });

  it('adds unsafe-eval ONLY in dev (Next’s dev bundler needs it; prod does not)', () => {
    const prod = directives(
      get(securityHeaders({ dev: false }), 'Content-Security-Policy-Report-Only'),
    );
    const dev = directives(
      get(securityHeaders({ dev: true }), 'Content-Security-Policy-Report-Only'),
    );
    expect(prod.get('script-src')).not.toContain('unsafe-eval');
    expect(dev.get('script-src')).toContain("'unsafe-eval'");
    expect(dev.get('connect-src')).toContain('ws:');
  });
});

describe('the flip to enforcing', () => {
  const headers = securityHeaders({ enforceResourcePolicy: true });

  it('merges both policies into one enforcing header and drops report-only', () => {
    const csp = directives(get(headers, 'Content-Security-Policy'));
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(csp.get('default-src')).toBe("'self'");
    expect(csp.get('frame-src')).toContain('open.spotify.com');
    expect(get(headers, 'Content-Security-Policy-Report-Only')).toBe('');
  });
});
