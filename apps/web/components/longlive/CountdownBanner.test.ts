import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint LandingMasthead.test.ts/TimelineScrubber.test.ts document) —
// source-level regression pin for the fail-soft/single-slot contract this
// component must never silently lose. The real behavioral coverage lives in
// packages/experience/src/current-feed.test.ts's `pickCountdownBannerItem`/
// `isLiveCountdown` tests — this file only pins that CountdownBanner.tsx
// actually calls through to them and never renders more than one slot.
const src = readFileSync(join(__dirname, 'CountdownBanner.tsx'), 'utf8');

describe('CountdownBanner — fail-soft, single-slot contract', () => {
  it('delegates the single-slot pick to pickCountdownBannerItem, never re-deriving it inline', () => {
    expect(src).toContain('pickCountdownBannerItem(currentItems, nowMs)');
  });

  it('renders nothing before the client clock resolves (no SSR flash of a stale countdown)', () => {
    expect(src).toContain('if (nowMs == null) return null;');
  });

  it('renders nothing when no item qualifies (fails soft, never an error/loading state)', () => {
    expect(src).toContain("if (!item || !item.countdownTargetAt) return null;");
  });

  it('resolves nowMs client-side only, via useEffect (never computed at module scope / SSR time)', () => {
    expect(src).toContain('useEffect(() => {');
    expect(src).toContain('setNowMs(Date.now());');
  });
});
