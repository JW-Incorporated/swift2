# One UI programme: execution plan

**Owner brief (Joey, 2026-10-02).** Make the website's screens the app's
screens: identical look on web, iPhone, iPad and Android; one UI source;
fast; launch only when it looks correct. **Design (approved):**
`docs/proposals/2026-10-02-one-ui-three-surfaces.md`. **Decision:**
`docs/decisions.md` 2026-10-02. **Epic:** #4788. **How this runs:**
`OPERATING-MODE.md`. **Live state:** `PROGRESS.md`.

**Done =** `routeFlags.sharedUi` default-on in a store build that Joey has
checked on Android, iPad and iPhone, the parity CI is green, the
performance budget is met, the watchdog drill has passed, and Joey has
submitted to both stores. Native screens are retired one release after the
public launch.

## Calls made up front (reversible, stated, not asked)

- **C1 — Device E2E is humans plus browser engines, not Maestro.** The
  shared UI is web code, so CI renders it in Playwright **Chromium (Android
  engine) and WebKit (iOS/iPadOS engine)** at phone and tablet viewports,
  for free on Linux runners. Joey's batched device sessions cover what only
  hardware shows. Maestro (#4736) stays deferred. It costs money, which is
  Joey's call, and the PM files it only if a gap appears.
- **C2 — Timings come from the app itself.** A hidden diagnostics panel in
  every build, unlocked by tapping the version label 7 times in Settings,
  records load stages and posts a `[diag]` report through the existing
  `/api/feedback` route. That route gains one branch: a `[diag]` message
  is **appended as a comment on a single tracking issue** instead of
  opening a new one, so S1–S7 don't produce 100+ public issues. Reports
  are public, so they carry **no device ids, push tokens or personal
  data**: only model, OS, build, update id and timings. The existing rate
  limit (per IP) stays.
- **C3 — Batch native-layer changes into one store build.** Everything
  native the programme needs lands in WP0.4. Everything after it ships
  JS-only by OTA. A later WP that discovers a native need stops and goes to
  Fable before adding one.
- **C4 — A local preview override, internal only.** The diagnostics panel
  can force `sharedUi` on for this device only (persisted). Joey tests
  without anyone flipping the remote flag, and nothing is public yet, so
  there is no audience risk.
- **C5 — No users yet, so the cohort rule is simple.** Native screens are
  deleted once the first public release plus one OTA cycle runs the shared
  UI with no regression.
- **C6 — Content loads in-webview.** The app's DOM reader builds its
  `ReaderSnapshot` with `packages/content` inside the webview, which has
  WebCrypto. Only commands, a version token and config such as a cache-file
  path cross the bridge; content never does (proposal §4.2; amended in
  WP0.5b, when the Android DOM webview turned out to have no web storage and
  reads the native disk cache by URI instead).

## Cross-cutting concerns (each owned by the WP named)

- **X1 — Network from the app's DOM origin** (WP0.3b, a **G0 blocker**).
  A DOM host loaded from local files has an opaque (`null`) origin, and
  `apps/web` sends no CORS headers today.
  - **`/content/**`:** public, static and uncredentialed, so it gets
    `Access-Control-Allow-Origin: *`. That applies to `/content/**` only,
    via `next.config.mjs` headers. **Never** `Allow-Origin: null`.
  - **`/api/*`:** the six reader call sites (e.g. `FeedbackButton.tsx`,
    `WebNotificationSettings.tsx`) go through a host-adapter `apiFetch`.
    On the web that's a same-origin `fetch`. In the app, the bridge hands
    the request to native code, which calls the API directly.
  - **`/api` CORS and the CSP stay untouched.**
- **X2 — Hotlinked images** (WP0.5, S4). Some image CDNs serve placeholders
  when the request's `Referer` isn't an allowed site. In the webview the
  Referer differs. The spike must show real photos on device, not just
  pass in CI (see the repo memory on curl vs browser hotlink checks).
- **X3 — Web-only side effects inside the app** (WP2.1).
  `@vercel/analytics`, the web push/notification UI, `next/image`
  optimisation and service-worker or `localStorage` assumptions must each
  be either adapted through the host adapter or switched off in the app.
  The adapter has to list each one explicitly.
- **X4 — Deep-link and URL parity** (WP2.3). App routes use the same
  paths and query shape as the web, so a shared link opens the same
  screen on every surface.

## Phase G0 — Foundations (before any UI moves)

### WP0.0 Release-train hardening (#4771) · executor · reviewer
- **Touch:** `.github/workflows/mobile-release.yml`, `mobile-rollback.yml`.
- **Do:** add a job `timeout-minutes` of 60 to the EAS wait; make a hung or
  failed EAS run fail loudly with the EAS run URL in the summary.
- **Accept:** a YAML lint passes; the PR description states the
  timeout-behavior reasoning.
- **Why first:** every later WP ships through this train. On 10-01 a hang
  blocked it for 6 hours.

### WP0.1 Diagnostics panel + load-stage timing · executor · reviewer · JS-only
- **Touch:**
  - `packages/content/src/**` (timing hooks, no behavior change);
  - `apps/mobile/lib/diagnostics*.ts`;
  - `apps/mobile/components/Diagnostics*.tsx`;
  - the Settings entry;
  - `apps/web/app/api/feedback/route.ts` (the `[diag]` → tracking-issue
    comment branch). The worker creates the tracking issue first, and its
    number goes in as a **hardcoded constant** in the code, not a Vercel
    env var, because env vars are prod infra and therefore Joey's;
  - tests.
- **Do:**
  - Record marks for app start, config, manifest, each file download,
    hash, parse, validate, disk write, provider wiring and first era
    paint, with cold or warm noted.
  - The panel shows the breakdown, device model, OS, app build and update
    id.
  - "Send report" posts a `[diag]` feedback message.
  - Add the C4 preview-override toggle as a stub; it gets wired in WP0.4.
- **Accept:** unit tests for the timing collector; `expo export` for both
  platforms; no change to user-visible behavior with the panel locked.
- **Then — HA session S1 (Joey):**
  - Android and iPad: 5 cold and 5 warm launches each, "Send report"
    after each.
  - iPhone: the same, for Joey to coordinate.
  - These numbers are the **native baseline**.

### WP0.2 Fix the content loader (#4783) · researcher → executor · [codex] · JS-only
- **Depends on:** S1 reports.
- **Touch:** `packages/content/src/**`, `apps/mobile/lib/*-data.ts`,
  `content-bundle.ts`, `vault*.ts`, tests.
- **Do:**
  - A researcher turns the `[diag]` comments on the tracking issue into a
    ranked cost table.
  - An executor fixes the top costs. Expected: a single shared in-flight
    load (no per-module reloads), parallel file fetches, and no re-hash or
    re-parse when the cached version matches. Keep integrity checking on
    first download.
- **Accept:**
  - Existing loader tests stay green, plus tests for in-flight dedupe and
    cache short-circuit.
  - **HA session S2:** Joey's Android cold launch to eras ≤ 2.5 s, worst
    of 5, and warm ≤ 1 s. The same on iPad and iPhone.
- This ships value to today's app regardless of the rest of the programme.

### WP0.3 `ReaderSnapshot` contract + equivalence test · executor · [codex]
- **Touch:** `packages/experience/src/reader-snapshot/**`, tests, and a CI
  step in `.github/workflows/ci.yml`.
- **Do:**
  - A versioned `ReaderSnapshot` type covering every provider the reader
    uses: content items, milestones, era stream (curated, videos,
    doorways), theories, threads, search index, track guide, merch. It also
    carries `version` and a state of `ready | stale | offline | error`.
  - `fromBaked(...)`, using the web's generated modules, and
    `fromBundle(...)`, using a D1 bundle.
  - A canonical hash function.
  - **CI test:** build the D1 bundle from the same commit
    (`scripts/build-content-bundle.mjs`) and assert
    `hash(fromBaked) === hash(fromBundle)`. Report any domain that diverges
    by name.
- **Accept:** the test passes on `main` content, and a deliberately
  diverged fixture fails it. Nothing imports it yet, so there is no UI
  change.

### WP0.3b Content CORS + API transport (X1) · executor · [codex]
- **Touch:** `apps/web/next.config.mjs` (headers for `/content/**` only),
  `packages/content/src/**` (an `apiFetch`-style seam if it's needed),
  tests.
- **Do:**
  - Add `Access-Control-Allow-Origin: *` on `/content/**`.
  - Add a test asserting the header is present on `/content/manifest.json`
    and **absent** on `/api/*` and on HTML routes.
  - Define the `apiFetch` adapter contract that WP2.1/2.3 will implement.
- **Accept:**
  - Tests pass.
  - After deploy, a `curl -I` with an `Origin: null` header on the live
    manifest shows the header, and the same request to `/api/feedback`
    does not.
  - Codex review is clean.

### WP0.4 Expo DOM foundations — **the one native batch** · researcher → executor · [codex]
- **Touch:** `apps/mobile/package.json`, `app.json`, `metro.config.js`,
  `apps/mobile/dom/**` (new), `packages/content/src/app-config.ts` (schema:
  `sharedUi`), `config/mobile/app-config.json`, the diagnostics override
  wiring.
- **Do:**
  1. A researcher audits every native module the whole programme needs:
     the Expo DOM prerequisites (`react-dom`, `react-native-web`,
     `@expo/metro-runtime`, the DOM webview module for SDK 57), haptics,
     share, and storage for the watchdog. Add only what's missing.
  2. Keep the Metro content generator working.
  3. Add a minimal `'use dom'` host that renders a test page proving
     Tailwind v4 CSS, one `--era-*` variable switching at runtime, one
     Radix dialog/portal, and a 50-item scroll list.
  4. Add `routeFlags.sharedUi` (default `false`) to the schema and config.
  5. Wire the C4 local override to show the DOM host.
- **Accept:**
  - Typecheck, lint and tests pass.
  - `expo export` passes for both platforms.
  - **Native-needs matrix.** A table in the PR covering every later need
    (WP2.4–2.13):
    - haptics (`expo-haptics`);
    - share (prefer RN's built-in `Share`);
    - deep-link `scheme`, iOS associated domains and Android intent
      filters (X4);
    - Android `softwareKeyboardLayoutMode` (keyboard over the composer);
    - notification categories/actions;
    - the DOM webview module (`react-native-webview` 14.0.1 is already
      present);
    - safe areas and storage.

    Each row is marked present, added or not-needed, and **the PM signs
    the matrix in `PROGRESS.md` before the merge.**
  - **An `@expo/fingerprint` diff pasted in the PR.** Don't assume what
    changes the fingerprint; prove it.
  - The release train produces new iOS/Android store builds (TestFlight +
    Play internal), and the PM spot-checks the run.
  - **HA session S3:** the test page renders correctly on Android, iPad and
    iPhone, and the native screens are unchanged with the override off.

### WP0.4b Minimal watchdog · executor · [codex] · JS-only
- **Why now:** from S4 on, Joey's devices run the DOM reader via the C4
  override. A crash on launch would otherwise loop with no recovery short
  of a reinstall.
- **Touch:** `apps/mobile/lib/watchdog*.ts`, the `App.tsx` mount logic,
  diagnostics ("force DOM failure" switch), tests.
- **Do:**
  - Use a persisted native-side record.
  - If `ready` doesn't arrive within a timeout, or the DOM crashes on 2
    consecutive launches, clear the C4 override and mount the native
    screens for this launch and the next.
  - Works with no network.
  - A remote `sharedUi` flag flip is evaluated at launch only (no live unmount).
  - The brief native flash while the gate is `pending` is deferred; check it in S4.
- **Accept:** unit tests for the timeout, the crash streak and recovery.
  The S4 checklist includes a forced-failure check in airplane mode.
- **If Expo DOM can't do this on SDK 57:** stop, write it up, and take it
  to Fable for the fallback mount (a static `packages/ui` build in one
  `react-native-webview`) before continuing.

### WP0.5 Spike: real screens in the DOM host · executor · [codex] · JS-only
- **Depends on:** WP0.2, WP0.3, WP0.3b, WP0.4, WP0.4b.
- **Must prove:** content cached in the webview survives killing the app
  and relaunching it in airplane mode. WKWebView storage for a
  local-file origin isn't durable, and `localStorage` holds only ~5 MB.
  **If it fails:** native keeps today's disk cache and the webview reads
  the bundle's local files. Content still never crosses the bridge.
- **Touch:** `apps/mobile/dom/**`, a spike-only alias to the web reader
  components. Not the production structure; WP2.x replaces it.
- **Do:**
  - Mount era stream, moment detail and bottom nav in the DOM host.
  - Load content in-webview via `packages/content` +
    `ReaderSnapshot.fromBundle`.
  - Wire the minimum bridge: `ready`, Android `back`, safe-area insets.
  - Add first-paint and memory marks to diagnostics.
- **Accept:**
  - **HA session S4** (all three devices):
    - it looks like the site side by side;
    - real photos show, not placeholders (X2);
    - YouTube/Spotify embeds load inside the app;
    - scroll is smooth and back works;
    - an airplane-mode relaunch after killing the app still shows
      content;
    - the forced-failure switch falls back to native screens;
    - 5 cold and 5 warm reports each;
    - the iPad is checked in portrait, in landscape and in split view.
  - A researcher compares the spike against the S2 native numbers.

### WP0.6 G0 go/no-go + milestone estimate · PM + Fable (mandatory)
- **Inputs:** S2 and S4 numbers, WP0.3/0.4/0.5 reports.
- **Decide:** proceed on Expo DOM, or switch to the fallback mount;
  adjust the budgets if the evidence warrants it, recorded with reasons.
- **Output:** a milestone estimate for G1–G5 in `PROGRESS.md` and a
  comment on #4788.

## Phase G1 — Parity and accessibility CI (before screens move)

### WP1.1 Parity harness · researcher → executor · [codex]
- **Touch:** `e2e/parity/**`, `playwright.parity.config.ts`, a fixture
  generator, and `.github/workflows/parity.yml`.
- **Do:**
  - Use a deterministic fixture: a frozen `ReaderSnapshot`, a frozen
    clock, reduced motion, and stubbed network embeds.
  - Render each route twice:
    - (a) the web build;
    - (b) the app's DOM entry, built for a browser the way the DOM host
      bundles it, with the app host adapter and simulated safe-area
      insets. The researcher picks the build path.
  - Engines and viewports:
    - Chromium at Pixel 7;
    - WebKit at iPhone 15 and iPad (portrait and landscape).
  - Compare (a) with (b), and each with a stored baseline, using a
    **tolerance-based perceptual comparator**, not a fixed pixel
    threshold. Linux WebKit anti-aliases differently from device WebKit.
  - Add an **OTA size budget check** to the `expo export` output, failing
    on more than 15% growth over the stored baseline.
  - Known blind spots CI can't see; device sessions own them:
    - `dvh`/`visualViewport` under the keyboard;
    - the fixed bottom nav during overscroll;
    - inline media autoplay;
    - Android WebView version lag;
    - memory kills;
    - Referer-gated images;
    - embeds refusing a `null` origin.
  - Trigger on PRs touching `packages/ui/**`, `apps/web/**` or
    `apps/mobile/dom/**`. Linux runners only.
- **Accept:**
  - The harness runs green on the spike routes.
  - A deliberate visible change (a shifted element, a wrong color) fails
    it.
  - Runtime is ≤ 10 min, with the minutes noted.

### WP1.2 Accessibility checks · executor
- **Touch:** `e2e/parity/a11y*.ts`.
- **Do:** run axe on the same fixture pages.
- **Accept:** no new serious or critical violations against the current
  web baseline.

## Phase G2 — Extraction and migration (all JS-only, by OTA)

### WP2.1 `packages/ui` skeleton + host adapter · executor · reviewer
- **Touch:** `packages/ui/**` (new), workspace config, ESLint config,
  `apps/web/lib/host-adapter*`.
- **Do:**
  - Package, Tailwind v4 wiring, adapter interface (`Link`, `Image`,
    `useRouter`, `lazy`, `share`, `haptic`, `openExternal`,
    `notifications`, `insets`).
  - The web adapter implementation, including `apiFetch` (X1).
  - An ESLint ban on `next/*` and `react-native*` inside `packages/ui`.
  - **Fonts:** self-host the reader fonts in `packages/ui` with
    `@font-face`. The web reader stops using `next/font/google`
    (`apps/web/app/layout.tsx:10`) for them, so web and app load the same
    files. Update the CSP font rule if needed, and recapture the parity
    baseline in the same PR.
  - **X3:** list every web-only side effect (`@vercel/analytics`, web push
    UI, `next/image`, `localStorage` assumptions) with how the app adapter
    handles it.
- **Accept:** typecheck, lint and tests pass; `MAP.md` updated; the
  parity diff on the web is zero, apart from the documented font
  re-baseline.

### WP2.2 Web reader reads `ReaderSnapshot` from context · executor · [codex]
- **Touch:** `apps/web/lib/longlive/**`, the `apps/web/components/longlive/**`
  call sites, and tests.
- **Do:**
  - Provide `ReaderSnapshot` (`fromBaked`) via context.
  - Move every synchronous `content.ts` caller to the hook.
  - **Split by domain if any PR's diff exceeds ~400 lines.**
- **Accept:**
  - The parity harness shows **zero visual change** against the
    pre-change baseline.
  - Web e2e is green.
  - Tests pass.
- **Done:** WP2.2-D lint ban (`eslint.config.mjs`,
  `packages/ui/src/reader-lint-ban.test.ts`). Remaining module-global setter
  users (server API routes via `vault-wiring.ts`, `apps/mobile/lib/*-data.ts`,
  the WP0.5 spike) are out of scope and retire with WP2.13/C5 native
  retirement.

### WP2.3 Bridge protocol · executor · [codex]
- **Touch:** `packages/ui/src/bridge/**`, `apps/mobile/dom/bridge/**`, the
  app host adapter.
- **Do:**
  - Typed commands and events with ordering and cancellation: `ready`,
    `back` → `handled|exit`, `navigate`, `share`, `haptic`, `openExternal`,
    `insets`, `notifications.{status,request,register,updatePrefs}`,
    `diag`, and the content version token.
  - Restore accessibility focus after native sheets close.
  - Notification tap goes to `navigate` once the reader reports `ready`,
    on both cold and warm start.
- **Accept:** protocol unit tests on both sides, plus contract tests that
  the DOM and native message types match.

### WP2.4–2.13 Move slices into `packages/ui` and mount them in the app · executor per slice · reviewer
One PR per slice, in this order:

| WP | Slice |
|---|---|
| 2.4 | Shell chrome (LongLive root, TopBar, BottomNav) + era stream |
| 2.5 | Moment detail + video/social embeds |
| 2.6 | Threads |
| 2.7 | Track guide + song |
| 2.8 | Search |
| 2.9 | Merch |
| 2.10 | Community |
| 2.11 | Clownbot (keyboard over composer) |
| 2.12 | Notification settings + inbox (native commands) |
| 2.13 | Legal pages; retire the `SiteShell` WebView path |

**Each slice:**
- Moves its files into `packages/ui`.
- The web renders from the package with **zero parity diff**.
- The app's DOM reader gains the slice behind `sharedUi`.
- Its behavior checks go into the next batched device session (proposal
  §4.6 gate 2 list):
  - notification tap to a nested route, cold and warm;
  - Android back and iOS edge swipe;
  - scroll restoration;
  - keyboard behavior;
  - VoiceOver/TalkBack order;
  - YouTube/Spotify inline playback;
  - returning from an external link;
  - rotation.

**HA sessions:**
- **S5:** after 2.4–2.7.
- **S6:** after 2.8–2.13.

### WP2.14 Watchdog for default-on · executor · reviewer · JS-only
- **Do:** extend WP0.4b so the remote `sharedUi` flag (not only the local
  override) is covered too, once default-on is near.
- **Accept:** tests pass. The G4 drill exercises it.

## Phase G3 — Performance (Fable go/no-go)
- **HA session S7:**
  - Android, iPad and iPhone: 10 cold and 10 warm launches each, with
    reports.
  - Era-stream scroll and era switching, with marks recorded.
- A researcher computes p50/p95 against the S2 native baseline and the
  proposal §4.6 budgets.
- **Fable gives the go/no-go.**
- **If it fails:** a researcher profiles it, an executor fixes it, and S7
  is repeated.

## Phase G4 — Watchdog drill
- **HA session S8:**
  - Turn on "force DOM failure", go into airplane mode and launch: the
    native screens appear.
  - Turn the switch off and relaunch: the shared UI returns.
- **Online drill:** the PM runs `mobile-rollback.yml` against a
  deliberately broken internal OTA (testers only; nothing is public). Joey
  confirms that recovery happens on the next launch.

## Phase G5 — Default-on and launch
- **WP5.1 · executor:**
  - Set `sharedUi` default `true` in `config/mobile/app-config.json`.
  - Prepare `docs/plans/one-ui/store-kit.md`: a screenshot shot-list,
    store-form answers rechecked against the new app, and App Review
    notes that lead with the notification loop.
- **HA session S9 (final look):** Joey on all three devices confirms it
  "looks exactly like the site".
- **Joey actions (#4729 steps 3, 4 and 7):**
  - take the store screenshots;
  - fill in both store forms;
  - promote the build and submit to both stores.
- **WP5.2 (after launch + 1 OTA cycle, C5):**
  - Delete the native screens and the `sharedUi` flag.
  - Delete the spike alias.
  - Update `docs/architecture.md`, `docs/longlive-experience.md`,
    `docs/mobile-release.md` and `MAP.md`.

## Human actions this programme needs (Joey)

| Session | After | What |
|---|---|---|
| S1 | WP0.1 | Native baseline timings (reports via the panel) |
| S2 | WP0.2 | Loader-fix timings |
| S3 | WP0.4 | Install the new store builds; DOM test page check |
| S4 | WP0.5 + 0.4b | Spike look, photos, embeds, scroll, back, offline relaunch, forced failure, timings, iPad orientations |
| S5 | WP2.4–2.7 | Behavior checklist, first half |
| S6 | WP2.8–2.13 | Behavior checklist, second half |
| S7 | G3 | Performance runs |
| S8 | G4 | Watchdog drill |
| S9 | G5 | Final look; then screenshots, forms, submit |

iPhone checks in every session go to Joey to coordinate. Paid services
(Maestro Cloud, an EAS upgrade) are never assumed; they are filed as
separate human actions if needed.
