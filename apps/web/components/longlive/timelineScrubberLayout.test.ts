import { describe, expect, it } from 'vitest';
import { SCRUBBER_CONTAINER_CLASS, SCRUBBER_RAIL_CLASS } from './timelineScrubberLayout';

describe('TimelineScrubber layout', () => {
  // Regression for the mobile rail drift: `inset-y-0` tracks the dynamic
  // viewport, which resizes when the mobile URL bar collapses/expands on
  // scroll, so the flex-centered rail slid down and up with every scroll
  // direction change. What carries the fix: the container is top-anchored
  // with a small-viewport height (h-svh — constant regardless of browser
  // chrome), and the rail uses the same stable unit (svh, never plain vh).
  it('anchors the rail to the small viewport so the URL bar cannot move it', () => {
    expect(SCRUBBER_CONTAINER_CLASS).toContain('fixed');
    expect(SCRUBBER_CONTAINER_CLASS).toContain('top-0');
    expect(SCRUBBER_CONTAINER_CLASS).toContain('h-svh');
    expect(SCRUBBER_CONTAINER_CLASS).not.toContain('inset-y-0');
    expect(SCRUBBER_CONTAINER_CLASS).not.toContain('bottom-0');

    expect(SCRUBBER_RAIL_CLASS).toContain('svh');
    expect(SCRUBBER_RAIL_CLASS).not.toMatch(/\d+vh/); // svh only — no dynamic-viewport vh
  });
});
