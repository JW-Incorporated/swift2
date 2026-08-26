import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// FeedbackButton has no jsdom/testing-library render harness in this repo
// (same constraint TimelineScrubber.test.ts documents), so these are
// source-level regression pins for two re-review findings (2026-08-13).
const src = readFileSync(join(__dirname, 'FeedbackButton.tsx'), 'utf8');

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
