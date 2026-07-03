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

## How Joey adopts content (opt-in)

1. Open the candidate file and read through it.
2. Keep what's good. Either:
   - move the whole file into `../content/` (goes live wholesale on next seed), or
   - copy the items you want into per-era files there (e.g. `lover.mjs`) and
     edit/verify them first — the better path for a curated launch.
3. `npm run db:seed:content` to push your `../content/` selections to the DB.

Deleting a file here has **no effect on the live app** — it only discards the
proposal.
