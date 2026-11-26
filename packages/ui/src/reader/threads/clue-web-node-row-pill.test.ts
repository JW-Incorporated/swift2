import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #7136: ClueWebNodeRow's era/year pill painted the node era's raw accent as
// text over a 14% tint of itself — 3.66:1 on Red, 4.37:1 Speak Now, 4.46:1
// Midnights, under WCAG 1.4.3's 4.5:1. Same root cause as #3411/#3662/#3663;
// the fix is #3318's shape — solid accent fill + `accentFgFor` foreground,
// swept ≥4.5:1 across every theme by lib/theme.test.ts.

const SRC = readFileSync(
  fileURLToPath(new URL('./ClueWebNodeRow.tsx', import.meta.url)),
  'utf8',
);

describe('#7136 ClueWebNodeRow era pill never rebuilds text-on-self-tint', () => {
  it('has no color-mix tint of the era accent', () => {
    expect(SRC).not.toMatch(/color-mix\(in srgb, \$\{era\.theme\.accent\}/);
  });

  it('never paints the raw era accent as text', () => {
    expect(SRC).not.toMatch(/color:\s*era\.theme\.accent\b/);
  });

  it('derives the pill foreground via accentFgFor on a solid accent fill', () => {
    expect(SRC).toMatch(
      /backgroundColor:\s*era\.theme\.accent,\s*color:\s*accentFgFor\(era\.theme\)/,
    );
  });
});
