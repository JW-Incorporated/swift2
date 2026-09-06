import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// FeedbackButton has no jsdom/testing-library render harness in this repo
// (same constraint TimelineScrubber.test.ts documents), so these are
// source-level regression pins for two re-review findings (2026-08-13).
const src = readFileSync(join(__dirname, 'FeedbackButton.tsx'), 'utf8');
const globalsCss = readFileSync(join(__dirname, '..', '..', 'app', 'globals.css'), 'utf8');

/** The idle floating cluster: everything from the trigger row's marker down. */
const idleCluster = src.slice(src.indexOf('data-social-hide="feedback-button"'));

describe('FeedbackButton — re-review finding D (dismiss X covered the trigger on mobile)', () => {
  it('lays the dismiss button and the trigger out as siblings, not an overlapping absolute badge', () => {
    // The old bug: `.era-icon-btn`'s 44px floor made a `size-5` badge,
    // absolutely positioned over the icon-only mobile trigger, cover nearly
    // all of it. The fix removes the absolute overlap and uses a flex row.
    expect(src).not.toMatch(/absolute -right-1\.5 -top-1\.5/);
    expect(src).not.toMatch(/grid size-5 place-items-center/);
    expect(src).toContain("flex items-center gap-2 md:bottom-4");
  });

  it('both buttons still carry the 44px `.era-icon-btn` floor', () => {
    const dismissAt = src.indexOf('Dismiss the feedback button for this session');
    const after = src.slice(dismissAt, dismissAt + 200);
    expect(after).toContain('era-icon-btn');
  });
});

describe('FeedbackButton — "an X in a circle... as if there\'s an invisible pop up"', () => {
  // Wyatt, 2026-09-05. On a phone the bottom-right corner showed a bright,
  // isolated X in a solid circle with nothing legible next to it, so it read
  // as the close button of a pop-up that had failed to render. Two causes,
  // both pinned here, and both invisible at desktop width — which is why an
  // earlier look at this found nothing.

  it('never breakpoint-hides the trigger label, so the cluster names itself at every width', () => {
    // Cause 1: `hidden sm:inline` on the label collapsed the trigger to an
    // unlabelled icon under 640px, leaving the dismiss X as the only legible
    // thing in the corner. The label is what ties the X to a "Feedback"
    // control instead of to an imaginary dialog.
    expect(idleCluster).toContain('<span>Feedback</span>');
    // Scoped to real class attributes — the prose above this assertion's
    // subject in the component names the old `hidden sm:inline` too.
    for (const [, classes] of idleCluster.matchAll(/className="([^"]*)"/g)) {
      expect(classes).not.toMatch(/\bhidden\b/);
    }
  });

  it('renders the session-dismiss X in the quiet icon-button variant, not the loud one', () => {
    // Cause 2: plain `.era-icon-btn` is the maximum-contrast solid inversion
    // (#525) — correct for an overlay's close X, backwards for a control that
    // must sit *below* the trigger beside it in the visual hierarchy.
    const dismissAt = idleCluster.indexOf('Dismiss the feedback button for this session');
    const dismissBtn = idleCluster.slice(dismissAt, dismissAt + 220);
    expect(dismissBtn).toContain('era-icon-btn--quiet');
  });

  it('does not try to restyle an `.era-icon-btn` with a Tailwind `bg-*` utility', () => {
    // The trap that made the first attempt at this inert: globals.css is
    // ordered AFTER Tailwind's utilities, so `.era-icon-btn`'s `background`
    // beats any equal-specificity `bg-…` class a caller adds. Restyling has
    // to happen in the stylesheet (the `--quiet` variant), never here.
    const dismissAt = idleCluster.indexOf('Dismiss the feedback button for this session');
    const dismissBtn = idleCluster.slice(dismissAt, dismissAt + 220);
    expect(dismissBtn).not.toMatch(/\bbg-[a-z0-9[\]/.-]+/);
  });

  it('defines `.era-icon-btn--quiet` after `.era-icon-btn`, which is what makes it win', () => {
    const base = globalsCss.indexOf('.era-icon-btn {');
    const quiet = globalsCss.indexOf('.era-icon-btn--quiet {');
    expect(base).toBeGreaterThan(-1);
    expect(quiet).toBeGreaterThan(base);
    // Quiet must actually recede: a translucent surface, not the solid
    // `var(--era-ink)` inversion of the base rule.
    const rule = globalsCss.slice(quiet, globalsCss.indexOf('}', quiet));
    expect(rule).toContain('--era-surface');
    expect(rule).not.toContain('background: var(--era-ink)');
  });
});

describe('FeedbackButton — re-review finding G (dismissed state flashed back on reload)', () => {
  it('hydrates the dismissed flag in a pre-paint layout effect, not a post-paint effect', () => {
    expect(src).toContain('useLayoutEffect');
    expect(src).toMatch(/useLayoutEffect\(\(\) => \{\s*if \(readDismissed\(\)\) setDismissed\(true\);/);
    // Never read storage during render — that breaks SSR.
    expect(src).not.toMatch(/const \[dismissed, setDismissed\] = useState\(readDismissed\(\)\)/);
  });
});

describe('FeedbackButton — #835 (outcomes silent to screen readers)', () => {
  it('wraps the submit outcome in a persistent live region', () => {
    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
    // The region itself has to stay mounted across the status swap — it
    // can't be inside the ternary it wraps.
    const liveRegionAt = src.indexOf('role="status"');
    const ternaryAt = src.indexOf("status === 'sent' ?");
    expect(liveRegionAt).toBeGreaterThan(-1);
    expect(liveRegionAt).toBeLessThan(ternaryAt);
  });

  it('gives the error message its own assertive role', () => {
    expect(src).toMatch(/role="alert"[\s\S]{0,40}className="mt-2 text-xs text-red-400"/);
  });

  it('gives the textarea a real accessible name, not just a placeholder', () => {
    expect(src).toContain('Describe the issue');
    expect(src).toMatch(/<label htmlFor=\{textareaId\}/);
    expect(src).toMatch(/<textarea\s+id=\{textareaId\}/);
  });
});
