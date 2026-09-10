import type { ContentTag } from '@swift2/experience';

/** Accent hue per tag — kept subtle so era theming still dominates. */
// Fashion/Relationship/Lore lightness bumped from 66/66/70% (#659: pill text
// on its own 10%-alpha pill background fell as low as 3.65:1/3.51:1/3.39:1
// against some era surfaces) — verified >=4.5:1 against all 12 era surfaces
// at the pill's 10% background alpha (down from 16%, see MomentDetail.tsx).
export const TAG_META: Record<ContentTag, { label: string; hue: string }> = {
  Music: { label: 'Music', hue: '199 89% 60%' },
  Fashion: { label: 'Fashion', hue: '330 81% 72%' },
  Tour: { label: 'Tour', hue: '38 92% 60%' },
  Relationship: { label: 'Relationship', hue: '350 89% 74%' },
  Lore: { label: 'Lore', hue: '265 84% 77%' },
};

export const ALL_TAGS: ContentTag[] = ['Music', 'Fashion', 'Tour', 'Relationship', 'Lore'];
