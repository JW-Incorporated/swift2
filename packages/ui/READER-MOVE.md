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
- DONE in C2 (per C-5): `CurrentItemDetail.tsx` `fetch('/api/intake')` now goes through `useHost().apiFetch` (hook call at the top of the component plus the call-site edit); web resolves to the same relative request.
- Debt: `EraStream.tsx` (470) and `MomentCardButton.tsx` (298) are over or near the 300-line rule; moved as-is.

Debt (2.4-A): `video-affordance.ts` (294) and `store/index.tsx` (473) are over or near
the 300-line rule; moved as-is.

## Slice sections (scaffold)

Each slice edits only under its own heading below. Slice barrels and
`package.json` subpath exports already exist (no root re-exports).
`@swift2/content-enrichment` is already a dependency.

Convention: components (.tsx) at `reader/<slice>/X.tsx`; non-component modules
(.ts) at `reader/<slice>/lib/X.ts`; never edit package.json exports or
`src/index.ts`. Deep imports: `@swift2/ui/reader/<slice>/X` (.tsx) and
`@swift2/ui/reader/<slice>/lib/X` (.ts).

### WP2.5 moment

2.5-A1 (move-only): `MomentDetail`, `MomentSocialPost`, `ZoomableImage` to `reader/moment/`; `contain-fit`, `related`, `useFocusTrap`, `shop`, `shop-networks` and `awin-advertisers.json` to `reader/moment/lib/`. Pure tests moved with them (`ZoomableImage`, `contain-fit`, `useFocusTrap`, `shop`, `shop-networks`).

- Shims (one-line `export *`, in `apps/web`): `components/longlive/MomentDetail.tsx`, `lib/longlive/{related,shop,useFocusTrap}.ts`. Plain renames (no outside importer): `MomentSocialPost`, `ZoomableImage`, `contain-fit`, `shop-networks`, `awin-advertisers.json`.
- Type re-homing: `shop.ts` takes `MerchItem` from `@swift2/content-enrichment` (its real source) instead of `./merch`.
- Tests that stay in `apps/web` (web data or render harness): `MomentDetail.test.tsx`, `related.test.ts`. Source-reading tests (`back-dismiss`, `escape-dismiss`, `focal-point-rendering`, `modal-focus-trap`, `card-chrome`) now read the moved `MomentDetail.tsx`; `modal-focus-trap` expects the new relative `useFocusTrap` import.
- Hooks `useHost`/`useReader` are imported from `../../host/context` and `../../snapshot/context` (package-internal), a two-line import edit.
- `noUncheckedIndexedAccess`: type-only `!` assertions in a separate commit, zero runtime change.
- Debt: `MomentDetail.tsx` (1216) and `ZoomableImage.tsx` (382) over the 300-line rule; moved as-is.

### WP2.6 threads
(pending)

### WP2.7 tracks
- Moved (A1, move-only): `TrackGuide.tsx`, `TrackDetail.tsx` -> `packages/ui/src/reader/tracks/`. TheoryGuide/TheoryCard are WP2.6, not here.
- Shims (one-line `export *`, in `apps/web`, importer `LongLive.tsx`): `components/longlive/{TrackGuide,TrackDetail}.tsx`. No plain renames.
- Source-reading tests repointed at the moved files: `OverlayNav.test.ts`, `back-dismiss.test.ts`, `escape-dismiss.test.ts`, `modal-focus-trap.test.ts` (now expects the relative `useFocusTrap` import).
- Imports: `useHost`/`useResolveUrl`/`useReader` from package-internal `../../host/context` and `../../snapshot/context`; `useFocusTrap` from `../moment/lib/useFocusTrap` (WP2.5). `@swift2/content-enrichment` already a `packages/ui` dependency.
- Debt: `TrackDetail.tsx` (580) over the 300-line rule; moved as-is. A2 (swipe-hint `window.localStorage` -> `useHost().storage.local`) pending.

### WP2.8 search
A1 (move-only): `SearchOverlay.tsx` and `search-listbox-children.test.ts` -> `reader/search/`. A2 is empty (no fetch, storage or external links).

- Shim (one-line `export *`, kept until WP2.13; `LongLive.tsx` imports it): `apps/web/components/longlive/SearchOverlay.tsx`.
- Plain rename (no outside importer): `search-listbox-children.test.ts`.
- Import fix-ups: `@/lib/longlive/search` -> `@swift2/experience` (the stay-behind `search.ts` is a re-export of it); `useFocusTrap` from `../moment/lib/` (WP2.5-owned).
- Source-reading tests repointed: `back-dismiss.test.ts`, `escape-dismiss.test.ts`, `modal-focus-trap.test.ts` (import string follows the new path).

### WP2.9 merch

2.9-A1 (move-only). Moved to `packages/ui/src/reader/merch/`: `EraSpine` (+ test), `MerchMarquee`, `MerchEmptyPanel`, `MerchSectionRail`, `SubmitLinkForm`; libs in `merch/lib/`: `merch-filters`, `section-jump`. Old paths are one-line `export *` shims (delete in WP2.13). No type re-homing was needed.

2.9-A1b: `MerchCard` and `MerchStyleSection` moved too (shop imported from `../moment/lib/shop`, WP2.5). `MerchSection` stays in apps/web: it imports baked `merch-extensions` (apps/web data), and the fix is the `extensions` prop = A2. `merch-filters.test.ts` stays (reads web-only data modules through the shim); `section-jump.test.ts` stays (fails the ui package's stricter `noUncheckedIndexedAccess`; fixing it is a non-import hunk, so it goes to A2).

### WP2.10 community
(pending)

### WP2.11 clown
(pending)

### WP2.12 settings
A1 + A2 in one PR (PM ruling), separate commits.

- A1 (move-only): `WebNotificationSettings.tsx` -> `reader/settings/`. Old path is a one-line `export *` shim (stays until WP2.13). The `accent-fill-foreground` source-read test is repointed.
- A2 (logic): `HostAdapter.webPush?: HostWebPush` (additive, web adapter only; app host omits it). The web implementation `webPushHost` in `apps/web/lib/host-adapter.tsx` wraps the unchanged `web-push-client` functions and the `/api/devices/:id/prefs` GET/PUT, so web behaviour is identical. `WebNotificationSettings` reads them via `useHost().webPush` (absent -> "unsupported" state); `WebPushSubscribeResult` re-homed to `host/types.ts`.
- New `NotificationSettingsPage.tsx` (page body, `next/link` -> `useHost().Link`); `app/settings/notifications/page.tsx` keeps `metadata` and the VAPID env read and renders it.
- `lib/web-push-client.ts` does not move. Tests: `components/longlive/WebNotificationSettings.host.test.tsx`.
- Inbox/About rows and app-side `HostNotifications` wiring are 2.12-D.

### WP2.13 legal
- A1b (move-only): `FeedbackButton.tsx` -> `reader/legal/`. Old path is a one-line `export *` shim (stays until WP2.13 A2). Source-reading tests (`accent-fill-foreground`, `back-dismiss`, `close-affordance`, `escape-dismiss`, `modal-focus-trap`, `FeedbackButton.test`) are repointed. A1 (legal pages) is not part of this PR.
- Deferred to A2 (logic, untouched here): `sessionStorage` -> `storage.session`, `window.location.href`, `fetch('/api/feedback')` -> `apiFetch`.

Not moved (type-only or data edges): `clown-*`, `mood-usage`, `usage-db-gate`,
`clownbot-lore`, `content`, `tracks`, `era-secrets`, `videos`.
