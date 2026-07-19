import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

/** Return the declaration block for a top-level selector, e.g. `.era-icon-btn`. */
function ruleBlock(selector: string): string {
  const marker = `${selector} {`;
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`selector not found in globals.css: ${selector}`);
  const end = css.indexOf('}', start);
  return css.slice(start + marker.length, end);
}

// #525: the shared close/icon-button class must stay an unmistakable
// affordance — solid (never translucent/theme-blended) and at least the
// 44px Apple/Material touch-target floor, enforced at the class level so
// no per-component padding can shrink it below the minimum.
describe('.era-icon-btn (#525 close-affordance floor)', () => {
  const block = ruleBlock('.era-icon-btn');

  it('enforces the 44px minimum tap target', () => {
    expect(block).toMatch(/min-width:\s*44px/);
    expect(block).toMatch(/min-height:\s*44px/);
  });

  it('centers the glyph so the minimum size does not misalign icons', () => {
    expect(block).toMatch(/display:\s*(inline-)?flex|display:\s*grid/);
    expect(block).toMatch(/align-items:\s*center|place-items:\s*center/);
  });

  it('has a fully opaque background — the original bug was a 70%-transparent, theme-tinted mix', () => {
    const background = block.match(/background:\s*([^;]+);/)?.[1] ?? '';
    expect(background).not.toBe('');
    expect(background).not.toContain('transparent');
  });
});
