# Community Engine — Reddit + Facebook engagement & content automation plan

**Status: plan only (kanban t_b6d45e96, Fable, 2026-09-06). No code changes.**
Every build item below is defined as a kanban card in §9, dependency-ordered
and ready to dispatch on board `swift2` once Joey has read this and answered
the four founder questions in §8 (each carries a recommendation; silence =
recommendation adopted).

Source brief: Joey, 2026-09-06 (#long-live). Standing rule from the brief that
governs everything here: **a human always posts. Hermes only creates the
content and makes the human's job quicker.** Nothing in this plan auto-posts,
auto-comments, auto-replies, or auto-DMs on Reddit or Facebook.

This plan builds on, and does not replace:
- `docs/proposals/2026-09-03-reddit-automation-architecture.md` (ingestion →
  storage → processing → social-draft). That doc covers "Reddit as a *source*
  for our own social posts." This doc covers the two things it explicitly left
  out: **engagement drafts we paste into Reddit/Facebook**, and a **year-deep
  fan-theory corpus**.
- `CLOWNBOT.md` / `docs/proposals/2026-08-23-knowledge-engine.md` (the store
  every draft cites).
- `docs/decisions.md` 2026-08-11 (no Facebook-group crawler, ever; groups are
  a lead channel) and 2026-08-25 (Reddit comment bodies in scope, hashed
  authors).
- `docs/marketing/social-strategy.md` §1(e) (Human Reach lane: ≤3 tasks/week,
  paste-ready, checkbox) and `growth-plan.md` §7 (20–30 zero-link
  contributions before any promo; `redditNonPromo` ledger).

---

## 0. The one-page version

```
                 ┌──────────────── INPUTS ────────────────┐
  Reddit alert   │ Reddit reply   │ daily hot-thread │ FB group   │ yearly crawl
  emails (Gmail) │ emails (Gmail) │ scan (RSS, sched)│ export (hu)│ (relay, slow)
        └───────────────┬─────────────────┬──────────────┴──────────────┘
                        ▼                 ▼
              engagement_lead (new)   fan_theory_candidate (new)
                        │                 │
                        ▼                 ▼
          ┌──── Answerer desk (Tier 2) ────┐   ┌─ Theory Miner (Tier 2) ─┐
          │ relevance-score vs knowledge_doc│   │ cluster → name → grade   │
          │ draft reply, decide link/no-link│   │ → live_theory (origin=fan)│
          └──────────────┬─────────────────┘   └────────────┬────────────┘
                         ▼                                  ▼
             ONE daily "Community Tasks"          Clue Web / Clownbot /
             email to Joey+Wyatt: link +          egg board read it (site)
             paste-ready text + checkbox
                         ▼
               human pastes → ticks → posted_ledger (dedupe, never re-ask)
```

Two engines, one store, one daily email:
1. **Engagement engine** — turns alerts, replies and hot threads into
   paste-ready responses, each with a *relevance score* that decides whether a
   longlivets.com link belongs in it.
2. **Content engine** — builds a fan-theory corpus from a year of Reddit
   comment history (+ FB exports), feeds the Clue Web / Clownbot, and scrubs
   fan-merch links for the merch section.

Both write to Supabase tables that already exist wherever possible
(`fan_signal`, `live_theory`, `knowledge_doc`) plus **two new tables**
(`engagement_lead`, `fan_theory_candidate`) and one ledger
(`community_post_ledger`). Schema in §5.

---

## 1. How the existing system shapes this (constraints I designed around)

| Fact about today | Consequence for this plan |
|---|---|
| Reddit blocks the VPS on every endpoint; GitHub Actions runners are NOT blocked for `.rss` (subreddit + `<permalink>.rss?limit=N&sort=top`), confirmed in `reddit-rss.ts`. The `.json` API 403s everywhere. | Scheduled work (daily hot-thread scan, reply-context fetch) runs on **GitHub Actions via RSS**, zero keys. Full comment trees need the **home-relay** (`/svc/shreddit/comments/r/<sub>/t3_<id>`) which is desk-triggered, bounded, and depends on Joey's PC being on. |
| Reddit denied our Data API request (2026-08-30). | No OAuth, no posting API, no "did we comment" API. Posting is human; "have we commented" must be **our own ledger**, not a Reddit lookup. |
| Facebook groups: no API, crawler refused on merits (decisions 2026-08-11). Weekly manual "Webpage, Complete" export is the only lawful intake (`fb-export-reminder.yml`, `facebook-groups-parser.ts`, unverified against a real export). | FB engagement scan = **parse Joey's weekly export**, rank posts, draft replies. No relay, no bot, no scheduled FB fetch. Individual members never enter the repo. |
| Repo is **public**. | Draft replies, thread URLs and scores go by **email and Supabase**, not GitHub issues. The `founder-task` issue keeps only counts/checkbox state. |
| Marjorie already owns a Gmail (`marjorieswift00@gmail.com`) with IMAP relay (`marjorie-inbox.yml`, DKIM-verified, deterministic) and SMTP send (`brief-mailer.yml`). | Reddit's notification emails should go **to Marjorie's Gmail** (forwarding rule or change the Reddit account's email) and a new IMAP job picks them up. No new mail account, no new secret. |
| Founder email ceiling: Marjorie 1/day + Tree 1/week (2026-08-23). Joey later said "I don't mind more emails for social" (2026-08-25). | One new daily email, **"Community Tasks — YYYY-MM-DD"**, batched. Replies-to-our-comments are the only thing that may trigger an extra same-day email (they're time-sensitive). |
| Clownbot / site read only from `knowledge_doc` projections of `current_item`/`fan_signal`/`live_theory` (+ Vault `egg_ledger`). `live_theory.origin in ('fan','bot','site')` already exists and Clue Web already renders live theories dashed. | The fan-theory corpus lands as **`live_theory` rows with `origin='fan'`**, projected to `knowledge_doc` as `ltheory:*`. No new Clownbot brain; it learns by having more rows to cite. |
| `live_theory` expires 60 days after last activity → `abandoned`. | Year-old theories would evaporate. Add a `persistent` flag (or `expires_at = null`) for corpus-mined theories; they age out only when `outcome` resolves. |
| Privacy redlines: no relationships/private-life/sexuality/identity theories, ever (`theory-weaving.md`); hashed authors; aggregate voice. | The Theory Miner runs `screenTopic()` on every candidate and drops on hit. Gaylor/relationship subs are **out of scope** regardless of popularity. |
| Merch already has an E5 fan-made discovery lane (`merch-fanmade.yml`, `REDDIT_SUBREDDITS=['TaylorSwiftMerch']`, `SHOP_DOMAIN_ALLOWLIST`, judged curation before any seed). | Fan-merch scrubbing = **widen E5's sources** (more subs, FB export links), not a new pipeline. |
| Etiquette ledger `redditNonPromo: n/20` gates promo. | Relevance score decides *whether a link is appropriate*; the etiquette ledger decides *whether we're allowed to link at all yet*. Both must pass. |

---

## 2. Engagement engine — the four flows

All four converge on the same three steps: **lead → draft → task email**.

### 2.1 Flow E1 — Reddit alert emails (Marjorie's Gmail)
Reddit can email "trending in r/X" digests, keyword/"post from a followed
user" alerts, and reply notifications. Whatever the account is configured to
receive:
1. **Get them to Hermes.** Point the Reddit account's email at
   `marjorieswift00@gmail.com` (or add a Gmail forward from wherever they land
   today). Founder step, 2 minutes, §8-Q2.
2. New Action **`community-inbox.yml`** (every 30 min, same IMAP pattern as
   `marjorie-inbox.yml`): reads unread mail From `noreply@reddit.com` /
   `*@redditmail.com` with DKIM pass, extracts every `reddit.com/r/.../comments/<id>`
   link + the subject, classifies `alert | reply_to_us | digest`, upserts an
   `engagement_lead` row (status `new`), marks `\Seen`. Zero LLM.
3. Answerer desk (§2.5) drafts.

### 2.2 Flow E2 — Daily hot-thread scan (scheduled, RSS, zero keys)
New Action **`community-scan.yml`** (daily, off-peak minute per the repo's cron
contention rule): for each subreddit in `community_watchlist` (seed list §8-Q1),
fetch `r/<sub>/top/.rss?t=day` and `/hot/.rss` via the shared
`scripts/lib/reddit-rss.mjs`, keep the top N (N=10/sub), fetch each post's
`.rss?limit=25&sort=top` for context, skip anything already in
`engagement_lead` or `community_post_ledger`, insert the rest as leads with
`kind='hot_thread'`. Zero LLM. Feature-flagged `COMMUNITY_SCAN_ENABLED`.

### 2.3 Flow E3 — Replies to our comments
Same ingest as E1 (`kind='reply_to_us'`). Difference is priority: the desk
drafts these **first**, and if a reply arrives after the daily email already
went, a second short "Replies waiting" email is allowed that day (bounded to
1 extra/day). The draft is a *reply-to-a-comment* — the email carries the
comment permalink (`.../comments/<id>/_/<commentid>`), not the thread root.

### 2.4 Flow E4 — Facebook groups
1. `fb-export-reminder.yml` already files the Sunday checklist. Widen it:
   Joey saves each watch-listed group's feed page ("Webpage, Complete") and
   drops the files in a **private** location — recommendation: a private
   Supabase Storage bucket `fb-exports/` via a tiny upload page, or simply
   attach to the kanban card `t_fb-export-<date>` (attachments are private
   board storage). Never the public repo.
2. New script `scripts/community/fb-export-ingest.mjs` runs
   `facebook-groups-parser.ts` over each file, ranks posts by
   reactions+comments, writes `fan_signal` (aggregate, as today) **and**
   `engagement_lead` rows with `platform='facebook'`, `kind='hot_thread'`,
   `url=null`, `locator = group name + first 80 chars of post text` (that's
   how Joey finds it again — private groups have no permalink we may store).
3. Answerer drafts exactly as for Reddit. A Facebook reply **never names or
   quotes a member**; it answers the question in the post.
4. First real export is also the long-overdue parser calibration (HA#16).

### 2.5 The Answerer desk (Tier 2 routine — the judgment step)
Runner prompt `docs/agents/runner-prompts/community-answerer.md`, daily
(after `community-scan`), model pinned per §8-Q4. Per lead, it:

1. **Reads** the thread/post text and top comments (RSS context; may call
   home-relay for ≤5 threads/run when RSS is too thin — bounded, logged).
2. **Screens** — `screenTopic()`; anything on the redline list → `status='skipped_redline'`.
3. **Relevance-scores** against `knowledge_doc` (full-text `tsv` search +
   symbol match). Score 0–1 = best-matching doc's rank × specificity. Rules:
   - `≥ 0.75` and `redditNonPromo ≥ 20` and sub allows links → draft **with**
     the exact deep link (`/vault/<era>#<item>`, `/threads/<slug>`) and a
     one-line "why this page".
   - `0.45–0.75` → draft **without** link, note "link candidate: <url>" in the
     email so Joey can add it by hand if the thread turns.
   - `< 0.45` → contribution-only draft **only if** it's a hot thread where a
     genuinely useful fan answer exists; otherwise `status='skipped_low_relevance'`.
4. **Chooses the target** — top-level reply vs. reply to a specific comment
   (whichever is the actual question being asked; prefer comments with a
   question and few answers).
5. **Drafts** in the Reddit voice rules (`growth-plan.md` §7: fan-made
   framing, no marketing tone, ≤ 120 words unless the thread is long-form,
   no em-dash tells, no "great question"). Two variants when useful:
   short / detailed.
6. **Writes** `engagement_lead.draft`, `target_url`, `relevance`,
   `link_included`, `status='drafted'`.
7. **Caps**: ≤ 12 drafts/day total, ≤ 3 per subreddit, replies-to-us always
   included. Joey should never see more than ~15 minutes of pasting.

### 2.6 The daily "Community Tasks" email + ledger
- `community-mailer.yml` (SMTP from Marjorie's Gmail, same secret as
  `brief-mailer.yml`) sends **one** HTML email/day, ordered: replies-to-us,
  then by relevance. Each item: platform, destination link (or FB locator),
  score, the paste-ready text in a box, and a one-click **"Posted"** link
  (`https://longlivets.com/api/community/ack?lead=<id>&token=<hmac>`) plus a
  **"Skip"** link.
- The ack endpoint (tiny Next route, HMAC-signed, no auth beyond the token)
  flips `status='posted'`, appends to `community_post_ledger`
  (`platform, community, thread_id, comment_target, posted_at,
  link_included`), and bumps `redditNonPromo` when `link_included=false` on
  Reddit. That ledger is what E2 dedupes against ("track if we've already
  commented") and what the etiquette gate reads.
- Fallback if Joey prefers replying by email: `community-inbox.yml` also
  parses founder replies of the form `posted <id>` / `skip <id>` (DKIM-verified,
  same as today's relay).
- Marjorie's brief gets one pointer line ("Community tasks: 7 drafted, 4
  posted yesterday, 2 replies waiting") — a pointer, not a duplicate.

---

## 3. Content engine — fan-theory corpus

### 3.1 What Clownbot actually "learns" (answer to Joey's question)
Clownbot does not train. It retrieves: every answer is composed from
`knowledge_doc` rows (Vault `egg_ledger`/`symbol_lexicon` + current-tier
`current_item`/`fan_signal`/`live_theory`), grounded by id
(`clown-grounding.ts`). So "including all fan theories even if we aren't
posting them" means exactly: **get them into `live_theory` (origin `fan`)
with good `symbols`, `claim`, `evidence_ids`** — then they are searchable,
citable and shown dashed on the Clue Web. Nothing else needs to change for
the bot to "know" them.

### 3.2 The slow crawl (C1)
- Scope: top posts of the last 12 months from the 5 subreddits in the
  watchlist marked `crawl=true` (recommend `TaylorSwift`, `SwiftlyNeutral`,
  `TaylorSwiftBookClub`… final list §8-Q1 — explicitly **excluding**
  relationship/identity-focused subs per redlines).
- Source of post list: `r/<sub>/top/.rss?t=year&limit=100` (RSS caps ~100;
  supplement with `t=month` windows walked back 12× to get ~1,200/sub). Runs
  on GitHub Actions, zero keys.
- Comments: RSS gives top-15–25 per post. For posts above a heat threshold
  (top 20 % by rank) the miner requests the **full tree via home-relay** —
  bounded at 40 threads/run, one run/day, only while
  `HOME_RELAY_REACHABLE` (a 5-s probe) is true; otherwise it just uses the
  RSS slice and marks `depth='partial'`. This is deliberately slow ("slowly
  crawl" — Joey's words) and stays inside the relay's documented
  one-thread-at-a-time posture: ~40 threads/day ≈ 6 weeks for 5 subs.
  **If Joey wants it faster, that is a decisions.md posture change (§8-Q3).**
- Facebook: the same miner reads the weekly export files (no crawl).
- Raw text is **not stored**. Each post+comments bundle is fed once to the
  extractor; only structured candidates survive (hashed author, no bodies).

### 3.3 Theory Miner (C2) — extraction + the "columns"
One Haiku call per post bundle with a forced tool `record_fan_theories`
(sibling of `record_knowledge`). Output rows → **`fan_theory_candidate`**:

| column | why it exists |
|---|---|
| `claim` (≤ 200 chars, our words) | the theory itself, never a quote |
| `theory_key` (slug) | dedupe across threads ("1989-tv-vault-track-count") |
| `mechanism` | same vocabulary as `egg_ledger.mechanism` (number, color, wardrobe, caption, lyric_callback, …) — lets precedents match |
| `symbols[]` | keys from `symbol_lexicon` where possible, free text otherwise |
| `era_id`, `track_slug?` | where it hangs on the site |
| `predicts` (enum: `release`, `re-record`, `setlist`, `feature`, `title`, `date`, `other`) + `predicted_date?` | so resolution can be checked later |
| `evidence_summary` | 1–2 sentences of *what fans point to*, aggregate voice |
| `first_seen_on`, `last_seen_on`, `mention_count`, `peak_score`, `communities[]` | heat & longevity; "columns to help sort" |
| `stance` (`believed / contested / debunked_by_fans`) | fan-side confidence |
| `status` (`candidate → accepted → merged → rejected`) | pipeline state |
| `redline_ok` (screenTopic result) | never false into the store |
| `sample_urls` (≤ 3 public permalinks; **empty for Facebook**) | citations |

Deterministic post-pass: merge candidates by `theory_key`/near-duplicate
claim, roll up counts, then **promote** accepted rows into `live_theory`
(`origin='fan'`, `status` from stance, `heat` from mention_count/peak_score,
`persistent=true`, `evidence_ids` → `signal:*` docs). Resolution: a nightly
job matches `predicts + predicted_date` against Vault moments; a hit sets
`outcome` and creates an `egg_ledger` precedent candidate (human-reviewed PR
like any Vault change).

### 3.4 Where it shows on the site (C3) — Fable's call on "the right way"
Do **not** build a new "Fan Theories" section (theory-weaving standard:
weaving, not a glossary; avoids us ranking legitimacy). Instead:
1. **Clue Web** already draws live theories dashed. Add an origin badge
   ("fan theory · 340 mentions · r/TaylorSwift") and a heat-sorted "What
   fans are watching" cluster; tapping opens the existing LiveTheoryCard
   with claim, evidence summary, mechanism precedents (from `egg_ledger`),
   and stance. No new route.
2. **Threads/eggs board** — "Live now" strip = top 5 persistent fan theories
   by heat. Reuses `LiveTheoryCard`.
3. **Clownbot** — zero UI change; new rows are automatically citable. Add
   one starter chip "What are fans theorising right now?" (chips resolve
   without model calls; this one becomes a heat-sorted list).
4. **Song pages** — when a theory has `track_slug`, weave a sourced one-liner
   per `theory-weaving.md` — but only via the existing content PR path with
   mainstream-coverage sourcing; corpus rows alone don't meet the Vault bar.
   That is a Content Shift lane input, not automatic.

### 3.5 Fan merch (C4)
Widen E5 rather than build anew:
- `REDDIT_SUBREDDITS` → add `TaylorSwiftMerch`-adjacent subs from the
  watchlist (`SwiftieMerch`, `TaylorSwiftBookClub` merch flairs, etc.),
  read via the existing RSS helper.
- FB export ingest (§2.4) emits shop links (Etsy/Redbubble/…) it finds in
  post text into E5's candidate file; the **same** `SHOP_DOMAIN_ALLOWLIST`
  + judged curation (D3/E1/E2) applies. Affiliate rules unchanged.
- Leads only — the merch section shows the *shop*, never the poster.

---

## 4. Workflow-level view (what runs when)

| Component | Tier | Trigger | LLM? | New secret? |
|---|---|---|---|---|
| `community-inbox.yml` | 1 | */30 min | no | no (Marjorie Gmail) |
| `community-scan.yml` | 1 | daily | no | no |
| `fb-export-ingest` (script, run by Answerer or manual dispatch) | 1 | Sunday + on upload | no | no |
| Answerer desk (`routine-community-answerer.yml`) | 2 | daily, after scan | yes (pinned) | uses existing `CLAUDE_CODE_OAUTH_TOKEN` pattern |
| `community-mailer.yml` | 1 | daily after Answerer; + replies-waiting | no | no |
| `/api/community/ack` | site | click | no | `COMMUNITY_ACK_SECRET` (HMAC; generated, not a third-party key) |
| `community-crawl.yml` (theory corpus) | 1 | daily, bounded | no | no |
| Theory Miner (`routine-theory-miner.yml`) | 2 | daily after crawl | yes (Haiku extract + weekly Opus merge pass) | `ANTHROPIC_API_KEY` already exists |
| `theory-resolve` (in `sync:content` or nightly) | 1 | nightly | no | no |
| E5 merch widen | 1 | existing cron | no | no |

Kill switches: `COMMUNITY_SCAN_ENABLED`, `COMMUNITY_CRAWL_ENABLED`, disable
the two routines in Actions; `SOCIAL_FREEZE` is unaffected (nothing here posts).

Cost: scan/inbox/mailer are zero-LLM. Answerer ≈ 12 drafts/day on a
mid-tier model ≈ well under $1/day. Miner ≈ 40 Haiku calls/day + 1 Opus
merge/week. No new paid service. Nothing crosses the $100 line.

---

## 5. Data model (new objects only)

```sql
-- watchlist (replaces hard-coded sub lists over time)
create table community_watchlist (
  id text primary key,                 -- 'reddit:TaylorSwift' | 'facebook:<group-slug>'
  platform text not null check (platform in ('reddit','facebook')),
  name text not null,
  scan boolean not null default true,  -- daily hot-thread scan (E2/E4)
  crawl boolean not null default false,-- yearly corpus crawl (C1)
  allows_links boolean,                -- per-sub self-promo rule, human-set
  notes text
);

create table engagement_lead (
  id uuid primary key default gen_random_uuid(),
  platform text not null, community text not null,
  kind text not null check (kind in ('alert','digest','hot_thread','reply_to_us')),
  thread_id text,                      -- reddit t3_ id; null for facebook
  url text,                            -- public permalink; null for facebook
  locator text,                        -- facebook: group + first 80 chars
  title text, context text,            -- context = our-words summary, NOT raw bodies
  relevance real, matched_doc_ids text[] default '{}',
  target_url text, draft text, draft_alt text, link_included boolean,
  status text not null default 'new',  -- new|drafted|emailed|posted|skipped_*
  redline_ok boolean not null default false,
  created_at timestamptz default now(), emailed_at timestamptz, posted_at timestamptz,
  unique (platform, coalesce(thread_id, locator), kind)
);

create table community_post_ledger (   -- the "did we already comment" truth
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references engagement_lead(id),
  platform text not null, community text not null,
  thread_id text, comment_target text, link_included boolean not null,
  posted_at timestamptz not null default now(), posted_by text
);

create table fan_theory_candidate ( ...columns exactly as §3.3... );

alter table live_theory add column persistent boolean not null default false;
alter table live_theory add column mention_count int, add column communities text[] default '{}';
```
RLS: public read only on `live_theory` additions (already public); the three
new tables are service-role only (drafts and leads never reach the browser
except through the HMAC ack route).

---

## 6. Guardrails (non-negotiable, encoded in code + tests)
1. No posting, replying, voting, following or DMing on Reddit/Facebook by any
   automation. The only writes to those platforms are by Joey/Wyatt's hands.
2. No Facebook fetch of any kind (relay included). Input is the human export.
3. Hashed authors; no comment bodies persisted; aggregate voice in every
   stored summary; `screenTopic()` before any insert (`redline_ok` gate on
   every read path). Relationship/identity theories never enter, even as
   "rejected" rows.
4. Home-relay: bounded per run (Answerer ≤5, crawl ≤40 threads/day),
   probe-before-use, never retried in-run on 403/429, logged in run summary.
5. Etiquette: `link_included` can only be true when `redditNonPromo ≥ 20`
   **and** `community_watchlist.allows_links` is true; first promo post in
   any sub requires a modmail check task first (a normal lead with
   `kind='alert'` and a "modmail" draft).
6. Email volume: 1 Community Tasks email/day + ≤1 replies-waiting; the brief
   gets a pointer only.
7. Public repo hygiene: drafts, thread URLs, scores live in Supabase +
   email; GitHub issues carry counts only.
8. Every new workflow follows `docs/agents/routine-invariants.md` and gets
   a row in `docs/AUTOMATION.md`.

---

## 7. What I could not do myself (and why) — feeding §8
- I cannot see which Reddit account receives the alert emails today or its
  notification settings (Reddit blocked from here; account is Joey's).
- I cannot enumerate Joey's Facebook groups (login-bound by policy).
- I cannot verify `facebook-groups-parser.ts` against a real export (none
  exists in the repo, by design).
- Loosening the home-relay posture is a founder call recorded in
  `docs/decisions.md`, not mine.
Everything else in this plan is executable by cards without Joey.

---

## 8. Founder questions (each with a recommendation — reply `Qn=x`; no reply = recommendation)

**Q1 — Watchlists.** Reddit scan list (default): `TaylorSwift, SwiftlyNeutral,
TaylorSwiftBookClub, YouBelongWithMemes, TaylorSwiftMerch`; crawl=true on the
first three plus `TSwiftEasterEggs`-style sub if one exists (card P0-2
verifies). **Facebook**: the two groups already named in `sources.md`
(Taylor Swift's Vault 480k; Friendship Bracelet group) + any Joey adds.
Recommendation: **accept defaults**, add/remove later in the table.

**Q2 — Where Reddit's emails go.** a) Set the Reddit account's email to
`marjorieswift00@gmail.com`; b) keep it on Joey's Gmail and add a filter
"from:reddit → forward to Marjorie". Recommendation: **b** (keeps account
recovery on Joey's address; 2-minute Gmail filter, reversible).

**Q3 — Crawl speed.** a) stay inside today's relay posture (~40 threads/day
≈ 6 weeks for the year-deep corpus); b) record a decisions.md entry allowing
scheduled bulk relay reads and go ~5× faster. Recommendation: **a** — the
corpus is a one-time backfill; speed isn't worth the legal-posture change.

**Q4 — Answerer model.** a) `claude-sonnet-5` (cheap, good voice); b)
`claude-opus-5` (Tree's pin). Recommendation: **a** for daily drafts, with
the weekly theory-merge pass on **b**.

---

## 9. Kanban cards (board `swift2`, assignee `default`, all `Review: required (Claude, fresh context)`, base `main`)

Every card body must include: "First run `git fetch origin` in the base repo
and ensure your worktree is based on `origin/main`"; registry constraints
(merge_authority: agent-merge for reversible PRs w/ green CI; human_gates:
none of these cards post publicly). GATE cards are docs-only parents so later
phases auto-release.

### Phase 0 — foundations (parallel)
- **P0-1 Schema migration**: `community_watchlist`, `engagement_lead`,
  `community_post_ledger`, `fan_theory_candidate`, `live_theory.persistent/
  mention_count/communities`; RLS; seed watchlist from §8-Q1 defaults; update
  `docs/content-ops/rumor-pipeline.md` § Data model. Files:
  `supabase/migrations/2026090700000_community_engine.sql`,
  `packages/shared/src/community.ts` (types). Tests: migration applies on
  the drill DB (`npm run backup:drill` path), type tests.
- **P0-2 Watchlist verification (research, docs-only)**: confirm each default
  sub exists/is active, read each sidebar self-promo rule → fill
  `allows_links` + notes; verify the two FB group names. Output: a seed
  patch PR to P0-1's seed + `docs/community/watchlist.md`.
- **P0-3 Shared Reddit RSS helpers**: extend `scripts/lib/reddit-rss.mjs`
  with `topPosts(sub, {sort,t,limit})`, `postComments(permalink, n)`,
  `parseRedditEmail(rawMime)` (link/subject extraction, kind classifier),
  and a `shreddit` HTML comment-tree parser (port of the home-relay regex,
  used only when a relay URL is configured). Unit tests with fixtures.
- **P0-4 `docs/AUTOMATION.md` + `routine-invariants` entries** for the six
  new workflows (docs-only, lands with P0 so later cards just fill rows).
- **GATE-P0** (docs-only, parents = P0-1..P0-4).

### Phase 1 — engagement engine
- **P1-1 `community-inbox.yml`** (parents GATE-P0): IMAP reader for Reddit
  mail on Marjorie's Gmail → `engagement_lead`; also parses founder
  `posted <id>` / `skip <id>` replies. Deterministic, DKIM-verified,
  idempotent by Message-ID. Dry-run mode. Files: workflow +
  `scripts/community/inbox.py` (mirror `marjorie-inbox.yml`'s style).
- **P1-2 `community-scan.yml`** (GATE-P0): daily RSS hot-thread scan per
  watchlist → leads; dedupe vs ledger; `COMMUNITY_SCAN_ENABLED`. Files:
  workflow + `scripts/community/scan.mjs`.
- **P1-3 FB export ingest** (GATE-P0): `scripts/community/fb-export-ingest.mjs`
  (parser → `fan_signal` + `engagement_lead`, shop-link side-output for E5);
  widen `fb-export-reminder.yml` checklist to name the private drop location.
  Include the "first real export calibration" checklist in the card.
- **P1-4 Answerer desk** (GATE-P0): runner prompt
  `docs/agents/runner-prompts/community-answerer.md`, charter
  `docs/agents/community-answerer.md`, workflow
  `routine-community-answerer.yml` (same shape as `routine-growth-draft.yml`),
  `scripts/community/relevance.mjs` (tsv+symbol scorer, unit-tested with a
  fixture of 20 real-shape leads), bounded home-relay use, caps, etiquette
  gate. Model per §8-Q4.
- **P1-5 Ack route + ledger**: `apps/web/app/api/community/ack/route.ts`
  (HMAC token, GET, idempotent, rate-limited), `COMMUNITY_ACK_SECRET` env
  doc, ledger insert + `redditNonPromo` bump in `social/calendar.md` ledger
  (or move that counter to the DB — decide in card, prefer DB with calendar
  mirror). Tests for route + tamper cases.
- **P1-6 `community-mailer.yml`** (parents P1-4, P1-5): daily HTML email +
  replies-waiting variant; Marjorie brief pointer line
  (`scripts/marjorie/assemble-brief.mjs` one section addition).
- **P1-7 End-to-end dry run (docs+fixtures)** (parents P1-1..P1-6): seed 5
  fixture leads, run scan→answer→mail in dry-run, attach the rendered email
  to the card, human reads it. Flip `COMMUNITY_SCAN_ENABLED=true` on pass.
- **GATE-P1** (parents P1-7).

### Phase 2 — content engine
- **P2-1 `community-crawl.yml`** (GATE-P0): year-deep top-post walker
  (RSS month windows), relay probe + bounded full-tree fetch, writes raw
  bundles to a **transient** Actions artifact (24 h) consumed by P2-2 — never
  to the repo or DB. `COMMUNITY_CRAWL_ENABLED`.

  **Founder directive (2026-09-06): this is the one component of the whole
  Community Engine that carries real risk (scraping volume/pace), and Joey
  wants a trivially easy on/off switch, separate from every other piece.**
  `COMMUNITY_CRAWL_ENABLED` must be a single GitHub repo **variable**
  (Settings → Variables → Actions — same pattern as `SOCIAL_FREEZE`, not a
  secret, not buried in code), checked as the very first step of the
  workflow before any network call. Default it to `false` at ship time —
  Joey turns it on deliberately, it does not start crawling on its own the
  moment this card merges. Also expose a `COMMUNITY_CRAWL_BUDGET` variable
  (threads-per-run cap, default a conservative small number e.g. 10-20) so
  Joey can run it "a little bit here and there" instead of only a binary
  full-speed/off choice — document both variables clearly in
  `docs/community/README.md` (P3-1) with the exact toggle steps in plain
  English, and mention the toggle in the Founders' Brief's Section 5
  maintenance block whenever `COMMUNITY_CRAWL_ENABLED=true` so it's never a
  silently-forgotten background process.
- **P2-2 Theory Miner extract** (parents P0-1, P2-1): `record_fan_theories`
  tool in `apps/worker/src/extract/` (sibling of `record_knowledge`),
  `scripts/community/theory-miner.mjs`, redline screen, hashed authors,
  candidate upsert + dedupe by `theory_key`. Battery test: 30 fixture
  bundles incl. 10 redline traps that must yield zero rows.
- **P2-3 Merge + promote pass** (parents P2-2): weekly Opus pass merges
  near-duplicate candidates, sets stance/heat, promotes to `live_theory
  (origin='fan', persistent=true)`; `theory-resolve` nightly matcher →
  `egg_ledger` precedent candidates via PR. Extend `knowledge-coverage.mjs`
  to report fan-theory counts.
- **P2-4 Clue Web + eggs board surfacing** (parents P2-3): origin badge,
  heat cluster, "Live now" strip, LiveTheoryCard fields (mention_count,
  communities, stance). Screenshot-verified on mobile + desktop viewports.
- **P2-5 Clownbot chip + eval** (parents P2-3): "What are fans theorising
  right now?" chip (zero-model), `clown:eval` re-run showing fan theories
  are cited and grounded; battery unchanged-green.
- **P2-6 Song-page weaving intake** (parents P2-3, docs+script): weekly
  report of persistent theories with `track_slug` + mainstream coverage
  found → Content Shift intake issues (leads only, per theory-weaving.md).
- **P2-7 Fan-merch widen (E5)** (GATE-P0 + P1-3): watchlist-driven
  `REDDIT_SUBREDDITS`, FB export shop-link input, same allowlist/curation.
- **GATE-P2** (parents P2-4, P2-5, P2-6, P2-7).

### Phase 3 — hardening + docs (parents GATE-P1, GATE-P2)
- **P3-1 Ops doc + kill-switch drill**: `docs/community/README.md`
  (operator view: what emails you'll get, how to ack, how to stop it),
  CLOWNBOT.md § "fan corpus" update, AUTOMATION.md rows finalised, a
  disable/enable drill recorded.
- **P3-2 30-day review card** (scheduled, docs-only): posted-vs-drafted
  ratio, link-CTR via UTM (`utm_source=reddit&utm_medium=comment`), theory
  corpus size/resolutions, cost; recommend cap/model changes; propose (or
  not) the relay-posture change to Joey with data.

Founder steps interleaved (not cards; go in the daily brief "Waiting on
you" with exact clicks): Gmail forward filter (before P1-7), first FB export
(before P1-3 calibration), confirm watchlist (P0-2 output), read the first
dry-run email (P1-7).

Parallelism: P0-1..P0-4 together; P1-1, P1-2, P1-3, P1-4, P1-5, P2-1, P2-7
all runnable the moment GATE-P0 clears (7 leaves); P1-6/P2-2 next; then
P1-7/P2-3; then P2-4/P2-5/P2-6; then P3. Suggested overnight monitor:
`cc-ready-task-sweep-swift2` while Phase 1/2 fan out.
