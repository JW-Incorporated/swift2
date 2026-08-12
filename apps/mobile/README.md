# @swift2/mobile — Expo app (Android-first)

The iOS/Android reader. Reuses `@swift2/shared` (domain/types) and
`@swift2/core` (Supabase data access) **unchanged** — the whole point of the
`packages/*` boundary (see `docs/architecture.md`). Only the view layer and the
gesture/animation runtime are mobile-specific.

## Status: bundles clean on SDK 57, EAS-ready, NOT yet device-verified

Stack: **Expo SDK 57 · React Native 0.86 · React 19 · Reanimated 4** (New
Architecture on). Targets **Android API 36** (compileSdk/targetSdk 36 via
`expo-build-properties`), above Play's API-35 floor — store-submittable, not
just internal.

What's here (typechecked, and the Android bundle exports headlessly with Hermes
bytecode — `npx expo export --platform android` → ~3.3 MB `.hbc`, no errors):

- **Data layer** (`lib/vault.ts`): the SAME `createVaultClient` from
  `@swift2/core` the web app uses, fed by `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (copy `.env.example` → `.env` for local dev).
- **Vault navigator** (`components/VaultNavigator.tsx`): the native counterpart
  of `apps/web/components/VaultReader.tsx` — one era-skinned surface at a time
  (hero, month rows, milestones + month items), all domain logic from
  `@swift2/shared`.
- **Era timeline scrubber** (`components/EraTimeline.tsx`): first pass of the
  morph-on-grab navigator on the architecture's required foundation — Gesture
  Handler + Reanimated, gesture and thumb animation entirely on the UI thread
  (shared values in worklets, zero JS/React state per frame). JS is touched
  once per gesture, on release, to snap + commit the era using the same
  `@swift2/shared` snap math as the web scrubber. Milestones render as passive
  tick marks. Snaps to era boundaries only (v1 spec).
- **EAS config**: `eas.json` (development / preview internal APK / production
  AAB) + `app.json` (package `com.jwincorporated.swift2`, placeholder
  icon/splash from `scripts/make-placeholder-assets.mjs`).

## Monorepo gotchas this app codifies (don't undo these)

This repo runs **two React majors on purpose** — web (Next.js) on React 18.3.1,
mobile (Expo SDK 57) on React 19 — and npm workspace hoisting spreads the copies
around. Three committed fixes keep the mobile bundle correct:

1. **`metro.config.js` pins `react` and `react-native` by name** to the copies
   under `apps/mobile/node_modules`. npm hoists React 18.3.1 to the repo root
   (for web) and nests React 19 under the app; without the pin the mobile bundle
   could grab the root's React 18 and crash hooks against a React-19 renderer
   (two React copies in one bundle). RN 0.86 lives only under the app today but
   is pinned defensively against future hoisting.
2. **`babel.config.js` points the worklets plugin at
   `react-native-worklets/plugin` explicitly** (Reanimated 4 moved the transform
   there; `react-native-reanimated/plugin` now just re-exports it).
   babel-preset-expo's auto-detection resolves from the root-hoisted preset and
   can't see `apps/mobile/node_modules`, so worklets would silently not compile.
3. **`babel-preset-expo` is a direct devDependency of this app.** Under SDK 57
   npm nests it at `apps/mobile/node_modules/expo/node_modules/babel-preset-expo`,
   where the root `@babel/core` can't resolve it (`Cannot find module
   'babel-preset-expo'`). Declaring it directly lands a copy at
   `apps/mobile/node_modules/babel-preset-expo` that both babel and the export
   resolve.

The New Architecture is on (SDK 57 default, and required by Reanimated 4). The
old SDK-51 `--no-bytecode` export workaround is gone — hermesc resolves fine now.

## Running / building

- **Local dev (human, needs a device/emulator):** `cp .env.example .env` (fill
  in the public Vault creds) → `npm run start --workspace @swift2/mobile` →
  open in Expo Go. The runtime is *unverified* until someone does this.
- **Cloud APK:** see `docs/mobile-shipping-checklist.md` — one command
  (`eas build -p android --profile preview`) after the one-time `eas login` /
  `eas init` / env-var setup.

## Next milestones

- Device pass: verify gesture feel + 60fps on mid-tier Android (dev build with
  the perf monitor; the architecture is in place but "smooth" needs a device).
- Morph-on-grab: peek strip ↔ full navigator expansion, overscroll-to-expand,
  scroll→timeline back-coupling (vertical axis), per architecture.md.
- Moment detail + track guide sheets (`getMoment` / `getTrackGuide` are already
  in `@swift2/core`, unused by mobile so far).
