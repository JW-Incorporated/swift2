import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LORE_RAW } from './clownbot-lore.generated';
import {
  FRESH_WINDOW_DAYS,
  LORE,
  LORE_UPDATED_ON,
  daysBetween,
  loreById,
  loreFreshness,
} from './clownbot-lore';

/**
 * OS-014b-5: `LORE` is now sourced from the published content bundle's own
 * `clownbot-lore.json` artifact (via `readBundleArtifact`) instead of the
 * `.generated.ts` re-derivation. This is the byte-identical regression
 * guard for that migration — the bundle build (`scripts/build-content-bundle.mjs`)
 * folds `clownbot-lore.generated.ts`'s `LORE_RAW` straight into the bundle's
 * JSON with no transformation, so the two must always match exactly.
 */
describe('bundle-sourced LORE is byte-identical to the generated-file output (OS-014b-5)', () => {
  it('matches clownbot-lore.generated.ts LORE_RAW exactly', () => {
    expect(LORE).toEqual(LORE_RAW);
  });
});

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
    // Five open (rumor/reported) items were last checked inside the fresh
    // window by the 2026-08-31 sweep: rep-tv-debut-tv, swifties-against-ai,
    // green-ts-next-era, ts13-lilac-cipher, and writing-new-music-post-wedding.
    expect(loreFreshness(now).liveCount).toBe(5);
  });

  it('daysBetween handles a malformed date without throwing', () => {
    expect(daysBetween('not-a-date', new Date())).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('scheduled refresh ownership', () => {
  it('connects the scheduled Rumor Desk lane to the Clownbot fallback seed (Fable ruling FR-t_2745eb60-1, #3515)', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const lane = readFileSync(
      resolve(root, 'docs/agents/runner-prompts/vault-lanes/4-rumor-desk.md'),
      'utf8',
    );
    // Post-migration: the lane instructs editing the SEED file and
    // regenerating, not hand-editing the runtime .ts files.
    expect(lane).toContain('supabase/seed/clownbot-lore/clownbot-lore.mjs');
    expect(lane).toContain('sync:content');
    expect(lane).toContain('lastCheckedOn');
  });

  it('the generator wires the seed into sync:content', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const pkg = readFileSync(resolve(root, 'package.json'), 'utf8');
    expect(pkg).toContain('sync-clownbot-lore.mjs');
  });
});

describe('LORE (the generated literal) matches the published bundle artifact (OS-014b-5, FR-t_cd5741fc-1/-2)', () => {
  it('is byte-identical to the published clownbot-lore.json content', () => {
    // Fable ruling FR-t_cd5741fc-2: clownbot-lore.ts is reachable from a
    // 'use client' component (clown-board.ts -> ClownBoard.tsx), so it must
    // keep importing the clownbot-lore.generated.ts literal as its runtime
    // value (a Turbopack client bundle cannot contain node:fs). This test is
    // the mechanism that ruling designates for making the bundle
    // authoritative anyway: it reads the published bundle's own
    // clownbot-lore.json (written by scripts/publish-content-bundle.mjs,
    // which apps/web's own `prebuild` runs before this suite executes) and
    // asserts LORE is exactly the same data — any drift between the
    // generated literal and the bundle artifact fails here immediately.
    const root = resolve(import.meta.dirname, '../../../..');
    const pointer = JSON.parse(
      readFileSync(resolve(root, 'apps/web/public/content/current.json'), 'utf8'),
    ) as { bundleVersion: string };
    const bundleFile = JSON.parse(
      readFileSync(
        resolve(
          root,
          'apps/web/public/content',
          pointer.bundleVersion,
          'clownbot-lore.json',
        ),
        'utf8',
      ),
    ) as { lore: unknown };
    expect(LORE).toEqual(bundleFile.lore);
  });
});
