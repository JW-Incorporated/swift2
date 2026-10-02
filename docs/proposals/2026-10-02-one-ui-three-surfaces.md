# One UI, three surfaces: the website's screens as the app's screens

Status: **proposal, under design debate** (2026-10-02). Author: Claude Code.
Decider: Joey (CEO). Supersedes, if approved: the UI half of D2 and D3 in
`docs/decisions.md` "Convergence decisions D1–D4" (2026-09-05).

## 1. Goal, in plain language

Joey installed Android build 1.0.0 (16) on 2026-10-02. Eras loaded (the
#4718 fix works), but the app took 10+ seconds to show them, felt sluggish
throughout, and "looks nothing like" longlivets.com. His ruling (2026-10-02,
in chat):

1. **The app must look exactly like the site.** The site is designed as an
   app on purpose; it is the reference, not a starting point.
2. **One change must land on web, iOS and Android together.** The sync has
   to be solved by the architecture, not by people remembering to update
   two copies.
3. Implied by launch: it must feel fast, and it must pass App Store review.

## 2. Why today's design can't meet that

D2 (2026-09-05) chose **two renderers**: Next.js for web, React Native for
mobile, sharing only a headless core (`packages/experience`, ~11.8k lines:
eras, filters, search, threads; no UI) and design-token colors (OS-031).
Everything visible is written twice. Web reader UI is ~76k lines across
`components/longlive/**` + `lib/longlive/**` (incl. generated content);
the native app is ~7.4k lines of its own screens (`EraStreamScreen`,
`ThreadsScreen`, `MomentSheet`, …), with components like `MomentCard`,
`DoorwayCard`, `LandingMasthead` existing once per platform.

Two copies of a UI cannot stay identical by discipline. The 2026-09-05
spec itself said "Parity first; the web is the reference"; four weeks
later the copies are visibly different. A visual-parity pass on the native
screens would fix today and drift again by next month. **Requirement 2
rules out any design with two UI copies**, which rules out D2 as written.

## 3. Facts the design rests on (verified 2026-10-02)

- Web: Next `^16.3.6` App Router, React `^19.2.8`, Tailwind v4 via
  PostCSS, era theming via runtime CSS variables (`--era-*`), Radix
  primitives, CSS-only animation (no framer-motion). **94 of 96** `.tsx`
  files under `apps/web/components` + `app` are `'use client'`.
- Reader content is **baked into the client bundle** as generated TS
  modules (`content-vault.generated.ts` etc., produced by `prebuild`). Only
  `app/page.tsx` does a server-side lookup (for metadata).
- Mobile: Expo `~57.0.19`, RN `0.86.2`, React `19.2.3`, custom
  `BottomTabBar` (no expo-router), `react-native-webview`, `expo-updates`
  (fingerprint runtime policy, D4), `expo-notifications`.
- App-only native features: push registration, device id, notification
  channels/actions, inbox, prefs, deep links, kill switch
  (`config/mobile/app-config.json` → `routeFlags`), update-required gate.
- Merge to `main` already ships both web (Vercel) and app JS (release
  train → EAS Update) automatically. Store builds only when native code
  changes.

## 4. Proposed design

**The website's client components become the only UI. The native app is a
thin native shell that mounts them from a bundle shipped inside the app.**

### 4.1 One UI package
- Extract the reader UI (`components/longlive/**` and its client `lib`
  deps) into a workspace package, `packages/ui`, consumed by both hosts.
  Same Tailwind v4 CSS, same components, same files.
- The handful of Next-only imports (`next/link`, `next/image`,
  `next/navigation`, `next/dynamic`) go behind a tiny **host adapter**
  (`Link`, `Image`, `useRouter`, `lazy`) that each host provides. An ESLint
  rule in `packages/ui` bans direct `next/*` and `react-native*` imports,
  mirroring the rule that already guards `packages/experience`.
- `apps/web` becomes a thin Next host: routes, metadata/SEO, API routes,
  CSP, then renders `packages/ui`. Nothing about the website's look changes.

### 4.2 The app mounts that package via Expo DOM components
- Expo DOM components (`'use dom'`, Expo SDK 52+; we're on 57) bundle
  ordinary web React + CSS with Metro and render it in a native webview,
  **from assets inside the app**, not from longlivets.com.
- **One persistent DOM host for the whole reader**, not one per screen
  (each DOM component is its own webview; many of them is the known
  performance trap). Navigation inside the reader is the reader's own
  client routing, same as on the web.
- The DOM bundle is part of the app's JS bundle, so it is **versioned and
  shipped by EAS Update exactly like today's JS**. One merge → Vercel deploy
  + OTA to both apps. Requirement 2 is met by the existing release train.

### 4.3 What stays native (the shell)
- App lifecycle, splash, safe areas, status bar, back gesture/hardware back
  → forwarded into the reader's router.
- **Push notifications end to end**: permission, registration, channels,
  actions, tap → deep link into the reader. The vision makes notifications
  *the* core of the product; this is the app's reason to exist beyond the
  site.
- Native capabilities exposed to the reader as typed actions over the DOM
  bridge: share sheet, haptics, open-external-link, notification prefs,
  "add to calendar"-style hooks later.
- Kill switch + update-required gate (already native, unchanged).
- On the web, the same actions are implemented with web equivalents (Web
  Share, no-op haptics) through the same host adapter.

### 4.4 Content in the app
- The reader keeps reading content the way the web does (baked generated
  modules), so the app ships content inside its bundle: **no 4.6 MB
  fetch-hash-parse at launch** (the likely cause of #4783's 10 s wait).
- Fresh content arrives via the OTA that every merge already triggers.
  *Open question 6.2* covers the bandwidth cost of that.

### 4.5 Rollout and rollback
- New `routeFlags.sharedUi` (default `false`) in `app-config.json`: `true`
  mounts the DOM reader, `false` keeps today's native screens. Flip without
  a store build; flip back the same way.
- Once `sharedUi` has been on for one release with no regression, delete
  the native screens (~7.4k lines) and the flag.

### 4.6 Proof gates (each must pass before the next step)
1. **Spike (1–2 days)**: era stream + one moment detail rendered in the
   app through one DOM host, Tailwind v4 + era CSS variables working.
2. **Performance budget**, measured on a mid-range Android (Pixel 6a-class)
   and an older iPhone: cold launch → era content visible < 2 s; scroll
   without visible jank; tab/era switch < 150 ms.
3. **Pixel parity, automated**: CI renders the same routes at phone
   viewport on web (Playwright) and in the app (Maestro screenshot); diff
   must be under a small threshold. This is what keeps "exactly like the
   site" true after launch, not a one-off check.
4. **App Review**: submit the spike build to App Store review (not
   released) before committing to the migration.

## 5. Tradeoffs we accept

- **It's a webview under the hood.** Rendering is the system browser
  engine, not native views. Exactness and single-source are bought with
  that. Mitigated by: local assets, one persistent host, no network on the
  critical path, and the performance gate.
- **App Store 4.2 risk is reduced, not removed.** See open question 6.1.
- **Reverses OS-039 and D3** four weeks after they shipped; the ~7.4k
  native lines get deleted. The headless core (`packages/experience`),
  D1 (content bundle) and D4 (EAS Update) all stay.
- **Refactor cost**: moving ~85 components into a package and adapting
  Next-only imports. Mechanical, but large; done incrementally behind the
  adapter.

## 6. Open questions

1. **Will Apple accept it?** Shell + bundled reader + real push/inbox/
   share/haptics is the shape many approved apps have, but reports of 4.2
   rejections for Capacitor-style apps exist (2025). Gate 4 answers it with
   evidence instead of opinion.
2. **Content freshness vs OTA bandwidth.** Baking content into the bundle
   means every content merge downloads a new multi-MB bundle to every
   device. EAS Update bills on bandwidth. Alternative: the DOM reader
   fetches the content bundle (the D1 path) through the native side,
   cached, once #4783 fixes the loader. Needs numbers.
3. **Tailwind v4 + Radix inside Metro's web bundling** for DOM components:
   unverified; the spike's first job.
4. **Video/iframe embeds** (YouTube, Spotify) inside the webview: autoplay
   and inline-playback policies on iOS.
5. **Should the bottom tab bar be native or part of the reader?** Exact
   look argues reader; feel and 4.2 argue native.

## 7. Alternatives rejected

| Option | Why not |
|---|---|
| **Keep native screens, do a visual parity pass** | Two copies drift; fails requirement 2 the day after it ships. |
| **Universal React Native Web rewrite** (Expo Router on web, or Solito) | Rewrites ~76k lines; RNW can't express Tailwind/CSS cascade, so "exact" becomes "close"; loses Next SSR/SEO. Already rejected in D2, and the reasons still hold. |
| **Capacitor / remote WebView of longlivets.com** | Same as the 2026-09-05 stop-gap: network on the critical path, no offline, highest 4.2 risk, slow on mid-range Android. |
| **react-strict-dom / Tamagui / NativeWind shared components** | Every component rewritten into a new styling system; NativeWind shares class names, not components; react-strict-dom uses StyleX and has little third-party production evidence. Exactness not guaranteed. |
| **Plain `react-native-webview` loading a bundled static export** | Viable and the fallback if Expo DOM fails the spike. DOM components win on a typed native bridge and on being part of the same Metro bundle/OTA, with no separate asset-copy step. |

## 8. Conflicts with existing docs

- `docs/architecture.md` "Convergence": D2 (two renderers) and D3 (native
  port) are superseded for UI if approved; D1/D4 unchanged.
- `docs/vision.md`: no conflict. Era "transport" via colors/fonts is CSS
  variables on the web today and carries over unchanged; notifications
  stay native and central.

## Verdict

*(Filled in after the debate.)*
