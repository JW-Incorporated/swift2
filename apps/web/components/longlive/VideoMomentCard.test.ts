import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Source-level regression pin for #3396, same harness constraint and same
// shape as DoorwayCard.test.ts / MomentCardButton.test.ts: the 11px video
// kind kicker must use the small-text-safe accent token (#659's pattern),
// never the raw accent, which fails WCAG 1.4.3 on low-contrast era accents.
const src = readFileSync(join(__dirname, 'VideoMomentCard.tsx'), 'utf8');

describe('VideoMomentCard — #3396 (kind kicker contrast)', () => {
  it('renders no small text in the raw accent color', () => {
    expect(src).not.toMatch(/text-\[color:var\(--era-accent\)\]/);
  });

  it('the kind kicker uses the small-text-safe accent token', () => {
    expect(src).toMatch(
      /text-\[color:var\(--era-accent-text\)\]"[\s\S]{0,60}Clapperboard/,
    );
  });
});
