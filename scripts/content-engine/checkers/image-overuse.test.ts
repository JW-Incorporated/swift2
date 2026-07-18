import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './image-overuse.mjs';

const moment = (key: string, urls: string[]) => ({
  type: 'moment',
  file: 'supabase/seed/content/speak-now.mjs',
  era: 'speak-now',
  key,
  images: urls.map((url) => ({ url, kind: 'primary' })),
});

describe('image-overuse check', () => {
  it('does not flag an image reused 3 or fewer times', async () => {
    const cover = 'https://x/cover.png';
    const items = [moment('a', [cover]), moment('b', [cover]), moment('c', [cover])];
    expect(await check(items)).toEqual([]);
  });

  it('flags an image reused on 4+ distinct moments', async () => {
    const cover = 'https://x/speak-now-cover.png';
    const items = ['a', 'b', 'c', 'd', 'e'].map((k) => moment(k, [cover]));
    const f = await check(items);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.image-overuse');
    expect(f[0].title).toMatch(/5 moments/);
  });

  it('counts each moment once even if it lists the url twice', async () => {
    const cover = 'https://x/c.png';
    const items = [moment('a', [cover, cover]), moment('b', [cover]), moment('c', [cover])];
    // 3 distinct moments → not flagged
    expect(await check(items)).toEqual([]);
  });

  it('ignores non-moment items', async () => {
    expect(await check([{ type: 'track', images: [{ url: 'https://x/c.png' }] }])).toEqual([]);
  });
});
