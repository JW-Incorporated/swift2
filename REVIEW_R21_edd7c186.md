# Independent Code Review — commit edd7c186 (R21: split store.tsx into slices)

Repo: Swift2, worktree `/workspace/projects/Swift2/.worktrees/t_05a0fb60`, branch `wt/t_05a0fb60`, base `main`.
Diff reviewed: `git show edd7c186` (`feeaaca3..edd7c186`).

## Verification run (fresh, this review)
- `npx tsc --noEmit -p apps/web` → clean, 0 errors.
- `npx vitest run apps/web/lib/longlive/store/` → 4 files, 36 tests, all pass.
- Confirmed all ~31 importers still import from `@/lib/longlive/store` unchanged (grep across `components/longlive/**`, `lib/longlive/**`).
- `MAP.md` updated appropriately for the new `store/` layout.

## Blocking findings — 3 concrete behavior regressions (same root cause)

Root cause: `openThread`, `openEra`, and `openCrossing` originally also closed the
moment/track-guide/theory-guide overlays as part of the same action. After the
split, these three actions live purely in `navigation.tsx`'s `navReducer` and
never touch the overlays slice. `store/index.tsx` wires them straight through
(`openThread: nav.openThread`, `openEra: nav.openEra`, `openCrossing: nav.openCrossing`,
index.tsx:290-294) with no call into `overlays.closeAllOverlays()` or similar.

1. **`openThread`** (`store/navigation.tsx:253-260`, reducer case `store/navigation.tsx:98-105`;
   orig `store.tsx:494-507`) — original also cleared `openItemId`, `trackGuideEraId`,
   `theoryGuideEraId`. New reducer only touches `mode/crossing/lensId/selectorOpen`.
   Since `MomentDetail`/`TrackGuide`/`TheoryGuide` render purely off
   `overlays.state.*` (not gated on `mode`), a user with a moment/track-guide/
   theory-guide open who taps a thread doorway now sees that overlay still open,
   stacked over the new Threads mode, instead of closing.

2. **`openEra`** (`store/navigation.tsx:262-271`, reducer case `store/navigation.tsx:106-115`;
   orig `store.tsx:509-526`) — same gap: original cleared `openItemId`/
   `trackGuideEraId`/`theoryGuideEraId`; new case doesn't touch overlays. Cross-era
   song hops / video deep-links / any `openEra` call from a currently-open overlay
   leaves that overlay open on top of the newly-loaded era.

3. **`openCrossing`** (`store/navigation.tsx:273-275`, reducer case
   `store/navigation.tsx:118-119`; orig `store.tsx:538-543`) — original cleared
   `openItemId`; new case does not. Opening a thread-crossing while a moment
   detail is open now leaves the moment overlay stacked over the crossing.

`goHome` is correct: `store/index.tsx`'s wrapper explicitly calls
`overlays.closeAllOverlays()` and `searchShare.closeSearchAndShare()` alongside
`nav.goHome`, faithfully replicating the original's full reset list. The
regression is specific to `openThread`/`openEra`/`openCrossing`.

No existing test catches this: each slice's reducer is tested correctly in
isolation (per its own narrower contract), but there is no integration test
exercising `AppProvider`'s composed `openThread`/`openEra`/`openCrossing`
actions against `overlays.state`.

## Missing test coverage (blocking)

An integration test for `store/index.tsx`'s `AppProvider` — even a lightweight
`renderHook` test exercising `openThread`, `openEra`, and `openCrossing` while
an overlay is open, asserting `openItemId`/`trackGuideEraId`/`theoryGuideEraId`
end up null — is absent. This is exactly the class of bug that "state-shape
equivalence" verification (called out in the commit message) was meant to
catch, and it was missed because verification stayed within each new slice's
own reducer tests rather than the composed provider.

## Non-blocking nitpicks
- `overlays.test.ts`'s comment "Matches original store.tsx behaviour:
  openTheoryGuide never touched openTrackKey" is accurate and a good call to
  pin down an intentional quirk.
- `useOverlays`'s injected `openThread`/`openEra`/`clearFilters` params (three
  positional callbacks) are a bit awkward; an options object might read
  better. Style-only.

## Verdict: REQUEST CHANGES

Blocking: the 3 dropped overlay-clearing behaviors in `openThread`/`openEra`/
`openCrossing` (concrete UI regression — stale immersive overlays can stack
over the destination mode/era/crossing after this refactor), plus the missing
cross-slice integration test that would have caught it. Everything else
(state-shape equivalence for all other actions, `goHome`, the deep-link mount
effect, the return-point stack, per-slice reducer unit tests, MAP.md,
tsc/vitest) checks out clean.
