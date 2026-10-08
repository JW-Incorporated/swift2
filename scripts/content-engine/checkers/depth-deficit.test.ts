import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './depth-deficit.mjs';

// A rich `defining` moment that clears every axis of the bar.
const richDefining = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'engagement',
  title: 'The engagement announcement',
  category: 'relationship',
  texts: { context: Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ') },
  sources: [{ url: 'a' }, { url: 'b' }, { url: 'c' }],
  images: [{ url: '1' }, { url: '2' }, { url: '3' }, { url: '4' }, { url: '5' }],
  raw: { significance: 'defining', relatedIds: ['x', 'y'], threadIds: ['t'] },
  ...over,
});

describe('depth-deficit check', () => {
  it('ignores non-moment items', async () => {
    expect(await check([{ type: 'track', images: [] }])).toEqual([]);
  });

  it('does not flag a defining moment that clears every axis', async () => {
    expect(await check([richDefining()])).toEqual([]);
  });

  it('ignores a non-defining moment even when thin and high-visibility', async () => {
    // A bare moment in a latest-news era (→ high visibility tier) but only
    // 'notable' significance. The checker is scoped to the crown jewels, so
    // it must NOT flag this — photo-sparsity owns the broader high-tier case.
    const thinButNotable = richDefining({
      title: 'A routine sighting',
      category: 'sighting',
      texts: { context: 'short' },
      sources: [],
      images: [],
      raw: { significance: 'notable', relatedIds: [], threadIds: [] },
    });
    expect(await check([thinButNotable])).toEqual([]);
  });

  it('flags a defining moment that is thin, naming each thin axis', async () => {
    const thin = richDefining({
      texts: { context: 'only a few words here' },
      sources: [{ url: 'a' }],
      images: [{ url: '1' }],
      raw: { significance: 'defining', relatedIds: [], threadIds: [] },
    });
    const f = await check([thin]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.depth-deficit');
    expect(f[0].severity).toBe('P2');
    // all four axes are under the defining bar
    expect(f[0].evidence).toMatch(/narrative/);
    expect(f[0].evidence).toMatch(/photos/);
    expect(f[0].evidence).toMatch(/sources/);
    expect(f[0].evidence).toMatch(/cross-links/);
  });

  it('counts relatedIds and threadIds together toward the cross-link axis', async () => {
    const linkedOnlyByThread = richDefining({
      raw: { significance: 'defining', relatedIds: [], threadIds: ['t1', 't2'] },
    });
    // 2 thread links meets the defining bar of 2 → link axis satisfied, and
    // everything else is rich → no finding
    expect(await check([linkedOnlyByThread])).toEqual([]);
  });
});
