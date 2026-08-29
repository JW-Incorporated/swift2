import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint FeedbackButton.test.ts documents), so this is a source-level
// regression pin for #3396: the 11px kickers and CTAs on both doorway
// variants render theme accent as small text, which fails WCAG 1.4.3 on
// eras whose raw accent doesn't clear 4.5:1 — they must use the
// small-text-safe token (#659's pattern), never the raw accent.
const src = readFileSync(join(__dirname, 'DoorwayCard.tsx'), 'utf8');

describe('DoorwayCard — #3396 (kicker/CTA contrast)', () => {
  it('renders no small text in the raw accent color', () => {
    expect(src).not.toMatch(/text-\[color:var\(--era-accent\)\]/);
  });

  it('kickers and CTAs (2 per doorway variant) use the small-text-safe accent token', () => {
    const matches = src.match(/text-\[color:var\(--era-accent-text\)\]/g) ?? [];
    expect(matches).toHaveLength(4);
  });
});
