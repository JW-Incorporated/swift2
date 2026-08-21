# Proposal — Chatbots architecture: Clownbot + Mood→Song

> **⚠️ 2026-08-11 — the Clownbot half of this document is SUPERSEDED.** Joey
> directed a full re-spec: `docs/proposals/2026-08-11-clownbot.md` replaces the
> news-pipeline-fed, pre-generated-takes design below (§2 and everything
> Clownbot-specific in §6–§7). Do not build from this document's Clownbot
> sections. The Mood→Song half shipped as Mood Chat
> (`docs/proposals/2026-07-19-mood-chat.md`) and its history here stands.

Owner: Wyatt (CTO). Status: **PROPOSAL — pending Wyatt (architecture, cost
caps) and Joey (product questions in §7)**. Date: 2026-07-07.

> **Scope guard.** v1 is Vault-only (`docs/decisions.md`, 2026-07-03). This is
> **post-v1 groundwork**: two bot designs solid enough to stop re-litigating,
> plus the one low-obsolescence code piece that survives any product decision
> (§5). Nothing here is scheduled, nothing touches the Vault runtime path, and
> Clownbot is explicitly **blocked** on the News pipeline (§4.1) and on the
> decision gate GitHub issue #36 demands.

The two bots:

1. **Clownbot** — a persona loaded with the latest rumors/gossip that ideates
   Easter-egg readings and predicted "next drops." (Issue #36; "clowning" is
   fan slang for knowingly over-speculating — the self-awareness is the brand.)
2. **Mood→Song** — the user describes a feeling (or taps a starter prompt) and
   gets the top Taylor songs matching that mood.

---

## 1. The central tension — interactive bots vs. "no request-path LLM"

`docs/architecture.md` (AI-integration) and `CLAUDE.md` (runtime cost) are
categorical: any product LLM call is **worker-side, hard-capped, with a
rule-based fallback — never in a synchronous user-request path**. A chatbot is
the *maximally* per-user, request-path-shaped feature. We do not hand-wave
this; we resolve it the same way for both bots:

**A "chatbot" is a UI shape, not an architecture.** Neither bot is an
open-ended generative chat. Each is a chat-styled surface over a
deterministic retrieval core, where any LLM work happens **before** the user
arrives (worker-side pre-generation / offline lexicon-building), never
because the user arrived.

| Discipline | Mood→Song | Clownbot |
|---|---|---|
| Rule-based/retrieval core | Authored mood taxonomy + weighted mood↔song tags; pure deterministic matcher (built, §5) | Retrieval over a pool of pre-generated, source-linked "takes" |
| Where the LLM sits | **Nowhere in v1 of the bot** (see §3.4). Optional *offline* lexicon miner later | Scheduled worker only: pre-generates takes from news+vault inputs after each pipeline cycle |
| Pre-gen / caching | Taxonomy+tags payload is static, versioned, CDN-cached (Vault-style) | Takes are rows; feed reads are plain DB/CDN reads with short TTL |
| Hard caps, durable counter | n/a in v1 (zero LLM calls). Any future call goes through the news pipeline's capped-client + `news_llm_usage`-pattern durable counter | Global daily generation cap (durable counter, same pattern — see news proposal §6); per-run cap; per-topic cap |
| Per-user + global rate limits | Standard API rate limiting only (no expensive path exists) | Standard API rate limiting on reads; **no user action can trigger generation**, so there is no per-user LLM budget to police |
| Cheap classification vs. open-ended generation | Classification only, and even that is lexicon-based, not LLM | Bounded generation (≤400 output tokens/take), worker-side, from *sourced* inputs only |
| Strict fallback | Starter chips always work; free text that matches nothing falls back to chips | Cap hit ⇒ no new takes; the board serves the existing pool ("no new clownery today") — degraded freshness, full availability |

Net effect: the user-request path for both bots contains **zero LLM calls**,
which is not a workaround of the standing rule — it *is* the standing rule.

## 2. Clownbot — a serving/ideation layer over News + Vault

> **⛔ BLOCKED.** Clownbot's rumor corpus is the News pipeline's output
> (`docs/proposals/2026-07-07-news-pipeline-architecture.md`, branch
> `docs/news-architecture` — not yet merged). Nothing Clownbot-specific is
> buildable before (a) that pipeline exists and runs, (b) v1 ships, and
> (c) issue #36's demanded `docs/decisions.md` entry is approved. This section
> is the design artifact issue #36 asks for, scoped to the *bot/ideation*
> layer; the full community theory board (accounts, submissions, novelty
> scoring, cross-user notifications) remains NOT recommended, unchanged from
> `docs/marketing/feature-brief-2026-07-04.md` candidate 4.

### 2.1 Sources — read-only consumer of two existing worlds

Clownbot owns **no ingestion**. Its corpus is:

- **News world (volatile):** `news_story` rows, *including and especially* the
  rumor tier — `verification_status ∈ {rumor, single_source}` — plus
  `corroborated/official` stories as grounding context. The news pipeline's
  verify stage is what makes a gossip bot survivable: every rumor Clownbot
  touches arrives **already labeled** with a verification status and a
  source-receipt trail (`news_story_source`). Clownbot never sees raw
  unattributed social content.
- **Vault world (curated):** `track_note` rows and `month_item`/`moment`
  history — the Easter-egg/lore substrate for ideation ("the last three times
  she wore X before announcing Y…").

Two-worlds discipline holds: Clownbot **reads** both worlds but writes to
neither; its own tables are a third, clearly-prefixed group (`bot_`), with no
FKs into either world (references are by slug/id-value + denormalized
receipts, so a purged news story can't dangle a constraint). The Vault's
static payload and budget gate never see bot rows.

### 2.2 Where the LLM sits — pre-generation in the worker, nothing else

A **Clownbot generation stage** runs as an additional one-shot step after the
news pipeline cycle (same GitHub-Actions-cron worker process, same cost
module):

1. Select input candidates: new-since-last-run rumor/single_source stories
   plus a small rotation of corroborated stories and thematically-linked
   vault items (deterministic selection — recency × importance; no LLM).
2. For each candidate bundle (capped), one LLM call generates a **take**: a
   short speculation card — a reading, a connection, or a predicted next drop
   — with a required structured output: `{ take_text ≤ 500 chars,
   kind: easter_egg | next_drop | connection, cited_story_ids[],
   cited_vault_refs[], confidence: 'clowning' }`. `confidence` is
   deliberately a single fixed value: the bot is *never* allowed to express
   certainty. Calls go through the single capped client (news proposal §6):
   durable daily counter, in-process floor, one retry, every call counted.
3. Post-generation **rule-based gate** (deterministic, non-LLM, runs on every
   take before insert — this is the safety authority, not the model):
   - every `cited_story_id` must exist and carry a verification status; a
     take citing nothing is dropped;
   - topic blocklist (§2.5) — regex/keyword screen; any hit drops the take
     and logs it;
   - length/format checks (DB CHECKs as backstop, same pattern as the Vault).
4. Insert into `bot_take` (append-only, `is_published` default per Joey's
   moderation decision, §7). Cap hit mid-run ⇒ remaining candidates skipped,
   logged; the pool simply doesn't grow that day.

**No other LLM call exists in the feature.** The "chat" is theater over
retrieval (§2.4).

### 2.3 Cost + latency model (decision-log entry required before build — draft in §6)

- **Generation:** Haiku-class model, ≤ **30 calls/day** hard cap (durable
  counter), ~1k input + ≤400 output tokens/call. Worst case ≈ **$0.05–0.10/day,
  < $3/month**; typical days (5–15 new rumor-class stories) well under half
  the cap. Cap numbers are Wyatt's to ratify (§7).
- **Serving:** RLS public-read table reads (or a short-TTL cached route),
  ~50–150 ms — News-world serving characteristics, not Vault-static, because
  freshness is the point. **Zero marginal cost per user interaction.**
- **Latency as felt by the user:** feed load < 200 ms; "clown harder" (next
  take) is another row read. A brief typed-out animation can fake bot
  "thinking" for persona; the data is already there.

### 2.4 Serving shape + UX sketch

A **Clownery board** wearing a chat costume:

- Persona header: 🤡 avatar, UNOFFICIAL badge, and a standing disclaimer in
  the bot's own voice ("I am a clown. This is speculation for fun, not news.
  Receipts attached, grains of salt required.").
- Bot "messages" = takes from the pool, newest/most-relevant first. Each
  take card shows: the take, `speculation` label, its **receipts** (linked
  source stories with their verification badges from the news pipeline, and
  linked vault items), and generation date.
- User inputs are **buttons, not free text**, in the first version: "clown
  harder" (next take), "show receipts", "takes about {category}" (a
  deterministic filter), "how sure are you?" (canned persona reply: never
  sure). No text box ⇒ no prompt-injection surface, no per-user generation
  pressure, no moderation of user inputs.
- Explicitly **out**: theory submission, novelty scoring, per-user memory,
  notifications — the issue-#36 full board, which stays not-recommended.

### 2.5 Content-safety / legal guardrails (⚠️ read this section twice)

**This is the highest-legal-risk surface in the product.** A bot that
generates speculation about a real, famously litigation-capable person — on
an app already branding itself UNOFFICIAL — needs hard rules, not vibes:

1. **Speculation is labeled, always, and never asserted** — `vision.md`'s own
   line for fake stories ("presents the fake stories but ensures the fans
   know they are fake") applied to generated content. Every take renders with
   the speculation label and receipts; there is no UI state that shows a take
   without them. `confidence: 'clowning'` is schema-enforced.
2. **Topic blocklist (hard, rule-based, pre-insert):** no takes about health,
   pregnancy, sexuality, family/minors, legal wrongdoing, finances-as-scandal,
   or **any named private individual**. Relationship content only when the
   *input story* is at least `corroborated` — the bot may clown about a
   confirmed relationship's Easter eggs, never about whether a rumored one
   exists. Predicted "next drops" (albums, variants, tour legs, MVs) are the
   sweet spot: business/art speculation, near-zero defamation exposure.
3. **No fabricated facts:** the model receives only sourced inputs and must
   cite them; takes citing nothing are dropped by the deterministic gate. The
   bot invents *readings*, never *events*. (No fabrication, ever — the
   standing content rule.)
4. **Human kill switches:** per-take unpublish, whole-bot `is_enabled` flag,
   and (Joey's call, §7) an approve-before-publish moderation queue for at
   least the first weeks.
5. **Prior-art sensitivity:** AI content *about* Taylor is already a live
   public sore point (her camp was publicly accused of undisclosed AI use —
   see `docs/marketing/feature-brief-2026-07-04.md` §3). The UNOFFICIAL
   framing, the clown self-deprecation, and visible receipts are the
   mitigation *and* the brand. If Joey wants a defamation-counsel read before
   launch, this is the feature to spend it on.

### 2.6 Dependency chain, restated

News pipeline built + running → verification statuses exist → v1 shipped →
issue #36 decision entry approved (§6 draft) → Clownbot generation stage +
board. Nothing earlier is buildable without inventing the corpus.

## 3. Mood→Song — and why it largely ships without an LLM

### 3.1 The cheapest, fastest win in the bot roadmap

The insight that makes this bot nearly free: **the mood↔song mapping over a
~250-song catalog is editorial data, not intelligence.** "Which songs fit
'crying at 2am'" has a stable, curatable answer that a fan (Joey) can author
better than a model can improvise — and authoring it once is cheaper than
paying a model to re-derive it per request, forever. The only place free-text
understanding appears is mapping the *user's words* onto a **closed set of
~10–25 moods** — a classification problem so small an authored synonym
lexicon covers the huge head of real inputs ("sad", "heartbroken", "getting
ready", "missing the old days"). Everything else is arithmetic.

So the v1 bot is: **authored taxonomy + authored weighted tags + pure
deterministic matcher + starter chips.** LLM calls: zero. This is not a
degraded stopgap; for this feature the deterministic version is plausibly the
*better* product (instant, explainable — "because you said *crying* →
**Crying at 2am**" — and never hallucinates a song that doesn't exist).

### 3.2 Sources + data model

- **Song catalog:** the `track_note` world (2026-07-04 decision) — era slug +
  track title is already the song identity, and the track guide gives every
  result a tap-through destination. Mood coverage can piggyback on the
  already-scheduled full-catalog track authoring.
- **Mood taxonomy** (`Mood { slug, label, prompt, keywords[] }`): authored by
  Joey (CONTENT track) — it's editorial voice, exactly like era themes. The
  engine provides the types, validators, and matcher (built, §5).
- **Mood↔song tags** (`SongMoodTag { eraSlug, trackTitle, moodSlug,
  weight 1–3 }`): authored as seed data alongside track notes.
- **World placement:** this is **Vault-world data** — curated, repo-authored,
  static between deploys, CDN-cached. Two candidate physical homes, Wyatt's
  call when scheduled: (a) new tables (`mood`, `track_mood`) + a static
  `GET /vault/moods` payload endpoint like the track guide; (b) a repo-built
  static JSON artifact shipped with the app. Either way it is **off the
  Tier-0 payload** (own endpoint/asset, like track guides) so the budget gate
  is untouched. Estimated payload: 25 moods + ~600 tags ≈ **15–40 KB gz** —
  small enough to load once and match entirely client-side.

### 3.3 Serving shape + UX sketch

- Bot bubble: "How are you feeling right now?" + starter-prompt chips
  straight from the taxonomy (`mood.prompt`): *"I'm crying at 2am and want to
  feel understood"*, *"I'm feeling myself and nothing can stop me"*, …
- User taps chips **or** types free text. Free text runs the lexicon matcher
  **on-device** (<1 ms); no network round-trip at all after the initial
  payload load.
- Reply: top 3–5 song cards — era-themed (reusing `EraTheme`), each with a
  "because you said *X*" line from `matchedKeywords`/`moodSlugs`, and a tap
  into the era's track guide note. Refinements are chips again ("more like
  this", "different mood").
- **Fallback (strict, rule-based, total):** text that matches nothing gets a
  friendly "help me out — closest of these?" + chips. The chip path *is* the
  primary design, not an apology; there is no failure mode that leaves the
  user without an answer.

### 3.4 Where an LLM could sit — three options, one recommended

The only LLM-shaped gap: free text the lexicon misses ("empty apartment
energy"). Options:

- **(a) No LLM at all** — miss ⇒ chips. **Recommended for the bot's v1.**
  Cost $0, latency ~0, zero policy exceptions.
- **(b) Offline lexicon miner** — log unmatched queries (anonymized text
  only, no user id), and a capped **worker-side** job periodically clusters
  them and *proposes* new keywords/moods as a PR for Joey's review. The LLM
  improves the deterministic path instead of replacing it; fully inside the
  standing rule (worker-side, capped, offline). **Recommended as the follow-up
  once real misses accumulate.**
- **(c) Request-path capped classification** — a Haiku-class call mapping
  text → mood slugs (≤200 in / ≤20 out tokens ≈ $0.0004/call; global 500/day
  ≈ ≤$0.20/day; per-user 5/day; 2 s timeout ⇒ chip fallback; global cache on
  normalized text, which hits often because mood phrasing repeats).
  Technically tame — **but it violates the letter of the no-request-path-LLM
  rule**, and per `docs/cto-role.md` that boundary is non-negotiable in daily
  work. So (c) is not proposed; it's documented so the decision is conscious.
  If (a)+(b) measurably fail (high miss rate that mining can't close), Wyatt
  can amend the standing rule with a narrow "bounded closed-set
  classification" carve-out via a new decision entry. Until then: no.

### 3.5 Cost + latency model (draft decision entry in §6)

| | Mood→Song v1 (recommended) | Clownbot |
|---|---|---|
| LLM calls in user path | 0 | 0 |
| LLM calls elsewhere | 0 (option b later: ≤1 batch job/week, ≤20 calls) | ≤30/day, worker-side, durable-counter cap |
| Worst-case LLM $/month | **$0** (b: <$1) | **<$3** |
| Marginal cost per user interaction | $0 | $0 |
| Interaction latency | <1 ms (on-device match over cached ~15–40 KB payload) | 50–150 ms (DB/cached read) |
| Availability when LLM is down/capped | 100% — LLM isn't in the loop | 100% for serving; pool freshness degrades |
| New infra | none (Vault-style static payload) | none beyond the news worker it rides on |

## 4. Dependencies and ordering

1. **Mood→Song** depends on: the `track_note` catalog getting authored
   (already-scheduled CONTENT work), Joey authoring a taxonomy + tags, and a
   small serving/view build. **No news pipeline, no accounts, no
   notifications, no LLM.** It is v1-adjacent in spirit — pure Vault-world —
   though still post-v1 by the scope decision.
2. **Clownbot** depends on: news pipeline built and running (branch
   `docs/news-architecture` proposal — not merged), v1 shipped, issue #36
   decision entry, and Joey's moderation-model call. **Blocked. Do not start.**

**Recommendation on "which bot first": Mood→Song** — zero dependencies
beyond content already planned, zero runtime cost, lowest legal risk, and it
directly deepens the Vault (the v1 product) rather than opening a second
front. Joey confirms (§7).

## 5. Safe to start now vs. wait

**Safe now (ranked by confidence it survives any product decision):**

1. ✅ **This proposal** — the design is the de-risking.
2. ✅ **`packages/shared/src/mood/` — built with this proposal.** Portable,
   zero-I/O mood domain: `Mood`/`MoodTaxonomy`/`SongMoodTag` types, the pure
   deterministic matcher (`normalizeMoodText`, `matchMoodsFromText`,
   `moodMatchesFromSlugs`, `rankSongsForMoods`), authoring validators
   (future CI gate, `validate:content`-style), and a clearly-labeled
   **strawman** taxonomy/mapping as typed fixture + authoring example
   (version 0; Joey owns the real one). 20 tests. Exposed **only** via the
   `@swift2/shared/mood` subpath — not the root barrel — mirroring the news
   branch's `./news` pattern; **nothing imports it**; the Vault surface is
   untouched. Rationale for "safe": any conceivable Mood→Song product needs
   exactly this matching math; it bakes in no schema, no serving choice, no
   taxonomy content; and it's off every runtime path.
3. **Mood payload table-vs-static-JSON choice (§3.2)** — documented,
   deliberately **not** decided or migrated; cheap to write, expensive to
   reverse once seeded. Waits for scheduling + Wyatt.
4. *(borderline — deferred)* Mood seed-file format + `db:seed:moods` runner:
   real but pointless before Joey ratifies a taxonomy shape, and it would
   pre-empt his CONTENT-track authoring conventions.

**Must wait:**

- Joey's actual taxonomy + tags (CONTENT track; the strawman is a prop).
- Any Mood→Song UI/serving build (post-v1 by scope decision; small).
- **Everything Clownbot** — blocked per §4.2 / issue #36. Including its
  tables, the generation stage, prompts, and the board UI.
- The unmatched-query miner (option b) — needs real miss data to exist.
- Any request-path LLM anything (option c) — requires a rule amendment,
  Wyatt-only.

## 6. Draft `docs/decisions.md` entries

Drafted into `docs/decisions.md` with this proposal, both flagged
**pending Wyatt/Joey** — see the two 2026-07-07 entries there (Mood→Song
deterministic core; Clownbot pre-gen posture + block). Per `CLAUDE.md`, each
bot's cost model must be an approved decision-log entry **before** it ships;
the drafts carry the §3.5 table as that model.

## 7. Open questions for the founders

**Joey (product):**

1. **Mood taxonomy:** does the strawman's shape feel right (slug, label,
   first-person starter prompt, synonym keywords)? How many moods (10? 25?)
   and in whose voice? You own the real list — the strawman is a prop to
   react to, not a draft to approve.
2. **Rumors: hide vs. label** (same question the news proposal asks — §5.3
   there). Clownbot only exists in the "label" world; if you choose "hide,"
   Clownbot as pitched is off the table. Confirm the labeled-speculation
   posture is brand-acceptable for UNOFFICIAL.
3. **Which bot first?** Recommendation: Mood→Song (§4). Confirm or overrule.
4. **Clownbot moderation:** approve-before-publish queue (you review each
   take, ~1–2 min/day at the proposed cap) vs. auto-publish + kill switch?
   Recommendation: queue first, relax later.
5. **Clownbot topic lines:** the §2.5 blocklist bans relationship-existence
   speculation outright. Comfortable, or too strict for the fun?

**Wyatt (architecture / cost):**

1. **Ratify the LLM-vs-rule boundary as proposed:** zero request-path LLM
   for both bots; option (c) request-path classification stays banned unless
   you amend the rule by decision entry.
2. **Cost caps:** Clownbot ≤30 generation calls/day (Haiku-class, ≤400 out
   tokens) on the news pipeline's durable-counter pattern — right numbers?
   One shared daily counter with the news pipeline or a per-feature cap?
   (Recommend per-feature rows in the same table, so one feature can't
   starve another.)
3. **Mood data home:** tables + static endpoint vs. repo-built JSON asset
   (§3.2) — when Mood→Song is scheduled.
4. **Sign off** on `bot_`-prefixed third table group with no cross-world FKs
   (§2.1) when Clownbot is scheduled.

## 8. Obsolescence honesty

What could invalidate this doc: if Joey chooses "hide" over "label" for
unverified stories, Clownbot dies (the Mood→Song half is unaffected); if the
news pipeline proposal changes shape materially, §2 re-bases on whatever
replaces it; if Joey wants Mood→Song to be a *conversational* companion
rather than a matcher, the LLM question reopens (the taxonomy/matcher still
underpins retrieval). The pieces effectively certain regardless: a mood
taxonomy with weighted song tags and a deterministic matcher (built), the
no-request-path-LLM discipline (standing rule), and speculation-always-
labeled (vision + standing content rule). Everything else is documented,
cheap to revise, and intentionally unbuilt.
