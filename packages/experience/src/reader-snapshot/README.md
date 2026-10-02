# ReaderSnapshot

One versioned, hashable contract for everything the reader renders from
(docs/proposals/2026-10-02-one-ui-three-surfaces.md section 4.2). The web
builds it from its baked modules; the app builds it in the webview from the D1
bundle. CI proves the two hash equal for the same commit.

Import from `@swift2/experience/reader-snapshot` (deliberately not re-exported
from the package root). Nothing imports it yet.

- `fromBaked(mods, deps)`: web path. `mods` is the web's `apps/web/lib/longlive`
  exports; it wires those same inputs itself, not via the web's import chain.
- `fromBundle(bundle, deps)`: app path, from a `loadBundle()` result.
- Both go through `withProviders`, which installs the inputs into the core's
  module-global providers (threads, doorways, track guide and the mood catalogue
  read through them) for the duration of the build and restores the previous
  ones in `finally`: no leak, no dependence on call order. Synchronous only.
  Pure derivation over inputs, with no providers, is WP2.2's job.
- `deps.eraVideoFeed`: pass `@swift2/content-enrichment`'s. It imports this
  package, so it cannot be imported back.
- `hashSnapshot` / `diffSnapshots`: SHA-256 over canonical JSON (sorted keys,
  `undefined` dropped) via WebCrypto (`crypto.subtle`; Node 18+, browsers,
  webview; not Hermes). Hash covers `version` + `domains`; `state` and `origin`
  are provenance and never hashed. `diffSnapshots` returns diverging domain names.
- Domains: eras, content (by era), milestones, videos, eraStream (curated
  videos, doorways, render-ordered keys), theories, eraSecrets, threads,
  searchIndex, tracks, trackGuide, merch, songMoods.

## Search ordering contract

`searchDocs` ranks by score, then title, then doc `key` (unique), never by
position in the index, so the result list and the per-type cap are identical
whatever order the docs were built in. The bundle cannot reproduce the web's
global `CONTENT` order (it is `VAULT_RAW`'s key order and the bundle regroups
by era), so `searchIndex` is hashed in key order. Anything that makes ranking
depend on index position again breaks this and must also change the hash.

## Known by-design differences

- `content` is grouped by era on both sides.
- The bundle path builds the search index with `search-docs.ts`, a mirror of
  the web's `buildSearchIndex()`. The equivalence test keeps them from
  drifting; WP2.2 should make the web use this one.

## Not covered

Clownbot lore (server-side only) and live/current feeds (runtime, not baked).

## Tests

`equivalence.test.ts` builds the bundle with `scripts/build-content-bundle.mjs`
(needs `npm run sync:content` first, as CI does), asserts equal hashes, and
proves a deliberately diverged bundle fails and names its domain.
CI runs it as its own step: `npx vitest run packages/experience/src/reader-snapshot`.
