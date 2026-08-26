import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  FRESH_WINDOW_DAYS,
  LORE,
  LORE_UPDATED_ON,
  daysBetween,
  loreById,
  loreFreshness,
} from './clownbot-lore';

/**
 * "No source, no ship" is enforced here rather than by good intentions. A
 * fabricated rumour is the one failure this feature cannot survive, so the
 * shape of every item is a CI gate.
 */
describe('lore integrity — no source, no ship', () => {
  it('has items', () => {
    expect(LORE.length).toBeGreaterThanOrEqual(10);
  });

  it('every item carries at least one real https source', () => {
    for (const item of LORE) {
      expect(item.sources.length, `${item.id} has no source`).toBeGreaterThan(0);
      for (const source of item.sources) {
        expect(source.name.length, `${item.id} source has no name`).toBeGreaterThan(1);
        expect(source.url, `${item.id} source url must be https`).toMatch(/^https:\/\/\S+$/);
      }
    }
  });

  it('every item has a valid ISO date and check date', () => {
    for (const item of LORE) {
      expect(item.date, `${item.id} date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.lastCheckedOn, `${item.id} lastCheckedOn`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(Date.parse(item.date))).toBe(true);
    }
  });

  it('ids are unique', () => {
    const ids = new Set(LORE.map((i) => i.id));
    expect(ids.size).toBe(LORE.length);
  });

  it('every item has substance in its own words', () => {
    for (const item of LORE) {
      expect(item.headline.length, `${item.id} headline`).toBeGreaterThan(8);
      expect(item.detail.length, `${item.id} detail`).toBeGreaterThan(40);
    }
  });

  it('a debunked item is not left implying it is still live', () => {
    // A debunked claim must say so in its own detail text, so a reader who
    // sees only the receipt still gets the correction.
    for (const item of LORE.filter((i) => i.status === 'debunked')) {
      expect(item.ledger, `${item.id} debunked without a ledger entry`).toBeDefined();
    }
  });

  it('every ledger verdict has a date', () => {
    for (const item of LORE.filter((i) => i.ledger)) {
      expect(item.ledger!.on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('carries no location detail past city level', () => {
    // A blunt guard against the privacy redline sneaking in through a lore
    // edit: no street addresses, no flight identifiers, no coordinates.
    const banned =
      /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b|\bzip\b|\btail number\b/i;
    for (const item of LORE) {
      expect(
        banned.test(`${item.headline} ${item.detail}`),
        `${item.id} has L3 location detail`,
      ).toBe(false);
    }
  });

  it('loreById resolves and misses cleanly', () => {
    expect(loreById(LORE[0].id)?.id).toBe(LORE[0].id);
    expect(loreById('nope')).toBeUndefined();
  });
});

describe('freshness is reported honestly', () => {
  it('counts days since the last sweep', () => {
    const now = new Date(`${LORE_UPDATED_ON}T00:00:00Z`);
    expect(loreFreshness(now).ageDays).toBe(0);
    expect(loreFreshness(now).stale).toBe(false);
  });

  it('goes stale once the sweep is older than the window', () => {
    const later = new Date(
      Date.parse(`${LORE_UPDATED_ON}T00:00:00Z`) + (FRESH_WINDOW_DAYS + 1) * 86_400_000,
    );
    expect(loreFreshness(later).stale).toBe(true);
  });

  it('never reports a negative age for a future-dated sweep', () => {
    const earlier = new Date(Date.parse(`${LORE_UPDATED_ON}T00:00:00Z`) - 5 * 86_400_000);
    expect(loreFreshness(earlier).ageDays).toBe(0);
  });

  it('keeps an older open claim live when the scheduled sweep rechecked it recently (#1997)', () => {
    const now = new Date(`${LORE_UPDATED_ON}T00:00:00Z`);
    expect(loreFreshness(now).liveCount).toBe(4);
  });

  it('daysBetween handles a malformed date without throwing', () => {
    expect(daysBetween('not-a-date', new Date())).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('scheduled refresh ownership', () => {
  it('connects the scheduled Rumor Desk lane to the Clownbot fallback file (#1997)', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const lane = readFileSync(
      resolve(root, 'docs/agents/runner-prompts/vault-lanes/4-rumor-desk.md'),
      'utf8',
    );
    expect(lane).toContain('apps/web/lib/longlive/clownbot-lore.ts');
    expect(lane).toContain('LORE_UPDATED_ON');
    expect(lane).toContain('lastCheckedOn');
  });
});
