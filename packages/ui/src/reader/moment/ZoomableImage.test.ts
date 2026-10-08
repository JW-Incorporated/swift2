import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Same constraint as FeedbackButton.test.ts — no jsdom/testing-library render
// harness for these components in this repo, so these are source-level
// regression pins for #834 (lightbox zoom was pointer-only).
const src = readFileSync(join(__dirname, 'ZoomableImage.tsx'), 'utf8');

describe('ZoomableImage — #834 (no keyboard path to zoom)', () => {
  it('binds +/- (and their unshifted =/_ forms) to the same zoomByStep the buttons use', () => {
    expect(src).toMatch(/e\.key === '\+' \|\| e\.key === '='/);
    expect(src).toMatch(/zoomByStep\(1\.6\)/);
    expect(src).toMatch(/e\.key === '-' \|\| e\.key === '_'/);
    expect(src).toMatch(/zoomByStep\(1 \/ 1\.6\)/);
  });

  it('only pans on arrow keys while zoomed in, leaving 1x arrow keys for gallery paging', () => {
    expect(src).toMatch(/scaleRef\.current > 1 && e\.key\.startsWith\('Arrow'\)/);
  });

  it('stops the lightbox\'s own arrow-key handler from also firing on a pan keypress', () => {
    expect(src).toContain('stopImmediatePropagation');
  });

  it('gates the keyboard listener on `controls`, matching where the on-screen buttons render', () => {
    expect(src).toMatch(/useEffect\(\(\) => \{\s*if \(!controls\) return;/);
  });

  it('declares the shortcuts on the zoom buttons themselves', () => {
    expect(src).toMatch(/aria-label="Zoom out"\s*\n\s*aria-keyshortcuts="-"/);
    expect(src).toMatch(/aria-label="Zoom in"\s*\n\s*aria-keyshortcuts="\+"/);
  });
});
