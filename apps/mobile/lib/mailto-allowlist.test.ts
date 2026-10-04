import { describe, expect, it } from 'vitest';
import { LEGAL_FACTS } from '../../../packages/ui/src/reader/legal/lib/legal';
import { APP_MAILTO_ALLOWLIST, isAllowedMailto, isAppOpenableUrl } from './mailto-allowlist';

describe('mailto allow-list', () => {
  it('is exactly the LEGAL_FACTS addresses', () => {
    expect([...APP_MAILTO_ALLOWLIST].sort()).toEqual(
      [`mailto:${LEGAL_FACTS.privacyEmail}`, `mailto:${LEGAL_FACTS.legalEmail}`].sort(),
    );
  });
  it.each(APP_MAILTO_ALLOWLIST)('allows %s', (u) => {
    expect(isAllowedMailto(u)).toBe(true);
    expect(isAppOpenableUrl(u)).toBe(true);
  });
  it.each([
    'mailto:a@b.test', 'mailto:PRIVACY@longlivets.com', 'MAILTO:privacy@longlivets.com',
    'mailto:privacy@longlivets.com?subject=x', 'mailto:privacy@longlivets.com,a@b.test', 'mailto:',
  ])('rejects %s', (u) => {
    expect(isAllowedMailto(u)).toBe(false);
    expect(isAppOpenableUrl(u)).toBe(false);
  });
});

describe('navigation policy (SiteShell off-site links)', () => {
  it('opens https', () => expect(isAppOpenableUrl('https://open.spotify.com/x')).toBe(true));
  it.each([
    'http://example.com', 'intent://x#Intent;end', 'tel:+15551234', 'sms:123', 'javascript:alert(1)',
    'data:text/html,hi', 'file:///etc/passwd', 'longlive://x', 'market://details?id=x', 'itms-apps://x', '',
  ])('rejects %s', (u) => expect(isAppOpenableUrl(u)).toBe(false));
});
