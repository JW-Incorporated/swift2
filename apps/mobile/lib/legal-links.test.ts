import { describe, expect, it } from 'vitest';
import { CLOWNBOT_AI_DISCLOSURE, LEGAL_PAGES, isLegalPageUrl, legalPageUrl } from './legal-links';

const PROD = 'https://www.longlivets.com';

describe('legalPageUrl — the in-app Privacy / Terms / Support links', () => {
  it('builds the production URLs App Review expects', () => {
    expect(legalPageUrl('privacy', PROD)).toBe('https://www.longlivets.com/privacy');
    expect(legalPageUrl('terms', PROD)).toBe('https://www.longlivets.com/terms');
    expect(legalPageUrl('support', PROD)).toBe('https://www.longlivets.com/support');
  });

  it('tolerates a trailing slash on the site URL', () => {
    expect(legalPageUrl('privacy', `${PROD}/`)).toBe('https://www.longlivets.com/privacy');
  });

  it.each([PROD, 'https://staging.longlivets.com'])(
    'every link it builds is one the WebView will actually open (%s)',
    (site) => {
      for (const page of LEGAL_PAGES) {
        expect(isLegalPageUrl(legalPageUrl(page.id, site), site)).toBe(true);
      }
    },
  );

  it('offers exactly Privacy Policy, Terms of Use and Support', () => {
    expect(LEGAL_PAGES.map((p) => p.label)).toEqual(['Privacy Policy', 'Terms of Use', 'Support']);
  });
});

describe('CLOWNBOT_AI_DISCLOSURE — App Store 5.1.2(i)', () => {
  it('names the third-party AI and warns against personal information', () => {
    expect(CLOWNBOT_AI_DISCLOSURE).toMatch(/AI/);
    expect(CLOWNBOT_AI_DISCLOSURE).toMatch(/Anthropic/);
    expect(CLOWNBOT_AI_DISCLOSURE).toMatch(/personal information/);
  });
});

describe('isLegalPageUrl — the WebView allowlist', () => {
  it('accepts the apex and www hosts, ignoring query and hash', () => {
    expect(isLegalPageUrl('https://longlivets.com/terms', PROD)).toBe(true);
    expect(isLegalPageUrl('https://www.longlivets.com/privacy?x=1#top', PROD)).toBe(true);
  });

  it('rejects other paths, other hosts and garbage', () => {
    expect(isLegalPageUrl('https://www.longlivets.com/', PROD)).toBe(false);
    expect(isLegalPageUrl('https://www.longlivets.com/privacy/extra', PROD)).toBe(false);
    expect(isLegalPageUrl('https://evil.example/privacy', PROD)).toBe(false);
    expect(isLegalPageUrl('not a url', PROD)).toBe(false);
  });
});
