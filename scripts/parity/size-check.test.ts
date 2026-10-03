import { describe, expect, it } from 'vitest';
import { evaluateSizes } from './size-check.mjs';

const baseline = { ios: { bytes: 1000 }, android: { bytes: 2000 } };

describe('evaluateSizes', () => {
  it('passes when under the limit', () => {
    const r = evaluateSizes({ ios: { bytes: 1100 }, android: { bytes: 1900 } }, baseline);
    expect(r.ok).toBe(true);
    expect(r.rows).toHaveLength(2);
  });

  it('passes at exactly 15% growth', () => {
    const r = evaluateSizes({ ios: { bytes: 1150 }, android: { bytes: 2300 } }, baseline);
    expect(r.ok).toBe(true);
  });

  it('fails when over 15%', () => {
    const r = evaluateSizes({ ios: { bytes: 1151 }, android: { bytes: 2000 } }, baseline);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/ios/);
  });

  it('fails when a platform export is missing', () => {
    const r = evaluateSizes({ ios: { bytes: 1000 } }, baseline);
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/android: no export output/);
  });

  it('fails clearly when the baseline is missing', () => {
    const r = evaluateSizes({ ios: { bytes: 1 }, android: { bytes: 1 } }, undefined);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/baseline missing.*--update/);
  });
});
