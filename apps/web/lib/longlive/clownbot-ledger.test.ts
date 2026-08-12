import { describe, expect, it } from 'vitest';

import { ledger, ledgerTally, recentLedger, wigCountLine } from './clownbot-ledger';
import { NAME_REGISTRY, resolveTheoryName } from './clownbot-names';
import type { Receipt } from './clownbot-receipts';

describe('the CLOWNED / CONFIRMED ledger', () => {
  it('has entries on both sides', () => {
    const tally = ledgerTally();
    expect(tally.confirmed).toBeGreaterThan(0);
    expect(tally.clowned).toBeGreaterThan(0);
  });

  it('every entry carries a source — the ledger cannot contain hearsay', () => {
    for (const entry of ledger()) {
      expect(entry.sources.length, `${entry.id} has no source`).toBeGreaterThan(0);
      for (const s of entry.sources) expect(s.url).toMatch(/^https?:\/\//);
    }
  });

  it('every entry states what was believed and when', () => {
    for (const entry of ledger()) {
      expect(entry.theory.length).toBeGreaterThan(10);
      expect(entry.when.length).toBeGreaterThan(0);
    }
  });

  it('ids are unique', () => {
    const all = ledger();
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
  });

  it('puts dated entries first, newest first', () => {
    const dated = ledger().filter((e) => e.sortDate);
    for (let i = 1; i < dated.length; i += 1) {
      expect(dated[i - 1].sortDate! >= dated[i].sortDate!).toBe(true);
    }
  });

  it('includes the Super Bowl clowning — the house exhibit', () => {
    const entry = ledger().find((e) => e.id === 'lore:superbowl-lx-swiftie-theory');
    expect(entry).toBeDefined();
    expect(entry!.verdict).toBe('clowned');
  });

  it('keeps the losses in public', () => {
    expect(wigCountLine()).toMatch(/\d+ called, \d+ clowned/);
  });

  it('recentLedger honours its limit', () => {
    expect(recentLedger(3).length).toBeLessThanOrEqual(3);
  });

  it('memoises', () => {
    expect(ledger()).toBe(ledger());
  });
});

function receipt(id: string): Receipt {
  return {
    id,
    kind: 'lore',
    date: '2025-01-01',
    dateLabel: '2025-01-01',
    title: 't',
    detail: 'd',
    sources: [],
    status: null,
    eraId: null,
  };
}

describe('theory naming — deterministic reuse without cross-session memory', () => {
  it('pins the canonical name from a cited receipt', () => {
    const got = resolveTheoryName('anything at all', [receipt('lore:rep-tv-debut-tv')], 'Some Other Name');
    expect(got).toEqual({ name: 'Debutation', canonical: true });
  });

  it('pins the canonical name from the question alone', () => {
    const got = resolveTheoryName('will we ever get rep tv', [], null);
    expect(got?.name).toBe('Debutation');
    expect(got?.canonical).toBe(true);
  });

  it('the canonical name beats whatever the model coined — same theory, same name', () => {
    const a = resolveTheoryName('super bowl theory', [], 'Bot Coined A');
    const b = resolveTheoryName('the halftime clue trail', [], 'Bot Coined B');
    expect(a?.name).toBe(b?.name);
    expect(a?.canonical).toBe(true);
  });

  it('falls back to the model name when nothing canonical matches', () => {
    const got = resolveTheoryName('what about the cardigan sleeve', [], 'The Sleeve Hypothesis');
    expect(got).toEqual({ name: 'The Sleeve Hypothesis', canonical: false });
  });

  it('rejects a model "name" that is really a sentence', () => {
    const long = 'x'.repeat(200);
    expect(resolveTheoryName('no match here at all', [], long)).toBeNull();
    expect(resolveTheoryName('no match here at all', [], 'a')).toBeNull();
    expect(resolveTheoryName('no match here at all', [], 42)).toBeNull();
    expect(resolveTheoryName('no match here at all', [], null)).toBeNull();
  });

  it('every registry entry is reachable', () => {
    for (const entry of NAME_REGISTRY) {
      const viaId = entry.receiptIds?.[0]
        ? resolveTheoryName('', [receipt(entry.receiptIds[0])], null)
        : null;
      const viaKeyword = entry.keywords?.[0] ? resolveTheoryName(entry.keywords[0], [], null) : null;
      expect(viaId?.name ?? viaKeyword?.name, `${entry.name} unreachable`).toBe(entry.name);
    }
  });
});
