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
// jump. Source order is document order here: each file renders a single
// linear layout.
describe('heading outline has no h1 → h3 jumps (#703)', () => {
  it('EraSection puts an h2 between the era h1 and the first card h3', () => {
    const levels = headingLevels('./EraSection.tsx');
    expect(levels[0]).toBe(1); // era hero
    expect(levels[1]).toBe(2); // feed group heading
    levels.forEach((level, i) => {
      if (i > 0) expect(level).toBeLessThanOrEqual(levels[i - 1] + 1);
    });
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
