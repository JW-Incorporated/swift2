import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './photo-sparsity.mjs';
// @ts-expect-error — plain .mjs lib, no types
import { tier } from '../lib/visibility.mjs';

const moment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'k',
  title: 't',
  texts: { snippet: '' },
  category: 'music',
  images: [{ url: 'a', kind: 'primary' }],
  ...over,
});

describe('photo-sparsity check', () => {
  it('ignores non-moment items', async () => {
    expect(await check([{ type: 'track', images: [] }])).toEqual([]);
  });

  it('ignores moments that already have more than one image', async () => {
    const m = moment({ title: 'The engagement announcement', images: [{ url: 'a' }, { url: 'b' }] });
    expect(await check([m])).toEqual([]);
  });

  it('flags a high-visibility moment with a single image', async () => {
    const m = moment({ title: 'The engagement announcement', images: [{ url: 'only', kind: 'primary' }] });
    // precondition: this fixture really is marquee under the current config
    expect(tier(m)).toBe('high');
    const f = await check([m]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.photo-sparsity');
  });

  it('flags a marquee moment with zero images', async () => {
    const m = moment({ title: 'The engagement announcement', images: [] });
    const f = await check([m]);
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/no photos/);
  });
});
