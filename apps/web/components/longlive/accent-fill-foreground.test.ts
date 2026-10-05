import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #3664: four call sites painted the theme's raw `--era-bg` as text directly
// on a solid `--era-accent` fill (Tailwind `text-bg` on `bg-accent`, or the
// same pairing via FilterBar's `--chip-fg`/`--chip-bg` custom properties).
// On Red that pairing measures 4.08:1, under WCAG 1.4.3's 4.5:1. The fix is
// the calibrated on-accent-fill token `--era-accent-fg` (#3318, swept ≥4.5:1
// across every theme by theme.test.ts). This file only source-locks the four
// components so the era-bg-on-accent pairing can't quietly return.

const SOURCES = [
  '../ui/button.tsx',
  './FeedbackButton.tsx',
  './WebNotificationSettings.tsx',
  './FilterBar.tsx',
].map((rel) => [rel, readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')] as const);

describe('#3664 accent fills never use era-bg as their text color', () => {
  it.each(SOURCES)('%s has no bg-accent … text-bg pairing left', (_rel, src) => {
    // Both utilities in one class string always share a line in these sources.
    expect(src).not.toMatch(/\bbg-accent\b[^\n]*\btext-bg\b|\btext-bg\b[^\n]*\bbg-accent\b/);
  });

  it.each(SOURCES)('%s never sets a chip foreground to var(--era-bg)', (_rel, src) => {
    expect(src).not.toMatch(/--chip-fg[^,\n]*var\(--era-bg\)/);
  });
});
