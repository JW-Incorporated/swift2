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
  `eas workflow:run --wait`, so the Action doesn't return until EAS is
  done. It then calls `eas build:list --platform android --status
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

## Version numbers

- `apps/mobile/app.json` `version` is the marketing version, shared by both
  platforms. Bump it in a PR; the train picks it up.
- Build numbers (`buildNumber` / `versionCode`) are remote and
  auto-increment per platform on EAS (`appVersionSource: remote`). Never
  hand-edit them.

## When the parity check fails

The alert issue is titled **"Mobile parity: iOS and Android have diverged"**
and carries the script output. By code:

| Code | Meaning | Fix |
| --- | --- | --- |
| `STRANDED_OTA` | the latest update's runtimeVersion ≠ that platform's latest build | run the train with `force_store_build=true` so both platforms get a build matching current `main`; the next OTA then lands on both |
| `SPLIT_UPDATE` | the last update group covers one platform | re-run the train (`eas workflow:run …`) from `main`; it publishes one group to both |
| `VERSION_SKEW` | store builds disagree on `version` | a build ran outside the train; run the train with `force_store_build=true` |
| `BUILD_LAG` | one platform's latest build is >48h older and from a different commit | check the train run for a failed build/submit job (`eas workflow:runs`), fix, re-run |
| exit 2 | check could not run | usually `EXPO_TOKEN` missing or expired → HUMAN-ACTIONS #48 |

Rolling back JS on both platforms: `eas update:republish --branch production
--group <previous-group-id>` (one command, both platforms). Rolling back a
store build is a new build from the reverted commit — through the train.

## Things that would silently break the invariant (don't)

- Running `eas build` from a machine with a fingerprint that differs from
  EAS's (see above) — it fails today; if it ever "works" it produces a build
  no OTA update will match.
- Publishing an update with `--platform ios` or `--platform android` by hand.
- Setting a static `runtimeVersion` string in `app.json`.
- Adding a native dependency or config plugin in a PR without expecting a
  store build: the train will build both platforms, which is correct, but
  users only get the change after store review — say so in the PR body.
