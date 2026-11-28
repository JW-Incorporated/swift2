import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #7135 / WCAG 2.5.8: the constellation's floating node-label button was
// `py-0.5` + `text-[10px]` ≈ 21px tall — under the 24px target minimum on
// every label. jsdom has no layout, so guard the class that sets the floor:
// `min-h-6` (24px, border-box) with flex centring for the text.

const SRC = readFileSync(
  fileURLToPath(new URL('./ClueWebConstellation.tsx', import.meta.url)),
  'utf8',
);

describe('#7135 Clue Web label pill meets the 24px target floor', () => {
  const pill = SRC.match(/className="(pointer-events-auto absolute z-10 [^"]*rounded-full[^"]*)"/);

  it('finds the floating label button', () => {
    expect(pill).not.toBeNull();
  });

  it('sets a 24px minimum height with vertically centred text', () => {
    const classes = pill![1]!.split(/\s+/);
    expect(classes).toContain('min-h-6');
    expect(classes).toContain('flex');
    expect(classes).toContain('items-center');
  });
});
