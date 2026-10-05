import { describe, expect, expectTypeOf, it } from 'vitest';
import type { PayloadOf } from './messages';
import { isComposeMailtoUrl, isMailtoUrl } from './validate';

describe('isMailtoUrl', () => {
  it('accepts one bare lowercase-scheme address', () => {
    expect(isMailtoUrl('mailto:privacy@longlivets.com')).toBe(true);
    expect(isMailtoUrl('mailto:a.b+c@x.test')).toBe(true);
  });
  it.each([
    'mailto:', 'mailto:a@b', 'mailto:a@b.test?subject=x', 'mailto:a@b.test?bcc=c@d.test', 'mailto:a@b.test#x',
    'mailto:a@b.test,c@d.test', 'mailto:a@b.test;c@d.test', 'mailto:a%40b.test', 'mailto:a@b.test%0d%0aBcc:c@d.test',
    'mailto:a@b.test\n', 'mailto:a@b.test ', ' mailto:a@b.test', 'mailto:a b@c.test', 'mailto:<a@b.test>',
    'MAILTO:a@b.test', 'Mailto:a@b.test', 'javascript:alert(1)', 'data:text/html,hi', 'https://a.test',
    'mailto://a@b.test', 'tel:123', '', 7, null,
  ])('rejects %j', (u) => {
    expect(isMailtoUrl(u)).toBe(false);
  });
  it('a plain mailto string is not a payload url', () => {
    expectTypeOf<'mailto:a@b.test'>().not.toExtend<PayloadOf<'openExternal'>['url']>();
  });
});

describe('isComposeMailtoUrl keys', () => {
  it.each(['mailto:?subject=a&body=b', 'mailto:?body=b'])('accepts %s', (u) => expect(isComposeMailtoUrl(u)).toBe(true));
  it.each([
    'mailto:?constructor=x', 'mailto:?__proto__=x', 'mailto:?toString=x', 'mailto:?valueOf=x', 'mailto:?hasOwnProperty=x',
    'mailto:?subject=a&prototype=x', 'mailto:?Subject=a', 'mailto:?cc=a',
  ])('rejects inherited or unknown key %s', (u) => expect(isComposeMailtoUrl(u)).toBe(false));
});
