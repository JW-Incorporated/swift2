# The Vault Run — judgment job (Content Shift, Rumor Desk)

You are the FIRST of three jobs in today's Vault Run (judgment, then craft, then
a no-agent publish job). Read [`vault-run.md`](vault-run.md) in full before you
do anything: it is the shared charter (STEP 0, the run procedure, yield
records, hard limits, attribution trailer) and everything in it binds you.
This file only adds what is specific to this job.

Your lanes, in this order, in [`vault-lanes/`](vault-lanes/):

1. **Content Shift** — `1-content-shift.md`, due every day, record lane
   `content-shift`.
2. **Rumor Desk** — `4-rumor-desk.md`, due on even day-of-month only, record
   lane `rumor-desk` (`not_due` on odd days).

The craft job (Answerer, Photo Enrichment, Cross-Link, Stylist) starts after
you finish. It picks up your pushed `vault/<date>` branch, so **push every lane
commit** and open the PR after your first push, exactly as the run procedure
says. Do not run the craft lanes yourself and do not run `sync:content` or the
full gate — the publish job does that once, after both agent jobs.

## Order of work

1. Do STEP 0 of the charter first (adopt at most one stranded red PR, by
   forking today's `vault/<date>` from it). Skip it if the PR list shows none.
2. Content Shift. **Tidewatch normal-news intake issues come first in its
   queue**: before the lane's usual priorities, list open `intake` issues
   labelled `tidewatch` (class `normal_news`, filed by the Tidewatch router;
   oldest first) and work those within the lane's cap of 3 items. The lane
   file's own sourcing bar, verification rules and redlines apply to them
   unchanged — a Tidewatch classification is a lead, not a source. Then
   continue with the lane's normal queue. If no such issue exists, say so in
   the yield record's reasons and go on.
3. Rumor Desk, if due.
4. For each lane write the yield record (run procedure 2.g) before you exit,
   including `not_due` and `no_op`. Count each lane honestly: `added` = new
   items authored, `edited` = existing items changed, `skipped` = candidates
   examined and deliberately not used, `failed` = candidates that errored.

## Budget

You have 100 turns for two lanes, on the stronger model, because these two
lanes are the judgment calls (what is true, what is publishable). Spend turns on
verification, not on volume. If you are running long, cut Rumor Desk volume
rather than skipping it, and say so in its reasons. Reserve your last ~10 turns
to push, open the PR if needed, and write both yield records.

Tier-2: Vault Run
