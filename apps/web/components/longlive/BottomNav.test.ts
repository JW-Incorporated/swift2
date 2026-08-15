import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { layoutBottomNavTabs } from '../../lib/longlive/bottom-nav-layout';

// No jsdom/testing-library render harness for this component (same
// constraint TimelineScrubber.test.ts documents) — source-level regression
// pin for re-review finding E (2026-08-13).
describe('BottomNav — mode drives the active tab directly', () => {
  it('has no special-cased front-door mode — the era stream is the front door (R1, PLAN.md 2026-08-14)', () => {
    const src = readFileSync(join(__dirname, 'BottomNav.tsx'), 'utf8');
    expect(src).toContain('const active = mode === tab.mode');
    expect(src).not.toContain('currentMode');
  });
});

// Full growth (R3, PLAN.md 2026-08-14 step 1): Community lands as the real
// TABS array's fifth entry; Merch folds into Community as a sub-tab (the
// 50/50 Social/Merch toggle) rather than its own nav destination, so TABS
// stops at five. layoutBottomNavTabs is length-driven only
// (bottom-nav-layout.test.ts proves a 5-entry array keeps labels and a
// 6-entry one degrades), so this pins the real tab list itself at five
// entries, with no merch tab — together the two tests prove the actual bar
// keeps labels at full growth, not just the pure helper.
describe('BottomNav — five tabs at full growth keep their labels', () => {
  it('TABS has grown to five entries, including community, with no separate merch tab', () => {
    const src = readFileSync(join(__dirname, 'BottomNav.tsx'), 'utf8');
    const tabsBlock = src.slice(src.indexOf('const TABS'), src.indexOf('];', src.indexOf('const TABS')));
    const tabCount = (tabsBlock.match(/\{ id:/g) ?? []).length;
    expect(tabCount).toBe(5);
    expect(tabsBlock).toContain("id: 'community'");
    expect(tabsBlock).not.toContain("id: 'merch'");
  });

  it('a 5-entry tab list (the real TABS shape) keeps labels, not icon-only', () => {
    const fiveTabs = [
      { id: 'era', label: 'Eras' },
      { id: 'threads', label: 'Threads' },
      { id: 'mood', label: 'Mood' },
      { id: 'clownbot', label: 'Clownbot' },
      { id: 'community', label: 'Community' },
    ];
    const tabs = layoutBottomNavTabs(fiveTabs);
    expect(tabs).toHaveLength(5);
    expect(tabs.every((t) => t.iconOnly === false)).toBe(true);
  });
});
