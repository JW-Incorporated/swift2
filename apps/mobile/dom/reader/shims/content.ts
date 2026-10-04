// Shim for apps/web/lib/longlive/content.ts: same exports, live arrays that
// `fill()` populates in place instead of the baked vault literal.
import type { ContentItem, EraId, Milestone } from '@swift2/experience';
import { build, defaultThreadIdsForTags, type RawItem } from '@swift2/content-enrichment';

export { build, defaultThreadIdsForTags };
export type { RawItem };

export const CONTENT: ContentItem[] = [];
export const MILESTONES: Milestone[] = [];

export function contentForEra(eraId: EraId): ContentItem[] {
  return CONTENT.filter((c) => c.eraId === eraId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getContentItem(id: string): ContentItem | undefined {
  return CONTENT.find((c) => c.id === id);
}

export function getContentItemByIdOrSlug(value: string): ContentItem | undefined {
  return getContentItem(value) ?? CONTENT.find((c) => c.slug === value);
}

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}
