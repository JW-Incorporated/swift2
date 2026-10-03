# WP2.4 executor briefs (0, A–D): shell chrome + era stream, draft for the PM

Sources: PLAN.md §WP2.4–2.13 (lines 356-389), §WP2.14 (391-394), "Calls made
up front" C1–C6 (16-49), "Cross-cutting concerns" X1–X4 (51-75);
OPERATING-MODE.md §5, §7, §9; brief-wp21.md, brief-wp22.md, brief-wp23.md
(their FABLE REQUIRED / PM-ruling blocks); PROGRESS.md on
`origin/pm/one-ui-progress` (G1 go/no-go row, 02:10). Research read from
`origin/main` @ `4aabc666` (2026-10-03), plus `origin/feature/one-ui-wp2.1b`
for the HostAdapter types. Every file:line below is from those refs.

WP2.4 is **executor · reviewer** in PLAN (not [codex]). PM's call whether D
(the app mount, first real DOM-host production path) also gets Codex.

## PM rulings (2026-10-03 03:02) - supersede the open questions below
1. PRs 0-C may run before G0 (web-side, parity-guarded); D (app mount) is HELD until the G0 GO. 2. No placeholders for unmoved tabs: in the app, tabs/routes not yet moved go to their existing NATIVE screens via the bridge navigate command (Fable 19:00 ruling: DOM->native navigate only for routes native still owns). 3. D may change App.tsx so native settings/inbox/legal screens can present over (or replace) the DOM host - Fable to confirm the mechanism. 4. Approved: optional HostAdapter member resolveUrl(path) for absolute URL resolution in the DOM host (file:// origin) - /vault/live and share-card image. 5. ADDING new parity captures for surfaces not covered before (TopBar, footer) is allowed via the sanctioned dispatch in PR 0, before anything moves; the no-re-baseline rule forbids CHANGING existing baselines to hide diffs. Every Land line: NO auto-merge; never --delete-branch a branch with open child PRs.

## Carried rulings (already decided; apply, don't reopen)

- Host capabilities only through `useHost()` (2.1-B). `packages/ui` has no
  `next/*`, no `react-native*`, no computed `import()`/`require()` (2.1-A
  lint ban, Fable 02:46).
- The reader reads `ReaderSnapshot` from context in `packages/ui`
  (`useReaderSnapshot()`/`useReader()`, 2.2-B, PM ruling 1). No moved file
  imports `@/lib/longlive/{content,tracks,theories,era-secrets,threads,videos,merch,search}`.
- Bridge transport isolation (Fable 2.3 #5): Expo-DOM-specific code lives
  only in `SharedUiHost.tsx` wiring and `dom/bridge/transport-expo.ts`.
  Nothing in this WP adds a third place.
- In-DOM routing stays in the DOM (history API, X4 paths). DOM→native
  `navigate` only for routes native still owns (Fable 2.3 #4).
- `parity-gate` must be a **required** check on `main` before the first
  WP2.4 branch opens (G1 condition 1).
- The `/eras/*.png` allowlist in `scripts/parity/serve.mjs` is closed in
  WP2.1-C/D (G1 condition 2). No new allowlist entries.
- No OTA size baseline bump without a recorded reason in the PR body and
  PROGRESS (G1 condition 3).
- **WP2.4 never re-baselines an existing parity baseline.** New baseline
  files for new captures are added only in 2.4-0, from `main`'s state.
- Before every `parity.yml` run, merge `origin/main` into the stack
  bottom-up (Fable ALL7, brief-wp22).
- Land: NO auto-merge, the PM merges. Never `--delete-branch` a branch with
  open child PRs.

## Dependencies (step 1 of every brief: `gh pr view <n> --json state`)

| Needs merged | 2.4-0 | 2.4-A | 2.4-B | 2.4-C | 2.4-D |
|---|---|---|---|---|---|
| `parity-gate` required on `main` (G1 cond 1) | yes | yes | yes | yes | yes |
| WP2.1-A (#4841, merged) | yes | yes | yes | yes | yes |
| WP2.1-B HostAdapter + `useHost()` (#4844) | | yes | yes | yes | yes |
| WP2.1-C fonts + font re-baseline (#4847) | yes | yes | yes | yes | yes |
| WP2.1-D1 (shell + era stream `next/image`/`next/link` → `useHost()`) | | yes | yes | yes | yes |
| WP2.1-D closing the `/eras/*.png` allowlist | | | | | yes |
| WP2.2-A (#4843), WP2.2-B (context in `packages/ui`) | | yes | yes | yes | yes |
| WP2.2-C1 (shell + era stream callers → `useReader()`) | | yes | yes | yes | yes |
| WP2.3-A, B, C (envelope, host dispatcher, DOM client) | | | | | yes |
| WP2.3-D (navigate/back/insets/share/haptic; `backTick` removed) | | | | | yes |
| WP2.3-F (`apiFetch` over the bridge; `/vault/live/*` CORS) | | | | | yes |
| WP2.3-E (cold/warm notification-tap queue) | | | | | before S5 only |
| **G0 GO** (WP0.6, Fable) | | Q1 | Q1 | Q1 | **yes** |

Not needed: WP2.2-C2/C3 and WP2.1-D2+ (MomentDetail stays in `apps/web` in
this WP), WP2.2-D, WP2.14.

**Stack:** 2.4-0 → base `main`. A → base `main` (after 0 merges). B stacks
on A. C stacks on B. D stacks on C. Merge order 0, A, B, C, D. Retarget each
child to its parent's base before merging the parent.

## Open questions for the PM (decide before dispatch)

1. **Pre-G0.** 2.4-0/A/B/C are web-side moves with zero visual change,
   guarded by parity, and each is revertible on its own, which is the same
   profile Fable cleared for WP2.2 pre-G0 (02:20). D is the first production
   DOM-host path and needs G0 GO. **Recommendation:** run 0–C now and hold D
   for WP0.6. Confirm.
2. **Surfaces that haven't moved yet, inside the app.** With `sharedUi` on,
   `SharedUiHost` replaces the **whole** native tree (`apps/mobile/App.tsx:381-386`
   preempts every native screen), so the DOM shell's BottomNav will offer
   Threads, Clownbot, Community and Merch, plus search, track guide and theory
   overlays, none of which are in `packages/ui` yet. **Recommendation:** the
   app's slot map holds only the moved slice plus `MomentDetail` (still loaded
   through the WP0.5b spike path, already proven in the spike). Other modes
   render a neutral "Not in the app preview yet" panel. The only audience is
   C4-override devices (C4/C5). The alternative, loading every web surface
   through the spike resolver, is unproven: `/api`, Turnstile, and the clown
   cookie.
3. **Native-owned routes while the DOM is mounted.** The TopBar bell is
   `<Link href="/settings/notifications">` (`TopBar.tsx:132`). In the app that
   becomes a DOM→native `navigate` (Fable 2.3 #4). But `App.tsx:381`'s branch
   order means native `NotificationSettingsScreen`/inbox/legal/onboarding can
   never render while `domMount.mount === 'dom'`. **Recommendation:** D
   changes `App.tsx` so those native overlay screens render *above* a
   still-mounted (hidden) `SharedUiHost`, which keeps the DOM state. That adds
   `App.tsx` to D's touch set. If WP2.3-D/E already own this, say so and D
   drops it.
4. **Absolute URLs for non-`/api` fetches in the app.**
   `use-live-data.ts:35` (`/vault/live/{era}`) and `share-payload.ts:103`
   (the share-card PNG) are relative. The HostAdapter's `env.origin` is a
   constant production origin (2.1-B `types.ts:63-64`, `HOST-ADAPTER.md`), so
   using it on the web would point preview and local builds at production.
   **Recommendation:** add an optional member, `resolveUrl?(path): string`.
   On the web it is identity, so the URL stays relative and pixels and
   network are unchanged. In the app it is `env.origin + path`. This is an
   additive change to `packages/ui/src/host/types.ts`, and the 2.3-C
   contract test's HostAdapter leg would need updating in A. Alternative: a
   `fetchPublic` member.
5. **Parity can't see the chrome being moved.** `captureRoot` hides every
   `header`/`footer` outside the root (`e2e/parity/helpers.ts:236-241`;
   `docs/one-ui/parity.md:69-70`, "the app host supplies its own"). Side a has
   no viewport capture (`baseline.spec.ts:8-11`). So moving TopBar, its
   timeline rail and BottomNav would pass parity unproven. **Recommendation:**
   2.4-0 adds `a-<route>-viewport.png` baselines generated from `main` before
   anything moves. Only new files are added and no existing baseline is
   regenerated. D adds the a-vs-b viewport compare with the header visible,
   once the app renders the web TopBar. Confirm that adding new baseline
   files is not a "re-baseline", and that the app renders the **web** TopBar
   (PLAN:361 says yes; the parity doc's "host supplies its own" predates it).

---

## Research findings (cite these; workers do not re-derive them)

**Why this slice is first.** PLAN orders it first (`PLAN.md:361`, table
359-370). Three reasons:
- It is the root every later slice mounts into: `LongLive.tsx:105-110`
  (`AppProvider` → `Shell`), and the store every surface uses
  (`apps/web/lib/longlive/store/**`, imported by 38 files).
- It is the only slice already exercised end to end in the DOM host. The
  WP0.5b spike mounts `EraStream` + `MomentDetail` + `BottomNav` inside the
  web `AppProvider` (`apps/mobile/dom/spike/reader-modules.ts:14-44`), as
  PLAN WP0.5 asked (`PLAN.md:238`).
- It is already covered by the parity `home` route, whose shared root is
  `main` (`e2e/parity/helpers.ts:37-39`).

**Files the slice moves into `packages/ui`** (import closure of
`EraStream.tsx` + `TopBar.tsx` + `BottomNav.tsx` on main, test files
excluded; step 0 of A re-derives it after WP2.1-D1 and WP2.2-C1, which
remove the data-module and `next/*` edges):
- Shell chrome (B): `TopBar.tsx` (345), `TimelineScrubber.tsx` (789; over the
  300-line rule, but **move as-is**, don't split in a zero-diff PR),
  `timelineScrubberLayout.ts` (259), `topbarLayout.ts`, `BottomNav.tsx` (141),
  `components/ui/button.tsx`, and the `Shell` composition from
  `LongLive.tsx:26-103`.
- Era stream (C): `EraStream` (471), `EraSection` (310), `EraFeedList`,
  `FilterBar`, `LandingMasthead`, `CountdownBanner`, `ClusterCard`,
  `CurrentItemCard`, `CurrentItemDetail`, `DoorwayCard`, `EraSecretCard`,
  `EraThreadsPivot`, `MomentCard`, `MomentCardButton`, `MomentVideo`,
  `OverlayNav`, `ShareImageMenu`, `SignificanceBadge`, `TrackFivePill`,
  `TrackGuideBar`, `VideoMomentCard`.
- Shared reader libs (A): `store/{index,navigation,overlays,return-points,search-share}.tsx`,
  `theme`, `card-chrome`, `chrome-offset`, `era-stream-pin`,
  `era-jump-landing`, `bottom-nav-{layout,focus}`, `tags`, `tagBadges`,
  `video-affordance`, `track-video`, `return-point-stack`, `share`,
  `share-action`, `share-payload`, `share-card-params`, `in-app`,
  `local-storage-adapter`, `use-live-data`, `use-live-theories`,
  `use-current-items`, `use-era-current-feed`, `useBackDismiss`,
  `useScrollLock`, `useSwipeNav`, `useIsomorphicLayoutEffect`, and
  `lib/utils.ts` (`cn`).
- On main the closure is 74 files and about 10.2k lines. The extras
  (`clown-*`, `mood-usage`, `usage-db-gate`, `clownbot-lore`, and
  `content`/`tracks`/`era-secrets`/`videos`) arrive only through
  **type-only** imports or data modules. `store/index.tsx:29` and
  `store/search-share.tsx:5` use `type ClownAnswer`;
  `use-era-current-feed.ts:6` and `EraSection.tsx:39` use video note types;
  `EraSecretCard.tsx:11` takes `trackKey` from `TrackDetail.tsx`, which only
  re-exports it (`TrackDetail.tsx:59-62`). These **don't move**. Re-home the
  types into `packages/ui` (or `@swift2/experience` if the type already
  lives there) and point `EraSecretCard` at `trackKey`'s real source.

**Host dependencies → HostAdapter members** (2.1-B `types.ts:73-98`):

| Call site | Today | Member |
|---|---|---|
| `EraSection.tsx:4`, `MomentCardButton.tsx:3`, `MomentVideo.tsx:4` | `next/image` | `Image` (2.1-D1 already swapped; app impl in D) |
| `TopBar.tsx:17,132` | `next/link` bell → `/settings/notifications` | `Link` (app: native-owned route → bridge `navigate`; Q3) |
| `TopBar.tsx:20,40-44`, `in-app.ts:41-77` | `data-app` attr + `window.ReactNativeWebView` (legacy SiteShell) | keep as-is: `isInAppDocument()` is false in the DOM host (no `data-app`), so the Link path runs. Retired in 2.13 |
| `CurrentItemDetail.tsx:65` | `fetch('/api/intake')` | `apiFetch` (2.3-F allowlist has POST `/api/intake`) |
| `use-live-data.ts:35` | `fetch('/vault/live/…')` relative | Q4 (`resolveUrl`); CORS via 2.3-F PM ruling 3 |
| `share-payload.ts:67-70,103,151-165` | `window.location.origin`, `navigator.share`/`clipboard`, card PNG `fetch` | `share` (2.3-D) + Q4; image-file share in app → URL share fallback (S5 check) |
| `local-storage-adapter.ts:17-21` (store progress, `store/index.tsx:143-150`) | `window.localStorage` | `storage.local` (Android DOM has no web storage: WP0.5b ruling 14:34) |
| `useBackDismiss.ts:66-89`, `store/navigation.tsx:5` | `history.pushState`/`back` | stays (DOM history works); native back → `onBack` (2.3-D) |
| `store/index.tsx:266,284` | `window.location.search` deep link | stays; app deep links arrive by `navigate` (2.3-D/E, X4) |
| `EraStream`, `TimelineScrubber`, `chrome-offset` | `window.scrollTo`, `document` measures | real DOM in both hosts; no adapter |

**How the app mounts it today.**
- `App.tsx:240` computes `useDomMount(sharedUiActive(routeFlags.sharedUi, forceSharedUi))`.
  `sharedUiActive` is defined at `dom-host-handlers.ts:37-38`. The remote
  flag defaults to `false` (`lib/routes.ts:105,128`). The C4 override is read
  once per launch (`App.tsx:243-245`, `getForceSharedUi`). The watchdog gate
  is `lib/watchdog-gate.ts:32`.
- `App.tsx:381-386`: `domMount.mount === 'dom'` → `<SharedUiHost>`, which
  **replaces the entire native tree**, including `HomeTopBar`
  (`App.tsx:449`), `EraStreamScreen` (`:452`), the other tab screens, and
  `BottomTabBar` (`:466`).
- `SharedUiHost.tsx:15,106-127` mounts `dom/ReaderSpike.tsx`. That file reads
  the native disk cache by URI (C6), builds the snapshot, calls `fill()`
  (`:114`), then `loadReader()` (`:115`), a call-time `require` of the web
  components (`reader-modules.ts:13-44`) through the spike Metro resolver
  (`dom/spike/resolver.js`: `next/*` stubs plus data shims for apps/web
  origins only). React/react-dom are pinned for **every** origin
  (`metro.config.js:62-104`), so `packages/ui` gets the single React with no
  resolver change.
- The parity side b is `apps/mobile/index.web.ts`, which renders `ReaderSpike`
  with `devLoader` and `window.__probe`.

**Parity coverage.**
- Routes are `home` `/` (root `main`) and `item` `/?item=<fixture.itemId>`
  (root `[role="dialog"]`) (`helpers.ts:37-40`).
- The a-vs-b pixel and structure compare uses the top 480 px of the root
  (`compare.spec.ts:18-33`). Per-side baselines: `a-*.png` is the root only;
  `b-*.png` plus `b-*-viewport.png` use real insets (`baseline.spec.ts:7-19`).
- The equivalence hash comes from `/parity-probe` on a and `window.__probe`
  on b (`compare.spec.ts:49-58`).
- TopBar, its rail and the footer are hidden (`helpers.ts:236-241`), so the
  chrome being moved has no web-side pixel coverage today (Q5).
- No new route is needed for the era stream: `home` covers it. New captures
  are: a-side viewport (2.4-0), and a-vs-b viewport with the header visible
  (D).
- Parity triggers already include `packages/ui/**`, `apps/web/**`,
  `apps/mobile/dom/**` and `apps/mobile/index.web.ts` (`parity.yml:43-69`).

---

## Shared block: Repo rules (OPERATING-MODE.md §7, pasted into every brief)

```
Repo rules:
- Branch and worktree: work on a branch in your own worktree outside
  Documents\Claude\Projects\, and verify the branch before every commit.
  Never commit to main or force-push. Never use git restore / reset --hard /
  clean / checkout -- or --no-verify.
- Shell: one simple command per Bash call. Prefer node -e over python.
  Filter command output at the source (| tail -30).
- Windows checkouts of the parity fixture need git -c core.longpaths=true
  (hash-named dirs exceed MAX_PATH).
- Never touch scripts/social/** or social/queue/**. Never merge a
  social-draft PR. Never send social work to Codex.
- Gates:
  - Typecheck: npm run typecheck.
  - Lint: npm run lint. Run the exact CI command, not per-file eslint.
  - Tests: narrow npx vitest run <path> while iterating; full npm run test
    once at the end.
  - Mobile bundle check (when apps/mobile changes):
    npx expo export --platform ios and npx expo export --platform android.
- Editing: surgical edits only, no reformatting of untouched code, and keep
  files under 300 lines. Update MAP.md when files are added, moved or deleted.
- Definition of done: acceptance criteria met; all tests pass; review clean;
  works on mobile and desktop web; docs updated in the same PR; no secrets.
- Device verification: a UI change isn't verified until it's seen in a
  browser at phone and desktop widths, and on device for app changes. A green
  suite is not evidence.
- Native changes are expensive: any change to apps/mobile native dependencies
  or config changes the fingerprint, which triggers new store builds on both
  platforms. Only make one if the WP says so.
- Size tripwire: non-test diff past ~400 lines (git diff -M --numstat, so a
  pure rename counts only its edited lines) means stop and report.
- Worktree setup: npm ci --silent at the worktree root before the first command.
```

## Shared block: Land (every brief; `<BASE>` set per brief)

```
Land: open a PR against <BASE> (body: 1–2 sentence TL;DR, then ---, then
detail; refs #4788). Do NOT set auto-merge and do NOT merge; the PM merges
after review. Never --delete-branch a branch that has child PRs: run
gh pr list --base <branch> --state open, retarget the children to its base
first. Do not wait on CI; report and exit.
```

## Shared block: Verify (every brief adds its own narrow tests)

```
Verify with (paste the final result line of each):
  npm run typecheck
  npm run lint
  npx vitest run <narrow paths>
  npm run test                  (once, at the end)
  npm run build --workspace=@swift2/web, then npm run check:budget:bundle
  merge origin/main bottom-up, push, then:
  gh workflow run parity.yml --ref <branch>   -> all four projects green,
      NO baseline file changed (git diff --stat origin/main -- e2e/parity/__screenshots__
      shows nothing except files this brief says to add)
  cd apps/mobile: npx expo export --platform ios --output-dir <scratchpad>/exp-ios
  cd apps/mobile: npx expo export --platform android --output-dir <scratchpad>/exp-android
  cd apps/mobile: npx @expo/fingerprint fingerprint:generate on the PR base and
      on the branch, same environment -> top-level hash IDENTICAL (paste both)
  Browser check (dev server): / at 390px and 1280px, plus /?item=<id>;
      scroll the era stream, switch era from the scrubber, open and close a moment.
```

---

## Brief 2.4-0: a-side chrome baselines (parity coverage before anything moves)

```
WP 2.4-0: add web-side viewport baselines so the shell chrome is under parity
before it moves. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.4; G1
condition 1).
Goal: TopBar (and its timeline rail) and BottomNav get pixel coverage on side
a, captured from main's current rendering.
Depends on: parity-gate required on main (gh api
repos/JW-Incorporated/swift2/branches/main/protection/required_status_checks
lists it; if not, STOP and report), WP2.1-C merged.
Touch set: e2e/parity/baseline.spec.ts, e2e/parity/helpers.ts (a capture
helper that does NOT hide header/footer), new
e2e/parity/__screenshots__/<project>/a-<route>-viewport.png files,
docs/one-ui/parity.md. Touching anything else = stop and report.
Do:
  1. Add, in baseline.spec.ts, `a (web build) <route> viewport`: openRoute(a),
     then a full-viewport capture at scroll top with the header and footer
     VISIBLE (do not inject capture.css). Same PIXEL_OPTS.
  2. Generate the new baselines via
     gh workflow run parity.yml --ref <branch> -f update-baselines=true.
  3. git diff --stat origin/main -- e2e/parity/__screenshots__ must show ONLY
     the 8 added a-*-viewport.png files (4 projects x 2 routes). Any modified
     existing PNG = stop and report.
  4. Re-run parity without update-baselines: green twice (G1 condition 4
     flake watch).
  5. parity.md: document the new capture and why (WP2.4 moves the chrome).
Acceptance: new baselines only, existing ones byte-identical; two green runs;
mutating TopBar (e.g. a 1px shift via the existing mutate() negative path)
fails the new capture (add it to negative.spec.ts only if it fits the touch
set; otherwise prove it locally and paste the result).
Verify with: the parity steps above; npm run lint.
<Repo rules block>
<Land block, BASE = main>
Return ≤ 300 words: what changed, the two run ids, PR URL, open risks.
```

---

## Brief 2.4-A: store + shared reader libs into packages/ui (web only)

```
WP 2.4-A: move the reader store and the shared lib modules the shell and
era stream need into packages/ui; apps/web keeps re-export shims. Programme:
One UI (docs/plans/one-ui/PLAN.md §WP2.4).
Goal: packages/ui/src/reader/{store,lib}/** holds the store and its helpers,
with zero behavior or pixel change on the web.
Touch set: packages/ui/src/reader/** (new), packages/ui/src/index.ts,
packages/ui/package.json (deps the moved code imports: lucide-react, clsx,
tailwind-merge, class-variance-authority, @radix-ui/react-slot,
@swift2/experience, @swift2/shared — versions identical to apps/web's),
the moved files' old paths in apps/web/lib/longlive/** (each becomes a
one-line re-export shim) + apps/web/lib/utils.ts, their tests (move WITH the
code), packages/ui/src/host/types.ts ONLY for Q4's additive member if the PM
approved it, MAP.md. Do NOT edit any of the 38 store importers, any
component, or apps/mobile. Touching anything else = stop and report.
Do:
  0. Read-only, no commit: re-derive the closure of EraStream.tsx +
     TopBar.tsx + BottomNav.tsx over apps/web (static + type imports) on the
     current base. Bucket each file: A (lib/store), B (chrome), C (era
     stream), or "stays in apps/web" (type-only or data edges). Put the table
     in the PR body. Expected: research table above; the data-module edges
     should already be gone after WP2.2-C1. If any non-type edge into
     content/tracks/era-secrets/videos/merch/theories/threads/search
     remains, STOP and report (WP2.2-C1 is incomplete).
  1. git mv each A file into packages/ui/src/reader/ (keep file names), fix
     relative imports, and replace '@/lib/...' with package-relative paths.
  2. Type-only edges: move the minimal type declarations the store needs
     (ClownAnswer/ClownMessage, the video note types) into
     packages/ui/src/reader/types/*.ts, and have the apps/web source
     re-export them so its callers don't change. If a type already lives in
     @swift2/experience or @swift2/shared, import it from there instead.
  3. local-storage-adapter → backed by useHost().storage.local (the store
     builds it inside its provider, not at module scope: the 2.1-B "no
     module-global singleton" rule).
  4. share-payload/share-action: call useHost().share when the host
     provides it, else today's navigator.share/clipboard path (the web
     adapter leaves share unset, so web behavior is byte-identical). The card
     PNG and /vault/live fetches use resolveUrl (Q4) or stay relative on web.
  5. Old paths: a one-line `export * from '@swift2/ui/reader/...'` shim (or
     named re-exports where a default export exists). Shims stay until
     WP2.13 retires them; list them in packages/ui/HOST-ADAPTER.md's sibling
     doc packages/ui/READER-MOVE.md (new, short).
  6. Tests move with their code (store/*.test.ts, etc.); fix imports only.
  7. Tailwind: confirm packages/ui is already in @source for web
     (globals.css) and the DOM CSS (WP2.1-A did this); don't add new ones.
  8. Non-test diff ≤ ~400 (renames count only edited lines). Over → stop;
     split lib vs store.
Acceptance: typecheck, lint, tests pass; parity green with no baseline
changed (including 2.4-0's new ones); probe hash == fixture.json; bundle
within budget; the 2.1-A lint ban passes on packages/ui; web e2e green;
MAP.md updated.
Verify with: <Verify block>; narrow paths: packages/ui/src/reader
apps/web/lib/longlive/store. The expo exports and fingerprint are required
too (packages/ui is in the DOM bundle's graph through ReaderSpike).
<Repo rules block>
<Land block, BASE = main>
Return ≤ 300 words: closure table summary, what changed, verification
results, PR URL, open risks (any type re-homed, any shim not one line).
```

---

## Brief 2.4-B: shell chrome + ReaderShell with slots

```
WP 2.4-B: move TopBar (+ TimelineScrubber, layouts, ui/button) and BottomNav
into packages/ui, and extract LongLive's Shell as a ReaderShell that takes
host-supplied slots. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.4
"Shell chrome (LongLive root, TopBar, BottomNav)").
Goal: the web renders its shell from packages/ui with zero parity diff, and
ReaderShell can be mounted by a host that has only some surfaces.
Touch set: packages/ui/src/reader/shell/** (new), packages/ui/src/index.ts,
the B files' old paths in apps/web/components/** (shims),
apps/web/components/longlive/LongLive.tsx, tests, MAP.md,
packages/ui/READER-MOVE.md. Touching anything else = stop and report.
Do:
  1. git mv TopBar.tsx, TimelineScrubber.tsx, timelineScrubberLayout.ts,
     topbarLayout.ts, BottomNav.tsx, components/ui/button.tsx (+ their tests)
     into packages/ui/src/reader/shell/. Move TimelineScrubber as-is (789
     lines; splitting it is not this WP). TopBar's Link comes from useHost()
     (WP2.1-D1 did that); keep the in-app.ts bell branch unchanged.
  2. packages/ui/src/reader/shell/ReaderShell.tsx: the body of
     LongLive.tsx:26-103 (theme-color effect, scroll-to-top effect, era/vault/
     merch style, TopBar, main, footer, the clearance spacer, overlays,
     BottomNav, FeedbackButton), with every not-yet-moved component taken
     from a typed `slots` prop:
       surfaces: Partial<Record<'era'|'threads'|'mood'|'clownbot'|'community'|'merch', ComponentType>>
       overlays: ComponentType[] (in today's order), footer?: ComponentType,
       floating?: ComponentType (FeedbackButton), fallback: ComponentType
         (used when a mode has no surface)
     Keep the DOM order and elements identical (header, main, footer,
     spacer div, overlays, nav, button) so structure parity holds.
     `ReaderRoot` = AppProvider + ReaderShell.
  3. apps/web LongLive.tsx becomes: <ReaderRoot slots={{...all current web
     components, MerchSection still via next/dynamic}} />. No visual change.
  4. Tests: ReaderShell renders the slot for each mode and the fallback for
     a missing one; the web LongLive passes every slot (snapshot of the slot
     keys).
  5. Non-test diff ≤ ~400.
Acceptance: as 2.4-A, plus 2.4-0's a-*-viewport captures green UNCHANGED
(this is the proof that TopBar/rail/BottomNav didn't move a pixel).
Verify with: <Verify block>; narrow: packages/ui/src/reader/shell
apps/web/components/longlive. Browser: also open the era selector, search
(/), the bell link, desktop pill rail at 1280px, BottomNav at 390px, and
iPad-ish 834px and 1194px.
<Repo rules block>
<Land block, BASE = the 2.4-A branch>
Return ≤ 300 words.
```

---

## Brief 2.4-C: era stream into packages/ui

```
WP 2.4-C: move the era stream components into packages/ui. Programme: One
UI (docs/plans/one-ui/PLAN.md §WP2.4 "era stream").
Goal: EraStream and everything only it uses render from packages/ui on the
web, with zero parity diff; ReaderShell's default 'era' surface is the
package EraStream.
Touch set: packages/ui/src/reader/era/** (new), packages/ui/src/index.ts,
the C files' old paths in apps/web/components/longlive/** (shims),
apps/web/components/longlive/LongLive.tsx (slot map only), tests, MAP.md,
packages/ui/READER-MOVE.md. Touching anything else = stop and report.
Do:
  1. git mv the C bucket from 2.4-A step 0 (expected: EraStream, EraSection,
     EraFeedList, FilterBar, LandingMasthead, CountdownBanner, ClusterCard,
     CurrentItemCard, CurrentItemDetail, DoorwayCard, EraSecretCard,
     EraThreadsPivot, MomentCard, MomentCardButton, MomentVideo, OverlayNav,
     ShareImageMenu, SignificanceBadge, TrackFivePill, TrackGuideBar,
     VideoMomentCard, + tests). Components also used by other slices
     (MomentCardButton, DoorwayCard, OverlayNav…) keep their apps/web shim
     path so threads, merch and search don't change.
  2. CurrentItemDetail.tsx:65 `fetch('/api/intake')` → useHost().apiFetch
     (ApiRequest shape from @swift2/content; same method, headers, body).
  3. EraSecretCard: import trackKey from its real module, not TrackDetail.
  4. Non-test diff ≤ ~400; over → split C1 (EraStream/EraSection/feed
     cards) and C2 (detail/overlay cards).
Acceptance: as 2.4-A; the parity home a-vs-b compare stays green (side b
still renders through ReaderSpike, which now pulls the package components via
the apps/web shims; the spike resolver must still work. If the DOM export
breaks, STOP and report rather than editing apps/mobile).
Verify with: <Verify block>; narrow: packages/ui/src/reader/era. Browser
adds: current-item card → detail → "verify" submit (apiFetch path) in dev,
filter bar, countdown, deep link /?item=<id>.
<Repo rules block>
<Land block, BASE = the 2.4-B branch>
Return ≤ 300 words.
```

---

## Brief 2.4-D: the app mounts the package shell behind sharedUi

```
WP 2.4-D: the app's DOM reader mounts packages/ui ReaderRoot (shell + era
stream) with the app HostAdapter and a fromBundle ReaderSnapshot, behind
routeFlags.sharedUi / the C4 override, with the WP0.4b watchdog fallback
untouched. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.4 "The app's DOM
reader gains the slice behind sharedUi").
Depends on: G0 GO (WP0.6) and every row marked for D in the dependency
table. If any is unmerged, STOP and report.
Touch set: apps/mobile/dom/AppReader.tsx (git mv from dom/ReaderSpike.tsx),
apps/mobile/dom/reader-spike.css (rename only if needed), apps/mobile/dom/
bridge/app-adapter*.tsx (Link, Image, storage, env, insets, resolveUrl;
apiFetch/share/haptic/openExternal/onBack/navigate come from 2.3), apps/mobile/
dom/spike/reader-modules.ts (trim to MomentDetail only), apps/mobile/
components/SharedUiHost.tsx (import swap only; no new Expo-DOM surface),
apps/mobile/index.web.ts, apps/mobile/App.tsx ONLY if the PM approved Q3,
e2e/parity/{compare,helpers}.ts (a-vs-b viewport compare, header visible),
docs/one-ui/{parity,dom-host}.md, MAP.md, tests. Do NOT touch apps/mobile/
lib/watchdog*.ts, app.json/app.config.*, package.json native deps, or
packages/ui (if the package needs a change, STOP and report).
Touching anything else = stop and report.
Do:
  1. npm ci --silent. Confirm `git grep -n backTick -- apps/mobile packages`
     is empty (2.3-D) and the bridge client exists (2.3-C).
  2. App HostAdapter (dom/bridge/app-adapter.tsx), built inside a provider
     (no module singleton):
     - Image = plain <img referrerPolicy="no-referrer" loading=lazy|eager>
       replicating next/image fill inline styles (port
       dom/spike/stubs/image.tsx; HOST-ADAPTER.md "Image with fill").
     - Link = <a href> whose click is intercepted: DOM-owned paths →
       history.pushState + the store's navigation (X4 same path/query);
       native-owned (/settings/notifications etc.) → bridge navigate;
       external → openExternal.
     - storage = the WP0.5b Map-backed shim semantics (Android DOM has no web
       storage); note in the PR that progress doesn't persist across
       launches on Android (S5 check, not a fix here).
     - env = { origin: 'https://www.longlivets.com', turnstileSiteKey: null }.
     - insets from the 2.3-D insets event; resolveUrl = origin + path (Q4).
  3. AppReader.tsx ('use dom'; git mv ReaderSpike.tsx and keep its
     lifecycle: window error capture, read-local/devLoader, snapshot,
     probe/firstPaint/heap, onReady, placeholder sampling):
     - provide <HostProvider adapter={app}> + <ReaderSnapshotProvider
       value={snapshot}> (fromBundle via spike/snapshot.ts);
     - still call fill(snapshot) BEFORE requiring MomentDetail (the only web
       component still on the spike path; reader-modules.ts returns just it);
     - render <ReaderRoot slots={{ surfaces: { era: EraStream },
       overlays: [MomentDetail], fallback: NotInAppYet }} /> per Q2. No
       TopBar/nav overrides; reader-spike.css safe-area rules stay.
  4. SharedUiHost.tsx: import AppReader instead of ReaderSpike; nothing else.
     index.web.ts: render AppReader (parity side b).
  5. Parity: compare.spec.ts gains `a vs b viewport: <route>` at zero insets
     with the header and nav visible (now that b renders the web TopBar).
     NO existing baseline regenerated; new b-side files only if the PM
     approves (list them).
  6. Watchdog unchanged: the Diagnostics "force DOM failure" switch still
     falls back to the native screens, and the watchdog tests still pass
     unmodified.
  7. OTA size: report the scripts/parity/size-check.mjs delta. Over budget
     → STOP (no baseline bump without a recorded reason, G1 cond 3).
  8. Non-test diff ≤ ~400; over → split D1 (app adapter + tests) and D2
     (AppReader mount + parity).
Acceptance:
  - The web is pixel-identical: parity green on all four projects, no
    existing baseline changed, probe hash == fixture.json on both sides,
    check-dom-bundle (no baked content) green.
  - The app shows TopBar + era stream + BottomNav from packages/ui under the
    C4 override (and with remote sharedUi on); with both off, the native
    screens are unchanged.
  - The forced-failure switch and a ready timeout fall back to native
    (watchdog tests green; manual run in the dev client if available).
  - The native fingerprint is unchanged; both expo exports pass.
  - The Expo-DOM-specific code is still only in SharedUiHost.tsx +
    transport-expo.ts (grep proof in the PR).
Verify with: <Verify block>; narrow: apps/mobile/dom apps/mobile/lib/
watchdog.test.ts scripts/parity; plus node scripts/parity/check-dom-bundle.mjs
<ios export dir>; plus node scripts/parity/size-check.mjs (paste delta).
For the NEXT HA device session S5 (put these in the PR body; the PM batches
them; PLAN.md:376-385 + this slice):
  (1) iPhone, iPad, Android with the C4 override: the era stream looks like
      longlivets.com side by side (TopBar, scrubber rail, BottomNav; iPad ≥ md
      shows the pill rail and no BottomNav, in portrait, landscape and split view).
  (2) Notification tap to /?item=<id>, cold and warm: the moment opens over
      the era stream (needs 2.3-E).
  (3) Android back: closes the open moment first, then exits at the root;
      iOS edge swipe does not strand a blank webview.
  (4) Scroll restoration: scroll deep, open/close a moment and switch era via
      the scrubber; the position holds.
  (5) VoiceOver/TalkBack order: TopBar → main → BottomNav; the bell and
      search buttons are labelled.
  (6) The bell opens the native notification settings and returns to the
      same scroll spot (Q3).
  (7) Share from the TopBar opens the native share sheet, and focus returns;
      the card-image share falls back to a URL share (known).
  (8) Video moment cards: poster images load (not placeholders, X2); a tap
      opens the detail. Inline playback is the 2.5 check.
  (9) Returning from an external link restores the reader.
  (10) Rotation on iPad; phones stay portrait-locked.
  (11) Tabs not yet moved show the "Not in the app preview yet" panel (Q2),
      and back from it works.
  (12) Airplane-mode relaunch still renders (cache-first); forced DOM
      failure → native screens.
  (13) Android: reading progress does NOT persist across launches (expected
      until storage is native-backed; record it, don't fail S5 on it).
<Repo rules block>
<Land block, BASE = the 2.4-C branch>
Return ≤ 300 words: what changed, verification results (incl. fingerprint
hashes, OTA delta, parity run id), PR URL, open risks.
```

---

## PM notes (not for the executors)

- **Size estimates (non-test, `git diff -M`):** 0 about 60 (plus 8 PNGs),
  A about 250–350 (about 35 renames plus shims and two adapter swaps),
  B about 150–250, C about 150–300, D about 350–450, so D is the likely
  split (D1/D2).
- **Why not one PR:** the closure is about 74 files and 10k lines; three
  web moves plus one app mount keep each PR reviewable, and each one
  revertible.
- **Merge freeze (§6):** A–D touch `packages/**` and `apps/web/**`. During
  an open device session, queue them without merging.
- **Reviewer focus:** structure parity (the DOM order in ReaderShell), shims
  that are really one line, and no module-global state in the app adapter.
  For D, a Codex adversarial pass is recommended (the first production
  DOM-host path).
- **After D:** log in PROGRESS that S5 is waiting on 2.5–2.7. The checks
  above join the S5 list.
