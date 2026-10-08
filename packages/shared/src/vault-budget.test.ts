import { describe, expect, it } from 'vitest';
import { TIER0_BUDGET, evaluateTier0Budget } from './vault-budget';

describe('evaluateTier0Budget', () => {
  it('passes a small payload', () => {
    const r = evaluateTier0Budget({ gzipBytes: 50_000, parsedBytes: 300_000 });
    expect(r.withinBudget).toBe(true);
    expect(r.overBy).toEqual({ gzipBytes: 0, parsedBytes: 0 });
    expect(r.gzipRatio).toBeLessThan(1);
  });

  it('is within budget exactly at the limit', () => {
    const r = evaluateTier0Budget({
      gzipBytes: TIER0_BUDGET.gzipBytes,
      parsedBytes: TIER0_BUDGET.parsedBytes,
    });
    expect(r.withinBudget).toBe(true);
    expect(r.gzipRatio).toBe(1);
  });

  it('fails when gzip exceeds budget and reports the overage', () => {
    const r = evaluateTier0Budget({
      gzipBytes: TIER0_BUDGET.gzipBytes + 1024,
      parsedBytes: 1_000,
    });
    expect(r.withinBudget).toBe(false);
    expect(r.overBy.gzipBytes).toBe(1024);
    expect(r.overBy.parsedBytes).toBe(0);
  });

  it('fails when parsed size exceeds budget even if gzip is fine', () => {
    const r = evaluateTier0Budget({
      gzipBytes: 1_000,
      parsedBytes: TIER0_BUDGET.parsedBytes + 500,
    });
    expect(r.withinBudget).toBe(false);
    expect(r.overBy.parsedBytes).toBe(500);
  });
});
