import type { CurrentItemCategory } from './current-types';

/**
 * The topic chips a live `current_item` can carry in its `tags` column (the
 * column the reader's FilterBar filters on). Mirrors `ContentTag` in
 * packages/experience/src/types.ts, which shared cannot import; experience's
 * filters.test.ts asserts the two stay in step. `Videos` is deliberately
 * absent: it is structural (a playable embed), decided by the reader.
 */
export const CURRENT_ITEM_CHIP_TAGS = ['Music', 'Fashion', 'Tour', 'Relationship', 'Lore'] as const;
export type CurrentItemChipTag = (typeof CURRENT_ITEM_CHIP_TAGS)[number];

const BY_CATEGORY: Partial<Record<CurrentItemCategory, CurrentItemChipTag>> = {
  music: 'Music',
  release: 'Music',
  award: 'Music',
  fashion: 'Fashion',
  tour: 'Tour',
  relationship: 'Relationship',
  lore: 'Lore',
};

/** Whole free-form tags (lowercased, `-`/`_` read as spaces) that name a chip. */
const BY_TAG: Record<CurrentItemChipTag, readonly string[]> = {
  Music: [
    'music', 'album', 'single', 'song', 'songwriting', 'production', 'chart', 'hot 100', 'billboard',
    'billboard 200', 'pop airplay', 'streaming', 'spotify', 'grammys', 'music video', 'vmas', 'vinyl',
  ],
  Fashion: ['fashion', 'outfit', 'red carpet', 'style', 'jewelry', 'gown', 'dress', 'look'],
  Tour: ['tour', 'tour dates', 'concert', 'concerts', 'setlist'],
  Relationship: [
    'relationship', 'wedding', 'marriage', 'engagement', 'travis kelce', 'celebrity couple',
    'celebrity wedding', 'relationship milestone', 'public relationship',
  ],
  Lore: ['lore', 'easter egg', 'easter eggs', 'theory', 'theories', 'clue', 'clues'],
};

/** Headline words that name a chip on their own. */
const BY_HEADLINE: Record<CurrentItemChipTag, RegExp> = {
  Music: /\b(album|single|song|music video|hot 100|billboard 200|grammys?|vinyl)\b/i,
  Fashion: /\b(wore|wears|wearing|gown|dress|outfit|red carpet)\b/i,
  Tour: /\b(tour|tour dates|concerts?|setlist)\b/i,
  Relationship: /\b(wedding|wed|marry|married|engaged|engagement)\b/i,
  Lore: /\b(easter eggs?|fan theory|theories)\b/i,
};

const normalizeTag = (tag: string): string => tag.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

/** A tag "names" a chip when it equals a listed phrase, or ends with ` style`
 * (`off-duty style`, `fall-style`) for Fashion. */
function tagNames(chip: CurrentItemChipTag, tag: string): boolean {
  return BY_TAG[chip].includes(tag) || (chip === 'Fashion' && tag.endsWith(' style'));
}

/**
 * The topic chips a live item belongs under, in chip order. Deterministic and
 * rule-based on fields the extractor already writes (`category`, free-form
 * `tags`, `headline`): the worker stores the result in `tags` at write time,
 * and the reader applies it again to rows written before this existed. An item
 * that names no chip returns `[]` and shows under "All" only. Chip ids already
 * present in `tags` are kept.
 */
export function chipTagsForCurrentItem(item: {
  category: string;
  tags: readonly string[];
  headline?: string;
}): CurrentItemChipTag[] {
  const tags = item.tags.map(normalizeTag);
  const fromCategory = BY_CATEGORY[item.category as CurrentItemCategory];
  return CURRENT_ITEM_CHIP_TAGS.filter(
    (chip) =>
      chip === fromCategory ||
      item.tags.includes(chip) ||
      tags.some((t) => tagNames(chip, t)) ||
      (item.headline !== undefined && BY_HEADLINE[chip].test(item.headline)),
  );
}

/** `tags` as the worker stores them: the free-form tags, then any chip ids
 * `chipTagsForCurrentItem` adds that are not already there. */
export function withChipTags(item: { category: string; tags: readonly string[]; headline?: string }): string[] {
  return [...item.tags, ...chipTagsForCurrentItem(item).filter((c) => !item.tags.includes(c))];
}
