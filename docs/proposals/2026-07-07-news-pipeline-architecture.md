# Proposal — News / Current pipeline architecture

Owner: Wyatt (CTO). Status: **PROPOSAL — pending Wyatt (architecture) and Joey
(product questions in §9)**. Date: 2026-07-07.

> **Scope guard.** v1 is Vault-only (`docs/decisions.md`, 2026-07-03) — this
> defers the **automated** ingestion/clustering/ranking/notification engine
> described below, not recent content in general (see the 2026-07-11
> clarification in `docs/decisions.md`: the Vault has always covered anything
> already-happened, regardless of recency; recent events get added manually
> until this pipeline exists). This doc is **de-risking groundwork for the
> post-v1 News/Current world**, not a build plan for now. Nothing here touches
> the Vault's runtime path, and nothing in it is scheduled until v1 ships and
> Joey specs the news product. The only code that lands with this proposal is
> the low-obsolescence subset in §8.

## 1. Why now

`docs/vision.md` makes "awesome recent news" the primary pillar: AI + user
input to ensure stories are real, filter (or label) fake ones, across every
aspect of Taylor's life, with notification quality as the retention engine.
The sibling project **Orbit** already runs this exact pipeline shape in
production for the same problem domain. Surveying it now — while it's fresh
and before Swift2's news product is specced — lets us (a) write down what
transfers, (b) reserve the architectural boundaries cheaply, and (c) avoid
re-deriving a design we already operate.

**What Orbit is and isn't evidence for:** its *pipeline code* (ingest,
clustering, classification, cost caps) runs live and is real, reviewable
engineering. Its *content* (`outfits`, song `lore`, seeded `stories`) was
found to be AI-drafted/fabricated (`docs/roadmap.md`, "Ported from Orbit").
So: port code and patterns after reading them; port **zero** data; treat any
Orbit dev/seed script as radioactive.

## 2. Goals / non-goals

**Goals (of this proposal):**

- A pipeline design (ingest → normalize → cluster/dedupe → classify/rank →
  verify → store → serve) we're confident enough in to stop re-litigating.
- A News data model that is **structurally incapable of coupling to the
  Vault** (separate tables, routes, data-access modules; no cross-world FKs).
- A worker/runtime shape with Orbit's cost discipline built in from line one.
- A credibility/verification model sketch — the one pillar Orbit does NOT
  have and the vision's most distinctive promise.
- An honest inventory of what's safe to build today vs. what must wait.

**Non-goals:**

- No ingestion adapters, ranking behavior, UI, or notifications get built now.
- No new Supabase tables now. The schema in §4 is a *shape proposal*; the
  migration is written only when news work is actually scheduled.
- Notification design is a stub (§7) — it's a separate, product-heavy doc.

## 3. Pipeline design

One cycle, run on a schedule, one-shot (start → run → exit; no resident
process, no always-on cost). Stage isolation: a failing source, classify pass,
or verify pass logs and skips — never aborts the cycle. This is Orbit's
`run-cycle.ts` orchestration with one added stage (verify) and one renamed
emphasis (rank):

```
        ┌──────────┐   ┌────────────┐   ┌───────────────┐   ┌──────────────┐
poll ──▶│ 1 INGEST │──▶│ 2 CLUSTER  │──▶│ 3 CLASSIFY /  │──▶│ 4 VERIFY /   │
        │ adapters │   │ dedupe     │   │   RANK        │   │   CREDIBILITY│
        └──────────┘   └────────────┘   └───────────────┘   └──────┬───────┘
             ▲                                                     │
     sources config                                          ┌─────▼──────┐
     (DB rows, no code                                       │ 5 NOTIFY   │
      change per source)                                     │ intent only│
                                                             └─────┬──────┘
                                                                   ▼
                                                        stores → serve (RLS
                                                        public-read, /current)
```

1. **Ingest.** Pluggable `SourceAdapter` per source *type* (rss, reddit,
   youtube, bluesky, …); source *instances* are DB config rows, so adding a
   feed is a data change, not a deploy. Adapters return normalized items:
   title + snippet + link + metadata **only** — never article bodies, never
   rehosted images (standing rule, `docs/architecture.md`). Idempotent upsert
   on `(source_id, external_id)`.
2. **Cluster / dedupe.** Two passes, exactly Orbit's proven split:
   - *Cheap lexical pass (free, every cycle):* normalized-title token-set
     Jaccard against a rolling window (72h in Orbit) via a pure, in-memory
     `clusterBatch` — many raw items collapse into one story.
   - *Semantic pass (LLM-assisted, capped):* lexical similarity proposes
     borderline candidate pairs; the LLM adjudicates "same event?" and merges
     paraphrase misses. Skips gracefully when the cap is hit.
3. **Classify / rank.** Each story classified **exactly once** (guarded by
   `classified_at`): category, neutral rewritten headline, 1–2 sentence
   summary, importance 1–10. Primary implementation = LLM behind the capped
   client; fallback = deterministic keyword classifier (free, always
   available). Feed ranking is then a pure query concern (recency ×
   importance), not a stored score to recompute.
4. **Verify / credibility.** New for Swift2 — see §5. Rule-based first
   (source tiers + corroboration count), LLM only as a capped assistant for
   flagging, never the sole authority on "real vs fake".
5. **Notification intent.** Record *intent* rows only (which user should hear
   about which story, and why). Delivery is out of scope here (§7).

**Serving:** News stories are read directly from Postgres via RLS public-read
(anon key), on their own routes/surfaces (e.g. `/current`), with short-TTL
caching at most. The Vault keeps its static, CDN-cached, versioned payload.
The two serving paths share nothing but the Supabase project.

## 4. Data model (proposal — no migration yet)

All news tables carry a **`news_` prefix**. That makes the two-worlds
boundary (`docs/decisions.md`, 2026-07-02) grep-able and unambiguous next to
the unprefixed Vault tables (`era`, `milestone`, `month_item`, `moment`,
`track_note`). **Hard rules:** no foreign keys in either direction between
`news_*` and Vault tables; no Vault query may join or read `news_*`; the
Vault's Tier-0 payload builder and budget gate never see news rows.

Shape (adapted from Orbit's schema, which is running well in production):

- **`news_source`** — one row per configured source instance.
  `id, source_type (enum), config jsonb, tier (see §5), is_enabled,
  last_polled_at`. No secrets in `config` — keys live in worker env only.
- **`news_raw_item`** — every ingested item, pre-dedup. `id, source_id,
  external_id, url, title (≤500 CHECK), snippet (≤2000 CHECK), author,
  published_at, image_url, raw_payload jsonb (trimmed), similarity_key,
  story_id nullable, created_at`. `UNIQUE (source_id, external_id)`.
  CHECK lengths are the no-bodies backstop, same as the Vault's.
- **`news_story`** — the deduplicated unit users read. `id, canonical_title
  (≤500), summary (≤1000), category, importance 1..10, source_count,
  verification_status (see §5), corroboration jsonb, first_seen_at,
  last_updated_at, top_image_url, classified_at, verified_at`.
  Partial indexes on `classified_at IS NULL` / `verified_at IS NULL` keep the
  once-only stages cheap.
- **`news_story_source`** — audit trail story → supporting raw items
  (`outlet_name, url`); drives "reported by N sources" and the credibility
  display.
- **`news_llm_usage`** — durable daily LLM-call counter backing the hard cap
  (Orbit's `claude_usage` + `increment_claude_usage()` RPC, renamed).

Deliberately **not** designed yet: user preference / subscription tables
(they belong to the notification design, §7) and any Taylor-specific enum of
categories (Joey's call; Orbit's set — music, tour, personal, business,
fashion, awards, controversy, other — is the starting candidate, and the
Vault's `VAULT_CATEGORIES` is a second input. The two sets do NOT need to
match; the worlds are separate).

Orbit's `channels` table (artist-agnostic multi-figure support) is dropped:
Swift2 is single-subject by definition. Search terms become worker config.
This deletes a join from every query and a concept from every table. If we
ever want multi-subject, that's a different product.

**RLS:** `news_story` / `news_story_source` public-read like the Vault;
`news_raw_item`, `news_source`, `news_llm_usage` **no public policies at
all** (service-role/worker only) — raw items are pipeline internals.

## 5. Source / credibility model ("filter fake stories")

This is the pillar Orbit does not have (verified by search: no credibility
concept anywhere in its worker or schema) and the vision's sharpest promise.
Design principles:

1. **Rules decide, LLM assists.** Truth-status must be explainable and cheap.
   The base signal is *who* reported it and *how many independently did*:
   - `news_source.tier`: `official` (Taylor's own channels, TAS/UMG
     announcements) · `established` (major outlets with editorial standards) ·
     `fan` (fan accounts/aggregators — fast but rumor-prone) ·
     `unverified` (open social).
   - Corroboration = count of *distinct* tier-weighted outlets on the story
     (from `news_story_source`), stored on the story as a small jsonb
     breakdown so the UI can show its work.
2. **`verification_status` enum** on `news_story`:
   `official` · `corroborated` · `single_source` · `rumor` · `disputed` ·
   `debunked`. Pure functions of the corroboration breakdown for the first
   four; `disputed`/`debunked` require an explicit signal (a tiered outlet
   publishing a denial/correction, or founder/moderator action).
3. **Both product options stay open.** The vision hesitates between *hiding*
   fake stories and *showing them labeled*. `verification_status` supports
   either as a pure serving-time filter — the pipeline stores everything and
   never destroys the signal. Joey decides at product time (§9).
4. **LLM's bounded role:** same-event adjudication (already in the dedupe
   pass) and *flagging* candidate disputes (e.g. headline contains a denial of
   another story). It never sets `debunked` alone. All calls behind the cap.
5. **User input** ("uses AI & user input", per the vision): a report/confirm
   affordance feeding a moderation queue is anticipated but **not designed**
   — it needs auth + abuse thinking and a product spec. Placeholder only.

Tier assignments live in the `news_source` row (data, not code), so
recalibrating an outlet is an UPDATE, not a deploy.

## 6. Worker / runtime shape

- **Location:** `apps/worker` becomes a real workspace (`@swift2/worker`)
  when news work is scheduled. Today it holds only the gitignored `.env` the
  DB scripts read — that stays as is.
- **Execution model:** one-shot process, exactly Orbit's: run one full cycle,
  exit. Scheduled by **GitHub Actions cron** (hourly to start) with a
  `concurrency` group so cycles never overlap (keeps the daily cap counter
  honest) and `workflow_dispatch` for manual runs. Free-tier minutes cover an
  hourly cadence comfortably; no new hosting, accounts, or spend. If cadence
  ever needs to beat ~15min granularity, revisit (Supabase cron / a tiny VM)
  — that's a later decision with real alternatives.
- **Cost discipline (CLAUDE.md, runtime bill):**
  - ONE module owns every LLM call (Orbit's `claude-client.ts` pattern):
    hard **daily call cap** checked before each call, durable counter in
    `news_llm_usage` with an in-process floor so the cap bounds a run even if
    the DB is unreachable; structured JSON output; one retry; every issued
    call counted, success or not.
  - Cap hit ⇒ `RuleBasedClassifier` fallback (deterministic keywords) and the
    semantic dedupe pass skips. **The pipeline is fully functional with zero
    LLM calls** — degraded quality, not degraded availability.
  - Small/cheap model (Orbit uses Haiku-class, ~200 calls/day cap, ≤400
    output tokens/call — order of $0.x/day worst case). Swift2 numbers get
    their own decision-log entry with a cost model before the worker ships
    (per `docs/architecture.md` AI-integration).
  - **No LLM call in any user-request path. Ever.** All calls are inside the
    scheduled worker cycle.
  - Per-source item caps and HTTP timeouts/retries as config, one central
    config module (Orbit's `packages/shared/src/config.ts` pattern).
- **Secrets:** worker env only (`apps/worker/.env`, gitignored; GitHub
  Actions secrets in CI). Never in DB rows, never in the repo.

## 7. Notifications (stub — deliberately)

The vision makes notification quality the retention engine ("user MUST get
notified only for what they want, at the rate they prefer"). That is a large,
product-led design: preference model (per-category × rate × quality bar),
digest vs push, onboarding-as-experience, quiet hours, budgets per user. None
of it is designable before Joey specs the news product — and 2026-07-03
explicitly deferred notification onboarding out of v1.

What this architecture *reserves* so the later design slots in cleanly:

- The pipeline ends at **notification intent**, not delivery: an idempotent
  `news_notification_log`-style table (Orbit's pattern — `UNIQUE (user,
  story, delivery_channel)`, `sent_at NULL` until delivered) decouples
  "should this user hear about this?" from "how do we reach them?".
- `importance` (1–10) + `category` + `verification_status` on every story are
  exactly the inputs a threshold/preference model consumes. Nothing else is
  promised.

Everything further: separate proposal, after v1, Joey first.

## 8. What's reusable from Orbit (file-level)

Orbit root: `C:\Users\wjduv\Desktop\Vibe Coding\Orbit`. "Port" = copy into
Swift2 and adapt names/imports; all porting happens when news work is
scheduled, except the two ✅ items landing with this proposal.

**Port nearly verbatim — proven, pure, product-independent:**

| Orbit file | What | Notes |
|---|---|---|
| `apps/worker/src/pipeline/cluster.ts` | pure `clusterBatch` dedup clustering | ✅ **ported now** → `packages/shared/src/news/cluster.ts` (see §8.1) |
| `apps/worker/src/similarity/lexical.ts` + `similarity/types.ts` | token-set Jaccard similarity provider | ✅ **ported now** → `packages/shared/src/news/similarity.ts` |
| `apps/worker/src/classify/usage-store.ts` | durable daily-cap counter (+ in-process floor) | port with `news_llm_usage` table when worker is built |
| `apps/worker/src/classify/claude-client.ts` | the single capped LLM-call module | port; re-check SDK/model ids at port time |
| `apps/worker/src/classify/rule-based.ts` | free deterministic fallback classifier | port; keyword lists are Taylor-relevant already |
| `apps/worker/src/util/http.ts`, `util/text.ts`, `util/log.ts` | timeouts/retries, snippet/title trimming, structured logs | small, boring, port |

**Port with adaptation:**

| Orbit file | Adaptation |
|---|---|
| `apps/worker/src/pipeline/run-cycle.ts` | drop the `channels` loop (single-subject), add the verify stage |
| `apps/worker/src/sources/{types,registry,rss,reddit,youtube,bluesky}.ts` | adapter contract + registry port cleanly; **which** adapters Swift2 ships is a product/source decision — do not pre-build |
| `apps/worker/src/sources/relevance.ts` | search-term filter; terms move from channel row to config |
| `apps/worker/src/pipeline/dedupe.ts` | semantic merge pass; keep its conservative "unsure ⇒ separate" stance |
| `apps/worker/src/classify/claude-classifier.ts` | prompt/rubric is figure-agnostic and good; categories + importance rubric need Joey's pass |
| `supabase/migrations/20260521120000_init_schema.sql` + `..._claude_usage.sql` | basis of §4, with `news_` prefix, no `channels`, plus tier/verification columns |
| `.github/workflows/poll.yml` | cron + concurrency-group scheduling pattern |
| `packages/shared/src/config.ts` | central tunables/caps pattern |
| `packages/core/src/feed.ts` | reader-side feed queries (recent/top, category filter, pagination) → future `packages/core/src/news.ts` |

**Do NOT port:**

- `apps/worker/src/dev/*` content/drafting scripts (`draft-lore.ts`,
  `draft-fashion.ts`, `seed-data.ts`, `seed.ts`, mock seeds) — this is the
  machinery that produced Orbit's fabricated content. The one factual asset
  there (`dev/songs-data.ts` track metadata) is already tracked on the
  CONTENT track (`docs/roadmap.md`), unrelated to news.
- Orbit's `channels` model and its data. Different backend, single subject.
- `notify/email-digest.ts` — superseded by the future notification design.
- Anything under `similarity/embedding-*` — Orbit defaults to lexical;
  embeddings are an optimization to earn with evidence, not inherit.

### 8.1 What lands with this proposal (built now)

**`packages/shared/src/news/`** — portable, zero-I/O news-pipeline domain
logic: normalized-item type, similarity provider interface + lexical
implementation, and the pure `clusterBatch`, with tests. Rationale for "safe":
any conceivable news pipeline needs dedup clustering; the logic is pure math
over titles (no schema, no product decisions baked in); it's proven in Orbit
production. It is exposed **only** via the `@swift2/shared/news` subpath —
not the root barrel — so the Vault's import surface is untouched and the
boundary is grep-able. Nothing imports it yet.

## 9. Safe to start now vs. must wait

**Safe now (ranked by confidence it survives any product decision):**

1. ✅ **This proposal** — the design itself is the de-risking.
2. ✅ **`packages/shared/src/news/` pure dedup domain** (§8.1) — built.
3. **Table-shape proposal** (§4) — documented here, **deliberately not
   migrated**. Writing SQL now would be cheap but reversing a deployed schema
   isn't; it waits for the scheduled work + Wyatt's sign-off (draft decision
   entry filed).
4. *(borderline — proposed, not built)* `@swift2/worker` skeleton that
   compiles and runs an empty cycle. Genuinely low-risk, but near-zero value
   until adapters/schema exist, and it adds CI surface. Deferred.

**Must wait (on product / notification decisions or v1 shipping):**

- Source list + adapters (which feeds/subreddits/APIs — product + ToS pass).
- Category set, importance rubric, ranking behavior — Joey.
- Fake-story UX: hide vs show-labeled (§5.3) — Joey.
- User-input/report loop (§5.5) — needs auth + moderation product thinking.
- All notification work (§7).
- Any UI/surface for `/current` — post-v1 by decision.
- Migrations, worker build-out, scheduling workflow — when scheduled.

**Open questions for the founders:**

- **Joey:** hide vs label fake stories? Category set for news (reuse Vault's
  seven, Orbit's eight, or new)? What does "user input" for verification look
  like at minimum? When after v1 does news enter the roadmap?
- **Wyatt:** approve the `news_` table shape + no-cross-world-FK rule (draft
  decision entry, `docs/decisions.md`)? Hourly GitHub-Actions cadence
  acceptable as the starting scheduler? Cap numbers/model for the cost-model
  decision entry when the worker is scheduled.

## 10. Obsolescence honesty

What in this doc could still be invalidated: if Joey pivots news toward
social/UGC-first rather than aggregation-first, the ingest/cluster core
survives but ranking/credibility weights change; if the product becomes
notification-first ("no feed, only pings"), the serving section shrinks but
the pipeline stands; if Supabase is replaced (no sign of that), the schema
section resets. The two things effectively certain regardless: dedup
clustering of multi-outlet reporting (built), and the two-worlds isolation
rule (already decided 2026-07-02). Everything else is documented, cheap to
revise, and intentionally unbuilt.
