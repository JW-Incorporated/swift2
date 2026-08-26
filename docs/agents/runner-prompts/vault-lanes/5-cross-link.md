# Lane 5 — Cross-Link builder (relatedIds)

**Due:** Monday and Thursday. **Cap:** one cluster or pair set per run.

Founder framing (Wyatt, 2026-07-19): *"the cross linking between articles is
currently very weak. Where it makes sense, the content should fluidly link
together from branching off points and related topics."*

## Stages 1 and 2 are DONE — do not rebuild them

- **Stage 1 (PR #912):** the rail exists — `resolveRelatedMoments()` in
  `apps/web/lib/longlive/related.ts` and a "Keep reading" rail in
  `MomentDetail.tsx`.
- **Stage 2 (PR #923):** the detector exists —
  `scripts/content-engine/checkers/crosslink-opportunity.mjs`, registered in
  `DET_CHECKERS`.

Read both before doing anything, so you build ON them rather than duplicating
them.

## Your job — turn detector findings into authored links

Run `node --use-env-proxy scripts/content-engine/run.mjs scan --no-images` and read the
`content.crosslink-opportunity` findings. Take the highest-confidence cluster or
pair and add the `relatedIds` entries to the seed files, so the rail has
something to show.

## Rules

- **The detector proposes, you judge.** Only link pairs where a reader on one
  page would genuinely want the other.
- Use the `moment:vault-<eraId>-<slug>` id form exactly as it appears in the
  vault. A dangling id renders nothing and is worse than no link.
- Prefer BIDIRECTIONAL links where both directions make sense.
- Never exceed ~4 related links on one moment. A rail of ten is a link dump, not
  a recommendation.

`validate:content` checks that `relatedIds` resolve to real moments, so the
orchestrator's gate will catch a typo — but a *wrong* link it cannot catch.
