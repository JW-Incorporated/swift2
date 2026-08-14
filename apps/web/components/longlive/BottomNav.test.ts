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

// Full growth (R3, PLAN.md): Community + Merch bring the real TABS array to
// six. layoutBottomNavTabs is length-driven only (bottom-nav-layout.test.ts
// proves any 6-entry array degrades), so this pins the real tab list itself
// at six entries, including the two new modes — together the two tests prove
// the actual bar renders icon-only at full growth, not just the pure helper.
describe('BottomNav — six tabs at full growth degrade to icon-only', () => {
  it('TABS has grown to six entries, including community and merch', () => {
    const src = readFileSync(join(__dirname, 'BottomNav.tsx'), 'utf8');
    const tabsBlock = src.slice(src.indexOf('const TABS'), src.indexOf('];', src.indexOf('const TABS')));
    const tabCount = (tabsBlock.match(/\{ id:/g) ?? []).length;
    expect(tabCount).toBe(6);
    expect(tabsBlock).toContain("id: 'community'");
    expect(tabsBlock).toContain("id: 'merch'");
  });

  it('a 6-entry tab list (the real TABS shape) renders icon-only', () => {
    const sixTabs = [
      { id: 'era', label: 'Eras' },
      { id: 'threads', label: 'Threads' },
      { id: 'mood', label: 'Mood' },
      { id: 'clownbot', label: 'Clownbot' },
      { id: 'community', label: 'Community' },
      { id: 'merch', label: 'Merch' },
    ];
    const tabs = layoutBottomNavTabs(sixTabs);
    expect(tabs).toHaveLength(6);
    expect(tabs.every((t) => t.iconOnly === true)).toBe(true);
  });
});
