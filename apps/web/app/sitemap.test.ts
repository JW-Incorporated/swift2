import { afterEach, describe, expect, it } from 'vitest';
import { setContentGeneratedAtSource } from '@swift2/experience';

import sitemap from './sitemap';
import * as vault from '@/lib/longlive/content-vault.generated';

describe('sitemap', () => {
  afterEach(() => setContentGeneratedAtSource(vault as unknown as Record<string, unknown>));

  it('lists home, desk and support, and no query-param variants', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(expect.arrayContaining([
      'https://www.longlivets.com/',
      'https://www.longlivets.com/desk',
      'https://www.longlivets.com/support',
    ]));
    expect(urls.some((u) => u.includes('?'))).toBe(false);
  });

  it('dates every entry with the content build stamp, not the render time', () => {
    setContentGeneratedAtSource({ CONTENT_GENERATED_AT: '2026-11-01T12:00:00.000Z' });
    const dates = sitemap().map((e) => (e.lastModified as Date).toISOString());
    expect(new Set(dates)).toEqual(new Set(['2026-11-01T12:00:00.000Z']));
  });

  it('omits lastModified when there is no build stamp', () => {
    setContentGeneratedAtSource({});
    expect(sitemap().every((e) => e.lastModified === undefined)).toBe(true);
  });
});
