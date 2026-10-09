import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function blend(fg: string, bg: string, alpha: number): [number, number, number] {
  const f = rgb(fg);
  const b = rgb(bg);
  return [0, 1, 2].map((i) => Math.round(f[i]! * alpha + b[i]! * (1 - alpha))) as [number, number, number];
}

describe('era theme contrast', () => {
  it('accent2 clears 4.5:1 on bg, surface and surface2 for every era (A11Y-9)', () => {
    for (const era of ERAS) {
      const t = era.theme;
      for (const key of ['bg', 'surface', 'surface2'] as const) {
        const r = ratio(rgb(t.accent2), rgb(t[key]));
        expect(r, `${era.id} accent2 on ${key}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('form-field border (ink-soft at 75%) clears 3:1 on bg and surface for every era (A11Y-10, WCAG 1.4.11)', () => {
    for (const era of ERAS) {
      const t = era.theme;
      for (const key of ['bg', 'surface'] as const) {
        const r = ratio(blend(t.inkSoft, t[key], 0.75), rgb(t[key]));
        expect(r, `${era.id} ink-soft/75 on ${key}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('focus ring (accent) clears 3:1 on the era bg for every era (A11Y-10)', () => {
    for (const era of ERAS) {
      const r = ratio(rgb(era.theme.accent), rgb(era.theme.bg));
      expect(r, `${era.id} accent on bg`).toBeGreaterThanOrEqual(3);
    }
  });
});
