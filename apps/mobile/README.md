# @swift2/mobile — Expo app (Android-first)

> **2026-09-06 (OS-039):** SiteShell is retired as the app's default surface.
> The app now renders five native worlds — era stream, threads, clownbot,
> community, merch — behind a persistent `BottomTabBar` (`App.tsx`,
> `components/BottomTabBar.tsx`); every one of them reads from
> `@swift2/experience`/`@swift2/content`, the same headless core + published
> bundle the web uses (D2: two renderers, one core). The WebView
> (`components/SiteShell.tsx`) still exists, but only ever renders one of
> the three legal pages (`/privacy`, `/terms`, `/support`) — see `routes.ts`'s
> `DEFAULT_ROUTE_FLAGS` (every native screen flag-on by default) and
> `App.tsx`'s `isLegalPageUrl`. The Vault navigator described below predates
> all of this (Phase 0's original architecture) and is kept unmounted as
> dead code, superseded by the native screens above.

The iOS/Android reader. Reuses `@swift2/shared` (domain/types) and
`@swift2/core` (Supabase data access) **unchanged** — the whole point of the
`packages/*` boundary (see `docs/architecture.md`). Only the view layer and the
gesture/animation runtime are mobile-specific.

## Status: native by default, EAS-ready, NOT yet device-verified

Stack: **Expo SDK 57 · React Native 0.86 · React 19 · Reanimated 4** (New
Architecture on). Targets **Android API 36** (compileSdk/targetSdk 36 via
`expo-build-properties`), above Play's API-35 floor — store-submittable, not
just internal.

What's here (typechecked, and both platforms export headlessly with Hermes
bytecode — `npx expo export --platform ios|android` → ~3.4 MB `.hbc` each,
no errors):

- **Native worlds** (`App.tsx` + `components/BottomTabBar.tsx`): the five
  tabs a reader lands on by default — `EraStreamScreen`, `ThreadsScreen`,
  `ClownChatScreen`, `CommunityScreen`, `MerchScreen` — plus the overlay
  screens they open into (`MomentSheet`, `TrackGuideScreen`, `SongScreen`,
  `NotificationSettingsScreen`, `NotificationInboxScreen`). Every one reads
  the same published content bundle / `@swift2/experience` headless core the
  web renders from — see each screen's own header comment for its exact web
  equivalent and any documented scope cuts.
- **Hybrid router** (`lib/routes.ts`): `resolve(url)` decides native vs.
  WebView per URL behind a per-screen flag, all flags default ON since
  OS-039 (a flag can still flip OFF as a kill switch without a new store
  build, via EAS Update). Every URL this table doesn't recognize as one of
  the three legal pages degrades to the native home, never a stale WebView
  load (`App.tsx`'s `openWebUrl`/`isLegalPageUrl`).
- **Data layer** (`lib/vault.ts`, unused by the mounted screens): the SAME
  `createVaultClient` from `@swift2/core` the web app originally used —
  superseded by the published content bundle (`packages/content`) that
  every native screen above reads from instead. Kept for reference only.
- **Vault navigator** (`components/VaultNavigator.tsx`): the ORIGINAL native
  counterpart of `apps/web/components/VaultReader.tsx` from before this
  phase's native screens existed — unmounted dead code, superseded by the
  screens listed above.
- **Era timeline scrubber** (`components/EraTimeline.tsx`): first pass of the
  morph-on-grab navigator on the architecture's required foundation — Gesture
  Handler + Reanimated, gesture and thumb animation entirely on the UI thread
  (shared values in worklets, zero JS/React state per frame). JS is touched
  once per gesture, on release, to snap + commit the era using the same
  `@swift2/shared` snap math as the web scrubber. Milestones render as passive
  tick marks. Snaps to era boundaries only (v1 spec). Not yet wired into any
  mounted screen.
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
