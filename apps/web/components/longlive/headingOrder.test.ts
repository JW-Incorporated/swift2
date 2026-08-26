import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Heading levels as they appear in a component's source, in JSX order. */
function headingLevels(relPath: string): number[] {
  const src = readFileSync(new URL(relPath, import.meta.url), 'utf8');
  return [...src.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
}

// Regression for #703: card/beat/look titles are h3, and nothing rendered an
// h2 between them and the surface's h1 (era hero in EraSection, thread title
// in ThreadsMode) — axe `heading-order`, every era and two thread surfaces.
// The fix is a visually-hidden h2 introducing each list; these tests pin the
// resulting source-order outline so a card redesign can't silently reopen the
// jump.
//
// PLAN.md P3 step 15 split EraSection.tsx's single-file layout into several
// components (EraFeedList's h2, the card kinds' h3s) — see MAP.md. Source
// order is no longer document order within one file, so the outline is
// pinned per file instead: EraSection contributes only the h1, EraFeedList
// contributes only the h2 that must come next, and every card-kind file
// (rendered inside EraFeedList, below its h2) contributes only h3s — none of
// them can reopen an h1/h2 further down the tree.
describe('heading outline has no h1 → h3 jumps (#703)', () => {
  it('EraSection renders only the era hero h1 — the feed heading lives in EraFeedList', () => {
    expect(headingLevels('./EraSection.tsx')).toEqual([1]);
  });

  it('EraFeedList opens the feed with its own h2, and nothing else', () => {
    expect(headingLevels('./EraFeedList.tsx')).toEqual([2]);
  });

  it.each([
    ['./MomentCardButton.tsx'],
    ['./VideoMomentCard.tsx'],
    ['./DoorwayCard.tsx'],
  ])('%s only ever contributes h3s below EraFeedList\'s h2', (relPath) => {
    const levels = headingLevels(relPath);
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.every((l) => l === 3)).toBe(true);
  });

  it.each([
    ['./runway/RunwayThread.tsx'],
    ['./proposal/ProposalThread.tsx'],
  ])('%s opens with an h2, before any h3 card title', (relPath) => {
    const levels = headingLevels(relPath);
    // The thread h1 lives in ThreadsMode, so inside the thread component the
    // first heading must be an h2 — an h3 first re-creates the jump.
    expect(levels[0]).toBe(2);
    expect(levels.length).toBeGreaterThan(1);
  });
});
