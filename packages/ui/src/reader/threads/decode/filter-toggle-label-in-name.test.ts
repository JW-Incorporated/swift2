import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #6011: the Decode thread's filter toggle showed the visible word "Filter"
// but carried `aria-label="Toggle filters"`, failing WCAG 2.5.3 Label in Name
// (axe `label-content-name-mismatch`) — a voice-control user saying "click
// Filter" had no match. The fix is #702/#5471's shape: drop the custom label
// so the visible text is the accessible name, and expose the open/closed
// state via `aria-expanded` instead.

const SRC = readFileSync(
  fileURLToPath(new URL('./DecodeThread.tsx', import.meta.url)),
  'utf8',
);

const start = SRC.indexOf('onClick={() => setShowFilters');
const buttonStart = SRC.lastIndexOf('<button', start);
const buttonEnd = SRC.indexOf('</button>', start);
const BUTTON = SRC.slice(buttonStart, buttonEnd);

describe('#6011 Decode filter toggle keeps its visible text as its name', () => {
  it('still has the filter toggle button to lock', () => {
    expect(start).toBeGreaterThan(-1);
    expect(buttonStart).toBeGreaterThan(-1);
    expect(BUTTON).toMatch(/\n\s*Filter\n/);
  });

  it('carries no aria-label overriding the visible "Filter" text', () => {
    expect(BUTTON).not.toMatch(/aria-label=/);
  });

  it('announces open/closed state via aria-expanded', () => {
    expect(BUTTON).toMatch(/aria-expanded=\{showFilters\}/);
  });
});
