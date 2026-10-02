# ReaderSnapshot

One versioned, hashable contract for everything the reader renders from
(docs/proposals/2026-10-02-one-ui-three-surfaces.md section 4.2). The web
builds it from its baked modules; the app builds it in the webview from the D1
bundle. CI proves the two hash equal for the same commit.

Import from `@swift2/experience/reader-snapshot` (deliberately not re-exported
from the package root). Nothing imports it yet.

- `fromBaked(mods, deps)`: web path. `mods` is the web's `apps/web/lib/longlive`
  exports; assumes the web's provider wiring already ran.
- `fromBundle(bundle, deps)`: app path, from a `loadBundle()` result. Installs
  the bundle into the core's global providers first (`wireProviders`), because
  threads, doorways and the track guide are derived through them.
- `deps.eraVideoFeed`: pass `@swift2/content-enrichment`'s. It imports this
  package, so it cannot be imported back.
- `hashSnapshot` / `diffSnapshots`: SHA-256 over canonical JSON (sorted keys,
  `undefined` dropped) via WebCrypto (`crypto.subtle`; Node 18+, browsers,
  webview; not Hermes). Hash covers `version` + `domains`; `state` and `origin`
  are provenance and never hashed. `diffSnapshots` returns diverging domain names.
- Domains: eras, content (by era), milestones, videos, eraStream (curated
  videos, doorways, render-ordered keys), theories, eraSecrets, threads,
  searchIndex, tracks, trackGuide, merch, songMoods.

## Known by-design differences, normalised before hashing

- The bundle regroups content by era; the web keeps one global `CONTENT`
  order. `content` is grouped by era on both sides, and `searchIndex` is hashed
  sorted by doc `key` (ranking ties break on score then title, never position).
- The bundle path builds the search index with `search-docs.ts`, a mirror of
  the web's `buildSearchIndex()`. The equivalence test is what keeps them from
  drifting; WP2.2 should make the web use this one.

## Not covered

Clownbot lore (server-side only) and live/current feeds (runtime, not baked).

## Tests

`equivalence.test.ts` builds the bundle with `scripts/build-content-bundle.mjs`
(needs `npm run sync:content` first, as CI does), asserts equal hashes, and
proves a deliberately diverged bundle fails and names its domain.
CI runs it as its own step: `npx vitest run packages/experience/src/reader-snapshot`.
