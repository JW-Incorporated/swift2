import { describe, expect, it } from 'vitest';
import {
  communityGroupsToChips,
  communityPlatformSectionId,
  communitySummary,
  merchEraSectionId,
  merchGroupsToChips,
  merchSummary,
  scrollTargetY,
  slugify,
  sortChipsByCountDesc,
  suggestLinkSectionId,
  type JumpChip,
} from './section-jump';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Taylor Swift')).toBe('taylor-swift');
  });

  it('strips leading/trailing separators', () => {
    expect(slugify('  AO3  ')).toBe('ao3');
  });

  it('collapses runs of non-alphanumerics', () => {
    expect(slugify('Fan-Made / DIY!!')).toBe('fan-made-diy');
  });
});

describe('id contract', () => {
  it('community platform id is stable and namespaced', () => {
    expect(communityPlatformSectionId('Discord')).toBe('community-platform-discord');
  });

  it('merch era id is stable and namespaced', () => {
    expect(merchEraSectionId('midnights')).toBe('merch-era-midnights');
  });

  it('suggest-link id differs per section', () => {
    expect(suggestLinkSectionId('community')).toBe('suggest-link-community');
    expect(suggestLinkSectionId('merch')).toBe('suggest-link-merch');
  });
});

describe('summaries', () => {
  it('pluralizes community/platform correctly', () => {
    expect(communitySummary(30, 8)).toBe('30 communities · 8 platforms');
    expect(communitySummary(1, 1)).toBe('1 community · 1 platform');
  });

  it('pluralizes piece/era correctly', () => {
    expect(merchSummary(156, 12)).toBe('156 pieces · 12 eras');
    expect(merchSummary(1, 1)).toBe('1 piece · 1 era');
  });
});

describe('sortChipsByCountDesc', () => {
  it('sorts by count descending', () => {
    const chips: JumpChip[] = [
      { id: 'a', label: 'A', count: 3 },
      { id: 'b', label: 'B', count: 11 },
      { id: 'c', label: 'C', count: 4 },
    ];
    expect(sortChipsByCountDesc(chips).map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('breaks ties alphabetically by label', () => {
    const chips: JumpChip[] = [
      { id: 'z', label: 'Zebra', count: 5 },
      { id: 'a', label: 'Apple', count: 5 },
    ];
    expect(sortChipsByCountDesc(chips).map((c) => c.id)).toEqual(['a', 'z']);
  });

  it('treats a missing count as 0', () => {
    const chips: JumpChip[] = [
      { id: 'action', label: 'Suggest' },
      { id: 'real', label: 'Discord', count: 1 },
    ];
    expect(sortChipsByCountDesc(chips).map((c) => c.id)).toEqual(['real', 'action']);
  });
});

describe('communityGroupsToChips', () => {
  it('maps platform groups to chips sorted by descending count, ignoring source order', () => {
    const groups: [string, { length: number }][] = [
      ['Discord', { length: 11 }],
      ['Reddit', { length: 3 }],
      ['Forum', { length: 4 }],
    ];
    const chips = communityGroupsToChips(groups);
    expect(chips.map((c) => ({ label: c.label, count: c.count }))).toEqual([
      { label: 'Discord', count: 11 },
      { label: 'Forum', count: 4 },
      { label: 'Reddit', count: 3 },
    ]);
    expect(chips.every((c) => c.count! > 0)).toBe(true);
    expect(chips[0].id).toBe(communityPlatformSectionId('Discord'));
  });
});

describe('merchGroupsToChips', () => {
  it('preserves group order (already newest-first) and carries the era accent as dotColor', () => {
    const groups = [
      { eraId: 'midnights', eraLabel: 'Midnights', count: 23 },
      { eraId: 'lover', eraLabel: 'Lover', count: 9 },
    ];
    const chips = merchGroupsToChips(groups, (eraId) => `accent-${eraId}`);
    expect(chips.map((c) => c.id)).toEqual([merchEraSectionId('midnights'), merchEraSectionId('lover')]);
    expect(chips[0]).toMatchObject({ label: 'Midnights', count: 23, dotColor: 'accent-midnights' });
  });
});

describe('scrollTargetY', () => {
  it('subtracts the sticky offset from the target position', () => {
    expect(scrollTargetY(500, 0, 96)).toBe(404);
  });

  it('accounts for existing scroll position', () => {
    expect(scrollTargetY(200, 1000, 96)).toBe(1104);
  });

  it('never returns a negative scroll position', () => {
    expect(scrollTargetY(10, 0, 200)).toBe(0);
  });
});
