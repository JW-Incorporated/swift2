# One UI, three surfaces: the website's screens as the app's screens

Status: **proposal, design debate round 2** (2026-10-02). Author: Claude
Code. Decider: Joey (CEO). Supersedes, if approved: the UI half of D2 and
D3 in `docs/decisions.md` "Convergence decisions D1–D4" (2026-09-05).
D1 (published content bundle) and D4 (EAS Update) stay.

## 1. Goal, in plain language

Joey installed Android build 1.0.0 (16) on 2026-10-02. Eras loaded (the
#4718 fix works), but they took 10+ seconds, the app felt sluggish
throughout, and it "looks nothing like" longlivets.com. His ruling
(2026-10-02, in chat):

1. **The app must look exactly like the site.** The site is designed as an
   app on purpose; it is the reference, not a starting point.
2. **One change must land on web, iOS and Android together**, solved by the
   architecture, not by people remembering to update two copies.
3. Implied by launch: it must feel fast and pass App Store review.

## 2. Why today's design can't meet that

D2 chose **two renderers** (Next.js web, React Native app) sharing only a
headless core (`packages/experience`, ~11.8k lines, no UI) and color tokens
(OS-031). Everything visible is written twice: web reader UI lives in
`apps/web/components/longlive/**`; the app has ~7.4k lines of its own
screens (`EraStreamScreen`, `ThreadsScreen`, `MomentSheet`, …), with
`MomentCard`, `DoorwayCard`, `LandingMasthead` existing once per platform.
The 2026-09-05 spec said "Parity first; the web is the reference"; four
weeks later the copies visibly differ. A parity pass would drift again.
**Requirement 2 rules out any design that keeps two UI copies.**

## 3. Facts the design rests on (re-verified after round 1)

- **Web:** Next `^16.3.6` App Router, React `^19.2.8`, Tailwind v4 via
  PostCSS, era theming via runtime CSS variables (`--era-*`), Radix
  primitives, CSS-only animation. Under `apps/web/components/longlive/**`,
  77 of 86 non-test `.tsx` files carry `'use client'`; the rest are only
  imported beneath client roots (`LongLive.tsx` is `'use client'`), so the
  whole reader renders client-side. `app/page.tsx` does a metadata lookup
  and renders `<LongLive />`.
- **Web content path:** generated TS modules baked at build
  (`apps/web/lib/longlive/content.ts:10,21-39`).
- **App content path (different):** fetches the published D1 bundle from
  `https://www.longlivets.com/content`, validates it, caches to disk, keeps
  a last-good copy offline, self-heals via OTA
  (`apps/mobile/lib/vault.ts`, `content-bundle.ts:42-68`,
  `packages/content/src/load.ts`). New content reaches installed apps
  **without** an app update.
- **Release trigger:** the mobile release train runs only on changes to
  `apps/mobile/**`, `packages/**` or the lockfile
  (`.github/workflows/mobile-release.yml:26-33`). Content merges don't
  trigger it, and shouldn't.
- **App stack:** Expo `~57.0.19`, RN `0.86.2`, React `19.2.3`, custom
  `BottomTabBar`, no expo-router, `react-native-webview`, `expo-updates`
  (fingerprint policy), `expo-notifications`. **Not installed:**
  `react-dom`, `react-native-web`, `@expo/metro-runtime` (Expo DOM's
  prerequisites outside Expo Router). `metro.config.js:11-26` runs a
  content generator at config load.
- **Native-only features:** push registration, device id, notification
  channels/actions, inbox, prefs client, deep links, kill switch
  (`config/mobile/app-config.json` → `routeFlags`), update-required gate.
- **Not yet measured:** where #4783's 10 s goes (network vs hash vs parse
  vs validate), web reader bundle size, DOM startup cost on device.

## 4. Proposed design

**The website's reader components become the only UI. The app is a thin
native shell that mounts them, ships them inside the app, and feeds them
the same cached content it already loads today.**

### 4.1 One UI package
- Move the reader UI into `packages/ui` (web React + the same Tailwind v4
  CSS). Both hosts render it. Because it lives under `packages/**`, the
  existing release-train trigger already ships every UI change to both
  apps as an OTA, while Vercel ships it to the web. Requirement 2 is met by
  the pipeline we already run.
- Next-only imports (`next/link`, `next/image`, `next/navigation`,
  `next/dynamic`) go behind a small **host adapter** (`Link`, `Image`,
  `useRouter`, `lazy`, `share`, `haptic`, `openExternal`). An ESLint rule
  bans `next/*` and `react-native*` inside `packages/ui`, mirroring the
  guard on `packages/experience`.
- **Content goes through a `ContentSource` interface**, not direct imports
  of generated modules. Web provides the baked modules (unchanged
  behavior). The app provides the D1 bundle the native side already
  fetches, caches and falls back on. Content freshness stays exactly as it
  is today; nothing about content moves into the app bundle. *(Changed in
  round 1, see appendix #3/#4.)*

### 4.2 The app mounts it via Expo DOM components
- Expo DOM components (`'use dom'`, SDK 52+, we're on 57) bundle web React
  + CSS through Metro into the app and render it in a native webview from
  **local assets**, not from longlivets.com.
- **One persistent DOM host for the whole reader**, not one per screen.
- **All visible chrome lives in the DOM**, including the bottom nav and top
  bar, so the app is pixel-identical to the site. The native layer draws
  nothing the user sees except splash, the update-required gate and system
  sheets (share, notification permission). *(Resolves the old open
  question; appendix #6.)*
- The native side owns: lifecycle, safe-area insets passed in as CSS
  variables, Android hardware back and iOS edge swipe forwarded to the
  reader's router, push permission/registration/channels/actions,
  notification tap → reader route, share sheet, haptics, external links,
  content loading, kill switch.
- **Fallback if Expo DOM fails gate 0 or 1:** the same `packages/ui`
  built as a static bundle and loaded from local assets in a single
  `react-native-webview`, with the same bridge. The UI package is
  identical either way; only the mount changes.

### 4.3 Product-native core loop (App Store 4.2)
Apple rejects apps that are mainly a repackaged website. Our answer has
to be functionality, not packaging:
- **Notifications are the product** (`docs/vision.md`: "user notifications
  are presented as an integral part of the experience"). Native push,
  per-topic and per-rate controls, actionable notifications and an in-app
  inbox. None of this exists on the website as native push.
- **Offline**: the last-good content bundle makes the whole archive
  browsable with no connection.
- Native share, haptics, deep links from notifications.
- Review notes walk Apple through the notification loop first.
This lowers the risk; it doesn't remove it. See the verdict's contingency.

### 4.4 Rollout and rollback
- New `routeFlags.sharedUi` (default `false`). `true` mounts the DOM
  reader; `false` keeps today's native screens. Flips without a store
  build.
- **Native screens are kept, not deleted, for one full store-version
  cohort** after `sharedUi` goes default-on: until every supported binary
  has run the shared UI with no regression. Then delete them.
- **Rollback drill before default-on:** ship a deliberately broken DOM OTA
  to an internal build, prove the flag and an EAS rollback recover it,
  including in airplane mode with last-good content.

### 4.5 Gates (each must pass before the next)
0. **Build gate:** install `react-dom` / `react-native-web` /
   `@expo/metro-runtime`, keep the Metro content generator working,
   produce production `expo export` for iOS and Android, publish an EAS
   Update, and pass a release-build smoke test.
1. **Spike:** era stream + moment detail + bottom nav through one DOM host
   with Tailwind v4, era CSS variables and Radix working.
2. **Navigation and behavior** on device, every one an acceptance test:
   notification tap → nested route (cold and warm); Android back; iOS edge
   swipe; scroll position restored after closing a moment; keyboard over
   the Clownbot composer; focus/VoiceOver/TalkBack order; YouTube/Spotify
   inline playback; return from external link; rotation.
3. **Performance**, on Pixel 6a and iPhone 12, each p50/p95 over 10 runs:
   cold launch → era content visible (warm network, empty cache) ≤ 2.5 s
   p95; warm launch ≤ 1 s p95; era-stream scroll ≤ 5% dropped frames;
   era switch ≤ 150 ms p95; WebView + JS memory ≤ 300 MB; OTA download
   size and a monthly EAS Update bandwidth forecast at 10k MAU. Same
   numbers measured for today's native screens as the baseline.
4. **Pixel parity, automated and permanent:** CI renders the same routes
   at phone viewport on web (Playwright) and in the app (Maestro), diff
   under a threshold. This is what keeps requirement 1 true after launch.
5. **App Review on a near-final build** (not the spike), submitted with
   review notes, before native screens are retired.

**Prerequisite regardless of this proposal:** #4783 (measure and fix the
content loader). It is the same loader under either design.

## 5. Tradeoffs we accept

- **A webview under the hood.** Exactness and one copy of UI are bought
  with system-browser rendering. Mitigated by local assets, one persistent
  host, and gate 3's numbers against today's native baseline.
- **Apple 4.2 risk is reduced, not removed.**
- **Reverses OS-039/D3 four weeks after they shipped.** ~7.4k native lines
  are retired after a cohort.
- **Real refactor cost**: moving the reader into a package, the adapter,
  and the `ContentSource` seam. Estimated 2–3 weeks including gates.
  Not "mechanical".

## 6. Open questions

1. Does Expo DOM on SDK 57 handle Tailwind v4 PostCSS and Radix portals?
   (Gate 1; fallback in 4.2 if not.)
2. EAS Update bandwidth with a larger JS bundle (gate 3 forecast).
3. iOS inline-video policy inside WKWebView for YouTube/Spotify embeds.

## 7. Alternatives rejected

| Option | Why not |
|---|---|
| **Keep native screens, do a visual parity pass** | Two copies drift; fails requirement 2 the day after it ships. |
| **Codex's round-1 design: native shell + native screens, shared web surface only where it beats native** | Still two UI copies for everything native, so it fails requirements 1 and 2. It optimises the review risk the founder chose to accept. Its loader-first point is adopted (§4.5 prerequisite). |
| **Universal React Native Web rewrite** (Expo Router web / Solito) | Rewrites the reader; RNW can't express Tailwind/CSS cascade, so "exact" becomes "close"; loses Next SSR/SEO. Rejected in D2, still holds. |
| **Capacitor / remote WebView of longlivets.com** | The 2026-09-05 stop-gap: network on the critical path, weakest 4.2 position, no native seam for the notification loop. |
| **react-strict-dom / Tamagui / NativeWind shared components** | Every component rewritten in a new styling system; exactness not guaranteed. |
| **Bake content into the app bundle** (round-1 draft) | Wrong: content already updates remotely with cache and offline fallback, and content merges don't trigger app releases. Withdrawn. |

## 8. Conflicts with existing docs

- `docs/architecture.md` "Convergence": D2 and D3 superseded for UI if
  approved; D1/D4 unchanged; `packages/experience` stays the headless core
  under `packages/ui`.
- `docs/vision.md`: no conflict. Era "transport" is CSS variables today
  and carries over; notifications stay native and central.

## Verdict

*(Filled in after round 2.)*

## Appendix A — Round 1 (Codex) findings and responses

| # | Sev | Finding | Response |
|---|---|---|---|
| 1 | High | Routing/back/deep links over the async DOM bridge are asserted, not proven. | **Accepted.** Every behavior is now an acceptance test (gate 2). |
| 2 | High | Expo DOM prerequisites (`react-dom`, `react-native-web`, `@expo/metro-runtime`) aren't installed; Metro config runs a generator. | **Accepted.** New gate 0; refactor no longer called mechanical. |
| 3 | High | App doesn't use baked content; it has a cached remote loader. | **Accepted.** §3 corrected; content stays on the D1 loader via `ContentSource`; #4783 is a prerequisite. |
| 4 | High | Content merges don't trigger OTAs. | **Accepted.** Baking withdrawn. UI in `packages/ui` *does* trigger OTAs, which is what requirement 2 needs. |
| 5 | High | 4.2 risk understated; a spike review isn't durable approval. | **Partly accepted.** Product-native core loop defined (§4.3); review gate moved to a near-final build. **Rebutted** that the reader must be native: that fails the founder's requirement 1. The residual risk is surfaced as a founder call. |
| 6 | Medium | Native chrome breaks exact parity and viewport/keyboard. | **Accepted.** All chrome in the DOM; insets passed as CSS variables; keyboard and media in gate 2. |
| 7 | Medium | Deleting native screens after one release makes rollback unsafe. | **Accepted.** Keep for a full store-version cohort; bad-OTA drill. |
| 8 | Medium | "94 of 96" not reproducible; page.tsx claim misleading. | **Accepted.** Re-counted: 77 of 86, with the rest under client roots. |
| 9 | Medium | Perf gates not decision-quality. | **Accepted.** Named devices, p50/p95, memory, frames, OTA size, bandwidth, native baseline. |
