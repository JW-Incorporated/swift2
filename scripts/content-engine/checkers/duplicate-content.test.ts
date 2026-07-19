import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './duplicate-content.mjs';

const moment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'k',
  title: 'A moment',
  category: 'fashion',
  images: [],
  raw: { year: 2025, month: 8, day: 26 },
  ...over,
});

describe('duplicate-content check', () => {
  it('ignores non-moment items and lone moments', async () => {
    expect(await check([{ type: 'track' }, { type: 'theory' }])).toEqual([]);
    expect(await check([moment()])).toEqual([]);
  });

  it('flags near-identical titles, and marks a cross-era pair P2 (a misfile)', async () => {
    const a = moment({ era: 'the-life-of-a-showgirl', key: 'a', title: 'The engagement, announced on Instagram', category: 'relationship' });
    const b = moment({ era: 'tortured-poets', file: 'supabase/seed/content/tortured-poets.mjs', key: 'b', title: 'The engagement announced on Instagram', category: 'relationship' });
    const f = await check([a, b]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.duplicate-content');
    expect(f[0].severity).toBe('P2'); // different eras
  });

  it('flags a same-shoot pair: shared image + same category within a week', async () => {
    const a = moment({ key: 'a', title: 'A black Versace gown at the VMAs', images: [{ url: 'shoot.jpg' }] });
    const b = moment({ key: 'b', title: 'A black-and-gold gown for a record VMA night', day: 28, images: [{ url: 'shoot.jpg' }] });
    const f = await check([a, b]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('P3'); // same era
  });

  it('does NOT flag distinct moments that merely reuse a hero image', async () => {
    // Same photo can legitimately headline two unrelated stories; without title
    // overlap and same category+week, that is not a duplicate.
    const a = moment({ key: 'a', title: 'The engagement ring, an old mine diamond', category: 'fashion', images: [{ url: 'hero.jpg' }] });
    const b = moment({ key: 'b', title: 'A wedding at Madison Square Garden', category: 'relationship', day: 3, month: 7, images: [{ url: 'hero.jpg' }] });
    expect(await check([a, b])).toEqual([]);
  });

  it('does NOT flag two genuinely different fashion moments in the same era/week', async () => {
    const a = moment({ key: 'a', title: 'A Schiaparelli gown at the Grammys' });
    const b = moment({ key: 'b', title: 'A Polo Ralph Lauren dress in the garden' });
    expect(await check([a, b])).toEqual([]);
  });
});
