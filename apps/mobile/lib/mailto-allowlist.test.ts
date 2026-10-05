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

describe('recipient-less compose mailto (share fallback Email)', () => {
  const share = `mailto:?subject=${encodeURIComponent('Moment: Fearless (Taylor’s Version)')}&body=${encodeURIComponent('Look at this https://longlivets.com/?m=1')}`;
  it.each([share, 'mailto:?subject=Hi', 'mailto:?body=Hi%20there', 'mailto:?body=a&subject=b'])('allows %s', (u) => {
    expect(isAllowedMailto(u)).toBe(true);
    expect(isAppOpenableUrl(u)).toBe(true);
  });
  it.each([
    'mailto:?', 'mailto:?subject', 'mailto:?subject=a&cc=x%40y.test', 'mailto:?bcc=x%40y.test&subject=a',
    'mailto:?to=x%40y.test&subject=a', 'mailto:?subject=a&subject=b', 'mailto:?subject=a&&body=b',
    'mailto:?subject=a%0D%0ABcc:%20x%40y.test', 'mailto:?subject=%E0%A4%A', 'mailto:?subject=a b',
    'mailto:?subject=a&body=b#frag', 'MAILTO:?subject=a', 'mailto:a@b.test?subject=a', 'mailto:,?subject=a',
    'mailto:?subject=javascript:alert(1)', 'javascript:alert(1)//mailto:?subject=a',
    `mailto:?subject=${'a'.repeat(201)}`, `mailto:?body=${'a'.repeat(2001)}`,
    `mailto:?subject=${encodeURIComponent('é'.repeat(201))}`,
    'mailto:?constructor=x', 'mailto:?__proto__=x', 'mailto:?toString=x', 'mailto:?hasOwnProperty=x', 'mailto:?subject=a&constructor=x',
  ])('rejects %s', (u) => {
    expect(isAllowedMailto(u)).toBe(false);
    expect(isAppOpenableUrl(u)).toBe(false);
  });
  it('accepts the length bounds exactly', () => {
    expect(isAllowedMailto(`mailto:?subject=${'a'.repeat(200)}&body=${'b'.repeat(2000)}`)).toBe(true);
  });
});

describe('navigation policy (SiteShell off-site links)', () => {
  it('opens https', () => expect(isAppOpenableUrl('https://open.spotify.com/x')).toBe(true));
  it.each([
    'http://example.com', 'intent://x#Intent;end', 'tel:+15551234', 'sms:123', 'javascript:alert(1)',
    'data:text/html,hi', 'file:///etc/passwd', 'longlive://x', 'market://details?id=x', 'itms-apps://x', '',
  ])('rejects %s', (u) => expect(isAppOpenableUrl(u)).toBe(false));
});
