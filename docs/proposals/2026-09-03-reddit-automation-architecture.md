# Reddit automation architecture — data ingestion, storage, processing, post-draft generation

**Status: architecture doc, no code changes.** Written to satisfy today's goal
(`GOAL.md`, set by Joey 2026-09-03 in #long-live): "Define the automated
Reddit system architecture." Done when a written doc exists covering
ingestion (via home-relay), storage, processing, and post-draft generation
for Reddit. This is that doc — implementation is follow-up work, tracked as
GitHub issues per `CLAUDE.md`'s two-funnel rule.

This doc **reuses two systems that already exist and already work** rather
than inventing new plumbing:

1. The **News/Current pipeline** (`apps/worker`, `docs/proposals/2026-07-07-
   news-pipeline-architecture.md`) — ingest → cluster → classify → verify →
   extract → `current_item`/`fan_signal`/`live_theory`. It already has a
   Reddit RSS adapter (`apps/worker/src/sources/reddit-rss.ts`,
   `reddit_rss` source type) and an extract-stage prompt that already
   accepts Reddit comment context (`ExtractCommentThread`,
   `docs/decisions.md` 2026-08-25).
2. The **social posting pipeline** (`docs/marketing/social-strategy.md`,
   `docs/agents/growth.md`) — `social/queue/*.json` → `social-poster.yml`.
   Today it drafts and posts. Today's goal only requires it draft; queue
   items already have a `scheduledAt`-gated ship step we simply don't feed
   Reddit content into yet.

The new work is: (a) a second Reddit ingestion lane through home-relay for
what RSS can't reach (comment-heavy threads, search, specific subs the RSS
adapter isn't polling), (b) wiring `current_item`/`fan_signal` rows into
Tree/Growth's drafting judgment, and (c) making sure Reddit drafts land as
**queued for human review**, never auto-posted — this week's `GOAL.md`
`done_when` is explicit: "generated and queued for human review (not
auto-posted)."

---

## 1. Data ingestion

Two lanes, not one — they cover different Reddit failure modes and neither
alone is sufficient.

### 1a. RSS lane (existing, scheduled, zero-auth) — the steady-state source

`apps/worker/src/sources/reddit-rss.ts` already implements this:

- Per-subreddit `https://www.reddit.com/r/<sub>/new/.rss` or `/top/.rss?t=day`,
  fetched with a descriptive `User-Agent` (bare/curl UA gets a 403; this one
  gets 200 — confirmed 2026-08-24).
- Feature-flagged (`REDDIT_RSS_ENABLED`), backs off silently on 429, never
  retry-storms.
- Returns title/permalink/published_at + a **hashed** author handle. No
  self-post body (Reddit's Atom `<content>` is the *full* post body, not a
  teaser — dropped by design, not truncated). No score field (RSS doesn't
  expose it).
- Comment bodies: `fetchPostComments()` in the same file appends
  `.rss?limit=N&sort=top` to a post's own permalink, which returns the post
  plus up to `MAX_COMMENTS_PER_POST` (15) top comments, hashed authors, real
  bodies. In scope per `docs/decisions.md` 2026-08-25 ("Reddit fan-source
  posture now includes comment bodies"). Called selectively, only for posts
  that already clustered into a real story — not per-item at ingest.
- Runs inside `news-worker.yml`, **every 4 hours** (`10 1,5,9,13,17,21` UTC),
  scheduled on GitHub's infra — this is Tier 1 (deterministic Action) per
  `docs/AUTOMATION.md`'s three-tier model. No VPS IP involved; GitHub
  Actions runners are not IP-blocked the way this sandbox is.

**What's missing today, and the fix:** `news_source` needs `reddit_rss` rows
actually seeded (subreddit + sort per row — the adapter is live but the
source list may be sparse or empty; verify at implementation time with
`select * from news_source where source_type = 'reddit_rss'`). Candidate
subs, in priority order: `r/TaylorSwift` (top-day + new), `r/GaylorSwift` if
in scope per existing content policy, era-specific subs if they exist,
`r/popheads` filtered for Taylor mentions. This is a data-seeding task, not
an architecture change — same migration pattern as
`20260719180000_news_sources_seed.sql`.

### 1b. Home-relay lane (new, on-demand/scheduled-light) — what RSS can't reach

RSS gives titles + top-15 comments per polled post. It does **not** give:
search results, full comment trees beyond 15, threads outside subs already
seeded, or content behind Reddit's stricter `.json`-endpoint block (which
403s from *any* IP, RSS or not — module header in `reddit-rss.ts` already
documents this; the `.rss` trick is the only endpoint proven to work).

The `home-relay` skill (`docs/decisions.md`, confirmed 2026-09-01) is the
existing, proven bypass for the harder cases:

- Routes through the operator's home PC over Tailscale (VPS `100.116.20.103`
  → home PC `100.74.255.21:8888`), because Reddit hard-blocks this
  environment's own datacenter IP on every endpoint except the RSS one.
- For full comment trees / arbitrary threads: fetch
  `https://www.reddit.com/svc/shreddit/comments/r/<sub>/t3_<id>` (Reddit's
  own internal server-rendered partial — the one endpoint proven to return
  real HTML with full comment bodies, confirmed 2026-09-01 on a real
  r/TaylorSwift thread) via the relay, then parse with the documented regex
  extractor (no browser needed).
- **Current usage posture per the skill file: "operator-directed reads (a
  specific thread, on request) — not scheduled/automated mass collection."**
  This is the load-bearing constraint for this architecture: home-relay is
  explicitly NOT a bulk-scraping tool today (legal precedent cited: 2025
  SDNY case against commercial-scale unlicensed scraping via proxy
  infrastructure).

**Architectural decision this doc makes:** home-relay stays **desk-triggered,
not cron-triggered**, for Reddit. A Tier 2 desk routine (Tree, Growth, or a
new dedicated one — see §3) may use it a bounded number of times per run
when the RSS lane's data is too thin for a specific story that's already
worth pursuing (e.g., RSS surfaced a hot post but not the discussion driving
it). It does **not** become a new always-on Tier 1 Action polling home-relay
on a fixed cron — that would cross from "one thread, one ask" into
"scheduled mass collection" against the skill's own stated boundary, and
depends on the operator's home PC being on, which a cron job can't verify or
recover from. If continuous full-tree coverage becomes a real product need,
that's a `docs/decisions.md` entry (new automated-scraping posture) for
Joey, not something this pass invents by default.

### Ingestion summary table

| Lane | Trigger | Scope | Reliability | Cost |
|---|---|---|---|---|
| RSS (`reddit-rss.ts`) | `news-worker.yml`, every 4h | New/top posts + top-15 comments, per seeded subreddit | High — GitHub runners aren't IP-blocked | Zero |
| Home-relay | Desk-triggered, bounded per run | Full comment trees, search, unseeded threads | Depends on operator's home PC being reachable | Zero (uses existing skill) |

---

## 2. Storage

**No new tables.** The knowledge-engine schema
(`supabase/migrations/20260901000000_knowledge_engine.sql`) already models
exactly the shapes Reddit content produces:

- **`current_item`** — a single observable event (a Reddit post breaking real
  news: a leak, a confirmed detail, something with a truth value). Reddit
  posts map here when the extract stage's `record_knowledge` tool call
  returns `kind: "current_item"` or `"both"`.
- **`fan_signal`** — aggregate discussion pattern, no single confirmable
  event ("a popular thread argues X", theory chatter, Easter-egg
  interpretation). This is the primary shape for most Reddit content —
  fandom discussion is exactly what `fan_signal` was built for.
  `fan_signal.platform` already exists as a plain text column; Reddit rows
  set it to `'reddit'`, `community` to the subreddit name.
- **`live_theory`** — when `fan_signal.theories` surfaces a genuine named
  theory, it links via `theory_ids`.
- **`knowledge_doc`** — both tiers project into this one retrieval index
  (`kind` prefixed `current:`/`signal:`/`ltheory:`), full-text searchable via
  the existing `tsv` column. This is what a drafting run queries.

**Privacy is already enforced at the schema/prompt layer, not something this
pass has to add:** `hashHandle()` (never raw usernames past ingestion),
`redline_ok` gating every read policy, the extract prompt's explicit
"aggregate voice only... never name, quote, closely paraphrase, or identify
an individual commenter" rule for `fan_signal`, and the location-ladder cap
inherited from `docs/content-ops/privacy-redlines.md`.

**What's new:** nothing in the schema. The only storage-adjacent addition is
making sure Reddit's `news_source.config.subreddit` rows exist (§1a) so rows
actually flow into `current_item`/`fan_signal` through the pipeline that
already writes them.

---

## 3. Processing

Reuses the News/Current pipeline's existing five stages
(`apps/worker`, `docs/proposals/2026-07-07-news-pipeline-architecture.md`),
unchanged in shape:

```
ingest (reddit-rss.ts)
  -> cluster (cross-outlet similarity; a lone Reddit post can cluster with
     itself if no cross-outlet match exists — proposal's clustering already
     handles single-item clusters)
  -> classify (rule-based fallback if OPENAI_API_KEY unset; still runs)
  -> verify
  -> extract (Haiku 4.5, one call per new cluster, forced record_knowledge
     tool call, screened through packages/shared/src/redline.ts)
       - for clusters whose only/best source is Reddit and comment context
         would sharpen the call, run fetchPostComments() first and pass an
         ExtractCommentThread (already a defined type, apps/worker/src/
         extract/types.ts) into the prompt
  -> write_knowledge.ts -> current_item / fan_signal / live_theory rows
     -> projected into knowledge_doc
```

**What's new here:** wiring `ANTHROPIC_API_KEY` into `news-worker.yml`'s env
block so the extract stage actually runs on schedule (per `apps/worker/
README.md`, this is coded but deliberately not yet wired — "that's a later
stage's job"). Today's goal makes this the later stage. Everything else in
the processing chain is unchanged; Reddit items flow through the exact same
5 stages as RSS/Google News items, because `reddit_rss` is already a
first-class `source_type` in `apps/worker/src/sources/registry.ts`.

**Judgment layer (Tier 2, per `docs/AUTOMATION.md`'s three-tier model):** the
extract stage's job is to decide *what's worth storing*, not *what's worth
posting*. That second judgment call — is this `current_item`/`fan_signal`
worth a social post, and what does the post say — belongs to Tree/Growth
(§4), which already reads real data and writes editorial judgment on top of
it, per the same "freshness on Actions, judgment on routines" split that
governs every other lane in this repo.

---

## 4. Post-draft generation

**Reuses the existing queue-and-ship pipeline exactly as-is; adds one new
input source to it.** No new posting mechanism, no new schema.

- Growth's daily drafting run (`docs/agents/growth.md`, daily 11:00 UTC)
  currently drafts from Tree's `social/calendar.md`. It gains a second read:
  query `knowledge_doc` (or `fan_signal`/`current_item` directly) for
  fresh, unposted, `redline_ok = true` Reddit-sourced rows since its last
  run.
- A Reddit-sourced row that clears the bar (real signal, not noise; passes
  the #36/Clownbot blocklist same as every other draft; sourced, never
  invented) becomes a **heartbeat-shaped queue item** — same
  `social/queue/*.json` schema, same IG+X sibling-pair rule from
  `social-strategy.md` §2, same voice rules. A likely new `campaign` family:
  `heartbeat:reddit-pulse` or similar (Tree's call at planning time — this
  doc doesn't prescribe copy, only the architecture).
- **Media**: Reddit content is almost never going to carry a usable photo of
  Taylor. The existing media ladder already has an answer for this — rung 3,
  "no image at all," X-only, text-only tweet. IG still requires media (ladder
  is unchanged by this work), so an IG sibling for a Reddit-sourced item
  needs the same Taylor-photo sourcing as any other IG post, or the item
  runs X-only under the sibling rule's `Single-platform exception` escape
  hatch — that's a legitimate, already-defined path, not a new one.

### The hard requirement: queued for human review, not auto-posted

This is where this week's Reddit lane **differs from the existing
autoposting posture** (`docs/agents/growth.md` rail 2/3: "There is no
per-item human approval step any more" for the existing queue). `GOAL.md`
is explicit that Reddit (and Facebook) draft posts this week are "generated
and queued for human review (not auto-posted)" — a deliberate, narrower
posture than the standing autopost policy, because these are new,
higher-novelty-risk source lanes without a track record yet.

Two ways to implement that without touching `social-poster.yml`'s core
mechanics (recommend the first — smaller diff, reuses more):

1. **A held status on the queue item itself.** Add an optional
   `requiresApproval: true` (or reuse the already-existing but currently
   inert `approvedBy`/`approvedAt` provenance fields — `growth.md` §"The
   automated posting pipeline" notes these "survive as optional provenance...
   and are no longer a gate" for the standing pipeline; this lane would be
   the one place that makes them a gate again, deliberately, scoped to
   `source: 'reddit'` items only). `post-queue.mjs`'s `isDue` check gains one
   new condition: an item with `requiresApproval: true` and no `approvedAt`
   is never due, no matter what `scheduledAt` says. A founder approves by
   setting `approvedAt` (a trivial one-line PR edit, or a small approval
   script/GitHub Action `workflow_dispatch` that flips it) — the same
   "paste/tick" ergonomic already used for the Human Reach lane in
   `social-strategy.md` §1(e).
2. **A separate queue directory** (`social/queue-pending-review/`) that
   `social-poster.yml` never reads, promoted into `social/queue/` by a human
   or an explicit approval action. More isolation, more moving parts — only
   worth it if approach 1's single-flag gate proves too easy to bypass by
   accident in review.

Recommend **(1)**: smaller surface, reuses the schema and the poster's
existing `isDue` gate exactly where duplicate-prevention and freeze logic
already live, and the `SOCIAL_FREEZE` kill switch still covers it since it's
still ultimately posted through `social-poster.yml`.

### Founder review ergonomics

Same "paste-ready, ≤5 min" discipline as the existing Human Reach lane
(`social-strategy.md` §1(e)): drafts awaiting Reddit-lane approval surface in
the Founders' Brief under a new "Reddit drafts awaiting review" bullet
(Marjorie already has a "Social queue" section — extend it, per
`docs/agents/growth.md`'s founder-notification-bucket rule: "reuse the
existing system — never invent a new channel"), with a direct link/count so
Joey can approve in the existing 15-minutes-a-week budget, not a new inbox.

---

## 5. What this doc deliberately does NOT decide

Per `CLAUDE.md` rule 6 ("expensive-to-reverse calls... `docs/decisions.md`
BEFORE implementation") and rule 1 ("plan before building... no sign-off
gate needed" for the reversible parts) — the items below are implementation
details for whoever picks up the follow-up issues, not settled here:

- Exact subreddit seed list and polling cadence tuning — data decision, not
  architecture.
- Exact `campaign` family naming for Reddit-sourced heartbeat posts — Tree's
  call at calendar-planning time.
- Whether Reddit review-gating (§4) ever gets promoted to the same
  no-human-approval posture as the rest of the pipeline — that's a real
  policy change requiring its own `docs/decisions.md` entry once there's a
  track record, not a default this doc sets.
- Whether home-relay's "no scheduled mass collection" boundary should ever
  be loosened for Reddit specifically — flagged above as a decision for
  Joey if/when RSS's 4-post-window/15-comment-cap coverage proves
  insufficient in practice; not assumed here.

## 6. Summary diagram

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│ RSS lane (Tier 1,        │     │ Home-relay lane (Tier 2,      │
│ news-worker.yml, 4h)     │     │ desk-triggered, bounded)      │
│ reddit-rss.ts            │     │ home-relay skill              │
└────────────┬─────────────┘     └───────────────┬────────────────┘
             │  NormalizedNewsItem                │  full comment tree /
             │  (+ optional comments)              │  search results, on demand
             ▼                                     ▼
      ┌───────────────────────── processing (apps/worker) ──────────────────────┐
      │ ingest → cluster → classify → verify → extract (Haiku 4.5,               │
      │ record_knowledge tool, redline screen)                                    │
      └───────────────────────────────┬────────────────────────────────────────┘
                                       ▼
                    ┌───────────────────────────────────┐
                    │ storage: current_item / fan_signal /│
                    │ live_theory → knowledge_doc          │
                    │ (existing schema, no changes)        │
                    └───────────────────┬───────────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
                    │ Growth daily draft run reads        │
                    │ Reddit-sourced rows, drafts IG+X     │
                    │ sibling pair                          │
                    └───────────────────┬───────────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
                    │ social/queue/*.json,                 │
                    │ requiresApproval: true (Reddit-only) │
                    └───────────────────┬───────────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
                    │ Founders' Brief: "Reddit drafts       │
                    │ awaiting review" — Joey approves       │
                    │ (sets approvedAt)                      │
                    └───────────────────┬───────────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
                    │ social-poster.yml ships it            │
                    │ (existing mechanism, unchanged)        │
                    └───────────────────────────────────┘
```
