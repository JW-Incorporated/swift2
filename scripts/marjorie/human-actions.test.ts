import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseOpenActions, renderActionLine, sortForBrief, STALE_AFTER_DAYS } from './human-actions.mjs';

const NOW = new Date('2026-08-23T12:00:00Z').getTime();

const DOC = [
  '# HUMAN-ACTIONS.md — things only Joey can do',
  '',
  '## OPEN',
  '',
  '### 4. [UPGRADE] API accounts for the marketplace research — ~20 min',
  '',
  '**Filed:** 2026-08-15',
  '',
  '**Why it matters:** blah blah.',
  '',
  '**Status:** OPEN',
  '',
  '---',
  '',
  '### 10. [BLOCKING] Something urgent — ~5 min',
  '',
  '**Filed:** 2026-08-01',
  '',
  '**Why it matters:** blah.',
  '',
  '**Status:** OPEN',
  '',
  '---',
  '',
  '### 11. [UPGRADE] No Filed date (predates the convention) — ~5 min',
  '',
  '**Why it matters:** blah.',
  '',
  '**Status:** OPEN',
  '',
  '---',
  '',
  '## DONE',
  '',
  '### 1. [BLOCKING] Something already done — ~5 min',
  '',
  '**Filed:** 2026-07-01',
  '',
  '**Status:** DONE — 2026-08-01, all set.',
  '',
  '---',
  '',
].join('\n');

describe('parseOpenActions', () => {
  it('only returns items from the OPEN section, never DONE', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    expect(items.map((i) => i.number)).toEqual([4, 10, 11]);
  });

  it('computes age in days from Filed:', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    const item4 = items.find((i) => i.number === 4)!;
    expect(item4.ageDays).toBe(8); // 2026-08-15 -> 2026-08-23
  });

  it('reports null age (not a guess) when Filed: is missing', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    const item11 = items.find((i) => i.number === 11)!;
    expect(item11.filed).toBeNull();
    expect(item11.ageDays).toBeNull();
  });

  it('captures the tag and title', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    const item10 = items.find((i) => i.number === 10)!;
    expect(item10.tag).toBe('BLOCKING');
    expect(item10.title).toBe('Something urgent — ~5 min');
  });
});

describe('renderActionLine', () => {
  it('flags anything past the stale threshold with 🔴', () => {
    const stale = { number: 10, tag: 'BLOCKING', title: 'x', ageDays: STALE_AFTER_DAYS + 1 };
    const fresh = { number: 4, tag: 'UPGRADE', title: 'x', ageDays: 1 };
    expect(renderActionLine(stale)).toContain('🔴');
    expect(renderActionLine(fresh)).not.toContain('🔴');
  });

  it('says "age unknown" rather than a fabricated number when Filed: is missing', () => {
    const line = renderActionLine({ number: 11, tag: 'UPGRADE', title: 'x', ageDays: null });
    expect(line).toContain('age unknown — no Filed: date');
  });
});

describe('sortForBrief', () => {
  it('puts BLOCKING before UPGRADE regardless of age', () => {
    const items = [
      { number: 4, tag: 'UPGRADE', ageDays: 100 },
      { number: 10, tag: 'BLOCKING', ageDays: 1 },
    ];
    expect(sortForBrief(items).map((i) => i.number)).toEqual([10, 4]);
  });

  it('within the same tag, oldest first', () => {
    const items = [
      { number: 4, tag: 'UPGRADE', ageDays: 1 },
      { number: 5, tag: 'UPGRADE', ageDays: 30 },
    ];
    expect(sortForBrief(items).map((i) => i.number)).toEqual([5, 4]);
  });
});
