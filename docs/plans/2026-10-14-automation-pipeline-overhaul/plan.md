# Project Tidewatch: plan of attack for the 11 goals

Generated 2026-10-14 (PDT) by the lead planner (Opus 5.5, read-only pass). Structured twin: `plan-items.json` in this folder (same ids). Item, token and scorecard tables at the end of this file are generated from that JSON, so the two cannot drift.

---

## A. Executive summary (plain language)

**What we are building.** A watcher called Tidewatch. Every 10 minutes it looks at Taylor's official sources, and every hour it looks at everything our pipelines have collected (news, YouTube, intake, merch, Reddit, Facebook, theories, social replies, newly shipped moments). It remembers what it has already seen, asks Jev (a cheap decision model that answers typed questions) what each new thing is, and asks Haiku 5.5 instead whenever Jev is unsure. Each kind of item then goes down its own branch automatically: big confirmed news goes to the site, phones and social within the hour after a fact-check written in code; normal news goes to the live feed and the Vault queue; merch goes to the merch lanes; theory material and duplicate threads feed the clowning database; good Reddit and Facebook threads become better cards for you to comment on.

**In what order.**
1. This week (Phase 0): stop losing work. Routines pause cleanly when the Claude weekly limit hits instead of failing, the most expensive routines move to cheaper models, the social test storm and the stuck Instagram post are fixed, the Awin merch sync stops hanging, the push path gets safety catches, and we start measuring real usage.
2. Week 2 (Phase 1): build the foundations (Jev client, the "seen" store, the classifier running in shadow mode, which logs decisions without acting) and move work off the Claude plan: routing goes to Jev and code, one-shot drafting goes to direct Haiku/Sonnet 5.5 calls, and code building goes to Codex on your always-on PC. Fix the inputs: a home Reddit reader on joey2023, Facebook post links, the merch matcher, fan-made merch, theories.
3. Weeks 3 to 4 (Phase 2): Tidewatch goes live one class at a time, critical news last, after a drill. A retraction path is built because none exists today.
4. Weeks 5 to 6 (Phase 3): measure upvotes and replies, measure recall, score voice, raise output caps where quality holds, and let a script write the weekly scorecard.

**What it fixes.** Lost Vault Runs and empty answerers (the weekly limit), the 161 stuck social PRs, Facebook cards whose only link opens a search, thin one-sentence Reddit replies, zero theories mined, zero merch matched since August, an Awin sync that never finishes, no breaking-news lane, no retraction path, and no measurement for goals 1, 2, 8 and 9.

**Token headline.** Estimated Claude routine usage drops from about 8,800 to about 3,950 Sonnet-equivalent turns a week (about 55 percent) from this plan alone, and to about 2,000 (about 77 percent) once PR #5484 retires the Tree and Marjorie Actions routines that Hermes replaces. These are estimates (turns assumed at half of max_turns); the turn ledger built this week replaces them with measured numbers. Build work shifts to roughly 65 percent Codex, 35 percent Claude.

**What it needs from Joey (all one-time, about an hour in total, nothing blocks on the affiliate accounts):**
- Answer nine decisions in chat (D1 to D9 below, each with a recommended answer).
- Put the Jev key into Swift2 as a GitHub secret from a Hermes session (a copy-paste prompt is below).
- Set a monthly spend limit on the Anthropic API key.
- Confirm in a Hermes session that the Hermes Tree and Marjorie loops are running, so #5484 can merge.
- Run two installers on joey2023 and reload the Facebook extension when told.
- Whenever you like: Awin joins and the Amazon store ID, then paste the two IDs in chat.
- Merge one founder-owned rules PR (breaking news and confirmed personal-life news).

---

## B. The Tidewatch automation flow

### B.0 Shape of the system

```
every pipeline (already running)          Tidewatch (new, plain code on the home clock)
news worker  ---------------------+
fast primary-source poll (10 min)-+
YouTube / appearance -------------+      collect  ->  seen store  ->  code prefilters (redline, duplicate)
intake issues / CIE --------------+                        |
merch syncs / fan-made -----------+                        v
home Reddit reader / RSS fallback-+                  Jev: one call, many typed questions
Facebook export ------------------+                        |  confident          |  unsure / error
theory crawl / miner -------------+                        v                     v
social ledgers / replies ---------+                  action router  <-------  Haiku 5.5 (enum answer, trusted)
new seed moments -----------------+                        |
                                                           +--> critical / personal / correction:
                                                           |      code fact-check -> Sonnet 5.5 verifier
                                                           |      -> live card + push (governor) + breaking social
                                                           +--> normal news: live card, Vault intake, social candidate
                                                           +--> merch: E6 matcher queue, fan curation, official events
                                                           +--> theory / duplicate: harvest comments -> theory candidates
                                                           +--> discussion: ranked card with context -> owner posts
                                                           +--> rumor: Rumor Desk; noise: discard; redline: drop
                                                     decision ledger + story timeline -> weekly scorecard
```

Where it runs: `tidewatch.yml` is a plain `run:` workflow in GitHub Actions (no agent, no OAuth turns), dispatched by the existing clock table (`scripts/ops/clock-table.json`, fired from `bot-chat-poll.yml`): `mode=fast` every 10 minutes (minGap 9), `mode=sweep` hourly (minGap 55). It needs `TYPESAFE_API_KEY` (new secret), `ANTHROPIC_API_KEY` and the Supabase secrets (both exist). If the measured clock fire rate (P0-07) is below 90 percent, a joey2023 scheduled task dispatches the same workflow as a second clock. The home Reddit reader and the Codex worker run on joey2023 (this machine, verified: hostname Joey2023, Codex CLI 0.154.0 installed).

### B.1 Seen-content tracking ("how do we know what we already have")

Design: a **pull model**. A new collector reads each pipeline's existing store on a cursor and writes one `watch_item` row per item, keyed by a canonical `item_key` built from the key that pipeline already uses. It never re-fetches sources and never edits other pipelines, so it cannot collide with their owners.

| Source | Existing key reused | item_key |
|---|---|---|
| News worker (rss, google_news, gnews, bluesky, tumblr, reddit_rss, site_diff) | `news_raw_item` unique (source_id, external_id); clustered into `news_story` by `similarity_key` | `news:<story_id>` |
| Fast primary-source lane | same `news_raw_item` key; tier from `news_source.tier` and `OFFICIAL_DOMAINS` | `news:<story_id>` |
| YouTube / appearance discovery | intake dedupe label | `yt:<videoId>` |
| Site diff (taylorswift.com, store) | content hash | `site:<url_norm>#<hash>` |
| Intake issues, CIE | issue number | `issue:<n>` |
| Reddit leads (scan, awareness, home reader) | `engagement_lead_dedupe_idx` (platform, coalesce(thread_id, locator), kind); `awareness_source_state` | `lead:reddit:<thread_id>` |
| Facebook export | same index | `fb:<group>:<post_id>` or `fb:<slug>:<sha1(locator)>` |
| Gmail replies to us | message id | `mail:<id>` |
| Theory bundles | thread id + comment-count bucket | `bundle:<thread>:<bucket>` (skip unchanged threads) |
| Theory candidates | `fan_theory_candidate.theory_key` | `theory:<key>` |
| Official / fan / Awin merch | seed URL, Etsy listing id, advertiser mid + product id | `merch:official:<url>`, `merch:fan:<id>`, `awin:<mid>:<pid>` |
| Social posted, social replies | `social/posted/*.json`, `social-reply-ledger` branch | `post:<platform>:<id>`, `reply:<platform>:<id>` |
| Notifications | `events.dedupe_key` unique | unchanged |
| New seed moments | content diff since cursor | `moment:<id>` |

Duplicates across sources, in three layers: exact `item_key`; normalized URL hash (lowercase host and path, tracking parameters stripped); 64-bit title simhash with Hamming distance 3 or less within 72 hours. What remains ambiguous gets one Jev question, "which of these up to 8 existing stories is the same event, or none", with candidates chosen by token overlap. News is decided at the `news_story` level because the worker already clusters.

New tables (P1-02): `watch_item`, `watch_decision` (class, confidence, decider, model id, answers, action, shadow flag), `watch_cursor`, `story_timeline` (first_public_at, detected_at, classified_at, verified_at, on_site_at, social_at, push_at). Retention: items 180 days (noise 30, redline hash only), decisions 365 days, timelines kept. Volume is a few thousand rows a day: negligible cost.

### B.2 Classification taxonomy

Fifteen classes. The full definition, signals, Jev questions, thresholds, action, notification, social, site and SLA for each class are in the taxonomy table at the end of this file and in `plan-items.json`. The key design rules:

- **One Jev call per item** asks the whole question bank in parallel (Jev runs questions in isolation; 13 questions cost about the same as one): `q_class` (Choice over 13 classes, option order randomized per call to cancel Jev's first-option bias), `q_official` (Noul), `q_settled` (Choice: stated as fact, official statement, unnamed sources, speculation, joke), `q_urgency` (Score 1 to 5), `q_personal`, `q_speculation` (redline), `q_same_story`, `q_theory`, `q_outfit`, `q_merch_kind`, `q_bootleg`, `q_discussion` (Score), `q_contradicts`, `q_injection`. Context packed into the state: title, source name and tier, URL host, published time (as text, since Jev is weak at date math, code computes age and passes "posted 40 minutes ago"), snippet or body excerpt up to 2,000 characters, the top 8 candidate stories, and for corrections our published summary.
- **Thresholds are per class and asymmetric.** For critical news the bar to become a *candidate* is low (probability 0.30, or urgency 4 or more with an official signal), so nothing is missed (goal 2); the bar to *act* is high (0.90 or Haiku agreement, plus the code fact-check, plus a Sonnet 5.5 verifier). For privacy redlines the bar to *drop* is low (0.35) because dropping is the safe direction.
- **Owner's rule implemented literally:** Jev confident means route now; Jev unsure (below the class threshold) or Jev erroring means Haiku 5.5 answers from a fixed enum and its answer is trusted. The only exceptions are the three consequential classes (critical, personal, correction): there a model answer never acts alone.
- No class sends anything to a human for review. Below-threshold critical items simply fall to normal news or rumor; the owner is never on the path.

| Class | Act at | Branch (short) | Push | SLA |
|---|---|---|---|---|
| critical_breaking | 0.90 + fact-check + Sonnet | live card, push, breaking social, Vault intake | T1 song/album/tour | site 45 to 60 min |
| critical_personal (Baby Watch) | 0.95 + strict bar + Sonnet + 10-min re-check | same, warm and factual, no countdown framing | baby_watch / T2 relationship_news | site 60, social 90 min |
| official_drop | 0.85 | live card with thumbnail, Vault embed, priority social | T1 song_drop or T2 official_youtube | site 60 min, embed 24 h |
| tour_ticket | 0.85 | critical path if new dates or a sale; else normal | T1 tour_news | as critical |
| normal_news | 0.80 | live card, Vault intake if notable, social candidate | T2/T3 if confirmed | site 2 h, Vault 48 h |
| merch_official | code decides | existing store-drop draft | T2 official_merch | 24 h |
| merch_fan | 0.80, bootleg < 0.3 | auto-curation lane | T3 weekly | 7 days |
| merch_outfit | 0.75 | E6 matcher queue | none | 7 days |
| theory_material | 0.70 | theory candidate (our words) | T3 easter_egg when promoted | 24 h |
| fan_discussion | 0.70, score 4+ | ranked card with context | none | 60 min while thread < 6 h |
| rumor | 0.80 | Rumor Desk, re-check for confirmation | none | 48 h |
| correction_debunk | 0.80 + Haiku + Sonnet | retraction path | correction only to prior recipients | 30 min |
| duplicate | 0.85 | harvest comments for theories, then discard | none | 24 h |
| noise | 0.80 | discard | none | immediate |
| privacy_redline | 0.35 (drop) | drop, keep hash only | none | immediate |

Notification categories use NOTIFICATIONS_SPEC section 4 and the governor (opt-in only, quiet hours 22:00 to 08:00 local, 30-minute coalescing, 3 instant pushes per device per day, 6 per day ceiling). Breaking news gets **no** governor exemption, as the spec requires. A critical story at 3 a.m. reaches phones at 8 a.m. local; that is by design.

Social behavior today: IG and X must post as a pair (decisions.md:8458), the poster sends at most one item per platform per UTC day and one per run (`scripts/social/lib/queue.mjs:71-72`, verified), event drafts are capped at 2 a day, and Tree stamps its own drafts (v4 tree-auto, #5479 merged Oct 10, verified). Ruling D6 proposes a breaking campaign type with up to 2 extra posts per platform per day, drafted by one Sonnet 5.5 call, stamped by tree-auto, and dispatched immediately, pairing kept.

Site behavior: `current_item` written by the worker's existing path (`write-knowledge.ts`), which holds rows without an image (`current-item-quality.ts`: `missing_image`), read through a 15-minute ISR cache. The plan adds an official image fallback (P1-23) and an on-demand revalidation endpoint (P2-04) so critical cards appear within about two minutes of the write.

### B.3 Cascade, escalation, calibration and safety

- **Cascade:** code prefilters, then Jev (`jev-1.13.0` pinned, the version Hermes runs in ENFORCE mode today), then Haiku 5.5 (`claude-haiku-5-5`, structured output, enum only) when uncertain, then Sonnet 5.5 (`claude-sonnet-5-5`) only to verify critical, personal and correction items. No Opus and no Codex at runtime.
- **Jev failure modes:** HTTP 402 (prepaid credits exhausted) or timeouts switch the run to Haiku-only and open one alert; Haiku cap reached switches to code rules plus "hold" for anything that would act. Nothing fails silently.
- **Calibration:** a frozen replay set (P1-04) of about 600 items: 90 days of stories with sources, the 21 growth-strategy time-sensitive events, Reddit and Facebook leads, merch and theory bundles, plus clearly flagged synthetic critical and personal cases. Labels come from Sonnet 5.5 through the Batch API (half price) with the PM spot-checking 30 hard cases. Required before go-live: critical candidate recall 100 percent on the replay set; critical act precision after fact-check 100 percent; per-class precision targets set in `config/tidewatch.json`.
- **Shadow mode:** at least 7 days and 500 decisions logged with no actions (P1-06, P1-07), then a calibration review (P2-01), then a drill (P2-12), then classes go live one at a time with 48 hours between flips (P2-13).
- **Drift:** 5 percent of confident items are also sent to Haiku; a weekly report alerts if Jev and Haiku agreement drops by more than 5 points for any class (P3-06); `jev-1.14.0` is evaluated on the replay set before any pin change.
- **Kill switches:** `TIDEWATCH_FREEZE` (agents may switch it on, only the owner lifts it), existing `SOCIAL_FREEZE`, new `PUSH_FREEZE`, per-class `enabled` flags in config, 5-minute kill window on every push tier.
- **What is logged:** every decision with answers, confidences, decider, model id and action; five timestamps per story; every LLM call's caller, model and token counts in `llm_usage`. No raw Facebook member text, no member names.
- **Prompt-injection defence:** untrusted text is wrapped in explicit delimiters as data, stripped of URLs and markdown, length-capped; a `q_injection` Noul flags instruction-like text and such items never reach a drafter; the model only ever chooses from a fixed enum, actions are computed by code, and confirmations are checked in code against domain lists.

### B.4 Fact-check procedure for breaking news (in code, P2-03)

1. Gather the story's sources from `news_story_source` (outlet, URL, tier).
2. **Official rule:** host in `OFFICIAL_DOMAINS` (today only `taylorswift.com`, verified at `packages/shared/src/source-tiers.ts:141`; P1-08 adds label and press domains, official YouTube channel ids, and ticketing URLs only with Taylor's attraction id, with the mirror in `scripts/lib/reputable-sources.mjs`).
3. **Two-outlet rule:** two outlets from `ESTABLISHED_DOMAINS`/`OUTLET_TIER_MAP` with **different owners** (a small ownership map), rejecting syndicated copies (text similarity above 0.8 counts once, so one AP wire story in ten papers is one source).
4. **Each source must say it as fact:** fetch article text (`fetch-article-text.ts` exists), require an exact anchor string match, then Jev's citation check (supports, contradicts, unrelated; 0.8 or more) and a Noul "stated as settled fact, not reported or rumored".
5. **Personal-life bar:** an official post or a rep statement quoted by a tier-1 outlet, or two tier-1 outlets stating it as fact, plus a 10-minute re-check that the sources still say it.
6. **Sonnet 5.5 verifier:** one structured call reviews the claim and source passages; disagreement means "not confirmed".
7. Result `{verdict, basis, sources}` is stored and `story_timeline.verified_at` set.

**Corrections and retractions (none exist today, P2-07 and P2-08):** a `correction_debunk` decision, or a manual dispatch of `tidewatch-retract.yml` with a story id, hides the live card (status debunked), kills pending pushes for the story, sends a correction push only to devices that received the original, deletes Instagram and Facebook Page media through the existing `social-delete-media` flow, deletes the X post (or replies with a correction if deletion is not available on our X tier, UNVERIFIED), and logs everything.

### B.5 Duplicates: discard, but harvest first

Before a duplicate is discarded, its conversation is mined (P2-10): for Reddit, the home reader fetches the comment tree transiently, Jev's `q_theory` runs over comment batches, and Haiku 5.5 writes each positive as a claim in our own words into `fan_theory_candidate` (incrementing `mention_count` on the existing `theory_key`). For Facebook, the ruling of 2026-08-11 (decisions.md:5122: groups are leads only, no member names or verbatim quotes) limits harvest to counts and our-words summaries. A duplicate news story also increments the story's source count, which can upgrade it to corroborated or confirmed.

### B.6 Merch branch

- **What "however we did it before" means:** the 94 matched products on moments came from in-session agent hand-authoring (#2186, #3257) driven by the fashion-products checker, verifying retailer pages and writing three products per moment with alternatives, followed by one E3 vision audit (#3486, Aug 30) that removed 25 mismatches. No automated path has ever added a product.
- **Official merch:** already automatic (store sync twice a day, 20 of 20 green). Tidewatch adds the T2 `official_merch` event and confirms the store-drop draft exists.
- **Fan-made:** P0-10 fixes the scheduled dry-run bug (`merch-fanmade.yml:52` defaults to dry-run on schedule, verified); P1-20 adds an auto-curation lane (Jev bootleg check, Haiku 5.5 vision D3 check, E1 and E2 verification, up to 5 items a week into `fanmade.mjs`).
- **Outfit-matchable:** P1-19 replaces the stubs in `merch-matcher-authoring.yml` (lines 86 and 89 pass `extractImpl: async () => ({})` and `judge: async () => ({score: 0})`, verified), adds the missing E6 step-4 writer, runs the E3 auditor automatically as the quality gate, and schedules it Tuesday and Friday at 3 looks per run with a $3 metered cap and 5 paid searches.
- **Awin repair (P0-09):** transaction-wrapped full-text rebuild, cache saved even on timeout (today the save step has no `if: always()`, verified), per-feed checkpoint, joined advertisers only, no PR when only the timestamp changed, and the 6-hourly clock row removed.
- **Joining programs** is owner action OA-6 and blocks nothing: matching proceeds with direct links, and wrapping turns on at render the moment the two public IDs are set in Vercel.

### B.7 What "flows normally" means

| Class | Cadence | Lane and owner | PR or direct write | Gates |
|---|---|---|---|---|
| normal_news | hourly sweep | worker extract writes `current_item`; Vault Content Shift authors the moment | live card direct; moment by content PR | quality gate (image), redlines, validate:content, check:voice, auto-merge |
| official_drop | 10-minute fast lane | as normal, plus priority intake label `video-drop` | same | same, plus YouTube oEmbed check in Content Shift |
| merch_official | store sync twice a day | merch-official-sync | content PR | E1, E2, auto-merge |
| merch_fan | weekly curation | P1-20 lane | content PR | D3 check, E1, E2 |
| merch_outfit | Tue and Fri | E6 matcher | content PR | E3 audit floor, E1, E2, validate:content |
| theory_material | daily miner, weekly promote | theory miner and promote | DB rows; weaving by intake issue | redline screen, theory hard ban |
| fan_discussion | every 20 minutes | drafter and cards | Discord card; owner posts | caps 15 a day, 4 for the top two subs, 3 elsewhere |
| rumor | hourly re-check | Rumor Desk lane (even days) | content PR | sourcing bar, rumor tier |
| duplicate, noise, redline | each run | Tidewatch | DB only | none needed |

---

## C. Fix list (everything from the research, mapped to items)

| Problem (source) | Item |
|---|---|
| CI storm: `draft-happy-path.test.ts` reads live `social/posted` and pins photo `speaknow-inglewood-2023-2` (verified lines 24 and 123-131) | P0-03 |
| `dorny/paths-filter` with `'**'` and negations, no `predicate-quantifier` (verified `ci.yml:48-58`) | P0-03 |
| 161 open social-poster state PRs (verified Oct 14 night; brief said 154 to 159) | P0-04, P0-05 |
| Stuck 10-11 Instagram item still in `social/queue/` on main (verified) | P0-04 |
| Unverified X 403 | P0-06 |
| No named weekly-limit alert; `session-outcome.mjs:44` regex only matches "usage limit reached" (verified) | P0-01 |
| No pause switch (guard step only checks the OAuth secret, verified) | P0-01 |
| Budget pools, per-run caps, uncapped Vault Run | P0-02, P1-18, D1, P3-09 |
| Answerer failures since Oct 12 (weekly limit, not a missing file) | P0-01, P1-10 |
| Vault Run: one session, six lanes, generated-file conflict, no yield record | P1-18 |
| Thin theory yield: RSS-only, 429, same 100 bundles, 0 theories | P1-15, P1-21, P2-10 |
| Media gate: one exists for seed moments; real gaps elsewhere | P1-23 |
| Voice: deterministic only, no critic, no exemplars | P1-24, P3-05 |
| Reddit supply: 429s, no scores in RSS | P1-15 (D3), P3-08 |
| Card quality: answerer sees only the title; no ranking; no comment URL | P1-10, P1-17, P3-01, P3-02 |
| Outcomes for goals 8 and 9 | P1-14, P3-01 |
| Facebook permalinks (lazy hrefs, schema, parser, ingest, privacy stance) | P0-08 interim, P1-16, D7 |
| News latency: 4.5 to 10 hour real gaps; no breaking lane | P0-02 (hourly), P1-08 (10-minute primary), P2-04 |
| Tree and Hermes handover (#5479 merged, #5484 open draft); new-moments feed not covered by #5484 | P0-16, P1-22, P1-25 |
| Push gaps: held rows still emit events (verified `write-knowledge.ts:241-244`); T2/T3 no delay window (verified `notification-events.ts:24`) | P0-11 |
| No retraction path | P2-07, P2-08 |
| Awin sync hang, lost cache, churn PRs | P0-09 |
| Fan-made dry-run on schedule | P0-10 |
| Matcher stubbed, writer missing | P1-19 |
| Dashboard claims wrong | P0-17 (list in section G) |

---

## D. Token model and funding

### D.1 Where the Claude weekly limit goes, and where each routine moves

The full per-routine table is generated at the end of this file (Token model). Method: turns per week estimated at half of `max_turns` times runs (research-jev-tokens.md), weighted into Sonnet-equivalent turns (SET) by list price relative to Sonnet (Opus 2.5x, Fable 5x, Haiku 4.5 0.5x). These are **estimates**; P0-07's turn ledger measures the real numbers within a week.

| | Sonnet-equivalent turns a week (estimate) |
|---|---|
| Today | about 8,800 (about 4,850 raw turns) |
| After Phase 0 and 1, without #5484 | about 3,950 (minus 55 percent) |
| After #5484 merges | about 2,000 (minus 77 percent) |

Biggest moves: marjorie-ops becomes code plus a Jev gate (about 1,100), status-reply becomes Jev plus templates (about 665), Austin's Fable 5 building goes to the Codex worker (about 725), ask-response to Sonnet 5.5 (about 500), Vault Run to Opus 5.5 plus Sonnet 5.5 craft lanes (about 575 saved while output rises), answerers become scripted Haiku calls (about 445), and #5484's retirements (about 1,950).

### D.2 Funding pools (decision D1)

| Pool | What runs on it | Cap mechanism |
|---|---|---|
| Max OAuth (`CLAUDE_CODE_OAUTH_TOKEN`) | Agentic routines only: Vault Run, Tree weekly plan, weekly review, ask-response, ops escalations, event drafts | `max_turns`, auto-pause on limit with content priority (P0-01) |
| Metered API key (`ANTHROPIC_API_KEY`, already a secret, already used by news-worker, theory-miner, merch audit and others) | Scripted calls: Haiku 5.5 fallback and drafting, Sonnet 5.5 verifier, voice critic, E6 vision, replay labels (Batch API) | Per-caller daily caps in `llm_usage` (P1-09), per-run `MAX_RUN_COST_USD`, Console monthly limit (OA-3) |
| Jev prepaid (`TYPESAFE_API_KEY`) | All routing and typed decisions | Prepaid balance; 402 falls back to Haiku and alerts |
| Codex (ChatGPT plan, local on joey2023) | Build and executor work during the plan; the runtime Codex worker | Plan limits; tiering per root rule j-2 |
| OpenAI API key (exists, used by the worker's optional gpt-4o-mini classifier) | Unchanged; can be retired once Tidewatch runs | n/a |

**Recommendation:** approve D1 as written. Keep Vault Run on OAuth now; P3-09 moves it to the metered key only if the ledger still shows it starving after the cuts.

**Cost estimation method (no invented figures):** cost per call = input tokens times input price plus output tokens times output price, from the model table (Haiku 5.5 $0.10 / $0.50 per million tokens up to 100K-token prompts; Sonnet 5.5 $2 / $10; Opus 5.5 $4 / $20; Jev $0.042 per million input, output free; Batch API half price; cached prompt reads about a tenth). Weekly cost = sum over callers of calls a week times cost per call. *Illustrative estimate, not a measurement:* a Haiku 5.5 fallback call of about 2,000 input and 150 output tokens costs about $0.000275; 300 of them a day is about $0.08 a day. Every call logs its tokens to `llm_usage`, so the weekly scorecard reports actual metered spend per caller from week 2.

### D.3 Balancing Codex (about 2x the budget) against Claude

| Work type | Where | Model and effort |
|---|---|---|
| Non-social build and executor work | local `codex exec` on joey2023, dispatched by the PM into its own worktree | gpt-5.6-sol medium-high; spark low for single-file |
| Security- or brand-critical code (fact-check, push safety, credentials) | local `codex exec` | gpt-5.6-sol xhigh (fact-check, push) or high |
| Large refactors, hard repro (Awin hang, Facebook lazy href) | local `codex exec` | gpt-5.6-sol high |
| Test fixing, debug ladder rung 1 | local `codex exec` | spark low, then sol medium-high |
| Social lane code and copy (`scripts/social/**`, `social/**`) | Claude executor | Sonnet 5.5 high (Swift2 CLAUDE.md forbids Codex here) |
| Prompts, voice rubric, card copy | Claude executor | Sonnet 5.5 |
| Review of every Codex diff | Claude reviewer | Sonnet 5.5 |
| Adversarial second opinion on risky Claude diffs | `codex:rescue --background` | sol high |
| Lookups | Claude scout or repowise | Haiku 5.5 |
| Planning, calibration, go/no-go | PM | Opus 5.5 high |
| Runtime ticket building (Austin, kevin desk, laura walk) | Codex worker scheduled task on joey2023 | sol medium-high, spark by label |
| Runtime classification | Actions `run:` steps | Jev, Haiku 5.5, Sonnet 5.5 |

**Where Codex runs, precisely, and what it costs to set up.** Codex cannot run in the GitHub routines today (`routine-template.yml` is wired to `claude-code-action` with the OAuth token, verified line 250) and there are no self-hosted runners (verified: 0). A self-hosted runner is rejected: the repo is public, so outside pull requests could execute code on the owner's PC. Instead: (1) during the build, the PM session on joey2023 runs `codex exec` locally in separate worktrees (zero setup: Codex CLI 0.154.0 is installed and logged in); (2) at runtime, a Codex worker scheduled task on joey2023 (P1-13, effort L, plus one owner install command) takes `codex:ready` issues and opens PRs that a Claude routine reviews. No OpenAI secret in Actions. Per root rule j-3, workers run scoped tests while iterating and the full suite once at the end, and never dump verbose output back into their own context. Target: about 65 percent of build tokens on Codex.

---

## E. Phases and items

Phases: **P0** this week (stop the bleeding and measure), **P1** week 2 (foundations and re-homing), **P2** weeks 3 to 4 (Tidewatch live), **P3** weeks 5 to 6 (measure, tune, grow). Exit criteria per phase are in `plan-items.json` and repeated in the generated section. 68 items, every one with owner type, model tier, effort, dependencies, lane, files, an acceptance test, token impact, risks and whether it needs a decision or a human action. The full table is generated at the end of this file.

**Lanes** keep up to five executors off each other's files: L-ROUTINES and L-ROUTINES-B (routine workflows and template), L-SOCIAL (Claude only), L-CI, L-COMMUNITY, L-FBEXT, L-MERCH and L-MERCH-FAN, L-NOTIFY, L-WORKER, L-WEB, L-DB (migrations, sequential), L-JEV, L-LLM, L-TIDE, L-TIDE-SPEC, L-TIDE-EVAL, L-FACT, L-THEORY, L-VAULT, L-VOICE, L-MEDIA, L-OBS, L-OPS (owner of `clock-table.json` in P1), L-HOME-CODEX, L-HOME-REDDIT, L-RECALL, L-DASH, L-DOCS, L-OWNER, L-HERMES, L-READONLY. Two items in the same lane never run at the same time.

**Verification and rollback for anything that auto-posts or pushes.** Push: unit tests plus a staging device (P0-11, P2-05), 5-minute kill window on every tier, `PUSH_FREEZE`, `notifications-kill.mjs`. Site: preview deployment check (P2-04), retraction path (P2-07). Social: dry-run against `check-drafts` (P2-06), `SOCIAL_FREEZE`, never run `post-queue.mjs` by hand (guard-denied), retraction (P2-08). Router: per-class config flags flipped by reviewed PRs with 48-hour watches; rollback is the reverse PR or `TIDEWATCH_FREEZE`. The drill (P2-12) must pass before any critical class goes live.

**Shadow-first rollout of the classifier:** P1-06 (classifier writes `shadow=true` decisions only), P1-07 (runs on the clock), P2-01 (calibration after 7 days and 500 decisions), P2-12 (drill), P2-13 (classes go live one by one: noise, duplicate, theory, discussion, merch, normal_news, official_drop, tour, then critical site, critical push, critical social, and personal-life last after the owner merges the rules PR).

**decisions.md entries needed before implementation** (written in P0-14): funding pools; Codex default executor and the home worker; home Reddit reader; Tidewatch data model; widened `OFFICIAL_DOMAINS`; breaking auto-publish; personal-life carve-out and Baby Watch; breaking social cap; Facebook permalinks and cadence; recurring merch spend. **HUMAN-ACTIONS.md entries** (format v2, via the `human-actions` skill, pushed before they are mentioned): OA-2, OA-3, OA-4, OA-5, OA-6, OA-7.

---

## F. Target flow for the dashboard

`plan-items.json` → `flowTarget` replaces the Target view: 56 nodes in 11 lanes (`lanes` array) and 90 edges, in exactly the shape `flow.js` uses (`c`, `r`, `t`, `st`, `n`, `s`, `ids`, `flag`, `chg`, `d`). New rows: Tidewatch (watcher, seen store, Jev classifier, Haiku fallback, action router, decision ledger), Breaking and critical (primary-source poll, fact-check, Sonnet verifier, live gate, retraction, live card and push), Community inputs (GitHub RSS fallback, Facebook export). New nodes elsewhere: recall audit, E3 audit gate, duplicate harvest, theory miner (split out), Codex worker, home Reddit reader, outcomes reader, LLM budget. Existing node ids are kept (note the watcher is `tide` because `watch` is the existing Watchdog id). The v3 placeholder nodes `breaking` and `classify` are replaced by `fast`, `jev`, `factcheck` and `sonnetfc`. `LANES` in `flow.js` must be replaced by the 11-row `lanes` array (the ROWY spacing is computed, so no other layout change is needed).

---

## G. Scorecard and dashboard corrections

The scorecard (metric, today, 2-week, 6-week, writer) is generated at the end of this file. From week 3 the numbers are written every Monday by `scripts/ops/weekly-scorecard.mjs` (P3-04), not by a Claude session; the PM republishes the artifact from that JSON.

**Corrections to apply** (also in `plan-items.json` → `corrections`):

True north goal texts:
1. Goal 1: "0 of 27 within 2 hours" is not on origin/main; current growth-strategy text says 12 of 21 events on site within 48 hours and 1 of 21 on social within hours (verified line 42). Add: worker real gaps 4.5 to 10 hours; push already fires for confirmed items.
2. Goal 2: "12 of 27" becomes "12 of 21"; "6 of 113 failures" UNVERIFIED.
3. Goal 3: status part; crawl on since Sep 22 (verified `COMMUNITY_CRAWL_ENABLED=true`, set 2026-09-22), RSS-only, 429-throttled, 0 theories in the last 3 miner runs.
4. Goal 4: status part; a seed media gate exists; the live feed does hold imageless items; the gaps are elsewhere.
5. Goal 5: #5479 is merged in Swift2; #5484 is an open draft (verified); the poster is stuck on one item.
6. Goal 7: the Facebook link opens a search; Reddit cards have no title, age or score; no cards since Oct 12.
7. Goal 8: measure through the home reader on the public comments page (RSS has no scores, verified `reddit-rss.mjs:14`).
8. Goal 9: Facebook group replies via the owner's activity log.
9. Goal 10: fan-made discovery runs dry on schedule (verified); 0 new items since Aug 30; Awin PRs are timestamp churn.
10. Goal 11: matcher workflow stubbed (verified), writer missing, Awin index never persists, 0 joined, no Amazon tag, 0 wrapped.

Diagnosis findings: replace "theory engine switched off"; Awin was not fixed Oct 6 (0 of 20 since Oct 10); add the regex miss and the true cause of answerer failures; rewrite the media half of "gates that rot"; poster finding (one Instagram item, X 403 unverified, 161 PRs); #5479 merged here; add thin cards, push gaps and the six-week merch drought.

Dashboard: flags on `crawl`, `matcher`, `merch`, `sgate`, `outcomes`; descriptions on `gate`, `merchdetect`, `approve`, `news`; the Overview readme's `social-tree-approve.yml` mention is correct (the workflow exists, verified; Fable's addendum was wrong); roadmap items 4, 5, 7 and 8 superseded; Decisions tab replaced by D1 to D9.

---

## H. Owner decisions and owner actions

### Decisions (answer in chat; recommended answers given)

| Id | Question | Recommendation | Why |
|---|---|---|---|
| D1 | How are model costs funded? | Four pools: OAuth for agentic routines; the existing metered API key for capped scripted Haiku/Sonnet 5.5 calls plus a Console monthly limit; prepaid Jev for routing; Codex on joey2023 for building. | Routing and one-shot drafting inside agent routines eat the weekly limit; the same work as direct Haiku 5.5 calls costs cents a day. |
| D2 | Codex as default builder for non-social code, with a Codex worker on joey2023 replacing Austin? | Yes, and amend root rule j for Swift2 (Codex default regardless of the lim threshold; Claude reviews every Codex PR; social stays Claude-only). | 2x Codex budget; Actions cannot run Codex; a self-hosted runner on a public repo is unsafe. |
| D3 | How do we read Reddit? | Home Reddit reader on joey2023: headless browser, anonymous, read-only, slow; GitHub RSS scan as automatic fallback. No relay, no tailnet, no key. | Most GitHub runs hit 429 and RSS has no scores; this fixes both with no new Actions secrets and no Hermes work. |
| D4 | May confirmed critical work news auto-publish to site, push and social? | Yes, after code fact-check and a Sonnet 5.5 verifier agree; governor unchanged; kill window and freezes; staged go-live after a drill. | Only way to hit 60 minutes without you on the path. |
| D5 | Personal-life news on the site, and a Baby Watch notification? | Yes, confirmed-only: extend guardrail 4's carve-out to the live feed and push under the strict code bar plus a 10-minute re-check; opt-in "Baby Watch: official announcements only" fires only on a confirmed pregnancy or birth announcement; no rumor, countdown or clue content; theory ban stays. | Matches your decision and keeps "speculation is never covered". |
| D6 | Social rules for breaking news? | Breaking campaign type: up to 2 extra posts per platform per day, one Sonnet 5.5 draft, tree-auto stamp, immediate dispatch; IG and X still paired. | Today's caps make a 60-minute social SLA impossible. |
| D7 | Facebook export changes? | Record approval to store post permalinks and read your activity log (no names or quotes); daily for the top 3 groups, weekly for the rest. | Weekly exports arrive after the conversation is over; this is the smallest risk increase. |
| D8 | Recurring merch spend? | Scheduled E6 twice a week, $3 per run cap, 5 paid searches; weekly fan-made auto-curation; no typed confirmation on schedule. | Nothing has matched since Aug 31 because every step needs a manual trigger. |
| D9 | Merge #5484? | Yes, once a Hermes session confirms both loops are live. | About 1,950 SET a week leave the Swift2 pool. |

### Owner actions (exact steps)

**OA-1. Decide D1 to D9 (10 to 15 minutes).** The PM session asks in chat. Skipped items take the safe default (no auto push, no personal-life auto-publish) and nothing else waits.

**OA-2. Jev key into Swift2 (5 minutes).** Open a Claude Code session in **Projects\Hermes** (only Hermes sessions may reach the garage) and paste:
> Copy the Jev key into the Swift2 repo as a GitHub Actions secret named TYPESAFE_API_KEY without the value ever being printed or read into your context: pipe the key file from the host that holds it straight into `gh secret set TYPESAFE_API_KEY --repo JW-Incorporated/swift2`. Then tell me the prepaid credit balance if the TypeSafe console shows it. If your guard blocks setting a secret, give me the exact one-line command to run myself in a terminal, with no key value in it.

(Agent guards deny secret writes by design, so expect the last sentence to apply; running that one line yourself is the intended path.)

Check: `gh secret list --repo JW-Incorporated/swift2` shows `TYPESAFE_API_KEY`.

**OA-3. Spend limit (5 minutes).** console.anthropic.com, the organization that owns the Swift2 Actions `ANTHROPIC_API_KEY`: Settings, Limits, set a monthly limit and an alert at 50 percent; tell the PM the number.

**OA-4. Hermes loops and #5484 (5 minutes).** Open a session in **Projects\Hermes** and paste:
> Confirm whether the Hermes Tree and Hermes Marjorie daily loops ran successfully in the last 3 days and what model or token pool they use. If both are live, tell me so I can approve merging JW-Incorporated/swift2 PR #5484.

Tell the Swift2 PM the answer.

**OA-5. Home machine setup (15 minutes, when the PM says the installers are merged).** Open a session in **Projects\swift2** and paste:
> Run the installers for the Long Live Reddit Reader and the Long Live Codex Worker scheduled tasks from scripts/home, check the local env file they need using `node .claude/bin/env-sync.mjs list swift2` (names only), and tell me exactly which key names are missing.

If a Supabase key is missing: Supabase dashboard, Project Settings, API, copy the service_role key into the file the PM names (never into chat). Then in Chrome's dedicated Long Live profile open `chrome://extensions` and click Reload on "Long Live FB export".

**OA-6. Affiliate accounts (whenever ready, blocks nothing).** Awin (ui.awin.com): note the Publisher ID; join agolde.com, alamourthelabel.com, clubllondon.us, jenniferbehr.com, meshki.us, patmcgrath.com, popflexactive.com, unique-vintage.com and Etsy (6220). Amazon (affiliate-program.amazon.com): note the Store ID (ends in -20) and approval status. Paste both public IDs in the Swift2 PM chat; the PM sets `NEXT_PUBLIC_AWIN_ID` and `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` in Vercel and redeploys.

**OA-7. Merge the founder-owned rules PR (5 minutes).** PR labeled `founder-decision`, "Tidewatch rulings: breaking news and confirmed personal-life news". Read the TL;DR and merge, or say "approved" in chat.

**OA-8. Optional taste inputs (10 minutes a week).** Star-react favorites in the weekly voice sample; optionally rate 20 hard replay cases once.

---

## I. Risks, what not to do, open questions

**Top risks**
- A false critical push is the fastest way to lose trust: mitigated by the code bar, the Sonnet verifier, the 5-minute kill window, `PUSH_FREEZE`, the drill and the staged go-live; personal-life last.
- The home machine becomes infrastructure: reboots, Windows updates and residential IP blocks. Mitigations: tasks restart on boot, heartbeats, the GitHub RSS fallback, and nothing user-facing depends on joey2023 except card richness and outcomes.
- Jev is new (signups paused since Sep 22 per third-party sources; prepaid). Mitigation: Haiku-only fallback path is always wired and tested.
- Haiku 5.5 migration may change tool and thinking parameters (the API guide warns Haiku 4.5 code can break): covered by tests in P0-12 and structured outputs.
- `clock-table.json` and migrations are shared files: one item per wave edits them.
- #5484 collisions: routine edits touch only routines #5484 keeps until it merges.
- Disk: worktrees cost 1 to 2 GB each; remove after merge (C: hit 100 percent on Oct 6).

**What not to do**
- No Reddit API key, ever; no automated Reddit or Facebook posting, voting, commenting or DMs; no Facebook crawler (the export stays owner-run on his own login); the home Reddit reader never logs in.
- No breaking exemption from the notification governor or the privacy redlines; no rumor, countdown or clue framing for personal life; no private-life theories.
- No Codex on `scripts/social/**` or `social/**`; never Codex and Claude on one working tree; never run `post-queue.mjs` or `delete-media.mjs` by hand; never write an `approval` key into a queue file; never `gh pr merge` a social-draft PR.
- No self-hosted runner on this public repo.
- No splitting Vault Run into parallel jobs (the generated-file conflict): sequential jobs on one branch only.
- No relaxing thresholds in `substance.test.ts` or `feed-tiers.test.ts` to get green.
- Do not trust any green `merch-matcher-authoring` run before P1-19; do not trust 30-day reliability numbers for feeders patched since.

**Open questions only the owner can answer (kept to three)**
1. Is the name "Baby Watch" acceptable given guardrail 4's "no countdown or tracker treatment" for personal life, if the notification only ever fires on a confirmed announcement? (Part of D5.)
2. Is joey2023 allowed to run a headless browser and the Codex worker around the clock (power settings, sleep disabled, auto-update restart windows)?
3. What monthly ceiling do you want on the metered API key (OA-3)?

---

## J. How the PM session should run this

1. **Start:** read Swift2 `CLAUDE.md` and `docs/cto-role.md`, this plan and `plan-items.json`. `git -C <repo> fetch` and work from `origin/main` (local main is 10 days stale). Create `docs/projects/tidewatch/` (README, this plan, tracker) on a branch in a worktree under `%LOCALAPPDATA%\longlive-wt` (never inside Projects).
2. **Day 1, in parallel:** ask the owner D1 to D9 and send OA-2, OA-3, OA-4 with their prompts (write the HUMAN-ACTIONS.md entries first, via the `human-actions` skill, and push them). Dispatch wave 1 (five lanes): P0-01 (Codex), P0-03 (Claude), P0-09 (Codex), P0-11 (Codex), P0-17 (Claude).
3. **Days 2 to 5:** wave 2 as lanes free up: P0-02, P0-04 then P0-05, P0-06, P0-07, P0-08, P0-10, P0-12, P0-14. Never more than five executors at once.
4. **Week 2:** P1 in dependency order. Critical path: P0-15 (key) → P1-01 → P1-02 → P1-05 → P1-06 → P1-07 (shadow starts; the 7-day clock for P2-01 begins). In parallel lanes: P1-09 → P1-10 → P1-17; P1-11, P1-12; P1-13; P1-14 → P1-15 → P1-21; P1-16; P1-18; P1-19; P1-20; P1-22; P1-23; P1-24; P1-03 → P1-04.
5. **Weeks 3 to 4:** P2-02 and P2-03 first, then P2-04 to P2-11, then the drill P2-12, then P2-13 flips one class per 48 hours.
6. **Weeks 5 to 6:** P3 items as data allows; P3-09 last.

**Per-item loop:** write a short spec into the item's issue (what, acceptance, files) → dispatch: Codex items via `codex exec -m <tier> --effort <level>` in a fresh worktree (background, poll about every 15 minutes, root rule j); Claude items via the `executor` agent in its own worktree; the brief always pastes Swift2's guards (no social work to Codex, no `git restore`, no `--no-verify`, worktrees outside Projects, run `npm run lint` and typecheck, scoped tests then the full suite once) → `reviewer` (Claude) on every Codex diff before the PR opens; `codex:rescue --background` as a second opinion for P0-11, P2-03, P2-04, P2-06 → open the PR with a TL;DR → merge if green, else arm auto-merge, and exit (never babysit). Maximum two review rounds; a third means `DEBUG.md` and the debug ladder (Codex rung 1, fresh Claude, then `architect`, logged in STATE.md).

**Verification rule:** an item is done only when its acceptance command passed (agent success is a claim), UI items are checked in a browser on mobile and desktop, and MAP.md is updated when files move.

**Tracker:** after each merge, set the item's status (todo, doing, review, done, blocked), date and PR number in the dashboard's Tracking tab and in `docs/projects/tidewatch/tracker.md`; checkpoint STATE.md at about half context and hand off to a fresh session rather than compacting.

**Escalate to the owner only for:** a guard denial, anything on the irreversible list (secrets, money, deleting data), a class going live that the decisions did not cover, or a drill failure on critical or personal-life news. Everything reversible the PM decides and states in one line.

---

## K. What was verified in this planning pass (read-only, against origin/main dc091aecf)

Verified directly: `session-outcome.mjs` limit regex misses the new wording; routine-template guard only checks the OAuth secret and auth is the OAuth token; `max_budget_usd` is passed only when above 0; `ci.yml` paths-filter has no predicate-quantifier; `draft-happy-path.test.ts` reads live `social/posted` and pins `speaknow-inglewood-2023-2`; the 10-11 pair is still in `social/queue/` on main; 161 open state PRs; #5479 merged Oct 10 in Swift2; #5484 open draft; poster caps 1 per run and 1 per platform per day; clock-table rows (marjorie-ops 55, awin 360, no news-worker row); news-worker cron `10 1,5,9,13,17,21`; emit happens after insert regardless of the quality hold; T1-only 5-minute delay and the tier table; `OFFICIAL_DOMAINS` is only `taylorswift.com`; Awin sync timeout 45 and cache save without `if: always()`; fan-made `${DRY_RUN:-true}`; matcher stubs at lines 86 and 89; Reddit RSS has no score or comment count; `engagement_lead_dedupe_idx`, `news_raw_item` unique (source_id, external_id), `news_story` with importance and verification status, `events.dedupe_key` unique; awareness answerer input is title-level only; guardrail 4's confirmed-only carve-out is social-only and forbids countdown framing; IG+X pairing ruling at decisions.md:8458; `social-tree-approve.yml` exists; brand account u/NegativeRest9507; growth strategy 12 of 21 and 1 of 21; secret names (no `TYPESAFE_API_KEY`; `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ETSY_API_KEY`, Awin secrets exist); variables (`COMMUNITY_CRAWL_ENABLED=true` since Sep 22, `SOCIAL_FREEZE=false`); no self-hosted runners; joey2023 is this machine with Codex CLI 0.154.0; the worker already has an ingest, cluster, classify, verify, extract pipeline with an optional gpt-4o-mini classifier.

Still UNVERIFIED (taken from research files): the Awin hang mechanism (code-reading hypothesis); whether real Facebook exports contain permalinks and how often; whether the X 403 ever happened (P0-06); actual per-routine turns (P0-07); which pool Hermes agents use; whether the home clock fires reliably (P0-07); whether X post deletion is available on our tier; whether Taylor's Instagram is readable through Graph API business discovery; real E6 cost per run; anything in the live database (row counts, enabled news sources).

---

# Generated tables (from plan-items.json)

## Phases and exit criteria

| Phase | Name | Goal | Exit criteria |
|---|---|---|---|
| P0 | Stop the bleeding and measure | No more lost runs to the weekly limit, no CI storm, poster green, Awin sync finishes, push path safe, owner decisions recorded, baseline numbers captured. | Routines skip cleanly while the limit is hit and a single named alert exists; open social-poster state PRs <= 1; social-poster last 5 runs green; merch-awin-sync completes and saves its cache; held current_item rows emit no events; turn ledger JSON exists for the past 7 days; decisions D1 to D9 recorded in docs/decisions.md; TYPESAFE_API_KEY exists as an Actions secret. |
| P1 | Foundations and re-homing | Jev client, seen store, Tidewatch collector and shadow classifier running; Claude burn moved off routing and single-shot drafting; Reddit read from home; Facebook permalinks; Vault Run split; merch matcher real; theories flowing. | Tidewatch shadow has logged >= 7 days and >= 500 decisions; estimated weekly OAuth turns down >= 50 percent vs baseline in the turn ledger; >= 90 percent of new Reddit cards carry title, age and engagement; >= 80 percent of new Facebook leads carry a post permalink; E6 merged >= 3 matched products in one week; theory miner finds > 0 theories on >= 5 of 7 days. |
| P2 | Tidewatch live | Every class routes automatically; critical news reaches site, push and social within 60 minutes after code fact-check; a retraction path exists; duplicates feed the theory database; merch branches wired. | Breaking drill: 5 historical critical events replayed reach site in <= 45 min (dry run) with 0 false positives on 200 replayed non-critical items; all non-critical classes live; critical site and push live; personal-life live only after the owner signs the ruling; retraction drill passes. |
| P3 | Measure, tune and grow | Outcomes for goals 8 and 9 measured; recall measured; voice scored; caps raised where quality holds; weekly scorecard automatic. | Scorecard JSON written weekly by code for all 11 goals; outcome rows exist for >= 90 percent of posted comments; recall audit runs weekly; Jev vs Haiku drift monitor live. |

## Work items


### P0: Stop the bleeding and measure

#### P0-01. Weekly-limit detection, one named alert and automatic pause
- **What:** Teach failureHint the new 'You've hit your weekly limit - resets <time>' wording; Decide-outcome exits 0 with a ::warning:: on a limit hit (stops bot-failure-triage noise); open or update ONE issue labeled claude-weekly-limit with the reset time; Guard step skips any routine whose new input priority is not 'content' while an open claude-weekly-limit issue's reset time is in the future; vars.ROUTINES_PAUSED == 'true' skips everything. Content routines (vault-run, tree-event-draft) pass priority: content. No PAT needed: GITHUB_TOKEN can read and write issues.
- **Goals:** 1, 2, 3, 4, 6 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-ROUTINES · **Depends on:** none
- **Files:** `scripts/routines/session-outcome.mjs`, `scripts/routines/session-outcome.test.mjs`, `scripts/routines/limit-gate.mjs (new)`, `.github/workflows/routine-template.yml`, `.github/workflows/routine-vault-run.yml`, `.github/workflows/routine-tree-event-draft.yml`
- **Acceptance:** npx vitest run scripts/routines passes, including a fixture with the exact Oct 14 log text; gh workflow run routine-kevin-radar.yml while a test claude-weekly-limit issue with a future reset exists concludes success with 'skipped: weekly limit until <time>' in the log; after the issue's reset time it runs normally.
- **Token impact:** Stops partial runs that burn turns into a known wall; protects Vault Run's share of the pool. · **Risks:** A wrong reset parse could pause routines too long; the issue carries the reset time and ROUTINES_PAUSED can be cleared by the owner.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-01) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-02. Emergency model and cadence cuts plus all P0 clock-table edits
- **What:** Reversible routine edits on routines that #5484 keeps: marjorie-ops every 3 h (clock minGap 175) and max_turns 40; marjorie-status-reply and marjorie-ask-response to claude-sonnet-5-5; nils-walk and paul-blart to claude-sonnet-5-5; austin-build to claude-opus-5-5 on Mon/Wed/Fri; marjorie-weekly-review to claude-opus-5-5; vault-run to claude-opus-5-5; kevin-radar to claude-haiku-5-5. Routines #5484 deletes (marjorie-brief, -chat, -triage, tree-chat, tree-ask-response, tree-daily-draft) get claude-sonnet-5-5 only if #5484 is not merged within 48 h. Clock table: news-worker.yml row minGap 55; remove the merch-awin-sync 360 row (daily cron is enough).
- **Goals:** 1, 2, 3, 4, 6 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-ROUTINES · **Depends on:** P0-01
- **Files:** `.github/workflows/routine-marjorie-ops.yml`, `.github/workflows/routine-marjorie-status-reply.yml`, `.github/workflows/routine-marjorie-ask-response.yml`, `.github/workflows/routine-nils-walk.yml`, `.github/workflows/routine-paul-blart.yml`, `.github/workflows/routine-austin-build.yml`, `.github/workflows/routine-marjorie-weekly-review.yml`, `.github/workflows/routine-vault-run.yml`, `.github/workflows/routine-kevin-radar.yml`, `scripts/ops/clock-table.json`
- **Acceptance:** npm run check:routines and npm run check:workflow-deps pass; git grep shows no claude-opus-5 or claude-opus-4-8 in status/ask/nils/paul routines; next 48 h of gh run list shows marjorie-ops <= 9 runs/day and news-worker >= 16 runs/day.
- **Token impact:** Largest immediate cut: est. 2,500 to 3,000 SET/wk. · **Risks:** Sonnet answers on ask-response may be weaker; reversible by one PR. Haiku 5.5 in claude-code-action must accept the model id (check first run).
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-02) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-03. Make draft-happy-path.test.ts hermetic and fix the CI paths filter
- **What:** The W10 test hardcodes photo speaknow-inglewood-2023-2 and reads the live social/posted ledger, so every state PR that records that photo fails lesson L001. Pass a fixture posted dir (tests already accept extraPosted) or pick the photo dynamically. In ci.yml add predicate-quantifier: 'every' to dorny/paths-filter so social-only PRs run build-content, not build-full.
- **Goals:** 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-SOCIAL · **Depends on:** none
- **Files:** `scripts/social/draft-happy-path.test.ts`, `.github/workflows/ci.yml`
- **Acceptance:** npx vitest run scripts/social/draft-happy-path.test.ts passes with a synthetic posted file containing speaknow-inglewood-2023-2; on a social-only test PR the changes job logs non_content=false and build-content runs; main stays green.
- **Token impact:** Removes ~79% of CI failures and the watchdog noise they create. · **Risks:** Fixing only the filter hides the test bug; do both in one PR.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-03) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-04. Unstick the 10-11 Instagram/X pair, reconcile the ledger, close the stale state PRs
- **What:** Read the newest social-poster/state PR to learn what actually posted (postedAt, post ids) for the 2026-10-11 speaknow-million-week pair; land ONE PR that moves the unposted halves from social/queue/ to social/failed/ with failureReason and records any real posts in social/posted/; then close the 161 open social-poster/state-* PRs with a one-line comment (branches kept). Never write an approval key; never run post-queue.mjs.
- **Goals:** 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-SOCIAL · **Depends on:** P0-03
- **Files:** `social/queue/2026-10-11-speaknow-million-week-ig.json`, `social/queue/2026-10-11-speaknow-million-week-x.json`, `social/failed/`, `social/posted/`
- **Acceptance:** gh pr list --state open --search 'head:social-poster/state' returns 0 or 1; the next 3 social-poster runs conclude success.
- **Token impact:** None directly; ends a 30-minute failure loop. · **Risks:** Mis-recording a post that did go out could cause a duplicate later; verify on the live account before landing.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-04) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-05. One rolling state PR and failure metadata for the poster
- **What:** Make the poster's fold-back use a fixed branch (social-poster/state) so peter-evans/create-pull-request updates one PR in place instead of opening a new one every 30 minutes; failed items gain failedAt, attempts and lastError.
- **Goals:** 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-SOCIAL · **Depends on:** P0-04
- **Files:** `.github/workflows/social-poster.yml`, `scripts/social/lib/queue.mjs (state writer only)`, `social/README.md`
- **Acceptance:** After two consecutive poster runs that change state, exactly one open state PR exists; npm run validate:social passes.
- **Token impact:** None; reduces CI load. · **Risks:** Must not change posting behavior; diff touches only the fold-back step.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-05) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-06. Verify the X 403 claim (read-only)
- **What:** Researcher reads social-poster logs from Oct 9 to Oct 13 for the X half of the 10-11 pair and the earlier failed pairs, reports whether an X 403 ever occurred and its endpoint and message. No API calls.
- **Goals:** 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 (researcher agent, read-only) · **Effort:** S · **Lane:** L-READONLY · **Depends on:** none
- **Files:** none (no repo change)
- **Acceptance:** A short finding in STATE.md and the dashboard: 'X 403 confirmed in run <id>' with cause, or 'no X 403 found in N runs'.
- **Token impact:** Small. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-06) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-07. Measurement baseline: turn ledger, metered usage, clock fire rate
- **What:** scripts/routines/turn-ledger.mjs downloads the last 7 days of routine-usage.json artifacts and writes docs/ops/dashboard/budget.json (routine, runs, turns, model, limitFails); scripts/ops/clock-fire-rate.mjs measures real dispatch cadence of bot-chat-poll and each clock row over 48 h; weekly workflow ops-ledger.yml runs both and opens an automerge docs PR.
- **Goals:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** M · **Lane:** L-OBS · **Depends on:** none
- **Files:** `scripts/routines/turn-ledger.mjs (new)`, `scripts/ops/clock-fire-rate.mjs (new)`, `.github/workflows/ops-ledger.yml (new)`, `docs/ops/dashboard/budget.json (new)`, `.github/automerge-allowlist (docs/ops/dashboard/**)`
- **Acceptance:** node scripts/routines/turn-ledger.mjs --days 7 --dry-run prints one row per routine with turns; node scripts/ops/clock-fire-rate.mjs --hours 48 prints expected vs actual fires per row.
- **Token impact:** Replaces estimates with measured turns; zero LLM. · **Risks:** Artifacts expire at 90 days; fine for weekly use.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-07) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-08. Interim Facebook card link and mailer parity
- **What:** Until permalinks exist (P1-16), make facebookFallbackLine link to the group plus a group-scoped search on the first distinctive words of the excerpt (lands near the post instead of a site-wide search); give the Community Tasks mailer path (reply-opportunity.mjs, mailer.mjs) the same fallback. Tests for both renderers.
- **Goals:** 7 · **Owner:** codex · **Model/tier:** gpt-5.3-codex-spark low · **Effort:** S · **Lane:** L-COMMUNITY · **Depends on:** none
- **Files:** `scripts/community/awareness-fb-link.mjs`, `scripts/community/reply-opportunity.mjs`, `scripts/community/mailer.mjs`, `scripts/community/*.test.mjs`
- **Acceptance:** npx vitest run scripts/community passes; a fixture lead with url null renders a https://www.facebook.com/groups/<gid>/search/?q=... link in both renderers.
- **Token impact:** None. · **Risks:** Group search still needs a scroll; true fix is P1-16.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-08) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-09. Repair merch-awin-sync (hang, lost cache, churn PRs)
- **What:** Wrap the products_fts rebuild in one transaction (or INSERT ... SELECT); write awin-feed-cache.json after every feed and save the cache with if: always(); lower RUN_BUDGET_MS so the job exits before the 45-minute timeout; refresh feeds only for joined advertisers (log 'no joined advertisers, skipping feeds' when 0); keep the previous generatedAt when the advertiser list is unchanged so no PR opens; move the advertiser-map PR step after the feeds step. Same for merch-revenue.yml generatedAt churn.
- **Goals:** 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** M · **Lane:** L-MERCH · **Depends on:** none
- **Files:** `scripts/merch-engine/sync-awin-feeds.mjs`, `scripts/merch-engine/sync-awin-programmes.mjs`, `scripts/merch-engine/merch-revenue*.mjs`, `.github/workflows/merch-awin-sync.yml`, `.github/workflows/merch-revenue.yml`
- **Acceptance:** gh workflow run merch-awin-sync.yml completes in < 30 min; gh cache list shows a merch-awin-sync-* entry; a second run with no changes opens no PR; unit test proves partial progress persists after a simulated kill.
- **Token impact:** None (zero LLM). · **Risks:** R5 etiquette (5 requests per minute, no concurrency per advertiser) must stay.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-09) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-10. Fan-made discovery: scheduled runs actually file candidates
- **What:** merch-fanmade.yml defaults to dry-run on schedule (${DRY_RUN:-true} with empty inputs). Make schedule runs live; log per-filter rejection counts so an empty candidate list is explainable (ETSY_API_KEY exists as a secret).
- **Goals:** 10 · **Owner:** codex · **Model/tier:** gpt-5.3-codex-spark low · **Effort:** S · **Lane:** L-MERCH-FAN · **Depends on:** none
- **Files:** `.github/workflows/merch-fanmade.yml`, `scripts/merch-engine/fanmade-discovery.mjs`
- **Acceptance:** Next scheduled run logs dryRun false and either files >= 1 candidate issue or prints counts per filter.
- **Token impact:** None. · **Risks:** Issue spam: keep the existing dedupe label.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-10) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-11. Push safety before any automatic push
- **What:** In write-knowledge.ts emit the notification event only when the row is servable (quality.ok and redline_ok true); apply a 5-minute kill window (available_at) to every tier, not only T1; add a PUSH_FREEZE switch (ops switch row read by notification-router, settable on by agents via set-switch.mjs FREEZE_ON_ONLY); extend notifications-kill script to all tiers.
- **Goals:** 1 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** M · **Lane:** L-NOTIFY · **Depends on:** none
- **Files:** `apps/worker/src/extract/write-knowledge.ts`, `packages/core/src/notification-events.ts`, `packages/core/src/notification-router.ts`, `scripts/notifications-kill.mjs`, `scripts/ops/set-switch.mjs`, `supabase/migrations/<ts>_ops_switch.sql (new)`
- **Acceptance:** Unit tests: a held row inserts no events row; a T2 event has available_at = now + 5 min; with PUSH_FREEZE on, the router sends nothing; npm run typecheck --workspace=@swift2/web passes.
- **Token impact:** None. · **Risks:** Touches the push path; Claude review plus codex:rescue second opinion.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-11) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-12. Worker Haiku 4.5 to Haiku 5.5
- **What:** Switch extract, theory and dedupe Haiku clients from claude-haiku-4-5 to claude-haiku-5-5 (about 10x cheaper per token); re-check tool_choice and thinking parameters against the migration guide; keep per-cluster caps.
- **Goals:** 1, 2, 3 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** S · **Lane:** L-WORKER · **Depends on:** none
- **Files:** `apps/worker/src/extract/haiku-client.ts`, `apps/worker/src/extract/theory-haiku-client.ts`, `apps/worker/src/extract/dedupe-gate.ts`
- **Acceptance:** npm test --workspace @swift2/worker passes; one manual news-worker dispatch extracts >= 1 cluster with model claude-haiku-5-5 in the log.
- **Token impact:** ~90% cut in worker metered spend per call. · **Risks:** Output-shape drift; the existing extract tests and a 20-item spot diff guard it.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p0-12) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-13. Owner decision session (D1 to D9)
- **What:** PM presents D1 to D9 in chat with the recommended answers; the owner answers in one sitting. Answers are written back to the tracker and to decisions.md by P0-14.
- **Goals:** 1, 3, 5, 7, 8, 9, 10, 11 · **Owner:** OWNER DECISION · **Model/tier:** n/a · **Effort:** S · **Lane:** L-OWNER · **Depends on:** none
- **Files:** none (no repo change)
- **Acceptance:** Each of D1 to D9 has an answer recorded in the tracker.
- **Token impact:** None. · **Risks:** Unanswered items default to the safest option (no auto push, no personal-life auto-publish) without blocking other work.
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** n/a

#### P0-14. Record decisions and draft the ruling PRs
- **What:** docs/decisions.md entries for D1 to D9 (funding pools, Codex default executor, Reddit home reader, breaking auto-publish, personal-life carve-out and Baby Watch, breaking social cap, Facebook permalinks and cadence, merch spend, #5484). Draft founder-owned edits as a separate PR for the owner to merge: docs/social/guardrails.md row 4 site extension and breaking fast path, NOTIFICATIONS_SPEC.md (baby_watch, all-tier delay, PUSH_FREEZE, Vercel cron + Expo reality), docs/projects/tidewatch/README.md. Propose the Projects-root CLAUDE.md rule j amendment text for the owner.
- **Goals:** 1, 5, 7, 10, 11 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 high · **Effort:** S · **Lane:** L-DOCS · **Depends on:** P0-13
- **Files:** `docs/decisions.md`, `docs/social/guardrails.md (owner-merged PR)`, `NOTIFICATIONS_SPEC.md`, `docs/projects/tidewatch/README.md (new)`, `MAP.md`
- **Acceptance:** PR merged with nine dated entries; guardrails PR open with label founder-decision and a one-paragraph TL;DR.
- **Token impact:** Small. · **Risks:** guardrails.md is founder-owned and never auto-merged; the PR waits for the owner.
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** own branch (feature/tidewatch-p0-14) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P0-15. Jev key into a GitHub Actions secret
- **What:** The owner (or a Hermes session) pipes the Jev key from the Hermes host into gh secret set TYPESAFE_API_KEY on JW-Incorporated/swift2 so the value never enters a model context; also confirms the prepaid credit balance.
- **Goals:** 1, 2, 3, 7, 10 · **Owner:** OWNER ACTION · **Model/tier:** n/a · **Effort:** S · **Lane:** L-OWNER · **Depends on:** none
- **Files:** none (no repo change)
- **Acceptance:** gh secret list in Swift2 shows TYPESAFE_API_KEY.
- **Token impact:** Enables all Jev savings. · **Risks:** HTTP 402 when credits run out: the client falls back to Haiku 5.5 and opens an alert.
- **Needs decision entry:** no · **Needs human action:** yes · **Branch/PR:** n/a

#### P0-16. Hermes session: confirm Tree and Marjorie loops, decide #5484 go-live
- **What:** In a Hermes session: confirm Hermes Tree drafts and stamps daily and Hermes Marjorie runs; report which model pool Hermes agents spend; if live, merge #5484 (rebased) so six Swift2 routines retire.
- **Goals:** 5 · **Owner:** hermes-session · **Model/tier:** per Hermes kit · **Effort:** S · **Lane:** L-HERMES · **Depends on:** none
- **Files:** none (no repo change)
- **Acceptance:** #5484 merged, or a dated reason it waits recorded in the tracker.
- **Token impact:** ~1,950 SET/wk leaves the Swift2 OAuth pool when merged. · **Risks:** If Hermes loops are not live, social output stays at zero; keep the Swift2 routines until they are.
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** n/a

#### P0-17. Dashboard corrections and the Plan and Tracking tabs
- **What:** Apply the corrections list (goals 1 to 11 'now' texts, findings, Flow flags) to plan-data.mjs and flow.js; add the Target flow from this plan; add the Plan tab (phases, items, taxonomy, decisions, owner actions) and the Tracking tab (status per item: todo, doing, review, done, blocked, with date and PR) backed by the artifact's data store so the PM can update rows without republishing.
- **Goals:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-DASH · **Depends on:** none
- **Files:** `C:/Users/Fourtys/Documents/Claude/plan-inputs/plan-data.mjs`, `C:/Users/Fourtys/Documents/Claude/plan-inputs/flow.js`, `C:/Users/Fourtys/Documents/Claude/plan-inputs/dash.src.html`, `C:/Users/Fourtys/Documents/Claude/plan-inputs/build.mjs`
- **Acceptance:** node build.mjs prints 'syntax ok'; the republished artifact shows Plan and Tracking tabs and the Target flow with the Tidewatch row; corrected texts visible.
- **Token impact:** Small. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** artifact source in plan-inputs, not the repo

#### P0-18. Anthropic Console monthly spend cap for the metered key
- **What:** The owner sets a monthly spend limit and an alert on the Anthropic API organization that owns the ANTHROPIC_API_KEY used by Actions, so metered Haiku/Sonnet calls can never surprise him.
- **Goals:** 1, 2, 3, 6, 7 · **Owner:** OWNER ACTION · **Model/tier:** n/a · **Effort:** S · **Lane:** L-OWNER · **Depends on:** P0-13
- **Files:** none (no repo change)
- **Acceptance:** Owner confirms in chat that a limit and an alert are set.
- **Token impact:** Caps metered spend. · **Risks:** Too low a cap silently stops classification; code falls back to Jev-only plus code rules and alerts.
- **Needs decision entry:** no · **Needs human action:** yes · **Branch/PR:** n/a


### P1: Foundations and re-homing

#### P1-01. Jev client library
- **What:** Raw fetch client (no SDK dependency, same approach as Hermes jevclient): POST https://api.typesafe.ai/v1/systemone, Bearer TYPESAFE_API_KEY, model pinned jev-1.13.0, 4 s timeout, one retry on 429/529, 402 raises JevCreditsExhausted; helpers for Choice, Score and Noul; many questions per call; untrusted-text wrapping (delimiters, length cap, URL and markdown stripping); per-call option-order randomization with mapping back; usage logged to llm_usage (caller, model, input tokens, estimated cost). Recorded-fixture tests, no live key in CI.
- **Goals:** 1, 2, 3, 7, 10 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** M · **Lane:** L-JEV · **Depends on:** P0-15
- **Files:** `packages/shared/src/jev/client.ts (new)`, `packages/shared/src/jev/questions.ts (new)`, `packages/shared/src/jev/client.test.ts (new)`, `scripts/lib/jev.mjs (thin wrapper, new)`, `supabase/migrations/<ts>_llm_usage.sql (new)`
- **Acceptance:** vitest for the jev package passes (fixtures for choice, score, noul, 402, 429, timeout); node scripts/lib/jev.mjs --selftest makes one live 3-question call in a dispatch-only workflow and prints answers and usage.
- **Token impact:** Enables routing at ~$0.00005 per call. · **Risks:** Key leakage: never log headers; tests assert the key is absent from logs.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-01) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-02. Seen store, decision ledger and story timeline tables
- **What:** Migration for watch_item (item_key unique, source, source_ref, url_norm_hash, title_simhash, story_id, first_seen_at, last_seen_at, seen_count, excerpt <= 2k for non-Facebook only, status), watch_decision (class, confidence, decider, model_id, answers jsonb, action, action_ref, shadow, decided_at), watch_cursor (source, cursor), story_timeline (story_id, first_public_at, detected_at, classified_at, verified_at, on_site_at, social_at, push_at). RLS: service role only. Retention job.
- **Goals:** 1, 2, 3 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-DB · **Depends on:** P0-14
- **Files:** `supabase/migrations/<ts>_tidewatch.sql (new)`, `packages/shared/src/tidewatch/types.ts (new)`, `scripts/tidewatch/retention.mjs (new)`
- **Acceptance:** npm run db:migrate on a local Supabase applies cleanly; a unit test inserts a duplicate item_key and gets a conflict; anon role cannot select watch_item.
- **Token impact:** None. · **Risks:** Schema is expensive-ish to reverse once populated: decisions.md entry first (in P0-14).
- **Needs decision entry:** yes · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-02) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-03. Taxonomy, question bank and thresholds config
- **What:** Write docs/projects/tidewatch/taxonomy.md from this plan and config/tidewatch.json (per-class thresholds, enabled flags all false, shadow true, model ids, caps). The question text is the contract the classifier and the replay set share.
- **Goals:** 1, 2, 3, 7, 10, 11 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 high · **Effort:** S · **Lane:** L-TIDE-SPEC · **Depends on:** P0-14
- **Files:** `docs/projects/tidewatch/taxonomy.md (new)`, `config/tidewatch.json (new)`, `packages/shared/src/jev/questions.ts (question text only, after P1-01)`
- **Acceptance:** node -e "JSON.parse(require('fs').readFileSync('config/tidewatch.json'))" succeeds; every class in taxonomy.md has a config entry.
- **Token impact:** Small. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-03) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-04. Replay set and labels for calibration
- **What:** Export 90 days of news_story with sources, the 21 growth-strategy time-sensitive events, 150 Reddit leads, 50 Facebook leads, 60 merch items and 40 theory bundles into a frozen replay file; label each with Sonnet 5.5 via the Batch API (metered, 50% off) using the taxonomy; the PM spot-checks 30 critical and personal edge cases. Store labels, not raw member text.
- **Goals:** 1, 2, 3, 7 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 (batch labels) · **Effort:** M · **Lane:** L-TIDE-EVAL · **Depends on:** P1-03
- **Files:** `scripts/tidewatch/export-replay.mjs (new)`, `scripts/tidewatch/label-replay.mjs (new)`, `docs/projects/tidewatch/replay/ (labels only, gitignored raw)`
- **Acceptance:** Replay file with >= 600 labeled items; per-class counts printed; >= 15 critical and >= 5 personal examples (synthetic ones marked) present.
- **Token impact:** One-off metered batch, small. · **Risks:** Too few real critical events: add synthetic, clearly flagged cases.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-04) in a worktree outside Projects; PR with TL;DR; auto-merge on green
- **Execution note (P1-04):** the 21 growth-strategy time-sensitive events were not found as a separate list under `docs/`; the 90-day news pool covers them. The label run executes in the `tidewatch-replay-label` workflow (subscription token lives in Actions).

#### P1-05. Tidewatch collector (pull adapters over existing stores)
- **What:** scripts/tidewatch/collect.mjs reads, on per-source cursors, news_raw_item and news_story, intake issues (gh api), appearance issues, engagement_lead, fan_theory_candidate, merch seed diffs, social ledgers, reply ledger and merged seed moments; builds item_key, url_norm_hash and title_simhash; upserts watch_item and story_timeline.detected_at. Zero LLM, never edits other pipelines.
- **Goals:** 1, 2, 3, 5, 7, 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** L · **Lane:** L-TIDE · **Depends on:** P1-02
- **Files:** `scripts/tidewatch/collect.mjs (new)`, `scripts/tidewatch/adapters/*.mjs (new)`, `scripts/tidewatch/fingerprint.mjs (new)`, `scripts/tidewatch/*.test.mjs (new)`
- **Acceptance:** node scripts/tidewatch/collect.mjs --dry-run --since 24h prints counts per source and 0 errors; re-running inserts 0 new rows (idempotent); simhash unit tests pass.
- **Token impact:** None. · **Risks:** Cursor bugs could skip items; the weekly recall audit (P3-03) catches gaps.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-05) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-06. Tidewatch classifier in shadow mode
- **What:** scripts/tidewatch/classify.mjs: code prefilters (redline phrase gates from packages/shared, exact and near-duplicate checks, story_id), then one Jev call per item with the question set for its source family; Haiku 5.5 (structured output, enum only) when the top probability is under the class threshold or Jev errors; 5% of confident items also go to Haiku for drift data; injection Noul flags skip drafting; writes watch_decision with shadow=true and story_timeline.classified_at. No actions.
- **Goals:** 1, 2, 3, 7, 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** L · **Lane:** L-TIDE · **Depends on:** P1-01, P1-03, P1-05, P1-09
- **Files:** `scripts/tidewatch/classify.mjs (new)`, `scripts/tidewatch/cascade.mjs (new)`, `scripts/tidewatch/classify.test.mjs (new)`
- **Acceptance:** Against the replay file offline: script prints per-class precision and recall and the Jev-to-Haiku escalation rate; live shadow run writes >= 1 watch_decision per new watch_item.
- **Token impact:** Jev cents per day; Haiku 5.5 on ~10-25% of items (estimate). · **Risks:** First-option bias and injection: randomization and wrapping are tested.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-06) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-07. tidewatch.yml on the home clock with a freeze switch
- **What:** Plain run: workflow (no agent) with mode input fast (primary sources only, every 10 min: clock row minGap 9) or sweep (all sources, hourly: minGap 55); concurrency group; reads config/tidewatch.json; TIDEWATCH_FREEZE variable (agents may set on via set-switch.mjs, only the owner lifts). If P0-07 shows the clock fires < 90% of expected, add a joey2023 scheduled task that dispatches the same workflow as a second clock.
- **Goals:** 1, 2 · **Owner:** codex · **Model/tier:** gpt-5.3-codex-spark low · **Effort:** S · **Lane:** L-OPS · **Depends on:** P1-06, P0-02, P0-07
- **Files:** `.github/workflows/tidewatch.yml (new)`, `scripts/ops/clock-table.json`, `scripts/ops/set-switch.mjs`
- **Acceptance:** Over 24 h gh run list --workflow tidewatch.yml shows >= 120 fast runs and >= 22 sweep runs; each run < 5 min.
- **Token impact:** None beyond P1-06. · **Risks:** Shared clock-table: one item per wave edits it.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-07) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-08. Worker primary-source fast mode and official source list
- **What:** Add --primary mode to the worker cycle (official YouTube channel RSS, taylorswift.com and store site-diff, Google News newest RSS for 'Taylor Swift', Republic/UMG press RSS; no GNews to stay under 100/day) that writes news_raw_item and story_timeline.first_public_at from the item's own timestamp. Expand OFFICIAL_DOMAINS and its scripts/lib/reputable-sources.mjs mirror (label and press domains; ticketing only with an attraction-id URL rule; official YouTube channel ids count as official). Add GDELT to the registry only if it passes a recall check.
- **Goals:** 1, 2 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-WORKER · **Depends on:** P0-12, P0-14
- **Files:** `apps/worker/src/pipeline/run-cycle.ts`, `apps/worker/src/index.ts`, `apps/worker/src/sources/registry.ts`, `packages/shared/src/source-tiers.ts`, `scripts/lib/reputable-sources.mjs`, `supabase/migrations/<ts>_news_sources_primary.sql (new)`
- **Acceptance:** npm test --workspace @swift2/worker passes; npm run news --workspace @swift2/worker -- --primary --dry-run lists the primary sources and finishes < 90 s; source-tier tests cover the new domains.
- **Token impact:** None (zero LLM until Tidewatch). · **Risks:** Widening OFFICIAL_DOMAINS also widens the rumor sourceTier gate; recorded in decisions (P0-14).
- **Needs decision entry:** yes · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-08) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-09. Shared direct-call Claude wrapper with caps and caching
- **What:** Extend scripts/lib/anthropic.mjs: model constants (claude-haiku-5-5, claude-sonnet-5-5), structured outputs, prompt caching on the stable system prompt, per-caller daily call and token caps stored in llm_usage, Batch API helper for non-urgent work, typed error chain, kill on llm_usage over cap.
- **Goals:** 1, 3, 6, 7 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** M · **Lane:** L-LLM · **Depends on:** P1-01
- **Files:** `scripts/lib/anthropic.mjs`, `scripts/lib/anthropic.test.mjs`, `scripts/lib/llm-caps.mjs (new)`
- **Acceptance:** Unit tests: cap reached returns null without a network call; cache_control present on system blocks; usage row written per call.
- **Token impact:** Makes every scripted call capped and cache-friendly. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-09) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-10. Answerers become scripted drafters with thread context
- **What:** Replace the routine-awareness-answerer and routine-community-answerer agent runs with scripts/community/draft-replies.mjs: Jev q_discussion pre-rank, then one Haiku 5.5 call per top lead (Sonnet 5.5 for r/TaylorSwift and r/swifties) given title, body excerpt and top comments (transient, never stored; engagement_lead.context keeps an our-words summary only), the moment catalogue and the voice rules; voice critic pass; same output contract (.scratch/out/drafts.json and validator). community-awareness-deliver triggers on the new workflow.
- **Goals:** 6, 7, 8, 9 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-COMMUNITY · **Depends on:** P1-09, P1-01
- **Files:** `scripts/community/draft-replies.mjs (new)`, `docs/agents/runner-prompts/awareness-answerer.md (becomes the system prompt)`, `.github/workflows/routine-awareness-answerer.yml (replaced by community-draft-replies.yml)`, `.github/workflows/community-awareness-deliver.yml`, `.github/workflows/routine-community-answerer.yml`
- **Acceptance:** Dispatch run drafts >= 1 reply for >= 80% of eligible leads, each <= 300 chars, passing the existing validator; community-awareness-deliver delivers cards in the same hour; 0 OAuth turns used.
- **Token impact:** ~445 SET/wk off OAuth; metered cents per day. · **Risks:** Policy on transient raw text: covered by decisions.md:8402 posture; recorded in P0-14.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-10) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-11. marjorie-ops becomes code plus a Jev gate
- **What:** scripts/ops/marjorie-ops-precheck.mjs gathers signals deterministically (open watchdog alerts, red workflows, stuck PRs, held content); one Jev Noul per signal 'needs an agent action?' with context; dispatch the Sonnet 5.5 routine with only the flagged items when any is >= 0.7; otherwise exit green.
- **Goals:** 1, 2, 3, 4, 6 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-ROUTINES · **Depends on:** P1-01, P0-02
- **Files:** `scripts/ops/marjorie-ops-precheck.mjs (new)`, `.github/workflows/routine-marjorie-ops.yml`, `docs/agents/runner-prompts/marjorie-ops.md`
- **Acceptance:** Over 72 h the routine's agent step runs on <= 25% of fires; no watchdog alert ages past 24 h unhandled (watchdog report).
- **Token impact:** ~1,000 SET/wk. · **Risks:** Missed ops issue: the watchdog's 24 h red alert remains the backstop.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-11) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-12. marjorie-status-reply and kevin-radar to Jev plus code
- **What:** status-reply: Jev Choice over a fixed set of status intents, templated answers from live data, Sonnet 5.5 only for free-form questions; kevin-radar: deterministic checks plus Jev classification of findings.
- **Goals:** 2, 4 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** M · **Lane:** L-ROUTINES-B · **Depends on:** P1-01
- **Files:** `.github/workflows/routine-marjorie-status-reply.yml`, `scripts/marjorie/status-intents.mjs (new)`, `.github/workflows/routine-kevin-radar.yml`, `scripts/kevin/radar.mjs (new)`
- **Acceptance:** Replay of the last 30 status requests: >= 80% answered by templates with correct data; kevin-radar output matches the last 5 agent runs' findings within tolerance.
- **Token impact:** ~800 SET/wk. · **Risks:** Template answers feel robotic; Sonnet path stays for anything unmatched.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-12) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-13. Codex worker on joey2023 and Austin retirement
- **What:** scripts/home/codex-worker/ (Node + PowerShell installer): every 30 min, take one GitHub issue labeled codex:ready (tier labels codex:spark, codex:sol, codex:sol-high), refuse any issue touching scripts/social/** or social/**, create a worktree under %LOCALAPPDATA%\longlive-wt, run codex exec with the tier, run scoped tests, push a branch, open a PR labeled codex-built with the TL;DR; a Claude Sonnet 5.5 review routine (paul-blart reshaped) reviews it and auto-merge arms on approval and green CI. Single concurrency, worktree removed after merge. routine-austin-build and kevin-daily-desk route their tickets to the label instead of building.
- **Goals:** 2, 4, 6 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** L · **Lane:** L-HOME-CODEX · **Depends on:** P0-14
- **Files:** `scripts/home/codex-worker/worker.mjs (new)`, `scripts/home/codex-worker/install-task.ps1 (new)`, `.github/workflows/routine-austin-build.yml`, `.github/workflows/routine-paul-blart.yml`, `docs/agents/codex.md`, `MAP.md`
- **Acceptance:** A test issue labeled codex:spark produces a green PR labeled codex-built within 60 min, reviewed by the Claude routine, merged, worktree removed; an issue touching social/** is refused with a comment.
- **Token impact:** ~900 SET/wk off OAuth; uses Codex plan tokens. · **Risks:** Unattended pushes from the owner's machine: branch protections and Claude review stay mandatory; disk use (remove worktrees).
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** own branch (feature/tidewatch-p1-13) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-14. Community engagement columns and outcome table
- **What:** engagement_lead gains score, num_comments, reactions, thread_created_at, velocity, rank_score, last_scored_at; new community_outcome (post_ledger_id, platform, comment_url, comment_id, score, replies, horizon 1h/24h/7d, checked_at); community_post_ledger gains comment_url.
- **Goals:** 7, 8, 9 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** S · **Lane:** L-DB · **Depends on:** P1-02
- **Files:** `supabase/migrations/<ts>_community_outcomes.sql (new)`, `packages/shared/src/community/types.ts`
- **Acceptance:** Migration applies locally; existing community tests pass.
- **Token impact:** None. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-14) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-15. Home Reddit reader on joey2023
- **What:** scripts/home/reddit-reader/: headless Chromium via Playwright, anonymous (never logged in), read-only, human-paced (>= 6 s between pages, <= 300 pages per hour, exponential backoff on 429); every 20 min reads hot and new listings for the awareness subs and Reddit-wide search (score, comments, age), thread pages for the top candidates (body and top comments, passed transiently), and theory subs' new threads for the crawl; writes engagement_lead and crawl bundles to Supabase with a heartbeat row. The GitHub RSS scan skips while the heartbeat is < 30 min old. Never posts, votes, messages or logs in.
- **Goals:** 3, 7, 8, 9 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** L · **Lane:** L-HOME-REDDIT · **Depends on:** P1-14, P0-14
- **Files:** `scripts/home/reddit-reader/reader.mjs (new)`, `scripts/home/reddit-reader/install-task.ps1 (new)`, `scripts/community/awareness-scan.mjs (heartbeat skip)`, `scripts/community/crawl.mjs (accept home bundles)`, `docs/community/README.md`, `MAP.md`
- **Acceptance:** 24 h after install: heartbeat fresh, >= 95% of runs without a 429, engagement_lead rows carry score and num_comments, crawl bundles include comment trees.
- **Token impact:** None (zero LLM). · **Risks:** Reddit blocks the home IP: backoff, low rate, GitHub scan fallback; PC reboots: task restarts on boot.
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** own branch (feature/tidewatch-p1-15) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-16. Facebook export: permalinks, engagement counts, activity log, daily cadence
- **What:** Extension: resolve lazy hrefs by focusing or hovering each post's timestamp link before reading (fallback: post id from nested anchors), build https://www.facebook.com/groups/<gid>/posts/<postid>/ without tracking params; unit schema v2 adds permalink, reactionCount, commentCount; receiver validates; buildHarvestedHtml, facebook-groups-parser and fb-export-ingest carry permalink into engagement_lead.url and counts into the new columns; a second pass reads the owner's activity log for replies and reactions on his own comments into community_outcome; Windows task daily for the top 3 groups, weekly for the rest (per D7). No member names or verbatim quotes stored.
- **Goals:** 7, 9 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** L · **Lane:** L-FBEXT · **Depends on:** P0-14, P1-14
- **Files:** `scripts/knowledge/fb-extension/harvest-core.js`, `scripts/knowledge/fb-extension/content.js`, `scripts/knowledge/fb-extension/manifest.json`, `scripts/knowledge/fb-export-run.mjs`, `scripts/knowledge/fb-export-task.ps1`, `apps/worker/src/sources/facebook-groups-parser.ts`, `scripts/community/fb-export-ingest.mjs`, `scripts/community/fb-lead-reingest.mjs`
- **Acceptance:** Next export: >= 80% of harvested units carry a permalink; engagement_lead facebook rows have url set; parser tests pass with a fixture containing lazy hrefs; activity-log pass writes >= 1 community_outcome row when the owner has commented.
- **Token impact:** None. · **Risks:** Meta account-flag risk rises with frequency (owner accepted weekly in decisions.md:775; daily needs D7).
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** own branch (feature/tidewatch-p1-16) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-17. Better Reddit and Facebook cards
- **What:** awareness-message.mjs shows sub or group, title, age, score and comment count (Reddit) or reactions and comments (Facebook), the one-line why, rank position and the direct link (Facebook permalink when present); the reply stays a separate message; the signed Posted and Skip links are unchanged (no typing ever asked of the owner).
- **Goals:** 7 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-COMMUNITY · **Depends on:** P1-10, P1-15
- **Files:** `scripts/community/awareness-message.mjs`, `scripts/community/awareness-deliver.mjs`, `scripts/community/awareness-message.test.mjs`
- **Acceptance:** Snapshot tests for a Reddit and a Facebook card; next delivered batch in Discord shows the new lines.
- **Token impact:** None. · **Risks:** Discord message length: keep the card under the limit.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-17) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-18. Vault Run split into judgment and craft jobs with yield records
- **What:** Two sequential jobs on one vault/<date> branch so the generated file is regenerated once: job A (Content Shift, Rumor Desk) on claude-opus-5-5 with max_turns 100; job B (Answerer, Photo Enrichment, Cross-Link, Stylist) on claude-sonnet-5-5 with max_turns 100; job C (no agent) runs sync:content, the full gate and opens or updates the PR. Each lane appends a yield record (added, edited, skipped, failed with reason) to the PR body as a fenced JSON block. Tidewatch normal-news intake issues are first in Content Shift's queue.
- **Goals:** 3, 4, 6 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-VAULT · **Depends on:** P0-01, P0-02
- **Files:** `.github/workflows/routine-vault-run.yml`, `docs/agents/runner-prompts/vault-run-judgment.md (new)`, `docs/agents/runner-prompts/vault-run-craft.md (new)`, `docs/agents/runner-prompts/vault-run.md`, `scripts/vault/yield-record.mjs (new)`, `MAP.md`
- **Acceptance:** Next scheduled run produces one PR whose body parses with node scripts/vault/yield-record.mjs --parse <pr> into per-lane counts; check:generated passes; no lane starved (each due lane reports a status).
- **Token impact:** ~575 SET/wk saved while lanes stop starving each other. · **Risks:** Job B starting from job A's push: use the same branch and fetch before starting.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-18) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-19. Merch E6 for real: matcher, step-4 writer, E3 gate, schedule
- **What:** Replace the stubs in merch-matcher-authoring.yml with match-moments-authoring.mjs main(); input builder picks fashion moments with no or stale products plus Tidewatch merch_outfit items; Awin FTS index (after P0-09), brand-direct, SerpAPI capped at 5 per run; Sonnet 5.5 vision judge; run the E3 auditor on candidates; new write-moment-products.mjs maps score to matchScore and matchTier, applies the alternatives rule, runs E1 link and E2 image checks, and opens a content PR (auto-merge allowlist). Schedule Tue and Fri, cap 3 looks per run, MAX_RUN_COST_USD 3 on the metered key, typed confirmation kept only for manual runs above the cap.
- **Goals:** 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** L · **Lane:** L-MERCH · **Depends on:** P0-09, P0-14, P1-09
- **Files:** `.github/workflows/merch-matcher-authoring.yml`, `scripts/merch-engine/match-moments-authoring.mjs`, `scripts/merch-engine/write-moment-products.mjs (new)`, `scripts/merch-engine/build-matcher-input.mjs (new)`, `scripts/merch-engine/audit-matches-authoring.mjs`, `docs/SPEC.merch-autonomy.md`
- **Acceptance:** A dispatch run on 3 fixture moments opens a content PR adding products[] with matchScore set and passing validate:content; two scheduled runs in one week merge >= 3 matched products total.
- **Token impact:** Metered, capped at $3 per run (the cap is the estimate's upper bound). · **Risks:** Poor matches: E3 audit floor and the 'similar' threshold; weekly owner-optional spot check.
- **Needs decision entry:** yes · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-19) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-20. Fan-made merch auto-curation lane
- **What:** scripts/merch-engine/curate-fanmade.mjs: for open candidate issues, Jev q_bootleg and q_merch_kind, Haiku 5.5 vision D3 check on the listing image, E1 and E2 verification, write accepted items to supabase/seed/merch/fanmade.mjs with provenance, cap 5 per week, close rejected issues with the reason; weekly schedule.
- **Goals:** 10 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-MERCH-FAN · **Depends on:** P0-10, P1-01, P1-09
- **Files:** `scripts/merch-engine/curate-fanmade.mjs (new)`, `.github/workflows/merch-fanmade-curate.yml (new)`, `supabase/seed/merch/fanmade.mjs (by the lane)`
- **Acceptance:** First run merges a PR adding 1 to 5 items that pass validate:content, each with provenance d3, e1 and e2.
- **Token impact:** Metered cents per week. · **Risks:** Bootleg slips through: Jev threshold low (0.3) plus vision check.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-20) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-21. Theory yield: full threads, skip mined bundles, cheaper miner, promote at 2
- **What:** Crawl consumes home-reader bundles of new and hot theory threads with comment trees (not top-of-year RSS); bundles keyed bundle:<thread>:<comment bucket> skip if unchanged; Jev q_theory pre-filter so Haiku 5.5 mines only positives; Facebook export comments feed the miner as our-words summaries; PROMOTION_MENTION_THRESHOLD 3 to 2 with heat; weaving floor unchanged until data says otherwise; hard ban on private-life theories untouched.
- **Goals:** 3 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-THEORY · **Depends on:** P1-15, P1-01
- **Files:** `scripts/community/crawl.mjs`, `scripts/community/theory-miner.mjs`, `apps/worker/src/extract/run-theory-miner-stage.ts`, `apps/worker/src/extract/theory-promote.ts`
- **Acceptance:** Over 7 days the miner reports > 0 theories found on >= 5 days and fan_theory_candidate grows by >= 20 rows; theory-promote considers > 0 candidates.
- **Token impact:** Fewer Haiku calls per useful theory. · **Risks:** Lower bar promotes weak theories; heat ordering and Clownbot screens limit exposure.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-21) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-22. New-on-site feed for social
- **What:** scripts/social/new-on-site.mjs (zero LLM) runs daily after content-publish and writes social/inbox/new-on-site-<date>.json: moments merged in the last 7 days with media, significance and deep link; Tree's weekly plan and event dispatch read it first.
- **Goals:** 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-SOCIAL · **Depends on:** P0-05
- **Files:** `scripts/social/new-on-site.mjs (new)`, `.github/workflows/social-new-on-site.yml (new)`, `docs/agents/runner-prompts/tree-weekly-plan.md`, `scripts/social/lib/draft-inputs.mjs`
- **Acceptance:** Daily file lands via automerge; the next weekly plan PR cites >= 3 moment ids from it.
- **Token impact:** None. · **Risks:** Must not collide with #5484's weekly-plan edits: rebase onto it if merged.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-22) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-23. Media gate gap audit and fixes
- **What:** Researcher lists which surfaces lack a media gate (non-moment content types, current_item image allowlist misses for official and established sources, social inbox items, merch rows); executor adds the missing gates, allowlists official image hosts and adds a breaking image fallback (official YouTube thumbnail, og:image of the official or established source) so critical items are not held for missing_image.
- **Goals:** 4, 1 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** M · **Lane:** L-MEDIA · **Depends on:** none
- **Files:** `packages/shared/src/current-item-quality.ts`, `apps/worker/src/extract/image-resolve.ts`, `scripts/lib/moment-media-gate.mjs`, `scripts/validate-content.mjs`
- **Acceptance:** Audit table committed in docs/projects/tidewatch/media-gaps.md; tests prove a critical item from an official source gets an image; validate:content fails a fixture of each newly gated type without media.
- **Token impact:** None. · **Risks:** Hotlink rules (guardrail 2) unchanged: hotlink only, never rehost.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-23) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-24. Voice critic module and exemplar corpus
- **What:** docs/content-ops/voice-exemplars/ auto-seeded from the best-performing approved posts and Vault items plus counter-examples; scripts/voice/critic.mjs scores love, insight, opinion, clowning fit and AI tells 1 to 5 with Haiku 5.5 (Sonnet 5.5 rewrite once when any score < 3); used by draft-replies, breaking drafts and Vault lane prompts; optional 10-minute owner star pass adds his picks.
- **Goals:** 6 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-VOICE · **Depends on:** P1-09
- **Files:** `scripts/voice/critic.mjs (new)`, `docs/content-ops/voice-exemplars/*.md (new)`, `docs/content-ops/editorial-voice-and-pipeline.md`
- **Acceptance:** On 40 exemplar and 20 counter-example items the critic separates them (mean gap >= 1.0 point); unit tests for the rewrite-once rule.
- **Token impact:** Metered cents per day. · **Risks:** Critic drift: weekly sample vs owner ratings (P3-05).
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p1-24) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P1-25. Hermes session: Tree reads the new-on-site feed and breaking flag
- **What:** In a Hermes session, make Hermes Tree's daily loop read social/inbox/new-on-site-*.json first and skip slots already taken by breaking posts; no duplication of the Swift2 breaking path.
- **Goals:** 5, 1 · **Owner:** hermes-session · **Model/tier:** per Hermes kit · **Effort:** S · **Lane:** L-HERMES · **Depends on:** P1-22, P0-16
- **Files:** none (no repo change)
- **Acceptance:** One Hermes Tree draft in the following week cites a moment from the feed.
- **Token impact:** None in Swift2. · **Risks:** Coordination lag.
- **Needs decision entry:** no · **Needs human action:** yes · **Branch/PR:** n/a

#### P1-26. Owner home-machine setup (one sitting)
- **What:** Run the two installer commands (Reddit reader, Codex worker), confirm the local Supabase env file via env-sync, reload the updated Facebook extension and re-register its task with the new cadence.
- **Goals:** 3, 7, 8, 9 · **Owner:** OWNER ACTION · **Model/tier:** n/a · **Effort:** S · **Lane:** L-OWNER · **Depends on:** P1-13, P1-15, P1-16
- **Files:** none (no repo change)
- **Acceptance:** Task Scheduler shows 'Long Live Reddit Reader', 'Long Live Codex Worker' and the updated Facebook export task; reader heartbeat fresh.
- **Token impact:** Enables P1-13 and P1-15 savings. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** yes · **Branch/PR:** n/a

#### P1-27. Owner affiliate accounts (whenever ready, blocks nothing)
- **What:** Owner checks Awin (publisher id, join the 8 catalogue advertisers and Etsy 6220, approve the directory shortlist) and Amazon Associates (store id and status), then pastes the two public ids in chat; the PM sets NEXT_PUBLIC_AWIN_ID and NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG in Vercel production and preview (approved by the owner's message) and redeploys.
- **Goals:** 11 · **Owner:** OWNER ACTION · **Model/tier:** n/a · **Effort:** S · **Lane:** L-OWNER · **Depends on:** none
- **Files:** none (no repo change)
- **Acceptance:** docs/ops/AFFILIATE-COVERAGE.md shows wrapped > 0 after the next sync; a live product link carries the tag and the disclosure renders.
- **Token impact:** None. · **Risks:** Amazon may require 3 qualifying sales in 180 days.
- **Needs decision entry:** no · **Needs human action:** yes · **Branch/PR:** n/a


### P2: Tidewatch live

#### P2-01. Shadow calibration review and per-class go/no-go
- **What:** After >= 7 days and >= 500 shadow decisions: per-class precision and recall against the replay labels and a 100-item fresh sample labeled by Sonnet 5.5; Jev vs Haiku agreement; escalation rate; set thresholds in config/tidewatch.json. Critical candidate recall must be 100% on the replay set; critical act precision after fact-check 100%.
- **Goals:** 1, 2, 3, 7, 10, 11 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 high · **Effort:** S · **Lane:** L-TIDE-SPEC · **Depends on:** P1-06, P1-04, P1-07
- **Files:** `config/tidewatch.json`, `docs/projects/tidewatch/calibration-<date>.md (new)`
- **Acceptance:** Calibration doc merged with a table per class and a go or no-go per class.
- **Token impact:** Small metered labeling. · **Risks:** Too few live critical events: rely on replay plus drill.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-01) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-02. Action router
- **What:** scripts/tidewatch/route.mjs executes the per-class action for decisions whose class is enabled in config: current_item ensure, intake issue with labels, social candidate files, merch queues, theory upserts, lead priority bumps, retraction trigger, duplicate harvest queue; idempotent via watch_decision.action_ref; respects TIDEWATCH_FREEZE; social and push actions call the dedicated modules, never write queue files directly.
- **Goals:** 1, 2, 3, 5, 7, 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** L · **Lane:** L-TIDE · **Depends on:** P1-06
- **Files:** `scripts/tidewatch/route.mjs (new)`, `scripts/tidewatch/actions/*.mjs (new)`, `scripts/tidewatch/route.test.mjs (new)`
- **Acceptance:** Unit tests per class with mocked effects; replay in dry-run prints the action plan for 600 items with 0 unexpected actions; re-running produces no duplicate effects.
- **Token impact:** None. · **Risks:** Wrong action at scale: classes go live one at a time (P2-13).
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-02) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-03. Fact-check module in code
- **What:** scripts/tidewatch/factcheck.mjs: collect the story's sources; official rule (expanded OFFICIAL_DOMAINS, official channel ids, attraction-id ticketing URLs); two-outlet rule counts distinct outlet owners (ownership map) and rejects syndicated copies (text similarity > 0.8); fetch article text (fetch-article-text.ts), exact anchor string match, Jev citation check (supports, contradicts, unrelated; >= 0.8) and a Noul 'stated as settled fact'; personal-life bar: official or rep statement, or two tier-1 outlets, plus a 10-minute re-check; Sonnet 5.5 verifier with structured output for critical and personal; returns {verdict, basis, sources[]} and writes story_timeline.verified_at.
- **Goals:** 1 · **Owner:** codex · **Model/tier:** gpt-5.6-sol xhigh · **Effort:** L · **Lane:** L-FACT · **Depends on:** P1-01, P1-08, P1-09
- **Files:** `scripts/tidewatch/factcheck.mjs (new)`, `scripts/tidewatch/outlet-owners.json (new)`, `scripts/tidewatch/factcheck.test.mjs (new)`
- **Acceptance:** On the replay set: every labeled critical event confirmed; 0 of the rumor and single-source items confirmed; syndicated AP copies count once (test); personal-life fixtures pass only with official or two tier-1 sources.
- **Token impact:** Sonnet 5.5 on a handful of items per week. · **Risks:** Outlet paywalls block text fetch: anchor on headline and dek; fall back to 'not confirmed' (safe).
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-03) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-04. Breaking path to the site with on-demand revalidation
- **What:** Router calls the existing worker write path for a confirmed critical story (status confirmed, source_tier from the fact-check, image from P1-23), then calls a new secured revalidation endpoint so the live route refreshes in about a minute instead of up to 15; writes story_timeline.on_site_at.
- **Goals:** 1 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** M · **Lane:** L-WEB · **Depends on:** P2-03, P0-11, P1-23
- **Files:** `apps/web/app/api/revalidate-live/route.ts (new)`, `apps/web/app/vault/live/[eraId]/route.ts`, `scripts/tidewatch/actions/site.mjs (new)`
- **Acceptance:** In a preview deployment a test story appears on /vault/live within 2 min of the router call; endpoint rejects calls without the secret.
- **Token impact:** None. · **Risks:** Endpoint abuse: secret plus rate limit.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-04) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-05. Breaking and Baby Watch push categories
- **What:** Router emits the T1 event for confirmed critical work news (existing categories); add baby_watch category (migration, TIER_BY_CATEGORY, settings toggle copy 'Baby Watch: official announcements only', inbox rendering) per D5; update NOTIFICATIONS_SPEC.md; governor unchanged.
- **Goals:** 1 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-NOTIFY · **Depends on:** P0-11, P0-14
- **Files:** `packages/core/src/notification-events.ts`, `supabase/migrations/<ts>_baby_watch_category.sql (new)`, `apps/web/app/settings/notifications/*`, `NOTIFICATIONS_SPEC.md`
- **Acceptance:** Typecheck passes; a staging device opted into baby_watch receives one test push from a dry-run event; a device not opted in receives none; browser check on mobile and desktop for the toggle.
- **Token impact:** None. · **Risks:** Brand risk of the name: D5.
- **Needs decision entry:** yes · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-05) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-06. Breaking social fast path
- **What:** scripts/social/breaking-draft.mjs: one Sonnet 5.5 call drafts the IG+X pair from verified facts and the image, voice critic pass, validate:social, then stamps via social-tree-approve.yml with a breaking flag and dispatches social-poster immediately; queue.mjs allows a breaking campaign up to 2 extra posts per platform per day (D6); pairing stays mandatory; SOCIAL_FREEZE respected. Never writes an approval key itself.
- **Goals:** 1, 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-SOCIAL · **Depends on:** P0-14, P1-24, P2-03, P0-05
- **Files:** `scripts/social/breaking-draft.mjs (new)`, `scripts/social/lib/queue.mjs`, `.github/workflows/social-breaking.yml (new)`, `docs/agents/tree.md`
- **Acceptance:** Dry-run on a replay critical event produces a valid pair that passes check-drafts; queue tests prove breaking items bypass the daily cap only up to 2; SOCIAL_FREEZE blocks it.
- **Token impact:** One Sonnet call per breaking event. · **Risks:** Ruling change (D6) must be merged first; guard denies running post-queue.mjs, so the poster workflow does the send.
- **Needs decision entry:** yes · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-06) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-07. Retraction path: site and push
- **What:** scripts/tidewatch/retract.mjs and tidewatch-retract.yml (dispatch or router): set current_item status debunked and hide it, kill pending events for the story, send a correction event only to devices that received the original, log to watch_decision; owner or agent can dispatch with a story id.
- **Goals:** 1 · **Owner:** codex · **Model/tier:** gpt-5.6-sol high · **Effort:** M · **Lane:** L-FACT · **Depends on:** P0-11
- **Files:** `scripts/tidewatch/retract.mjs (new)`, `.github/workflows/tidewatch-retract.yml (new)`, `packages/core/src/notification-router.ts`
- **Acceptance:** Drill on a test story: card hidden within 2 min, pending push killed, correction event targets only prior recipients (test).
- **Token impact:** None. · **Risks:** Correction pushes count toward the governor cap.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-07) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-08. Retraction path: social
- **What:** Social side of a retraction: delete IG and Facebook Page media through the existing social-delete-media flow, delete the X post via the X API, post a short correction when the original was seen; social lane, Claude only.
- **Goals:** 1, 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-SOCIAL · **Depends on:** P2-07, P2-06
- **Files:** `scripts/social/retract-post.mjs (new)`, `.github/workflows/social-delete-media.yml`
- **Acceptance:** Dry-run prints the exact delete calls for a test campaign; unit tests for the X delete request shape.
- **Token impact:** None. · **Risks:** X delete may need a paid tier (UNVERIFIED): fall back to a correction reply.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-08) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-09. Normal flow wiring and news-triage retirement
- **What:** Router intake issues replace routine-news-triage (delete it after 7 days of parity); Content Shift queue orders Tidewatch-labeled issues first; social-event-dispatch reads router social candidates instead of uncovered intake issues; EVENT_DAILY_CAP stays 2 for non-breaking.
- **Goals:** 1, 2, 5 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-SOCIAL · **Depends on:** P2-02
- **Files:** `.github/workflows/routine-news-triage.yml (delete)`, `scripts/social/lib/draft-inputs.mjs`, `scripts/social/dispatch-event-drafts.mjs`, `docs/agents/runner-prompts/vault-lanes/1-content-shift.md`
- **Acceptance:** 7-day parity: router issues cover >= 95% of what news-triage filed; then the routine is removed and check:routines passes.
- **Token impact:** ~145 SET/wk. · **Risks:** Parity gap: keep both for a week.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-09) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-10. Duplicate harvest into theory signals
- **What:** For Reddit items classed duplicate, the home reader fetches the comment tree transiently; Jev q_theory on comment batches; Haiku 5.5 writes our-words claims into fan_theory_candidate (mention_count +1, sample_urls = thread URL); Facebook duplicates contribute counts and our-words summaries only.
- **Goals:** 3 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-THEORY · **Depends on:** P2-02, P1-21
- **Files:** `scripts/tidewatch/actions/harvest.mjs (new)`, `scripts/home/reddit-reader/reader.mjs (harvest queue)`
- **Acceptance:** Over 7 days >= 30% of fan_theory_candidate mention increments come from harvested duplicates; no row contains a member name.
- **Token impact:** Haiku only on positives. · **Risks:** Comment text retention: transient by design, tested.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-10) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-11. Merch branch wiring
- **What:** Router merch_outfit appends to the E6 input queue, merch_fan to the curation queue, merch_official emits the T2 official_merch event and confirms the store-drop draft exists.
- **Goals:** 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** S · **Lane:** L-MERCH · **Depends on:** P2-02, P1-19, P1-20
- **Files:** `scripts/tidewatch/actions/merch.mjs (new)`, `scripts/merch-engine/build-matcher-input.mjs`
- **Acceptance:** A replayed outfit item appears in the next matcher input; a replayed store diff produces one official_merch event (deduped).
- **Token impact:** None. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-11) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-12. Breaking and retraction drill
- **What:** Replay 5 historical critical events (including an album announcement, a tour-date drop and the Patient Zero video) and 200 non-critical items through fast lane, classifier, fact-check, router, site, push and social in dry-run against staging; time every stage; then a retraction drill; then one synthetic personal-life case in dry-run only.
- **Goals:** 1 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 high (orchestrates an executor) · **Effort:** M · **Lane:** L-TIDE-SPEC · **Depends on:** P2-03, P2-04, P2-05, P2-06, P2-07
- **Files:** `docs/projects/tidewatch/drill-<date>.md (new)`
- **Acceptance:** All 5 critical events reach the site in <= 45 min of simulated time, 0 of 200 false positives, retraction completes in <= 30 min, drill report merged.
- **Token impact:** Small. · **Risks:** Staging lacks real devices: use the internal notifications page and a test device.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-12) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-13. Staged go-live by class
- **What:** Config PRs flip classes live one at a time with 48 h watch each: noise, duplicate, theory, discussion, merch, normal_news, official_drop, tour; then critical site only; then critical push; then critical social; personal-life last and only after the guardrails PR is merged by the owner. Rollback is the reverse config PR or TIDEWATCH_FREEZE.
- **Goals:** 1, 2, 3, 5, 7, 10, 11 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 high · **Effort:** M · **Lane:** L-TIDE-SPEC · **Depends on:** P2-01, P2-02, P2-12
- **Files:** `config/tidewatch.json`
- **Acceptance:** Every class live with no rollback in its 48 h window, or a recorded rollback with cause.
- **Token impact:** None. · **Risks:** Do not batch flips.
- **Needs decision entry:** yes · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p2-13) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P2-14. Owner merges the guardrails and spec PR
- **What:** Owner reads the one-paragraph TL;DR of the founder-owned guardrails.md and NOTIFICATIONS_SPEC.md changes and merges (or says 'approved' and the PM merges).
- **Goals:** 1, 5 · **Owner:** OWNER ACTION · **Model/tier:** n/a · **Effort:** S · **Lane:** L-OWNER · **Depends on:** P0-14
- **Files:** none (no repo change)
- **Acceptance:** PR merged.
- **Token impact:** None. · **Risks:** Until merged, personal-life stays off on the site and push; critical work news can still go live under existing rules.
- **Needs decision entry:** no · **Needs human action:** yes · **Branch/PR:** n/a


### P3: Measure, tune and grow

#### P3-01. Outcomes reader live with automatic comment capture
- **What:** Every 2 h the home reader opens the brand account's public comment page (u/NegativeRest9507, anonymous), matches each comment to community_post_ledger by thread id, stores comment_url (no owner typing) and records score and reply count at 1 h, 24 h and 7 d into community_outcome; Gmail reply_to_us and Page replies counted too; weekly community.json.
- **Goals:** 8, 9 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium-high · **Effort:** M · **Lane:** L-HOME-REDDIT · **Depends on:** P1-15, P1-14
- **Files:** `scripts/home/reddit-reader/outcomes.mjs (new)`, `scripts/community/outcomes-report.mjs (new)`, `docs/ops/dashboard/community.json (new)`
- **Acceptance:** >= 90% of comments acked as Posted in the last 7 days have a comment_url and a 24 h score.
- **Token impact:** None. · **Risks:** Reddit hides fresh scores for a period: the 24 h horizon is the metric.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-01) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-02. Thread ranking v2 from outcomes
- **What:** Fit the rank formula (age, velocity, size, sub, thread type, Jev discussion score) to what actually earned upvotes and replies; adjust per-sub daily caps within the ruled maxima; drop sub tiers that never reward us.
- **Goals:** 7, 8, 9 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** M · **Lane:** L-COMMUNITY · **Depends on:** P3-01
- **Files:** `scripts/community/awareness-rank.mjs (new)`, `scripts/community/awareness-subs.json`
- **Acceptance:** Two weeks after the change the median 24 h score of posted comments is higher than the two weeks before.
- **Token impact:** None. · **Risks:** Small samples: require >= 30 comments before refitting.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-02) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-03. Weekly recall audit
- **What:** news-recall.yml (zero LLM except Jev same-story matching): reference list from Google News top results, official uploads and top fan posts per day; recall at 48 h and at 1 h for critical; misses file intake issues and a source-gap ticket.
- **Goals:** 2 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** M · **Lane:** L-RECALL · **Depends on:** P1-05, P1-06
- **Files:** `.github/workflows/news-recall.yml (new)`, `scripts/tidewatch/recall.mjs (new)`, `docs/ops/dashboard/news.json (new)`
- **Acceptance:** First weekly JSON row has events, hit_48h, hit_1h_critical and a missed list with links.
- **Token impact:** Jev cents. · **Risks:** Reference list bias toward big outlets; add official channels to balance.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-03) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-04. Weekly scorecard collector
- **What:** scripts/ops/weekly-scorecard.mjs gathers the 11 goal metrics from story_timeline, watch_decision, seed diffs, community_outcome, merch seeds, the turn ledger and llm_usage into docs/ops/dashboard/scorecard.json every Monday; fails red if a source is unreadable rather than writing zeros; the PM republishes the artifact from it.
- **Goals:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** M · **Lane:** L-OBS · **Depends on:** P0-07, P1-02, P3-01
- **Files:** `scripts/ops/weekly-scorecard.mjs (new)`, `.github/workflows/ops-ledger.yml`, `docs/ops/dashboard/scorecard.json (new)`
- **Acceptance:** Monday run commits scorecard.json with all 11 goals populated or explicitly 'not measurable yet'.
- **Token impact:** Removes Claude from weekly reporting. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-04) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-05. Voice weekly sample and owner rating loop
- **What:** voice-sample.yml samples 20 shipped items and posts weekly, scores them with the critic via the Batch API into voice.json, posts 10 to #longlive-marjorie for optional 1 to 5 owner reactions, and logs model vs owner drift.
- **Goals:** 6 · **Owner:** executor-claude-sonnet · **Model/tier:** claude-sonnet-5-5 · **Effort:** S · **Lane:** L-VOICE · **Depends on:** P1-24
- **Files:** `.github/workflows/voice-sample.yml (new)`, `scripts/voice/weekly-sample.mjs (new)`, `docs/ops/dashboard/voice.json (new)`
- **Acceptance:** First weekly voice.json row with mean, p10 and dimension means.
- **Token impact:** Batch API, cents. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-05) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-06. Drift monitor and Jev 1.14 evaluation
- **What:** Weekly: Jev vs Haiku agreement on the 5% shadow sample per class, alert when it drops more than 5 points; evaluate jev-1.14.0 on the replay set and switch the pin only if it is at least as good.
- **Goals:** 1, 2, 3 · **Owner:** codex · **Model/tier:** gpt-5.6-sol medium · **Effort:** S · **Lane:** L-TIDE · **Depends on:** P2-13
- **Files:** `scripts/tidewatch/drift.mjs (new)`, `config/tidewatch.json`
- **Acceptance:** Drift JSON row weekly; an evaluation doc for 1.14.0.
- **Token impact:** Small. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-06) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-07. Raise caps where quality holds
- **What:** When media and voice pass rates hold for 2 weeks: Content Shift 3 to 6 items per run, E6 3 to 5 looks per run, fan curation 5 to 8 per week; each a one-line config or prompt change.
- **Goals:** 3, 4, 10, 11 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 (decides), executor-claude-sonnet (edits) · **Effort:** S · **Lane:** L-VAULT · **Depends on:** P3-04
- **Files:** `docs/agents/runner-prompts/vault-lanes/1-content-shift.md`, `.github/workflows/merch-matcher-authoring.yml`, `scripts/merch-engine/curate-fanmade.mjs`
- **Acceptance:** Two weeks after each raise the scorecard shows no drop in voice mean or media rate.
- **Token impact:** Adds turns to Vault Run; budgeted from the P1 savings. · **Risks:** Starvation returns: P0-01 pause logic protects content.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-07) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-08. GitHub Reddit scan to automatic fallback only
- **What:** After 2 weeks of >= 99% reader heartbeat, set the GitHub awareness and crawl scans to run only when the heartbeat is stale; delete the remnants of the old answerer routines.
- **Goals:** 7 · **Owner:** codex · **Model/tier:** gpt-5.3-codex-spark low · **Effort:** S · **Lane:** L-COMMUNITY · **Depends on:** P1-15
- **Files:** `.github/workflows/community-awareness-scan.yml`, `.github/workflows/community-crawl.yml`
- **Acceptance:** Scan runs log 'home reader healthy, skipping' while the heartbeat is fresh.
- **Token impact:** None. · **Risks:** None.
- **Needs decision entry:** no · **Needs human action:** no · **Branch/PR:** own branch (feature/tidewatch-p3-08) in a worktree outside Projects; PR with TL;DR; auto-merge on green

#### P3-09. Funding pool review
- **What:** From two weeks of turn ledger and llm_usage: is Vault Run still hitting the limit? If yes, recommend moving Vault Run (only) to the metered key with max_budget_usd per run; present cost estimate from measured tokens.
- **Goals:** 3, 4, 6 · **Owner:** claude-opus · **Model/tier:** claude-opus-5-5 high · **Effort:** S · **Lane:** L-DOCS · **Depends on:** P3-04
- **Files:** `docs/decisions.md`
- **Acceptance:** A dated recommendation with measured numbers; owner answer recorded.
- **Token impact:** Decides the last structural pool question. · **Risks:** None.
- **Needs decision entry:** yes · **Needs human action:** yes · **Branch/PR:** own branch (feature/tidewatch-p3-09) in a worktree outside Projects; PR with TL;DR; auto-merge on green


## Taxonomy (full)

#### Critical breaking news (work) (`critical_breaking`)
- **Definition:** A new, confirmed, time-sensitive fact about Taylor's work that fans want within the hour: new song or album announced or released, tour dates or ticket sale announced or changed, an official statement from Taylor or her team, a major award or record with official confirmation.
- **Signals:** official domain, official YouTube channel id, label or ticketing page; Google News burst: >= 3 outlets in 30 minutes; keywords: announce, out now, new album, tour dates, presale, statement; site-diff change on taylorswift.com or the store; Jev urgency score >= 4
- **Jev questions:** `q_class` (choice): Classify this item for a Taylor Swift fan news app. Pick the single best category. Options (order randomized per call): critical_work_news, personal_life_milestone, official_video_or_music_drop, tour_or_ticket_update, general_news, official_merch, fan_made_merch, identifiable_outfit, easter_egg_or_theory, fan_discussion, rumor_or_unconfirmed, correction_or_debunk, off_topic_noise. Criteria: critical_work_news means a NEW confirmed announcement about her music, albums, tours or an official statement that fans would want within the hour. | `q_official` (noul): Does the STATE show the information comes directly from Taylor Swift, her management or team, her record label, her official website or store, or an official ticketing page? | `q_settled` (choice): How does the source present the central claim? Options: stated as fact by the original source; attributed to an official statement; reported citing unnamed sources; speculation or rumor; joke or satire. | `q_urgency` (score): Score 1 to 5: how time-sensitive is this for a devoted fan? 5 = fans want it within the hour (new song, album, tour dates, presale opening, official major announcement); 3 = same day; 1 = evergreen. | `q_same_story` (choice): Which existing story reports the same event? Options: up to 8 candidate story titles chosen by code, plus 'none of these'. | `q_injection` (noul): Does the item text contain instructions addressed to an AI or automated system?
- **Thresholds:** act now >= 0.9; Haiku 5.5 fallback below 0.9; human review: none (never on the path)
- **Action:** Candidate bar is deliberately LOW (P >= 0.30 or urgency >= 4 with q_official >= 0.5) so nothing is missed; acting bar is HIGH: P >= 0.90 (or Haiku 5.5 agrees) AND code fact-check passes (official source or two independent reputable outlets stating it as settled fact) AND Sonnet 5.5 verifier agrees. Then: write current_item status confirmed with image, on-demand revalidate, emit T1 event, draft breaking IG+X pair, file Vault intake issue for the permanent moment. If the fact-check fails it falls to normal_news or rumor; no human step.
- **Notification:** T1 song_drop, album_news or tour_news through the governor (opt-in, quiet hours, 3 per device per day, 30 min coalescing), 5-minute kill window kept. No governor exemption.
- **Social:** Breaking campaign type: IG+X pair drafted by one Sonnet 5.5 call with the voice critic, stamped by tree-auto with a breaking flag, poster dispatched immediately; exempt from the 1-per-platform-per-day cap up to 2 extra per day (needs ruling D6). Facebook Page follows the poster's normal behavior.
- **Site:** current_item via the existing write path and quality gate (image required; official image fallback added), on-demand revalidation instead of waiting for the 15-minute ISR window; Vault moment next day through intake.
- **SLA:** Detect <= 10 min (fast lane), classify + fact-check <= 15 min, site <= 45 min target and <= 60 hard, push <= 60 min (later if the user is in quiet hours), social <= 60 min.

#### Critical personal-life news (Baby Watch) (`critical_personal`)
- **Definition:** A confirmed major personal-life milestone: pregnancy or birth announcement, engagement, marriage, or comparable milestone, announced by Taylor or her team or reported as settled fact by two major outlets. Speculation of any kind is never this class.
- **Signals:** post from Taylor's own account or a rep statement quoted by a tier-1 outlet; two tier-1 outlets (AP, Reuters, People, NYT, BBC and similar list in code) stating it as fact; q_personal yes and q_settled is fact or official statement
- **Jev questions:** `q_class` (choice): Same bank question; personal_life_milestone means a CONFIRMED engagement, marriage, pregnancy or birth announcement, never a rumor. | `q_personal` (noul): Is the central subject Taylor Swift's private or personal life (relationship, engagement, marriage, pregnancy, family, health) rather than her work? | `q_speculation` (noul): Does the item speculate, guess or theorize about a pregnancy, relationship status, health or body, rather than report an announcement? | `q_settled` (choice): Same bank question. | `q_supports` (choice): Citation check per source passage: does this passage SUPPORT, CONTRADICT or say nothing about (UNRELATED) the claim '<claim>'? Code first requires an exact anchor string match.
- **Thresholds:** act now >= 0.95; Haiku 5.5 fallback below 0.95; human review: none (never on the path)
- **Action:** Strictest bar: q_speculation >= 0.35 drops the item before anything else (redline). Otherwise requires official source or a rep statement, or two tier-1 outlets (distinct owners, not syndicated copies) stating it as fact; Jev citation check >= 0.8 per source; Sonnet 5.5 verifier agrees; a 10-minute re-check confirms sources still say it. Then site, push and social as critical_breaking with warm, factual, celebratory copy and no clues/countdown framing. Theory and weaving hard ban unchanged.
- **Notification:** New opt-in category baby_watch (pregnancy or birth only, fires only on confirmed announcement) and existing T2 relationship_news for engagement or marriage; 5-minute kill window applied; governor applies.
- **Social:** Allowed today only under guardrail 4's confirmed-only carve-out (social-only); the breaking fast path needs D5 and D6.
- **Site:** Needs D5: a confirmed_personal flag set only by the code bar lets the item pass the RELATIONSHIP, FAMILY and BODY phrase gates on current_item; LOCATION, HEALTH detail and minors gates stay.
- **SLA:** Site <= 60 min, push <= 60 min, social <= 90 min (extra re-check).

#### Official video or music drop (`official_drop`)
- **Definition:** A new official music video, lyric video, visualizer, live performance upload or audio release on an official channel or store.
- **Signals:** official YouTube channel id in appearance-discovery channels list; store or site-diff product or track page; q_official yes
- **Jev questions:** `q_class` (choice): Same bank question; official_video_or_music_drop means newly published official audio or video. | `q_urgency` (score): Same bank question.
- **Thresholds:** act now >= 0.85; Haiku 5.5 fallback below 0.85; human review: none (never on the path)
- **Action:** current_item with the YouTube thumbnail as image; Vault intake issue labeled video-drop so Content Shift embeds the video within 24 h (owner direction 2026-10-11: official drops lead the feed); social candidate at top of the inbox; if the drop is a brand-new song or album it is also critical_breaking.
- **Notification:** T1 song_drop for new music; T2 official_youtube for videos.
- **Social:** Priority same-day slot (normal 1-per-day cap) unless also critical.
- **Site:** Live card immediately; video embedded in a Vault moment <= 24 h.
- **SLA:** Site <= 60 min, Vault embed <= 24 h, social same day.

#### Tour or ticket update (`tour_ticket`)
- **Definition:** New or changed tour dates, venues, presale or on-sale times, or cancellations, from official or ticketing sources.
- **Signals:** ticketing page with Taylor attraction id; official site tour page diff; q_urgency >= 4
- **Jev questions:** `q_class` (choice): Same bank question; tour_or_ticket_update. | `q_official` (noul): Same bank question.
- **Thresholds:** act now >= 0.85; Haiku 5.5 fallback below 0.85; human review: none (never on the path)
- **Action:** If new dates or a sale opening: treat as critical_breaking (fact-check, fast path). Otherwise normal_news with tour category.
- **Notification:** T1 tour_news when confirmed.
- **Social:** Critical path if new dates or sale; else normal.
- **Site:** current_item, countdown_target_at set when a sale time exists.
- **SLA:** As critical_breaking for new dates or sales; else as normal_news.

#### Normal news (`normal_news`)
- **Definition:** Confirmed or credibly reported news that is not time-critical: public appearances, awards, chart news, interviews, collaborations, business news.
- **Signals:** established outlet in ESTABLISHED_DOMAINS; news_story corroborated; q_urgency 2 to 3
- **Jev questions:** `q_class` (choice): Same bank question; general_news. | `q_settled` (choice): Same bank question. | `q_outfit` (noul): Does the item show or describe a specific outfit Taylor wore, with identifiable garments, brands or accessories?
- **Thresholds:** act now >= 0.8; Haiku 5.5 fallback below 0.8; human review: none (never on the path)
- **Action:** Ensure current_item (worker extract on demand); file a Vault intake issue when significance >= notable; add a social candidate to the inbox; if q_outfit yes, also enqueue merch_outfit.
- **Notification:** T2 public_appearance or T3 award_news when confirmed; nothing for single-source reports.
- **Social:** Candidate for Tree's calendar; no fast path; normal caps.
- **Site:** Live card <= 2 h; Vault moment <= 48 h when notable.
- **SLA:** Site <= 2 h, Vault <= 48 h.

#### Official merch (`merch_official`)
- **Definition:** A new or restocked product on Taylor's official store.
- **Signals:** merch-official-sync diff (deterministic)
- **Jev questions:** `q_merch_kind` (choice): Is this an official store product, a fan-made original design, a likely bootleg reprint of official artwork or photos, or not a product?
- **Thresholds:** act now >= 0.85; Haiku 5.5 fallback below 0.85; human review: none (never on the path)
- **Action:** Code decides from the store sync (Jev not needed); existing store-drop social draft; event T2 official_merch.
- **Notification:** T2 official_merch.
- **Social:** Existing store-drop draft; normal caps.
- **Site:** Merch section via the existing official sync PR (auto-merge).
- **SLA:** App <= 24 h.

#### Fan-made merch (`merch_fan`)
- **Definition:** An original fan-made product (Etsy, Shopify, submissions) that is inspired-by, never a reprint of official art, tour graphics or Taylor photos (ruling D3, decisions.md:3161).
- **Signals:** merch-fanmade candidate issue; Etsy listing; link submission
- **Jev questions:** `q_merch_kind` (choice): Same bank question. | `q_bootleg` (noul): Does this listing appear to reproduce official album artwork, tour graphics, logos or photographs of Taylor Swift?
- **Thresholds:** act now >= 0.8; Haiku 5.5 fallback below 0.8; human review: none (never on the path)
- **Action:** q_bootleg >= 0.3 rejects; else Haiku 5.5 vision D3 check on the listing image, E1 link and E2 image verification, write to supabase/seed/merch/fanmade.mjs via content PR (cap 5 per week).
- **Notification:** T3 fan_merch as a weekly coalesced item only.
- **Social:** Weekly fan-merch roundup candidate.
- **Site:** Merch section after auto-merge.
- **SLA:** App <= 7 days from discovery.

#### Outfit matchable to a photo (`merch_outfit`)
- **Definition:** A public appearance or photo where Taylor wears identifiable garments or accessories we can match to purchasable items.
- **Signals:** q_outfit yes; fashion category moment; appearance-discovery or sighting news with photo
- **Jev questions:** `q_outfit` (noul): Same bank question.
- **Thresholds:** act now >= 0.75; Haiku 5.5 fallback below 0.75; human review: none (never on the path)
- **Action:** Enqueue the moment for E6: Sonnet 5.5 vision descriptors, Awin index, brand-direct, SerpAPI (cap), vision judge, E3 audit gate, E6 step-4 writer opens a content PR with products[] (exact piece plus up to two alternatives).
- **Notification:** None.
- **Social:** Optional 'get the look' candidate once matched.
- **Site:** Moment shop-the-look; affiliate wrapping at render when tags are set.
- **SLA:** Matched <= 7 days; target >= 3 matched pieces per week.

#### Easter egg or theory material (`theory_material`)
- **Definition:** A fan theory or Easter-egg claim about her music, eras, visuals or announcements. Never relationship, private life, sexuality, family or identity theories (hard ban, decisions.md:6590).
- **Signals:** q_theory yes; theory subreddits and flairs; mainstream Easter-egg roundups
- **Jev questions:** `q_theory` (noul): Does the text contain a fan theory or Easter-egg claim about her music, eras, visuals or announcements (not about her private life)? | `q_speculation` (noul): Same bank redline question.
- **Thresholds:** act now >= 0.7; Haiku 5.5 fallback below 0.7; human review: none (never on the path)
- **Action:** Haiku 5.5 extracts the claim in our own words into fan_theory_candidate (theory_key dedupe, mention_count +1); promotion at mention_count >= 2 (was 3); weaving intake for well-sourced ones.
- **Notification:** T3 easter_egg only for promoted theories confirmed by mainstream coverage.
- **Social:** Clowning content candidate for Tree weekly plan.
- **Site:** live_theory (Clownbot board, Clue Web) after promotion; Vault theory record via weaving intake.
- **SLA:** Candidate <= 24 h; promotion weekly.

#### Fan discussion worth joining (`fan_discussion`)
- **Definition:** An active Reddit or Facebook thread where a knowledgeable fan comment adds value.
- **Signals:** thread age < 6 h; comments per hour; score; sub tier; q_discussion >= 4
- **Jev questions:** `q_discussion` (score): Score 1 to 5: how worthwhile is it for a knowledgeable fan to add a comment here? 5 = active, on-topic, open question or debate where a fan can add something; 1 = closed, hostile, off-topic or self-promotion. | `q_injection` (noul): Same bank question.
- **Thresholds:** act now >= 0.7; Haiku 5.5 fallback below 0.7; human review: none (never on the path)
- **Action:** Rank by code (age, velocity, size, sub tier, Jev score); top threads get a drafted reply (Haiku 5.5, Sonnet 5.5 for the top two subs) with thread context and the voice critic; card to Discord with direct link; owner posts by hand.
- **Notification:** None.
- **Social:** Human-posted comment only; caps 15 per day, 4 for r/TaylorSwift and r/swifties, 3 per other sub; quality floor beats quantity.
- **Site:** None.
- **SLA:** Card <= 60 min after the thread is seen, while it is < 6 h old.

#### Rumor or unconfirmed claim (`rumor`)
- **Definition:** A work-related claim reported without confirmation (unnamed sources, single fan account, speculation). Personal-life rumors are privacy_redline, not this class.
- **Signals:** q_settled is unnamed sources or speculation; single_source verification status
- **Jev questions:** `q_settled` (choice): Same bank question.
- **Thresholds:** act now >= 0.8; Haiku 5.5 fallback below 0.8; human review: none (never on the path)
- **Action:** Rumor Desk intake issue (labeled rumor) with reportedBy and source tier; re-check for confirmation every sweep; upgrades to critical or normal when confirmed.
- **Notification:** None.
- **Social:** None.
- **Site:** Rumor tier only through the Rumor Desk with its sourcing rules; never published as fact.
- **SLA:** Rumor Desk <= 48 h; confirmation re-check hourly for 72 h.

#### Correction or debunk (`correction_debunk`)
- **Definition:** New information that contradicts something we already published (live card, push, post or moment).
- **Signals:** q_contradicts against published items with the same story_id or entities; outlet correction notices; official denial
- **Jev questions:** `q_contradicts` (choice): Given our published item '<summary>' and this new text: does the new text CONTRADICT, SUPPORT or say nothing about (UNRELATED) our item?
- **Thresholds:** act now >= 0.8; Haiku 5.5 fallback below 0.8; human review: none (never on the path)
- **Action:** Haiku 5.5 always confirms, then Sonnet 5.5 verifies with sources before any retraction; retraction path hides the card, kills pending pushes, sends a correction push only if the original push went out, deletes or corrects social posts, logs it.
- **Notification:** Correction push only to devices that received the original.
- **Social:** Delete IG/FB media via social-delete-media flow, X delete plus correction post (social lane, Claude only).
- **Site:** current_item status debunked and hidden; Vault correction via Content Shift.
- **SLA:** Retraction <= 30 min after Sonnet confirms.

#### Duplicate (`duplicate`)
- **Definition:** The same event or item we already have (same key, same normalized URL, near-identical title within 72 h, or Jev same-story match).
- **Signals:** item_key exists; url_norm match; title simhash Hamming <= 3 within 72 h; q_same_story match
- **Jev questions:** `q_same_story` (choice): Same bank question.
- **Thresholds:** act now >= 0.85; Haiku 5.5 fallback below 0.85; human review: none (never on the path)
- **Action:** Increment seen_count and source count on the existing story (corroboration can upgrade a story to confirmed). Before discard: harvest comments (Reddit thread comments transiently via the home reader; Facebook counts and our-words summaries only), run q_theory on comment batches, send positives to the theory branch. Then mark duplicate.
- **Notification:** None.
- **Social:** None.
- **Site:** None (corroboration may upgrade verification status).
- **SLA:** Harvest <= 24 h.

#### Noise or off-topic (`noise`)
- **Definition:** Not about Taylor or not useful to fans: spam, unrelated celebrities, generic listicles, self-promotion.
- **Signals:** q_class off_topic_noise; low urgency and low discussion score
- **Jev questions:** `q_class` (choice): Same bank question.
- **Thresholds:** act now >= 0.8; Haiku 5.5 fallback below 0.8; human review: none (never on the path)
- **Action:** Mark noise; keep the watch_item 30 days for dedupe, then delete.
- **Notification:** None.
- **Social:** None.
- **Site:** None.
- **SLA:** Immediate.

#### Privacy redline (`privacy_redline`)
- **Definition:** Speculation about pregnancy, relationship status, health, body, sexuality, family or minors, location tracking, accusations, or private individuals.
- **Signals:** packages/shared redline phrase gates (code, hard); q_speculation; q_personal with q_settled rumor
- **Jev questions:** `q_speculation` (noul): Same bank redline question.
- **Thresholds:** act now >= 0.35; Haiku 5.5 fallback below 0.35; human review: none (never on the path)
- **Action:** Drop: code gates first, then a low Jev bar (>= 0.35) because dropping is the safe direction. Store only the item_key hash so it is never re-evaluated; no text kept.
- **Notification:** None.
- **Social:** None.
- **Site:** None.
- **SLA:** Immediate.


## Token model (estimates until the P0-07 ledger reports)

| Task | From | To | Estimated saving | Notes |
|---|---|---|---|---|
| routine-marjorie-ops (hourly, sonnet-5, 60-90 turns) | Claude OAuth agent every hour, ~600 to 2500 turns/wk | Plain-code precheck + Jev 'needs an agent?' gate; Sonnet 5.5 agent only for flagged items, every 3 h, max 40 turns | ~1100 of ~1200 Sonnet-equivalent turns/wk (90%) | Interim: cadence 3 h and 40 turns in P0-02. |
| routine-vault-run (daily, opus-4-8, 200 turns) | ~750 turns/wk on Opus 4.8 in one session | Two sequential jobs: judgment lanes on claude-opus-5-5, craft lanes on claude-sonnet-5-5; turn caps per job; priority=content | ~575 of ~1875 SET/wk (30%) while output rises | Stays on OAuth; moves to the metered key only if P3-09 shows it still starves. |
| routine-marjorie-ask-response (opus-5) | ~300 turns/wk, 31 of 40 failing on the limit | claude-sonnet-5-5, same budget cap | ~500 of ~750 SET/wk | Failures were the weekly limit, not code. |
| routine-marjorie-status-reply (opus-5) | ~290 turns/wk | Jev classification + templated replies; Sonnet 5.5 only for free-form questions | ~665 of ~725 SET/wk |  |
| routine-marjorie-brief (opus-4-8) | ~295 turns/wk | Retired by #5484 (Hermes Marjorie daily loop); interim claude-sonnet-5-5 | ~737 SET/wk leaves the Swift2 pool | Cost moves to whatever pool Hermes uses (UNVERIFIED). |
| routine-community-answerer (sonnet-5, 80 turns) | ~280 turns/wk agent | Scripted Haiku 5.5 drafter (metered API key, capped) with Jev pre-rank | ~280 SET/wk off OAuth | Metered cost is cents per day (estimate method in plan section D). |
| routine-awareness-answerer (sonnet-5, 30 turns, every 3 h) | ~165 turns/wk agent seeing only titles | Scripted Haiku 5.5 drafter (Sonnet 5.5 for r/TaylorSwift, r/swifties) with thread context | ~165 SET/wk off OAuth | Better replies and fewer tokens. |
| routine-kevin-radar (haiku-4-5) | ~280 turns/wk | Plain code + Jev | ~140 SET/wk |  |
| routine-tree-daily-draft (opus-4-8) | ~180 turns/wk | Retired by #5484 (Hermes Tree) | ~450 SET/wk | Do not duplicate Hermes work. |
| routine-marjorie-triage, routine-marjorie-chat, routine-tree-chat, routine-tree-ask-response | ~395 turns/wk mostly Opus 5 | Retired by #5484; interim claude-sonnet-5-5 | ~762 SET/wk |  |
| routine-news-triage (sonnet-5, daily) | ~145 turns/wk | Tidewatch router files intake issues (code + Jev + Haiku 5.5) | ~145 SET/wk | Retire in P2-09 after the router is live. |
| routine-austin-build (fable-5, daily) | ~145 turns/wk on Fable 5 | Codex worker on joey2023 builds approved tickets; Claude Sonnet 5.5 reviews the PR | ~725 SET/wk off OAuth | Interim: claude-opus-5-5, 3 times a week. |
| routine-kevin-daily-desk (sonnet-5) | ~140 turns/wk | Codex worker for mechanical fixes; code for reports | ~140 SET/wk |  |
| routine-tree-weekly-plan (opus-5) | ~75 turns/wk | claude-sonnet-5-5 plus the new-on-site feed | ~97 SET/wk | Kept by #5484 as the only calendar writer. |
| routine-laura-a11y-walk (sonnet-5) | ~45 turns/wk | Codex worker | ~45 SET/wk |  |
| routine-nils-walk, routine-paul-blart (opus-4-8) | ~63 turns/wk | claude-sonnet-5-5 | ~94 SET/wk |  |
| routine-marjorie-weekly-review (fable-5) | ~40 turns/wk on Fable | claude-opus-5-5 at high effort | ~120 SET/wk | Judgment stays on Opus. |
| routine-tree-event-draft (opus-4-8) | ~25 turns/wk | claude-sonnet-5-5; breaking drafts by a single Sonnet 5.5 call | ~37 SET/wk | Social lane, Claude only. |
| karen-nightly, kevin-s1-karen-solver | ~36 turns/wk | claude-sonnet-5-5 and claude-opus-5-5 | ~9 SET/wk |  |
| News worker extract, theory miner, dedupe gate (claude-haiku-4-5, metered) | Haiku 4.5 at $1/$5 per MTok | claude-haiku-5-5 at $0.10/$0.50 per MTok; Jev pre-filter so Haiku runs only on positives | ~90% of that metered spend per call | Verify tool and thinking parameters on migration. |
| New: Tidewatch classification | n/a (news triage was a daily Sonnet agent) | Jev (~$0.00005 per call) + Haiku 5.5 on the uncertain share + Sonnet 5.5 on critical only | adds ~0 OAuth turns | Prepaid Jev credits; metered key for Haiku/Sonnet. |
| TOTAL routine OAuth estimate | ~4,850 turns/wk = ~8,800 Sonnet-equivalent turns/wk (estimate, turns at 50% of max_turns, Opus weighted 2.5x, Fable 5x, Haiku 4.5 0.5x) | ~3,950 SET/wk after P0/P1 without #5484; ~2,000 SET/wk with #5484 merged | 55% without #5484, 77% with it (estimates) | The turn ledger (P0-07) replaces these estimates with measured numbers within a week. |

## Codex and Claude balance

| Work type | Where | Model | Effort | Why |
|---|---|---|---|---|
| Build and executor work, non-social code (worker, migrations, merch engine, community scripts, ops scripts, home tasks) | Local codex exec on joey2023, dispatched by the PM session into its own worktree under %LOCALAPPDATA%\longlive-wt | gpt-5.6-sol | medium-high (multi-step), spark low for single-file | Largest token bucket; Codex budget is 2x Claude; root rule j-2 tiering. |
| Security- or brand-critical code (fact-check, push safety, credentials on home tasks, Jev key handling) | Local codex exec | gpt-5.6-sol | xhigh for fact-check and push; high for the rest | Genuinely hard and consequential; j-2 reserves xhigh for this. |
| Social lane code and copy (scripts/social/**, social/**, breaking drafts, Tree prompts) | Claude executor agents (Sonnet 5.5) only | claude-sonnet-5-5 | high | Swift2 CLAUDE.md forbids dispatching social work to Codex. |
| Prompt, voice and rubric writing (drafters, critic, taxonomy questions) | Claude executor or PM | claude-sonnet-5-5 (prompts), claude-opus-5-5 (taxonomy, thresholds) | high | Voice and judgment are Claude strengths; small token volume. |
| Review of every Codex diff before the PR opens | Claude reviewer agent | claude-sonnet-5-5 | high | Swift2 rule 3; cross-model review catches different bugs. |
| Adversarial second opinion on risky Claude-built diffs | codex:rescue --background | gpt-5.6-sol | high | Codex is the designated disagreer. |
| Test fixing and debug ladder rung 1 | Local codex exec | gpt-5.3-codex-spark then gpt-5.6-sol | low then medium-high | Root rule j: rung 1 always Codex; scoped test runs, full suite once. |
| Large refactors and hard repro (Awin hang, Facebook lazy href, worker fast mode) | Local codex exec | gpt-5.6-sol | high | Owner: lean into Codex's good models for hard work. |
| Quick lookups and codebase questions | Claude scout or repowise | claude-haiku-5-5 | low | Cheapest; no context bloat for the PM. |
| Planning, calibration, go/no-go, escalations | PM session | claude-opus-5-5 | high | Category-5 judgment only. |
| Runtime ticket building (Austin replacement, kevin desk, laura walk) | Codex worker scheduled task on joey2023 (issues labeled codex:ready) | gpt-5.6-sol (spark for codex:spark label) | medium-high | Moves ~900 SET/wk off the OAuth pool; Actions cannot run Codex today and a self-hosted runner on a public repo is unsafe. |
| Runtime classification and verification | GitHub Actions plain run: steps | jev-1.13.0, then claude-haiku-5-5, then claude-sonnet-5-5 | n/a (Haiku/Sonnet low-medium) | Cheapest correct tier per decision; no Codex at runtime. |
| Target split of build-phase tokens | Whole plan | mix | mix | ~65% of executor tokens on Codex, ~35% on Claude (social lane, prompts, reviews, judgment). |

## Scorecard

| Goal | Metric | Today | 2-week target | 6-week target | Written by |
|---|---|---|---|---|---|
| 1 | Share of critical stories live on site <= 60 min from first public report, with push sent (governor) and social posted; median and p90 minutes per stage from story_timeline | Not measured. No breaking lane. Growth strategy: 1 of 21 time-sensitive events on social within hours. Worker fires every 4.5 to 10 h. | Timestamps recorded for 100% of stories; fast lane in shadow with median detect <= 15 min for primary sources | >= 90% of critical stories on site and pushed <= 60 min; social <= 60 min | scripts/ops/weekly-scorecard.mjs (P3-04) from story_timeline |
| 2 | Recall at 48 h against the weekly reference list; recall at 1 h for critical | Not measured (recall check retired Sep 10). Growth strategy: 12 of 21 events on site within 48 h via the Vault. | Seen store covers every pipeline; first recall dry run | >= 95% at 48 h, 100% critical at 1 h | news-recall.yml (P3-03) |
| 3 | New fan_theory_candidate rows per week, live fan theories promoted per week, seed theory records | Miner found 0 theories in each of the last 3 runs; promote considered 0; about 70 hand-authored seed records | >= 20 candidates a week | >= 50 live fan theories a week | weekly-scorecard.mjs from fan_theory_candidate and live_theory |
| 4 | Share of new items with media on every surface (seed, live feed, social, merch); count of critical items held for missing_image | Seed moments gated in CI (legacy list empty); live feed holds items without an image; other surfaces unaudited | Gap audit committed; official image fallback live | 100% of surfaces gated; 0 critical items held for missing_image | weekly-scorecard.mjs from validate logs and current_item hold reasons |
| 5 | Share of posts citing a moment shipped in the last 7 days; every critical story posted | 0 social PRs merged in the week of Oct 12; poster stuck on one item; nothing feeds Tree what shipped | Poster green; new-on-site feed live | >= 50% of posts cite new content; 100% of critical stories posted | weekly-scorecard.mjs from social/posted and the new-on-site feed |
| 6 | Weekly voice critic mean (1 to 5) on a 20-item sample, next to the owner's optional ratings | No score; deterministic checks only | Critic live on reply drafts and breaking drafts | Mean >= 4.0 and p10 >= 3.0 | voice-sample.yml (P3-05) |
| 7 | Cards delivered with a direct link; comments posted per week in top-ranked threads, by platform | No cards since Oct 12 (answerer hit the limit); Facebook link opens a search; Reddit cards carry no title, age or score | 100% of Reddit cards with title, age and engagement; Facebook permalink on >= 80% | >= 20 comments a week in threads ranked top 10 at delivery (owner capacity permitting) | weekly-scorecard.mjs from engagement_lead and community_post_ledger |
| 8 | Median 24 h score of posted Reddit comments | Not measured | Outcomes reader captures >= 90% of posted comments | Median >= 3 | outcomes-report.mjs (P3-01) |
| 9 | Share of posted comments with >= 1 reply at 7 days, by platform | Reddit replies arrive by Gmail uncounted; Page replies only in Discord; Facebook groups not captured | Measured for Reddit; Facebook via activity log | >= 25% | outcomes-report.mjs (P3-01) |
| 10 | New fan-made items merged into the app per week | 0 since Aug 30 (scheduled discovery ran dry) | >= 3 a week | >= 5 a week | weekly-scorecard.mjs from supabase/seed/merch/fanmade.mjs diffs |
| 11 | New photo-matched products per week, and how many carry a live affiliate link | 0 matched since Aug 31; 94 moment products, 0 wrapped; 0 Awin advertisers joined; no Amazon tag | >= 3 matched a week (direct links) | >= 3 a week with a live affiliate link (needs owner accounts) | weekly-scorecard.mjs from seed diffs and AFFILIATE-COVERAGE.md |

## Item index

| Id | Phase | Title | Owner | Effort | Lane | Deps | Goals |
|---|---|---|---|---|---|---|---|
| P0-01 | P0 | Weekly-limit detection, one named alert and automatic pause | codex | M | L-ROUTINES |  | 1, 2, 3, 4, 6 |
| P0-02 | P0 | Emergency model and cadence cuts plus all P0 clock-table edits | executor-claude-sonnet | S | L-ROUTINES | P0-01 | 1, 2, 3, 4, 6 |
| P0-03 | P0 | Make draft-happy-path.test.ts hermetic and fix the CI paths filter | executor-claude-sonnet | S | L-SOCIAL |  | 5 |
| P0-04 | P0 | Unstick the 10-11 Instagram/X pair, reconcile the ledger, close the stale state PRs | executor-claude-sonnet | S | L-SOCIAL | P0-03 | 5 |
| P0-05 | P0 | One rolling state PR and failure metadata for the poster | executor-claude-sonnet | S | L-SOCIAL | P0-04 | 5 |
| P0-06 | P0 | Verify the X 403 claim (read-only) | executor-claude-sonnet | S | L-READONLY |  | 5 |
| P0-07 | P0 | Measurement baseline: turn ledger, metered usage, clock fire rate | codex | M | L-OBS |  | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 |
| P0-08 | P0 | Interim Facebook card link and mailer parity | codex | S | L-COMMUNITY |  | 7 |
| P0-09 | P0 | Repair merch-awin-sync (hang, lost cache, churn PRs) | codex | M | L-MERCH |  | 10, 11 |
| P0-10 | P0 | Fan-made discovery: scheduled runs actually file candidates | codex | S | L-MERCH-FAN |  | 10 |
| P0-11 | P0 | Push safety before any automatic push | codex | M | L-NOTIFY |  | 1 |
| P0-12 | P0 | Worker Haiku 4.5 to Haiku 5.5 | codex | S | L-WORKER |  | 1, 2, 3 |
| P0-13 | P0 | Owner decision session (D1 to D9) | OWNER DECISION | S | L-OWNER |  | 1, 3, 5, 7, 8, 9, 10, 11 |
| P0-14 | P0 | Record decisions and draft the ruling PRs | claude-opus | S | L-DOCS | P0-13 | 1, 5, 7, 10, 11 |
| P0-15 | P0 | Jev key into a GitHub Actions secret | OWNER ACTION | S | L-OWNER |  | 1, 2, 3, 7, 10 |
| P0-16 | P0 | Hermes session: confirm Tree and Marjorie loops, decide #5484 go-live | hermes-session | S | L-HERMES |  | 5 |
| P0-17 | P0 | Dashboard corrections and the Plan and Tracking tabs | executor-claude-sonnet | M | L-DASH |  | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 |
| P0-18 | P0 | Anthropic Console monthly spend cap for the metered key | OWNER ACTION | S | L-OWNER | P0-13 | 1, 2, 3, 6, 7 |
| P1-01 | P1 | Jev client library | codex | M | L-JEV | P0-15 | 1, 2, 3, 7, 10 |
| P1-02 | P1 | Seen store, decision ledger and story timeline tables | codex | M | L-DB | P0-14 | 1, 2, 3 |
| P1-03 | P1 | Taxonomy, question bank and thresholds config | claude-opus | S | L-TIDE-SPEC | P0-14 | 1, 2, 3, 7, 10, 11 |
| P1-04 | P1 | Replay set and labels for calibration | executor-claude-sonnet | M | L-TIDE-EVAL | P1-03 | 1, 2, 3, 7 |
| P1-05 | P1 | Tidewatch collector (pull adapters over existing stores) | codex | L | L-TIDE | P1-02 | 1, 2, 3, 5, 7, 10, 11 |
| P1-06 | P1 | Tidewatch classifier in shadow mode | codex | L | L-TIDE | P1-01, P1-03, P1-05, P1-09 | 1, 2, 3, 7, 10, 11 |
| P1-07 | P1 | tidewatch.yml on the home clock with a freeze switch | codex | S | L-OPS | P1-06, P0-02, P0-07 | 1, 2 |
| P1-08 | P1 | Worker primary-source fast mode and official source list | codex | M | L-WORKER | P0-12, P0-14 | 1, 2 |
| P1-09 | P1 | Shared direct-call Claude wrapper with caps and caching | codex | M | L-LLM | P1-01 | 1, 3, 6, 7 |
| P1-10 | P1 | Answerers become scripted drafters with thread context | executor-claude-sonnet | M | L-COMMUNITY | P1-09, P1-01 | 6, 7, 8, 9 |
| P1-11 | P1 | marjorie-ops becomes code plus a Jev gate | codex | M | L-ROUTINES | P1-01, P0-02 | 1, 2, 3, 4, 6 |
| P1-12 | P1 | marjorie-status-reply and kevin-radar to Jev plus code | codex | M | L-ROUTINES-B | P1-01 | 2, 4 |
| P1-13 | P1 | Codex worker on joey2023 and Austin retirement | codex | L | L-HOME-CODEX | P0-14 | 2, 4, 6 |
| P1-14 | P1 | Community engagement columns and outcome table | codex | S | L-DB | P1-02 | 7, 8, 9 |
| P1-15 | P1 | Home Reddit reader on joey2023 | codex | L | L-HOME-REDDIT | P1-14, P0-14 | 3, 7, 8, 9 |
| P1-16 | P1 | Facebook export: permalinks, engagement counts, activity log, daily cadence | codex | L | L-FBEXT | P0-14, P1-14 | 7, 9 |
| P1-17 | P1 | Better Reddit and Facebook cards | executor-claude-sonnet | S | L-COMMUNITY | P1-10, P1-15 | 7 |
| P1-18 | P1 | Vault Run split into judgment and craft jobs with yield records | executor-claude-sonnet | M | L-VAULT | P0-01, P0-02 | 3, 4, 6 |
| P1-19 | P1 | Merch E6 for real: matcher, step-4 writer, E3 gate, schedule | codex | L | L-MERCH | P0-09, P0-14, P1-09 | 11 |
| P1-20 | P1 | Fan-made merch auto-curation lane | codex | M | L-MERCH-FAN | P0-10, P1-01, P1-09 | 10 |
| P1-21 | P1 | Theory yield: full threads, skip mined bundles, cheaper miner, promote at 2 | codex | M | L-THEORY | P1-15, P1-01 | 3 |
| P1-22 | P1 | New-on-site feed for social | executor-claude-sonnet | S | L-SOCIAL | P0-05 | 5 |
| P1-23 | P1 | Media gate gap audit and fixes | codex | M | L-MEDIA |  | 4, 1 |
| P1-24 | P1 | Voice critic module and exemplar corpus | executor-claude-sonnet | M | L-VOICE | P1-09 | 6 |
| P1-25 | P1 | Hermes session: Tree reads the new-on-site feed and breaking flag | hermes-session | S | L-HERMES | P1-22, P0-16 | 5, 1 |
| P1-26 | P1 | Owner home-machine setup (one sitting) | OWNER ACTION | S | L-OWNER | P1-13, P1-15, P1-16 | 3, 7, 8, 9 |
| P1-27 | P1 | Owner affiliate accounts (whenever ready, blocks nothing) | OWNER ACTION | S | L-OWNER |  | 11 |
| P2-01 | P2 | Shadow calibration review and per-class go/no-go | claude-opus | S | L-TIDE-SPEC | P1-06, P1-04, P1-07 | 1, 2, 3, 7, 10, 11 |
| P2-02 | P2 | Action router | codex | L | L-TIDE | P1-06 | 1, 2, 3, 5, 7, 10, 11 |
| P2-03 | P2 | Fact-check module in code | codex | L | L-FACT | P1-01, P1-08, P1-09 | 1 |
| P2-04 | P2 | Breaking path to the site with on-demand revalidation | codex | M | L-WEB | P2-03, P0-11, P1-23 | 1 |
| P2-05 | P2 | Breaking and Baby Watch push categories | executor-claude-sonnet | M | L-NOTIFY | P0-11, P0-14 | 1 |
| P2-06 | P2 | Breaking social fast path | executor-claude-sonnet | M | L-SOCIAL | P0-14, P1-24, P2-03, P0-05 | 1, 5 |
| P2-07 | P2 | Retraction path: site and push | codex | M | L-FACT | P0-11 | 1 |
| P2-08 | P2 | Retraction path: social | executor-claude-sonnet | M | L-SOCIAL | P2-07, P2-06 | 1, 5 |
| P2-09 | P2 | Normal flow wiring and news-triage retirement | executor-claude-sonnet | M | L-SOCIAL | P2-02 | 1, 2, 5 |
| P2-10 | P2 | Duplicate harvest into theory signals | codex | M | L-THEORY | P2-02, P1-21 | 3 |
| P2-11 | P2 | Merch branch wiring | codex | S | L-MERCH | P2-02, P1-19, P1-20 | 10, 11 |
| P2-12 | P2 | Breaking and retraction drill | claude-opus | M | L-TIDE-SPEC | P2-03, P2-04, P2-05, P2-06, P2-07 | 1 |
| P2-13 | P2 | Staged go-live by class | claude-opus | M | L-TIDE-SPEC | P2-01, P2-02, P2-12 | 1, 2, 3, 5, 7, 10, 11 |
| P2-14 | P2 | Owner merges the guardrails and spec PR | OWNER ACTION | S | L-OWNER | P0-14 | 1, 5 |
| P3-01 | P3 | Outcomes reader live with automatic comment capture | codex | M | L-HOME-REDDIT | P1-15, P1-14 | 8, 9 |
| P3-02 | P3 | Thread ranking v2 from outcomes | executor-claude-sonnet | M | L-COMMUNITY | P3-01 | 7, 8, 9 |
| P3-03 | P3 | Weekly recall audit | codex | M | L-RECALL | P1-05, P1-06 | 2 |
| P3-04 | P3 | Weekly scorecard collector | codex | M | L-OBS | P0-07, P1-02, P3-01 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 |
| P3-05 | P3 | Voice weekly sample and owner rating loop | executor-claude-sonnet | S | L-VOICE | P1-24 | 6 |
| P3-06 | P3 | Drift monitor and Jev 1.14 evaluation | codex | S | L-TIDE | P2-13 | 1, 2, 3 |
| P3-07 | P3 | Raise caps where quality holds | claude-opus | S | L-VAULT | P3-04 | 3, 4, 10, 11 |
| P3-08 | P3 | GitHub Reddit scan to automatic fallback only | codex | S | L-COMMUNITY | P1-15 | 7 |
| P3-09 | P3 | Funding pool review | claude-opus | S | L-DOCS | P3-04 | 3, 4, 6 |
