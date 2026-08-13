import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SCRUBBER_ANCHOR_CLASS,
  SCRUBBER_RAIL_CLASS,
  SCRUBBER_SCRIM_CLASS,
  SCRUBBER_SHELL_CLASS,
} from './timelineScrubberLayout';

describe('TimelineScrubber layout', () => {
  // Regression for the mobile rail drift: centering the rail inside an
  // `inset-y-0` box tracks the dynamic viewport, which resizes when the
  // mobile URL bar collapses/expands on scroll, so the rail slid down and
  // up with every scroll direction change. What carries the fix: the rail
  // is centered inside an ANCHOR that is top-anchored with a
  // small-viewport height (h-svh — constant regardless of browser
  // chrome), and the rail uses the same stable unit (svh, never plain
  // vh).
  it('anchors the rail to the small viewport so the URL bar cannot move it', () => {
    expect(SCRUBBER_ANCHOR_CLASS).toContain('top-0');
    expect(SCRUBBER_ANCHOR_CLASS).toContain('h-svh');
    expect(SCRUBBER_ANCHOR_CLASS).not.toContain('inset-y-0');
    expect(SCRUBBER_ANCHOR_CLASS).not.toContain('bottom-0');

    expect(SCRUBBER_RAIL_CLASS).toContain('svh');
    expect(SCRUBBER_RAIL_CLASS).not.toMatch(/\d+vh/); // svh only — no dynamic-viewport vh
  });

  // The opposite requirement for the legibility scrim (Codex P2 on #2077):
  // it must cover the FULL visible viewport, including the strip below
  // 100svh that appears while the URL bar is collapsed. So the SHELL
  // tracks the dynamic viewport (inset-y-0) and the scrim spans it —
  // never the svh anchor.
  it('lets the scrim cover the full dynamic viewport via the shell', () => {
    expect(SCRUBBER_SHELL_CLASS).toContain('fixed');
    expect(SCRUBBER_SHELL_CLASS).toContain('inset-y-0');
    expect(SCRUBBER_SCRIM_CLASS).toContain('inset-y-0');
    expect(SCRUBBER_SCRIM_CLASS).toContain('w-full');
  });

  // Constants alone cannot fail if the component stops using them. The
  // repo has no component-render setup (node test env, no jsdom or
  // testing-library, and the store needs providers), so pin the wiring
  // statically: each constant must appear as a className binding in the
  // component source, nested in the intended order, with no literal
  // vh/inset-y classes reintroduced alongside them.
  it('is actually wired into TimelineScrubber in shell > anchor > rail order', () => {
    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');

    const shellAt = src.indexOf('className={SCRUBBER_SHELL_CLASS}');
    const scrimAt = src.indexOf('className={SCRUBBER_SCRIM_CLASS}');
    const anchorAt = src.indexOf('className={SCRUBBER_ANCHOR_CLASS}');
    const railAt = src.indexOf('className={SCRUBBER_RAIL_CLASS}');

    expect(shellAt).toBeGreaterThan(-1);
    expect(scrimAt).toBeGreaterThan(shellAt);
    expect(anchorAt).toBeGreaterThan(scrimAt);
    expect(railAt).toBeGreaterThan(anchorAt);

    // No drifting unit smuggled back in as a literal class: the only vh-ish
    // sizing in the component must come from the pinned constants.
    expect(src).not.toMatch(/className="[^"]*\d+vh/);
    expect(src).not.toMatch(/className="[^"]*h-svh/); // svh sizing lives in the constants
  });
});
