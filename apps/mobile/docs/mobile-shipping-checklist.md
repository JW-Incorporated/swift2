# Mobile release runbook — Android (Play) + iOS (App Store)

The distance between "code in the repo" and "app in both stores", in order.
Section A is finished and verified in the repo. Section B is Wyatt's ordered
punch list — every item there needs a human because it costs **money**, needs
an **account/login**, a **Mac**, or a **physical device** (each item says
which). Nothing in B is engineering work; the code and config are ready.

Companion docs (all paste-ready):

- `store-listing.md` — listing copy for both stores
- `privacy-and-data-safety.md` — Play Data-safety + Apple nutrition-label
  answers, content-rating guidance
- Privacy policy page: `apps/web/app/privacy/page.tsx` → goes live at
  `https://<web-domain>/privacy` on the next web deploy

---

## A. DONE — in the repo, verified 2026-07-08

- **Unified version `1.0.0`** in `app.json`; build numbers are **remote**
  (`appVersionSource: "remote"` + `autoIncrement` in `eas.json`): EAS manages
  and auto-bumps Android `versionCode` and iOS `buildNumber` per production
  build — never hand-edit them. The local `ios.buildNumber: "1"` is only the
  initial seed.
- **iOS app config**: `bundleIdentifier com.jwincorporated.swift2` (matches
  the Android package), `supportsTablet: true`,
  `usesNonExemptEncryption: false` (HTTPS only — skips the export-compliance
  question on every TestFlight upload). **No permission usage strings** — the
  app calls no permission-gated APIs (verified: introspected Info.plist has
  zero `NS*UsageDescription` keys). Don't add any it doesn't use.
- **Android config** (pre-existing, re-verified): package
  `com.jwincorporated.swift2`, compile/targetSdk 36 (above Play's API-35
  floor), minSdk 24.
- **`eas.json` profiles for both platforms**:
  - `development` — dev client; Android APK, iOS **simulator** build
  - `preview` — internal distribution for testers (Android sideload-able APK;
    iOS ad-hoc — needs registered device UDIDs, see B7)
  - `simulator` — iOS Simulator build of the preview app (no Apple account
    needed to install; for the Mac)
  - `production` — Android **AAB** for Play, iOS **store** build for
    App Store Connect; remote auto-incremented build numbers
  - `submit.production` — Android track `internal`; iOS present (credentials
    supplied interactively on first `eas submit`)
- **Validation, all clean on this branch**: `npx expo-doctor` 20/20;
  `npx expo config --type public` and `--type introspect` resolve with zero
  warnings; headless bundle export succeeds for **both** platforms
  (`npx expo export --platform android|ios` → ~3.3 MB Hermes bytecode each);
  repo gates green (`npm run typecheck`, `npm run lint`, `npm test`,
  `npm run build`). Known Windows limitation: `expo prebuild --platform ios`
  refuses to run on Windows — the config-plugin introspection above exercises
  the same plugin pipeline; a real prebuild spot-check on the Mac is optional
  (EAS runs prebuild itself in the cloud).
- **Privacy policy** written and routed: `apps/web/app/privacy/page.tsx`
  (static, dark-theme, truthful "collects nothing"). Store questionnaire
  answers pre-filled in `privacy-and-data-safety.md`.
- **Store listing copy** for both stores in `store-listing.md`, UNOFFICIAL
  disclaimer prominent per the 2026-07-08 media-policy decision.
- **Assets are valid but placeholder**: `assets/icon.png` (1024²),
  `adaptive-icon.png` (1024², safe-zone correct), `splash.png` — the
  deterministic lavender "vault dial" from `scripts/make-placeholder-assets.mjs`.
  Builds are NOT blocked; launch branding is (see B5).
- **Secrets discipline** unchanged: only `EXPO_PUBLIC_*` public values; EAS
  env vars per profile already documented in `.env.example`.

### The exact commands (documented, NOT run — cloud builds cost quota)

```sh
cd apps/mobile
# store builds
eas build -p android --profile production   # → .aab for Play
eas build -p ios --profile production       # → .ipa for App Store (needs Apple acct)
# store submissions
eas submit -p android --latest              # → Play internal track
eas submit -p ios --latest                  # → App Store Connect / TestFlight
# tester builds
eas build -p android --profile preview      # sideload APK (no store needed)
eas build -p ios --profile simulator        # iOS Simulator app (Mac, no Apple acct)
```

---

## B. NEEDS WYATT — ordered, fastest critical path first

Tags: [$] money · [ACCT] account/login · [MAC] the Mac · [DEV] physical device.

### Critical path — Android first (cheapest, no Mac, APK pipeline already proven)

1. **[ACCT]** `eas login` (existing Expo account `wjduvall` — project
   `swift2-vault` is already linked) and confirm the EAS env vars exist for
   `production`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   (`eas env:list --environment production`; create with `eas env:create` per
   `.env.example` if missing). ~5 min.
2. **[DEV]** Device QA pass on a real Android phone with a preview APK
   (`eas build -p android --profile preview`): boots → splash → era hero
   themed → timeline scrubs/snaps at 60fps → month rows show real data →
   airplane-mode shows the error state. This is the go/no-go for everything
   below.
3. **[$ 25 one-time][ACCT]** Google Play Console developer account
   (play.google.com/console; identity verification takes ~1–2 days) → create
   app `com.jwincorporated.swift2`.
4. **[ACCT]** Deploy the web app (normal Vercel deploy once this branch is
   merged) so `https://<domain>/privacy` is live; paste that URL into both
   store records. Zero-cost, unblocks both stores' questionnaires.
5. **Branding decision (with Joey/design):** final 1024² icon, adaptive-icon
   foreground, splash, Play feature graphic (1024×500). Original artwork only —
   no album art (media policy). Drop the PNGs into `apps/mobile/assets/`,
   commit, done — config already points at them. *(Placeholders won't block a
   Play internal-testing upload; they WILL look bad in review/production.)*
6. **[ACCT][DEV]** Play listing + first upload: paste copy from
   `store-listing.md`, take ≥2 phone screenshots from the preview APK,
   complete the questionnaires with the answers in
   `privacy-and-data-safety.md` (Data safety = collects nothing; IARC content
   rating; target audience 13+; no ads). Then
   `eas build -p android --profile production`, download the `.aab`, upload
   manually to **Internal testing** (first upload must be manual; accept Play
   App Signing — EAS's keystore becomes the upload key). Later releases:
   `eas submit -p android --latest` (wire the Google service-account JSON when
   prompted). Promote Internal → Closed → Production; first production review
   takes days.

### iOS leg (needs the Mac + Apple money; can start in parallel after step 2)

7. **[MAC]** Free smoke test before spending anything: on the Mac,
   `npm ci`, `cd apps/mobile`, `cp .env.example .env` (fill values), then
   `npx expo run:ios` (local Simulator build, no Apple account) — or
   `eas build -p ios --profile simulator` and drag the app into the
   Simulator. Verifies the iOS app actually runs; the repo has only proven
   the bundle compiles. Optional: `npx expo prebuild --platform ios
   --no-install` in a scratch clone to watch the native project generate
   (never commit `ios/`).
8. **[$ 99/yr][ACCT]** Apple Developer Program enrollment
   (developer.apple.com; needs an Apple ID with 2FA on the Mac/iPhone;
   approval can take ~24–48h).
9. **[ACCT]** App Store Connect app record: register bundle ID
   `com.jwincorporated.swift2`, app name per `store-listing.md`. Easiest via
   EAS: the first `eas build -p ios --profile production` offers to create
   certs/provisioning and can create the ASC app — say yes and let EAS manage
   credentials (never download/commit them).
10. **[MAC][ACCT]** Screenshots: run the app in the iOS Simulator (6.9" and
    6.5" iPhone sizes; iPad 13" set too since `supportsTablet` is true — or
    flip `supportsTablet` to `false` first and skip iPad). Cmd+S in Simulator
    saves PNGs at the exact required resolution.
11. **[ACCT]** TestFlight: `eas submit -p ios --latest` (prompts for an App
    Store Connect API key — recommended; EAS stores it). Build appears in
    TestFlight; internal testers (your own Apple ID) install immediately, no
    review.
12. **[ACCT]** App Store listing + review: paste from `store-listing.md`,
    privacy nutrition label = "Data Not Collected" (exact answers in
    `privacy-and-data-safety.md`), age rating 4+, attach screenshots, select
    the TestFlight build → **Submit for review**. First review typically 1–3
    days; the fan-app risk is metadata (guideline 2.3.7) — the UNOFFICIAL
    disclaimer in the listing is the mitigation.

### After both are live

- Release cadence: bump `version` in `app.json` (marketing version only —
  build numbers auto-increment remotely), then
  `eas build -p <platform> --profile production` and
  `eas submit -p <platform> --latest`.
- OTA (EAS Update) for JS-only fixes is a possible later addition — not
  configured; native-dependency changes always need store builds.
- If analytics/crash reporting/accounts ever land: update the `/privacy`
  page + both stores' data-safety forms in the same release (see
  `privacy-and-data-safety.md`).
