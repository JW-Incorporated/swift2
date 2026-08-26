# Long Live knowledge engine — one pipeline, one store, every surface

**Post-build status note (added PLAN.md Stage 13, docs/decisions.md
2026-08-23 "Knowledge engine kickoff").** This proposal was built overnight
2026-08-23/24, 11 of its 13 PLAN.md stages plus a security fix and 3 doc
reconciliations, across 12 merged PRs — this file itself was never committed
until this note landed with it. Full shipped-vs-deferred picture:

- **Shipped:** the schema (§3 — `current_item`/`fan_signal`/`live_theory`/
  `egg_ledger`/`symbol_lexicon`/`technique`/`knowledge_doc`, `technique`
  intentionally empty); the fixed worker + real seeded sources (§4.1); the
  extract stage (§4.5, Haiku); the site rendering the current tier live
  (§6); free fan-adapters — Bluesky, Reddit-RSS (interim), Tumblr, Facebook
  scaffolding (§7 free layer); Theories/eggs + Clownbot boards reading live
  data (§8); the Content Shift/Rumor Desk promotion queues (§9); Clownbot's
  DB-backed retrieval library (§10) and its bounded agent loop (§11, the
  product — three review rounds, `DEBUG.md` in the repo's history); sessions/
  memory scaffolding, flagged off pending an account toggle (§12); the eval
  harness + freshness SLO (§7 eval / issue 15). Full stage-by-stage detail:
  `STATE.md` (repo root, local working file, not committed).
- **Deferred, money/account-gated (not attempted):** the paid licensed news
  API tier — GNews/Perigon (§7 paid layer) — **not needed**, the free GNews
  tier (100 req/day) was chosen and engineered around with a hard daily cap
  instead; the `tumblr` adapter's account-gated pieces beyond what the two
  granted keys unlock; §13's `x-recent` (pay-per-use X), `ig-official`, and
  `site-diff` adapters; Reddit's OAuth adapter, pending Data API approval
  (`reddit-rss` disables itself in the same PR once that lands,
  `HUMAN-ACTIONS.md` #15); the embedding vendor's actual pipeline — OpenAI
  `text-embedding-3-large` was picked (`HUMAN-ACTIONS.md` #12) but the
  pipeline that populates `knowledge_doc.embedding` and computes cosine
  scores isn't built, so retrieval stays FTS-only.
- **Blocked on a founder action, not a decision:** the 9 migrations this
  build wrote are unapplied against production (no `apps/worker/.env`
  reachable from any worktree, `HUMAN-ACTIONS.md` #14) — this also means
  `create extension vector` was never actually verified against this
  Supabase project, so the schema shipped without the `vector(1024)` column
  as a safe default, not a tested one.
- **Never attempted (out of scope by design):** authoring real `technique`
  records — the proposal itself (and `docs/decisions.md` 2026-08-23) is
  explicit this needs a frontier-model session with a human, not an
  autonomous run.

Docs updated to match this shipped state: `docs/longlive-experience.md` §7,
`MAP.md`, `docs/content-ops/intake.md`, `docs/content-ops/rumor-pipeline.md`
§ Data model, and the new `CLOWNBOT.md` (repo root). One correction found
while writing those: §3's line planning to migrate `clownbot-lore.ts`'s 8
items into `current_item`/`live_theory` and retire the file did **not**
happen — `clown-index.ts` (Stage 9) deliberately kept it as the documented
no-DB fallback, unmodified. See `MAP.md`'s Clown bot section for the real
state.

**Status:** proposal v2, 2026-08-23. Supersedes
`2026-08-23-clownbot-v3-live-knowledge.md` (fold it into this; don't keep both).
Author: Fable, from `main` @ `149a7f8`, the live site, Vercel, the public
Actions history, and the `news-digest` branch.
**Suggested path:** `docs/proposals/2026-08-23-knowledge-engine.md`.
**Also folds in:** Joey's `2026-08-16-clownbot-methodology-brief.md` — its
methodology layer (§3.4b, §7), scope audit (§7), acceptance cases and coverage
audit (§7 eval), maintenance doc (issue 16), and its don'ts. Note the brief
predates the 8/19 kit retirement: `STATE.md`/`PLAN.md` no longer exist (task
state is Issues/PRs), and its "Codex off since 8/14" ruling should be
re-checked against `CLAUDE.md` rule 3 as written today.

---

## 0. The diagnosis, in numbers

Joey's instinct is right, and it's worth saying precisely *where* it's right,
because half of the machinery he wants already exists and runs on time.

**What runs, and runs healthy (public Actions history, 2026-08-23):**

| Workflow | Cadence | Runs | Last | What it does |
|---|---|---|---|---|
| `news-worker.yml` | every 4h | 237 | 21:32 today, green | 3 publisher RSS tag feeds + Google News RSS → `news_raw_item`/`news_story` in Supabase → `news-candidates.md` digest (81 stories in the last 72h) |
| `appearance-discovery.yml` | daily | 11 | today, green | ~15 YouTube channel RSS feeds, zero-LLM relevance filter → files an `intake` issue per new video |
| `watchdog.yml` | hourly | 459 | green | runner liveness |
| `social-poster.yml` | ~every 30m | 714 | green | posts the social queue |
| `growth-snapshot.yml` | daily | 39 | green | metrics |

**So ingestion of *news* exists and is reliable.** That is not the gap.

**Where it stops:** ingestion produces a *candidate digest for an agent to
read*. Turning a candidate into something a reader (or Clownbot) can see
requires an authoring routine — Content Shift, max 2 items/run, 2 runs/day
by design — to open a PR that auto-merges and redeploys. Those routines are
account-bound Claude sessions, and as of this week they are **disabled,
mid-migration** (issue #2258: 23 routines recreated on Joey's account,
disabled; runner prompts backfilled from Wyatt's export on 8/22).

The effect is visible in the seed file for the current era:

| Month | New moments authored |
|---|---|
| Jun 2026 | 5 |
| Jul 2026 | 22 |
| Aug 1–19 | 24 (~1.3/day) |
| **Aug 20–23** | **0** — while the digest logged 81 stories |

And in what the digest itself admits at the top of every run: cross-outlet
clustering doesn't work (`source_count` is 1 almost everywhere, same event
repeats under different headlines), and most rows come from Google News
with an opaque redirect URL that can't be cited — so the agent has to
re-find the publisher link by hand for every item.

**And on the "same database" question — the honest answer is that today the
site's database is git.** Supabase holds a Vault mirror (`month_item` etc.)
and the news tables, but the reader at `/` renders from
`content-vault.generated.ts` and friends, compiled from `supabase/seed/**`
at build time. Clownbot's index is built from the *same generated files*.
So the site and the bot already share one source; the source just updates
about once a day, through an agent, and covers only what an agent chose to
author. Nothing from fan platforms enters it at all (the Reddit/Tumblr/
Bluesky/X research from July was never wired; YouTube Data API was rejected
on 8/12 in favor of keyless RSS).

**Restated as the thing to fix:** the site has a *detection* pipeline feeding
an *authoring* bottleneck. It needs an *ingestion* pipeline feeding a
*store* that every surface reads, with authoring demoted to *promotion*.
That is exactly the "two worlds" split `docs/architecture.md` and
`rumor-pipeline.md` already describe — Vault (curated, slow) vs. Current
(live, polled, labeled). The Current world was designed and never built.
Build it once, and Clownbot, the era feed, the Threads board, and the
mobile app all read it.

---

## 1. The principle

> **One store, two tiers, every surface.**
> The **Vault** is what we know. The **Current** tier is what is happening
> and what fans are saying about it, labeled with how well we know it.
> Every reader-facing surface renders both, visibly distinct. Nothing
> enters the Vault without the existing sourcing bar; nothing in Current
> ever pretends to be Vault. Clownbot never looks outside this store.

Consequences:

- **Ingestion is infrastructure, not a routine.** It runs on GitHub Actions
  with API keys as secrets, deterministic wherever possible, capped in a
  DB table where a model is involved. It does not depend on anyone's Claude
  account being logged in.
- **Authoring becomes promotion.** Content Shift / Rumor Desk stop reading
  a markdown digest and start reading `current_item` rows already
  clustered, sourced, redline-screened, and summarized in our words. Their
  job shrinks to judgment: *is this Vault-worthy, which era, what's the
  confidence.* Same PR path, same auto-merge, same gates.
- **The reader sees today.** The current era's feed shows Current rows in
  the dashed "unconfirmed" treatment the rumor pipeline already built
  (`MomentDetail.tsx:142`), so a fan visiting on Aug 23 sees Aug 23 — not
  the last thing an agent had time to write on Aug 19.
- **Clownbot is a reader with tools.** It queries the same tables the
  page queries, plus precedent and symbol indexes derived from them.

---

## 2. The target flow

```
 SOURCES (adapters, apps/worker/src/sources/)
   rss (exists) · google_news (exists, see §4.2) · youtube-rss (exists, in appearance-discovery — MOVE here)
   tumblr · bluesky · x-recent (from: official + update accounts) · ig-official (oEmbed) · site-diff (taylorswift.com)
   reddit (behind Data API approval)
        │  every 4h, one-shot, GitHub Actions: knowledge-engine.yml
        ▼
 INGEST  (deterministic)   normalize → resolve real publisher URL → cross-outlet cluster (FIXED) → dedupe vs 7d
        ▼
 EXTRACT (Haiku, capped)   one call per cluster → { current_item | fan_signal | live_theory | skip } in OUR words
        ▼
 SCREEN  (deterministic)   packages/shared/src/redline.ts (screenTopic + location ladder) — fail = stored, never served
        ▼
 STORE   (Supabase)        current_item · fan_signal · live_theory · symbol_activity · knowledge_doc(+embedding)
        │
        ├──► SITE   /  current era feed renders current_item (labeled) · Threads/eggs board reads live_theory
        ├──► CLOWNBOT  retrieval over knowledge_doc + precedents/symbols/chatter tools
        ├──► MOBILE   same packages/core queries
        └──► PROMOTE  Content Shift / Rumor Desk read current_item queue → author Vault seed → PR → auto-merge → deploy
                       (canonical sync writes Vault back into knowledge_doc; the current_item is marked promoted)
```

Two clocks: the Current tier updates every 4 hours with no human; the
Vault updates when a promotion PR merges. The reader and the bot see both.

---

## 3. Data model

One migration, `supabase/migrations/20260901000000_knowledge_engine.sql`.
`create extension vector`. RLS on; service role writes; the web app reads
through `packages/core` with the anon key and read-only policies scoped to
`redline_ok = true and (expires_at is null or expires_at > now())`.

```sql
-- 3.1 CURRENT TIER — the generalized "sighting": anything observable that happened.
-- This is the row the era feed renders AND the row Content Shift promotes.
create table current_item (
  id             uuid primary key default gen_random_uuid(),
  story_id       uuid references news_story(id),        -- the cluster it came from (may be null for social-only)
  observed_on    date not null,
  era_id         text not null,                          -- the current/ongoing era per intake.md
  category       text not null check (category in ('release','music','fashion','tour','relationship','business','award','sighting','statement','website','merch','lore')),
  tags           text[] not null default '{}',           -- the 5 ContentTags; drives FilterBar (§5.8 of longlive-experience)
  headline       text not null check (char_length(headline) <= 140),
  summary        text not null check (char_length(summary) <= 400),   -- matches the seed snippet cap
  detail         text not null,                          -- 1-3 sentences, our words, never past `status`
  status         text not null default 'reported' check (status in ('rumor','reported','confirmed','debunked','faded')),
  confidence     text not null,                          -- the existing Confidence union from types.ts, serialized
  source_tier    text not null check (source_tier in ('official','established','fan','unverified')),
  sources        jsonb not null,                         -- [{name,url,tier}] >= 1, publisher URLs only (never news.google redirects)
  location_level text check (location_level in ('region','city','venue')),
  image_url      text,                                   -- hotlink from an allowlisted host or null; never rehosted
  social_post    jsonb,                                  -- {platform:'instagram',shortcode,postedOn} — existing MomentSocialPost shape
  symbols        text[] not null default '{}',
  entities       text[] not null default '{}',
  heat           real not null default 0,                -- corroboration × recency × fan volume
  promoted_to    text,                                   -- Vault moment id once promoted; row then hidden from feed, kept for the bot's provenance
  last_checked_on date not null default current_date,
  expires_at     timestamptz not null default now() + interval '90 days',
  redline_ok     boolean not null default false,
  created_at     timestamptz default now(), updated_at timestamptz default now()
);
create index on current_item (era_id, observed_on desc) where redline_ok and promoted_to is null;
create index on current_item using gin (symbols);

-- 3.2 What fans are saying — aggregate only, never an individual.
create table fan_signal (
  id uuid primary key default gen_random_uuid(),
  window_start timestamptz not null, window_end timestamptz not null,
  platform text not null, community text not null,
  topic text not null check (char_length(topic) <= 120),
  summary text not null,                                 -- aggregate voice: "a popular thread", "dozens of posts"
  volume int not null, heat real not null,
  stance_mix jsonb not null default '{}',
  symbols text[] not null default '{}',
  theory_ids uuid[] not null default '{}',
  current_item_ids uuid[] not null default '{}',         -- what the chatter is *about*
  sample_urls jsonb not null default '[]',               -- ≤3 public-thread permalinks
  expires_at timestamptz not null default now() + interval '30 days',
  redline_ok boolean not null default false
);

-- 3.3 Theories in play (fan / bot / site). The Threads-mode "eggs" board reads this.
create table live_theory (
  id uuid primary key default gen_random_uuid(),
  name text not null, claim text not null,
  first_seen_on date not null, last_seen_on date not null,
  origin text not null check (origin in ('fan','bot','site')),
  status text not null default 'rumor',
  outcome text not null default 'pending',               -- TheoryOutcome union
  evidence_ids text[] not null default '{}',             -- knowledge_doc ids
  symbols text[] not null default '{}',
  heat real not null default 0,
  resolution jsonb,                                      -- RumorResolution shape; REQUIRED when outcome != pending
  promoted_to text,                                      -- theories seed slug once promoted
  expires_at timestamptz not null default now() + interval '60 days'
);

-- 3.4 Precedents + symbols (built from the Vault by the canonical sync; grown by promotion)
create table egg_ledger (
  id text primary key,
  hint_doc_id text, reveal_doc_id text,
  hint_date date not null, reveal_date date,
  lag_days int generated always as (reveal_date - hint_date) stored,
  mechanism text not null,                               -- number|color|wardrobe|caption|set_design|lyric_callback|website|merch|social_post|countdown|interview|other
  symbols text[] not null default '{}', era_id text,
  confirmed boolean not null default false,
  outcome text not null, summary text not null, sources jsonb not null default '[]'
);
create table symbol_lexicon (
  key text primary key, label text not null, aliases text[] not null default '{}',
  category text not null, linked_eras text[] not null default '{}', note text not null default ''
);
-- 3.4b THE METHODOLOGY LAYER (from the 2026-08-16 brief, Task 1) — patterns, not instances.
-- "How Taylor plants eggs." Seeded from a curated file (supabase/seed/techniques.mjs), projected
-- into knowledge_doc kind='technique', and the axis egg_ledger.mechanism is keyed to.
create table technique (
  key          text primary key,           -- 'numerology','color_language','capitalization_cipher','anagram_wordplay',
                                           -- 'visual_callback','timing_cadence','long_game','wardrobe_signal','website_egg','caption_math'
  label        text not null,
  description  text not null,              -- our words: what the technique is and how she uses it
  reliability  text not null check (reliability in ('signature','frequent','occasional','rare')),
  recurrence_test text not null,           -- "what would count as evidence of it recurring" — the bot quotes this
  example_ids  text[] not null default '{}',-- >=2 knowledge_doc ids from the EXISTING corpus; never invented (brief's rule)
  linked_symbols text[] not null default '{}',
  sources      jsonb not null default '[]'
);
create materialized view symbol_activity as
  select unnest(symbols) as symbol, date_trunc('week', observed_on) as week, count(*) as n
  from current_item where redline_ok group by 1,2;

-- 3.5 The one retrieval index. Both tiers project into it.
create table knowledge_doc (
  id text primary key,                                   -- moment:* theory:* egg:* track:* current:* signal:* ltheory:*
  kind text not null, tier text not null check (tier in ('vault','current')),
  title text not null, text text not null, date date, recency_date date,
  open boolean not null default false, status text not null, source_tier text not null,
  sources jsonb not null default '[]', era_id text,
  symbols text[] not null default '{}', entities text[] not null default '{}',
  embedding vector(1024),
  tsv tsvector generated always as (to_tsvector('english', title || ' ' || text)) stored,
  expires_at timestamptz, redline_ok boolean not null default false,
  updated_at timestamptz default now()
);
create index on knowledge_doc using hnsw (embedding vector_cosine_ops);
create index on knowledge_doc using gin (tsv);

-- 3.6 Chat persistence, predictions, caps (unchanged from the v1 doc)
-- clown_conversation, clown_turn, bot_prediction, clown_pinned_theory, usage_daily(scope)
```

`clownbot-lore.ts` (8 items) is migrated into `current_item`/`live_theory`
by a one-off script and retired. The Vault seeds stay exactly where they
are; `scripts/sync-clown-knowledge.mjs` (in `sync:content`) projects them
into `knowledge_doc tier='vault'` and builds `egg_ledger` from `EGG_NODES`,
`CLUE_PAIRS`, and confirmed theories.

---

## 4. The ingestion engine (fold, don't fork)

Everything below lives in `apps/worker` — it *is* the existing news worker,
extended. `news-worker.yml` is renamed `knowledge-engine.yml`;
`appearance-discovery.yml` is folded in as an adapter (its channel list and
relevance filter move to `sources/youtube-rss.ts`; it stops filing issues
and starts writing `news_raw_item`s). Cadence stays `10 1,5,9,13,17,21`.

### 4.1 Fix the two known defects first (issue 2, before any new source)

1. **Cross-outlet clustering.** The digest's own caveat: dedupe doesn't
   cluster across outlets. Replace `similarity_key` (normalized-title
   shingles) with: canonical URL match **or** ≥0.85 cosine on a cheap
   embedding of `title+snippet` within a 48h window **or** shared named
   entities + date. Recount `source_count` and `verification_status`
   from the merged cluster (the `recomputeVerification` path already
   exists). Test: the three "designers dreaming up wedding gowns" headlines
   in today's digest become one story with `source_count 3`.
2. **Resolve Google News redirects to publisher URLs** at ingest
   (follow the redirect, store the final `https://<publisher>/...`, set
   `outlet_name` from the domain, re-tier from a domain→tier map). Until a
   URL is resolved, the item is `unverified` and cannot be cited by any
   surface — that's the current rule, now enforced in data instead of in
   a paragraph an agent has to read.

### 4.2 Replace Google News — with a layered "everything" feed, not one API

Decision (Joey, 2026-08-23): drop Google News RSS. The replacement is three
layers, because no single API gives "everything" and each layer covers the
others' gaps:

1. **Publisher tag feeds (backbone, free, citable).** Grow 3 → ~15: People,
   ET, THR, Vogue, Elle, Harper's, WWD, The Tennessean, KC Star, NYT
   (Style/Arts search RSS), Guardian tag, BBC topic, Pitchfork, Stereogum,
   Deadline. Verify each like the 7/19 seed did (200, valid RSS, ≥10 items,
   channel title confirms the tag). `established` tier, publisher URLs.
2. **One licensed news API for recall (the Google News replacement).**
   Recommendation: **GNews** (Business tier, ~$84–108/mo, sources ~60k
   outlets, commercial use allowed, simple `q="taylor swift"` polling) as
   the default; **Perigon** if we want entity/event clustering done for us
   (it collapses 200 articles about one event into one story with
   mentions, which is exactly the defect in §4.1 — pricing is usage-based,
   quote it). Avoid NewsAPI.org (no commercial plan under $449/mo, no
   article bodies) and Currents/Mediastack (thin coverage). Whatever is
   chosen: `unverified` tier until the publisher domain is resolved to a
   known outlet in the domain→tier map, exactly the current rule. Log the
   pick in `decisions.md` with the monthly cost.
3. **Official surfaces polled directly** (these are where eggs actually
   drop and no news API sees them first): `taylorswift.com` + store diff,
   Taylor Nation's and Taylor's own accounts via X `from:` queries and IG
   oEmbed, the official YouTube channel RSS, Spotify/Apple artist pages
   (canvas/playlist changes — a known egg surface), Amazon/UMG store pages
   for new listings. Deterministic diffs, `official` tier, no model needed
   to notice "something changed."

Recall test for the migration: over one week, ≥95% of items the Google
News feed would have surfaced (kept running in shadow, not stored) appear
via layers 1–3. Then delete the `google_news` source row.

### 4.3 Adapters (in build order)

| Adapter | Source | Auth / cost | Tier | Notes |
|---|---|---|---|---|
| `rss` | publisher tag feeds (3 → ~10) | free | established | exists |
| `youtube-rss` | official + ~15 fan channels | free | official / fan | exists in appearance-discovery; move |
| `tumblr` | `/v2/tagged` for `taylor swift`, `taylor swift theory`, `easter egg`; `taylorswift.tumblr.com` | free key | fan / official | 1 |
| `bluesky` | `searchPosts` `"taylor swift"`, `"easter egg"`, `clowning` | free, no key | fan | 1 |
| `x-recent` | `from:taylorswift13 OR from:taylornation13` + 10-15 update accounts | $0.005/post, cap 400/run | official / fan | 2 |
| `ig-official` | Taylor's own posts via oEmbed on shortcodes surfaced by the update accounts | free | official | 2 |
| `site-diff` | `taylorswift.com` + store: HTML diff every run (new SKUs, countdowns, hidden strings — a classic egg surface) | free | official | 2 |
| `reddit-rss` | `r/TaylorSwift`, `r/SwiftlyNeutral`, `r/GaylorSwift`, `r/TaylorSwiftBookClub`, `r/TSwiftEasterEggs`-style theory subs via `/new/.rss` + `/top/.rss?t=day`, 1 request per feed per run, descriptive `User-Agent` | free, **interim only** — see §4.4 | fan | **1 (now)** |
| `reddit` | OAuth Data API listings (same subs, comments on top threads too) | Data API agreement — meeting this week | fan | replaces `reddit-rss` the day it's approved |
| `facebook-groups` | weekly manual export by Joey, parsed by the engine | none (manual) | fan / unverified | 1 — see §4.7 |
| TikTok | — | no compliant route | — | never |

Store per item: title, snippet ≤2,000 chars, permalink, published_at,
author-handle **hash**, platform, source tier. Never full post bodies, never
media rehosted, never a private account. Reddit comment bodies are transient
extract context under the 2026-08-25 decision reversal below; they are not
persisted as raw items.

### 4.4 Reddit via RSS — the honest interim

The 7/18 research said "do not use RSS to evade the API rules," and that
was the right default for a project with no relationship with Reddit. The
situation changed: Joey has a Data API request in flight and a meeting this
week. Interim posture, to be logged in `decisions.md` as a founder call:

- Poll only the subreddit RSS feeds Reddit itself publishes, ≤6 feeds, once
  per 4h run, with a `User-Agent` that names the site and a contact email.
  That is ~36 requests/day — a reader, not a scraper. Expect 429s; back off
  and skip, never retry-storm.
- Store post titles, permalinks, scores, and our-words summaries only. For a
  Reddit post that has already clustered into a story, its public post RSS
  may supply up to 15 top comment bodies as transient extract context. No
  usernames beyond a hash, and no commenter identity reaches the model.
  Output stays aggregate-only in `fan_signal`, with no quotes or close
  paraphrases of an individual comment.
- **Say it in the meeting.** "We're reading your public RSS at 36
  requests a day while this is pending; we'd rather be on the API." That
  is the whole point of the interim being disclosed rather than quiet.
- The adapter is a feature flag; the day the OAuth adapter lands,
  `reddit-rss` is disabled in the same PR. Public post RSS supplies bounded
  comment-thread context in the interim; OAuth remains the intended durable
  adapter.

### 4.5 Extract (Haiku 4.5, forced tool, cached system prompt)

One call per new cluster; input = cluster titles+snippets (≤6k chars),
optional Reddit comment threads for already-clustered posts (≤6k chars,
bodies only, no commenter identity), the `symbol_lexicon` keys, current era
id, today. Output tool
`record_knowledge`:

```ts
{ kind: 'current_item' | 'fan_signal' | 'both' | 'skip',
  skip_reason?: 'not_taylor'|'no_truth_value'|'redline'|'duplicate'|'stale',
  current_item?: { observed_on, category, tags[], headline, summary, detail, symbols[], entities[], location_level?, status_hint },
  fan_signal?:   { topic, summary, stance_mix, symbols[], theories:[{name, claim}] },
  redline_flags: string[] }
```

Prompt rules are lifted verbatim from `rumor-desk.md`, `privacy-redlines.md`,
and `editorial-voice-and-pipeline.md` (Taylor in running prose, never bare
"Swift", no AI-tells, snippet ≤400) so a promoted item needs a light edit,
not a rewrite. Cap: `usage_daily(scope='extract')` **150/run, 600/day**;
over cap → cluster deferred to next run, counted in the run summary.

### 4.6 Screen, write, embed, expire

- Every stored string passes `packages/shared/src/redline.ts` (the moved
  `screenTopic()` + location ladder). Fail → `redline_ok=false`, kept for
  audit, never served.
- Upsert `current_item` / `fan_signal` / `live_theory` (theory match: name
  similarity + symbol overlap ≥0.5 → bump `last_seen_on`, `heat`).
- Project into `knowledge_doc tier='current'`, batch-embed (Voyage or
  OpenAI at 1024 dims — pick in decisions).
- Refresh `symbol_activity`.
- Expiry: `current_item` 90d, `fan_signal` 30d, `live_theory` 60d from last
  activity; a `live_theory` quiet 45d → `abandoned` (the rumor-pipeline's
  own rule). Expired rows leave `knowledge_doc`; the tables keep them 1y
  for the eval set.

### 4.7 Facebook groups — the weekly manual export (Joey's task)

Facebook has no API for groups you don't administer and prohibits
*automated* collection; a member saving pages they can already see is
manual use. So this stays human, once a week, ~30 minutes, and the engine
does the rest. **Raw exports never touch the repo — it is public.** They go
to a private Supabase Storage bucket and are deleted after parsing.

**Reminder:** `.github/workflows/fb-export-reminder.yml` opens/updates one
issue every Sunday 09:00 PT titled "FB group export due — week of <date>"
with the checklist below, assigned to Joey; `watchdog.yml` alerts if no
export has landed in 9 days. It shows up in Marjorie's brief under
"Waiting on you" automatically.

**The task (per group, in a normal logged-in browser — never a bot):**
1. Open the group → sort posts by **New activity** (not Top).
2. Scroll until the posts are older than 7 days. Expand "See more" on
   anything long; don't open comments individually.
3. `Ctrl/Cmd+S` → "Webpage, Complete" → name it
   `fb-<group-slug>-<YYYY-MM-DD>.html` (slug from the checklist).
4. Repeat for each group on the checklist (start with 3–5; the checklist is
   the list).
5. Run `npm run knowledge:fb-upload -- ~/Downloads/fb-*.html` — uploads to
   the private bucket, prints one line per file, deletes the local copies.
6. Tick the checklist; close the issue. Done.

**What the engine does with it (next 4h run):** parses post text +
reaction/comment counts from the saved HTML, hashes author names, drops
anything under the redline, clusters with the rest of the week's fan
sources, and writes `fan_signal` rows with `platform:'facebook'`,
`community:'facebook:<group-slug>'`, `sample_urls: []` (private groups have
no public permalink to cite), `source_tier:'unverified'`. Never a quote,
never a name, never the raw file kept past parsing. Because it's weekly,
FB signals carry a 7-day `window_*` and feed `heat` at lower weight than
daily sources so a week-old spike doesn't read as today's.

### 4.8 Run summary → the founders brief

Each run appends one line to a `knowledge-engine` GitHub issue (updated,
not created — same pattern as appearance-discovery's ledger): items in,
clusters, extracted, screened out, deferred, per-adapter status. Marjorie's
brief already reads issues; it gets a "Knowledge engine · last 24h" row
for free.

---

## 5. What the site does with it (the part that makes the site GREAT)

This is the visible payoff and it needs **zero model calls at request time**.

1. **Current era feed renders `current_item`.** `EraSection` for the
   current era merges `current_item` rows into `mergeEraFeed` as a fifth
   `EraFeedEntry` kind (`'current'`), rendered with the dashed unconfirmed
   silhouette and a "Live · reported by <outlet>" chip. `FilterBar` works
   unchanged because rows carry `tags`. Sort by `observed_on`. Rows with
   `promoted_to` set are hidden (the Vault moment replaces them). Fetched
   via `packages/core` at request time with ISR (`revalidate: 900`) — the
   Vault stays static and CDN-cached exactly as `architecture.md`
   requires; only the current era's live slice is dynamic.
2. **The masthead line becomes true.** "Real-time updates on her whole
   life" — today it isn't. With this, the header can show "Updated 2h ago ·
   14 new this week".
3. **Threads → Theories & eggs board reads `live_theory`** alongside the
   static theories, with heat and a "fans are saying" line from
   `fan_signal`. This is the site's own clowning surface, before the bot.
4. **Clownbot board** ("What we're clowning on") reads `live_theory` by heat
   — the single biggest freshness win for the bot, zero model risk.
5. **Moment detail for a `current_item`** reuses `MomentDetail` with the
   rumor banner mandatory and a "Help us verify" link that files an
   `intake` issue — readers become the corroboration layer.
6. **Mobile** gets all of it through `packages/core` (the reason the plan
   keeps queries out of the Next.js app).

Nothing here changes the Vault's rendering, theming, scrubber, or
performance contract. It adds one labeled entry kind to one era.

---

## 6. Promotion — authoring becomes a queue

- Content Shift's step 2 (queue check) gains source (0): `current_item where
  status in ('reported','confirmed') and source_tier in ('official',
  'established') and promoted_to is null and heat >= X, order by heat`.
  The row already has our-words copy, publisher sources, tags, a
  `social_post` or `image_url`, and a redline pass. The agent's job:
  verify, place, set confidence, author the seed row (`slug`,
  `year/month/day`, `sources`), set `promoted_to`. Same PR, same auto-merge.
- Rumor Desk's lifecycle queue reads `current_item`/`live_theory` rows past
  `last_checked_on + 14d` instead of scanning seeds; resolutions require
  the citation exactly as today.
- **Resolution proposals** (deterministic, in the engine): a `live_theory`
  whose claim is ≥0.7 cosine to an `official`-tier `current_item` from the
  last 24h → the engine writes a proposed `resolution` into a review issue.
  A human ticks it; `knowledge-resolve.yml` applies it. Bots never
  self-adjudicate; that is the rumor pipeline's posture and it stays.
- Throughput ceiling moves from "2 items/run" to "as many as the engine
  screened" — the 2-item cap was protecting against *research* cost, and
  the research is now done upstream, deterministically.

When the routines are down (as now), the site and the bot still show
today; only the Vault promotion lags. That inverts the current failure mode.

---

## 7. Clownbot on top of the store

Condensed from the v1 doc; the architecture is unchanged, only the source
of truth moved *under* the site rather than beside it.

- **Retrieval** (`packages/core/src/knowledge/`): `search` (hybrid
  cosine+FTS, filters), `precedents(symbol)`, `recent(days)`,
  `chatter(topic)`, `symbolActivity(symbol)`, `track(title)`,
  `dateMath()`. All read-only over the tables in §3. **No `web_search`
  tool.** If the bot can't answer from the store, the store is what's
  wrong, and the engine's run summary is where to look. (Keep it as a
  feature flag off by default so we can measure the gap, never as the
  default path.)
- **Agent loop** in `POST /api/clown`: stage order unchanged; single call →
  bounded loop (≤6 tools, ≤20s, ≤2,500 tokens), streamed, forced
  `record_take` at the end, `investigation[]` trail rendered, predictions
  persisted. Method block in the prompt: observable → is it a pattern →
  precedents → calendar → read the room → commit with a falsifiable
  prediction.
- **Memory**: Supabase anonymous auth, server-side conversations, rolling
  summary, pinned theories, per-user caps in `usage_daily`.
- **Scoreboard**: `bot_prediction` outcomes resolved by §6.
- **Methodology-first reasoning** (folded from the 8/16 brief). `precedents()`
  is grouped by `technique`, and the prompt's method block gains the brief's
  rule verbatim in spirit: *when you speculate, reason from a retrieved
  technique doc and name the pattern with its receipts ("she's used track-5
  math this way three times: …"), never from vibes.* The `technique` table
  is the single largest quality lever after freshness — it's what turns 73
  instances into a style the bot can predict from. `egg_ledger.mechanism`
  keys to it, so every confirmed precedent also strengthens a technique.
- **Scope = retrieval, not a new gate** (brief, Task 2). The brief's audit
  worry — inputs that are merely irrelevant (homework, pasta) pass every
  blocklist and reach the model — gets a structural answer in the loop: if
  the first `search` returns nothing above threshold and no symbol/entity
  resolves, the route returns the in-character out-of-scope redirect
  **before** the model composes. The allowlist intent, free, with no new
  gate layer (the brief's warning about over-eager gates bricking sessions
  stands). Whether `OUT_OF_SCOPE_MESSAGE` is wired today is audit item 0.
- **Don'ts carried forward from the brief, still binding:** `knowledge_doc`
  *replaces* `clown-index.ts` as the one KB — it is not a second one, and
  the compile-time index survives only as the no-DB fallback. No Haiku
  pre-classifier in the chat path (Haiku lives ingest-side only). Decisions
  J1–J7 stay settled: the trail, scoreboard, and pins are additions; the
  dropped Evidence/Confidence meters (J4) stay dropped — `delulu` remains
  the one scale. The `ItemStatus` label must *visibly* reach
  `ClownItemCard` (brief 0b) — verify in audit, fix in issue 10 if not.
- **Eval**: retro battery over confirmed eggs with post-reveal docs hidden
  (target top-3 ≥ 60%), freshness SLO (`max(updated_at) tier='current'` <
  24h) in CI, injection cases added to the red-team battery, grounding
  check on every cited id. **Plus the brief's 11 acceptance cases** (4 must
  engage from a named technique with receipts; 3 must redirect with zero
  content; 2 must resist injection; 1 gray-zone one-liner; 1 real-person
  boundary — evidence side only) pinned into `clown-battery-corpus.ts`
  and the live battery, per the brief's rule that a fixed-but-unpinned
  failure comes back.
- **Coverage audit, computed** (brief's `EGG-GAPS.md`, made durable per
  workflow rule 8): `scripts/knowledge-coverage.mjs` emits
  `docs/audits/knowledge-coverage.md` — technique × era matrix from
  `egg_ledger`, thin cells flagged, techniques with <2 grounded examples
  flagged. A work order for content people, regenerated on every canonical
  sync; never hand-filled, never fabricated.
- **Model-tier evidence** (brief Task 5, `HUMAN-ACTIONS.md` #5): this plan
  subsumes the open Sonnet-vs-Haiku question — Haiku extracts, Sonnet
  chats — but the side-by-side on the 11 cases still runs once in the
  eval harness and is appended under #5 as the ratification evidence.

---

## 8. Automation inventory — what runs where after this

| Job | Runs on | Model | Cap | Why there |
|---|---|---|---|---|
| Knowledge engine (ingest/extract/screen/store) | Actions, 4h | Haiku 4.5 | 600/day, DB | infrastructure; never depends on an account |
| Canonical sync | Vercel postbuild + `sync:content` | none | — | mechanical |
| Site current-feed | Next.js ISR 15min | none | — | request path stays model-free |
| Clownbot chat | Next.js route | Sonnet 5 | per-user + global, DB | the one user-path model call (existing precedent) |
| Content Shift (promotion) | Claude routine | Opus/Sonnet | 2 runs/day → raise | judgment + PR |
| Rumor Desk (lifecycle) | Claude routine | Opus | every 2 days | judgment |
| Karen / CIE | Actions + routine | mixed | existing | unchanged |
| Retro eval | Claude Code session, weekly | Sonnet | manual | judgment, filed as an audit |
| Social, growth, watchdog | Actions | none | — | unchanged |

Rule of thumb, now written down: **freshness on Actions, judgment on
routines.** A routine going dark should never make the site stale.

---

## 9. Delivery — one workstream, ordered so each PR ships value

| # | Issue | Value visible when it lands |
|---|---|---|
| 1 | `docs/decisions.md` entries (§10) | — |
| 2 | Fix clustering + resolve publisher URLs in the existing worker | Digest becomes usable; `source_count` truthful |
| 3 | Migration + `packages/shared/src/redline.ts` (blocklist moved, tests moved) | — |
| 4 | Extract stage + `current_item`/`fan_signal`/`live_theory` writes, run-summary issue | Supabase has today's Taylor by tonight |
| 5 | Canonical sync → `knowledge_doc`, `egg_ledger`, `symbol_lexicon` seed (~60 keys), **`techniques.mjs` seed (7–10 records, ≥2 corpus-cited examples each, written in a frontier-model session with a human — not an autonomous run), coverage audit script** | The bot can reason from a style, not just recall |
| 6 | **Site: current era renders `current_item`** (ISR slice, dashed treatment, filters) | **The site shows today. Masthead line becomes true.** |
| 7 | Fold `appearance-discovery` into the engine; add `tumblr`, `bluesky`, `reddit-rss` (flagged), publisher feeds 3→15, licensed news API, `facebook-groups` upload + parser + Sunday reminder | Fan chatter enters the store; Google News retired after the shadow week |
| 8 | Theories board + Clownbot board read `live_theory`/`fan_signal` | Site and bot show what fans are clowning on right now |
| 9 | Content Shift / Rumor Desk prompts read the queue, not the digest; raise cap | Vault promotion gets faster and cheaper |
| 10 | Clownbot: DB retrieval (no agent yet), fallback to compile-time index | Bot cites today's rows |
| 11 | Clownbot: agent loop, streaming, trail, predictions | The product |
| 12 | Sessions, memory, per-user caps, scoreboard, pins | "Hours" becomes possible |
| 13 | Adapters 2: `x-recent`, `ig-official`, `site-diff`; Google News replacement per §4.2 | Coverage of what she *did* approaches complete |
| 14 | `reddit` OAuth adapter, disables `reddit-rss` in the same PR | Comment-thread recall — the arguments, not just the topics |
| 15 | Eval harness + freshness SLO in CI | We can prove it's the best |
| 16 | Retire `clownbot-lore.ts`, update `longlive-experience.md` §7, `MAP.md`, `intake.md`, `rumor-pipeline.md` § Data model; write **`CLOWNBOT.md`** (brief Task 7) for content duty: how an egg/theory/technique enters the store now (promotion → `egg_ledger`), what is generated, which tests, the kill switch | Docs match reality (rule 7) |

Issues 2–6 are the "site is GREAT" core and touch no chat routine. If the
routine migration drags on, the site still updates every four hours.

---

## 10. Decisions to log first

1. Current tier is a first-class, reader-visible store (Supabase), read at
   request time via ISR for the current era only; the Vault stays static.
2. Ingestion runs on Actions with API keys; the worker gains an LLM
   extract stage on Anthropic (the 7/18 classifier decision chose OpenAI —
   reconcile to one vendor or accept two).
3. Google News: replace with publisher feeds + a licensed API, or formally
   accept the risk — either way, close the 7/19 open note.
4. Fan-platform posture: Tumblr/Bluesky/YouTube now; X pay-per-use capped;
   Reddit only under an approved agreement; TikTok never; aggregate-only.
5. Authoring cap: research moves upstream; Content Shift's 2-item cap is
   replaced by a heat threshold + WIP limit.
6. Clownbot stores conversations (retention 180d, no IPs); first use of
   Supabase Auth (anonymous); per-user caps in DB.
7. Embedding vendor.
8. "Freshness on Actions, judgment on routines" as a standing rule in
   `CLAUDE.md` § Cost discipline.

---

## 11. What I could not see, and how to close each gap

I worked from the public repo, the public Actions run list, the
`news-digest` branch, the live site, and the Vercel project metadata. I
could **not** see:

| Blind spot | Why it matters | How to close it |
|---|---|---|
| The **live Claude routine list** on Joey's account — what's enabled, their real cron, whether inline prompts match `docs/agents/runner-prompts/*` | §8 assumes Content Shift/Rumor Desk come back; if they don't, promotion needs a different owner | Export the routine list (the 8/22 export format Wyatt used) into `docs/agents/runners.md` as a table with `enabled` truthfully set; or paste it to me |
| **Supabase contents** — `news_story` row counts, `month_item` vs seeds drift, whether the Vault mirror is even current | Decides whether the canonical sync is a rebuild or a repair | Run `node scripts/backup-restore-test.mjs --drill` output + a `select count(*)` per table into an issue; or a read-only DB role for a session |
| **Repo secrets present** (`OPENAI_API_KEY`, `SUPABASE_*`) | Whether the worker is on the deterministic classifier or the LLM path today | `gh secret list` |
| **Actions run logs** (private for a public repo's schedule runs) | The digest says clustering is broken; the logs would show error rates per feed | A session with `gh run view --log` on the last 5 `news-worker` runs |
| **Analytics** — how many people open Clownbot, how many turns per session | Sets the chat cost model and whether "hours" is a real user behavior yet | Vercel Web Analytics is on the project; a `get_web_analytics` pull by route + custom events on `POST /api/clown` |
| **The mobile app's data path** (`apps/mobile`) | Whether it already reads Supabase or bundles the generated TS | One read of `apps/mobile` — I skipped it to keep this pass focused; cheap to add |

Add to that same audit the two open questions the 8/16 brief left unanswered:
**0a** whether `OUT_OF_SCOPE_MESSAGE` (`clown-safety.ts`) is actually called
from `route.ts` or is dead code, and **0b** whether `ItemStatus` reaches the
rendered `ClownItemCard` as a visible label or dies in the payload. Both are
grep-answerable in ten minutes and both change issue 10.

None of these change the architecture; they change issue 2's scope and
issue 9's owner. The fastest way to close all of them is a single Claude
Code session on Joey's machine with `gh` and the Supabase URL, filing one
"knowledge-engine: current-state audit" issue. I'd make that issue 0.
