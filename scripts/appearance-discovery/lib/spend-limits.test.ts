import { describe, expect, it } from 'vitest';
import { clampMaxPerRun, HARD_MAX_PER_RUN } from './spend-limits.mjs';

describe('clampMaxPerRun (codex review round 2/3, kanban t_ac1281ef)', () => {
  it('passes through a requested value under the hard ceiling unchanged', () => {
    expect(clampMaxPerRun(10)).toBe(10);
    expect(clampMaxPerRun(1)).toBe(1);
  });

  it('clamps a requested value at the hard ceiling', () => {
    expect(clampMaxPerRun(HARD_MAX_PER_RUN)).toBe(HARD_MAX_PER_RUN);
  });

  it('clamps an oversized --max dispatch input down to the hard ceiling', () => {
    expect(clampMaxPerRun(999)).toBe(HARD_MAX_PER_RUN);
    expect(clampMaxPerRun(Number.MAX_SAFE_INTEGER)).toBe(HARD_MAX_PER_RUN);
  });

  it('supports an explicit override ceiling for isolated testing', () => {
    expect(clampMaxPerRun(50, 5)).toBe(5);
    expect(clampMaxPerRun(3, 5)).toBe(3);
  });
});
