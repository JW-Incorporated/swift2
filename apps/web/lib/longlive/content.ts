import type { ContentItem, EraId, Milestone } from '@swift2/experience';
import { setContentItemLookup } from '@swift2/experience';
import {
  build,
  buildContent,
  buildMilestones,
  defaultThreadIdsForTags,
  type RawItem,
} from '@swift2/content-enrichment';
import { VAULT_RAW } from './content-vault.generated';

// OS-014b-1: the pure enrichment logic (defaultThreadIdsForTags, build(),
// buildContent(), buildMilestones()) moved to `@swift2/content-enrichment`
// so `scripts/build-content-bundle.mjs` can call it with zero `apps/web`
// dependency (docs/proposals/2026-09-vault-read-path.md). Re-exported here
// unchanged so every existing caller/test of this module keeps working.
export { build, defaultThreadIdsForTags };
export type { RawItem };

/**
 * Representative mock content. Every era gets a hero image reused from the era
 * art; a real API would supply per-moment imagery. Ordering is handled in the
 * UI (chronological, oldest-first), so authoring order here is not significant.
 *
 * dateLabel rule (#682 — the WS1 day-precision relapse): when `date` is a
 * researched day-precision date, the label must show the day — write the
 * formatFullDate() form ('June 19, 2006'), never the bare month ('June
 * 2006'). When the day is genuinely unknown or the moment spans a period,
 * use an editorial period label ('Spring 2007', 'Late 2012') with a
 * representative placeholder date — a bare month+year label is
 * indistinguishable from a masked day-precision date, so a test
 * (content.test.ts) rejects it on curated items.
 */

// All hand-curated content has been migrated into supabase/seed/content/**
// (consolidation stage 2a, 2026-07-19) — the seed vault is the single source
// of truth for content. RAW remains only as the (empty) merge seam so build()
// and the id-collision rule below keep working; DO NOT author content here.
// New content goes in the era seed files, where validation, the content
// engine, and the bot fleet all operate.
const RAW: Partial<Record<EraId, RawItem[]>> = {};

export const CONTENT: ContentItem[] = buildContent(RAW, VAULT_RAW);

export function contentForEra(eraId: EraId): ContentItem[] {
  // Newest-first: the experience travels *back* in time, so the most recent
  // moment sits at the top (fresh on every visit) and you descend into the past.
  // The timeline scrubber mirrors this — top = now, bottom = the era's start.
  return CONTENT.filter((c) => c.eraId === eraId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getContentItem(id: string): ContentItem | undefined {
  return CONTENT.find((c) => c.id === id);
}

// OS-024: wires this module's getContentItem into packages/experience's
// track-guide (dossier connections resolve `moment:<id>` links) and any
// other consumer of the injected content-item lookup — see
// content-item-provider.ts for why the indirection exists.
setContentItemLookup(getContentItem);

// ── Milestones (timeline markers) ───────────────────────────────────────────

// Derived from the seed vault (consolidation stage 2b, 2026-07-19): every
// milestone is a marker on its own moment (ContentItem.milestone, authored in
// supabase/seed/content/**), so the scrubber's timeline and the moment it
// points at can never drift apart — adding a milestone means marking the
// moment, not editing a parallel list. Legacy ids preserved in the markers.
export const MILESTONES: Milestone[] = buildMilestones(CONTENT);

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}
