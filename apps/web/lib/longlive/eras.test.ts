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
