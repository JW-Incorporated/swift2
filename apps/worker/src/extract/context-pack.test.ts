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
