import { describe, expect, it } from 'vitest';
import { build, defaultThreadIdsForTags, type RawItem } from './content';
import { contentForThread, contentForThreadInEra, contentForThreadInRange } from './threads';

function raw(partial: Partial<RawItem> = {}): RawItem {
  return {
    id: 'test-moment',
    date: '2020-01-01',
    dateLabel: 'January 2020',
    title: 'Test moment',
    summary: 'A test moment.',
    body: ['A test moment.'],
    tags: ['Music'],
    ...partial,
  };
}

describe('defaultThreadIdsForTags', () => {
  it('maps Relationship to love-story', () => {
    expect(defaultThreadIdsForTags(['Relationship'])).toEqual(['love-story']);
  });

  it('maps Fashion to fashion', () => {
    expect(defaultThreadIdsForTags(['Fashion'])).toEqual(['fashion']);
  });

  it('returns both when an item carries both tags, de-duped and order-stable', () => {
    expect(defaultThreadIdsForTags(['Relationship', 'Fashion', 'Relationship'])).toEqual([
      'love-story',
      'fashion',
    ]);
  });

  it('returns nothing for tags with no default thread', () => {
    expect(defaultThreadIdsForTags(['Music', 'Tour', 'Lore'])).toEqual([]);
  });
});

describe('build() thread derivation', () => {
  it('assigns love-story by default to a Relationship-tagged item', () => {
    const [item] = build('1989', [raw({ tags: ['Relationship'] })]);
    expect(item.threadIds).toEqual(['love-story']);
  });

  it('assigns fashion by default to a Fashion-tagged item', () => {
    const [item] = build('1989', [raw({ tags: ['Fashion'] })]);
    expect(item.threadIds).toEqual(['fashion']);
  });

  it('leaves threadIds undefined for an item with no default and no explicit opt-in', () => {
    const [item] = build('1989', [raw({ tags: ['Music'] })]);
    expect(item.threadIds).toBeUndefined();
  });

  it('an explicit threadIds on the raw item adds to the tag-based default, not replaces it', () => {
    const [item] = build('1989', [raw({ tags: ['Music'], threadIds: ['taylors-version'] })]);
    expect(item.threadIds).toEqual(['taylors-version']);
  });

  it('a Fashion item explicitly opted into taylors-version keeps BOTH threads (regression: explicit used to drop the tag default)', () => {
    const [item] = build('1989', [raw({ tags: ['Fashion'], threadIds: ['taylors-version'] })]);
    expect(item.threadIds).toEqual(['fashion', 'taylors-version']);
  });

  it('does not duplicate a thread already implied by the tag default even if also listed explicitly', () => {
    const [item] = build('1989', [raw({ tags: ['Relationship'], threadIds: ['love-story'] })]);
    expect(item.threadIds).toEqual(['love-story']);
  });

  it('explicit threadIds works even with no tag-based default available (easter-eggs has none)', () => {
    const [item] = build('1989', [raw({ tags: ['Lore'], threadIds: ['easter-eggs', 'hidden-clues'] })]);
    expect(item.threadIds).toEqual(['easter-eggs', 'hidden-clues']);
  });
});

describe('contentForThread', () => {
  it('returns only items tagged for the requested thread, oldest first', () => {
    const items = contentForThread('love-story');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.threadIds).toContain('love-story');
    }
    const dates = items.map((i) => i.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('returns only items tagged for the fashion thread', () => {
    const items = contentForThread('fashion');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.threadIds).toContain('fashion');
    }
  });

  it('returns items explicitly opted into the-proposal thread', () => {
    // 'the-proposal' content used to live only in PROPOSAL_BEATS (lenses.ts).
    // The 10-defining-events pass (docs/decisions.md, 2026-07-19) opted the
    // Kelce-official moment in as a tagged ContentItem, closing that gap.
    const items = contentForThread('the-proposal');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.threadIds).toContain('the-proposal');
    }
    // Pinned to the specific item (found in review, 2026-07-19) — the loop
    // above alone would still pass if this exact item's tag were dropped and
    // an unrelated item were tagged instead.
    expect(items.some((item) => item.id === 'vault-midnights-the-game-the-world-decided-made-it-official')).toBe(
      true,
    );
  });
});

// issue #436: Thread -> Eras cross-link (per-entry, auto-derived).
describe('contentForThreadInRange', () => {
  it('only returns love-story content dated inside [start, end]', () => {
    const items = contentForThreadInRange('love-story', '2023-09-24', '2026-07-10');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.threadIds).toContain('love-story');
      expect(item.date >= '2023-09-24').toBe(true);
      expect(item.date <= '2026-07-10').toBe(true);
    }
  });

  it('excludes love-story content outside the window', () => {
    // Joe Jonas (2008) is well outside the Kelce-era window used above.
    const items = contentForThreadInRange('love-story', '2023-09-24', '2026-07-10');
    expect(items.some((i) => i.date < '2023-09-24')).toBe(false);
  });

  it('treats a null end as open-ended (uses today)', () => {
    const bounded = contentForThreadInRange('love-story', '2023-09-24', '2026-07-10');
    const openEnded = contentForThreadInRange('love-story', '2023-09-24', null);
    // Open-ended should include at least everything the bounded query found.
    for (const item of bounded) {
      expect(openEnded.some((i) => i.id === item.id)).toBe(true);
    }
  });

  it('returns an empty array when nothing overlaps the window', () => {
    expect(contentForThreadInRange('love-story', '1990-01-01', '1990-12-31')).toEqual([]);
  });
});

describe('contentForThreadInEra', () => {
  it('only returns fashion content from the requested era', () => {
    const items = contentForThreadInEra('fashion', 'red');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.threadIds).toContain('fashion');
      expect(item.eraId).toBe('red');
    }
  });

  it('returns an empty array for an era the thread has no tagged content in', () => {
    // the-proposal's only tagged item (added 2026-07-19, docs/decisions.md)
    // is in the midnights era — debut genuinely has none.
    expect(contentForThreadInEra('the-proposal', 'debut')).toEqual([]);
  });
});
