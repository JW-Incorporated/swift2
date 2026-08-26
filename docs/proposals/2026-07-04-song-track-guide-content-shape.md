# Proposal: A non-month-scoped "track guide" content shape

Status: DRAFT — for Wyatt's sizing/scheduling call, not a request to build now
Author: Claude Code (marketing/planning mode)
Date: 2026-07-04
Grounded in: `docs/architecture.md`, `docs/marketing/content-framework-2026-07-03.md`,
`docs/marketing/feature-brief-2026-07-04.md` (candidate 1 + Addendum)

## 1. The problem, in plain language

Joey wants full song-catalog coverage: meaning, background, and Easter eggs
for essentially every song where a real source exists, not just a curated
handful — and the research so far backs that up as realistic (Taylor's
catalog is unusually well-documented). That's a content-authoring decision,
already approved.

It collides with an existing constraint, though. Songs currently only get
content by being a `month_item` dated to their release month, and that list
is deliberately capped (1-2 "standout tracks" per album) to respect two
limits `architecture.md` and the engine track already enforce:

- The wavetop-month depth ceiling (5-8 items *total*, across every category,
  not just music) from `docs/marketing/content-framework-2026-07-03.md`.
- The Tier-0 payload budget gate (`docs/roadmap.md` W6, `≤2MB` gzipped) that
  CI already checks.

Midnights has 13 tracks; Tortured Poets has 31 with the Anthology. Jamming
full-catalog song content into `month_item` rows for the release month would
blow both limits immediately, and would only get worse as more eras get
authored.

## 2. What's being asked

Not a full spec — a sizing/scheduling call. The shape being proposed:

A **per-album track guide**: a browsable list of every song on an album,
each with its own short sourced note (meaning/background/Easter egg,
skipped where no real source exists — same no-fabrication rule as
everything else). Key property: it is **not addressed by year/month** the
way `month_item` is. It's reached from the album/era, not from scrubbing to
a specific month. That's what keeps it out of the Tier-0 timeline payload
and off the wavetop-month item count entirely.

Rough shape (illustrative, not a schema — that's engineering's call):

```
track_note
  id
  era_slug        -- which era/album it belongs to
  track_title
  track_number    -- optional, for display order
  note            -- short, sourced (same length discipline as month_item.snippet)
  source_url
  sources[]        -- {outlet, url}, same shape as moment.sources
```

Open questions for Wyatt, not answered here:
- Does this live in its own table, or as a variant/extension of existing
  `moment` rows keyed differently?
- Does it need its own Tier (loaded on-demand per album, like Tier 1) or is
  a full album's worth of short notes small enough to bundle with Tier 0?
- RLS/access pattern: presumably identical to everything else in the Vault
  (public read, authored via repo seed files) — flagging to confirm, not
  assuming.
- Does this need a `docs/decisions.md` entry, or is it small enough to just
  be a migration + a roadmap update? (Compare to the four other schema
  decisions already logged — this feels closer in size to "add a table" than
  to a stack/auth-level call, but that's Wyatt's read to make.)

## 3. What this is NOT

Not the "clown bot." No user submissions, no AI at request time, no
accounts, no novelty-scoring. Fully static, repo-authored, same authoring
pipeline (Claude drafts → Codex reviews → Joey spot-checks) as the rest of
the Vault. Zero runtime cost implications beyond one more static payload to
serve, sized the same way Tier 0/Tier 1 already are.

## 4. Why now, not parked

Unlike the fashion cross-era-threads idea (parked in the 2026-07-04 feature
brief — genuinely premature with 9/11 eras still empty), this one has a
concrete, immediate authoring backlog waiting on it: Midnights and Tortured
Poets already have real content and real audience interest, and Joey wants
to start on full-catalog song coverage for exactly those two eras next.
Sizing this now avoids authoring content against a shape that doesn't exist
yet, or worse, cramming it into `month_item` in a way that has to be
migrated later.
