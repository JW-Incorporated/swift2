/**
 * Long Live — the Community section's data (item 4b,
 * docs/definition-of-done.md:136-142).
 *
 * Source: `data/communities.json` (generated_at 2026-08-14, 30 entries,
 * curated by four parallel platform researchers, then orchestrator-merged,
 * deduped, niche-normalised, rescored on a single scale and independently
 * spot-checked). The raw entries live in `communities-data-{a,b,c}.ts`
 * (split three ways purely for the 300-line file-length guideline) —
 * `COMMUNITIES` below is the merged, sorted, single import surface.
 *
 * This is a typed TS module rather than a runtime JSON import, matching the
 * repo's convention for content (see clown-board.ts, eras.ts): the data is
 * transcribed verbatim, never re-derived at runtime.
 */

import { COMMUNITIES_DATA_A } from './communities-data-a';
import { COMMUNITIES_DATA_B } from './communities-data-b';
import { COMMUNITIES_DATA_C } from './communities-data-c';

/**
 * How confident we are in a community's own data (member counts, activity),
 * carried through from `data/communities.json`'s `verification_legend`.
 * The UI uses this as a visible confidence signal — never flattened away.
 */
export type VerificationStatus =
  | 'verified-live'
  | 'third-party-cited'
  | 'listed-only'
  | 'blocked-unverified';

export interface CommunityVerification {
  status: VerificationStatus;
  /** How the status was determined — the audit trail for that status. */
  method: string;
  /** ISO date this verification was performed. */
  checkedAt: string;
  /** Source URL(s) backing a third-party-cited or blocked-unverified status. */
  evidenceUrl?: string | readonly string[];
  /** Orchestrator's independent re-check note, when one was performed. */
  orchestratorRecheck?: string;
}

export type CommunityPlatform =
  | 'Discord'
  | 'Reddit'
  | 'Forum'
  | 'Facebook'
  | 'Tumblr'
  | 'AO3'
  | 'Steam'
  | 'Wattpad';

export interface Community {
  name: string;
  platform: CommunityPlatform;
  url: string;
  /**
   * Real member count, or `null` when no count exists (e.g. Reddit blocks
   * automated access). NEVER substitute 0 or an estimate for `null` — a
   * missing count must render as "unknown", not as zero members.
   */
  memberCount: number | null;
  /** ISO date, a descriptive attribution string, or `null` to match memberCount. */
  memberCountAsOf: string | null;
  /** Live "online now" count, when the platform exposes one (e.g. Discord). */
  onlineCount?: number;
  activityLevel: string;
  activityEvidence: string;
  description: string;
  backstory: string;
  niche: string;
  joinRequirements: string;
  /** 1-9 discovery-ranking score, authored by the research pass. */
  hypeScore: number;
  /** Why hypeScore landed where it did, when the community lacks a live count to justify it. */
  hypeBasis?: string;
  verification: CommunityVerification;
  /**
   * Real warnings a fan should see before joining (impersonator spin-offs,
   * reportedly-private access, sensitive content, etc). Never empty when a
   * genuine warning exists — always carried through to the UI.
   */
  flags: readonly string[];
  /** Third-party pages that named/recommended this community — the citation trail. */
  recommendedIn: readonly string[];
}

/** All 30 curated communities, source order preserved (not yet sorted). */
export const COMMUNITIES: readonly Community[] = [
  ...COMMUNITIES_DATA_A,
  ...COMMUNITIES_DATA_B,
  ...COMMUNITIES_DATA_C,
];

function byHypeScoreDesc(a: Community, b: Community): number {
  return b.hypeScore - a.hypeScore || a.name.localeCompare(b.name);
}

/**
 * Group communities by platform, each group sorted by hypeScore descending.
 * Group key order follows first appearance in COMMUNITIES (source order),
 * not alphabetical — matches the data's own curation order.
 */
export function communitiesByPlatform(
  communities: readonly Community[] = COMMUNITIES,
): ReadonlyMap<CommunityPlatform, Community[]> {
  const groups = new Map<CommunityPlatform, Community[]>();
  for (const c of communities) {
    const group = groups.get(c.platform);
    if (group) group.push(c);
    else groups.set(c.platform, [c]);
  }
  for (const group of groups.values()) group.sort(byHypeScoreDesc);
  return groups;
}

/**
 * Group communities by niche, each group sorted by hypeScore descending.
 * Group key order follows first appearance in COMMUNITIES (source order).
 */
export function communitiesByNiche(
  communities: readonly Community[] = COMMUNITIES,
): ReadonlyMap<string, Community[]> {
  const groups = new Map<string, Community[]>();
  for (const c of communities) {
    const group = groups.get(c.niche);
    if (group) group.push(c);
    else groups.set(c.niche, [c]);
  }
  for (const group of groups.values()) group.sort(byHypeScoreDesc);
  return groups;
}
