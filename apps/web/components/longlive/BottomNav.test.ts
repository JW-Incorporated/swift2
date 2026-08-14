import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint TimelineScrubber.test.ts documents) — source-level regression
// pin for re-review finding E (2026-08-13).
describe('BottomNav — mode drives the active tab directly', () => {
  it('has no special-cased front-door mode — the era stream is the front door (R1, PLAN.md 2026-08-14)', () => {
    const src = readFileSync(join(__dirname, 'BottomNav.tsx'), 'utf8');
    expect(src).toContain('const active = mode === tab.mode');
    expect(src).not.toContain('currentMode');
  });
});
