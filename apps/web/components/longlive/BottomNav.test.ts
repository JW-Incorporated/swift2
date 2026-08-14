import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint TimelineScrubber.test.ts documents) — source-level regression
// pin for re-review finding E (2026-08-13).
describe('BottomNav — re-review finding E (no active tab on the mobile front door)', () => {
  it('treats the landing page as the Eras destination, matching the desktop toggle', () => {
    const src = readFileSync(join(__dirname, 'BottomNav.tsx'), 'utf8');
    // LandingPage's own desktop ModeToggle hardcodes mode="era" on landing;
    // BottomNav must agree so `aria-current` lands on the same tab.
    expect(src).toContain("mode === 'landing' ? 'era' : mode");
    expect(src).toContain('const active = currentMode === tab.mode');
    expect(src).not.toContain('const active = mode === tab.mode');
  });
});
