# Parity closure invariant and accepted divergences (One UI W6-closure)

"Identical" is a CI invariant, not a claim. `e2e/parity/closure.spec.ts` runs in the parity gate (no browser) and fails when:

- **Slot coverage.** A slot registered under `apps/mobile/dom/slots/*` (`surface:*`, `overlay:*`, `footer`, `floating`) is missing from the spec's slot coverage map, or its mapping is invalid: a parity route that is missing or not `sides: 'both'`, an app-only (`sides: 'b'`) route that does not exist, or an accepted divergence id that is not listed below (`overlay:inbox` and `overlay:onboarding` are app-only routes; `overlay:share-fallback` is the `share-fallback-toast` divergence). The slot list is read from the slice files themselves, so a new slot fails until someone maps it to a route.
- **Fallbacks.** `OVERLAY_FALLBACK_ROWS` or `MODE_PATHS` in `apps/mobile/dom/slots/overlay-fallback.tsx` is non-empty.
- **a-only routes.** Any `ROUTES` / `EXTRA_ROUTES` entry is not `both` and is not in `A_ONLY_ALLOW_LIST` (empty).
- **Baselines.** A `both` route lacks its `b-*` baselines for all four projects.
- **Native routes and divergences.** Any native route is registered in `apps/mobile/dom/slots/host.routes.ts` (none remain; the scan must also find and parse the declaration), or the manifest `e2e/parity/divergences.ts` and the entries below are not exactly equal.

The G1 acceptance in PLAN.md (PM branch) means this invariant plus the divergences below, and nothing else.

## Accepted platform divergences

Fable rulings, cited by name: the Fable log in PROGRESS.md (PM branch), entries 2026-10-04 15:13 and 15:14. Anything not listed is a parity bug. Each bullet starts with the manifest id; keep this list and `e2e/parity/divergences.ts` identical.

- **`share-fallback-toast`**: the app uses the native share sheet first. The same ShareFallbackToast is mounted in the app (`dom/slots/share-fallback.ts`) but appears only after a native share fails or is missing; on the web it is the fallback when `navigator.share` is missing.
- **`haptics`**: haptics are app-only. The web has no equivalent.
- **`viewport-gestures`**: no pinch-zoom, overscroll or input-zoom in the app. The Expo shell fixes the viewport.
- **`phones-portrait-only`**: the app is portrait-only on phones; tablets rotate (decisions 2026-10-04). Fullscreen video must still rotate under the lock.
- **`submit-link-external`**: on the community and merch surfaces the app shows "Submit on longlivets.com" and opens the website form in the external browser, because the Turnstile widget cannot run in the DOM host (decisions 2026-10-04; `merch-submit-link-form` is `divergent: true`).
- **`about-diagnostics`**: Diagnostics is reachable only through the invisible hot corner in the top/bottom inset strips (`components/DiagHotCorner.tsx`, `lib/diag-hot-corner.ts`), mounted only where an inset is at least 20pt. Not on the web.
- **`inbox`**: the notification inbox is a DOM overlay (`overlay:inbox`) that exists only in the app; the website has no notifications host. Covered by b-only parity routes.
- **`notification-onboarding`**: the notification onboarding offer is a DOM overlay (`overlay:onboarding`) that exists only in the app. Covered by a b-only parity route.
- **`denied-hint-wording`**: the app's own `deniedHint` wording, since the system settings path differs per OS.
- **`legal-analytics-wording`**: the privacy page says analytics runs on every page of the website, not in the app's own screens, and that the website's analytics does run on the Privacy/Terms/Support pages the app opens as the website. Same words on both sides (Fable ruling c); the divergence is behaviour, not copy.
- **`app-state-screens`**: three native React Native screens exist only in the app and have no web counterpart: FirstLaunchScreen ("Downloading Long Live..." / "You're offline"), RecoveryScreen (Retry, Send report, legal links) and UpdateRequiredScreen (`apps/mobile/App.tsx`). They are app-state surfaces, not content.
- **`external-links`**: web opens external links in a new tab; the app opens them in the system browser through the bridge `openExternal`. http is upgraded to https; non-https, relative and non-allow-listed `mailto:` links are silently blocked (`dom/bridge/app-adapter-nav.tsx`, `lib/mailto-allowlist.ts`).
- **`embed-wrapper`**: the app frames the website's `/embed/{youtube,spotify}` wrapper (`embedOrigin`), so embeds need network and the deployed route; the web embeds the provider directly.
- **`web-only-services`**: Vercel Analytics, the service worker and web push, and JSON-LD/OG metadata are off in the app; the next/image optimiser is replaced by `dom/bridge/responsive-image.ts`.
- **`content-adoption-lag`**: the web ships baked modules at deploy plus live fetches; the app reads its last-good bundle once at mount and adopts a refreshed bundle only when idle or after 30 minutes in the background (`docs/one-ui/dom-host.md`). Merch links, corrections and banners can lag in the app.

Not a divergence, but a parity tripwire: `env.affiliate` is unset on both web (prod affiliate envs unset) and app today, so shop links match. Enabling affiliate ids on web without passing them through the app adapter would create one (see `packages/ui/HOST-ADAPTER.md`).

Note: the closure spec reads slot names and native routes from the source files with regexes. That scan is temporary, until PR3 replaces it with a real registry import.
