import { describe, expect, it } from 'vitest';
import { legalPageForPath } from './legal-route';

describe('legalPageForPath', () => {
  it('maps the three legal paths, URLs, trailing slashes, query and hash', () => {
    expect(legalPageForPath('/privacy')).toBe('privacy');
    expect(legalPageForPath('/terms/')).toBe('terms');
    expect(legalPageForPath('https://www.longlivets.com/support?x=1#contact')).toBe('support');
  });

  it('returns null for everything else', () => {
    for (const p of ['/', '', null, undefined, '/privacy/x', '/privacyx', '/?mode=merch', '/settings/about']) {
      expect(legalPageForPath(p as string | null | undefined)).toBeNull();
    }
  });
});
