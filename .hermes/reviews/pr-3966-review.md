# Code Review: PR #3966 — Community Engine P2-6 "song-page weaving intake"

**Repo:** JW-Incorporated/swift2
**Branch:** wt/t_03210b37 vs main
**Verdict: REQUEST CHANGES** — one real correctness bug in `clusterTrackSlug`; everything else is solid.

## Blocking issue

**`clusterTrackSlug()` doesn't actually prioritize the canonical row, contradicting its own doc comment.**

In `apps/worker/src/extract/theory-promote.ts`:

```js
function clusterTrackSlug(rows) {
  for (const r of rows) if (r.trackSlug) return r.trackSlug;
  return null;
}
...
const trackSlug = clusterTrackSlug(group);   // uses `group`, NOT `sortedGroup`
```

The comment claims: *"Canonical row's trackSlug wins; if it has none, the first
merged-in row that does supplies it."* But `group` is in cluster-discovery
order (seed first, then whatever the matching sweep happens to append), not
sorted by canonical priority — `canonical` is only computed from
`sortedGroup[0]` a few lines later.

Reproduced with a targeted test (seed = low-mention row with
`trackSlug: 'wrongTrack'`, discovered first; canonical = high-mention row
with `trackSlug: 'rightTrack'`, added later by the match loop):

```
mergeTheoryCandidates(rows).trackSlug // => 'wrongTrack', NOT the canonical's 'rightTrack'
```

Run via `npx vitest run` against the actual code — it fails the "canonical
wins" expectation. The shipped test suite doesn't catch this because its
only trackSlug test has the canonical row with `trackSlug: null` (so "first
non-null in the group" coincidentally matches "canonical then fallback" only
when canonical's own slug is empty). When canonical *has* a trackSlug that
differs from an earlier-discovered sibling's, the wrong song gets attached to
the promoted `live_theory` row — silently. That undermines the point of the
migration (P2-6 needs the *right* song).

**Fix:** `clusterTrackSlug` should check `canonical.trackSlug` first, then
fall back to scanning the group (or call it with `sortedGroup` instead of
`group`). Add a regression test where canonical and a merged sibling both
carry differing non-null `trackSlug`s.

## What's solid

- **Dedupe/fail-closed logic** (`planWeavingFilings`, `theoryIdsIn`): mirrors
  `scripts/appearance-discovery/lib/dedupe.mjs` correctly — same
  `{ids, complete}` ledger contract, same refuse-on-null/refuse-on-incomplete
  semantics.
- **`gh()` ledger `complete` semantics** (scripts/lib/gh.mjs): CLI path uses
  `rows.length < limit`, REST path uses `sawFinalPage` — genuine two-sided
  proof, not a row-count guess. Sound, matches the fail-closed discipline.
- **SQL query vs. schema**: migration adds `live_theory.track_slug` + partial
  index; the script's `.select()` includes `status`, debunked-filtering
  happens in JS. Not a bug — fetches a small filtered set and defers
  mention-floor/debunked filtering to unit-testable pure logic
  (`planWeavingFilings`). Slightly less efficient than a server-side
  `.neq('status','debunked')`, but not incorrect. Non-blocking.
- **Tests**: ran the touched test files directly —
  `npx vitest run scripts/community/song-weaving-intake.test.ts
  apps/worker/src/extract/theory-promote.test.ts` → **29 passed**. Coverage
  is decent (dedupe branches, ledger refusal paths, issue body content, arg
  parsing) but has the gap noted above around `clusterTrackSlug`.
- **Docs**: `docs/AUTOMATION.md` and
  `docs/proposals/2026-09-06-community-engine-plan.md` accurately describe
  the shipped cron time (Sun 09:52, after `theory-promote.yml`'s 09:45), the
  higher mention floor (8 vs. 3), and the track_slug fix. No overclaiming
  found.
- **Safety**: confirmed the script's only DB access is
  `.from('live_theory').select(...)` (read-only) and its only write is
  `gh issue create` — no Vault/seed writes, no auto-posting. Matches the
  "lead, never content" claim in the script header and docs.
- **Lint**: `eslint` on all four touched/new files — clean, no output.
- **Typecheck claim verified**: reproduced the pre-existing
  `Cannot find module '@swift2/shared/community'` error against
  `theory-promote.ts` on **origin/main** as well (checked out main's version
  of the file, same tsc error). The PR's claim that this failure is
  pre-existing/unrelated is verified true, not just plausible.
- **Cron collision**: `52 9 * * 0` (this workflow) vs `45 9 * * 0`
  (`theory-promote.yml`) — deliberately staggered by 7 minutes, no collision
  with the watchdog's reserved `:00/:05/:10/:23/:30/:40` cluster.

## Action needed before merge

Fix `clusterTrackSlug` to actually honor "canonical wins" as documented, add
a regression test for the canonical-vs-sibling-conflict case, then this is
good to merge.
