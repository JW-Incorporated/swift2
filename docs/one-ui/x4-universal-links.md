# X4 universal links: H6 (implemented in a DRAFT PR, NOT shipped)

**H6 status:** implemented. Files live in `apps/web/public/.well-known/` with the `<APPLE_TEAM_ID>` / `<PLAY_APP_SIGNING_SHA256>` placeholders (HUMAN-ACTIONS #99). Do not merge before those values are filled and the PM approves: app.json changed (native config, new store builds). **PM ruling:** claim `www.longlivets.com` only; the apex 308-redirects at the Vercel domain level, which Apple and Android reject, so the apex is removed from `associatedDomains` and the Android intent filter (the blocker section below is resolved as option b). Intake: `apps/mobile/lib/use-deep-links.ts` (cold `getInitialURL` + `url` events, canonicalizeLink-validated, deduped by URL within 3 s, id `deeplink:<time>|<url>`) feeds the H3 tap gate with `source: 'deeplink'`; headers for the two files are in `apps/web/next.config.mjs`.

Programme: One UI (epic #4788). Owner of this work: H6, which needs H3
(notification tap wiring) merged first. The two association files (now in
`apps/web/public/.well-known/`) must not ship before H3 and H6 land. Reason: once served,
iOS/Android start routing longlivets.com links into the app, which has no
Linking intake yet.

## Values already known (public config, `apps/mobile/app.json`)

| Value | Found |
|---|---|
| iOS bundle id | `ai.jwlabs.longlive` |
| Android package | `ai.jwlabs.longlive` |
| iOS `associatedDomains` | `applinks:longlivets.com`, `applinks:www.longlivets.com` (already in app.json) |
| Android intent filter | `autoVerify: true`, https, hosts `longlivets.com` and `www.longlivets.com` (already in app.json) |
| URL scheme | `longlive` |

H6 narrows app.json to www only (a native change, fingerprint changes).

## Values still needed from the owner (placeholders in the drafts)

- `<APPLE_TEAM_ID>` in `apple-app-site-association` (10 characters).
- `<PLAY_APP_SIGNING_SHA256>` in `assetlinks.json` (Play app signing key,
  NOT the EAS upload key). If an EAS-signed sideload/internal APK must also
  verify, add the upload-key SHA-256 as a second array entry.

## Blocker to rule on: apex redirect

`docs/deploy.md` says `longlivets.com` redirects to `www.longlivets.com`.
Apple and Android both require the association file at each declared host
with a direct 200 and NO redirect. Before shipping, either (a) serve the
files from the apex without redirect (Vercel redirect exclusion for
`/.well-known/*`), or (b) drop the apex from `associatedDomains` and the
intent filter (needs an app.json change = new store build, so prefer (a)).
Verify with `curl -sI https://longlivets.com/.well-known/assetlinks.json`
expecting 200, no `location` header.

## Path claims (match web routes and `@swift2/shared` `resolveDeepLink`)

Claimed: `/` (all era/thread/moment/mode query shapes: `?screen=`, `?mode=`,
`?item=`, `?current=`, `?guide=`, `?song=`), `/vault/*`, `/settings/*`,
`/support`, `/privacy`, `/terms`. Excluded: `/api/*`, `/internal/*`,
`/parity-probe/*`, `/_next/*`. `/` claiming means every site link opens the
app, so the owner should confirm that is wanted before ship (reversible:
narrow the components list).

## Implementation (H6)

1. Serve: copy the drafts to `apps/web/public/.well-known/` (AASA with NO
   extension). Add a `headers()` entry in `apps/web/next.config.*` setting
   `Content-Type: application/json` for `/.well-known/apple-app-site-association`
   (Next serves extensionless public files as octet-stream) and
   `/.well-known/assetlinks.json`. `apps/web/proxy.ts` matches everything except
   `_next/static`, `_next/image` and favicon, so confirm it does not redirect or
   rewrite `/.well-known/*` (add to its exclusion if it does), and that the
   CSP/nonce layer does not interfere.
2. Intake in `apps/mobile/App.tsx`: a `Linking` listener
   (`Linking.getInitialURL()` once at cold start plus
   `Linking.addEventListener('url')`). Both feed the same notification tap
   queue with `source: 'deeplink'` (`messages.ts` supports it).
   `navigateSink` currently hard-codes `source: 'notification'`
   (`notification-tap-queue.ts` ~line 212): thread `source` through.
3. Dedupe: a consume-once flag so `getInitialURL` and the first `url` event
   for the same launch URL are handled once. Pass a stable `id` (the URL plus
   a launch counter) so the queue's id dedupe applies. H3's
   `clearLastNotificationResponseAsync` stays separate.
4. Resolve: run each URL through `resolveDeepLink` / `routes.ts` `navigate()`
   (same funnel as taps); unknown hosts or paths fall back to the WebView/DOM
   root, never crash.
5. Tests: unit tests for the dedupe flag, source threading, and URL to route
   mapping (including `www`, apex, and an unrelated host).

## Verification after ship

Android (needs a Play-signed or matching-key build):
- `adb shell pm get-app-links ai.jwlabs.longlive` expect `longlivets.com: verified`
  and `www.longlivets.com: verified`.
- `adb shell pm verify-app-links --re-verify ai.jwlabs.longlive` to force a recheck.
- `adb shell am start -a android.intent.action.VIEW -d "https://www.longlivets.com/?item=<id>"` opens the app, not the browser.
- Google's checker: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.longlivets.com&relation=delegate_permission/common.handle_all_urls`.

iOS (TestFlight build on a real device; the simulator and Developer-mode
`?mode=developer` aside, Apple fetches via its CDN):
- `curl -sI https://www.longlivets.com/.well-known/apple-app-site-association`
  expect 200, `content-type: application/json`, no redirect.
- `curl -s https://app-site-association.cdn-apple.com/a/v1/www.longlivets.com`
  shows the file Apple cached (can lag hours).
- Tap a longlivets.com link in Notes or Messages (not typed in Safari): it
  opens the app. Long-press shows "Open in LongLive".
- Reinstall the app after the file goes live if the first install predates it.

Also check: cold start from a link, warm start from a link, link tapped
while the DOM host is mounted, and a notification tap in the same session.
