# @swift2/mobile — Expo app (scaffold)

The iOS/Android reader. Reuses `@swift2/shared` (domain/types) and
`@swift2/core` (Supabase data access) **unchanged** — the whole point of the
`packages/*` boundary (see `docs/architecture.md`). Only the view layer and the
gesture/animation runtime are mobile-specific.

## Status: scaffold, NOT device-verified yet

What's here and typechecked:

- Reuses `createVaultClient` from `@swift2/core` (`lib/vault.ts`) — identical to
  the web data layer, just `EXPO_PUBLIC_*` env vars.
- `App.tsx`: a read-only, scrollable era list that loads the Tier 0 skeleton and
  reuses `orderedEras` + the era `theme` colors from `@swift2/shared`.
- Monorepo Metro config, Expo SDK 51 / RN 0.74 / React 18.

**Bundling status (from a headless `npx expo export --platform android`):**

- ✅ **Metro resolves the monorepo packages.** An initial export failed on
  `@react-native/virtualized-lists`; the fix was removing
  `resolver.disableHierarchicalLookup` from `metro.config.js` (that flag is for
  pnpm-style installs — npm workspaces hoist most deps to root but still nest a
  few under a package's own `node_modules`, so Metro must walk up). Fixed here.
- ⚠️ **One version-alignment issue remains before the JS bundle builds.**
  `@expo/vector-icons` (pulled transitively by `expo`, not imported by us)
  declares a loose `react-native` peer that npm resolves to a **future RN
  (0.86.0)** and nests under `expo/`, so Babel then chokes on that copy. npm
  `overrides` did **not** force it (auto-installed peer). The right fix is the
  standard Expo one on a dev machine: **`npx expo install --fix`** (and/or
  `npx expo-doctor`) to pin the whole SDK-51-compatible set to a single
  react-native@0.74.x. Do this during the device-setup step below.

**Then to actually run it (needs a human on a device or emulator):**

- `npm install` at the repo root → `npx expo install --fix` (from `apps/mobile`,
  resolves the RN version alignment above) → `cp apps/mobile/.env.example
  apps/mobile/.env` (fill in the public Vault creds) → `npm run start
  --workspace @swift2/mobile`, open in Expo Go / an emulator. Metro + an
  emulator couldn't run in the authoring environment, so treat the runtime as
  unverified until someone boots it.
- The **morph-on-grab gesture scrubber** (Reanimated worklets + Gesture
  Handler, UI-thread, 60fps) — the mobile half of the reference workload. This
  screen deliberately ships the portable data/domain layer first; the native
  scrubber is the next milestone (shares the snap math in `@swift2/shared`).
- Moment detail + track guide sheets (the mobile counterparts of the web
  bottom-sheets).

## Why a plain list first

Prove the expensive architectural bet — that `shared`/`core` are genuinely
platform-agnostic — with the cheapest possible view, before investing in the
native gesture layer. If this list renders real Vault data on a phone, the
data/domain reuse is validated.
