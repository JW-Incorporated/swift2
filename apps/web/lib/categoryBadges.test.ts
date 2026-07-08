import { describe, expect, it } from 'vitest';
import { VAULT_CATEGORIES, type VaultCategory } from '@swift2/shared';
import { CATEGORY_BADGES, categoriesPresent, itemMatchesFilter } from './categoryBadges';

describe('CATEGORY_BADGES', () => {
  it('has one stable icon + fixed color for every category', () => {
    for (const cat of VAULT_CATEGORIES) {
      const badge = CATEGORY_BADGES[cat];
      expect(badge, `missing badge for ${cat}`).toBeDefined();
      expect(badge.icon.length).toBeGreaterThan(0);
      expect(badge.label.length).toBeGreaterThan(0);
      expect(badge.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('uses a distinct color per category (era-accent-independent)', () => {
    const colors = VAULT_CATEGORIES.map((c) => CATEGORY_BADGES[c].color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('itemMatchesFilter', () => {
  const empty = new Set<VaultCategory>();

  it('shows everything when the filter is off (empty set)', () => {
    for (const cat of VAULT_CATEGORIES) {
      expect(itemMatchesFilter(cat, empty)).toBe(true);
    }
  });

  it('shows only selected categories when active', () => {
    const active = new Set<VaultCategory>(['fashion']);
    expect(itemMatchesFilter('fashion', active)).toBe(true);
    expect(itemMatchesFilter('tour', active)).toBe(false);
  });

  it('supports multiple selected categories', () => {
    const active = new Set<VaultCategory>(['fashion', 'tour']);
    expect(itemMatchesFilter('fashion', active)).toBe(true);
    expect(itemMatchesFilter('tour', active)).toBe(true);
    expect(itemMatchesFilter('music', active)).toBe(false);
  });
});

describe('categoriesPresent', () => {
  it('returns present categories in canonical taxonomy order', () => {
    // Intentionally out of order on input.
    const input: VaultCategory[] = ['music', 'sighting', 'music', 'fashion'];
    expect(categoriesPresent(input)).toEqual(['sighting', 'fashion', 'music']);
  });

  it('returns an empty list when nothing is present', () => {
    expect(categoriesPresent([])).toEqual([]);
  });
});
