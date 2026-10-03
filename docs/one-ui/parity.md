# Visual parity harness (One UI WP1.1c)

Renders the WP0.5b spike routes twice and fails when the two renderings
disagree with each other or with committed Linux baselines. Epic #4788.

- Side a: the Next web build (`next start`, secretless; Supabase degrades to empty).
- Side b: the app's DOM entry (`apps/mobile/index.web.ts`, which mounts
  `ReaderSpike`) exported for a browser, fed from the fixture bundle on disk.
- Routes: `/` (the era stream; shared root `main`) and `/?item=<id>` (the open
  moment; shared root `[role="dialog"]`). The item id is `FIXED_ITEM_ID` in
  `scripts/parity/make-fixture.mjs`.

## How it works

- `package.json` `main` is `index`: Expo resolves `index.ts` for native and
  `index.web.ts` for web. Build b:
  `cd apps/mobile && EXPO_NO_WEB_SETUP=1 npx expo export --platform web --output-dir dist/parity-web --clear`.
  `EXPO_NO_WEB_SETUP=1` skips Expo's "web is not in app.json platforms" check,
  so `app.json` is untouched and the native fingerprint (OTA runtime version)
  does not change.
- Fixture: after `npm run sync:content`, `npx tsx --tsconfig apps/web/tsconfig.json scripts/parity/make-fixture.mjs`
  copies the published content bundle to `apps/mobile/dist/parity-fixture/content`
  (served at `/content` by `scripts/parity/serve.mjs`; no network) and builds the
  ReaderSnapshot both ways. It exits non-zero unless the baked (side a) and
  bundle (side b) snapshots hash equal, then writes `fixture.json` with the hash.
  `compare.spec.ts` asserts side b's runtime snapshot hash and bundle version
  equal that file.
- Serve + test: `npx playwright test -c playwright.parity.config.ts` starts
  `serve.mjs` (b, 4173) and `next start` (a, 4174), both on 127.0.0.1.
- Projects: Pixel 7 (chromium), iPhone 15 (webkit), iPad Pro 11 portrait and
  landscape (webkit); 2 workers locally, one CI job per project.

## Determinism (one handler, `e2e/parity/helpers.ts`, both sides)

Fixed clock (`clock.setFixedTime`, never `install`), reduced motion, animations
disabled, caret hidden, first-visit flags in `localStorage`, `/vault/live`
stubbed empty, Vercel analytics stubbed, every external image answered by one
generated grey PNG, any other external request or any `pageerror` /
`console.error` / HTTP >= 400 fails the test. Fonts: both sides get
`@font-face "ParityFont"` from the DOM entry's own data-URI font plus
`* { font-family: "ParityFont" !important }`, and `document.fonts.ready` before
any capture. Captures wait for React to own the DOM (the web build is
server-rendered; client-only text such as the daily gloss swaps in after
hydration) and for the root's text and height to hold still.
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
   iPhone 15 59/0/34/0, Pixel 7 24/0/48/0, iPad 24/0/20/0).
4. Equivalence hash (above).

`negative.spec.ts` proves each gate: a 4px shift and a colour change fail both
the pixel baseline and the pixel a-vs-b; a missing landmark, changed text and a
4px shift fail the structural a-vs-b; the unmutated pair passes. Self-referential
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
`packages/content/**`, `apps/web/**`, `apps/mobile/dom/**`,
`apps/mobile/parity-entry/**`, `e2e/parity/**` and the harness files. Linux
only. Parity is not a required check: that is a G1 choice to revisit when
screens move.

Baselines depend on real content, so a content change that alters the first
screen of the era stream or the fixed item turns the run red until baselines
are regenerated (below).

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
are logged (`a11y b-only ...`, also a test annotation); they never fail the run
they are not posted to the PR body. Find them in the Playwright report (the
`a11y-b-only` annotation on each `a11y: <route>` test) or the CI job log. Each page
must also have at least one axe rule pass, so a blank page cannot pass.
`a11y-compare.spec.ts` unit-tests the baseline key. `a11y-negative.spec.ts` injects an alt-less
image and a nameless button and asserts both surface as new.

Regenerate (same rule as the screenshots: never on the default branch): the
`update-baselines` dispatch in "Updating baselines" also runs
`A11Y_UPDATE=1 npx playwright test -c playwright.parity.config.ts e2e/parity/a11y.spec.ts`
and commits `e2e/parity/a11y-baseline`. Review the JSON diff: every added entry is
a violation you are accepting.

## Fingerprint

Native fingerprint dcf1ea59 before == after (measured at WP1.1c part 2: with and
without the removed part-1 `index.web.tsx`, all else equal; `npx @expo/fingerprint fingerprint:generate`
in apps/mobile, Windows 11 / Node 24.18).
