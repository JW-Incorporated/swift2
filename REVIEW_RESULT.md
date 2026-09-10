# Code Review: swift2 PR #3843 (OS-021 — one-source-three-surfaces)

**Verdict: REVIEW: APPROVE**

Posted to GitHub: https://github.com/JW-Incorporated/swift2/pull/3843#issuecomment-5555352059

## Scope reviewed
Diff `origin/main...HEAD` on branch `swift2/t_a6f9d20f`, 162 files changed (+470/-277).
Moves eras.ts, deepLink.ts, lenses.ts, filters.ts, filter-chips.tsx, types.ts from
`apps/web/lib/longlive` into new headless package `packages/experience/src`, adds an
ESLint purity guard, rewrites ~100 import sites, extracts `feed-types.ts`, and adds
`thread-content-provider.ts` injected-provider bridge for `lenses.ts`'s
`the-proposal` thread-points lookup.

## Findings
- No stale relative imports to moved files remain anywhere in apps/web (verified via grep).
- Old files fully removed from `apps/web/lib/longlive`.
- Import rewrites spot-checked across ~15 component/script files — all consistent,
  including generated files (`content-vault.generated.ts`) and their test assertions.
- `feed-types.ts` vs. `apps/web/lib/longlive/{anchor-date,era-feed,doorways}.ts`:
  no type drift possible — the app-layer files now import the types back from
  `@swift2/experience` and re-export under their original names (or type-alias),
  rather than re-declaring independently.
- `thread-content-provider.ts` injected-provider pattern is sound: default no-op
  provider (`() => []`) prevents crashes if unwired; `apps/web/lib/longlive/threads.ts`
  wires the real `contentForThread` at module load, which is transitively imported
  before any UI needs `the-proposal` points (ProposalThread.tsx → threads.ts).
  Preserves the purity guard correctly (no app-layer import inside the package).
- ESLint purity guard (bans react-dom/next/react-native imports + window/document
  globals) correctly scoped to `packages/experience/**` only.
- Generator scripts (`scripts/sync-longlive-*.mjs`, `check-filter-coverage.mjs`,
  `mirrors.test.ts`, `era-palette.mjs`) and their tests updated consistently with
  the new import paths.

## Independent verification (all re-run from scratch, not trusting author's claims)
- `npm run typecheck` — clean across all 6 workspaces (mobile/web/worker/core/experience/shared).
- `npm run lint` — 0 errors; 4 pre-existing warnings (unused eslint-disable directives),
  confirmed via `git blame` to predate this PR (unrelated to the file move).
- `npm run build --workspace @swift2/web` — succeeds; prebuild content-sync scripts run
  cleanly against new import paths; all Next.js routes generate.
- `npx vitest run --testTimeout=20000` (full suite) — **318 test files, 4631 tests
  passed, 2 skipped, 0 failures**. No flakiness observed; single run sufficed.

## Conclusion
Clean, well-scoped refactor with clear doc comments explaining the OS-022/023
handoff boundary. No changes requested.
