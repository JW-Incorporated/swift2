# Visual parity harness (One UI WP1.1c, part 1)

Renders the app's DOM UI in a browser at four device viewports and fails on
visual regressions against committed Linux baselines. Part 1 is harness proof
on the WP0.4 test page (`apps/mobile/dom/SharedUiTest.tsx`); real routes and
the web-vs-app comparison come in part 2. Epic #4788.

## How it works

- `apps/mobile/index.web.tsx` is the web-only entry (Expo resolves
  `index.web.tsx` for web, `index.ts` for native; `package.json` `main` is
  `index`). It mounts the test page with a stub `onReady` (sets
  `window.__ready`) and `reportError` (`console.error`). `?inset=t,r,b,l` sets
  `--safe-top/right/bottom/left`; `?mutate=shift|colour|blur` is the negative-spec
  hook and exists only in this file.
- Build: `cd apps/mobile && EXPO_NO_WEB_SETUP=1 npx expo export --platform web --output-dir dist/parity-web --clear`.
  `EXPO_NO_WEB_SETUP=1` skips Expo's "web is not in app.json platforms" check,
  so `app.json` is untouched and the native fingerprint (OTA runtime version)
  does not change.
- Serve + test: `npx playwright test -c playwright.parity.config.ts` (starts
  `scripts/parity/serve.mjs` on 127.0.0.1:4173).
- Projects: Pixel 7 (chromium), iPhone 15 (webkit), iPad Pro 11 portrait and
  landscape (webkit); 2 workers.

## Guarantees

- Blank pages cannot pass: every capture waits for `window.__ready`, the
  bundled font, and Row 50 in the list (dialog shot also waits for
  `data-state=open`). `pageerror`, `console.error`, and any non-localhost
  request fail the test (non-local requests are aborted too).
- Tolerance: `maxDiffPixels: 200`, `threshold: 0.2`, animations disabled,
  caret hidden, fixed clock.
- `e2e/parity/negative.spec.ts` proves the tolerance: a 4px shift of one
  button and a one-colour change must fail; a 0.3px blur must pass. It is
  self-referential, so it runs on any OS.
- Baselines (`baseline.spec.ts`) are Linux-only (`test.skip` elsewhere) and live
  in `e2e/parity/__screenshots__/<project>/`. `updateSnapshots` is `none`
  unless `PARITY_UPDATE=1`, so a missing baseline is a red run.
- The workflow runs in `mcr.microsoft.com/playwright:v1.63.0-noble`; keep the
  tag equal to the installed `@playwright/test` version.

## Updating baselines

1. Open the PR (the parity run is red until baselines exist; that is expected).
2. Dispatch on the PR branch: `gh workflow run parity.yml --ref <branch> -f update-baselines=true`.
   The job regenerates PNGs and commits them to that branch. (On `main` it
   opens a PR with before/after artifacts instead; it never pushes to `main`.)
3. Re-run the parity workflow (`gh workflow run parity.yml --ref <branch>`) -
   commits made with `GITHUB_TOKEN` do not trigger `pull_request` runs.

Parity is not a required check.
