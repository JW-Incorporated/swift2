import { describe, expect, it } from 'vitest';
import { layoutBottomNavTabs, type BottomNavEntry } from './bottom-nav-layout';

const entries = (count: number): BottomNavEntry[] =>
  Array.from({ length: count }, (_, i) => ({ id: `tab-${i}`, label: `Tab ${i}` }));

describe('layoutBottomNavTabs', () => {
  it('keeps labels at 4 tabs (today\'s count — Eras, Threads, Mood, Clownbot, R3)', () => {
    const tabs = layoutBottomNavTabs(entries(4));
    expect(tabs).toHaveLength(4);
    expect(tabs.every((t) => t.iconOnly === false)).toBe(true);
  });

  it('degrades to icon-only at 5 tabs rather than overflow', () => {
    const tabs = layoutBottomNavTabs(entries(5));
    expect(tabs).toHaveLength(5);
    expect(tabs.every((t) => t.iconOnly === true)).toBe(true);
  });

  it('stays icon-only at 6 tabs (full growth — + Marketplace, + Community)', () => {
    const tabs = layoutBottomNavTabs(entries(6));
    expect(tabs).toHaveLength(6);
    expect(tabs.every((t) => t.iconOnly === true)).toBe(true);
  });

  it('never renders a mixed bar — every tab in a call gets the same answer', () => {
    const tabs = layoutBottomNavTabs(entries(5));
    const distinctAnswers = new Set(tabs.map((t) => t.iconOnly));
    expect(distinctAnswers.size).toBe(1);
  });

  it('preserves each entry\'s own fields alongside the new iconOnly flag', () => {
    const [first] = layoutBottomNavTabs(entries(4));
    expect(first).toMatchObject({ id: 'tab-0', label: 'Tab 0', iconOnly: false });
  });
});
