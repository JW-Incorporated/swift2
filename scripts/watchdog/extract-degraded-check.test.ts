import { describe, expect, it } from 'vitest';
import { SUSTAINED_RUNS, verdict } from './extract-degraded-check.mjs';

const runs = (flags: boolean[]) =>
  flags.map((degraded, i) => ({ createdAt: `2026-10-09T${String(23 - i).padStart(2, '0')}:00:00Z`, degraded }));

describe('extract-degraded verdict', () => {
  it('alerts when the last N runs are all degraded', () => {
    expect(verdict(runs(Array(SUSTAINED_RUNS).fill(true)))).toBe('alert');
  });

  it('is ok when any recent run was healthy', () => {
    expect(verdict(runs([true, true, false, true, true, true]))).toBe('ok');
  });

  it('is ok with fewer than N runs of history', () => {
    expect(verdict(runs([true, true, true]))).toBe('ok');
  });

  it('ignores older healthy runs beyond the window', () => {
    expect(verdict(runs([...Array(SUSTAINED_RUNS).fill(true), false]))).toBe('alert');
  });

  it('is ok on an empty list', () => {
    expect(verdict([])).toBe('ok');
  });
});
