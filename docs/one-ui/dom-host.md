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

## Open items

- Device proof (onReady, crash callbacks, file-origin storage durability) is
  the S3 session.
- `expo-doctor` flags a duplicate `react-dom` (18.3.1 hoisted for web vs
  19.2.3 for mobile; same split as `react`, handled by the Metro singleton
  pins) and patch-level SDK drift on pre-existing packages (deliberately not
  bumped: this batch adds only the signed list).
- **WP0.4b watchdog (this note is now satisfied on builds that include `lib/watchdog*.ts`):** a ready-timeout (10 s, paused while backgrounded), a DOM error before ready, or a webview terminate/render-gone is a strike. Strike 1 mounts native for that launch; strike 2 (consecutive) clears the C4 override and keeps the next launch native too. A launch that died in the foreground before ready counts as a strike at the next launch (`abandoned-before-ready`); one backgrounded before ready is abandoned, but 2 consecutive abandons are a strike (`abandoned-repeated`), so a stale or lost background marker cannot pin the DOM host. Bound: at most 4 launches before the native fallback (2 abandoned = strike 1, 2 more = strike 2); a double-failed ready save costs at most one false strike, cleared by the next ready launch. Re-enabling the override in Diagnostics clears the record; a new build/update id resets it. Drill with Diagnostics > Force DOM failure (off/throw/hang; applies next launch); state is shown in the panel only (the `[diag]` schema is not extended).
- **App links declared but unverified until WP2.3 ships URL intake + .well-known; risk accepted (Codex vs Fable disagreement recorded in PROGRESS).** Without  files Android 12+ opens these links in the browser by default; only test devices exist (C5).
