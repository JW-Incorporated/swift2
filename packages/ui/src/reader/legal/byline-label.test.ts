import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #6010: the byline link's visible avatar letter was missing from its
// accessible name, tripping WCAG 2.5.3 (axe `label-content-name-mismatch`).
// The aria-label must start with the persona mark so the full on-screen text
// is covered. Source-lock like locked-payoff-accent-fill.test.ts.

const SRC = readFileSync(fileURLToPath(new URL('./Byline.tsx', import.meta.url)), 'utf8');

describe('#6010 Byline aria-label includes the visible avatar letter', () => {
  it('starts the aria-label with the persona mark', () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{persona\.mark\}\. By \$\{persona\.name\}/);
  });

  it('keeps the avatar span aria-hidden so it stays decorative', () => {
    // The span wrapping {persona.mark} is the second occurrence of that
    // template expression (the first is inside the aria-label string).
    const first = SRC.indexOf('{persona.mark}');
    const spanOpen = SRC.indexOf('{persona.mark}', first + 1);
    expect(spanOpen).toBeGreaterThan(-1);
    expect(SRC.slice(Math.max(0, spanOpen - 200), spanOpen)).toMatch(/aria-hidden="true"/);
  });
});
