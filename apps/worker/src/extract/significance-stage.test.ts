import { describe, expect, it, vi } from 'vitest';
import type { ExtractUsageStore } from './usage-store';
import { assessSignificance, recordSignificance, significanceMode } from './significance-stage';
import { emptyResult } from './extract-stage-result';
import type { ExtractedCurrentItem } from './types';

const STORE = {} as ExtractUsageStore;
const NOW = new Date('2026-11-08T12:00:00.000Z');
const SOURCES = [
  { outletName: 'People', url: 'https://people.com/a', tier: 'established' as const },
  { outletName: 'People again', url: 'https://people.com/b', tier: 'established' as const },
  { outletName: 'Variety', url: 'https://variety.com/c', tier: 'established' as const },
];
const item = (overrides: Partial<ExtractedCurrentItem> = {}): ExtractedCurrentItem => ({
  observedOn: '2026-11-08',
  category: 'tour',
  tags: [],
  headline: 'Taylor announces a new tour date in Toronto',
  summary: '',
  detail: '',
  symbols: [],
  entities: [],
  statusHint: 'reported',
  facts: [{ id: 'f1', claim: 'A tour date was announced.', attribution: 'People', confidence: 'reported' }],
  ...overrides,
});

describe('significanceMode', () => {
  it('defaults to off and only accepts on or shadow', () => {
    expect(significanceMode({})).toBe('off');
    expect(significanceMode({ NEWS_SIGNIFICANCE: ' ON ' })).toBe('on');
    expect(significanceMode({ NEWS_SIGNIFICANCE: 'shadow' })).toBe('shadow');
    expect(significanceMode({ NEWS_SIGNIFICANCE: 'yes' })).toBe('off');
  });
});

describe('assessSignificance', () => {
  it('holds a rule match as tier 3 with model rules, without calling the judge', async () => {
    const judge = vi.fn();
    const out = await assessSignificance(STORE, item({ category: 'sighting', headline: 'Taylor spotted in Nashville' }), SOURCES, judge, NOW);
    expect(judge).not.toHaveBeenCalled();
    expect(out).toEqual({
      kind: 'hold',
      holdReason: 'not_notable:sighting_no_event',
      verdict: { tier: 3, reason: 'rule:sighting_no_event', model: 'rules', at: NOW.toISOString() },
    });
  });

  it('passes the judge distinct-host heat and holds its tier 3', async () => {
    const judge = vi.fn().mockResolvedValue({ status: 'ok', tier: 3, reason: 'gossip', model: 'claude-opus-5-5' });
    const out = await assessSignificance(STORE, item(), SOURCES, judge, NOW);
    expect(judge).toHaveBeenCalledWith(STORE, expect.objectContaining({ heat: 2, facts: ['A tour date was announced.'] }));
    expect(out).toMatchObject({ kind: 'hold', holdReason: 'not_notable:judge', verdict: { tier: 3, reason: 'gossip' } });
  });

  it('passes tiers 1 and 2 and surfaces a deferral', async () => {
    const ok = (tier: number) => vi.fn().mockResolvedValue({ status: 'ok', tier, reason: 'r', model: 'm' });
    expect(await assessSignificance(STORE, item(), SOURCES, ok(1), NOW)).toMatchObject({ kind: 'pass', verdict: { tier: 1 } });
    expect(await assessSignificance(STORE, item(), SOURCES, ok(2), NOW)).toMatchObject({ kind: 'pass', verdict: { tier: 2 } });
    const deferred = vi.fn().mockResolvedValue({ status: 'deferred', reason: 'budget_exhausted' });
    expect(await assessSignificance(STORE, item(), SOURCES, deferred, NOW)).toEqual({ kind: 'deferred', reason: 'budget_exhausted' });
  });
});

describe('recordSignificance', () => {
  it('counts tiers, holds by reason and deferrals', () => {
    const result = emptyResult();
    const verdict = (tier: 1 | 2 | 3) => ({ tier, reason: 'r', model: 'm', at: 'x' });
    recordSignificance(result, { kind: 'pass', verdict: verdict(1) });
    recordSignificance(result, { kind: 'hold', holdReason: 'not_notable:judge', verdict: verdict(3) });
    recordSignificance(result, { kind: 'hold', holdReason: 'not_notable:judge', verdict: verdict(3) });
    recordSignificance(result, { kind: 'deferred', reason: 'no_token' });
    expect(result.tierCounts).toEqual({ '1': 1, '3': 2 });
    expect(result.significanceHeld).toEqual({ 'not_notable:judge': 2 });
    expect(result.significanceDeferred).toBe(1);
  });
});
