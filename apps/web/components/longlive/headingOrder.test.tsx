// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { EraSection } from './EraSection';
import { AppProvider } from '@/lib/longlive/store';
import { CURRENT_ERA_ID, getEra } from '@/lib/longlive/eras';

/** Heading levels as they appear in a component's source, in JSX order —
 *  still used for the two thread-surface files below, which this task's
 *  scope didn't include converting (no AppProvider-independent render path
 *  for RunwayThread/ProposalThread was in scope here). */
function headingLevels(relPath: string): number[] {
  const src = readFileSync(new URL(relPath, import.meta.url), 'utf8');
  return [...src.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
}

// Regression for #703: card/beat/look titles are h3, and nothing rendered an
// h2 between them and the surface's h1 (era hero in EraSection, thread title
// in ThreadsMode) — axe `heading-order`, every era and two thread surfaces.
// The fix is a visually-hidden h2 introducing each list; these tests pin the
// resulting heading outline.
describe('heading outline has no h1 → h3 jumps (#703)', () => {
  // Rendered for real (jsdom + AppProvider), instead of a source-string
  // regex pin, so the assertion tracks the outline actually delivered to
  // assistive tech (accounting for conditional rendering, filters, and
  // empty-feed states) rather than every <h*> literal appearing anywhere in
  // the file regardless of whether it renders.
  it('EraSection renders the era hero h1, and EraFeedList (nested inside it) contributes the only h2', () => {
    const era = getEra(CURRENT_ERA_ID);
    const { container } = render(
      <AppProvider>
        <EraSection era={era} />
      </AppProvider>,
    );

    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((el) =>
      Number(el.tagName.slice(1)),
    );

    // The era hero's h1 must come first, immediately followed by
    // EraFeedList's sr-only h2 before any h3 card title — never an
    // h1 → h3 jump.
    expect(headings[0]).toBe(1);
    expect(headings.filter((l) => l === 1)).toHaveLength(1);
    const h2Index = headings.indexOf(2);
    expect(h2Index).toBeGreaterThan(0);
    expect(headings.filter((l) => l === 2)).toHaveLength(1);
    // Every heading after the h2 (the card titles) is an h3 — never a
    // further h1/h2 reopening the jump the fix closed.
    for (const level of headings.slice(h2Index + 1)) {
      expect(level).toBe(3);
    }
  });

  it.each([['./runway/RunwayThread.tsx'], ['./proposal/ProposalThread.tsx']])(
    "%s opens with an h2, before any h3 card title",
    (relPath) => {
      const levels = headingLevels(relPath);
      // The thread h1 lives in ThreadsMode, so inside the thread component the
      // first heading must be an h2 — an h3 first re-creates the jump.
      expect(levels[0]).toBe(2);
      expect(levels.length).toBeGreaterThan(1);
    },
  );
});
