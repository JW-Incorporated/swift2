# Visual parity harness (One UI WP1.1c)

Renders the WP0.5b spike routes twice and fails when the two renderings
disagree with each other or with committed Linux baselines. Epic #4788.

- Side a: the Next web build (`next start`, secretless; Supabase degrades to empty).
- Side b: the app's DOM entry (`apps/mobile/index.web.ts`, which mounts
  `AppReader`, the production DOM reader since D2) exported for a browser, fed from the fixture bundle on disk.
- Routes: `/` (the era stream; shared root `main`) and `/?item=<id>` (the open
  moment; shared root `[role="dialog"]`). The item id is stored in
  `scripts/parity/fixture/fixture.json` (`itemId`).

## How it works

- `package.json` `main` is `index`: Expo resolves `index.ts` for native and
  `index.web.ts` for web. Build b:
  `cd apps/mobile && EXPO_NO_WEB_SETUP=1 npx expo export --platform web --output-dir dist/parity-web --clear`.
  `EXPO_NO_WEB_SETUP=1` skips Expo's "web is not in app.json platforms" check,
  so `app.json` is untouched and the native fingerprint (OTA runtime version)
  does not change.
- Frozen fixture (`scripts/parity/fixture/`, committed): a content snapshot taken
  once: the published bundle (`content/`, side b reads it from disk at `/content`
  via `serve.mjs`) and the seven baked modules the web build imports
  (`web/*.generated.ts`, side a). BOTH sides render from it, so baselines do NOT move
  when live content (`supabase/seed/**`) changes. CI `build-web` runs
  `npm run sync:content` (for the unrelated generated files), then
  `make-fixture.mjs --apply` (overlays the snapshot over `apps/web` and fails unless
  baked and bundle hash equal `fixture.json`), then `npx next build` directly
  (`npm run build` would re-run `prebuild` and re-sync live content over it).
  CI never regenerates. Regeneration is deliberate and manual: `npm run sync:content`,
  then `npx tsx --tsconfig apps/web/tsconfig.json scripts/parity/make-fixture.mjs --regenerate`,
  commit the fixture, then re-baseline (below). The snapshot is PRUNED (`--regenerate` does it
  itself; `--prune` re-prunes the committed fixture in place, idempotently): it keeps only the
  eras the two routes render, the current era (first screen of `/`; the clip is 480 px, so
  only that era shows) and the fixed item's era, in BOTH the bundle and the era-keyed baked
  modules. Other eras stay in `eras.json` but have no content, and their per-era
  tracks/theories/videos/secrets entries are empty; milestones and shop-the-look merch,
  which derive from the baked content, are filtered to the same eras. Size: about 2.9 MB raw
  (was 8.3 MB, 118k lines). The content dir is `content/frozen/` (was the 64-hex content
  hash; the loader treats `bundleVersion` as an opaque string and checks per-file
  sha256, which `--prune` recomputes). Scrolling further than the first screen would reach
  empty eras, which no parity route does.
- Runtime equivalence hash on BOTH sides (`compare.spec.ts`): side b reports its
  rendered snapshot hash (`window.__probe`); side a reports the hash of the baked
  modules the running server holds via `GET /parity-probe`
  (`apps/web/app/parity-probe/route.ts`, 404 unless `PARITY_PROBE=1`, set only by
  `playwright.parity.config.ts`). Both must equal `fixture.json`.
- Serve + test: `npx playwright test -c playwright.parity.config.ts` starts
  `serve.mjs` (b, 4173) and `next start` (a, 4174), both on 127.0.0.1.
- Projects: Pixel 7 (chromium), iPhone 15 (webkit), iPad Pro 11 portrait and
  landscape (webkit); 2 workers locally, one CI job per project.

## Determinism (one handler, `e2e/parity/helpers.ts`, both sides)

The a-vs-b specs run each side in its own browser context (`pages.a` is the test's page, `pages.b` a second
context with the same device options, armed by the same handler). When both sides shared one page, WebKit's
in-memory image cache served side b an image side a had just fetched, so b's request never reached the route
handler and the recorded external-image sets differed although both sides rendered the image.

Fixed clock (`clock.setFixedTime`, never `install`), reduced motion, animations
disabled, caret hidden, first-visit flags in `localStorage`, `/vault/live`
stubbed empty, Vercel analytics stubbed, every external image answered by one
generated grey PNG (every external image URL is recorded per side and the a and b
sets are asserted identical per route), any other external request or any `pageerror` /
`console.error` / HTTP >= 400 fails the test. Fonts: both sides get
`@font-face "ParityFont"` from the DOM entry's own data-URI font plus
`* { font-family: "ParityFont" !important }`, and `document.fonts.ready` before
any capture. The stylesheets are served same-origin (`page.route` + `<link>`), so the
web build's CSP stays on for Chromium; WebKit refuses the inline style Playwright
itself injects for any `page.screenshot()` under that CSP, so only the three WebKit
projects set `bypassCSP` (side b has no CSP). Captures wait for React to own the DOM (the web build is
server-rendered; client-only text such as the daily gloss swaps in after
hydration) and for the root's text and height to hold still. Every capture (pixel
and a11y alike, via `openRoute` / `captureRoot` / `captureViewport`) also blocks in
`imagesReady` until each `<img>` and CSS `background-image` in the root's first screen
is loaded and decoded (lazy imgs are forced eager); a broken, undecodable or
10 s-stuck image fails the test naming its URL, so a baseline can never be captured
before a hero image paints (the #4827 flake). Scope is the clip region both ways (vertical
and the viewport width, so offscreen carousel slides are skipped); an image that is
`complete` with a width is loaded even if `decode()` rejects (SVG). `negative.spec.ts`
proves the gate: with `imagesReady` made a no-op the delayed-image specs fail.
Web-only chrome outside the shared root (TopBar and its fixed timeline rail,
footer) is hidden by stylesheet for pixel capture; the app host supplies its own.

## The gates (blocking)

1. Pixel a-vs-b: the top 480 css px of the shared root (a full era stream is
   about 67k px tall), font-normalised, same project and engine, ZERO insets on
   b. Threshold 0.3, `maxDiffPixelRatio` 0.001.
2. Structural a-vs-b: elements with role main, navigation, banner, article,
   list, listitem or heading under the root, DOM order; same count and order;
   rects root-relative integer css px, each of x, y, width, height within 2px;
   text is `innerText`, whitespace-collapsed, NFC.
3. Per-side pixel baselines (`baseline.spec.ts`, Linux only): same threshold and
   ratio. Side b is captured with REAL simulated insets (`?inset=t,r,b,l`:
   iPhone 15 59/0/34/0, Pixel 7 24/0/48/0, iPad 24/0/20/0). A second baseline per
   route (`b-<route>-viewport.png`) is the whole viewport, where body top padding and
   nav bottom padding show. `compare.spec.ts` proves the insets are visible on home
   (real vs zero insets differ). The item dialog is inset-immune by construction
   (`MomentDetail.tsx` has no safe-area styles; the bridge in `reader-spike.css` only
   touches body padding, the nav and fixed bottom offsets, all behind the modal); a
   test pins that.
   WP2.4-0 adds web-chrome baselines on side a, captured from `main` before the chrome
   moves into `packages/ui`: `a-<route>-viewport.png` (whole viewport at scroll top with
   TopBar, its timeline rail and BottomNav visible; `captureRoot` hides them) and
   `a-home-topbar.png` (the TopBar element only, `captureElement`: the pixel ratio then
   applies to the small area, because over a whole iPad viewport a 1px TopBar shift is
   under `maxDiffPixelRatio`). They are new files only; no existing baseline was
   regenerated. `negative.spec.ts` proves a pure 1px TopBar translate fails the TopBar
   clip and a 1px TopBar growth fails the viewport capture. The footer is not captured
   on home: it sits at the foot of a ~67k px lazily-growing stream and could not be
   clipped stably. It is captured on the short static `/support` page instead
   (`a-support-footer.png`, side a only, the `footer` element via `captureElement`,
   opened by `openSupportFooter` which waits for hydration and the client-only
   "Vault refreshed" line to hold still); `negative.spec.ts` proves a pure 1px footer
   translate fails that clip on all four projects.
   One UI PR0-alpha (WP2.5-2.8) added the `a-*` baselines of `A_ONLY_ROUTES` (`routes.ts`; they never enter
   `ROUTES`, so the base compare and a11y are unchanged; every one is now `sides: 'both'`, see below): `a-item-video`,
   `a-item-social` (the Instagram facade is never clicked, because an iframe is an external
   non-image request), `a-threads`, one `a-lens-<id>` per thread lens, `a-crossing`,
   `a-guide`, `a-song`, `a-theories`, `a-search-open`, `a-search-results`, plus element
   clips: related rail and follow-threads row (on `item-social`, because the frozen
   Fearless `item` has no related ids or threads), `a-item-lightbox` (on `item`), the
   fashion career scrubber, the song OverlayNav and the search combobox row. The fixture
   covers only Fearless and TLOAS, so some threads are sparse. `negative.spec.ts` proves a
   1px mutation fails the rail clip, the search row clip and the threads root capture.
   One UI PR0-beta (WP2.9-2.13) added more `a-*` baselines (`A_ONLY_ROUTES_BETA` in
   `routes.ts`): `a-merch`, `a-community`, `a-clownbot`, `a-clownbot-transcript` (a stubbed
   `/api/clown` NDJSON answer, served to side b through the bridge stub of `b-api.ts`, below), `a-mood`, `a-settings-notifications` (the Notification, PushManager
   and serviceWorker APIs are stubbed to `default` before load), `a-privacy`, `a-terms` and
   `a-support` (the footer capture `a-support-footer` is unchanged). `negative.spec.ts` proves a
   1px translate of one element per surface (`BETA_NEGATIVE_TARGETS`) fails its element clip on all
   four projects. `hydrated` no longer waits for a button when the root has none (static legal pages).
   Every route in these two lists is now `sides: 'both'` (each slice D flipped its own; W5-parity flipped the last, `clownbot-transcript`): each has an a-vs-b viewport compare and `b-<name>.png` / `b-<name>-viewport.png` baselines, and the `a-*` baselines were never regenerated. A route that omits `sides` is still side-a-only.

## Flipping a route to both sides (One UI W1-E scaffolding, used by each slice D)

A route is side-a-only unless it sets `sides: 'both'` (the type default). Every route in `A_ONLY_ROUTES`,
`A_ONLY_ROUTES_BETA` and `COVERAGE_ROUTES` is flipped today; `EXTRA_ROUTES` (`routes-coverage.ts`) is their union, the one
list the specs iterate. A new route (or a surface a slice D newly ports into the app DOM bundle, side b) is flipped like this:

1. In `e2e/parity/routes.ts` or `routes-coverage.ts` (re-exported by the `helpers.ts` barrel) add `sides: 'both'` to that route entry (type `Sides`, `e2e/parity/sides.ts`).
   Nothing else is edited; `compare.spec.ts` and `baseline.spec.ts` select flipped routes via
   `bothSidesRoutes(EXTRA_ROUTES)`.
2. The flip generates, per project: `a vs b viewport: <name>` (`compare.spec.ts`: whole viewport, zero insets
   on b, same engine, threshold 0.3 / ratio 0.001; a still shows its web chrome, so a slice whose b side
   lacks a host-supplied bar either lands that bar or accepts the diff in the PR) and
   `b (DOM entry, real insets) <name>` (`baseline.spec.ts`: root or `clip` capture `b-<name>.png` plus the
   whole viewport `b-<name>-viewport.png`). The route's `init` / `prepare` / `clip` run on both sides.
   Name guard: `assertNoBaselineCollisions` (`sides.ts`) runs at module load of `routes-coverage.ts` and throws if a flipped route's
   `b-<name>.png` / `b-<name>-viewport.png` collides with the base routes' (`b-home*`, `b-item*`) or another flipped route's
   (e.g. a route named `item-viewport`); unit-tested in `sides.spec.ts`.
3. The b-* baselines do not exist yet, so the run is red once. Create them with the "Updating baselines"
   dispatch (`gh workflow run parity.yml --ref <branch> -f update-baselines=true`; exactly `parity.yml`, not
   `mobile-parity.yml`), then push a non-bot commit (bot commits do not trigger PR CI).
4. Side b must serve the route: it needs the slot in `apps/mobile/dom/slots/` (see its header), and an unknown query
   mode renders the D-6 fallback, which fails the a-vs-b compare (that is the intended signal).
   WP2.8-D flipped `search-open` and `search-results` (slot `overlay:search`, `dom/slots/search.ts`); their
   `b-search-*` baselines are added by the update-baselines dispatch, the `a-search-*` ones are unchanged.

`sides.spec.ts` is the browser-free dry run: a fixture route marked `both` plans one a-vs-b compare and two
b baselines, and every real route flipped to `both` is asserted to have its b baselines committed for every project
(so a flip is red until the update-baselines dispatch has run).

`negative.spec.ts` proves each gate: a 4px shift and a colour change fail both
the pixel baseline and the pixel a-vs-b; a missing landmark, changed text and a
4px shift fail the structural a-vs-b; the unmutated pair passes; a 4 s delay on every image response (local or external) must still
yield a capture identical to the undelayed one (the image-settle guard). Self-referential
(references captured on the machine), so it runs on any OS and needs no PNGs.

Not duplicated here: the OTA size budget lives in WP1.1a (#4814). The
no-baked-content proof (`scripts/parity/check-dom-bundle.mjs`) runs in the
`build-dom` job against a native `expo export --platform ios --source-maps`,
after `npm run sync:content`.

## CI

`.github/workflows/parity.yml`: `build-web` (a, plus the fixture) and
`build-dom` (b, plus the bundle check) run in parallel, then one Playwright job
per project in `mcr.microsoft.com/playwright:v1.63.0-noble` (keep the tag equal
to the installed `@playwright/test` version). Triggers: `packages/ui/**`,
`packages/content/**`, `packages/content-enrichment/**`, `packages/experience/**`,
`scripts/sync-longlive-content.mjs`, `scripts/parity/**` (incl. the fixture), `apps/web/**`, `apps/mobile/dom/**`,
`apps/mobile/parity-entry/**`, `e2e/parity/**` and the harness files. Linux
only.

**The gate.** The workflow runs on every pull request (no top-level `paths:`),
so a required check can never be left waiting on a run that never started. A
`changes` job (`dorny/paths-filter`, the path list above) outputs `relevant`;
the builds and Playwright jobs run only when it is true (always true on
`workflow_dispatch`). A final job named `parity-gate` always runs on PRs and
passes iff nothing relevant changed, or `build-web`, `build-dom` and every
`parity` matrix job succeeded; any failure, cancellation or skip of those when
relevant fails it. The `update-baselines` dispatch path is unchanged. When
editing the filter, keep it in sync with this list.

Parity is required on main since 2026-10-03 (ruleset protect-swift2-main: build + parity-gate).

Baselines depend on the frozen fixture, not live content, so a live content
change does not turn the run red. A change to the renderers, the sync format
(`--apply` hash check fails) or the fixture does, until the fixture and baselines
are regenerated deliberately.

Asset gate: a missing side-b export asset is an HTTP 404 and fails the test; `serve.mjs`
has no fallthrough. Era art is the one app-relative network asset: the DOM host's
`resolveUrl` maps `/eras/x.png` to `https://www.longlivets.com/eras/x.png`, and the shared
Playwright handler (`e2e/parity/helpers.ts`) fulfils that URL with the real bytes from
`apps/web/public/eras` (not the grey stub, not recorded as an external image). S4:
offline/airplane-mode era art in the app must be checked on a device.

## Updating baselines

1. Open the PR (the parity run is red until baselines exist; that is expected).
2. Dispatch on the PR branch: `gh workflow run parity.yml --ref <branch> -f update-baselines=true`.
   The job regenerates PNGs and commits them to that branch. (On the default branch the job fails fast;
   baselines are never regenerated there.)
3. Re-run the parity workflow (`gh workflow run parity.yml --ref <branch>`) -
   commits made with `GITHUB_TOKEN` do not trigger `pull_request` runs.

## Accessibility (One UI WP1.2)

`e2e/parity/a11y.spec.ts` runs axe (`wcag2a`, `wcag2aa`) on both sides of both
fixture routes, after the same readiness guards as the parity specs, in all four
projects. Only serious and critical findings count. The run fails on any
(rule, node-target, impact) triple not in the committed baseline
`e2e/parity/a11y-baseline/<project>.json` (keys `a/home`, `a/item`, `b/home`,
`b/item`); new ones print as `[impact] rule at target`. A missing baseline is
red, never vacuous. Findings on side b whose rule id side a lacks on that route
are logged (`a11y b-only ...`, also a test annotation); b-only findings never fail the run; they appear as the `a11y-b-only` annotation in the Playwright report and in the CI job log, and are not posted to the PR. Each page
must also have at least one axe rule pass, so a blank page cannot pass.
`a11y-compare.spec.ts` unit-tests the baseline key. `a11y-negative.spec.ts` injects an alt-less
image and a nameless button and asserts both surface as new.

Regenerate (same rule as the screenshots: never on the default branch): the
`update-baselines` dispatch in "Updating baselines" also runs
`A11Y_UPDATE=1 npx playwright test -c playwright.parity.config.ts e2e/parity/a11y.spec.ts`
and commits `e2e/parity/a11y-baseline`. Review the JSON diff: every added entry is
a violation you are accepting.

## Fingerprint

Native fingerprint `4c8f334d334c6e26208f4f638112b00b5f551e80` on origin/feature/one-ui-wp0.5b
(d16abd2c) == on this branch (`npx @expo/fingerprint fingerprint:generate` in apps/mobile,
same worktree and environment, Windows 11 / Node 24.18; the branch's only apps/mobile
difference, `main` = `index`, was toggled and does not move the hash).

## Fonts: real-font web comparison (`scripts/parity/font-compare.mjs`)

Compares two production web builds with real fonts (no ParityFont override).
Main-vs-main runs were noisy (0 vs 27 px on home @1440: 1-2 level antialiasing
jitter on 1px rounded `.era-card` borders; merch `fonts equal=false` from
static next/font faces vs a variable face with identical pixels). Three rules:

- Tolerance: pixels whose max channel delta is <= 2 are ignored. The report
  carries `rawDiffPixels` (any delta) and `diffPixels` (tolerant); pass/fail
  uses `diffPixels`.
- Retry: a page/width with a nonzero tolerant diff is re-run once; a
  regression is reported only if it reproduces (`retried` marks these rows).
- Faces compare as family + style only (deduped); weights are not compared
  because variable and static faces of one family render the same. The pixel
  diff is the real weight check.

## Base-route viewport compare (One UI H4/D2)

Side b renders the full packages/ui shell, so `compare.spec.ts` also runs `a vs b viewport: home` and `a vs b viewport: item` for the two base routes (header and nav visible). No existing baseline is regenerated. The moment overlay slot (`dom/slots/moment.ts`, 2.5-D folded into D2) serves `item`. `item-video` and `item-social` are flipped to `sides: 'both'`; their `b-*` baselines are generated by the `update-baselines` dispatch of `parity.yml`. The track guide and song overlays (`dom/slots/tracks.ts`, 2.7-D) serve `guide` and `song`, also flipped to `sides: 'both'` (`b-guide*`, `b-song*`).

The FeedbackButton `bottom` override in `reader-spike.css` is scoped to `max-width: 767px` (#4997): the package sets `md:bottom-4` / `md:bottom-20` (no bottom nav at >= md), and an unconditional `!important` override pushed the pill ~56px off the web position on iPad.

The inset-immunity check for `item` hides the floating FeedbackButton pill (it is outside the dialog and rides the bottom inset through `reader-spike.css`'s `var(--safe-bottom)` override, like the web does with `env()`); `captureViewport(page, maskSelectors)` takes the selectors to hide (a mask rectangle would move with the pill and expose different pixels).

## Legal routes on both sides (One UI W3-legal)

`privacy`, `terms` and `support` are flipped to `sides: 'both'`. Side b serves only the DOM entry's `index.html`, so their `init` (`serveLegalOnB`, `routes.ts`) answers those three paths on b with that file (URL kept; the reader seeds its legal path from the pathname). Side b also has the reader's own `<main>`, so the shared root is the legal document's `main:has(> nav[aria-label="Breadcrumb"])` (the same element as `main` on side a: the `a-*` baselines are unchanged). The `b-*` baselines come from the `update-baselines` dispatch.

## Mood on both sides (One UI 2.11-D2)

`mood` is `sides: 'both'` (`b-mood*.png` plus the a-vs-b viewport compare). The a-vs-b diff on iPad was the app lacking the `footer` slot: the website mounts `SiteFooter` under every surface and mood is short enough for it to sit in the viewport, so the app now registers the same package component (`dom/slots/footer.ts`). Tall surfaces never showed the gap because their footer is below the fold.

## W5-parity coverage routes (One UI W5)

Surfaces that had no a-vs-b comparison (a-only element clips, or nothing) are `COVERAGE_ROUTES` in `e2e/parity/routes-coverage.ts`, all `sides: 'both'`: `era-selector` (the picker opened from the TopBar; also covers EraGrid), `item-lightbox` (ZoomableImage "Photo viewer"), `item-share-menu` (ShareImageMenu panel), `clownbot-expanded` ("Expand to full screen"), `love-story-entry` (one EntryDetail), `item-social-rail` and `item-social-follow` (related rail, follow-threads row), `lens-fashion-scrubber` (TimelineScrubber), `theory-guide-card` (a TheoryGuide card below the fold), `theory-guide-thread` (the guide's thread drill-down) and `decode-reveal` (a Decode card revealed). `routes-coverage-surfaces.ts` adds sub-surface clips: `moment-confidence-banner`, `moment-rumor-section`, `moment-shop-the-look`, `merch-style-section`, `merch-submit-link-form`, `clown-board` and `mood-song-card` (`/api/mood` stubbed on both sides; the YouTube poster is the harness placeholder). Each gets the whole-viewport compare and, when it has a `clip`, a second `a vs b clip: <name>` compare of the element itself (`compare.spec.ts`), plus `a-<name>.png` (side a, new files only) and the `b-*` pair. Clips that CSS cannot select (`:has-text`) are tagged `data-parity-clip` by the route's `prepare` (`show`), which also scrolls them into view. `item-share-menu` answers `/api/share-card` on either origin with the placeholder PNG (opening the menu prefetches both card images with `fetch`). The era selector opens with a dispatched click: on iPad portrait the TopBar mode tabs overlap the era button on side a, so a pointer click lands on Threads.

**Bridge api stub on side b (`e2e/parity/b-api.ts`).** In a plain browser `AppReader` hands the reader `NO_BRIDGE`, whose `call` fails closed, and ClownChat reaches `/api/clown` through the bridge `apiFetch` (no `apiStream` on the app adapter), so a `page.route` stub cannot intercept it. `clownbot-transcript` therefore patches the exported entry bundle in flight so `NO_BRIDGE.call` answers `window.__parityApi` (defined by an init script) with the same NDJSON fixture side a gets from its network stub. Test-only, no product change; a bundle that no longer contains `NO_BRIDGE` fails the test loudly.

Not coverable with the frozen fixture: EraSecretCard and CountdownBanner render nothing on side a (the pruned fixture has no sourced secret and no countdown at the fixed clock), so adding them needs a deliberate fixture regeneration. Running locally: a stale `serve.mjs` / `next start` from another session on 4173/4174 is silently reused (`reuseExistingServer`) and can serve an older build; set `PARITY_PORT` and `PARITY_A_PORT` to free ports.

**CountdownBanner and EraSecretCard (W6-fixture).** No fixture regeneration was needed. `countdown-banner` answers `/vault/live` (both origins) with one live countdown item 3d 4h after the fixed clock, so the banner renders on both sides (clip `[data-ll-countdown-banner]`). `era-secret` opens `/?era=fearless` (the pruned fixture keeps fearless's sourced secrets; tloas has none, so `/` never shows a card) and clips the first `Era secret` section. Running locally: a stale `serve.mjs` / `next start` from another session on 4173/4174 is silently reused (`reuseExistingServer`) and can serve an older build; set `PARITY_PORT` and `PARITY_A_PORT` to free ports.

## W6-chrome: chrome-included a-vs-b (One UI W6)

The shared root excludes web chrome, so TopBar, its timeline rail, BottomNav, the footer and the floating feedback pill were never compared a-vs-b. `chrome.spec.ts` (cases in `chrome.ts`) compares the WHOLE viewport, chrome included, for home, home scrolled 800 px, item, threads and merch (top and document foot, where the footer shows) on all four projects. Side b carries the project's real insets (`?inset=`); side a gets the equivalent: `emulateInsetsOnA` rewrites every `env(safe-area-inset-*)` in a's html / css / js / flight responses to the pixel value (inline-style values only in html / js; class names keep their text) and installs the native host's clearance rules (same as `reader-spike.css`) before hydration as a constructable sheet. A failure is a real app difference; b is never regenerated to pass.

Found and fixed (DOM-only, web unchanged): `reader-spike.css` padded `body` with `--safe-top/left/right`, and body carries only the default palette, so every non-default era showed a mismatched band under the status bar; and the sticky TopBar pinned at viewport y=0, under the notch, once scrolled. The clearance now lives on the themed `.era-shell` (sides) and on the TopBar itself (top, an `--era-bg` strip; FilterBar's measured offset follows). Shells without a TopBar (legal) pad their own top; a nested shell never pads twice. The `b-*-viewport.png` baselines shift by that intent and are regenerated by `update-baselines`.

## Accepted platform divergences

- **Notification inbox (W6-inbox-dom).** The website has no inbox, so side a has nothing to compare: the inbox is app-only (`overlay:inbox`, gated on `host.notifications`, null on the web and in the parity harness) and has no `sides: 'both'` route. Side b renders it only behind the host capability, so no existing route or baseline changes. Covered by unit and render tests (`apps/web/components/longlive/InboxOverlay.app-host.test.tsx`).


**App-only surfaces (inbox, push offer).** `B_ONLY_ROUTES` in `e2e/parity/routes-b-only.ts` are `sides: 'b'`: side-b baselines only (`b-inbox-{empty,loading,list,error}`, `b-onboarding-offer`, each with a `-viewport` pair; captured in `baseline.spec.ts`), no a-vs-b compare because the website has no notifications host. Side b in a plain browser has no bridge, so `b-bridge.ts` patches the entry bundle like `b-api.ts` and answers `notifications.status`, `onboardingOffered`, `markOnboardingOffered` and `GET /api/notifications/inbox` (the loading state never answers; the error state is HTTP 500). `b-only.spec.ts` asserts the surfaces use the website Settings page's tokens by computed style (heading, body text, pill button, background). The inbox has no read/unread state, so the list route covers a fresh row, a wrapping body and an unknown-category fallback label.

- **Font `font-display` (app `block`, web `swap`).** `fonts.dom.css` is generated with `block` and `fonts.web.css` with `swap` on purpose (`packages/ui/scripts/build-fonts.mjs`): the app's faces are inline data URIs with no network wait, so `block` removes the fallback-to-Inter flash a webview would otherwise show, while the web loads files over the network and needs `swap` for text to stay visible. Keep; do not align.
- **Overscroll / bounce (app none, web native).** The app disables rubber-banding on the outer page (`overscroll-behavior: none` in `apps/mobile/dom/reader-spike.css`, `bounces: false` in `SharedUiHost.tsx`) per native-app convention and because the DOM owns its insets via `--safe-*`; the website keeps the browser's default. Keep.
- **Phone orientation (app portrait-only on phones, web rotates).** Phones lock to portrait; tablets rotate. Platform convention for content/fan apps, and it avoids a second test matrix. Decision 2026-10-04 in `docs/decisions.md`. Fullscreen video must still rotate under the lock (if not: unlock-on-fullscreen and relock, never a global unlock).
