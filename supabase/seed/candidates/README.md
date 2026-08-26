# Candidate content (staging — not live)

Files here are **proposed** Vault content that a human hasn't approved yet. The
seed runner (`scripts/seed-content.mjs`) only reads `../content/`, so **nothing
in this folder is auto-seeded** and none of it shows up in the app until someone
deliberately adopts it.

## What's here

- **`00-orbit.mjs`** — 319 items ported from the sibling **Orbit** project:
  101 outfits (→ `fashion`) and 218 songs with lore (→ `music`), dated by
  verified album releases. **These blurbs were AI-drafted in Orbit and are not
  human-verified.** Treat as a first draft to curate, per our unofficial /
  no-fabrication stance. Images are hotlinked (never rehosted).

  > ⚠️ **The 218 songs (`category: "music"`) are an anti-pattern — do NOT seed
  > them as `month_item` rows.** Per the 2026-07-04 decision ("Song track guide
  > is a separate, non-month-scoped shape", `docs/decisions.md`), full song
  > coverage now lives in the `track_note` table, authored via
  > `supabase/seed/tracks/*.mjs` (`npm run db:seed:tracks`) — reached from the
  > album, kept off the Tier-0 timeline payload. These ported song blurbs are
  > also **unsourced** (empty `sources[]`), so they can't be adopted as-is under
  > the no-fabrication rule regardless. Mine them for song *titles* to research,
  > then author real sourced `track_note`s; don't move the `music` items into
  > `../content/`. The outfit (`fashion`) items are correctly shaped and can be
  > curated normally. `npm run validate:content` guards `../content/` against
  > bad rows if any get copied over.

- **`youtube-appearances.mjs`** — the 2026-08-12 YouTube-appearances research
  pass: ~31 talk-show, award, podcast and red-carpet appearances, each with an
  oEmbed verification record (live/dead, real uploading channel, resolved URL).

  > ℹ️ **This one is a research ledger, not a tray of ready-to-seed items** —
  > its shape is `{ kind, researchedOn, entries[] }`, not `{ eraSlug, items[] }`,
  > so the "move the whole file into `../content/`" path below does **not**
  > apply to it and it would fail `validate:content` if copied over. The
  > entries that earned a place are already integrated into `../content/`;
  > each entry's `verification.integration` field records whether it was
  > `enriched:`, `new:`, or deliberately left `candidates-only`. Use it to
  > check sourcing or to revisit an entry, not as an adoption queue.

## How Joey adopts content (opt-in)

1. Open the candidate file and read through it.
2. Keep what's good. Either:
   - move the whole file into `../content/` (goes live wholesale on next seed), or
   - copy the items you want into per-era files there (e.g. `lover.mjs`) and
     edit/verify them first — the better path for a curated launch.
3. `npm run db:seed:content` to push your `../content/` selections to the DB.

Deleting a file here has **no effect on the live app** — it only discards the
proposal.
