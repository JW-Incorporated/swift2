import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TOPIC_FILTERS,
  collectCoverage,
  eraCoverage,
  formatOffender,
} from './check-filter-coverage.mjs';
import { ERAS } from '../apps/web/lib/longlive/eras.ts';
import type { ContentItem, ContentTag, VideoNote } from '../apps/web/lib/longlive/types.ts';
import type { EraFeedEntry } from '../apps/web/lib/longlive/era-feed.ts';

const ANCHOR = { sortDate: '2019-06-01', displayDate: '2019-06-01', via: 'exact' as const };

const ERA = { eraId: 'lover', eraStart: '2019-01-01', eraEnd: '2019-12-31' };

const moment = (
  id: string,
  date: string,
  tags: ContentTag[],
  video?: { youtubeId: string; title: string },
): ContentItem =>
  ({
    id,
    eraId: 'lover',
    date,
    dateLabel: date,
    title: id,
    summary: '',
    tags,
    image: '',
    ...(video ? { video } : {}),
  }) as unknown as ContentItem;

const video = (
  slug: string,
  kind: VideoNote['kind'],
  releasedOn: string | null,
): VideoNote =>
  ({
    slug,
    kind,
    title: slug,
    director: null,
    releasedOn,
    relatedSongs: [],
    summary: null,
    easterEggs: [],
    symbolism: null,
    youtubeId: `yt-${slug}`,
    sources: [],
  }) as unknown as VideoNote;

describe('eraCoverage', () => {
  it('flags a moment with zero filter ids as an offender', () => {
    const items = [moment('m-untagged', '2019-06-01', [])];
    const r = eraCoverage({ ...ERA, items, videoFeed: [] });
    expect(r.offenders).toEqual([
      { era: 'lover', kind: 'moment', id: 'm-untagged', title: 'm-untagged' },
    ]);
  });

  it('does not flag a moment carrying at least one topic tag', () => {
    const items = [moment('m-lore', '2019-06-01', ['Lore'])];
    const r = eraCoverage({ ...ERA, items, videoFeed: [] });
    expect(r.offenders).toEqual([]);
  });

  it('does not flag a video — every video carries at least Videos', () => {
    const items: ContentItem[] = [];
    const videoFeed = [video('mv', 'music_video', '2019-06-01')];
    const r = eraCoverage({ ...ERA, items, videoFeed });
    expect(r.offenders).toEqual([]);
  });

  it('reports filters with zero items in the era, via the real filtersForEntry rules', () => {
    const items = [moment('m-lore', '2019-06-01', ['Lore'])];
    const r = eraCoverage({ ...ERA, items, videoFeed: [] });
    expect(r.zeroFilters.sort()).toEqual(
      ['Music', 'Fashion', 'Tour', 'Relationship', 'Videos'].sort(),
    );
    expect(r.filterCounts.Lore).toBe(1);
  });

  it('a footage-owning moment counts toward Videos too (the restored ownership rule)', () => {
    const items = [
      moment('m-owner', '2019-06-01', ['Music'], { youtubeId: 'yt-a', title: 'a' }),
    ];
    const r = eraCoverage({ ...ERA, items, videoFeed: [] });
    expect(r.filterCounts.Videos).toBe(1);
    expect(r.zeroFilters).not.toContain('Videos');
  });

  it('counts an appearance-family video with no topic tag', () => {
    const videoFeed = [video('interview-1', 'interview', '2019-06-01')];
    const r = eraCoverage({ ...ERA, items: [], videoFeed });
    expect(r.untaggedAppearanceVideos).toBe(1);
    expect(r.offenders).toEqual([]); // still reachable under Videos — coverage holds
  });

  it('does not count a dated music video toward untaggedAppearanceVideos', () => {
    // Dated music videos get ['Music', 'Videos'] AND are not appearance-family
    // (isAppearance is false for kind: 'music_video') — excluded on both counts.
    const videoFeed = [video('mv', 'music_video', '2019-06-01')];
    const r = eraCoverage({ ...ERA, items: [], videoFeed });
    expect(r.untaggedAppearanceVideos).toBe(0);
  });

  it('handles an era with no items or videos at all', () => {
    const r = eraCoverage({ ...ERA, items: [], videoFeed: [] });
    expect(r.offenders).toEqual([]);
    expect(r.zeroFilters.sort()).toEqual([...TOPIC_FILTERS, 'Videos'].sort());
    expect(r.untaggedAppearanceVideos).toBe(0);
  });

  // PLAN.md P3 step 13: doorways must carry a filter id exactly like a
  // moment or video — the real proof the LensId→filter mapping is complete.
  it('a thread doorway counts toward its mapped filter, never zero', () => {
    const doorways: EraFeedEntry[] = [
      {
        kind: 'thread',
        doorway: { threadId: 'fashion', kicker: 'k', title: 'The Runway', example: 'x' },
        anchor: ANCHOR,
      },
    ];
    const r = eraCoverage({ ...ERA, items: [], videoFeed: [], doorways });
    expect(r.offenders).toEqual([]);
    expect(r.filterCounts.Fashion).toBe(1);
  });

  it('an egg doorway always counts toward Lore', () => {
    const doorways: EraFeedEntry[] = [
      {
        kind: 'egg',
        doorway: { eggId: 'lover:e1', threadId: null, kicker: 'k', title: 'A theory' },
        anchor: ANCHOR,
      },
    ];
    const r = eraCoverage({ ...ERA, items: [], videoFeed: [], doorways });
    expect(r.offenders).toEqual([]);
    expect(r.filterCounts.Lore).toBe(1);
  });
});

describe('formatOffender', () => {
  it('renders "era / kind / id / title", the actionable backfill line', () => {
    expect(
      formatOffender({ era: 'lover', kind: 'video', id: 'undated-film', title: 'Some Film' }),
    ).toBe('lover / video / undated-film / Some Film');
  });
});

describe('collectCoverage — wired to the live corpus', () => {
  it('returns one report per real era, via the real content + video modules', () => {
    const reports = collectCoverage();
    expect(reports).toHaveLength(ERAS.length);
    expect(reports.map((r) => r.eraId).sort()).toEqual(ERAS.map((e) => e.id).sort());
  });
});

describe('the checker reuses the real selection logic, never reimplements it', () => {
  // A checker that disagrees with the app is worse than no checker (PLAN.md
  // step 6) — this is a source lock proving the script imports the shipped
  // rule functions rather than re-deriving its own copy of them.
  const src = readFileSync(new URL('./check-filter-coverage.mjs', import.meta.url), 'utf8');

  it('imports filtersForEntry and mergeEraFeed from the shipped modules', () => {
    expect(src).toContain("from '../apps/web/lib/longlive/filters.ts'");
    expect(src).toContain("from '../apps/web/lib/longlive/era-feed.ts'");
    expect(src).toContain('filtersForEntry(');
    expect(src).toContain('mergeEraFeed(');
  });
});
