# WP0.5 - real screens in the DOM host (spike)

JS-only (C3): no native change, fingerprint `3603a03f...` unchanged.

## What runs

`apps/mobile/dom/ReaderSpike.tsx` (`'use dom'`), mounted by `SharedUiHost` under
the C4 override. The WP0.4 test page stays reachable: Diagnostics > "Use WP0.4
test page, not ReaderSpike" (next launch).

1. Host passes only a cache-file `file://` URI + version token (config, not
   content; PLAN C6 amended). The URI is the loader's `last-good` record
   (`@swift2/content:v1:<baseUrl>:last-good`, one JSON file `{ manifest, files }`
   under `Paths.document/swift2-content-cache/`). The native loader keeps
   download/verify/write; the host renders from the cache already on disk
   (offline relaunch) and refreshes in the background.
2. Webview installs the localStorage/sessionStorage shim FIRST (Android DOM
   webview has DOM storage off), then `readLocalText(uri)`: fetch, then XHR
   (Chromium rejects fetch on `file:`; XHR success = readyState 4 + non-empty
   `responseText`, status is 0).
3. `unwrapEnvelope` -> `ReaderSnapshot.fromBundle` in the webview -> snapshot
   hash + counts -> `fill(snapshot)` (WP0.5a shims).
4. Only then `require()` of EraStream, MomentDetail, BottomNav (module-level
   constants derive from the filled arrays, so never static imports).

## Finding: no code-split chunks in the DOM export

The first version used `await import()` for step 4. `expo export` for ios and
android then failed in DOM export (`Asset not found: _expo/static/js/web/__common-*.js`
from `serializeHtml`). Metro evaluates a module on its first `require`, so
call-time `require()` gives the same ordering with a single bundle. Keep it
that way until the CLI supports split DOM bundles.

## Bridge minimum

- `onReady` (watchdog) fires after two animation frames post-mount.
- Android back: host increments `backTick` on `hardwareBackPress`; the webview
  closes an open moment (`handled`) or reports `exit` (host calls `exitApp`).
- Insets: `--spike-inset-top/bottom` CSS variables.
- `reportProbe(json)`: one JSON string of facts (below); no content.
- Forced failure drills still work (`throw` reports an error, `hang` withholds ready).

## Diagnostics (panel only)

Diagnostics > "Reader spike": bundle version, read result per method
(fetch/xhr/script), localStorage/indexedDB present|shimmed|throws, version-marker
hit/miss from the previous launch (kept for the record), snapshot hash +
items/eras (S4: must equal the CI equivalence hash for that bundle version),
first-paint ms, JS heap (Chromium only), and `bad/total` images per host
(naturalWidth <= 2 or errored, counted 4 s after first paint).
The strict `[diag]` server schema is untouched; promoting these into reports is
a follow-up.

## Not built

- No IndexedDB adapter (Android has no web storage; ruling B).
- No `bundle.js` / `<script src>` content fallback. The `script` probe loads the
  cache file as a script only to record whether subresource loads work. If XHR
  fails on iOS at S4, the RN side writes `bundle.js` (`globalThis.__bundle=<json>`)
  beside the cache: still JS-only.
- Fonts are system fallback. Affiliate env vars are undefined in the webview.
  React 19 runs the React-18-authored web components. `next/image` is a lazy
  `no-referrer` `<img>` (file:// sends none anyway, so CI and device match).

## Recipes

No-baked-content check (committed; CI hook deferred, run on any native export):

```
cd apps/mobile && npx expo export --platform ios --source-maps --output-dir <dir outside the repo>
node scripts/parity/check-dom-bundle.mjs <dir>
```

Browser view (Chromium + WebKit). `app.json` lists only ios/android and
`package.json` `main` is the native entry, so for the throwaway export set,
locally and WITHOUT committing, `expo.platforms` += `web`, `expo.web =
{ "bundler": "metro", "output": "single" }` and `main` = `index.web.ts`; then
`npx expo export --platform web --output-dir <dir outside the repo>` and serve
that dir with `/content/` mapped to `apps/web/public/content` (from
`npm run sync:content`). `index.web.ts` + `spike/dev-loader.ts` are the
dev/web-only path that assembles the cache envelope from that served bundle;
the check script fails if either reaches a native DOM bundle.
Production persistence checks must use a store/production build, never a dev client.
