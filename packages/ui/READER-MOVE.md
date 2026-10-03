# READER-MOVE: reader code moved into packages/ui

One UI WP2.4. Move-only PRs (`git mv` plus import-path edits). The 300-line file
rule is waived for these moves; the debt is logged here.

## 2.4-A1: store + shared reader libs

Moved to `packages/ui/src/reader/{lib,store}/` with their pure tests. The old
`apps/web` path is a one-line `export * from '@swift2/ui/reader/...'` shim
(subpath exports in `packages/ui/package.json`). Shims stay until WP2.13.

Shims (all in `apps/web/lib`):

- `utils.ts`
- `longlive/store/{index,navigation,overlays,return-points,search-share}.tsx`
- `longlive/{bottom-nav-focus,bottom-nav-layout,card-chrome,chrome-offset,era-jump-landing,era-stream-pin,in-app,local-storage-adapter,return-point-stack,share-action,share-card-params,share-payload,share,tagBadges,tags,theme,track-video,use-current-items,use-era-current-feed,use-live-data,use-live-theories,useBackDismiss,useIsomorphicLayoutEffect,useScrollLock,useSwipeNav,video-affordance}.ts`

Type re-homing: `ClownAnswer` is imported from `@swift2/shared` (its real
source; `apps/web/lib/longlive/clown-answer.ts` only re-exports it).

Tests that stay in `apps/web` (they read web-only data modules or component
source, or use a call the ui reader ban forbids): `card-chrome`, `track-video`,
`video-affordance`, `era-stream-golden`, `share-payload`. They import through
the shims.

Two non-import hunks in `store/index.tsx`, forced by the new lint scope: the
unused `type ShareTarget` specifier dropped from an import line, and the
`react-hooks/exhaustive-deps` disable comment removed (that rule is not
registered under `packages/ui`).

Deferred to 2.4-A2 (logic, not move): landed below.

## 2.4-A2: host-backed logic (not a move)

- `storage.local`: `createLocalStorageAdapter(storage)` wraps `useHost().storage.local`; the store ProgressProvider builds it from the host (no module singleton). Every tree that mounts `AppProvider` now needs a `HostProvider`.
- `share`: `shareTarget` / `shareCardImage` take an optional trailing `ShareHost` (`Pick<HostAdapter, 'share' | 'resolveUrl'>`). Omitted on the web (unchanged path). With `host.share`, a link share replaces the file share (known S5 fallback). All 6 live callers pass the host: TopBar, MomentDetail, ShareImageMenu (`shareCardImage` and `prefetchShareCard`), OverlayNav, TheoryGuide.
- `resolveUrl` (member already on `HostAdapter`): used by `fetchLiveData` (via `useResolveUrl()` in the two hooks) and `prefetchShareCard`; identity on the web.
- `types.ts`: no new declarations needed; the type re-homing finished in A1.
- Contract test: `bridge/contract.test.ts` gains the reader-consumer leg (ShareHost, resolveUrl, storage.local).

## 2.4-B: shell chrome + ReaderShell

Moved to `packages/ui/src/reader/shell/`: `TopBar`, `TimelineScrubber` (789 lines, as-is), `timelineScrubberLayout`, `topbarLayout`, `BottomNav`, `button` (from `apps/web/components/ui`). Old paths are one-line `export *` shims; exports are explicit per file in `packages/ui/package.json` because the dir mixes .ts and .tsx. Shims stay until WP2.13.

- `ReaderShell.tsx` (new): the body of the old `LongLive.tsx` `Shell` with `slots` (`surfaces`, `overlays`, `footer`, `floating`, `fallback({mode})`); `ReaderRoot` = `AppProvider` + `ReaderShell`. Not exported from the package index (it pulls the store); import the subpath `@swift2/ui/reader/shell/ReaderShell`.
- One non-import hunk: the `react-hooks/exhaustive-deps` disable comment in `TimelineScrubber` removed (rule not registered under `packages/ui`, same as A1).
- `noUncheckedIndexedAccess`: type-only `!` assertions in a separate commit, zero runtime change.
- Tests stay in `apps/web` (they read component source or render with the web test host); source-read paths now point at the moved files. New: `components/longlive/ReaderShell.test.tsx`.
- Debt: `TimelineScrubber.tsx` (789) over the 300-line rule.

## 2.4-C: era stream

Moved to `packages/ui/src/reader/era/`: EraStream, EraSection, EraFeedList, FilterBar, LandingMasthead, CountdownBanner, ClusterCard, CurrentItemCard, CurrentItemDetail, DoorwayCard, EraSecretCard, EraThreadsPivot, MomentCard, MomentCardButton, MomentVideo, OverlayNav, ShareImageMenu, SignificanceBadge, TrackFivePill, TrackGuideBar, VideoMomentCard. Old `apps/web/components/longlive` paths are one-line `export *` shims (the other slices keep importing through them); shims stay until WP2.13. `package.json` gains one subpath export, `./reader/era/*`.

- Import edits only, plus: `EraSecretCard` takes `trackKey` from `@swift2/experience` (its real source) instead of the `TrackDetail` re-export; `OverlayNav` takes `ModeToggle` from `../shell/TopBar`.
- One non-import hunk: the `react-hooks/exhaustive-deps` disable comment in `EraStream` removed (rule not registered under `packages/ui`, same as A1/B).
- `noUncheckedIndexedAccess`: type-only `!` assertions in a separate commit, zero runtime change.
- Tests stay in `apps/web` (they read component source); source-read paths now point at the moved files.
- DEFERRED to a companion logic PR (C2, per C-5): `CurrentItemDetail.tsx` `fetch('/api/intake')` to `useHost().apiFetch`. It needs a hook call at the top of the component plus a call-site edit (two non-import hunks), so it is not part of this move.
- Debt: `EraStream.tsx` (470) and `MomentCardButton.tsx` (298) are over or near the 300-line rule; moved as-is.

Debt (2.4-A): `video-affordance.ts` (294) and `store/index.tsx` (473) are over or near
the 300-line rule; moved as-is.

Not moved (type-only or data edges): `clown-*`, `mood-usage`, `usage-db-gate`,
`clownbot-lore`, `content`, `tracks`, `era-secrets`, `videos`.
