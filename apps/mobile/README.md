# @swift2/mobile — Expo app (Android-first)

The iOS/Android reader. Reuses `@swift2/shared` (domain/types) and
`@swift2/core` (Supabase data access) **unchanged** — the whole point of the
`packages/*` boundary (see `docs/architecture.md`). Only the view layer and the
gesture/animation runtime are mobile-specific.

## Status: bundles clean, EAS-ready, NOT yet device-verified

What's here (typechecked, and the Android JS bundle exports headlessly —
`npx expo export --platform android --no-bytecode` → 1.95 MB, no errors):

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

npm workspace hoisting gives this repo multiple copies of packages that must be
singletons in an RN bundle. Three committed fixes keep it sane:

1. **`metro.config.js` pins `react` and `react-native` by name** to the copies
   in `apps/mobile/node_modules`. Without it, imports originating inside
   `node_modules/expo/*` resolve a stray RN 0.86 (`@expo/vector-icons`' loose
   peer, auto-installed by npm — root `overrides` can't force it) which breaks
   Babel, and the root-hoisted `react` 18.3.1 (web's) which would put TWO React
   instances in one bundle and break hooks at runtime.
2. **`babel.config.js` adds `react-native-reanimated/plugin` explicitly.**
   babel-preset-expo's auto-detection resolves from the root-hoisted preset and
   cannot see `apps/mobile/node_modules`, so worklets would silently not be
   compiled.
3. **Local `expo export` needs `--no-bytecode`** — the hermesc lookup resolves
   from root `node_modules` and misses the app's RN copy. Harmless for real
   builds: EAS release builds compile Hermes bytecode in Gradle from the app's
   own `react-native` (0.74.5).

Also: `newArchEnabled` is `false` — the New Architecture was still experimental
on SDK 51; flip it when the SDK is upgraded, not before.

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
- Expo SDK upgrade before any Play Store submission (SDK 51 targets Android API
  34; Play requires 35+ — see the shipping checklist).
