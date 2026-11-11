import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #6011: the "Toggle filters" button carried aria-label="Toggle filters" while
// its visible text is the single word "Filter" — axe's whole-word substring
// check (WCAG 2.5.3 Label in Name) fails. The fix (matching #702 and #5471):
// drop the hand-written aria-label so the visible "Filter" text IS the
// accessible name, and expose the open/closed state via aria-expanded instead.

const SRC = readFileSync(
  fileURLToPath(new URL('./DecodeThread.tsx', import.meta.url)),
  'utf8',
);

// Isolate just the filters-toggle button block.
const btnStart = SRC.indexOf('showFilters ? ');
const btnBlock = SRC.slice(SRC.lastIndexOf('<button', btnStart), SRC.indexOf('</button>', btnStart) + 8);

describe('#6011 Decode "Toggle filters" button label-in-name', () => {
  it('no longer carries a hand-written aria-label that hides the visible word', () => {
    // The button block between the "Toggle filters" context and the next </button>
    const start = SRC.indexOf('onClick={() => setShowFilters');
    const block = SRC.slice(SRC.lastIndexOf('<button', start), SRC.indexOf('</button>', start));
    expect(block).not.toMatch(/aria-label/);
  });

  it('exposes the open/closed state through aria-expanded', () => {
    expect(btnBlock).toMatch(/aria-expanded=\{showFilters\}/);
  });

  it('still renders the visible "Filter" text', () => {
    expect(btnBlock).toMatch(/\n\s+Filter\n/);
  });
});
