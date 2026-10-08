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
        ▼  .github/workflows/mobile-release.yml   (GitHub Actions: the whole train)
        │  refuses to start if EXPO_TOKEN is missing; drives the EAS CLI
        │  (since 2026-10-03, HA #98; no EAS Workflows minutes are used)
  plan:  eas fingerprint:generate + eas build:list --fingerprint-hash, per platform
  builds: eas build --no-wait  ──►  wait: poll eas build:view  ──►  submit iOS (TestFlight)
                                                              └──►  submit Android (Play internal)
                     both fingerprints already built? ──► eas update (one group, both platforms)
                     only one? ────────────────────────► eas update (that platform) + build/submit the changed one
        │
        ▼  .github/workflows/mobile-parity.yml    (every 6h + after each train)
   scripts/mobile/check-parity.mjs → one persistent alert issue on divergence
```

- **Fingerprint decides, not a person.** `runtimeVersion: { policy: "fingerprint" }`
  in `apps/mobile/app.json` means EAS hashes the native layer of the exact
  commit. Same hash as an existing production build → JS-only → one OTA
  update group to both platforms. Different hash → native change → store
  builds.
- **iOS submit needs both builds.** The iOS submit runs only when the iOS
  build FINISHED and Android's build was skipped or succeeded
  (`iosSubmitId` in `scripts/release/train-lib.mjs`). Android is no longer
  blocked by an iOS failure — see "Android is independent of iOS" below.
- **No laptop in the loop.** The fingerprint computed on a Windows checkout
  of this monorepo differs from the one EAS computes on Linux (hoisting
  paths differ), which is exactly why the 2026-09-05 manual builds failed
  in `CONFIGURE_EXPO_UPDATES`. The train computes it on a Linux GitHub
  runner after `npm ci`, the same layout EAS builds from. Verify with a
  `plan_only` run (below) before trusting it after any runner-image or
  lockfile change.
- **Credentials live in EAS**, not in the repo and not on a machine: iOS
  distribution certificate + App Store provisioning profile + App Store
  Connect API key. Set up once via `HUMAN-ACTIONS.md` #48 (was #45).
  **Android is the one exception** — see "The train runs in GitHub Actions"
  below.

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

## The train runs in GitHub Actions, not EAS Workflows (since 2026-10-03)

Decision: `docs/decisions.md` 2026-10-03 (HA #98). The Expo account is on the
Free plan and its EAS Workflows CI/CD minutes (60/month) ran out, so
`.github/workflows/mobile-release.yml` now does the orchestration itself with
the EAS CLI and the existing `EXPO_TOKEN`. `eas build`, `eas submit` and
`eas update` still execute on Expo's servers, under their own allowances
(build credits, submissions, updates), not CI/CD minutes. The retired EAS
workflow is recoverable with `git show 6a59b605:apps/mobile/.eas/workflows/release.yml`.
To go back once minutes return, restore that file plus the previous
`mobile-release.yml` and `scripts/release/read-android-status.sh`
(`git show 6a59b605:<path>`).

Old EAS job to new step:

| Old (EAS workflow) | New (GitHub step, same file unless noted) |
|---|---|
| `fingerprint` (`environment: production`) | Plan: `eas fingerprint:generate --platform <p> --environment production --json` (`scripts/release/train-plan.mjs`) |
| `get_android_build` / `get_ios_build` (`get-build`, production profile) | Plan: `eas build:list --platform <p> --fingerprint-hash <h> --build-profile production --status finished --limit 1 --json` |
| `build_android` / `build_ios` (`if: !build_id \|\| force_store_build`) | "Start store builds": `eas build --platform <p> --profile production --non-interactive --no-wait --json`; condition from `decide()` in `train-lib.mjs` |
| waiting for the builds | "Wait for the store builds": `train-wait.mjs` polls `eas build:view <id> --json` every 60 s, deadline 190 min inside the 195-min step cap |
| `submit_ios` (`needs` both builds) | "Submit iOS build to TestFlight": `eas submit --platform ios --id <id> --profile production`; gate `iosSubmitId()` |
| `publish_update_both` / `_android_only` / `_ios_only` | "Publish OTA update": `eas update --branch production --environment production --platform all\|android\|ios --message ...` (`--environment` is required for SDK 55+) |
| `force_store_build` input | Same input; plan builds both and publishes no OTA |
| `eas workflow:status` job table + `read-android-status.sh` | `train-state.json` (same `jobs[]` shape) fed to the unchanged `select-android-build.mjs`; job table in the run summary |
| Android Play submit | Only for a build this run produced; the `android-play-submitted-<id>` cache marker is removed (reused builds are never resubmitted) |
| concurrency group `mobile-release`, 235-min job cap | Group unchanged (rollback workflow shares it); job cap 310, per-step caps in the workflow header |
| (none) | New `plan_only` input: prints fingerprints and the decision, mutates nothing |

First run after a change like this: dispatch **Mobile release train** with
`plan_only=true` first. On a commit with no native change the plan must show
"reuse" for both platforms (existing build ids listed); "store build" there
means the runner's fingerprint differs from EAS's, so stop and investigate
before running without `plan_only`. Then dispatch normally (or let the next
merge to `main` run it).

How the Android submit works (unchanged in effect):

- The Google Play service-account key is a GitHub Actions repo secret,
  `PLAY_SERVICE_ACCOUNT_JSON`, not an EAS credential, so Android submit has
  always run in GitHub. Preflight steps are capped (14 min), plan 15, build
  start 10, OTA 20, build wait 195 (observed successful waits ran 15-155
  min), iOS submit 30, Android submit 10, job 310: a hung wait turns the job
  red and frees the `mobile-release` concurrency group (it does not cancel
  the builds on EAS; check the Expo dashboard / `eas build:list`).
- `scripts/release/select-android-build.mjs` reads the train state file and
  takes the build id from the `build_android` job only when its status is
  exactly `SUCCESS` and the build is ANDROID / FINISHED / profile
  `production`, its `gitCommitHash` is a string equal to the run's
  `GITHUB_SHA` (absent, empty or mismatched fails closed with a loud
  warning), and its id is a UUID. If the fingerprint already had a build
  (`build_android` SKIPPED) the result is `existing` and nothing is submitted
  (see the submit rule below). If a build id was found, the Action writes `PLAY_SERVICE_ACCOUNT_JSON` to a
  gitignored file (`apps/mobile/credentials/play-service-account.json`,
  `chmod 600`, deleted via `trap ... EXIT`, never echoed) and runs `eas
  submit --platform android --id <build_id> --profile production
  --non-interactive`.
- The selector's result decides the run colour (final step "Fail the train"):

  | Scenario | `result` | Run colour |
  |---|---|---|
  | OTA-only (fingerprint unchanged, `build_android` skipped or absent) | `skipped` | green |
  | `build_android` skipped, existing production build from the plan (not submitted; the producing train did that) | `existing` | green (red if iOS failed) |
  | Existing build lookup returned no id | `skipped` | green |
  | Existing build id/platform/status/profile malformed | `no_build` | red |
  | Store build, iOS and Android both ok | `success` | green |
  | iOS fails, Android ok (Android still submitted) | `success` | red (a stage failed) |
  | Android build fails/cancelled/never started/timed out | `not_success` | red |
  | Android SUCCESS but hash/id/platform/profile check fails | `no_build` | red |
  | State file unreadable / selector crash | `unknown` | red |

- After the wait (even when it failed), the step "Summarise builds and the
  published OTA update" writes each job's final status and build id and,
  when the OTA step succeeded, the OTA update group id(s), platform and
  runtime version published for this exact commit (looked up by
  `gitCommitHash` over the newest 50 groups of `update:list`, then
  `update:view` on matching groups; if the list lacks hashes it views up to
  20 groups) to the run summary, so a device test can pin the update without
  an Expo login. "None published" is claimed only when the scan provably
  reached back past the commit's time (or the list was shorter than 50);
  otherwise it says "not found in the newest N groups (lookup incomplete)".
  The step is read-only and informational (`continue-on-error`, 200 s lookup
  budget): it never changes the job result or blocks a submit.
- `eas.json`'s `submit.production.android.serviceAccountKeyPath` points at
  that same gitignored path so a founder can also run `eas submit
  --platform android` locally after populating the file by hand.
- **Android is independent of iOS (changed 2026-10-02, #4788).** An
  iOS-only failure (e.g. code signing, HA #89) must not strand a good
  Android build. The wait step is `continue-on-error`, the Android steps run
  `if: always()`, and the last step turns the run red whenever any stage
  failed, so the iOS failure stays visible. Cases: iOS ok / Android ok → green, Android
  submitted. iOS fail / Android ok → Android submitted, run red. Android
  fail (any iOS) → submit skipped, red. A platform with an existing build
  and no native change still gets its OTA regardless of the other platform.
- **Missing `EXPO_TOKEN` or `PLAY_SERVICE_ACCOUNT_JSON`:** the train refuses to start without `EXPO_TOKEN`. If a build needs submitting to Play and the Play key is missing, the Android submit step fails and the run ends red (changed in the HA #98 reroute: a green run must not mean iOS-only). The final step also fails the run whenever a produced build was not submitted (Android: this run started an Android build and the submit did not succeed; iOS: this run started an iOS build and the submit was not successful).
- **Submit rule (Fable ruling, HA #98):** a submit is required ONLY for a build this run produced. Reused or OTA-only runs never submit and keep no marker cache. Invariant: an existing finished production build was already submitted by the train that produced it (otherwise that train went red). If such a build never reached a store, the remedy is manual: `eas submit --platform <android|ios> --id <buildId> --profile production` from `apps/mobile`, or dispatch the train with `force_store_build=true`. A Play "already exists" rejection is a plain failure; no output parsing.
- **Free-plan quotas:** the "Show EAS plan usage" step prints `eas
  account:usage` into the log (informational). Build and submission
  allowances on the Free plan are separate from CI/CD minutes and were not
  verifiable from here; if a build is refused for quota, the "Start store
  builds" step fails loudly.

## Manual runs

```sh
cd apps/mobile
gh workflow run mobile-release.yml                                   # same decision logic, on main
gh workflow run mobile-release.yml -f force_store_build=true         # force new store builds on both platforms
gh workflow run mobile-release.yml -f plan_only=true                 # print the plan, change nothing
eas build:list --limit 5                                             # recent store builds
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
| `SPLIT_UPDATE` | the last update group covers one platform | re-run the train (`gh workflow run mobile-release.yml`) from `main`; it publishes one group to both |
| `VERSION_SKEW` | store builds disagree on `version` | a build ran outside the train; run the train with `force_store_build=true` |
| `BUILD_LAG` | one platform's latest build is >48h older and from a different commit, AND that older platform's latest OTA cohort runtime differs from its build's runtime (or it has no cohort) — an unchanged-fingerprint platform kept current by OTA is not lag | check the train run for a failed build/submit step (the Mobile release train run), fix, re-run |
| `MAIN_AHEAD` (exit 3) | production carries neither a publish nor a store build containing the newest mobile-relevant `main` commit, older than 6h | check the Mobile release train run for that commit; re-run the train from `main` |
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

### Kill switch for the shared UI (`sharedUi`), and quarantine (WP2.14)

`sharedUi` is the one flag where the latency matters. The launch decision
reads the **cached** config only (quarantine > cache > compiled
default), so `sharedUi:false` published to `app-config.json` takes effect on a
device's **second launch** after publish (the first launch fetches and caches
it). A device with no cached config follows the compiled default, which is now `true` (JSON and default agree, tested). A device whose cache still holds `false` gets the DOM UI from its second launch after the OTA.

A build whose DOM bundle keeps failing quarantines itself: two fallback cycles
(4 failed attempts) in one `buildKey`, then native until the next OTA or a
Diagnostics "Reset watchdog". Watchdog reports are OFF by default; set `watchdogReports:true` at the top
level of `app-config.json` to turn them on. When on, a fallback or quarantine
sends one `[watchdog]` comment to #4791 per build per day (platform, build key
and category only).
Rolling back an OTA changes the `buildKey`, so it also lifts quarantine.
Drill: docs/one-ui/dom-host.md "G4 drill".

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
  also adding `react-native-web` and `react-dom`. the both-platform OTA step runs
  `eas update --platform all`, so Expo exports every platform the
  config lists; a listed-but-uninstalled web target fails the export with
  "It looks like you're trying to use web support but don't have the required
  dependencies installed" and no OTA update reaches either phone. This broke
  every both-platform update from 2026-09-14 to 2026-09-16 (EAS run
  34986002764) while single-platform updates kept working, because those jobs
  do pass `platform`. `apps/mobile/app-config.test.ts` guards it now.
