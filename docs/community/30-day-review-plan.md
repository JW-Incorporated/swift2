# Community Engine — 30-day review plan (P3-2)

Source: `docs/proposals/2026-09-06-community-engine-plan.md` §Phase 3, card
P3-2. Scheduled, docs-only review card — this document is the methodology;
the review itself runs later (see "Scheduling" below) once there is 30 days
of real data to look at.

## Why this is a plan, not a completed review today

The engagement engine's scan went live (`COMMUNITY_SCAN_ENABLED=true`) on
**2026-09-07** (P1-7's dry-run flip, see `docs/community/p1-7-dry-run.md`).
The content engine's crawl (`COMMUNITY_CRAWL_ENABLED`) still **ships off**
per P2-1's founder directive — Joey turns it on deliberately, so the theory
corpus has zero real rows until he does. Running "the 30-day review" today
would report on zero days of production data. This card instead: (a) locks
down exactly what the review will measure and how, so no judgment calls are
needed 30 days from now, and (b) puts the actual review on the calendar as
a dated follow-up.

**Review date: 2026-10-07** (30 days after the engagement engine's live
flip). If Joey flips `COMMUNITY_CRAWL_ENABLED` on a different date, the
corpus-size metrics below should be read as "N days since crawl start"
rather than assuming the same 30-day window — note the actual crawl-enable
date in the review's findings if it differs from engagement's.

## Metrics to pull (exact queries / sources)

### 1. Posted-vs-drafted ratio (engagement engine health)
```sql
select
  count(*) filter (where status = 'posted') as posted,
  count(*) filter (where status = 'skipped_by_founder') as skipped,
  count(*) filter (where status in ('drafted','emailed')) as still_pending,
  count(*) filter (where status = 'skipped_redline') as redline_skipped,
  count(*) filter (where status = 'skipped_low_relevance') as low_relevance_skipped,
  count(*) as total
from engagement_lead
where created_at >= now() - interval '30 days';
```
Report `posted / (posted + skipped)` as the founder engagement rate — the
fraction of drafts Joey/Wyatt actually found worth pasting. A low ratio
(<30%) is a signal the Answerer desk's relevance bar or voice needs
tightening, not that the founders are too busy — cross-check against
`community_post_ledger` row count for the same window to catch any lag
between `posted_at` on the lead vs. the ledger insert (`/api/community/ack`
writes both atomically per P1-5, so these should match exactly; a mismatch
is a bug, not a metric).

### 2. Link-CTR via UTM
The plan names `utm_source=reddit&utm_medium=comment` as the tracking
convention, but **no code currently appends UTM parameters to
`target_url`/deep links** — grep confirms zero occurrences of `utm_` across
the shipped Answerer desk, mailer, or ack route. This is a gap the review
must flag, not paper over:
- If Joey wants real link-CTR data for this review, UTM parameters need to
  be added to `target_url` construction in the Answerer desk
  (`scripts/community/relevance.mjs` / the runner prompt) **before** the
  review date, ideally as soon as this card lands, so there's a real
  30-day window with tagged links by 2026-10-07.
- Absent that, the review can only report `link_included=true` counts (how
  often the etiquette gate cleared a link) from `community_post_ledger`,
  not actual click-through — call this out explicitly rather than
  estimating a CTR from nothing.
```sql
select count(*) filter (where link_included) as linked_posts,
       count(*) as total_posts
from community_post_ledger
where posted_at >= now() - interval '30 days';
```

### 3. Theory-corpus size
```sql
select
  status,
  count(*) as candidates,
  count(*) filter (where redline_ok) as redline_clean
from fan_theory_candidate
group by status;

select count(*) as promoted_theories,
       sum(mention_count) as total_mentions,
       count(distinct unnest(communities)) as distinct_communities
from live_theory
where origin = 'fan' and persistent = true;
```
If `COMMUNITY_CRAWL_ENABLED` is still off at review time, these will be
near-zero — report that plainly as "crawl not yet started" rather than as
a corpus-health finding, and recommend either flipping it on now or
deferring this specific sub-metric to a later checkpoint.

### 4. Cost
- Engagement engine: Answerer desk run count × avg tokens (pull from
  `CLAUDE_CODE_OAUTH_TOKEN`-billed run logs / GitHub Actions run history for
  `routine-community-answerer.yml` over the 30-day window). Plan's own
  estimate: ≈12 drafts/day on Sonnet-5, "well under $1/day" (§4) — confirm
  or correct against actual usage.
- Content engine: Theory Miner Haiku calls (one per post+comment bundle,
  bounded by `COMMUNITY_CRAWL_BUDGET`) + the weekly deterministic
  merge/promote pass (`theory-promote.yml`, **no LLM** — P2-3 shipped this
  as a deterministic rule-based merge, not the Opus pass the plan's §4 table
  originally proposed, see that workflow's header). Cost estimate should
  reflect the shipped deterministic implementation, not the plan's original
  Opus-cost assumption.
- Total cost line: confirm it stays "well under $100" (the founder
  commitment-decision threshold in `CLAUDE.md`) — if it doesn't, that's a
  finding for Joey, not a silent absorption.

### 5. Cap / model recommendations
Compare actual usage against the caps already in place and recommend
adjustments with data, not vibes:
- Answerer desk caps: ≤12 drafts/day total, ≤3/community
  (`docs/agents/community-answerer.md` §Caps). If the daily cap is
  routinely hit with unmet demand (`status='new'` leads piling up past 24h),
  recommend raising it; if it's rarely approached, no change needed.
- Home-relay caps: Answerer ≤5 threads/run, crawl ≤40 threads/run/day
  (`docs/AUTOMATION.md`). Check `HOME_RELAY_REACHABLE` uptime and whether
  the crawl's 6-week-for-5-subs pace (plan §3.2, §8-Q3 recommendation "a")
  is still the right call, or whether 30 days of stability data supports
  moving to §8-Q3's option "b" (faster, given a `decisions.md` entry).
- Answerer model (§8-Q4: Sonnet-5 daily, weekly merge — though the merge
  pass shipped deterministic, not Opus, per P2-3): recommend keeping Sonnet-5
  unless voice-quality complaints or posted-ratio data suggest otherwise.
- `COMMUNITY_CRAWL_ENABLED` / `COMMUNITY_CRAWL_BUDGET`: explicitly recommend
  (or not) turning the crawl on / raising its budget, per the plan's §8-Q3
  framing — this is the one component the plan calls out as carrying real
  scraping-volume risk, so any recommendation to speed it up must go to
  Joey as a decision, not be auto-applied.

## What the review must NOT do
- Must not recommend or make any relay-posture change itself (§8-Q3 is a
  `docs/decisions.md` founder call, per the plan's own words: "propose (or
  not) the relay-posture change to Joey with data").
- Must not auto-flip any kill switch (`COMMUNITY_SCAN_ENABLED`,
  `COMMUNITY_CRAWL_ENABLED`) — findings and recommendations only.
- Must not treat near-zero corpus numbers as a content-engine failure if
  `COMMUNITY_CRAWL_ENABLED` was never turned on — that's expected, not a bug.

## Scheduling

This review is scheduled as a dated follow-up rather than run today because
there is no 30-day window of production data yet. Mechanism: a Hermes cron
job (`community-engine-30-day-review`, one-shot, fires 2026-10-07) that
pulls the queries above from Supabase, drafts the findings against this
document's format, and opens a new kanban card on board `swift2` titled
"Community Engine 30-day review — results" with the data and
recommendations, for Joey/Wyatt to read. This card (P3-2) is complete once
that job is scheduled and this methodology is locked down; the actual
findings land in that follow-up card, not here.
