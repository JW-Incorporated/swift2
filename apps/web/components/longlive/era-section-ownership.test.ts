import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The `inlineVideoMomentIds` ownership rule (packages/experience/src/
// era-feed.ts) only holds if the caller hands it the moments actually on
// screen (post-filter), not the full era list. There are no component-render
// tests in this suite (vitest runs in a `node` environment), so this is a
// source lock in the idiom of close-affordance.test.ts — split out of
// era-feed.test.ts in OS-022 when the feed-building logic moved to
// `@swift2/experience` (that package must not import from `apps/web`).
//
// OS-032 moved the actual `inlineVideoMomentIds` call site from
// `EraSection.tsx` into the shared `buildEraStreamViewModel` pipeline
// (`packages/experience/src/era-stream.ts`) so apps/mobile's native era
// stream gets the same ownership rule by construction (see era-stream.ts's
// header doc). The invariant this test locks moved with it; `EraSection.tsx`
// itself is checked instead for wiring the shared builder rather than
// reimplementing ownership inline.
const eraStreamSrc = readFileSync(
  new URL('../../../../packages/experience/src/era-stream.ts', import.meta.url),
  'utf8',
);
const eraSectionSrc = readFileSync(new URL('./EraSection.tsx', import.meta.url), 'utf8');

describe('era-stream view-model wires ownership to the rendered list', () => {
  it('derives the video owners from `visible` (the filtered feed), never from the full era list', () => {
    expect(eraStreamSrc).toContain('inlineVideoMomentIds(visible)');
    expect(eraStreamSrc).not.toContain('inlineVideoMomentIds(items)');
  });

  it('EraSection.tsx calls the shared builder rather than reimplementing ownership', () => {
    expect(eraSectionSrc).toContain('buildEraStreamViewModel');
    expect(eraSectionSrc).not.toContain('inlineVideoMomentIds');
  });
});
