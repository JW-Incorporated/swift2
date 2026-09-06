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
  Connect API key; Android upload keystore (already there) + Google Play
  service-account key. Set up once via `HUMAN-ACTIONS.md` #45 and #46.

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
| exit 2 | check could not run | usually `EXPO_TOKEN` missing or expired → HUMAN-ACTIONS #44 |

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
