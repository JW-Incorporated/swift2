import { describe, expect, it } from 'vitest';

import sitemap from './sitemap';

describe('sitemap', () => {
  it('lists home, desk and support, and no query-param variants', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(expect.arrayContaining([
      'https://www.longlivets.com/',
      'https://www.longlivets.com/desk',
      'https://www.longlivets.com/support',
    ]));
    expect(urls.some((u) => u.includes('?'))).toBe(false);
  });
});
