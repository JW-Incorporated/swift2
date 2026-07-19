import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './rumor-gap.mjs';

// A high-visibility moment: latest-news era (+4) + relationship category (+3)
// + a marquee hook in the title (+3) clears the high-tier threshold (5) by a
// wide margin, so these fixtures stay high-tier even if weights shift a bit.
const hotMoment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'msg-wedding',
  title: 'Taylor and Travis marry at Madison Square Garden',
  category: 'relationship',
  texts: { context: 'context' },
  sources: [],
  images: [],
  raw: {},
  ...over,
});

describe('rumor-gap check', () => {
  it('ignores non-moment items', async () => {
    expect(await check([{ type: 'theory', sources: [], images: [] }])).toEqual([]);
  });

  it('ignores a thin low-visibility moment (long tail is other checkers)', async () => {
    const quiet = hotMoment({
      era: 'fearless',
      key: 'old-sighting',
      title: 'A quiet cafe stop',
      category: 'sighting',
    });
    expect(await check([quiet])).toEqual([]);
  });

  it('ignores a historical-era moment even with a marquee hook (depth problem, not a rumor problem)', async () => {
    // 'wedding' in the title + relationship category clears the visibility
    // tier, but a catalog-era moment is out of scope — rumor treatment is
    // for the latest-news eras fans are actively rumor-hunting.
    const historical = hotMoment({ era: 'speak-now', key: 'old-wedding-song' });
    expect(await check([historical])).toEqual([]);
  });

  it('flags a high-visibility moment with almost no sourcing and no rumor treatment', async () => {
    const f = await check([hotMoment({ sources: [{ url: 'a' }] })]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.rumor-gap');
    expect(f[0].severity).toBe('P2');
    expect(f[0].evidence).toMatch(/no.*rumor|neither/i);
  });

  it('does not flag when confirmed sourcing meets the floor', async () => {
    expect(await check([hotMoment({ sources: [{ url: 'a' }, { url: 'b' }] })])).toEqual([]);
  });

  it('does not flag when the moment carries labeled rumor entries', async () => {
    const treated = hotMoment({
      raw: {
        moment: {
          rumors: [
            {
              claim: 'A castle is reportedly being built inside the venue.',
              reportedBy: 'TMZ',
              reportedOn: '2026-06-30',
              status: 'unconfirmed',
              url: 'https://example.com/report',
            },
          ],
        },
      },
    });
    expect(await check([treated])).toEqual([]);
  });

  it('does not flag when the whole item is labeled sub-confirmed', async () => {
    expect(await check([hotMoment({ raw: { confidence: 'reputable_reporting' } })])).toEqual([]);
  });

  it('still flags when confidence is a CONFIRMED-tier value (that is not rumor treatment)', async () => {
    expect(await check([hotMoment({ raw: { confidence: 'official' } })])).toHaveLength(1);
  });
});
