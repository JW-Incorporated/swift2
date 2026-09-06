import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The `inlineVideoMomentIds` ownership rule (packages/experience/src/
// era-feed.ts) only holds if the component hands it the moments actually on
// screen, not the full era list. There are no component-render tests in this
// suite (vitest runs in a `node` environment), so this is a source lock in
// the idiom of close-affordance.test.ts — split out of era-feed.test.ts in
// OS-022 when the feed-building logic moved to `@swift2/experience` (that
// package must not import from `apps/web`).
const src = readFileSync(new URL('./EraSection.tsx', import.meta.url), 'utf8');

describe('EraSection wires ownership to the rendered list', () => {
  it('derives the video owners from `visible`, never from the full era list', () => {
    expect(src).toContain('inlineVideoMomentIds(visible)');
    expect(src).not.toContain('inlineVideoMomentIds(items)');
  });
});
