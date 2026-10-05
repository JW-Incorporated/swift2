# One UI app architecture: current main (2026-10-05)

State of `apps/mobile` as merged on `main` on 2026-10-05. Only merged work is documented. Per-component detail (watchdog, insets, embeds, hardening) stays in `dom-host.md`; screenshot parity in `parity.md`.

## Shape

The app mounts the shared reader (`packages/ui`, via `apps/mobile/dom/AppReader.tsx`) in one Expo DOM host (`SharedUiHost`, mounted by `DomHostMount`). The legacy native UI was deleted in #5047 (2026-10-05): the shared UI is the only content UI, and whenever the DOM host is not mounted (every watchdog outcome, `flag-off`) `RecoveryScreen` renders instead. `sharedUi` and `sharedUiIos` are both `true` in `config/mobile/app-config.json` and `DEFAULT_ROUTE_FLAGS`. The only native screens are app-state surfaces: `FirstLaunchScreen` (downloading / offline), `RecoveryScreen` (Retry, Send report, legal links), `UpdateRequiredScreen`, plus the Diagnostics panel (hidden hot corner or `longlive://diag`; there is no About screen). Native keeps capabilities only: notifications, share, haptics, external links, network, file cache, system Back.

## Native <-> DOM bridge contract

Source of truth: `packages/ui/src/bridge/messages.ts` (types + registries), `validate.ts` (strict validation), `packages/ui/src/bridge/README.md`. Native side: `apps/mobile/lib/bridge-host*.ts`, handlers in `bridge-handlers-{ui,api,notifications}.ts`, wired by `app-handlers.ts` (`createAppHandlersFor`, one map; a key claimed twice throws; every unclaimed key answers `failed`).

- **DOM -> native commands (request/response, `res` ack):** `navigate`, `share` (optional `image: {url}`), `haptic`, `openExternal`, `notifications.{status,request,register,updatePrefs,getPrefs,savePrefs,unregister,registration,onboardingOffered,markOnboardingOffered}`, `api`, `apiRead`, `cancel`.
- **Native -> DOM command:** `back` (`handled | exit`, 1000 ms).
- **DOM -> native events (fire-and-forget):** `ready`, `diag`, `ack`, `navReady`, `navigated {id, ok}`, `theme`.
- **Native -> DOM events:** `insets`, `contentVersion`, `readyAck`, `navigate {path, source: 'notification' | 'deeplink', id?}`.
- **Not in the contract on main:** no storage, clipboard or route commands. `HostStorage` is a per-launch in-memory Map on both platforms (the adapter never touches WebView `localStorage`); nothing persists across launches (persistent storage is not merged). The clipboard is used only natively inside `share`.
- **Strict gates.** Unknown command/event types, bad payload shapes, request bodies over 64 KB and responses over 256 KB are rejected at the bridge boundary (`invalid`). `openExternal` accepts only https (plain `http:` is upgraded to https by the DOM adapter, #5054) or a bare allow-listed `mailto:`. `navigate` takes web paths only and goes through the one destination resolver (below). `share.image.url` must be `https:` on the site host, else `invalid`.
- **Share as image (#5056).** The DOM sends only the card URL (`host.resolveUrl(shareCardPath(...))`); no bytes cross the bridge. Native downloads the PNG to `cache/share/` (8 s timeout, `lib/share-card-ports.ts`). iOS: `Share.share({url: file://...})`. Android: copies the image (`Clipboard.setImageAsync`) then shares the text link, and the DOM shows "Image copied". Any failure falls back to the text+link share. Android share-as-file needs `expo-sharing` in the next store build (#5055).
- **Streaming API.** `api {stream:true}` answers at headers with a `streamId`; the DOM loops `apiRead` (pull-based, buffer limits in `dom-host.md`); `cancel {targetId}` closes it.
- **Bridge token.** There is NO per-epoch bridge token on main; any frame inside the DOM webview can post to the bridge (`@expo/dom-webview` exposes its native bridge to every frame, #5078). #5079 (open) adds a per-epoch token as the OTA mitigation; its CSPRNG needs `expo-crypto` in the next store build (#5084); the durable fix is a main-frame-only patch needing a native build (#5078).

## Content: last-good cache and the iOS script twin

iOS WKWebView (via `@expo/dom-webview`) never enables `allowFileAccessFromFileURLs`, so the file:// DOM page cannot fetch/XHR the native cache (#5045). `lib/vault-storage.ts` therefore writes each `:last-good` cache as a `.json` plus a `.js` twin, and `dom/reader/read-local.ts` reads script first, then XHR, then fetch.

- **Format v2 (object literal).** The twin is `globalThis.__swift2LastGood=<the JSON as a JS object literal>;globalThis.__swift2LastGoodId="<id>";`, so the DOM gets the parsed object with no second `JSON.parse` (`ReadResult.parsed`). U+2028/2029 stay escaped; a document containing a `__proto__` key keeps the older string-literal form. File name `<key>.v2.js` (`lastGoodScriptName`), so a legacy twin can never pass as current.
- **Cache-busting.** `contentId` = FNV-1a 32-bit of the JSON text plus its length; it is the twin's id and the `?v=` query on the script URI.
- **Atomic write.** Temp file then move (`writeLastGoodTwin` / `writeLastGoodTwinAsync`); a reader sees the old or the new twin, never a partial one. A successful write deletes the legacy twin.
- **Legacy migration.** The reader accepts both forms, and `dom-reader-config.ts` backfills a v2 twin from an existing `.json` (first launch after the OTA); older string-literal twins keep loading and are migrated after first paint.

## Deferred bundle refresh (#5073)

With a cache on disk the DOM already has its data, so the native `loadContentBundle` refresh (multi-MB sync read/parse on the RN thread) is held until the DOM reports `ready`, then runs after interactions (`lib/deferred-bundle-refresh.ts`, hook `use-deferred-bundle-refresh.ts`). No cache: it runs immediately (it is the first paint's input). Bounded by `REFRESH_DEFER_TIMEOUT_MS` = 6000 (below the 10 s ready timeout); disposing the host flushes it; it runs at most once per launch. Diag marks `bundle-refresh-start|done|failed`. Content adoption on foreground is NOT merged: a running app adopts a new bundle only through this one launch-time refresh.

## One ordered Back stack

All Back handling in the DOM goes through one module-level ordered stack in `packages/ui/.../useBackDismiss.ts`, driven by both web popstate and native Back. Entries are overlays (search, era picker, track guide, song, moment, lightbox, share menu, expanded ClownChat, settings, inbox, push offer; open order sets precedence) and navigation entries (era / mode changes). Native hardware Back (`back` command, `dom/bridge/reader-bridge.tsx`) takes the top entry: an overlay is dismissed (#5067); a nav entry is consumed with `history.back()`, so popstate restores state once and history and the stack stay in sync (#5083, same as the website's browser Back). A pending dismissal makes a rapid repeat Back answer `handled` (`nativeClosing`, 500 ms safety net); a legal page (`dom-path`) pops first. Only with an empty stack does the DOM answer `exit` (`exitApp`). While a native overlay Modal is up, native owns Back. Closing a non-top entry marks it buried; a later pop landing on it steps through.

## Deep links and notification taps

Both intakes share one queue and one canonicalizer.

- **Deep-link intake (#5069, `lib/use-deep-links.ts`).** Cold `Linking.getInitialURL` and live `url` events, validated, enqueued with source `deeplink`. Accepted: `https://www.longlivets.com` (the apex is also accepted by the queue, pre-existing for notification links) and `longlive://<path>` / `longlive:///<path>`; traversal (plain or percent-encoded dots), backslashes, whitespace/control characters, a second leading slash and URLs over 2048 chars are ignored. The cold URL and its first matching `url` event share a `cold:<hash>` id (deduped); later identical taps get sequence ids. HTTPS universal links are NOT live: they need the association files (`.well-known`, #4988 after HA #99), so until then only `longlive://` and OS-delivered www URLs open the app (`x4-universal-links.md`).
- **Notification taps (H3, #4968/#4982).** `lib/use-notification-taps.ts` -> `notification-tap-ingest.ts` (serializes the cold `getLastNotificationResponseAsync` read and the live listener) -> `notification-tap-gate.ts` -> queue (`notification-tap-queue.ts`: 15 s ack, 10 min TTL, cap 16, dedupe on `request.identifier`).
- **One canonicalizer (#5037, #5069).** `lib/destination-resolver.ts` decides for taps, deep links, the bridge `navigate` handler and the native overlay presenter; the queue's `resolveTapDestination` delegates to it, and `lib/routes.ts` now holds only the `sharedUi` flags. Only the site host (https, no port/userinfo), the site origin or a relative path is interpreted; `/api`, `/internal` and `/_next` and hostile links are rejected. Backend producers emit links the site understands (#5049); the vocabulary is tested in `notification-link-vocab.test.ts`.
- **Delivery.** Reader paths go to the DOM as `navigate {path, source, id}` once the epoch is bound (bridge ready AND reader painted AND `navReady`; `tap-bind-epoch.ts`), applied through the reader store, and counted delivered only on host ack AND `navigated ok:true`. A lost `navigated` re-emits the same id; after `MAX_UNCONFIRMED_ATTEMPTS` (3) the path is consumed; an explicit `ok:false` is consumed (#5037). Other paths open natively (presenter or site URL). In fallback/quarantine the Recovery screen shows and taps stay held in the in-memory tap gate until a DOM host binds and acks.

## Watchdog on main (and what is pending)

Behaviour on main is as written in `dom-host.md` "Watchdog": local-only launch resolution (quarantine > override > cache > default), 1500 ms pending bound, 10 s ready timeout, strike 2 and quarantine, native fallback surface is the Recovery screen, `[watchdog]` telemetry default OFF. The iOS-specific hardening and the script twin (#5045) exist so the iOS DOM can reach ready; iOS device proof is still outstanding (HA #100).

Merged since: #5042 (default on, `sharedUiIos` separate flag, Diagnostics "Force shared UI" override removed, attempt write bounded at 3000 ms), #5043 (Recovery screen replaces the native fallback) and #5047 (legacy native UI deleted; `flag-off` shows Recovery and OTA rollback is the lever, the JSON kill switch is gone).

## Images and storage

- **Responsive images (#5070).** The app image adapter (`dom/bridge/responsive-image.ts`) mirrors next/image srcset generation (default device/image sizes, q=75) against the site's `/_next/image` optimizer, so the app fetches the same CDN-cached variants as the web instead of full-resolution art. Non-optimizable (svg, gif, unoptimized) sources are left alone.
- **Offline art (#5074, #5111).** Offline era and first-party moment art is served from the app's art cache (#5111, see `packages/ui/HOST-ADAPTER.md`); offline behaviour on a real device is still to be checked (S4).
- **DOM storage.** The reader's `local` storage is an in-memory Map seeded from a native blob loaded once before mount and persisted back as debounced full-map snapshots through the bridge (`dom/reader/storage-sync.ts`); the other area is per-launch.

## Known gaps

| Issue | What |
|---|---|
| #5078 | Bridge reachable from every frame (embeds); durable main-frame-only fix needs a native build |
| #5079 | Per-epoch bridge token mitigation, open |
| #5084 | `expo-crypto` for the token CSPRNG (next store build) |
| #5055 | Android share-as-file needs `expo-sharing` (next store build); interim copy-image behaviour |
| #4988 / HA #99 | Universal-link association files and verification |
