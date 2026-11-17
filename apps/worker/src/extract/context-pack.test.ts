import { describe, expect, it } from 'vitest';
import { buildContextPack, CONTEXT_PACK_MAX_CHARS, isSameStory } from './context-pack';

const base = {
  eraName: 'The Life of a Showgirl',
  eraSummary: 'The 2025 album era built around backstage glitter.',
  headline: 'Abigail Anderson attends a Showgirl screening',
  entities: ['Abigail Anderson', 'Showgirl screening'],
  priorItems: [],
};

describe('buildContextPack', () => {
  it('puts the era first and numbers ids c1..', () => {
    const pack = buildContextPack({ ...base, moments: [] });
    expect(pack.items).toEqual([
      { id: 'c1', kind: 'era', text: 'The Life of a Showgirl: The 2025 album era built around backstage glitter.' },
    ]);
    expect(pack.text).toBe('[c1] The Life of a Showgirl: The 2025 album era built around backstage glitter.');
  });

  it('keeps only overlapping moments, best first, at most five', () => {
    const moments = [
      { title: 'Unrelated tour opener', summary: 'x', tags: ['tour'] },
      { title: 'Showgirl screening premiere', summary: 'The first screening.', tags: ['screening'] },
      ...Array.from({ length: 6 }, (_, i) => ({
        title: `Screening ${i}`,
        summary: 's',
        entities: ['Showgirl screening'],
      })),
    ];
    const pack = buildContextPack({ ...base, moments });
    const found = pack.items.filter((i) => i.kind === 'moment');
    expect(found).toHaveLength(5);
    expect(found[0]?.text).toContain('Showgirl screening premiere');
    expect(pack.text).not.toContain('Unrelated tour opener');
  });

  it('adds at most three prior items after the moments', () => {
    const priorItems = Array.from({ length: 4 }, (_, i) => ({ headline: `Prior ${i}`, lead: 'lead' }));
    const pack = buildContextPack({ ...base, moments: [], priorItems });
    expect(pack.items.filter((i) => i.kind === 'prior')).toHaveLength(3);
    expect(pack.items.at(-1)?.id).toBe('c4');
  });

  it('is deterministic and capped by characters', () => {
    const moments = Array.from({ length: 5 }, (_, i) => ({
      title: `Screening ${i}`,
      summary: 'y'.repeat(2_000),
      tags: ['screening'],
    }));
    const priorItems = Array.from({ length: 3 }, (_, i) => ({ headline: 'Prior ' + i, lead: 'z'.repeat(2_000) }));
    const a = buildContextPack({ ...base, eraSummary: 'e'.repeat(2_000), moments, priorItems });
    const b = buildContextPack({ ...base, eraSummary: 'e'.repeat(2_000), moments, priorItems });
    expect(a).toEqual(b);
    expect(a.text.length).toBeLessThanOrEqual(CONTEXT_PACK_MAX_CHARS);
    expect(a.items.length).toBeLessThan(9);
  });
});

describe('buildContextPack same-story exclusion', () => {
  const priorsOf = (pack: ReturnType<typeof buildContextPack>) => pack.items.filter((i) => i.kind === 'prior');

  it("excludes the same story's own earlier entry (identical headline)", () => {
    const priorItems = [{ headline: 'Abigail Anderson attends a Showgirl screening', lead: 'Earlier copy.' }];
    expect(priorsOf(buildContextPack({ ...base, moments: [], priorItems }))).toEqual([]);
  });

  it('keeps a different story that shares an entity', () => {
    const priorItems = [{ headline: 'Abigail Anderson launches a podcast', lead: 'x' }];
    expect(priorsOf(buildContextPack({ ...base, moments: [], priorItems }))).toHaveLength(1);
  });

  it('excludes by id and by a merge in either direction', () => {
    const unrelated = { headline: 'Totally different story', lead: 'x' };
    expect(priorsOf(buildContextPack({ ...base, moments: [], itemId: 'a1', priorItems: [{ ...unrelated, id: 'a1' }] }))).toEqual([]);
    expect(priorsOf(buildContextPack({ ...base, moments: [], itemId: 'a1', priorItems: [{ ...unrelated, id: 'b2', mergedInto: 'a1' }] }))).toEqual([]);
    expect(priorsOf(buildContextPack({ ...base, moments: [], mergedInto: 'b2', priorItems: [{ ...unrelated, id: 'b2' }] }))).toEqual([]);
    // without the ids the same prior is kept, so the ids are what exclude it
    expect(priorsOf(buildContextPack({ ...base, moments: [], priorItems: [unrelated] }))).toHaveLength(1);
  });

  it('excludes the same canonical source URL', () => {
    const priorItems = [{ headline: 'Totally different story', lead: 'x', url: 'https://www.tmz.com/a/?x=1' }];
    expect(priorsOf(buildContextPack({ ...base, moments: [], url: 'https://tmz.com/a', priorItems }))).toEqual([]);
    expect(priorsOf(buildContextPack({ ...base, moments: [], url: 'https://tmz.com/b', priorItems }))).toHaveLength(1);
  });

  it('lets an excluded prior free its slot', () => {
    const priorItems = [
      { headline: 'Abigail Anderson attends a Showgirl screening', lead: 'same' },
      ...Array.from({ length: 3 }, (_, i) => ({ headline: `Prior ${i}`, lead: 'x' })),
    ];
    const priors = priorsOf(buildContextPack({ ...base, moments: [], priorItems }));
    expect(priors.map((p) => p.text)).toEqual(['Prior 0', 'Prior 1', 'Prior 2'].map((h) => `Earlier on our feed: ${h} — x`));
  });

  it('isSameStory is false with no ids or urls and different headlines', () => {
    expect(isSameStory({ ...base, moments: [] }, { headline: 'Other news entirely', lead: 'x' })).toBe(false);
  });
});

describe('buildContextPack date filter', () => {
  const dated = { ...base, observedOn: '2026-11-01' };
  const momentsOf = (pack: ReturnType<typeof buildContextPack>) => pack.items.filter((i) => i.kind === 'moment');
  const moment = (title: string, date?: string) => ({ title: `Showgirl screening ${title}`, summary: 's', ...(date ? { date } : {}) });
  const titles = (moments: ReturnType<typeof momentsOf>) => moments.map((m) => m.text.replace(/^Showgirl screening (\w+) .*/, '$1'));

  it('drops a moment dated after the item and keeps a same-day one', () => {
    const moments = [moment('future', '2026-11-02'), moment('same', '2026-11-01'), moment('past', '2026-10-30')];
    expect(titles(momentsOf(buildContextPack({ ...dated, moments, priorItems: [] })))).toEqual(['same', 'past']);
  });

  it('treats a month-only date as the first of that month', () => {
    const moments = [moment('thismonth', '2026-11'), moment('nextmonth', '2026-12'), moment('lastmonth', '2026-10')];
    expect(titles(momentsOf(buildContextPack({ ...dated, moments, priorItems: [] })))).toEqual(['thismonth', 'lastmonth']);
  });

  it('keeps an undated moment and the era line', () => {
    const pack = buildContextPack({ ...dated, moments: [moment('undated')], priorItems: [] });
    expect(pack.items.map((i) => i.kind)).toEqual(['era', 'moment']);
  });

  it('applies no filter without observedOn', () => {
    const pack = buildContextPack({ ...base, moments: [moment('future', '2099-01-01')], priorItems: [] });
    expect(momentsOf(pack)).toHaveLength(1);
  });

  it('drops a prior item dated after the item, keeps same-day and undated', () => {
    const priorItems = [
      { headline: 'Future story A', lead: 'x', observedOn: '2026-11-02' },
      { headline: 'Same day story B', lead: 'x', observedOn: '2026-11-01' },
      { headline: 'Undated story C', lead: 'x' },
    ];
    const priors = buildContextPack({ ...dated, moments: [], priorItems }).items.filter((i) => i.kind === 'prior');
    expect(priors.map((p) => p.text)).toEqual(['Same day story B', 'Undated story C'].map((h) => `Earlier on our feed: ${h} — x`));
  });

  it('still excludes the same story by id and by merged_into alongside the date filter', () => {
    const priorItems = [
      { headline: 'Other one', lead: 'x', id: 'a1', observedOn: '2026-10-30' },
      { headline: 'Other two', lead: 'x', id: 'b2', mergedInto: 'a1', observedOn: '2026-10-30' },
      { headline: 'Other three', lead: 'x', id: 'c3', observedOn: '2026-10-30' },
    ];
    const priors = buildContextPack({ ...dated, moments: [], itemId: 'a1', priorItems }).items.filter((i) => i.kind === 'prior');
    expect(priors.map((p) => p.text)).toEqual(['Earlier on our feed: Other three — x']);
  });
});
