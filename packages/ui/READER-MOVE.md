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

Debt: `video-affordance.ts` (294) and `store/index.tsx` (473) are over or near
the 300-line rule; moved as-is.

Not moved (type-only or data edges): `clown-*`, `mood-usage`, `usage-db-gate`,
`clownbot-lore`, `content`, `tracks`, `era-secrets`, `videos`.
