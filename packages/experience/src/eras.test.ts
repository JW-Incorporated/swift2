import { describe, expect, it } from 'vitest';
import { CURRENT_ERA_ID, ERAS, erasBackFrom, jumpWindow } from './eras';

// Regression for #747: a first-mount jump (landing page → era pick) used to
// seed the stream window as { anchorId: pickedEra, count: 1 } — a window with
// nothing newer than the target, and the stream only ever appends *older*
// eras, so scrolling up toward newer eras was structurally impossible.
describe('jumpWindow', () => {
  it('anchors every jump at the current era so newer eras stay reachable', () => {
    for (const era of ERAS) {
      const { anchorId, count } = jumpWindow(era.id);
      expect(anchorId).toBe(CURRENT_ERA_ID);
      const rendered = erasBackFrom(anchorId, count).map((e) => e.id);
      // The window must span newest → target: the target itself is visible
      // and every newer era exists above it to scroll up to.
      expect(rendered[0]).toBe(CURRENT_ERA_ID);
      expect(rendered[rendered.length - 1]).toBe(era.id);
    }
  });

  it('jumping to the current era needs a window of exactly one', () => {
    expect(jumpWindow(CURRENT_ERA_ID)).toEqual({ anchorId: CURRENT_ERA_ID, count: 1 });
  });

  it('never returns a count below 1, even for unknown ids', () => {
    expect(jumpWindow('not-an-era').count).toBeGreaterThanOrEqual(1);
  });
});

// #659: the "Hidden clue" badge (MomentCardButton.tsx) paints
// text-[color:var(--era-accent-text)] — Red's own `accent` measured 3.73:1
// against its `surface`, below AA's 4.5:1 floor for that small text, even
// before the (now-removed) glint opacity dip made it worse. `accentText`
// verified against Red's surface/bg with a standalone contrast calculation
// (not re-run in-suite — see tags.test.ts).
describe('ERAS — #659 (accentText fallback for small text)', () => {
  it("sets a lighter accentText on Red, where the raw accent fails 4.5:1 on its own surface", () => {
    const red = ERAS.find((e) => e.id === 'red');
    expect(red?.theme.accentText).toBe('#df675f');
  });
});

// Clownbot tab: accent-coloured text sits on the fixed clown bg, on the era bg,
// on the era surface, and on the 15% accent chip over the clown/era bg.
describe('ERAS — accent text clears 4.5:1 on every Clownbot surface', () => {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi! + 0.05) / (lo! + 0.05);
  };
  const tint = (f: number[], b: number[]) => f.map((v, i) => v * 0.15 + b[i]! * 0.85);
  const CLOWN_BG = rgb('#17120e');
  it.each(ERAS.map((e) => ({ id: e.id, theme: e.theme })))('$id', ({ theme }) => {
    const fg = rgb(theme.accentText ?? theme.accent);
    const accent = rgb(theme.accent);
    const surfaces = [CLOWN_BG, tint(accent, CLOWN_BG), rgb(theme.bg), tint(accent, rgb(theme.bg)), rgb(theme.surface)];
    for (const s of surfaces) expect(ratio(fg, s)).toBeGreaterThanOrEqual(4.5);
  });
});
