import { describe, expect, it } from 'vitest';
import { build, defaultThreadIdsForTags, type RawItem } from './content';
import { contentForThread } from './threads';

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

  it('returns an empty array for a thread with no tagged content yet', () => {
    // 'the-proposal' content today lives only in PROPOSAL_BEATS (lenses.ts),
    // not as tagged ContentItems — this documents the current gap rather
    // than asserting it should stay empty forever.
    expect(contentForThread('the-proposal')).toEqual([]);
  });
});
