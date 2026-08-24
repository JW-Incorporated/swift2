import { describe, expect, it } from 'vitest';

import { confirmedEggs, currentTheories, relativeDate } from './clown-board';
import { LORE } from './clownbot-lore';
import { THEORIES_RAW } from './theories.generated';

const NOW = new Date('2026-08-24T12:00:00Z');

describe('currentTheories — column 1', () => {
  it('never pads: fewer than 10 in the corpus means fewer than 10 returned', () => {
    const items = currentTheories(NOW);
    // Real corpus, real count — asserted exactly so a future change to the
    // corpus fails this test loudly instead of silently padding.
    expect(items.length).toBe(9);
    expect(items.length).toBeLessThan(10);
  });

  it('caps at 10 even if the corpus were to grow past it', () => {
    expect(currentTheories(NOW).length).toBeLessThanOrEqual(10);
  });

  it('contains only unresolved theories and open rumors', () => {
    for (const item of currentTheories(NOW)) {
      const isVaultTheory = item.id.startsWith('theory:');
      const isLoreRumor = item.id.startsWith('lore:');
      expect(isVaultTheory || isLoreRumor).toBe(true);
    }
  });

  it('excludes every resolved theory outcome (confirmed, debunked, abandoned, unfalsifiable, partially_confirmed)', () => {
    const ids = new Set(currentTheories(NOW).map((i) => i.id));
    for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
      for (const note of notes ?? []) {
        if (note.outcome !== 'pending') {
          expect(ids.has(`theory:${eraId}:${note.slug}`)).toBe(false);
        }
      }
    }
  });

  it('excludes lore items that are confirmed or debunked, not open', () => {
    const ids = new Set(currentTheories(NOW).map((i) => i.id));
    for (const item of LORE) {
      if (item.status === 'confirmed' || item.status === 'debunked') {
        expect(ids.has(`lore:${item.id}`)).toBe(false);
      }
    }
  });

  it('is recency-ranked, newest first', () => {
    const items = currentTheories(NOW);
    for (let i = 1; i < items.length; i += 1) {
      expect(items[i - 1].date >= items[i].date).toBe(true);
    }
  });

  it('every item carries a non-empty title, blurb, prompt and ISO date', () => {
    for (const item of currentTheories(NOW)) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.blurb.length).toBeGreaterThan(0);
      expect(item.prompt.length).toBeGreaterThan(0);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('ids are unique', () => {
    const items = currentTheories(NOW);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('is deterministic: same corpus + same now => byte-identical board', () => {
    const a = currentTheories(NOW);
    const b = currentTheories(new Date(NOW.getTime()));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('never sorts a still-open era into the future relative to now', () => {
    const today = NOW.toISOString().slice(0, 10);
    for (const item of currentTheories(NOW)) {
      expect(item.date <= today).toBe(true);
    }
  });
});

describe('confirmedEggs — column 2', () => {
  it('is confirmed only: no debunked or clowned entry ever appears', () => {
    const items = confirmedEggs();
    expect(items.length).toBe(51);

    for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
      for (const note of notes ?? []) {
        if (note.outcome === 'debunked') {
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

  it('includes the Twelve-Twelve Cipher lore confirmation (a real ledger-backed confirmed egg)', () => {
    const items = confirmedEggs();
    expect(items.some((i) => i.id === 'lore:tloas-countdown-announcement')).toBe(true);
  });

  it('never includes the Super Bowl clowning — that is a debunk, not a confirm', () => {
    const items = confirmedEggs();
    expect(items.some((i) => i.id === 'lore:superbowl-lx-swiftie-theory')).toBe(false);
  });

  it('every item carries a non-empty title, blurb, prompt and ISO date', () => {
    for (const item of confirmedEggs()) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.blurb.length).toBeGreaterThan(0);
      expect(item.prompt.length).toBeGreaterThan(0);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('ids are unique', () => {
    const items = confirmedEggs();
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('is deterministic: same corpus => byte-identical board', () => {
    expect(JSON.stringify(confirmedEggs())).toBe(JSON.stringify(confirmedEggs()));
  });

  it('eggsOnly: true returns only planted-and-decoded easter eggs', () => {
    for (const item of confirmedEggs({ eggsOnly: true })) {
      expect(item.id.startsWith('theory:')).toBe(true);
      const [, eraId, slug] = item.id.split(':');
      const note = (THEORIES_RAW[eraId as keyof typeof THEORIES_RAW] ?? []).find((n) => n.slug === slug);
      expect(note?.kind).toBe('easter_egg');
    }
  });

  it('eggsOnly narrows the corpus: default and eggsOnly counts differ', () => {
    const all = confirmedEggs();
    const eggsOnly = confirmedEggs({ eggsOnly: true });
    expect(all.length).toBe(51);
    expect(eggsOnly.length).toBe(37);
    expect(eggsOnly.length).toBeLessThan(all.length);
  });

  it('limit caps the list to the most recent confirmations, newest first', () => {
    const all = confirmedEggs();
    const capped = confirmedEggs({ limit: 5 });
    expect(capped.length).toBe(5);
    expect(capped).toEqual(all.slice(0, 5));
  });

  it('omitting limit stays unlimited (existing behaviour untouched)', () => {
    expect(confirmedEggs({ eggsOnly: false }).length).toBe(51);
  });

  it('resolves every confirmed egg to a real era, grouped into the corpus\'s 11 era buckets', () => {
    const items = confirmedEggs({ eggsOnly: true });
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
