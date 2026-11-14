import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #6853: the revealed payoff's citation source links painted `--era-ink-soft`
// through an `opacity-60` class — effective #6a6973 on #15151d, 3.35:1, under
// WCAG 1.4.3's 4.5:1 for 11px text. Bare `--era-ink-soft` (no opacity) is the
// compliant token used elsewhere in the same card, so the fix is to drop the
// dimming. This source-locks the sources block against reintroducing it.

const SRC = readFileSync(
  fileURLToPath(new URL('./DecodeCard.tsx', import.meta.url)),
  'utf8',
);

const start = SRC.indexOf('clue.sources.map(');
const end = SRC.indexOf('</a>', start);
const LINK = SRC.slice(start, end);

describe('#6853 DecodeCard source links keep full-opacity text', () => {
  it('still has the source-link block to lock', () => {
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
  });

  it('applies no opacity reduction to the link text', () => {
    expect(LINK).not.toMatch(/\bopacity-(?!100\b)\d+/);
    expect(LINK).not.toMatch(/opacity:\s*0?\.\d/);
  });

  it('still colors the link with the compliant ink-soft token', () => {
    expect(LINK).toMatch(/color:\s*'var\(--era-ink-soft\)'/);
  });
});
