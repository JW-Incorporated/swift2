import { describe, expect, it } from 'vitest';
import type { ContentTag } from '@swift2/experience';
import { ALL_TAGS } from './tags';
import { TAG_COLORS, itemMatchesFilter, tagsPresent } from './tagBadges';

describe('TAG_COLORS', () => {
  it('has one fixed color for every tag in the taxonomy', () => {
    for (const tag of ALL_TAGS) {
      expect(TAG_COLORS[tag], `missing color for ${tag}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('uses a distinct color per tag (era-accent-independent)', () => {
    const colors = ALL_TAGS.map((t) => TAG_COLORS[t]);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('itemMatchesFilter', () => {
  const empty = new Set<ContentTag>();

  it('shows everything when the filter is off (empty set)', () => {
    for (const tag of ALL_TAGS) {
      expect(itemMatchesFilter([tag], empty)).toBe(true);
    }
  });

  it('shows only items carrying a selected tag when active', () => {
    const active = new Set<ContentTag>(['Fashion']);
    expect(itemMatchesFilter(['Fashion'], active)).toBe(true);
    expect(itemMatchesFilter(['Tour'], active)).toBe(false);
  });

  it("matches if ANY of an item's multiple tags is selected", () => {
    const active = new Set<ContentTag>(['Tour']);
    expect(itemMatchesFilter(['Fashion', 'Tour'], active)).toBe(true);
    expect(itemMatchesFilter(['Fashion', 'Relationship'], active)).toBe(false);
  });

  it('supports multiple selected tags', () => {
    const active = new Set<ContentTag>(['Fashion', 'Tour']);
    expect(itemMatchesFilter(['Fashion'], active)).toBe(true);
    expect(itemMatchesFilter(['Tour'], active)).toBe(true);
    expect(itemMatchesFilter(['Music'], active)).toBe(false);
  });

  it('an item with no tags never matches an active filter', () => {
    const active = new Set<ContentTag>(['Music']);
    expect(itemMatchesFilter([], active)).toBe(false);
  });
});

describe('tagsPresent', () => {
  it('returns present tags in canonical taxonomy order', () => {
    // Intentionally out of taxonomy order / with duplicates on input.
    const input: ContentTag[][] = [['Music'], ['Fashion', 'Music'], ['Lore']];
    expect(tagsPresent(input)).toEqual(['Music', 'Fashion', 'Lore']);
  });

  it('returns an empty list when nothing is present', () => {
    expect(tagsPresent([])).toEqual([]);
  });
});
