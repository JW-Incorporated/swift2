# [review-receipt] PR #3844 — OS-011 scripts/build-content-bundle.mjs (Claude review pass)

**Verdict: REQUEST CHANGES** — 1 blocking finding, 2 non-blocking notes.

## Verification performed
- Reviewed full diff: `git diff origin/main...swift2/t_7ba63cb7` (5 files, 663 insertions) in worktree `/workspace/projects/Swift2/.worktrees/t_7ba63cb7`.
- `node node_modules/.bin/vitest run scripts/build-content-bundle.test.ts packages/content` → **16/16 passed** (had to run `ln -s ../../node_modules node_modules` in the worktree first — symlink was missing).
- `node scripts/check-content-bundle-determinism.mjs` → **PASS**, deterministic bundleVersion across two builds.
- `node scripts/check-generated-in-sync.mjs` → **PASS**, no regression.

## Blocking finding (1)
**`resyncGeneratedIntermediates()` in `scripts/build-content-bundle.mjs` only re-runs `SYNCS` (from `scripts/lib/generated-content.mjs`), omitting `OTHER_SYNC_TARGETS`** (`scripts/sync-source-tiers.mjs` → `scripts/lib/source-tiers.generated.mjs`). This generated file is imported by `sync-longlive-content.mjs` and feeds rumor source-tier data into the bundle. The sibling script this PR mirrors, `check-generated-in-sync.mjs`, correctly resyncs both `SYNCS` and `OTHER_SYNC_TARGETS` (lines 46–47) — `build-content-bundle.mjs` does not.

Confirmed concretely: deleting `scripts/lib/source-tiers.generated.mjs` and running `build-content-bundle.mjs` throws `ERR_MODULE_NOT_FOUND` inside `sync-longlive-content.mjs` instead of regenerating it.

Impact: if `packages/shared/src/source-tiers.ts` changes without a separate `sync:content`/`sync-source-tiers.mjs` run, `content:bundle` silently builds from a stale committed `source-tiers.generated.mjs` — the exact "second copy that drifts" failure the script's own header claims to prevent. Neither `check-content-bundle-determinism.mjs` nor the new unit tests catch this, and no CI workflow currently wires `content:bundle`/`check:content-bundle` to run after `check:generated`.

**Fix:** iterate `OTHER_SYNC_TARGETS` too in `resyncGeneratedIntermediates()` (or import/resync a combined list), matching `check-generated-in-sync.mjs`.

## Non-blocking notes (2)
1. Hardcoded `node_modules/tsx/dist/cli.mjs` path for the child-process tsx invocation is a little brittle to package-layout changes, but `tsx` is pinned (`^4.23.11`) and the documented alternative (in-process `register()`) genuinely breaks with `ERR_REQUIRE_CYCLE_MODULE`. Consider `import.meta.resolve('tsx/dist/cli.mjs')` for resilience — not blocking.
2. Path-traversal-on-era-id is not exploitable: `validateBundleEntries` enforces `era.id` against the closed `eraIdSchema` enum and runs before any file I/O in `writeBundle()`, so a malformed era id throws before `writeFile`/`mkdir`. Confirmed by reading the code path; no fix needed.

## Positives
- Genuinely reuses the already-normalized TS modules (content.ts, tracks.ts, etc.) instead of re-parsing seeds — meets the "single source of truth" goal apart from finding #1.
- `bundleVersion` hash correctly excludes `generatedAt`; confirmed via unit tests and a live double-build run.
- Schema validation covers every emitted entry (verified against `packages/content/src/schema.ts` exports) and runs before any write.
- Temp-dir cleanup uses `try/finally` with `rm(..., {recursive:true, force:true})` — no leak.
- `execFileSync` usage is sound: isolated `stdio`, 256MB `maxBuffer` for large generated payloads.

**Findings count: 1 blocking, 2 non-blocking.**
