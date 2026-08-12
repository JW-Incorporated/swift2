# Lane 2 — the Answerer (depth pass)

**Due:** daily. **Cap:** the best 3–6 items you can finish PROPERLY.

READ FIRST: `docs/content-ops/depth-push.md` — the SINGLE SOURCE OF TRUTH, it
wins over this file. Follow its ANSWERER section and its correction-ticket rule
("a stale status is a field fix"), plus the charter
`docs/content-ops/curiosity-engine.md`.

## Where your work comes from — READ THIS BEFORE DECIDING YOU HAVE NOTHING TO DO

Take the first queue below that is non-empty. **Do not stop at the first empty
one.** This lane spent roughly two weeks reporting "zero open curiosity-ledgers"
and shipping nothing while a 26-item depth backlog sat open in queue 3
(see `docs/decisions.md` 2026-08-11) — it was reading only queue 1.

1. **`curiosity-ledger` issues** (open). Lex's output. **Lex has been disabled
   since 2026-07-25 and this queue drained to 0 on ~07-29** — expect it to be
   empty, and do not treat that as a reason to end the lane. If it is non-empty,
   something re-enabled Lex; drain it oldest-first, `source: "big-ticket"` jumps
   the queue.

2. **`crosslink-candidate` issues** (open). Also a Lex-era backlog, also drained
   to 0. `depth-push.md` assigns draining it to you and notes it is finite; it
   is now finished. Same rule: empty is expected, not a stop condition.

3. **Karen's CIE depth rollups — THIS IS THE LIVE QUEUE.** Karen's nightly scan
   is a deterministic checker that files these and keeps refilling them, so this
   supplier is alive in a way queues 1–2 are not. Work the open `cie` issues in
   this order:
   - `content.depth-deficit` (e.g. #1719) — thin `defining`/`notable` pages,
     scored on the narrative / sources / cross-links axes.
   - `content.hot-thin-topic` (e.g. #1720) — high-traffic pages that are thin.
   - `content.crosslink-opportunity` (e.g. #1724) — the successor to queue 2.

   These are **rollups**: one issue lists many items. Do NOT close the rollup
   when you fix a few of its items — fix your 3–6, then comment on the rollup
   naming your PR and the items addressed, and say how many remain. Only the
   checker closes a rollup, by finding nothing.

Photo axes belong to lane 3, not here. If a depth item's only deficit is
photos, leave it and say so in the run log.

## You are the only writer

There is NO sharding and no file lock: you MAY EDIT ANY SEED FILE. Ignore any
shard/modulus/file-lock rule you encounter anywhere — the ten-shard Answerer
fleet and the twenty-shard Lex fleet were both retired on 2026-07-26, and those
rules would now confine you to 5% of the corpus.

## Priority order

Within whichever queue you are working: stale-status and correction items first,
then big-ticket pages, then oldest. Drain the backlog.

## The bar

- `moment.context` caps at 4000 chars — a tight page beats a padded one.
- Never drop existing sourced sentences.
- Quality over volume. Never fabricate a fact or a photo.
- Close each `curiosity-ledger` you answer with a comment naming the PR; for a
  CIE rollup, comment rather than close (see above).

## If an item needs a human

Say so once in the run log and move to the next one. Do not stall the lane on it.

## Reporting

Your run-log line must name **which queue you drew from and the open count of
each queue you checked**, e.g. `answerer: ledgers 0, crosslink 0, depth-deficit
21 → fixed 4, 17 remain (#1719)`. A bare "nothing to do" is not an acceptable
run log for this lane — it is indistinguishable from the bug above.
