import { describe, expect, it } from 'vitest';
import { resolveAppUrl } from './resolve-url';

const ORIGIN = 'https://www.longlivets.com';

describe('resolveAppUrl', () => {
  it('canonicalizes a single-leading-slash app path', () => {
    expect(resolveAppUrl('/eras/a.png', ORIGIN)).toBe(`${ORIGIN}/eras/a.png`);
  });
  it.each(['//cdn.x/y.png', 'https://x/y.png', 'data:image/png;base64,AAAA', 'blob:https://x/1'])(
    'leaves %s untouched',
    (url) => {
      expect(resolveAppUrl(url, ORIGIN)).toBe(url);
    },
  );
});
