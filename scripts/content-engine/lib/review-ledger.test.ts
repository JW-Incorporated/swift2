import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  contentHash,
  coverage,
  emptyLedger,
  loadLedger,
  saveLedger,
  selectSlice,
} from './review-ledger.mjs';

// The selector IS the schedule design: which slice of a 1,137-item corpus the
// agent layer reviews tonight, given that a cloud runner starts from a clean
// checkout and knows nothing except this ledger.

const e = (id: string, hash: string, weight = 0) => ({ id, hash, weight });

describe('selectSlice priority', () => {
  it('puts CHANGED content first — a reviewed page that was edited is the worst case', () => {
    // It looks reviewed and carries claims nobody checked. Never-reviewed
    // content at least isn't claiming otherwise.
    const entries = [e('never', 'h1'), e('edited', 'h2-new'), e('same', 'h3')];
    const seen = { edited: { h: 'h2-old', d: '2026-08-01' }, same: { h: 'h3', d: '2026-08-01' } };
    const { picked } = selectSlice(entries, seen, 3);
    expect(picked.map((p) => p.why)).toEqual(['changed', 'new', 'rotation']);
    expect(picked[0].id).toBe('edited');
  });

  it('rotates oldest-reviewed first, so the corpus cycles instead of re-reading one era', () => {
    const entries = [e('a', 'h'), e('b', 'h'), e('c', 'h')];
    const seen = {
      a: { h: 'h', d: '2026-08-05' },
      b: { h: 'h', d: '2026-07-01' },
      c: { h: 'h', d: '2026-08-01' },
    };
    expect(selectSlice(entries, seen, 2).picked.map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('breaks ties on visibility, so the most public content is always at the front', () => {
    const entries = [e('low', 'h', 1), e('high', 'h', 99), e('mid', 'h', 50)];
    expect(selectSlice(entries, {}, 2).picked.map((p) => p.id)).toEqual(['high', 'mid']);
  });

  it('honours the budget — the batch count IS the cost cap', () => {
    const entries = Array.from({ length: 500 }, (_, i) => e(`i${i}`, 'h'));
    expect(selectSlice(entries, {}, 56).picked).toHaveLength(56);
  });

  it('reports the backlog it could not reach', () => {
    const entries = Array.from({ length: 100 }, (_, i) => e(`i${i}`, 'h'));
    const { counts, available } = selectSlice(entries, {}, 10);
    expect(counts.new).toBe(10);
    expect(available.new).toBe(100);
  });

  it('is stable across runs — the same corpus and ledger pick the same slice', () => {
    const entries = Array.from({ length: 50 }, (_, i) => e(`i${i}`, 'h', i % 7));
    expect(selectSlice(entries, {}, 10).picked).toEqual(selectSlice(entries, {}, 10).picked);
  });
});

describe('coverage', () => {
  it('counts never-reviewed and changed-since-review separately', () => {
    const entries = [e('a', 'h'), e('b', 'h-new'), e('c', 'h')];
    const seen = { a: { h: 'h', d: '2026-08-10' }, b: { h: 'h-old', d: '2026-07-01' } };
    expect(coverage(entries, seen, '2026-08-11')).toMatchObject({
      total: 3,
      reviewed: 2,
      never: 1,
      stale: 1,
      oldestReviewDays: 41,
    });
  });

  it('reports 0% on a virgin ledger — the state this whole layer was in', () => {
    expect(coverage([e('a', 'h'), e('b', 'h')], {}, '2026-08-11')).toMatchObject({
      reviewed: 0,
      pct: 0,
      never: 2,
    });
  });
});

describe('ledger persistence', () => {
  it('round-trips, and writes one entry per line so the daily diff is readable', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cie-ledger-'));
    const path = join(dir, 'agent-review-ledger.json');
    const led = emptyLedger();
    led.updated = '2026-08-11';
    led.factual = { 'b|key': { h: 'x', d: '2026-08-11' }, 'a|key': { h: 'y', d: '2026-08-10' } };

    await saveLedger(led, path);
    const text = await readFile(path, 'utf8');
    // Keys sorted + one per line: a 2,200-entry ledger must not produce a
    // 9,000-line diff every night.
    expect(text.indexOf('"a|key"')).toBeLessThan(text.indexOf('"b|key"'));
    expect(text.split('\n').filter((l) => l.includes('"h"'))).toHaveLength(2);
    expect(JSON.parse(text)).toEqual(led);
    expect(await loadLedger(path)).toEqual(led);
  });

  it('a missing or unreadable ledger reads as empty, never as a crash', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cie-ledger-'));
    expect(await loadLedger(join(dir, 'nope.json'))).toEqual(emptyLedger());
  });
});

describe('contentHash', () => {
  it('is stable for equal content and differs when the text changes', () => {
    expect(contentHash({ t: 'a' })).toBe(contentHash({ t: 'a' }));
    expect(contentHash({ t: 'a' })).not.toBe(contentHash({ t: 'a ' }));
  });
});
