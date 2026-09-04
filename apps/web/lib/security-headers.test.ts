import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders, FRAME_SRC, CSP_REPORT_PATH } from './security-headers.mjs';

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
    expect(get(headers, 'Content-Security-Policy')).toBe('');
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

describe('the nonce-based enforcing policy', () => {
  const csp = directives(contentSecurityPolicy({ nonce: 'test-nonce' }).join('; '));

  it('carries the clickjacking + injection-pivot controls', () => {
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(csp.get('base-uri')).toBe("'self'");
    expect(csp.get('form-action')).toBe("'self'");
    expect(csp.get('object-src')).toBe("'none'");
  });

  it('allows only nonce-authorized inline scripts', () => {
    expect(csp.get('script-src')).toContain("'nonce-test-nonce'");
    expect(csp.get('script-src')).toContain("'strict-dynamic'");
    expect(csp.get('script-src')).not.toContain("'unsafe-inline'");
    expect(csp.get('style-src')).toContain("'nonce-test-nonce'");
    expect(csp.get('style-src')).not.toContain("'unsafe-inline'");
    expect(csp.get('style-src-attr')).toBe("'unsafe-inline'");
  });
});

describe('the resource policy', () => {
  const csp = directives(contentSecurityPolicy({ nonce: 'test-nonce' }).join('; '));

  it('allows every embed host the components actually mount', () => {
    const frameSrc = csp.get('frame-src') ?? '';
    for (const host of FRAME_SRC) expect(frameSrc).toContain(host);
    // The four embeds on the site today.
    expect(frameSrc).toContain('youtube-nocookie.com');
    expect(frameSrc).toContain('open.spotify.com');
    expect(frameSrc).toContain('instagram.com');
  });

  it('keeps img-src permissive on purpose — ~500 hotlinked hosts and growing', () => {
    const img = csp.get('img-src') ?? '';
    expect(img).toContain('https:');
    expect(img).toContain('data:');
    // ...but still forbids plaintext image loads.
    expect(img).not.toContain('http:');
  });

  it('allows the Vercel Analytics script + beacon on both prod and dev paths', () => {
    // Prod is same-origin (/_vercel/insights/*); dev pulls the debug build.
    expect(csp.get('script-src')).toContain("'self'");
    expect(csp.get('script-src')).toContain('https://va.vercel-scripts.com');
    expect(csp.get('connect-src')).toContain("'self'");
  });

  it('points violations at the report sink', () => {
    expect(csp.get('report-uri')).toBe(CSP_REPORT_PATH);
    expect(get(securityHeaders(), 'Reporting-Endpoints')).toContain(CSP_REPORT_PATH);
  });

  it('adds unsafe-eval ONLY in dev (Next’s dev bundler needs it; prod does not)', () => {
    const prod = directives(
      contentSecurityPolicy({ nonce: 'test-nonce', dev: false }).join('; '),
    );
    const dev = directives(
      contentSecurityPolicy({ nonce: 'test-nonce', dev: true }).join('; '),
    );
    expect(prod.get('script-src')).not.toContain('unsafe-eval');
    expect(dev.get('script-src')).toContain("'unsafe-eval'");
    expect(dev.get('connect-src')).toContain('ws:');
  });
});
