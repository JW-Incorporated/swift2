import type { ContentTag } from './types';

/** Accent hue per tag — kept subtle so era theming still dominates. */
export const TAG_META: Record<ContentTag, { label: string; hue: string }> = {
  Music: { label: 'Music', hue: '199 89% 60%' },
  Fashion: { label: 'Fashion', hue: '330 81% 66%' },
  Tour: { label: 'Tour', hue: '38 92% 60%' },
  Relationship: { label: 'Relationship', hue: '350 89% 66%' },
  Lore: { label: 'Lore', hue: '265 84% 70%' },
};

export const ALL_TAGS: ContentTag[] = ['Music', 'Fashion', 'Tour', 'Relationship', 'Lore'];
