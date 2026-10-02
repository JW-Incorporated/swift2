# One UI, three surfaces: the website's screens as the app's screens

Status: **debated (2 Codex rounds), awaiting founder approval** (2026-10-02).
Author: Claude Code. Decider: Joey (CEO). Supersedes, if approved: the UI
half of D2 and D3 in `docs/decisions.md` "Convergence decisions D1–D4"
(2026-09-05). D1 (published content bundle) and D4 (EAS Update) stay.

## 1. Goal, in plain language

Joey installed Android build 1.0.0 (16) on 2026-10-02. Eras loaded (the
#4718 fix works), but they took 10+ seconds, the app felt sluggish
throughout, and it "looks nothing like" longlivets.com. His ruling
(2026-10-02, in chat):

1. **The app must look exactly like the site.** The site is designed as an
   app on purpose; it is the reference, not a starting point.
2. **One change must land on web, iOS and Android**, solved by the
   architecture, not by people remembering to update two copies. Precisely
   (after round 2): *one UI source; one merge produces every surface's
   artifact; there is no separately editable mobile UI.* Arrival on users'
   devices is not simultaneous: web deploys in minutes, OTAs on next
   launch, and native-layer changes wait for store review.
3. Implied by launch: it must feel fast and pass App Store review.

## 2. Why today's design can't meet that

D2 chose **two renderers** (Next.js web, React Native app) sharing only a
headless core (`packages/experience`, ~11.8k lines, no UI) and color tokens
(OS-031). Everything visible is written twice: web reader UI lives in
`apps/web/components/longlive/**`; the app has ~7.4k lines of its own
screens, with `MomentCard`, `DoorwayCard`, `LandingMasthead` existing once
per platform. The 2026-09-05 spec said "Parity first; the web is the
reference"; four weeks later the copies visibly differ. **Requirement 2
rules out any design that keeps two UI copies.**

## 3. Facts the design rests on (re-verified after rounds 1 and 2)

- **Web:** Next `^16.3.6` App Router, React `^19.2.8`, Tailwind v4,
  era theming via runtime CSS variables, Radix, CSS-only animation. Under
  `apps/web/components/longlive/**`, 77 of 86 non-test `.tsx` files carry
  `'use client'`; the rest are imported beneath client roots
  (`LongLive.tsx`), so the whole reader renders client-side.
- **Web content path:** generated TS modules baked at build; **100+
  callers depend on synchronous access**
  (`apps/web/lib/longlive/content.ts:25-45`). Generated input ~3.6 MB;
  web client payload ~4.9 MB (`docs/longlive-experience.md:775-790`,
  `docs/dev-quickstart.md:51-55`).
- **App content path (different):** fetches the published D1 bundle from
  `https://www.longlivets.com/content`, validates, caches to disk, keeps
  last-good offline, then wires several providers (era stream, theories,
  threads, search, video, tracks) asynchronously
  (`apps/mobile/lib/era-stream-data.ts:40-88`, `threads-data.ts:28-47`,
  `packages/content/src/load.ts`). Content reaches installed apps without
  an app update.
- **Release:** the mobile train runs on `apps/mobile/**`, `packages/**`,
  lockfile (`.github/workflows/mobile-release.yml:26-34`). It publishes an
  OTA only when a compatible store build exists for the fingerprint;
  otherwise it builds and submits binaries
  (`apps/mobile/.eas/workflows/release.yml:92-157`).
- **App stack:** Expo `~57.0.19`, RN `0.86.2`, React `19.2.3`, custom tab
  bar, no expo-router. **Not installed:** `react-dom`, `react-native-web`,
  `@expo/metro-runtime` (Expo DOM prerequisites). `metro.config.js:11-26`
  runs a content generator at config load. The only native↔web bridge
  today carries two tiny commands (`SiteShell.tsx:56-78`).
- **Kill switch:** `app-config` is network → cached last-good → compiled
  defaults; unknown `routeFlags` keys are stripped by the schema
  (`packages/content/src/app-config.ts:16-43`).
- **Test infra:** Playwright exists (`e2e/`, `.github/workflows/e2e.yml`);
  no Maestro or device screenshot pipeline exists yet.
- **Not yet measured:** where #4783's 10 s goes.

## 4. Design

**The website's reader components become the only UI. The app is a thin
native shell that mounts them from local assets. Inside the app the reader
loads its own content the D1 way; on the web it keeps the baked path. Both
paths produce one versioned `ReaderSnapshot`.**

### 4.1 One UI package
- The reader moves into `packages/ui` (same React, same Tailwind v4 CSS).
  `packages/**` already triggers the mobile train, so a UI merge produces
  the web deploy and the app OTA or build from one change.
- Next-only imports go behind a small **host adapter** (`Link`, `Image`,
  `useRouter`, `lazy`, `share`, `haptic`, `openExternal`,
  `notifications`). ESLint bans `next/*` and `react-native*` inside
  `packages/ui`.

### 4.2 Content: one `ReaderSnapshot` contract (rewritten in round 2)
- **One versioned contract**, `ReaderSnapshot` (in `packages/experience`):
  every provider the reader uses (eras, moments, theories, threads,
  search index, videos, tracks, merch), plus `version`, and a state of
  `ready | stale | offline | error`.
- **The reader reads the snapshot synchronously from React context** once
  it's ready. That preserves the 100+ synchronous call sites (they switch
  from module imports to a context hook) without making them async.
  Before ready, the reader shows its own loading state.
- **Web:** the snapshot is built from the baked modules at build time and
  is ready on first render. Behavior is unchanged.
- **App:** the reader builds the snapshot **inside the webview** using
  `packages/content`'s existing loader. It fetches the D1 bundle directly,
  caches in the webview's storage, and keeps last-good offline. The
  webview has WebCrypto, so the pure-JS SHA-256 behind part of #4783
  disappears. **No content crosses the native↔DOM bridge**; the bridge
  carries commands and a bundle-version token only.
- **Equivalence test (CI):** for a given commit, the snapshot built from
  baked modules and the one built from the published D1 bundle must hash
  equal. This is what stops "same UI, different data" between web and app.

### 4.3 Mount and ownership
- Expo DOM components (`'use dom'`, SDK 57) render `packages/ui` in one
  persistent webview from **local assets**. Fallback mount if Expo DOM
  fails gate 0: a static build of `packages/ui` loaded from local assets
  in one `react-native-webview`, same bridge.
- **The DOM owns everything visible**: top bar, bottom nav, all reader
  routes, **notification settings and inbox** (the web already has
  `WebNotificationSettings.tsx`). The native screens for those retire with
  the rest.
- **Native owns capabilities, through a typed command/event protocol**
  with ordering, cancellation and accessibility-focus restoration:

| Surface or transition | Owner | Notes |
|---|---|---|
| All visible UI, history, scroll restoration | DOM | Same router as web |
| Safe areas, keyboard insets | Native → DOM | Passed as CSS variables / events |
| Android back, iOS edge swipe | Native → DOM | `back` command; DOM answers `handled` / `exit` |
| Push permission, registration, channels | Native | DOM asks via `notifications.*` commands |
| Notification tap (cold and warm) | Native → DOM | `navigate(route)` after `ready` |
| Share sheet, haptics, external links | Native | Commands from the DOM |
| Splash, update-required gate, fallback choice | Native | Before the DOM mounts |

### 4.4 Product-native core loop (App Store 4.2)
- **Notifications are the product** (`docs/vision.md`): native push,
  per-topic and per-rate control, actionable notifications, inbox.
- **Offline**: whole archive browsable from last-good content.
- Native share, haptics, notification deep links. Review notes lead with
  the notification loop.
- **This reduces the 4.2 risk, it does not remove it.** Contingency is
  set by the founder before implementation (Verdict, question 1).

### 4.5 Rollout, fallback, rollback
- Add `sharedUi` to the `routeFlags` schema (it would be stripped today).
- **Native watchdog, works offline:** a persisted native flag. If the DOM
  doesn't report `ready` within a timeout, or crashes on two launches in a
  row, the shell mounts the native screens on this launch and the next,
  with no network needed. The remote flag and EAS rollback are online
  mitigations only.
- Native screens stay until every supported binary has run the shared UI
  with no regression (one full store-version cohort), then they're deleted.

### 4.6 Gates (in order; each must pass before the next)
0. **Foundations (before any UI moves):**
   a. Trace #4783's 10 s end to end (manifest, downloads, hashing,
      validation, disk, normalization, first paint) on Pixel 6a and
      iPhone 12, and fix the loader. Same loader runs in the webview.
   b. `ReaderSnapshot` contract + equivalence test green.
   c. Expo DOM prerequisites installed; production `expo export` for both
      platforms; EAS Update publishes; release-build smoke test passes.
   d. Spike: era stream + moment detail + bottom nav in one DOM host,
      loading D1 content in-webview, measured cold/warm/offline: transfer,
      parse, memory, first paint.
   e. **Milestone estimate published** from what a–d actually took.
1. **Parity and accessibility infra:** Maestro (or equivalent) device
   screenshots with deterministic fixtures; web↔app visual diff in CI;
   automated accessibility checks. In place before screens move.
2. **Migration** screen by screen behind `sharedUi`, each passing the
   behavior tests: notification tap → nested route (cold and warm),
   Android back, iOS swipe, scroll restoration, keyboard over composer,
   VoiceOver/TalkBack order, YouTube/Spotify inline playback, external-link
   return, rotation.
3. **Performance**, Pixel 6a and iPhone 12, p50/p95 over 10 runs, against
   today's native baseline: cold launch → era content ≤ 2.5 s p95; warm ≤
   1 s p95; scroll ≤ 5% dropped frames; era switch ≤ 150 ms p95; memory ≤
   300 MB; OTA size and monthly bandwidth forecast at 10k MAU.
4. **Watchdog drill:** forced DOM failure in airplane mode falls back to
   native screens.
5. **App Review approval** of a final, fully functional build **before
   `sharedUi` is default-on for the public.**

## 5. Tradeoffs we accept

- **A webview under the hood**, bought for exactness and one UI copy.
  Mitigated by local assets, one host, WebCrypto, gate 3 against the native
  baseline.
- **Apple 4.2 risk reduced, not removed.**
- **Reverses OS-039/D3** four weeks after shipping; ~7.4k native lines
  retired after a cohort.
- **Large refactor:** the 100+ synchronous content call sites move to a
  context snapshot; the project's own docs call the baked-module
  circularity a "separate, larger redesign" (`longlive-experience.md:780-790`).
  **No estimate until gate 0e.**

## 6. Alternatives rejected

| Option | Why not |
|---|---|
| **Visual parity pass on today's native screens** | Two copies drift; fails requirement 2. |
| **Native shell + native screens, shared web surface only where it beats native** (Codex round 1) | Still two UI copies; fails requirements 1 and 2. Its loader-first point is adopted (gate 0a). |
| **Universal React Native Web rewrite** | Rewrites the reader; RNW can't express the CSS, so "exact" becomes "close"; loses Next SSR/SEO. Rejected in D2, still holds. |
| **Remote WebView of longlivets.com / Capacitor** | Network on the critical path, weakest 4.2 position, no typed native seam. |
| **react-strict-dom / Tamagui / NativeWind** | Rewrites every component in a new styling system; exactness not guaranteed. |
| **Bake content into the app bundle** (round-1 draft) | Content already updates remotely; content merges don't trigger app releases. Withdrawn. |
| **Feed the D1 bundle to the DOM over the bridge** (round-1 revision) | Multi-MB over an async JSON bridge built for two tiny commands. Withdrawn in favor of in-webview loading. |

## 7. Conflicts with existing docs

- `docs/architecture.md` "Convergence": D2 and D3 superseded for UI;
  D1/D4 unchanged; `packages/experience` stays the headless core and gains
  `ReaderSnapshot`.
- `docs/vision.md`: no conflict. Era transport is CSS variables today and
  carries over; notifications stay native and central.
- `docs/longlive-experience.md` §baked-module circularity: this proposal is
  the "larger redesign" it defers.

## Verdict

**We will build one UI for all three surfaces: the website's reader moves
into `packages/ui` and is mounted in the iOS and Android apps through a
single Expo DOM host loading from local assets, with the app's shell
reduced to native capabilities (push, back, share, haptics, offline
fallback).** Content reaches both surfaces through one versioned
`ReaderSnapshot`: baked on the web, loaded inside the webview from the D1
bundle in the app, proven identical by a CI hash test, with no content
crossing the native bridge.

It won because it is the only option that meets both founder requirements
at once. Every alternative either keeps two UI copies, which fails
requirement 2 and drifts away from requirement 1, or rewrites the site
into something that can only approximate it. Codex's attacks didn't
dislodge that. They did reshape almost everything around it: content
delivery, release semantics, offline fallback, gate order and estimate
honesty.

**It rests on these assumptions, each tested by a gate before cost is
sunk:** Expo DOM on SDK 57 runs Tailwind v4 + Radix (0c/0d, with a plain
webview fallback); the in-webview loader meets the performance budget
against today's native baseline (0a, 3); Apple approves a final build
(5). The founder's 4.2 contingency is chosen before gate 0 starts.

Codex's round-2 verdict was "not yet, until the content contract is
defined". §4.2 now defines it, and gate 0b proves it before any UI moves.
A third review round was not run (two-round cap); the founder may request
one.

**First work after approval:** gate 0a (#4783 trace and fix), which is
needed under any design.

---

## Appendix A — Round 1 (Codex) findings and responses

| # | Sev | Finding | Response |
|---|---|---|---|
| 1 | High | Routing/back/deep links over the async DOM bridge asserted, not proven. | **Accepted.** Behavior tests in gate 2; ownership table §4.3. |
| 2 | High | Expo DOM prerequisites missing; Metro config runs a generator. | **Accepted.** Gate 0c. |
| 3 | High | App doesn't use baked content; it has a cached remote loader. | **Accepted.** §3 corrected; §4.2 rewritten. |
| 4 | High | Content merges don't trigger OTAs. | **Accepted.** Baking withdrawn. |
| 5 | High | 4.2 risk understated; spike review isn't durable approval. | **Partly accepted.** Product-native loop §4.4; review moved to a final build before public default-on. **Rebutted** that the reader must be native: that fails founder requirement 1. Contingency goes to the founder. |
| 6 | Medium | Native chrome breaks parity and viewport/keyboard. | **Accepted.** DOM owns all visible UI; insets as CSS variables. |
| 7 | Medium | Deleting native screens after one release makes rollback unsafe. | **Accepted.** Kept for a cohort; watchdog (§4.5). |
| 8 | Medium | "94 of 96" not reproducible. | **Accepted.** 77 of 86, rest under client roots. |
| 9 | Medium | Perf gates not decision-quality. | **Accepted.** Gate 3. |

## Appendix B — Round 2 (Codex) findings and responses

| # | Sev | Finding | Response |
|---|---|---|---|
| 1 | High | `ContentSource` is vague; web is synchronous (100+ callers), app is async across several providers. | **Accepted.** Versioned `ReaderSnapshot`, synchronous via context once ready, readiness/stale/offline/error states, equivalence hash test (§4.2, gate 0b). |
| 2 | High | Multi-MB bundle over the async JSON bridge. | **Accepted.** Content never crosses the bridge; the webview loads D1 itself with WebCrypto; only a version token crosses. |
| 3 | High | 4.2 contradiction still understated; define a contingency. | **Accepted.** Contingency is a founder decision before gate 0 (Verdict). |
| 4 | High | Offline rollback can't work; `sharedUi` would be stripped by the schema. | **Accepted.** Native offline watchdog; schema change; EAS rollback marked online-only; airplane-mode drill (gate 4). |
| 5 | High | "Lands together" isn't atomic; OTA vs store build. | **Accepted.** Requirement 2 restated as one source, one merge, all artifacts, no separately editable mobile UI. |
| 6 | Medium | All-chrome-in-DOM moves the boundary; settings/inbox are native today. | **Accepted.** Ownership table; settings and inbox move to the DOM; typed command protocol. |
| 7 | Medium | Performance gated too late. | **Accepted.** Full trace is gate 0a. |
| 8 | Medium | Visual-diff infra doesn't exist; App Review after default-on. | **Accepted.** Parity infra is gate 1; App Review before public default-on. |
| 9 | Medium | 2–3 week estimate unsupported. | **Accepted.** Withdrawn; milestone estimate at gate 0e. |
| — | — | Verdict: "no, until the content contract is defined." | **Partly rebutted.** The contract is now defined in the doc, and gate 0b is where it gets proven, before any UI moves. Not re-reviewed because of the two-round cap. |
