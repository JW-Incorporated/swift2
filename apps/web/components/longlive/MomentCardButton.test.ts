import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint FeedbackButton.test.ts documents), so this is a source-level
// regression pin for #659.
const src = readFileSync(join(__dirname, 'MomentCardButton.tsx'), 'utf8');

describe('MomentCardButton — #659 (clue-glint contrast)', () => {
  it('the "Hidden clue" badge uses the small-text-safe accent token, not the raw accent', () => {
    expect(src).toMatch(
      /clue-glint[\s\S]{0,60}text-\[color:var\(--era-accent-text\)\]/,
    );
  });
});
