# Mobile shipping checklist — Android (Google Play)

Everything between "code in the repo" and "app on the Play Store", in order.
Legend: **[DONE]** in the repo / verified headlessly · **[HUMAN]** needs a
person (login, money, or a physical device) · **[TODO]** engineering work that
isn't blocking an internal APK but IS blocking a store release.

## 0. What already works (state of the repo)

- **[DONE]** Expo **SDK 57** app (`apps/mobile`, React Native 0.86 / React 19)
  bundles for Android with zero errors (`npx expo export --platform android`,
  Hermes bytecode and all), reusing `@swift2/shared` + `@swift2/core` unchanged.
- **[DONE]** Targets **Android API 36** (compileSdk/targetSdk 36 pinned via
  `expo-build-properties`) — above Play's API-35 floor, so this is
  store-submittable, not just internal.
- **[DONE]** `eas.json` with three profiles: `development` (dev client APK),
  `preview` (internal-distribution APK — the "hand it to Joey" build),
  `production` (AAB for Play, remote version source, auto-increment).
- **[DONE]** `app.json`: Android package `com.jwincorporated.swift2`,
  placeholder icon / adaptive icon / splash (regenerate any time with
  `node apps/mobile/scripts/make-placeholder-assets.mjs`).
- **[DONE]** Secrets discipline: only `EXPO_PUBLIC_*` public values (Supabase
  URL + anon key), read from env, never committed (`.env` is gitignored,
  `.env.example` documents them).

## 1. One-time EAS setup — [HUMAN], ~10 minutes

1. `eas login` — interactive; use the company Expo account (create one at
   expo.dev if none exists — that's an account signup, so it's a founder call
   per CLAUDE.md decision authority).
2. From `apps/mobile/`: `eas init` — links the app to an EAS project and writes
   `extra.eas.projectId` into `app.json`. Commit that change.
3. Set the public env vars per environment (values from the Supabase dashboard,
   Project Settings → API — the same ones `apps/web` uses as `NEXT_PUBLIC_*`):

   ```sh
   eas env:create --scope project --environment preview --visibility plaintext \
     --name EXPO_PUBLIC_SUPABASE_URL --value https://<project-ref>.supabase.co
   eas env:create --scope project --environment preview --visibility plaintext \
     --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key>
   ```

   Repeat with `--environment production` (and `development` if using dev
   builds). Each `eas.json` profile already declares which environment it pulls
   (`"environment": "preview"` etc.). The anon key is public by design
   (enforced by RLS) — plaintext visibility is fine; nothing else may ever go
   in an `EXPO_PUBLIC_*` var.

## 2. Internal APK — the one command

```sh
cd apps/mobile
eas build -p android --profile preview
```

- Runs in EAS's cloud (no local Android SDK needed). First run asks to generate
  an **Android keystore — answer yes and let EAS manage it** (it's stored in
  EAS servers, shared by the whole team, and used for Play signing later; never
  download/commit it).
- Output: an installable `.apk` link + QR code (~10–20 min). Anyone can
  sideload it: open the link on the phone, download, allow
  "install unknown apps". This is the fastest way to get the Vault in Joey's
  hands — no Play Console involved.
- **[HUMAN]** First-boot verification on a real device (the repo's bundle is
  verified headlessly, but gesture feel / 60fps / Supabase reachability need
  eyes): app boots → splash → era hero renders themed → timeline scrubs and
  snaps → month rows show real Tier 0 data.

## 3. Before the Play Store — engineering [TODO]s

- **Android API level — [DONE], exceeds the requirement.** The app is on
  **Expo SDK 57** (React Native 0.86, React 19), whose Android default is
  **compileSdk / targetSdk 36** (Android 16) — pinned explicitly via the
  `expo-build-properties` plugin in `app.json` (`minSdk 24`). Google Play's
  floor is API 35; we target 36, the latest. The New Architecture is on by
  default (required by Reanimated 4). Bundle re-verified after the upgrade:
  `npx expo export --platform android` succeeds and emits Hermes bytecode
  directly (the SDK-51 `--no-bytecode` workaround is gone). Nothing about the
  API level blocks a store build now.
- **Device QA pass** on a mid-tier Android: 60fps scrub (dev build + perf
  monitor), slow-network behavior, error state when Supabase is unreachable.
- **Real branding**: replace the three placeholder PNGs in `apps/mobile/assets`
  (icon 1024², adaptive-icon foreground 1024² with the mark inside the central
  ~61% safe zone, splash). Original artwork only — no album art / copyrighted
  imagery (legal posture in `docs/architecture.md`).
- **Store listing assets**: 512×512 hi-res icon, 1024×500 feature graphic, ≥2
  phone screenshots (take them from the preview APK), short (≤80 chars) + full
  (≤4000 chars) descriptions. App name on Play ("Swift2 Vault" — final name is
  Joey's call; must not imply endorsement by Taylor Swift).
- **Privacy policy URL** (required even for a read-only app) — a page on the
  web app is fine. Data-safety honesty: we collect nothing today (anonymous
  reads, no analytics).

## 4. Play Console — [HUMAN]

1. Create a **Google Play Console developer account** ($25 one-time, needs a
   Google account + identity verification — founder task; spending money is
   explicitly a human call).
2. Create the app (`com.jwincorporated.swift2`) → complete the content
   questionnaire (content rating, target audience, data safety = no data
   collected, ads = none).
3. First upload must be **manual**: build with
   `eas build -p android --profile production` (produces an `.aab`), download,
   upload to **Internal testing** track in the Console. Accept Google Play App
   Signing (EAS's keystore becomes the upload key).
4. Later uploads can be one command: `eas submit -p android --latest`
   (needs a Google Service Account JSON wired to EAS — follow the prompt;
   `submit.production.android.track` is already set to `internal` in
   `eas.json`).
5. Promote Internal testing → Closed → Production as confidence grows. First
   production release goes through Google review (days, not hours).

## 5. Release cadence (once shipping)

- Bump `version` in `app.json` (marketing version); `versionCode` is remote +
  auto-incremented by EAS (`appVersionSource: "remote"`), so never hand-edit it.
- `eas build -p android --profile production` → `eas submit -p android --latest`.
- OTA updates for JS-only changes (EAS Update) are a possible later addition —
  not configured yet; new native deps always require a store build regardless.

## iOS (out of scope here, for the record)

Same codebase already targets iOS (`bundleIdentifier` is set). Shipping needs
an Apple Developer account ($99/yr — founder call), `eas build -p ios`, and
TestFlight; the Android checklist above is otherwise the template.
