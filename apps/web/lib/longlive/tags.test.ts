import { describe, expect, it } from 'vitest';
import { TAG_META } from './tags';

// #659: the tag-pill text (MomentDetail.tsx) is hsl(hue) on its own hue at
// low alpha over the era surface. Fashion/Relationship/Lore measured below
// 4.5:1 against some era surfaces at their original lightness (66/66/70%);
// bumped here, verified against all 12 era surfaces with a standalone
// contrast calculation (not re-run in-suite — this repo's tests pin
// structural/attribute values, not full contrast-ratio math).
describe('TAG_META — #659 (tag pill contrast)', () => {
  it('keeps the lightness bump for the three tags that measured below 4.5:1', () => {
    expect(TAG_META.Fashion.hue).toBe('330 81% 72%');
    expect(TAG_META.Relationship.hue).toBe('350 89% 74%');
    expect(TAG_META.Lore.hue).toBe('265 84% 77%');
  });

  it('leaves the two tags that already cleared 4.5:1 unchanged', () => {
    expect(TAG_META.Music.hue).toBe('199 89% 60%');
    expect(TAG_META.Tour.hue).toBe('38 92% 60%');
  });
});
