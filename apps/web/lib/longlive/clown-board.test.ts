import { describe, expect, it } from 'vitest';

import { confirmedEggs, currentTheories, relativeDate } from './clown-board';
import { LORE } from './clownbot-lore';
import { THEORIES_RAW } from './theories.generated';

const forEra = (eraId: string) => THEORIES_RAW[eraId as keyof typeof THEORIES_RAW] ?? [];

const NOW = new Date('2026-08-31T12:00:00Z');

describe('currentTheories — column 1', () => {
  it('never pads: fewer than 10 in the corpus means fewer than 10 returned', () => {
    const items = currentTheories(NOW, forEra, LORE);
    // Real corpus, real count — asserted exactly so a future change to the
    // corpus fails this test loudly instead of silently padding.
    // 9 -> 10 (#3153): admits the ESB green/"TS"-logo new-era theory
    // (showgirl-esb-green-ts-debut-era), a pending theory-track entry.
    expect(items.length).toBe(10);
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('caps at 10 even if the corpus were to grow past it', () => {
    expect(currentTheories(NOW, forEra, LORE).length).toBeLessThanOrEqual(10);
  });

  it('contains only unresolved theories and open rumors', () => {
    for (const item of currentTheories(NOW, forEra, LORE)) {
      const isVaultTheory = item.id.startsWith('theory:');
      const isLoreRumor = item.id.startsWith('lore:');
      expect(isVaultTheory || isLoreRumor).toBe(true);
    }
  });

  it('excludes every resolved theory outcome (confirmed, debunked, abandoned, unfalsifiable, partially_confirmed)', () => {
    const ids = new Set(currentTheories(NOW, forEra, LORE).map((i) => i.id));
    for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
      for (const note of notes ?? []) {
        if (note.outcome !== 'pending') {
          expect(ids.has(`theory:${eraId}:${note.slug}`)).toBe(false);
        }
      }
    }
  });

  it('excludes lore items that are confirmed or debunked, not open', () => {
    const ids = new Set(currentTheories(NOW, forEra, LORE).map((i) => i.id));
    for (const item of LORE) {
      if (item.status === 'confirmed' || item.status === 'debunked') {
        expect(ids.has(`lore:${item.id}`)).toBe(false);
      }
    }
  });

  it('is recency-ranked, newest first', () => {
    const items = currentTheories(NOW, forEra, LORE);
    for (let i = 1; i < items.length; i += 1) {
      expect(items[i - 1].date >= items[i].date).toBe(true);
    }
  });

  it('every item carries a non-empty title, blurb, prompt and ISO date', () => {
    for (const item of currentTheories(NOW, forEra, LORE)) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.blurb.length).toBeGreaterThan(0);
      expect(item.prompt.length).toBeGreaterThan(0);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('ids are unique', () => {
    const items = currentTheories(NOW, forEra, LORE);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('is deterministic: same corpus + same now => byte-identical board', () => {
    const a = currentTheories(NOW, forEra, LORE);
    const b = currentTheories(new Date(NOW.getTime()), forEra, LORE);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('never sorts a still-open era into the future relative to now', () => {
    const today = NOW.toISOString().slice(0, 10);
    for (const item of currentTheories(NOW, forEra, LORE)) {
      expect(item.date <= today).toBe(true);
    }
  });

  it('works with an empty lore: theory items only, no lore ids', () => {
    const items = currentTheories(NOW, forEra, []);
    expect(items.every((i) => i.id.startsWith('theory:'))).toBe(true);
  });

  it('injected lore matches the baked LORE: same output as passing LORE, lore ids drawn only from it', () => {
    const baked = currentTheories(NOW, forEra, LORE);
    const copy = currentTheories(NOW, forEra, [...LORE]);
    expect(copy).toEqual(baked);
    const loreIds = new Set(
      LORE.filter((l) => l.status === 'rumor' || l.status === 'reported').map((l) => `lore:${l.id}`),
    );
    for (const item of baked.filter((i) => i.id.startsWith('lore:'))) {
      expect(loreIds.has(item.id)).toBe(true);
    }
  });
});

describe('confirmedEggs — column 2', () => {
  it('contains only confirmed planted-and-decoded easter eggs', () => {
    const items = confirmedEggs(forEra);
    expect(items.length).toBe(37);

    for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
      for (const note of notes ?? []) {
        if (note.outcome !== 'confirmed' || note.kind !== 'easter_egg') {
          expect(items.some((i) => i.id === `theory:${eraId}:${note.slug}`)).toBe(false);
        }
      }
    }

    for (const item of LORE) {
      if (item.ledger && item.ledger.verdict !== 'confirmed') {
        expect(items.some((i) => i.id === `lore:${item.id}`)).toBe(false);
      }
    }
  });

  it('keeps #1998 prediction/common-reading examples out of the decoded-egg count', () => {
    const items = confirmedEggs(forEra);
    expect(items.some((i) => i.id === 'theory:debut:a-place-in-this-world-mission-statement')).toBe(false);
    expect(items.some((i) => i.id === 'theory:folklore:william-bowery')).toBe(false);
    expect(items.some((i) => i.id === 'lore:tloas-countdown-announcement')).toBe(false);
  });

  it('still includes #1998\'s booklet example in the honestly labelled decoded-egg column', () => {
    const items = confirmedEggs(forEra);
    expect(items.some((i) => i.id === 'theory:1989:1989-lowercase-liner-codes')).toBe(true);
  });

  it('every item carries a non-empty title, blurb, prompt and ISO date', () => {
    for (const item of confirmedEggs(forEra)) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.blurb.length).toBeGreaterThan(0);
      expect(item.prompt.length).toBeGreaterThan(0);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('ids are unique', () => {
    const items = confirmedEggs(forEra);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('is deterministic: same corpus => byte-identical board', () => {
    expect(JSON.stringify(confirmedEggs(forEra))).toBe(JSON.stringify(confirmedEggs(forEra)));
  });

  it('returns only planted-and-decoded easter eggs', () => {
    for (const item of confirmedEggs(forEra)) {
      expect(item.id.startsWith('theory:')).toBe(true);
      const [, eraId, slug] = item.id.split(':');
      const note = (THEORIES_RAW[eraId as keyof typeof THEORIES_RAW] ?? []).find((n) => n.slug === slug);
      expect(note?.kind).toBe('easter_egg');
    }
  });

  it('limit caps the list to the most recent confirmations, newest first', () => {
    const all = confirmedEggs(forEra);
    const capped = confirmedEggs(forEra, { limit: 5 });
    expect(capped.length).toBe(5);
    expect(capped).toEqual(all.slice(0, 5));
  });

  it('omitting limit stays unlimited', () => {
    expect(confirmedEggs(forEra).length).toBe(37);
  });

  it('resolves every confirmed egg to a real era, grouped into the corpus\'s 11 era buckets', () => {
    const items = confirmedEggs(forEra);
    const unresolved = items.filter((i) => i.era === undefined);
    expect(unresolved.length).toBe(0);
    const eraNames = new Set(items.map((i) => i.era));
    expect(eraNames.size).toBe(11);
  });
});

describe('relativeDate — column 1 card dates', () => {
  const NOW = new Date('2026-08-14T00:00:00Z');

  it('renders today for a same-day date', () => {
    expect(relativeDate('2026-08-14', NOW)).toBe('today');
  });

  it('renders today for yesterday (mockup\'s <=1 day threshold)', () => {
    expect(relativeDate('2026-08-13', NOW)).toBe('today');
  });

  it('renders "N days ago" under the 7-day threshold', () => {
    expect(relativeDate('2026-08-10', NOW)).toBe('4 days ago');
  });

  it('renders "N weeks ago" under the 42-day threshold', () => {
    expect(relativeDate('2026-07-24', NOW)).toBe('3 weeks ago');
  });

  it('falls back to "Mon YYYY" at or beyond the 42-day threshold', () => {
    expect(relativeDate('2025-10-03', NOW)).toBe('Oct 2025');
  });

  it('is pure: same inputs, same output', () => {
    expect(relativeDate('2025-05-30', NOW)).toBe(relativeDate('2025-05-30', new Date(NOW.getTime())));
  });
});
