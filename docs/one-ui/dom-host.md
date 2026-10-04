# Expo DOM host (One UI WP0.4)

The one native batch of the One UI programme (epic #4788, PLAN §C3). After
this store build, every later work package ships JS-only by OTA, including
the DOM bundles.

## What ships

- `apps/mobile/dom/SharedUiTest.tsx` — a `'use dom'` test page: Tailwind v4
  (`@tailwindcss/postcss` via `apps/mobile/postcss.config.mjs`, `@import
  'tailwindcss'` in `dom/shared-ui-test.css`), a runtime-switched `--era-*`
  variable, a Radix dialog (portal), a 50-row scroll list, and a bundled web
  font (inlined as a data URI: Metro CSS cannot import local font files yet,
  and the DOM webview ignores `expo-font`).
- `apps/mobile/components/SharedUiHost.tsx` — native host. Watchdog signals
  (WP0.4b adds persistence/timeouts): `dom-launch-attempted` (before mount),
  `dom-ready` (page calls async `onReady()`), `dom-error` (DOM-side
  `window.onerror` / `unhandledrejection` -> async `reportError`),
  `dom-process-terminated` (iOS `onContentProcessDidTerminate`),
  `dom-render-process-gone` (Android `onRenderProcessGone`). Supplying the two
  crash callbacks replaces the expo wrapper's auto-reload; the host does not
  reload, each crash is a watchdog strike that unmounts it.
- `routeFlags.sharedUi` (default `false`; `config/mobile/app-config.json`
  and `packages/content/src/app-config.ts`). When true, or when the
  diagnostics C4 "Force shared UI (this device)" override is on, App.tsx
  mounts the host instead of the native reader.
- Diagnostics access while the host is mounted (#4872): the Settings -> About
  path is unreachable, so an invisible native hot corner
  (`components/DiagHotCorner.tsx`, logic in `lib/diag-hot-corner.ts`) sits in
  both the top and the bottom safe-area inset strips (full window width, each
  `insets.*` tall), rendered outside the SafeAreaView so it never overlaps DOM
  content (it must not swallow the TopBar wordmark button). A strip renders
  only when its inset is >= 20 pt (`MIN_STRIP_HEIGHT`); if both are < 20
  nothing renders (Settings stays native-only). Geometry: the
  SafeAreaView pads all edges by the insets, and the DOM `body` pads `--safe-top`
  (= the same inset) again, so content starts at >= `insets.top`. Both strips
  feed one shared counter. To open Diagnostics on the shared-UI path: tap the
  status-bar area (top) or the bottom inset strip 7 times within 2 s, in any
  mix of the two.
  The same `DiagnosticsPanel`'s "Force shared UI" switch turns the override off
  (applies next launch).
- `apps/mobile/lib/orientation-lock.ts` — `app.json` is `orientation:
  "default"`; phones are locked to portrait at runtime (tablets rotate).

## Native-needs matrix (signed)

| Need | Status |
|---|---|
| react-dom 19.2.3 | added (JS; hoisted 18.3.1 stays for web, Metro pins mobile's copy) |
| react-native-web ~0.21.0 | added (JS) |
| @expo/metro-runtime ~57.0.16 | added (JS) |
| @expo/dom-webview ~57.0.1 | added (native) |
| react-native-webview 14.0.1 | present, kept via `expo.install.exclude` |
| expo-haptics ~57.0.3 | added (native) |
| expo-screen-orientation ~57.0.2 | added (native) |
| app.json `orientation: "default"`, `requireFullScreen: false` | added |
| iOS `associatedDomains`, Android `intentFilters` (apex + www) | added; `.well-known` files withheld until WP2.3 |
| `softwareKeyboardLayoutMode: "resize"` | added |
| Share, Linking, scheme, notification categories, safe areas, SecureStore, file-system cache, status bar, expo-updates, splash hold | present |
| `mailto:` via `openExternal` (WP2.13 A2b) | present: `Linking.openURL`; the handler and host validator accept only a bare `mailto:<address>` (`isMailtoUrl`), no native change |
| ATS exception, `expo-web-browser`, `.well-known` files | not needed / withheld |

JS-only additions for the test page: `tailwindcss`, `@tailwindcss/postcss`,
`@radix-ui/react-dialog`.

## Proof that DOM bundles ship by OTA

`npx @expo/fingerprint apps/mobile`: origin/main `71afa3f3…` vs this branch
`3603a03f…` (native sources added: dom-webview, haptics, screen-orientation,
log-box; autolinking and expoConfig changed). Branch plus a trivial edit to
`dom/SharedUiTest.tsx` stays `3603a03f…` (unchanged). `expo export` emits the
DOM bundle under `www.bundle/`.

## Watchdog for default-on (WP2.14)

**This MUST be merged, and installed apps must carry it, before any channel
publishes remote `routeFlags.sharedUi: true` or the compiled default flips.**
Without it a broken DOM bundle costs 2 of every 3 launches up to 10 s each,
and a flipped default cannot be killed remotely.

- **Resolved once per launch, from local state only.** Precedence:
  quarantine > override > cache > default. Quarantine = this build's record is
  `quarantined`; override = Diagnostics "Force shared UI"; cache = the last-good
  `app-config.json` `sharedUi` (`loadLaunchFlags`, one local read); default =
  `DEFAULT_ROUTE_FLAGS.sharedUi`. The network config is cached and applies on
  the NEXT launch: there is no native-to-DOM swap mid-launch.
- **Kill switch latency.** Set `sharedUi:false` in `config/mobile/app-config.json`
  and publish (docs/mobile-release.md). A device fetches it on a launch, so it
  is native from that device's second launch after publish. A device that never
  cached a config follows the compiled default. WP5.1 flips BOTH the JSON and
  the compiled default.
- **Quarantine.** Strike 2 owes one native fallback launch; the second such
  cycle in one `buildKey` (`QUARANTINE_AFTER_FALLBACK_CYCLES = 2`) quarantines the build:
  native on every launch until a new OTA or binary changes the `buildKey`, or
  Diagnostics "Reset watchdog". A ready launch zeroes the cycle count. Worst
  case per bad build: 4 failed launches (2 fallback cycles x 2 strikes; by design,
  Fable's ruling: a false quarantine persists until the next OTA, which costs more
  than 4 bad launches once), then native. A tampered or corrupt stored record is
  never trusted: out-of-range counters, wrong types or an unknown state mount
  native for that launch and reset the record. The ready timeout never gains time
  from a backward wall-clock step (monotonic clock within a launch; a negative
  delta counts as zero elapsed).
- **Pending screen.** While the launch resolves, a plain view in the reader's
  body-background token (`eraColors.bg`, the same `ERA_TOKENS.bg` that feeds
  `--era-bg`, never a literal) shows for at most `PENDING_MAX_MS = 1500`, then
  native mounts and the DOM never swaps in for that launch.
- **Telemetry (default OFF).** Category-only `[watchdog]` reports, a separate
  strict server schema (`{platform, buildKey, category}`; no model, OS, update id
  field or timings; the user-initiated `[diag]` path is unchanged), categories
  `ready-timeout | dom-error | webview-terminated | webview-render-gone |
  abandoned | protocol`), at most one per `buildKey` per day (persisted throttle),
  max 3 queued, sent when online (next launch at the latest). Only an explicit
  `watchdogReports:true` in the cached config turns them on; absent or false =
  off, and anything queued is dropped. The server also rejects more than 5 per
  `buildKey` per 10 minutes per instance (in-memory, best effort).
- **READY_TIMEOUT_MS stays 10 s** until S7 records time-to-ready per device;
  then set it to `max(10 s, 2 x p95 on the slowest device)`.
- **Protocol-fatal:** `DomWatch.protocol()` strikes with category `protocol`;
  the bridge host's `onProtocolFatal` calls it (wired in SharedUiHost, H0).
- **Bridge wiring (H0).** SharedUiHost builds one host + link per epoch
  (disposed on unmount; the DOM page is `key`ed by the epoch, so a recreated host
  always meets a freshly handshaking client) over `createUnwiredHandlers`: every
  command answers `failed` until H1/H3 supply real handlers; H2 adds `createLiveAppHandlers` (same map, `api` live over expo/fetch via `createLiveApiDeps`, expo-fetch-deps loaded lazily), and the DOM side `createBridgeApiFetch`/`createBridgeApiStream` (dom/bridge/api-fetch.ts). `apiStream` is buffered (G12): ClownChat in the app has no live investigation trail and shows its pending state until the full answer arrives (up to 60 s); request bodies are capped at 64 KB at the bridge boundary, responses at 256 KB. The SharedUiHost swap to `createLiveAppHandlers` and the app-adapter hookup land in W2-I. The DOM page gets two
  props: `inbox` (the host's un-acked sequenced envelopes, re-delivered whole)
  and `bridge` (a native action, `handlers.bridge`). `createBridgeLink`
  (lib/dom-host-handlers.ts) routes the host's `send`: sequenced envelopes go to
  `inbox`; a `res` or `readyAck` resolves the `bridge` call that is awaiting it,
  and the DOM client feeds it back. After dispose (fatal or unmount) every call
  rejects, a duplicate command id rejects the older call, and a repeated `ready`
  (webview reload) releases the pending ones. The DOM client's own fatal
  (`ready-failed`, `id-space-exhausted`) goes through the `reportProtocolFatal`
  action -> `watch.protocol()` (not `reportError`, which is ignored after first
  paint). ReaderSpike mounts `useExpoBridge` (renders
  nothing) only when `bridge` is supplied (never on web/dev): it sends `ready` after
  mount and drains `inbox`. A bridge-level `ready` does not call `watch.ready()` (the
  first-paint `onReady` still does; the `hang` drill is unchanged).
- **UI commands live (H1 / WP2.3-D2).** SharedUiHost passes the host
  `createWiredHandlers(onSignal, { ui: createUiDeps(...) })`: navigate,
  openExternal (https), share (RN `Share`), haptic (expo-haptics) are real; api and
  notifications stay unwired until H2/H3. Native-to-DOM: `insets` (from
  `useSafeAreaInsets`, on change and held until `ready`) and `contentVersion`
  (bundle version, once per change). The DOM is the sole inset owner: it sets
  `--safe-*` from the `insets` event (the `insets` prop is web/dev only).
  Hardware back: `createBackHandler` sends a `back` command (1000 ms); before
  `ready` the press falls through to native, after it the DOM answers `handled`
  (the reader closed an open item) or `exit` (root, timeout or error: `exitApp`).
  The `backTick` counter is deleted. The reader Shell registers the responder and
  `useExpoBridge(props, hooks, setup)` subscribes `insets`, `contentVersion` and
  `back` before the inbox is consumed. `withFocusRestore(fn)`
  (dom/bridge/focus-restore.ts) returns focus after a native sheet closes; the app
  adapter (`dom/bridge/app-adapter.tsx` `share`) wraps its bridge call with it (live once D2 mounts the adapter).
- **Navigate contract.** DOM to native `navigate {path, replace?}` takes a web path
  (X4: `/?screen=settings`, `/?item=<id>`, `/?mode=threads`). `isNativeRoute`
  (lib/routes.ts, live flags via `getRouteFlags`) true: the D-7 presenter
  (`presentNativeRoute`, SharedUiHost prop supplied by App.tsx in H4/D1) opens it
  natively; with no presenter attached the reply is `failed`. False: `invalid`,
  and the DOM routes it itself (history API). Native to DOM `navigate {path,
  source}` is `BridgeHost.emit('navigate', ...)` (`navigateSink`, H3).
- **Not yet wired.** TODO(PM, WP2.4-D): overlay clearing and the presenter prop.

**Notification taps (H3).** App.tsx calls `useNotificationTaps(navigate, mount==='native')` (lib/use-notification-taps.ts). `lib/notification-tap-ingest.ts` serializes the cold `getLastNotificationResponseAsync` read (+ clear) and the live listener into `lib/notification-tap-gate.ts`, which wraps the E1 queue (15 s ack, 10 min TTL, cap 16). Dedupe key = `request.identifier`, else `anon:<date>|<deepLink>`; a response with neither is rejected. Targets: native mode (DOM not mounted) opens native screens; a link the queue refuses opens its canonical `siteUrl+path` or home, never the raw string; a bound+ready host gets bridge `navigate` (`source:'notification'`), delivered on ack, re-awaiting the same event (no re-emit) after an ack timeout; retried every 5 s while held and on AppState active; otherwise taps hold. `bindHost(host)` returns an epoch lease cleanup that unbinds only if still current. **Not wired yet (SharedUiHost, post-H1):** spread `{...createUnwiredHandlers(onSignal), ...createExpoNotificationHandlers()}`; bind the current epoch's host only after bridge `ready` AND the reader's ready signal, after H1's navigate subscriber exists; call the lease cleanup on fatal, crash/render-gone, watchdog fallback, readiness loss and unmount, before disposing host/link; every readiness loss needing a rebind must create a new keyed host/client epoch (never rebind a detached live host).

**G4 drill.** Simulated (no device): `npx vitest run
apps/mobile/lib/watchdog-drill.test.ts --reporter=verbose` runs every failure
mode (`hang`, `throw`, `terminated`, `render-gone`, `protocol`, `abandon`)
through the real rules and prints the launch table (`runDrill`/`drillTable` in
`lib/watchdog-drill.ts`). On device, offline, shared UI on via the remote flag:

1. Diagnostics > Force DOM failure `hang`, airplane mode, relaunch: neutral
   background within 1.5 s, the DOM attempt, native after the ready timeout
   (strike 1). Relaunch: strike 2, native. Relaunch: fallback launch (native, no
   attempt). Relaunch twice more: quarantined, native with no attempt.
   Diagnostics shows `Quarantined: yes`.
2. Failure `off`, Reset watchdog, relaunch: the shared UI returns (via the remote flag; a strike-2 watchdog clear turns the manual Force shared UI override off and Reset does not restore it, so re-toggle it). `throw`
   repeats step 1 faster.
3. With `watchdogReports:true` cached and back online: one `[watchdog]` comment per build per day on #4791.
4. A notification tap while quarantined/fallback lands on the native screen (H3: `useNotificationTaps` -> native navigator).

## Insets, native overlay and the app adapter (WP2.4-D1, #4953)

- **One inset owner.** While the DOM host is mounted, App.tsx's `SafeAreaView` has `edges={[]}`: the host is edge-to-edge and the DOM alone applies `--safe-top`/`--safe-bottom`. Native screens, the fallback and the update screen keep all four edges. The diag hot-corner strips are siblings rendered outside the `SafeAreaView` (absolute, sized by `useSafeAreaInsets()`), so they sit above the full-bleed webview and are unaffected. The stale comment on `domContentRect` (`lib/diag-hot-corner.ts`) still describes the old padded layout (follow-up, outside D1's touch set).
- **Native overlay.** `presentNativeRoute` (pure presenter in `lib/dom-host-handlers.ts`) drives an RN `Modal` over the still-mounted `SharedUiHost` (never an unmount). Native owns hardware back in every phase but idle; opening/closing carry deadlines, so App.tsx schedules one `tick` after each transition (`msUntilDeadline`); leaving `mount === 'dom'` (watchdog fallback) resets the overlay. The overlay resets whenever the DOM surface is not rendered (`domSurfaceRendered`: mount is not dom, or update-required). The Modal is a separate native window, so it renders its own diag hot-corner strips; every strip feeds one app-wide 7-tap counter (`sharedHotCornerUnlock`), so top/bottom/mixed taps work with the overlay up. RN `Modal.onDismiss` is iOS-only: on Android the closing phase resolves through the deadline tick. State/effects live in `lib/use-native-overlay.ts`, rendering in `components/NativeOverlayHost.tsx`. Not yet reachable: the route allow-list (`dom/slots/routes`) is empty and `presentNativeRoute` is handed to the bridge `navigate` handler in D2.
- **App HostAdapter** (`dom/bridge/app-adapter.tsx`, helpers in `app-adapter-nav.tsx`; not mounted until D2). Built per provider. `Link` intercepts clicks (every in-app route must pass `toWebPath`; https elsewhere -> bridge `openExternal`; malformed paths, `//host`, `javascript:`/`intent:`/`file:`/`mailto:` and plain http are consumed and dropped; every `_blank` click is consumed whatever the modifiers); `installBlankCapture` does the same for plain `a[target=_blank]` in the bubble phase, so page handlers can `preventDefault()` first. `navigate` sends native-owned routes over the bridge and the rest to the injected DOM navigator. `Image` replicates next/image `fill` styles. `storage` is tri-state (#4923): `null` = absent key, `undefined` only when the area is unavailable. `currentUrl` is the in-DOM web path on the canonical origin, never `file://` (`toWebPath(getPath())`, falling back to `/`; feedback reports keep their location). `embedOrigin` is the canonical origin.

## Open items

- Device proof (onReady, crash callbacks, file-origin storage durability) is
  the S3 session.
- `expo-doctor` flags a duplicate `react-dom` (18.3.1 hoisted for web vs
  19.2.3 for mobile; same split as `react`, handled by the Metro singleton
  pins) and patch-level SDK drift on pre-existing packages (deliberately not
  bumped: this batch adds only the signed list).
- **WP0.4b watchdog (this note is now satisfied on builds that include `lib/watchdog*.ts`):** a ready-timeout (10 s, paused while backgrounded), a DOM error before ready, or a webview terminate/render-gone is a strike. Strike 1 mounts native for that launch; strike 2 (consecutive) clears the C4 override and keeps the next launch native too. A launch that died in the foreground before ready counts as a strike at the next launch (`abandoned-before-ready`); one backgrounded before ready is abandoned, but 2 consecutive abandons are a strike (`abandoned-repeated`), so a stale or lost background marker cannot pin the DOM host. Bound: at most 4 launches before the native fallback (2 abandoned = strike 1, 2 more = strike 2); a double-failed ready save costs at most one false strike, cleared by the next ready launch. Re-enabling the override in Diagnostics clears the record; a new build/update id resets it. Drill with Diagnostics > Force DOM failure (off/throw/hang; applies next launch); state is shown in the panel only (the `[diag]` schema is not extended).
- **App links declared but unverified until WP2.3 ships URL intake + .well-known; risk accepted (Codex vs Fable disagreement recorded in PROGRESS).** Without  files Android 12+ opens these links in the browser by default; only test devices exist (C5).

## Speed test mode (#4896) — the S2/S4 device procedure

Replaces "force-stop, 7 taps, Send report, repeat 10 times". Three steps:

1. Open Diagnostics (hot corner or Settings version label) and turn on **Speed test mode**. Close the panel.
2. Run the launches: force-stop and reopen for cold, or press Home and reopen for warm. Nothing else to tap.
3. After the 10th launch the mode switches itself off and posts one summary comment (per-launch table, worst cold, worst warm, PASS/FAIL).

Behavior:

- Each launch posts a `[diag]` comment on #4791 tagged with the run id (`run abcd1234, launch 3 of 10`). A cold report is held until T+10 s so it can carry `Images loaded by T+10 s`; backgrounding the app sends it early with the count so far.
- Cold vs warm comes from the process, not the content cache: a new JS runtime is cold; AppState background -> active inside one process is warm and gets fresh marks anchored to the resume (`resume-paint`). Fixes the S2 reports that were all labelled warm and repeated stale `at:` marks.
- Cold clock: when RN's `performance.rnStartupTiming.startTime` is available the report adds `native-lead` (native app start to JS start) and says `Clock starts at: native process start`; otherwise it says `JS start (native lead unavailable)` and the number is JS start -> first-era-paint. Cold number = native-lead + `at:first-era-paint`. Unverified on device until the first S2/S4 run.
- Bar (PLAN.md §WP0.2): cold <= 2500 ms worst, warm <= 1000 ms worst, worst-of-5 per kind. PASS needs at least 5 cold AND 5 warm launches; fewer is INCOMPLETE (so a run of 10 should be 5 force-stops and 5 resumes), and any launch over the bar is FAIL. The server recomputes the verdict from the raw launches.
- Delivery: reports go to a small persisted outbox and leave it only when the server accepts them (or answers a permanent 4xx). A 429 or network failure is retried with backoff (1 min doubling to 1 h, 8 attempts) on the next paint or foreground; the panel shows how many are waiting. Speed test reports have their own server budget (31 per run id, 300 per 24 h) instead of the 5/min per-IP limit, and the server answers a repeated (run, launch index) or second summary with 200 duplicate (in-memory, per instance, best effort).
- Cost when off: after one startup read the state lives in memory, so a paint with the mode off and nothing queued does no storage work, and the shared-UI image onLoad reporting is only wired (no bridge call, no layout read) while the mode is running.
- Approximations: shared-UI `first-era-paint` is marked at the host's `dom-ready` (two animation frames after the reader mounts; no finer hook exists), and warm `resume-paint` is the first animation frame after the AppState resume.
- `first-era-paint` is the native era stream's first frame, or the shared-UI host's `dom-ready`; each report records which (`UI | native/shared`). `first-image-paint` = first loaded image inside the viewport. Shared UI reports via ReaderSpike's `reportImageLoad` prop (the next/image stub's `onLoad`), native via `MomentCard` `onLoad`.
- State (run id, remaining, results) is one SecureStore key `longlive_diag_speed_test_v1`. The server caps reports at 31 per run id and 300 per 24 h overall, on top of the existing 5/min per IP.
- Opt-in by the tester; unrelated to the category-only watchdog telemetry.

## YouTube embeds in the DOM host (#4954)

The DOM page is a null origin and sends no Referer, so a direct YouTube iframe fails with error 153. No `baseUrl` spoofing (G0 ruling 2026-10-04). Instead, when the host sets `embedOrigin` (the app sets `https://www.longlivets.com`; web omits it), `MomentVideo` and `MoodSongCard` point the iframe at `https://www.longlivets.com/embed/youtube/<id>` (via `youtubeEmbedSrc`, `packages/ui/src/reader/lib/youtube-embed.ts`). That route handler (`apps/web/app/embed/youtube/[id]/route.ts`, static HTML, no root layout) serves only a full-bleed youtube-nocookie iframe on the real origin, so YouTube sees a real embedder. The outer iframe is a navigation, so no CORS change. Web keeps the direct iframe. Both iframes carry `referrerPolicy="strict-origin-when-cross-origin"`. Spotify is out of scope.

Framing: the site denies framing everywhere (`frame-ancestors 'none'` and `X-Frame-Options: DENY`, both set in `proxy.ts`). For exactly `/embed/youtube/<11-char id>` only (one shared case-sensitive predicate in `security-headers.mjs`; extra segments, trailing slash and every other path keep full protection), `frame-ancestors` is omitted (not `*`, which does not match a file:/custom-scheme parent) and X-Frame-Options is not sent. The page only shows a video, so framing it has no clickjacking value. Id must match `^[A-Za-z0-9_-]{11}$`, else 404.
