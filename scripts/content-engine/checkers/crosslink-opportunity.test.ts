import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check, entitiesOf, scorePair } from './crosslink-opportunity.mjs';

// A moment fixture. `key`/`title`/`era`/`category` plus a `raw` carrying the
// fields the checker reads (year/month/day, snippet, threadIds, tags,
// relatedIds) and a `texts.context` for the body-reference signal.
interface Over {
  key?: string; title?: string; era?: string; category?: string; file?: string; type?: string;
  snippet?: string; context?: string; threadIds?: string[]; tags?: string[]; relatedIds?: string[];
  year?: number; month?: number; day?: number;
}
const moment = (over: Over = {}) => {
  const { snippet, context, threadIds, tags, relatedIds, year, month, day, ...rest } = over;
  return {
    type: 'moment',
    file: 'supabase/seed/content/red.mjs',
    era: 'red',
    key: 'k',
    title: 'A moment',
    category: 'music',
    images: [],
    texts: { context: context ?? '' },
    raw: {
      year: year ?? 2012,
      month: month ?? 10,
      day: day ?? 22,
      snippet: snippet ?? '',
      ...(threadIds ? { threadIds } : {}),
      ...(tags ? { tags } : {}),
      ...(relatedIds ? { relatedIds } : {}),
    },
    ...rest,
  };
};
type Moment = ReturnType<typeof moment>;

// The scoring context check() builds per pair.
const ctxFor = (a: Moment, b: Moment) => {
  const ents = (m: Moment) => entitiesOf(`${m.title}. ${m.raw?.snippet ?? ''}`);
  const df = new Map<string, number>();
  for (const m of [a, b]) for (const e of ents(m)) df.set(e, (df.get(e) ?? 0) + 1);
  return { df, entA: ents(a), entB: ents(b), ctxA: String(a.texts?.context ?? '').toLowerCase(), ctxB: String(b.texts?.context ?? '').toLowerCase() };
};

describe('entitiesOf', () => {
  it('extracts multi-word proper nouns, not lone capitals or the ubiquitous name', () => {
    const e = entitiesOf('Our Song wins. CMT Music Awards recap. Taylor Swift performs.');
    expect(e.has('our song')).toBe(true);
    expect(e.has('cmt music awards')).toBe(true);
    expect(e.has('taylor swift')).toBe(false); // DROP — in nearly every moment
    // a single capitalized word is too noisy to be an entity
    expect([...e].every((x) => x.split(' ').length >= 2)).toBe(true);
  });

  it('keeps lowercase connectives inside a run but trims them at the edges', () => {
    const e = entitiesOf('folklore wins Album of the Year');
    expect(e.has('album of the year')).toBe(true);
  });
});

describe('scorePair', () => {
  it('flags a title-subject match (same distinctive subject in both titles)', () => {
    const a = moment({ key: 'a', title: 'Our Song becomes her first No. 1' });
    const b = moment({ key: 'b', title: 'Our Song, written for the ninth-grade talent show', month: 11 });
    const r = scorePair(a, b, ctxFor(a, b));
    expect(r.flag).toBe(true);
    expect(r.titleSubject).toContain('our song');
  });

  it('does NOT let a shared award-show name alone carry a flag (context entity)', () => {
    // Two different-year gowns at the same annual show share a red carpet, not a
    // subject — with nothing else in common this must not flag.
    const a = moment({ key: 'a', category: 'fashion', title: 'A pink gown at the Billboard Music Awards', year: 2013, month: 5 });
    const b = moment({ key: 'b', era: 'lover', file: 'supabase/seed/content/lover.mjs', category: 'fashion', title: 'A silver gown at the Billboard Music Awards', year: 2019, month: 5 });
    const r = scorePair(a, b, ctxFor(a, b));
    expect(r.flag).toBe(false);
  });

  it('requires more than one signal: a lone shared tag never flags', () => {
    const a = moment({ key: 'a', title: 'A quiet studio afternoon', tags: ['Lore'], year: 2012, month: 1 });
    const b = moment({ key: 'b', title: 'A very different day entirely', tags: ['Lore'], year: 2012, month: 9 });
    expect(scorePair(a, b, ctxFor(a, b)).flag).toBe(false);
  });

  it('counts a shared narrative thread plus corroboration', () => {
    const a = moment({ key: 'a', title: 'Her masters are sold to Shamrock', threadIds: ['taylors-version'], category: 'business', year: 2020, month: 11, day: 16 });
    const b = moment({ key: 'b', title: 'She buys the catalog back at last', threadIds: ['taylors-version'], category: 'business', year: 2020, month: 11, day: 20 });
    const r = scorePair(a, b, ctxFor(a, b));
    expect(r.flag).toBe(true);
    expect(r.cats.has('thread')).toBe(true);
  });

  it('does not double-count one shared subject as two signals via the body echo', () => {
    // Same distinctive subject in both titles AND each body repeats it. That is
    // ONE connection; body-ref must not add a second independent category.
    const a = moment({ key: 'a', title: 'Cornelia Street, written alone', context: 'Cornelia Street again', year: 2019, month: 8 });
    const b = moment({ key: 'b', title: 'Cornelia Street, debuted in Paris', context: 'Cornelia Street live', year: 2019, month: 9 });
    const r = scorePair(a, b, ctxFor(a, b));
    expect(r.cats.has('body-ref')).toBe(false);
  });
});

describe('check', () => {
  it('ignores non-moments and lone moments', async () => {
    expect(await check([{ type: 'track' }, { type: 'theory' }])).toEqual([]);
    expect(await check([moment()])).toEqual([]);
  });

  it('clusters 3 moments about one subject into a SINGLE finding, not 3 pairs', async () => {
    const a = moment({ key: 'a', title: 'Our Song becomes her first No. 1', year: 2007, month: 12 });
    const b = moment({ key: 'b', title: 'Our Song wins two CMT trophies', year: 2008, month: 4 });
    const c = moment({ key: 'c', title: 'Our Song, written for a talent show', year: 2006, month: 9 });
    const f = await check([a, b, c]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.crosslink-opportunity');
    expect(f[0].severity).toBe('P3');
    expect(f[0].title).toMatch(/3 moments about “our song”/);
    // all three ids surface in the suggested links / evidence
    expect(f[0].evidence).toMatch(/Our Song becomes/);
    expect(f[0].evidence).toMatch(/talent show/);
  });

  it('does not flag a pair that already cross-links (either direction)', async () => {
    // b already points at a via relatedIds → the "our song" cluster is fully
    // linked, so nothing is filed.
    const aId = 'vault-red-our-song-becomes-her-first-no-1';
    const a = moment({ key: 'a', title: 'Our Song becomes her first No. 1' });
    const b = moment({ key: 'b', title: 'Our Song wins two CMT trophies', relatedIds: [`moment:${aId}`] });
    expect(await check([a, b])).toEqual([]);
  });

  it('does not flag near-duplicate titles (that is duplicate-content’s job)', async () => {
    const a = moment({ key: 'a', title: 'Our Song becomes her first number one hit' });
    const b = moment({ key: 'b', title: 'Our Song becomes her first number one single' });
    expect(await check([a, b])).toEqual([]);
  });

  it('files a deep-pair finding when the subject is shared but not in both titles', async () => {
    // "marjorie finlay" (her grandmother) named in both snippets + same era/cat
    // + same day → a deep pair, not a title cluster.
    const a = moment({ key: 'a', title: 'marjorie, in her grandmother’s own voice', snippet: 'Marjorie Finlay sings', context: 'about Marjorie Finlay', era: 'evermore', file: 'supabase/seed/content/evermore.mjs', year: 2020, month: 12, day: 11 });
    const b = moment({ key: 'b', title: 'The opera singer behind the song', snippet: 'Marjorie Finlay again', context: 'about Marjorie Finlay', era: 'evermore', file: 'supabase/seed/content/evermore.mjs', year: 2020, month: 12, day: 11 });
    const f = await check([a, b]);
    expect(f).toHaveLength(1);
    expect(f[0].title).toBe('Two moments plausibly should cross-link');
    expect(f[0].evidence).toMatch(/marjorie finlay/);
  });
});
