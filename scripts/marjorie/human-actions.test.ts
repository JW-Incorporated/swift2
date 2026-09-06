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
  '### 22. [BLOCKING] Closed in place, still under OPEN — ~5 min',
  '',
  '**Filed:** 2026-08-10',
  '',
  '**Status:** OPEN',
  '',
  '**Update (2026-08-20):** fixed it.',
  '',
  '**Status:** RESOLVED (2026-08-20)',
  '',
  '---',
  '',
  '### 24. [UPGRADE] Done, dated status form — ~2 min',
  '',
  '**Filed:** 2026-08-11',
  '',
  '**Status (2026-08-21): DONE — no longer needed.**',
  '',
  '---',
  '',
  '### 38. [DONE] Tagged done in the header itself',
  '',
  '**Filed:** 2026-08-12',
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

  // 2026-09-05 audit: HA#22 (RESOLVED), HA#24 (DONE), HA#35 (DONE) sat under
  // `## OPEN` with a terminal Status line and were asked of the founders
  // every morning with a growing "waiting Nd" age.
  it('drops items whose own Status line is terminal, even under ## OPEN', () => {
    const items = parseOpenActions(DOC, { now: NOW });
    expect(items.map((i) => i.number)).not.toContain(22); // RESOLVED (date)
    expect(items.map((i) => i.number)).not.toContain(24); // Status (date): DONE
    expect(items.map((i) => i.number)).not.toContain(38); // [DONE] header tag
  });

  it('lets the LAST Status line win when an item accretes updates', () => {
    const all = parseOpenActions(DOC, { now: NOW, includeClosed: true });
    const item22 = all.find((i) => i.number === 22)!;
    expect(item22.status).toBe('RESOLVED');
    expect(item22.closed).toBe(true);
  });

  it('still lists a plain OPEN item with an OPEN status', () => {
    const all = parseOpenActions(DOC, { now: NOW, includeClosed: true });
    expect(all.find((i) => i.number === 4)!.closed).toBe(false);
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
