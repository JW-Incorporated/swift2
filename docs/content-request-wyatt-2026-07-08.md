# Content request for Wyatt's team — post-LongLive baseline

Context: the front-end now shipping (`docs/longlive-experience.md`) is an
era/threads reader with a fixed data shape. Content is the release blocker for
v1 — this doc tells your team exactly what shape to produce so it drops in
without engineering rework.

**Read `docs/longlive-experience.md` §3 (data model) and §8 (recipes) first.**
Everything below is just that, scoped into a work order.

## Format rules (apply to everything you produce)

- Output as TypeScript literal arrays/objects matching the types in
  `apps/web/lib/longlive/types.ts` — not prose, not JSON-with-commentary.
  Easiest path: hand us plain data (spreadsheet/CSV/JSON) with the exact
  fields below and we'll do the typed conversion, but field names and shapes
  must match or content gets rejected in review.
- Every date is `YYYY-MM-DD`, real and specific — no "circa" or ranges.
- Every Spotify album ID / YouTube video ID must be **verified**, not
  remembered: hit the oEmbed endpoint and confirm the title/artist before
  handing it over (see §5.5 in the manual for the exact curl commands). A
  wrong ID silently plays the wrong song — this has already caused 2 bugs.
- No re-hosted audio/video — links/IDs to official sources only.

## What we need, in priority order

1. **Era moments** (`ContentItem[]` in `content.ts` shape) — for each of the
   12 eras (`debut, fearless, speak-now, red, 1989, reputation, lover,
   folklore, evermore, midnights, ttpd, tloas`): `date, title, blurb, tags
   (Music/Fashion/Tour/Relationship/Lore)`, optionally `video: {youtubeId,
   title}` for music-video moments and `hiddenClue` for Easter-egg-eligible
   moments. We have some mock coverage already — send us what's missing or
   better-sourced per era. Thin eras first (check `docs/longlive-experience.md`
   §9 "known gaps" for current coverage).

2. **Threads** (cross-era narrative lenses) — if adding a *new* thread beyond
   the current 6 (love-story, fashion, taylors-version, easter-eggs,
   hidden-clues, the-proposal): its own dataset + a `ThreadPoint[]` mapping
   (`date, eraId, label`) per §5.1. Existing threads can just get more
   dated entries in their existing shape.

3. **Track/song records** — canonical data per song (title, era, album,
   release date) that era moments and threads can reference. Keep one
   canonical record per song; don't duplicate across eras.

4. **Easter eggs / motifs** — if contributing to the Clue Web, every egg node
   needs exactly one motif-trail classification (§5.3) — unclassified eggs
   fail a dev-time guard.

## What NOT to send

- Anything touching component code, the store, or theming — that's
  engineering's lane, not content's.
- Unverified media IDs.
- Duplicate content across two PRs touching the same era file — if two people
  are adding to the same era array, coordinate the array position or expect a
  merge conflict (recoverable, but slower).

## Hand-off

Send content as a PR against `main` (small, one theme per PR is easier to
review than one giant dump) or as structured data files if you don't want to
touch the TS directly — either way, tag Claude Code for review before it's
considered done (codex review + content-shape validation happens on our side).
