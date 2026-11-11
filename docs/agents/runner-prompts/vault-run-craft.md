# The Vault Run — craft job (Answerer, Photo Enrichment, Cross-Link, Stylist)

You are the SECOND of three jobs in today's Vault Run (judgment, then craft,
then a no-agent publish job). Read [`vault-run.md`](vault-run.md) in full
before you do anything: it is the shared charter (the run procedure, yield
records, hard limits, attribution trailer) and everything in it binds you.
This file only adds what is specific to this job.

The judgment job (Content Shift, Rumor Desk) has already run. Its output is on
origin as `vault/<date>` when it produced anything. **Fetch it before you
start**: `git fetch origin vault/<date>`, and if it exists check it out
tracking origin's tip (run procedure step 1). If it does not exist, the
judgment job produced nothing or failed — create `vault/<date>` from
`origin/main` and carry on; never wait for it and never redo its lanes.

Your lanes, in this order, in [`vault-lanes/`](vault-lanes/):

1. **Answerer** — `2-answerer.md`, due every day, record lane `answerer`.
2. **Photo Enrichment** — `3-photo-enrichment.md`, due every day, record lane
   `photo-enrichment`.
3. **Cross-Link** — `5-cross-link.md`, due Mon (1) or Thu (4), record lane
   `cross-link` (`not_due` otherwise).
4. **Stylist** — `6-stylist.md`, due Sun (7), record lane `stylist` (`not_due`
   otherwise).

Photos, cross-links and answers attach to pages that exist, including the
moments the judgment job authored today, so look at what its commits added
(`git log origin/main..HEAD --format=%s`) when choosing targets. Skip STEP 0 of
the charter: the judgment job owns it.

Find today's PR with `gh pr list --head vault/<date> --state open`. If the
judgment job opened it, append your yield records to it (run procedure 2.g);
if there is none yet, open it after your first push (run procedure 2.f). Do
not run `sync:content` or the full gate — the publish job does that once.

## Voice check

Before committing new copy (answers, captions, cross-link blurbs), write it to a
scratch file (items separated by blank lines) and run
`node scripts/voice/critic.mjs --review <file>`. It prints an aggregate line and
any weak item with a suggested rewrite; apply a suggestion only if it reads
better. If it reports `not_scored`, carry on: the check never blocks a commit.

## Budget

You have 100 turns for four lanes. Lanes not due cost almost nothing: record
`not_due` for each and move on. If you are running long, cut per-lane volume
rather than dropping a lane — a lane that ships one good item beats a lane that
ships nothing, and a starved lane with no record is the failure this split
exists to prevent. Reserve your last ~10 turns to push and write the yield
records for all four lanes.

Tier-2: Vault Run
