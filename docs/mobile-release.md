# Mobile release runbook — iOS and Android move together

Owner: Engineering. Decision: `docs/decisions.md` 2026-09-05 "Mobile release
train". Supersedes the "Store builds vs. EAS Update" and "Automatic EAS
Update on merge" sections of `docs/deploy.md` (which now point here).

## The invariant

**A commit that changes the mobile app reaches iPhone and Android users as
one release, or reaches neither.** Nobody decides per platform, nobody runs
a build from a laptop, and a check that does not depend on the pipeline
proves the two stores are carrying the same thing.

## How a change ships

```
merge to main touching apps/mobile/** or packages/**
        │
        ▼  .github/workflows/mobile-release.yml   (GitHub: trigger only)
        │  refuses to start if EXPO_TOKEN is missing
        ▼
apps/mobile/.eas/workflows/release.yml           (EAS: the actual train)
  fingerprint  ─┬─ get_android_build ─┬─ build_android ─┐
                └─ get_ios_build ─────┴─ build_ios ─────┼─ submit_android
                                                        └─ submit_ios
                     both fingerprints already built? ──► publish_update_both
                     only one? ────────────────────────► publish_update_<other> + build/submit the changed one
        │
        ▼  .github/workflows/mobile-parity.yml    (every 6h + after each train)
   scripts/mobile/check-parity.mjs → one persistent alert issue on divergence
```

- **Fingerprint decides, not a person.** `runtimeVersion: { policy: "fingerprint" }`
  in `apps/mobile/app.json` means EAS hashes the native layer of the exact
  commit. Same hash as an existing production build → JS-only → one OTA
  update group to both platforms. Different hash → native change → store
  builds.
- **No half-submit.** Both submit jobs `need` both build jobs. A failed
  build on either platform blocks both submissions.
- **No laptop in the loop.** The fingerprint computed on a Windows checkout
  of this monorepo differs from the one EAS computes on Linux (hoisting
  paths differ), which is exactly why the 2026-09-05 manual builds failed
  in `CONFIGURE_EXPO_UPDATES`. The train computes everything on EAS.
- **Credentials live in EAS**, not in the repo and not on a machine: iOS
  distribution certificate + App Store provisioning profile + App Store
  Connect API key. Set up once via `HUMAN-ACTIONS.md` #48 (was #45).
  **Android is the one exception** — see "Android submission lives in the
  GitHub Action, not here" below.

## What is a "release" in each store

| Platform | Train submits to | Then a human… |
| --- | --- | --- |
| iOS | App Store Connect → TestFlight (build appears in ~10 min) | selects the build on the version page and submits for review, or lets TestFlight testers use it |
| Android | Google Play **internal testing** track (`eas.json` `submit.production.android.track`) | promotes internal → closed → production in Play Console |

Promotion to the public stores stays a human, per-platform click by
design — App Review and Play review are asynchronous and out of our
control. The invariant is about what we *send*, and the parity check
reports store lag rather than failing on it (`BUILD_LAG` only fires after
48h).

## Android submission lives in the GitHub Action, not here

The Google Play service-account key (2026-09-06) arrived as a GitHub
Actions repo secret, `PLAY_SERVICE_ACCOUNT_JSON`, instead of being uploaded
to EAS credentials via the interactive `eas credentials` flow HA#46 (now
folded into #48) originally asked for. That is fine — arguably better, no
laptop step — but it changes where the Android submit has to run: EAS
Workflows execute on EAS's own infrastructure, which has no access to this
repo's GitHub Actions secrets, so `apps/mobile/.eas/workflows/release.yml`
cannot contain a `submit_android` job that will ever see the key.

Instead:

- The EAS workflow (`release.yml`) does everything platform-symmetric —
  fingerprinting, `build_android`, `build_ios`, `submit_ios`, and all three
  OTA-update jobs. It has no Android submit job.
- `.github/workflows/mobile-release.yml` runs that EAS workflow with
  `eas workflow:run --no-wait`, writes the EAS run URL to the job summary
  at once, then waits by id (`eas workflow:status <id> --wait`), so the
  Action doesn't return until EAS is done. Preflight steps are capped (20
  min total), the wait at 195 minutes (observed successful waits run 15-155
  min) and Android locate/submit at 10 and the job at 235: a hung
  EAS run turns the job red and frees the `mobile-release` concurrency
  group (it does not cancel the EAS-side run — check it in the Expo
  dashboard / `eas workflow:runs`).
  It then calls `eas build:list --platform android --status
  finished --git-commit-hash <sha>` to ask "did this commit's run produce
  a fresh Android store build?" — if the fingerprint already had a build
  (OTA-only case) there's nothing to submit and the step no-ops cleanly.
  If a build exists for this commit, the Action writes
  `PLAY_SERVICE_ACCOUNT_JSON` to a gitignored file at job time
  (`apps/mobile/credentials/play-service-account.json`, `chmod 600`,
  deleted via `trap ... EXIT` immediately after use, never echoed to logs)
  and runs `eas submit --platform android --id <build_id> --profile
  production --non-interactive` itself, in the one place that has the
  secret.
- After the wait (even when it failed), the step "Summarise EAS jobs and the
  published OTA update" writes each EAS job's final status and, on success,
  the OTA update group id(s), platform and runtime version published for
  this exact commit (looked up by `gitCommitHash` via `update:list` +
  `update:view`; the fingerprint runtime policy yields one group per
  platform) to the run summary, so a device test can pin the update without
  an Expo login. "None published" means the store-build path. The step is
  read-only and only fails the job if a job shows failed while the run said
  SUCCESS.
- `eas.json`'s `submit.production.android.serviceAccountKeyPath` points at
  that same gitignored path so a founder can also run `eas submit
  --platform android` locally after populating the file by hand (or once
  the key is uploaded to EAS credentials directly, at which point this
  local path becomes unnecessary and could be removed).
- **No half-submit is preserved differently than iOS's.** `submit_ios`
  inside the EAS workflow still `needs` both builds. The Android submit
  step in the Action only runs `if: steps.eas_workflow.outcome ==
  'success'` — so a failed iOS (or Android) build inside the EAS workflow
  fails the whole `workflow:run --wait` call, and the Action's Android
  submit step is skipped. A failed build on either platform still blocks
  both submissions; the mechanism is now "the whole upstream workflow run
  must succeed" rather than a shared `needs:` array, because Android's
  submit job doesn't live in that graph anymore.
- **Missing `EXPO_TOKEN` or `PLAY_SERVICE_ACCOUNT_JSON`:** the Android
  submit step warns (`::warning::`) and exits 0 rather than failing the
  train — HA#48 tracks `EXPO_TOKEN` as still-open founder work, and the
  train as a whole already refuses to start without `EXPO_TOKEN` in the
  `trigger` job's first step, so this path only fires if `EXPO_TOKEN`
  exists but the *Play* key somehow doesn't (defense in depth, not the
  expected case day-to-day).

## Manual runs

```sh
cd apps/mobile
eas workflow:run .eas/workflows/release.yml                  # same decision logic, from your checkout
eas workflow:run .eas/workflows/release.yml -F force_store_build=true   # force new store builds on both platforms
eas workflow:runs                                              # list runs; eas workflow:logs <run-id>
node ../../scripts/mobile/check-parity.mjs                     # the same check CI runs
```

Or Actions → **Mobile release train** → Run workflow. Never run
`eas build`/`eas update` for production by hand except in the recovery
cases below; if you must, do both platforms in the same sitting and run the
parity script before you stop.

## Adding an era/enum/catalogue

Policy: `docs/decisions.md` 2026-10-01. Mobile loads content through
`apps/mobile/lib/content-bundle.ts`, which drops unknown enum values, skips
manifest entries it has no schema for, serves last-good on a data error, and
self-heals via an OTA update (check, fetch, reload, once per launch). It
reloads only when the fetched update is genuinely new, so it can't loop. Cost:
while the published bundle has something the running JS can't read, each
launch re-downloads the bundle and does one update check.

- Installed runtimes that include this change degrade gracefully: a new era or
  enum value is pruned and a new catalogue is skipped until the app updates.
- Runtimes older than this change still hard-fail on an unknown value. For
  them, ship the app/schema change (OTA) first and publish the content only
  after it has reached production.
- `packages/experience/src/era-ids-sync.test.ts` enforces `ERAS` ↔
  `eraIdSchema`: a new era needs both edits.
- Never remove an enum value that live content still uses.

## Version numbers

- `apps/mobile/app.json` `version` is the marketing version, shared by both
  platforms. Bump it in a PR; the train picks it up.
- Build numbers (`buildNumber` / `versionCode`) are remote and
  auto-increment per platform on EAS (`appVersionSource: remote`). Never
  hand-edit them.

## OTA size budget

CI (`node scripts/parity/size-check.mjs`, right after the two `expo export` steps) totals the uncompressed bytes of every file in each platform's export dir (`apps/mobile/dist-ios`, `dist-android`: Hermes bundle, assets, any DOM `www.bundle`; `metadata.json` excluded) and fails the PR if either platform grows more than 15% over `e2e/parity/size-baseline.json`. It is a proxy for update download growth, not the exact payload: the JS bundle is re-downloaded in full on every update, assets only when their hash changes. It runs in both build-full and build-content (seed changes regenerate code in the bundle).

To accept an intentional jump: run both exports with `--output-dir dist-ios` / `dist-android` in `apps/mobile`, then `node scripts/parity/size-check.mjs --update` and commit the baseline in the same PR.

## When the parity check fails

Three alert issues exist, because they mean different things:

- **"Mobile parity: iOS and Android have diverged"** — the check ran and
  found a real difference (exit 1). Engineering fixes it with the table
  below.
- **"Mobile parity: check could not run"** — the check itself failed (exit
  2), so nothing is currently verifying parity. Not evidence of a
  divergence. Usual cause: `EXPO_TOKEN` missing/expired → HUMAN-ACTIONS #44.
- **"Mobile release: production is behind main"** — iOS and Android agree
  with each other, but production lags `main` (exit 3, `MAIN_AHEAD`). The
  check takes the newest `main` commit touching `apps/mobile`, `packages` or
  `package-lock.json` (markdown excluded) and asks, per platform, whether the
  latest publish or the latest finished store build contains it (`git
  merge-base --is-ancestor`). A platform containing it via neither, with the
  commit older than `--main-ahead-hours` (default 6), raises the alert. Flags:
  `--main-ahead-hours <n>`, `--main-ref <ref>` (default `origin/main`). The
  workflow checks out with `fetch-depth: 0` for the ancestry queries. Any
  other finding wins: exit 1 beats exit 3. Exit 0 closes all three alerts.

Each carries the script output. By code:

| Code | Meaning | Fix |
| --- | --- | --- |
| `STRANDED_OTA` | the latest update's runtimeVersion ≠ that platform's latest build | run the train with `force_store_build=true` so both platforms get a build matching current `main`; the next OTA then lands on both |
| `SPLIT_UPDATE` | the last update group covers one platform | re-run the train (`eas workflow:run …`) from `main`; it publishes one group to both |
| `VERSION_SKEW` | store builds disagree on `version` | a build ran outside the train; run the train with `force_store_build=true` |
| `BUILD_LAG` | one platform's latest build is >48h older and from a different commit | check the train run for a failed build/submit job (`eas workflow:runs`), fix, re-run |
| `MAIN_AHEAD` (exit 3) | production carries neither a publish nor a store build containing the newest mobile-relevant `main` commit, older than 6h | check the train run for that commit (`eas workflow:runs`); re-run the train from `main` |
| exit 2 | check could not run | usually `EXPO_TOKEN` missing or expired → HUMAN-ACTIONS #48 |

Rolling back a store build is a new build from the reverted commit — through
the train. Rolling back JS: see the next section.

## Rolling back an OTA

**When:** a JS-only (OTA) release broke the app and you want the previous
JS on users' phones without waiting for a new train. This is the only
sanctioned rollback path — do not run `eas update:republish` by hand.

1. Actions → **Mobile OTA rollback** → Run workflow with `mode=list`. The log
   prints recent update groups on the `production` branch. One publish is
   **two groups** (one iOS, one Android); pick the last good group for each.
2. Run the workflow again with `mode=republish`, `ios_group` and
   `android_group` both set (optionally `message`). Roll back **both**
   platforms or parity breaks; the job warns if only one is given and
   rejects ids that aren't 36-char UUIDs.
3. What it does: `eas update:republish` re-points `production` at the older
   group as a **new** update. Installs pick it up on their next launch (the
   usual two-launch OTA delay).

The workflow shares the `mobile-release` concurrency group with the train, so
it queues behind a running release instead of racing it.

**Limit:** a fingerprint (native) change cannot be rolled back by OTA — those
users are on a new store build with a different `runtimeVersion`. Revert the
commit and ship a new build through the train.

## Kill switch: turning off a native screen

**When:** a native screen is broken in production and you want it off without
an app release (no store build, no OTA).

1. Edit `config/mobile/app-config.json` in a PR and set that screen's flag to
   `false` under `routeFlags` (keys are the `RouteFlags` names in
   `apps/mobile/lib/routes.ts`, e.g. `trackGuide`, `eraStream`). Leave the
   other keys alone; a missing key means "use the app's compiled default".
2. Merge to `main`. Vercel's web build (`scripts/publish-content-bundle.mjs`)
   publishes it at `https://www.longlivets.com/content/app-config.json`, the
   host the app reads content from. An invalid config fails the publish. (The
   Supabase Storage mirror deliberately does not carry it — apps never read
   content from Storage.)
3. Installed apps fetch the file at launch (3s timeout, last-good cached, so
   offline launches keep the previous setting) and apply it on that launch.
   Until it arrives the app routes on its compiled defaults, so a
   notification tapped during the first seconds of a cold start can still
   open the switched-off screen.

**Effect:** links to that screen (notifications, deep links, in-app) land on
the era tab instead. To turn it back on, set the flag to `true` and merge.

The file is a sibling of `current.json`, never inside a `<bundleVersion>/`
directory and never a manifest entry: installed apps hard-fail on unknown
manifest entries. Unknown keys in it are ignored by older apps, so a newer
config is safe to publish.

## Forcing an update (dormant)

The app carries an update-required gate that is **inert**: `minNativeBuild` is
absent from `config/mobile/app-config.json`, so nothing is ever blocked. When
set, an app whose native build number is below the platform's minimum shows a
full-screen "please update" message with a store button instead of the app. An
unknown build number or a missing key never blocks.

**Rule: setting `minNativeBuild` for either platform requires its own
`docs/decisions.md` entry, and both store builds at or above that number must
already be live in the App Store and Play Store.** Otherwise users are locked
out of an app with nothing to update to.

To set it: add `"minNativeBuild": { "ios": <n>, "android": <n> }` to
`config/mobile/app-config.json` in a PR (either key may be omitted), merge, and
the web build publishes it like the kill switch above. Apps apply it on the next
launch. To lift it, remove the key and merge.

## Things that would silently break the invariant (don't)

- Running `eas build` from a machine with a fingerprint that differs from
  EAS's (see above) — it fails today; if it ever "works" it produces a build
  no OTA update will match.
- Publishing an update with `--platform ios` or `--platform android` by hand.
- Setting a static `runtimeVersion` string in `app.json`.
- Adding a native dependency or config plugin in a PR without expecting a
  store build: the train will build both platforms, which is correct, but
  users only get the change after store review — say so in the PR body.
- Adding `"web"` to `app.json`'s `platforms` (or removing the array) without
  also adding `react-native-web` and `react-dom`. `publish_update_both` runs
  `eas update` with no `platform` param, so Expo exports every platform the
  config lists; a listed-but-uninstalled web target fails the export with
  "It looks like you're trying to use web support but don't have the required
  dependencies installed" and no OTA update reaches either phone. This broke
  every both-platform update from 2026-09-14 to 2026-09-16 (EAS run
  34986002764) while single-platform updates kept working, because those jobs
  do pass `platform`. `apps/mobile/app-config.test.ts` guards it now.
