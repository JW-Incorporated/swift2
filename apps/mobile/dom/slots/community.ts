import { CommunitySection } from '@swift2/ui/reader/community/CommunitySection';
import { register } from './instance';

// WP2.10-D: the community mode surface. AppReader (D2) maps `surface:<mode>` to
// ReaderSlots.surfaces[mode]. External _blank anchors in CommunityCard are handled
// by the app adapter's capture-phase click listener (no handling lives here).
export const COMMUNITY_SLICE = 'community';
export const COMMUNITY_SLOTS = {
  'surface:community': CommunitySection,
} as const;

register({ slice: COMMUNITY_SLICE, slots: COMMUNITY_SLOTS });
