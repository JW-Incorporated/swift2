import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Same constraint as FeedbackButton.test.ts — no jsdom/testing-library render
// harness for these components in this repo, so these are source-level
// regression pins for #834 (lightbox photo could be nameless) and #659
// (tag pill contrast).
const src = readFileSync(join(__dirname, 'MomentDetail.tsx'), 'utf8');

describe('MomentDetail — #834 (lightbox photo can be nameless)', () => {
  it('falls back the lightbox image alt to the moment title when there is no caption', () => {
    expect(src).toContain('alt={img.caption ?? `Photo — ${title}`}');
  });

  it('threads the moment title into the lightbox for that fallback', () => {
    expect(src).toMatch(/function MomentLightbox\(\{[\s\S]{0,120}title,/);
    expect(src).toContain('title={item.title}');
  });
});

describe('MomentDetail — #659 (tag pill contrast)', () => {
  it('uses a lighter pill background so the tag text clears 4.5:1 on every era surface', () => {
    expect(src).toContain('hsl(${TAG_META[t].hue} / 0.1)');
    expect(src).not.toContain('hsl(${TAG_META[t].hue} / 0.16)');
  });
});
