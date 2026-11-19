import { describe, expect, it } from 'vitest';

import robots from './robots';

describe('robots', () => {
  const rules = robots().rules;
  const rule = Array.isArray(rules) ? rules[0] : rules;

  it('lets crawlers fetch the /api/og share-card image', () => {
    expect(rule.allow).toEqual(expect.arrayContaining(['/', '/api/og']));
  });

  it('keeps the rest of /api/ and /vault/ disallowed', () => {
    expect(rule.disallow).toEqual(expect.arrayContaining(['/api/', '/vault/']));
  });

  it('points at the sitemap', () => {
    expect(robots().sitemap).toBe('https://www.longlivets.com/sitemap.xml');
  });
});
