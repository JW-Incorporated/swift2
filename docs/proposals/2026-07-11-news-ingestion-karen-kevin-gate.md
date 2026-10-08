# Proposal — News ingestion + the Karen-review / Kevin-publish gate

Owner: Wyatt (CTO). Status: **PROPOSAL — pending Wyatt (architecture) + Joey
(product §11)**. Date: 2026-07-11.

**Extends, does not replace,** `docs/proposals/2026-07-07-news-pipeline-architecture.md`
(merged in PR #63). That doc designed ingest → cluster → classify → verify →
serve and shipped the portable dedup core (`packages/shared/src/news/`). It
stops at "stores → serve." **This doc designs the missing half: how an ingested
candidate becomes something we are willing to show — with Karen as the review
gate and Kevin as the publisher, reusing the exact quality ecosystem we built
this week.** It also reviews the §4 schema against what we've since learned and
proposes the concrete additions that review/publish requires.

> **Scope guard unchanged.** Still post-v1. Still two-worlds-isolated (no
> `news_*`↔Vault FKs). Nothing here is scheduled until v1 ships and Joey specs
> the product. This is design + a small, safe, product-decision-free starter
> (§10).

---

## 0. What changed since 2026-07-07 (the learnings this must encode)

The §63 proposal was written before a week of operating the Karen/Kevin
ecosystem live. Six concrete lessons now have to be first-class in the news
design, not afterthoughts:

1. **Fabrication is the default failure of AI content, not the exception.**
   Orbit's ingest *code* was sound; its *content* was invented. The classify
   stage rewrites a "neutral headline" and a summary — that is itself a
   fabrication surface (a rewrite can assert what no source said). Every
   generated string must be **diffable against its sources** and gated on that,
   or it doesn't publish.
2. **Verify-first images are non-negotiable.** We enforce, for Vault images,
   HTTP 200 + `Content-Type: image/*` **and** a vision-confirm that the image
   matches its caption before any URL is written. A news `top_image_url` is the
   same risk class and needs the same gate before publish — not at ingest.
3. **Editorial voice is a checkable property.** #461 ("the site calls her
   'Swift' more than 'Taylor' — no fan talks like this") proved a machine can
   flag voice drift. A machine-rewritten news headline is exactly where that
   drift enters; the voice lexicon must gate news copy.
4. **Two sessions/workers collide on the same unit of work.** #454 vs #452:
   two agents built the same "safe to start now" slice hours apart. A pipeline
   that processes stories from a shared table **will** double-process without
   an explicit claim/lease. Idempotency and single-ownership are load-bearing.
5. **Karen is read-only and files findings; Kevin acts. That split is the
   whole safety model** and must survive verbatim into news. Karen never
   publishes; Kevin never reviews his own work into existence.
6. **Publish authority is earned per class, gated by a human + a deterministic
   check** (#472, Joey 2026-07-11; Wyatt to co-sign). "Kevin publishes news to
   the site" is precisely the autonomous-write class #472 governs, so the
   publish gate below is built to that contract from line one — human-gated
   first, autonomy earned class-by-class, never assumed.

Joey's 2026-07-11 clarification (#464) also reshaped the destination question:
recent real events are **Vault-eligible**, distilled to short sourced Vault
moments — *not* full articles. So "publish" has two possible targets, and the
architecture has to name which (see §7).

---

## 1. The core idea (your framing, made concrete)

> Ingest news → **Karen reviews each candidate** → **Kevin publishes** once every
> blocking finding is resolved.

This maps the news pipeline onto the same trust machine we already run:

| Vault today | News (proposed) |
|---|---|
| Karen scans `supabase/seed/**`, files `cie` findings, **never edits** | Karen scans each `news_story` **candidate**, files findings, never edits |
| Kevin fixes findings on a PR, **never merges** | Kevin resolves findings + **publishes** (flips lifecycle state), never without the gate |
| A human merges | A human approves the class (then, once earned, Kevin auto-publishes that class) |

The pipeline's §63 "verify/credibility" stage (truth-status: is it real?) and
this **review stage** (quality-status: is it accurate, sourced, on-voice,
image-safe, publishable?) are **different axes** and both are required. A story
can be `corroborated` (truth) and still fail review (bad rewrite, dead image,
off-voice) — so they are separate columns and separate gates (§4).

---

## 2. Lifecycle state machine (the spine)

Every `news_story` moves through an explicit **publish lifecycle**, stored
separately from its truth-status. Transitions are the only way state changes;
each is owned by exactly one actor.

```
 INGESTED ─▶ CLUSTERED ─▶ CLASSIFIED ─▶ IN_REVIEW ─▶ CHANGES_REQUESTED ─▶ APPROVED ─▶ PUBLISHED
    │            │            │             │                │   ▲            │            │
 (worker)    (worker)     (worker)       (Karen)          (Kevin)│         (Kevin/     (Kevin)
    │                                       │                    └─────────┘  human gate)   │
    └───────────────────────────────────────┴──▶ REJECTED (Karen hard-fail / human / debunked)
                                                          └──▶ (never shown; retained for signal)
```

- **INGESTED → CLUSTERED → CLASSIFIED**: the §63 worker stages. Deterministic +
  capped-LLM, exactly as designed. Output is a `news_story` in `CLASSIFIED`.
- **CLASSIFIED → IN_REVIEW**: worker hands the candidate to Karen (enqueue, §5).
- **IN_REVIEW → {CHANGES_REQUESTED | APPROVED | REJECTED}**: **Karen** only.
  Karen writes findings and sets the outcome; she writes nothing else.
- **CHANGES_REQUESTED → APPROVED**: **Kevin** resolves every *blocking* finding
  (re-source, fix the rewrite, swap/verify the image, fix voice), which re-runs
  Karen; clean pass ⇒ APPROVED. Loops until clean or a max-attempts cap trips a
  human escalation.
- **APPROVED → PUBLISHED**: **Kevin**, through the publish gate (§6) — which is
  human-approved per class until autonomy is earned (#472).
- **anything → REJECTED**: Karen hard-fail (fabrication with no source,
  debunked), or a human. Rejected stories are **retained** (never deleted —
  they're signal for dedup and for "we already saw and dropped this").

Why a state machine and not booleans: it makes "who may do what, when"
enforceable in one place, it's queryable ("everything stuck in
CHANGES_REQUESTED > 24h"), and it's the natural idempotency key (§3).

---

## 3. Ingestion architecture in detail (with collision safety)

The §63 stage graph stands. The additions are all about **exactly-once under
concurrency** — the #454 lesson — and clean handoff into review.

### 3.1 One cycle, claimed work, no overlap
- Scheduler: GitHub Actions cron + a `concurrency` group (§63) so two cycles
  never run at once. That protects the LLM cap counter but **not** row-level
  races between a cycle and Kevin, or a re-run of a hung cycle.
- **Every stage claims its rows with a lease before working them.** Add to the
  work tables: `claimed_by TEXT`, `claimed_at TIMESTAMPTZ`,
  `lease_expires_at TIMESTAMPTZ`. A worker/agent claims via a conditional
  update (`... WHERE status = 'CLASSIFIED' AND (claimed_by IS NULL OR
  lease_expires_at < now()) ... RETURNING`). Only the winner of that atomic
  update processes the row; a crashed claim auto-expires and is retried. This
  is the generic fix for "two agents grabbed the same ticket."
- **Idempotency keys everywhere:** ingest upserts on `(source_id, external_id)`
  (already in §63); a story's lifecycle transition is guarded by its current
  state in the `WHERE` (a transition only fires from the expected prior state,
  so a double-delivery is a no-op); publish is guarded by
  `WHERE status='APPROVED'` so it happens **exactly once** even if two invocations
  race (the #429 "close-once-on-merge" analog).

### 3.2 Ingest → normalize → cluster (unchanged from §63, restated for completeness)
1. **Ingest**: `SourceAdapter` per source *type*; source *instances* are
   `news_source` rows (add a feed = data change). Titles/snippets/links/metadata
   only, images hotlinked. Upsert `news_raw_item` on `(source_id, external_id)`.
2. **Cluster**: cheap lexical Jaccard pass every cycle (the shipped
   `clusterBatch`), then a capped semantic LLM pass on borderline pairs only,
   conservative "unsure ⇒ separate." Raw items point at a `news_story`.
3. **Classify/rank**: once per story (`classified_at` guard). Category, rewritten
   neutral headline, 1–2 sentence summary, importance 1–10. **New constraint:**
   the classifier must emit, alongside the rewrite, the **source spans it drew
   from** (which raw items / which sentences), so review can diff the rewrite
   against sources rather than trust it. If it can't ground a claim, it must
   omit the claim, not invent bridging text.

### 3.3 Handoff to review
On `CLASSIFIED`, the worker sets `status='IN_REVIEW'` and enqueues a review job
(a row Karen's runner polls, or Karen runs inline as stage 4b of the cycle —
see §5.3). No story is ever served from `IN_REVIEW`.

---

## 4. Schema review — gaps in §4 and the concrete additions

The §63 shape is good and I'm not re-litigating it. But it was explicitly a
"pipeline-mechanics only, product decisions excluded" shape, and it has **no
review/publish machinery at all.** Concrete review:

### 4.1 What's missing (and why it bites)
| Gap in §63 schema | Consequence | Fix |
|---|---|---|
| No **publish lifecycle** field (only `classified_at`/`verified_at` timestamps + `verification_status`) | Can't express "real but not yet publishable"; can't query the queue; nothing stops serving an unreviewed story | `news_story.status` enum (§2) as the single lifecycle authority |
| No **claim/lease** columns | Two cycles or a cycle+Kevin double-process a story (#454) | `claimed_by / claimed_at / lease_expires_at` on `news_story` (and `news_raw_item` for the cluster stage) |
| No **findings** model | Karen has nowhere to write "what's wrong" that Kevin can act on; no audit of why something published | new `news_review_finding` table (§4.2) |
| No **publish provenance** | Can't answer "who published this, when, on which clean Karen run" — required for the #472 earned-autonomy audit | `published_by`, `published_at`, `review_run_id`, `publish_mode` (`human`/`auto`) on `news_story` |
| Image not gated | `top_image_url` can publish dead/mismatched (violates verify-first) | `top_image_status` enum (`unverified`/`verified`/`failed`) + `top_image_checked_at`; publish blocks unless `verified` |
| Rewrite not grounded | Classifier headline/summary can drift from sources (fabrication) | `news_story.rewrite_sources jsonb` (span refs) + a Karen check that diffs rewrite claims against them |
| Voice not gated | Machine rewrite reintroduces the #461 'Swift' drift | voice lexicon check in Karen (no column; it's a finding) |

### 4.2 New table — `news_review_finding` (Karen↔Kevin handoff, DB-native)
Karen files findings for Vault content as **GitHub issues** because they're
low-volume and human-facing. News is high-volume and machine-cleared, so
GitHub issues would be noise. Findings live **in the DB** instead, and only
**escalate to a GitHub issue when a human decision is required** (§5.4):

```
news_review_finding
  id                uuid pk
  story_id          uuid  -> news_story(id)            -- (logical ref; no cross-VAULT FK, this is news↔news, allowed)
  review_run_id     uuid                                -- groups a Karen pass
  category          enum  (fabrication | missing_source | dead_image
                          | image_mismatch | voice | inaccuracy
                          | duplicate | safety | thin | other)
  severity          enum  (blocking | warn | info)
  detail            text                                -- what & where, human-readable
  evidence          jsonb                               -- offending span, failed URL, source diff
  suggested_fix     text                                -- Karen's proposed correction (advisory)
  status            enum  (open | resolved | waived)
  resolved_by       text  null                          -- 'kevin' | '<human>'
  resolved_at       timestamptz null
  created_at        timestamptz
```

**Publish rule:** a story may leave `APPROVED` for `PUBLISHED` **iff it has zero
`open` findings with `severity='blocking'`.** `warn`/`info` don't block but are
retained on the story for display/audit. This is the DB-native analog of "Kevin
merges only when the review is clean."

### 4.3 Truth vs lifecycle stay orthogonal
Keep `verification_status` (§63: official/corroborated/single_source/rumor/
disputed/debunked) **exactly as designed** — it's the *truth* axis and feeds
serving/notification. Add `status` as the *publish lifecycle* axis. A serving
query filters on **both** (`status='PUBLISHED' AND verification_status <> 'debunked'`,
plus whatever hide-vs-label policy Joey picks). Never collapse the two.

---

## 5. Karen-for-news (the review stage) in detail

Karen stays **read-only**: she reads a candidate + its sources, writes
`news_review_finding` rows and one outcome transition, and touches nothing
else. New checkers, all deterministic-first with the LLM as a capped assistant
that only *flags* (never the sole authority) — same discipline as Vault Karen:

1. **Source-grounding / anti-fabrication (blocking).** For each claim in the
   rewritten headline+summary, is there a supporting span in `rewrite_sources`
   pointing at a real `news_raw_item`? Ungrounded claim ⇒ blocking
   `fabrication` finding with the offending span. This is the single most
   important check and it's mostly deterministic (claim ↔ span alignment), LLM
   only to judge semantic entailment on borderline pairs.
2. **Source sufficiency (blocking/​warn by policy).** At least one resolvable
   source URL; tier + corroboration consistent with `verification_status`.
   Single-`fan`-source ⇒ at most `warn` + a `single_source`/`rumor` truth-status
   (Joey's hide-vs-label policy decides if it blocks).
3. **Image verify-first (blocking if an image is claimed).** Reuse the Vault
   protocol verbatim: `top_image_url` must return HTTP 200 + `image/*` **and**
   vision-confirm it depicts the story subject. Fail ⇒ `dead_image` /
   `image_mismatch` blocking finding; the fix is drop-or-replace, **never
   publish a broken image**, and a story may publish image-less.
4. **Editorial voice (warn, escalates to blocking on egregious).** Run the
   #461 lexicon ('Taylor'≫'Swift', fan-authentic register) over headline +
   summary. Machine rewrites are the main offender; catch here.
5. **Accuracy sanity (warn).** Dates/numbers/name checks (Karen's existing
   numeric/date checkers, ported): a "$60K permit" or an award date that
   contradicts the source span.
6. **Duplicate-of-published (blocking).** Is this the same event as an already
   `PUBLISHED` story the cluster pass missed? ⇒ merge, don't double-publish.
7. **Safety (blocking).** The Vault's standing exclusions (no private-life/
   relationship/identity speculation; the CIE safety rubric) apply to news copy
   too.
8. **Thinness (warn).** If routed to Vault promotion (§7), does it meet the
   #449 depth rubric? Below bar ⇒ `thin` warn, promote-block but feed-OK.

**Outcome:** all checks clean ⇒ `APPROVED`. Any `open` blocking ⇒
`CHANGES_REQUESTED`. Hard, unfixable fail (fabrication with no real source,
debunked, safety) ⇒ `REJECTED`. Karen records a `review_run_id` linking the
findings to this pass, so re-reviews are auditable.

**Reuse #441 directly:** the "Karen depth / missing-photo / missing-cross-link"
checkers that #441 asks for are the *same code* as checks 3/8 here. Build the
checker library once (engine-side, on the CIE branch), call it from both the
Vault scan and the news review. One blind-spot fix, two consumers.

---

## 6. Kevin-for-news (the publish stage) in detail

Kevin is the **only** actor that resolves findings and publishes, and he does
neither outside the gate.

### 6.1 Fixing (CHANGES_REQUESTED → APPROVED)
For each `open` blocking finding, Kevin applies the same verify-first workflow
he uses on Vault tickets:
- `missing_source`/`fabrication` → attach a real source or **delete the
  ungrounded claim** (never invent one; if nothing grounds it, the story
  publishes without that sentence, or is rejected if the headline itself was
  ungrounded).
- `dead_image`/`image_mismatch` → re-source via the image protocol (curl +
  vision) or drop the image.
- `voice` → minimal on-voice rewrite, re-checked.
Each fix re-runs Karen (new `review_run_id`). A `max_review_attempts` cap (say
3) trips a **human escalation** (a GitHub issue, §6.3) instead of looping
forever. Kevin **never waives a blocking finding himself** — only a human sets
`waived`.

### 6.2 Publishing (APPROVED → PUBLISHED) — the earned-autonomy gate (#472)
Publishing is an autonomous content write to a live surface, so it obeys the
#472 contract exactly:

- **Precondition (always):** zero `open` blocking findings, image `verified`
  or absent, a passing **deterministic content-inertness check in CI**
  (the #472 gate: the publish diff touches only `news_*` rows/allowed columns,
  no Vault tables, no schema) — enforced in code, not by trust.
- **Class-gated autonomy, earned:**
  - **Phase A (launch): human-gated for every class.** Kevin assembles a
    **daily publish digest** (the Stream-2 pattern we already run): one issue
    listing each `APPROVED` story with its rewrite, sources, image check, and
    Karen summary, each with `- [ ] Publish #id` / `- [ ] Hold #id`. A human
    ticks; next run publishes the ticked ones. Nothing reaches the site without
    a recorded human decision — identical trust level to today's user-feedback
    stream.
  - **Phase B (earned per class):** once a class (e.g. `official`-source or
    multi-`established`-corroborated stories) has a track record of human
    approvals with ~zero reversals over a defined window, Wyatt co-signs
    autonomy **for that class only**; Kevin auto-publishes it, still logging
    `publish_mode='auto'` + `review_run_id` for audit, still human-gated for
    every other class. This is #472's "earned class-by-class," implemented.
- **Provenance on every publish:** `published_by`, `published_at`,
  `review_run_id`, `publish_mode`. That row is the audit trail #472's autonomy
  expansion is judged on.
- **Invariants (unchanged):** Kevin never deletes a story, never edits the
  Vault from the news path, never sets truth-status to `debunked` alone (that's
  a tiered signal or a human), never publishes a `REJECTED`/unreviewed story.

### 6.3 When a human is actually needed
Escalate to a GitHub issue (low-volume, human-facing — the right tool then):
review-attempt cap tripped, a `disputed`/`debunked` signal, a safety finding, or
a brand-new class requesting Phase-B autonomy. Everything else stays in-DB and
mechanical.

---

## 7. Destination: news feed vs Vault promotion (#464)

Two legitimate targets, and the architecture must not blur them:

- **A — the News/Current feed** (`news_story`, `/current`, its own world). The
  automated aggregation product. `PUBLISHED` = visible in that feed. This is
  the default target and the §63 world.
- **B — Vault promotion.** Per #464, a *significant* recent event should become
  a curated **Vault moment**, not just a feed row. Critically, this must **not**
  become a runtime cross-world write (that would break the two-worlds rule).
  Promotion is a **content-authoring event**: Kevin (or a human) takes an
  `APPROVED` news story and **emits a normal Vault seed moment** through the
  *existing* seed → Karen(`cie`) → PR → human-merge path — the same pipeline as
  any hand-authored moment. The news world and the Vault never join in SQL; the
  bridge is a generated seed edit reviewed like all Vault content. A
  `promoted_to_vault_at` timestamp + the resulting PR link on the news story is
  the only linkage, and it's audit metadata, not a FK.

Which stories promote (B) vs stay feed-only (A) is a **product rule** (Joey):
likely `importance ≥ N` and `verification_status ∈ {official, corroborated}`.
Joey's daily-intake habit (#464) is exactly path B, and this gives it a
defined, non-bespoke lane — addressing his "codify the repetition" flag.

---

## 8. How each recent learning is discharged (traceability)

| Learning | Where it's enforced |
|---|---|
| Fabrication is default (Orbit) | §3.2 grounded rewrite + §5.1 anti-fabrication blocking check |
| Verify-first images | §5.3 image check + §4.1 `top_image_status` publish block |
| Voice is checkable (#461) | §5.4 voice check on rewrites |
| Two-session collision (#454) | §3.1 claim/lease + state-guarded, exactly-once transitions |
| Karen read-only / Kevin acts | §5 (Karen writes only findings+outcome) / §6 (Kevin the only publisher) |
| Earned publish authority (#472) | §6.2 Phase A human-gated → Phase B per-class, CI inertness gate, provenance |
| Recent events → Vault-style (#464) | §7 path B promotion via the normal seed→Karen→PR flow |
| Karen blind spots (#441) | §5 checker library shared between Vault scan and news review |
| Two-worlds isolation (2026-07-02) | §4.3 orthogonal axes, §7 no-FK promotion, §63 `news_` prefix |

---

## 9. Failure modes considered

- **Karen approves a fabrication (false negative).** Mitigation: grounding is
  deterministic-first (claim↔span), LLM only assists; Phase-A human gate is a
  second set of eyes; `warn` findings are retained and visible; user-report
  loop (future) is the third layer.
- **Publish races / double-publish.** Exactly-once `WHERE status='APPROVED'`
  guard; provenance row proves single publish.
- **Review loop never converges.** `max_review_attempts` → human escalation.
- **Image host rot after publish.** A periodic re-check job can flip a
  published story's `top_image_status` back to `failed` and file a finding —
  same as Karen's Vault image-liveness sweep.
- **Cost blowup.** Every LLM call (semantic dedupe, classify assist, review
  assist) is behind the one capped client (§63); the whole path is functional
  at **zero** LLM calls (deterministic checks + rule classifier + human gate),
  degraded quality not degraded availability.
- **Source ToS / hotlink breakage.** Adapters are per-type, source instances
  are data; a bad source is disabled with an UPDATE. No bodies, no rehosting.

---

## 10. Safe to start now vs. must wait

**Safe now (survives any product decision):**
1. ✅ This design.
2. **The shared checker library** (§5 checks 1–8 as pure, testable functions
   over `{story, sources, image}`) — engine-side on the CIE branch, **reused by
   #441's Vault work**. No schema, no product calls, immediate value to the
   Vault today. **This is the highest-value safe start.**
3. **The lifecycle + findings *types*** (`packages/shared/src/news/`, alongside
   the shipped dedup): the `status` enum, `ReviewFinding` shape, transition
   guards as pure functions — zero I/O, dormant like the dedup core.

**Must wait (schema migration + product):**
- The `news_*` migration incl. the §4 additions (needs Wyatt's sign-off; still
  unmigrated per §63).
- Adapters, source list, category set, importance rubric (Joey).
- Hide-vs-label policy, promotion rule A/B threshold (Joey).
- Phase-B autonomy per class (Wyatt co-sign per #472).
- Any `/current` UI.

## 11. Open decisions

**Wyatt (architecture):**
- Approve the schema **additions** in §4 (lifecycle `status`, claim/lease,
  `news_review_finding`, provenance, image-status) on top of the §63 shape?
- Findings **in-DB** for news (vs GitHub issues) — agree with the volume
  argument?
- Confirm the publish CI inertness gate as the deterministic precondition
  (#472) and that Phase-A is fully human-gated at launch.

**Joey (product):**
- Feed-only vs Vault-promotion threshold (§7 A/B) — what makes a story
  "Vault-worthy"?
- Hide vs label for `rumor`/`single_source`/`disputed` (§4.3 serving filter).
- Does the daily publish digest (§6.2 Phase A) match how you want to approve
  news day-to-day, same as the user-feedback digest?

---

_Companion to `2026-07-07-news-pipeline-architecture.md`. No migration, no
worker, no adapters land with this — design + (proposed) shared checker/type
starter only. Two-worlds isolation and verify-first/anti-fabrication are
treated as safety properties, not conveniences._
