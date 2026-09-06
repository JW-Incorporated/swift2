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
 * BUNDLE AS SOURCE OF TRUTH, LITERAL AS RUNTIME VALUE (OS-014b-2, same
 * reasoning recorded for era-secrets.ts/merch.ts/clownbot-lore.ts's
 * OS-014b-4/5 — see those files' headers for the fuller writeup, and Fable
 * rulings FR-t_cd5741fc-1/-2 for why a runtime filesystem read was
 * rejected): `CONTENT` keeps computing straight from `buildContent({},
 * VAULT_RAW)` (the seed-derived intermediate that also feeds the published
 * bundle build, via `scripts/lib/dump-longlive-sources.ts`) rather than
 * reading the published bundle's `content:<eraId>.json` files at runtime
 * via `packages/content`'s async `loadBundle()` or a synchronous
 * `node:fs` read.
 *
 * This module is reachable from `TimelineScrubber.tsx`/`ShareSheet.tsx`/
 * `MomentDetail.tsx`, all `'use client'` components — Next.js/Turbopack
 * statically traces every module in a client component's import graph and
 * refuses to bundle `node:fs`/`node:path` for the browser (a real
 * `TurbopackInternalError` build failure hit while implementing this card,
 * not a theoretical concern — see FR-t_cd5741fc-1's writeup). `loadBundle()`
 * is likewise the wrong shape: it is an async HTTP client, and every one of
 * the ~100+ call sites across the app reads `CONTENT`/`contentForEra`/
 * `getContentItem` synchronously today (this migration's explicit "zero
 * pixel/behavior change" bar) — switching to an async load would ripple
 * into every consumer's render path for no benefit apps/web's own build
 * doesn't already get for free (the generated file is produced from the
 * exact same seed source the bundle is built from, by the same `prebuild`
 * step, before either is read).
 *
 * `content.test.ts`'s bundle-regression describe block enforces the actual
 * invariant instead: a byte-identical-to-the-published-bundle regression
 * check, so any drift between `CONTENT` and the bundle's `content:<eraId>`
 * entries fails the suite immediately.
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
