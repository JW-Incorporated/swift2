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

**Not yet done / needs a human on a device or emulator:**

- Actually running it: `npm install` at the repo root, then
  `cp apps/mobile/.env.example apps/mobile/.env` (fill in the public Vault
  creds), then `npm run start --workspace @swift2/mobile` and open in Expo Go /
  an emulator. I could not run Metro or an emulator in this environment, so
  treat the runtime as unverified until someone boots it.
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
