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
  cycle in one `buildKey` (`QUARANTINE_AFTER = 2`) quarantines the build:
  native on every launch until a new OTA or binary changes the `buildKey`, or
  Diagnostics "Reset watchdog". A ready launch zeroes the cycle count. Worst
  case per bad build: 4 DOM attempts, then native.
- **Pending screen.** While the launch resolves, a plain view in the reader's
  body-background token (`eraColors.bg`, the same `ERA_TOKENS.bg` that feeds
  `--era-bg`, never a literal) shows for at most `PENDING_MAX_MS = 1500`, then
  native mounts and the DOM never swaps in for that launch.
- **Telemetry.** Category-only `[diag]` reports (`watchdog-fallback`,
  `watchdog-quarantine` plus one `wd-<category>` stage, categories
  `ready-timeout | dom-error | webview-terminated | webview-render-gone |
  abandoned | protocol`), at most one per kind per `buildKey`, max 3 queued,
  sent when online (next launch at the latest). `watchdogReports:false` in the
  config stops and drops them (absent = on).
- **READY_TIMEOUT_MS stays 10 s** until S7 records time-to-ready per device;
  then set it to `max(10 s, 2 x p95 on the slowest device)`.
- **Protocol-fatal:** `DomWatch.protocol()` strikes with category `protocol`;
  the bridge host's `onProtocolFatal` calls it when the host is wired in.

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
2. Failure `off`, Reset watchdog, relaunch: the shared UI returns. `throw`
   repeats step 1 faster.
3. Back online: one `[diag] watchdog-quarantine` comment per device on #4791.
4. A notification tap while quarantined lands on the native screen.

## Open items

- Device proof (onReady, crash callbacks, file-origin storage durability) is
  the S3 session.
- `expo-doctor` flags a duplicate `react-dom` (18.3.1 hoisted for web vs
  19.2.3 for mobile; same split as `react`, handled by the Metro singleton
  pins) and patch-level SDK drift on pre-existing packages (deliberately not
  bumped: this batch adds only the signed list).
- **WP0.4b watchdog (this note is now satisfied on builds that include `lib/watchdog*.ts`):** a ready-timeout (10 s, paused while backgrounded), a DOM error before ready, or a webview terminate/render-gone is a strike. Strike 1 mounts native for that launch; strike 2 (consecutive) clears the C4 override and keeps the next launch native too. A launch that died in the foreground before ready counts as a strike at the next launch (`abandoned-before-ready`); one backgrounded before ready is abandoned, but 2 consecutive abandons are a strike (`abandoned-repeated`), so a stale or lost background marker cannot pin the DOM host. Bound: at most 4 launches before the native fallback (2 abandoned = strike 1, 2 more = strike 2); a double-failed ready save costs at most one false strike, cleared by the next ready launch. Re-enabling the override in Diagnostics clears the record; a new build/update id resets it. Drill with Diagnostics > Force DOM failure (off/throw/hang; applies next launch); state is shown in the panel only (the `[diag]` schema is not extended).
- **App links declared but unverified until WP2.3 ships URL intake + .well-known; risk accepted (Codex vs Fable disagreement recorded in PROGRESS).** Without  files Android 12+ opens these links in the browser by default; only test devices exist (C5).
