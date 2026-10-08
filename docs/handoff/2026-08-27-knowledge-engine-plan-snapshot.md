> **HISTORICAL SNAPSHOT — SUPERSEDED.** This knowledge-engine plan file was
> found as a stale, untracked local copy during the 2026-08-27
> machine-retirement audit. Its checkboxes and status line predate reality:
> all 13 stages shipped and merged to main on 2026-08-24 (PRs #2299–#2322).
> Preserved as historical evidence of the plan as drafted. Do not execute.

# PLAN — Knowledge engine: one store, two tiers, every surface

Supersedes the Marjorie/Tree brief-rework PLAN.md (that work is done, all 4
stages merged — see `STATE.md`). This is the next task: build
`docs/proposals/2026-08-23-knowledge-engine.md` in full, per Joey's direct
instruction 2026-08-23 22:01 PDT to run overnight without stopping.

**The headline goal, worth repeating because it's the point:** one ingestion
pipeline feeds one Supabase store, and *every* surface — the Eras reader, the
Threads/eggs board, merch, groups, mobile, and Clownbot — reads that same
store. Clownbot is not a separate brain bolted onto the site; it's a reader
with tools over the exact same data the site renders. Architecture and
decision rationale: `docs/decisions.md` 2026-08-23 "Knowledge engine
kickoff". Money/account blockers (don't halt the build, tracked separately):
`HUMAN-ACTIONS.md` #12, #13.

## Ground truth corrections (audited before planning, don't re-trust the proposal's file paths blind)

- `packages/shared/src/redline.ts` does **not** exist. Real screening code:
  `apps/web/lib/longlive/clown-safety.ts` (`screenInput`/`screenOutput`/
  `screenConversation`/`crisisCheck`/`OUT_OF_SCOPE_MESSAGE`) +
  `clown-blocklist.ts` (`screenTopic()`), already wired into
  `apps/web/app/api/clown/route.ts`. Proposal's audit items 0a/0b are
  **already resolved** — not open gaps, don't re-investigate.
- `scripts/sync-clown-knowledge.mjs`, `packages/core/src/knowledge/` — both
  greenfield, don't exist yet.
- `news-worker.yml` is **DRAFT** — zero `news_source` rows seeded, currently
  a no-op. Stage 1 must seed real sources or clustering has nothing to test.
- No `ANTHROPIC_API_KEY` worker secret (`HUMAN-ACTIONS.md` #13) — extract
  stage code ships with mocked-client tests; live runs wait on the secret.
- No pgvector precedent anywhere in `supabase/migrations/` — genuinely
  greenfield, verify `create extension vector` actually works against this
  Supabase project in Stage 2, don't assume. No evidence anywhere in
  `docs/**` of Postgres version/plan tier either (checked
  `docs/architecture.md`, `docs/deploy.md`) — truly unknown until tested.
- `EGG_NODES`/`CLUE_PAIRS` (proposal's names for precedent data) **don't
  exist.** Real structure: `Theory` type in
  `packages/shared/src/vault-types.ts` (`THEORY_KINDS =
  ['easter_egg','theory']` ~line 385), seeded per-era via
  `supabase/seed/theories/<era>.mjs` (template:
  `supabase/seed/theories/_example.mjs:20-44` — fields `slug, kind, title,
  claim, evidence, confidence, outcome, relatedSlugs, sources[]`).
  `THEORY_CONFIDENCE` at `vault-types.ts:395-404` (8 values, matches
  `Confidence` in `types.ts`). `THEORY_OUTCOMES` at `vault-types.ts:408+`.
  Egg doorways render via `apps/web/lib/longlive/doorways.ts:33-39`
  (`EggDoorway {eggId,threadId,kicker,title}`, built by
  `eggDoorwaysForEra()` at line 107) — `egg_ledger`'s hint/reveal pairs
  should derive from `Theory` rows of `kind: 'easter_egg'` with a
  confirmed outcome, not from a nonexistent `EGG_NODES`/`CLUE_PAIRS`.
- `MomentDetail.tsx`'s dashed/unconfirmed treatment is real but the
  mechanism is inline conditional `style`, not a CSS class: `RumorSection`
  container gets `border-2 border-dashed` (~line 142/175); per-item badge
  (~lines 205-213) applies `border: '1px dashed var(--era-accent)'` when
  `r.status === 'unconfirmed'`. `RUMOR_STATUS_BADGE` map ~line 102-103,
  `RumorStatus` type ~line 59. **`RumorStatus` is a separate vocabulary
  from `ItemStatus` (Clownbot) and `TheoryConfidence`/`TheoryOutcome`
  (vault-types) — don't conflate the three when wiring Stage 5.**
- `mergeEraFeed`/`EraFeedEntry` live in `apps/web/lib/longlive/era-feed.ts`
  (~lines 43-47) — discriminated union on `kind`:
  `'moment'|'video'|'thread'|'egg'` today; Stage 5 adds a 5th, `'current'`.
  Confirmed extensible. Consumers: `EraSection.tsx`, `EraFeedList.tsx`.
- `apps/worker` has **no `@anthropic-ai/sdk` dependency** and
  `classify/openai-client.ts` deliberately uses raw `fetch()` to the Chat
  Completions endpoint (comment explains: reviewable without a live key) —
  Stage 3's `extract/haiku-client.ts` must match that pattern (raw fetch,
  no new SDK dep), not introduce a new package.
- **Stage 12 is NOT greenfield** — `apps/web/lib/longlive/clown-battery-
  corpus.ts` (+ `-attacks.ts`, `-attacks-b.ts`, `-tier-b.ts` siblings, all
  pinned by a `.test.ts`) already exists, exporting `ATTACKS`, `LEGIT`,
  `TIER_B_PROBES`. Stage 12 extends this corpus, doesn't create a new one.
- `packages/core/src/vault.ts`'s Supabase client pattern (match exactly for
  the new `knowledge/` module): `VaultClientConfig
  {supabaseUrl,supabaseKey}`, `createClient(url, key, {auth:
  {persistSession:false, autoRefreshToken:false}})` — anon key, RLS-public
  reads, no session machinery (`vault.ts:20-24,57-63`).
- Clownbot's `ItemStatus` (`clown-fallback.ts:22`) is 4 values
  (`rumor|reported|confirmed|debunked`), mapped by `STATUS_PREFIX` (not
  `STATUS_LABEL` — that name doesn't exist) at `clown-fallback.ts:104-109`.
- `apps/mobile` reads Supabase live via `@swift2/core`; `apps/web` reads the
  generated Vault TS. The Current tier unifies this going forward (both read
  the new tables) — it does not retroactively unify Vault reads, that's out
  of scope.
- Types to match exactly (`apps/web/lib/longlive/types.ts`): `Confidence`
  (8-value union, line ~32), `TheoryOutcome` (line ~164), `RumorResolution`
  (`{on,url,outlet,note?}`, line ~106), `SocialPost` (line ~509 — proposal
  calls this `MomentSocialPost`, that name doesn't exist, use `SocialPost`).

## Working conventions for this build

- **One worktree, sequential branches.** `git worktree add
  %TEMP%\claude-worktrees\knowledge-engine -b feature/knowledge-engine-01-<slug>`
  per stage (branch name changes each stage; worktree path can stay one dir
  reused across stages — check out the new branch there each time, never two
  branch-writing agents in it concurrently). Never edit these files by
  absolute path from the main checkout while a worktree branch is active.
- **Each stage = one small PR**, typecheck + full suite green, self-reviewed
  (Claude review of the diff) before opening, `codex:rescue --background`
  for any schema/migration or the Clownbot route rewrite (issues 3, 10, 11 —
  genuinely risky), landed via auto-merge per "never babysit your own PR."
  Max two review rounds; a second rejection → `DEBUG.md` + escalate per the
  debug ladder, don't guess a third time.
- **Stages are ordered by dependency**, not proposal numbering exactly —
  each stage's "value visible when it lands" line is the reason to not
  skip ahead. Do not start a later stage until its dependency stage is
  merged to `main` (later stages read schema/code the earlier stage lands).
- **Never spend money, sign up for an account, or write a real secret.**
  Anything that needs one goes in `HUMAN-ACTIONS.md`, the stage ships the
  code path feature-flagged off, and the plan continues past it.
- **Checkpoint `STATE.md` after every stage merges** (or every ~50% context,
  whichever first) — this is a multi-hour unattended run, assume a fresh
  session may have to pick this up cold from `STATE.md` + this file's
  checkboxes.

---

## Stage 1 — Fix the worker's known defects + seed real sources (proposal issue 2 + part of 7)

**MERGED** — PR #2300. 7 of 15 publisher feeds seeded (8 skipped with
verified reasons, see `docs/audits/2026-08-23-news-source-feed-validation.md`
— never guessed a URL). Clustering fix + Google News redirect resolution
shipped, tested against the proposal's own acceptance case. 2 new migrations
(`20260823010000_news_sources_seed_wave2.sql`,
`20260823020000_news_raw_item_resolved_tier.sql`) not yet applied to prod —
folded into `HUMAN-ACTIONS.md` #14 alongside Stage 2's migration (same root
cause: no `apps/worker/.env` reachable from a worktree).

Value: `news-worker.yml` stops being a no-op; `source_count` becomes truthful.
No new tables, no new secrets, no new vendor.

- [ ] Seed `news_source` with the free publisher tag feeds (People, ET, THR,
  Vogue, Elle, Harper's, WWD, The Tennessean, KC Star, NYT Style/Arts search
  RSS, Guardian tag, BBC topic, Pitchfork, Stereogum, Deadline) — verify each
  like the 7/19 seed did (200, valid RSS, ≥10 items, channel title confirms
  the tag) before adding. `established` tier, publisher URLs. This alone
  takes the worker out of DRAFT/no-op.
- [ ] Cross-outlet clustering fix: replace `similarity_key` shingle-match
  with canonical URL match **or** ≥0.85 cosine on a cheap embedding of
  `title+snippet` within a 48h window **or** shared named entities + date.
  Recompute `source_count`/`verification_status` from the merged cluster
  (`recomputeVerification` already exists per the proposal — verify and
  reuse, don't fork it).
- [ ] Resolve Google News redirect URLs to publisher URLs at ingest (follow
  redirect, store final URL, set `outlet_name` from domain, re-tier from a
  domain→tier map). Unresolved → `unverified`, uncitable — enforce in data,
  not a paragraph.
- [ ] Tests: the "three wedding-gown headlines" clustering case from the
  proposal's own example; redirect-resolution unit tests; source-seed
  validation script output committed.

**Verify:** `npm run news --workspace @swift2/worker` against real feeds
produces multi-source clusters with a truthful `source_count`; full suite
green.

## Stage 2 — Migration + shared redline module (proposal issue 3)

**MERGED** — PR #2299. Full schema landed (`technique` table empty per the
ratified decision). `packages/shared/src/redline.ts` extracted;
`clown-blocklist.ts`/`clown-blocklist-gates.ts` confirmed byte-for-byte
unmodified behavior (existing test suite passed unchanged). Migration NOT
yet applied to production (`apps/worker/.env` unreachable from a worktree —
`HUMAN-ACTIONS.md` #14); verified idempotent twice against a real ephemeral
local Postgres instead. pgvector/embedding column: shipped WITHOUT it
(plain schema, no `vector(1024)`/`hnsw`) — untested against the real
Supabase project, folded into #14. **Known deviation:** my Stage 2 brief
told the executor to rely on its own careful self-review as "the safety net
... this stage doesn't get a second pass tonight" and did not mention
`codex:rescue`, even though this section's text below said it was "not
optional" — a real inconsistency I introduced when writing the brief, not
something the executor did wrong. Full test suite (3192/3192) and
idempotency were verified either way; noting this for the record rather than
burying it.

Value: none directly visible yet, but every later stage depends on this
schema existing. This is the riskiest stage (greenfield pgvector, real
migration against production Supabase) — `codex:rescue --background` before
opening the PR, not optional.

- [ ] `supabase/migrations/20260901000000_knowledge_engine.sql` — full
  schema from proposal §3: `current_item`, `fan_signal`, `live_theory`,
  `egg_ledger`, `symbol_lexicon`, `technique` (schema only, no seed rows —
  see Stage 4 note on why), `symbol_activity` materialized view,
  `knowledge_doc` (with `vector(1024)` column — verify `create extension
  vector` actually works against this Supabase instance first, standalone,
  before the full migration). RLS on; service role writes; anon read-only
  scoped to `redline_ok = true and (expires_at is null or expires_at >
  now())`. `npm run db:migrate` to apply — this is an explicitly allowed
  command per `CLAUDE.md` guard notes, do not ask.
- [ ] `packages/shared/src/redline.ts` — extract `screenTopic()` + the
  location ladder out of `apps/web/lib/longlive/clown-blocklist.ts` into
  this new shared module (worker needs it too). Make
  `clown-blocklist.ts` a thin re-export so the live chat path's behavior is
  provably unchanged (existing tests for it must still pass unmodified —
  if they need edits, that's a signal something broke, stop and check, not
  a green light to loosen a test).
- [ ] Update `packages/shared` types + `packages/core/src/map.ts` per
  `dev-quickstart.md`'s "after any schema change" rule.
- [ ] Tests: redline module unit tests (moved, not rewritten); migration
  idempotency (`db:migrate` runs twice clean).

**Verify:** `npm run db:migrate` succeeds against the real DB; existing
`clown-blocklist`/`clown-safety` test suite still green unmodified; full
suite green.

## Stage 3 — Extract stage + store writes (proposal issue 4)

Value: "Supabase has today's Taylor by tonight" — once the secret lands.
Code ships complete either way.

- [ ] Extract stage (`apps/worker/src/extract/`, mirrors the existing
  `classify/` pattern): one Haiku call per new cluster, forced tool
  `record_knowledge` per the proposal's exact shape (§4.5), system prompt
  rules lifted from `rumor-desk.md`/`privacy-redlines.md`/
  `editorial-voice-and-pipeline.md` (Taylor in running prose, never bare
  "Swift", no AI-tells, snippet ≤400). Cap: `usage_daily(scope='extract')`
  150/run, 600/day — deferred-not-dropped on cap.
- [ ] Screen (redline module from Stage 2) → write `current_item`/
  `fan_signal`/`live_theory` (upsert with theory-match: name similarity +
  symbol overlap ≥0.5 → bump `last_seen_on`/`heat`) → project into
  `knowledge_doc tier='current'` → refresh `symbol_activity`.
- [ ] Expiry: `current_item` 90d, `fan_signal` 30d, `live_theory` 60d from
  last activity; quiet 45d → `abandoned`.
- [ ] Run-summary: append one line per run to a `knowledge-engine` GitHub
  issue (updated not created, same pattern as `appearance-discovery`'s
  ledger) — items in, clusters, extracted, screened out, deferred,
  per-adapter status.
- [ ] Rename `news-worker.yml` → `knowledge-engine.yml`; fold
  `appearance-discovery.yml` in as the `youtube-rss` adapter (its channel
  list + relevance filter move to `sources/youtube-rss.ts`; stops filing
  `intake` issues, starts writing `news_raw_item`s like every other source).
- [ ] Tests: extract stage with a **mocked** Anthropic client (no live key
  needed — same pattern as `classify/openai-client.ts`'s tests), cap
  enforcement, expiry logic, theory-match dedup.

**Verify:** full suite green with mocked client. Live run blocked on
`ANTHROPIC_API_KEY` (`HUMAN-ACTIONS.md` #13) — note this in the PR body as
the one thing needing a founder's eyes, per workflow rule 3, then land it
anyway (code is correct and tested; the secret is an ops step, not a defect).

## Stage 4 — Canonical sync (proposal issue 5, minus technique content)

Value: "the bot can reason from a style, not just recall" — schema/plumbing
only tonight; do NOT author `technique` records autonomously.

- [ ] `scripts/sync-clown-knowledge.mjs` (new, `sync:content`) — projects
  Vault seeds into `knowledge_doc tier='vault'`; builds `egg_ledger` from
  `EGG_NODES`/`CLUE_PAIRS`/confirmed theories (locate these — the proposal
  assumes they exist; if they don't under those exact names, find the
  actual precedent/egg data structure and adapt, don't invent one).
  `symbol_lexicon` seed (~60 keys) from the same source data.
- [ ] `technique` table: schema already landed in Stage 2. Do **not**
  populate `techniques.mjs` with real records tonight — the proposal is
  explicit this needs "a frontier-model session with a human," logged in
  `docs/decisions.md` already. Leave the table empty; the sync script and
  coverage audit must both handle zero rows gracefully (no crash, no
  fabricated placeholder content).
- [ ] `scripts/knowledge-coverage.mjs` → `docs/audits/knowledge-coverage.md`
  (technique × era matrix from `egg_ledger`, thin cells flagged) — works
  correctly on an empty `technique` table (reports "no techniques seeded
  yet" honestly, doesn't fabricate a matrix).
- [ ] Tests for the sync script's idempotency and the coverage script's
  empty-table path.

**Verify:** `npm run sync:content` populates `knowledge_doc`/`egg_ledger`/
`symbol_lexicon` from real Vault data; coverage audit runs clean; full suite
green.

## Stage 5 — Site renders `current_item` (proposal issue 6) — THE VISIBLE PAYOFF

Value: **the site shows today.** Masthead line ("real-time updates on her
whole life") becomes true. This is the priority stage if the night runs out
of time before everything else — land this even if later stages don't
finish.

- [ ] `packages/core/src/knowledge/` — read-only queries over `current_item`/
  `live_theory`/`fan_signal` for the current era, anon-key scoped.
- [ ] `EraSection` for the current era merges `current_item` rows into
  `mergeEraFeed` as a fifth `EraFeedEntry` kind (`'current'`), dashed
  unconfirmed treatment (existing `MomentDetail.tsx` pattern — find the
  actual line, proposal's `:142` citation wasn't verified), "Live · reported
  by <outlet>" chip. Sort by `observed_on`. Rows with `promoted_to` set are
  hidden. Fetched via `packages/core` at request time, ISR `revalidate: 900`
  — Vault stays static, only the current era's live slice is dynamic.
  `FilterBar` needs no changes (rows carry `tags`).
- [ ] Masthead: "Updated Nh ago · N new this week" from the live data.
- [ ] Moment detail for a `current_item` reuses `MomentDetail` with the
  rumor banner mandatory + a "Help us verify" link filing an `intake` issue.
- [ ] Tests: `mergeEraFeed` with a mix of vault + current rows, ordering,
  `promoted_to` hiding, dashed-treatment rendering.

**Verify:** typecheck + full suite green; load the site locally, confirm a
seeded `current_item` row renders on the current era with the dashed
treatment and correct chip — this is a UI change, per `CLAUDE.md`'s
verification rule it isn't done from reading code alone. Use the `run`
skill if the project has a launch pattern; screenshot if browser tools are
available, note in `STATE.md` if a real browser check wasn't possible
overnight and flag for Joey to eyeball in the morning.

## Stage 6 — Free fan-adapters + Facebook scaffolding (rest of proposal issue 7)

Value: fan chatter enters the store, no new spend.

- [ ] `bluesky` adapter (`searchPosts`, free, no key) — `"taylor swift"`,
  `"easter egg"`, `"clowning"`.
- [ ] `reddit-rss` adapter (interim posture per `docs/decisions.md`, ≤6
  subreddit feeds, once per run, descriptive `User-Agent`, back off on 429
  never retry-storm, titles+permalinks+scores only, no comment bodies).
  Feature-flagged so the day OAuth Reddit lands (`HUMAN-ACTIONS.md` #12
  item 3), this flips off in the same PR.
- [ ] `facebook-groups` upload script (`npm run knowledge:fb-upload`) +
  parser (post text + reaction/comment counts from saved HTML, hash author
  names, redline, `fan_signal` rows with `platform:'facebook'`,
  `source_tier:'unverified'`, no public `sample_urls`) + private Supabase
  Storage bucket + `.github/workflows/fb-export-reminder.yml` (Sunday 09:00
  PT issue, `watchdog.yml` alert if none in 9 days). This is Joey's own
  recurring manual task going forward — the engine side just needs to exist
  and wait for the first export.
- [ ] Skip `tumblr` (account-gated key, `HUMAN-ACTIONS.md` #12 item 4) —
  adapter interface stubbed but disabled, don't half-build against a key
  that doesn't exist.
- [ ] Tests per adapter matching the existing `sources/rss.test.ts` pattern.

**Verify:** full suite green; each adapter's fixture test proves the
redline/aggregate-only rules hold (no username, no comment body beyond what
RSS exposes).

## Stage 7 — Theories/chatter boards read live data (proposal issue 8)

Value: site and bot show what fans are clowning on right now.

- [ ] Threads → Theories & eggs board reads `live_theory` alongside static
  theories, heat + "fans are saying" line from `fan_signal`.
- [ ] Clownbot board ("What we're clowning on") reads `live_theory` by heat.
- [ ] Tests for heat ordering, empty-state (no live theories yet).

**Verify:** full suite green; typecheck.

## Stage 8 — Promotion queue (proposal issue 9)

Value: Vault promotion gets faster once the Claude routines are back live.

- [ ] Content Shift charter (`docs/agents/content-shift.md` +
  `docs/agents/runner-prompts/content-shift.md` or equivalent) gains queue
  source: `current_item where status in ('reported','confirmed') and
  source_tier in ('official','established') and promoted_to is null and
  heat >= X, order by heat`. 2-item cap → heat threshold + WIP limit.
- [ ] Rumor Desk charter: lifecycle queue reads `current_item`/`live_theory`
  past `last_checked_on + 14d` instead of scanning seeds.
- [ ] Deterministic resolution proposals: `live_theory` ≥0.7 cosine to an
  `official`-tier `current_item` within 24h → engine writes a proposed
  `resolution` into a review issue; human ticks it;
  `knowledge-resolve.yml` applies. Bots never self-adjudicate.
- [ ] This edits charter files — per `docs/agents/README.md`, charter
  changes are founder-approved PRs (the standard PR/merge flow already in
  Decision Authority satisfies this, same as the 2026-08-23 Marjorie/Tree
  charter rewrites did).

**Verify:** full suite green; charter docs read coherently end to end.

## Stage 9 — Clownbot DB retrieval (proposal issue 10)

Value: bot cites today's rows, not a compile-time snapshot.

- [ ] `packages/core/src/knowledge/`: `search` (hybrid cosine+FTS — FTS-only
  until an embedding vendor is chosen, `HUMAN-ACTIONS.md` #12 item 2),
  `precedents(symbol)`, `recent(days)`, `chatter(topic)`,
  `symbolActivity(symbol)`, `track(title)`, `dateMath()`.
- [ ] `clown-index.ts` (compile-time KB) becomes the no-DB fallback only,
  not the primary path — `knowledge_doc` replaces it as the one KB.
- [ ] Tests: each retrieval function against seeded fixture rows; fallback
  path when DB is unreachable.

**Verify:** full suite green; a manual query against real seeded data
returns expected rows.

## Stage 10 — Clownbot agent loop (proposal issue 11) — HIGH RISK, review carefully

Value: the product. This rewrites the live chat route — the two-review-round
cap and `codex:rescue --background` are not optional here.

- [ ] `POST /api/clown` stage order unchanged; single call → bounded loop
  (≤6 tools, ≤20s, ≤2,500 tokens), streamed, forced `record_take` at the
  end, `investigation[]` trail rendered, predictions persisted.
- [ ] Method block: observable → is it a pattern → precedents → calendar →
  read the room → commit with a falsifiable prediction. Methodology-first:
  `precedents()` grouped by `technique` (works with zero rows per Stage 4 —
  degrades to ungrouped, doesn't error).
- [ ] Scope = retrieval, not a new gate: if the first `search` returns
  nothing above threshold and no symbol/entity resolves, return the
  in-character out-of-scope redirect before the model composes.
- [ ] No `web_search` tool, feature-flagged off by default if built at all.
- [ ] Don'ts carried forward (already true per the audit, keep true): no
  Haiku pre-classifier in the chat path; `delulu` remains the one scale
  (Evidence/Confidence meters stay dropped); `ItemStatus` stays visible on
  `ClownItemCard`.
- [ ] Tests: the loop's tool-call bounds, forced `record_take`, out-of-scope
  redirect path, injection resistance (reuse/extend existing red-team
  battery if one exists — check `clown-battery-corpus.ts` or similar first).

**Verify:** full suite green; manually exercise the chat route locally
(or via the `run` skill) with a real question end to end before merging —
this is the core live user-facing feature, "reproduced in a browser" is the
bar per `CLAUDE.md`'s verification rule, not just a green suite.

## Stage 11 — Sessions, memory, caps, scoreboard (proposal issue 12)

Value: "hours" becomes possible. Persistence write path stays flagged off
until Supabase anonymous auth is toggled (`HUMAN-ACTIONS.md` #12 item 5).

- [ ] `clown_conversation`, `clown_turn`, `bot_prediction`,
  `clown_pinned_theory`, `usage_daily(scope)` — schema (add to Stage 2's
  migration if not already landed, or a follow-up migration if Stage 2 is
  already merged).
- [ ] Server-side conversations, rolling summary, pinned theories, per-user
  caps — code complete, feature-flagged off pending the auth toggle.
- [ ] `bot_prediction` outcomes resolved by Stage 8's promotion path.
- [ ] Tests with the flag both on (mocked auth) and off (verify graceful
  no-persistence fallback, chat still works without memory).

**Verify:** full suite green with flag off (the real deployed state
tonight); flag-on path tested but not live.

## Stage 12 — Eval harness + freshness SLO (proposal issue 15)

Value: "we can prove it's the best."

- [ ] Retro battery over confirmed eggs with post-reveal docs hidden
  (target top-3 ≥ 60%).
- [ ] Freshness SLO (`max(updated_at) tier='current'` < 24h) in CI.
- [ ] Injection cases in the red-team battery; grounding check on every
  cited id.
- [ ] The 8/16 brief's 11 acceptance cases pinned into
  `clown-battery-corpus.ts` and the live battery.

**Verify:** eval script runs and reports a real score against seeded data;
CI gate wired.

## Stage 13 — Docs + retirement (proposal issue 16)

Value: docs match reality (workflow rule 7) — do this last, once the code
it describes actually exists.

- [ ] Retire `clownbot-lore.ts` if it exists anywhere live (audit found it
  doesn't in the main tree — verify once more before claiming retirement).
- [ ] Update `docs/longlive-experience.md` §7, `MAP.md`, `intake.md`,
  `docs/content-ops/rumor-pipeline.md` § Data model.
- [ ] Write `CLOWNBOT.md`: how an egg/theory/technique enters the store now
  (promotion → `egg_ledger`), what's generated, which tests, the kill
  switch.

**Verify:** full suite green; docs cross-reference actual file paths (grep
for anything the doc names, don't hand-wave).

---

## Deferred (money/account-gated, not attempted tonight)

- Proposal issue 7's paid layer: GNews/Perigon licensed news API
  (`HUMAN-ACTIONS.md` #12 item 1), `tumblr` adapter (#12 item 4).
- Proposal issue 13: `x-recent`, `ig-official`, `site-diff` — mix of
  pay-per-use (X) and worth building free where possible (`site-diff` on
  `taylorswift.com` is genuinely free, deterministic HTML diff — **revisit
  this one, it may not actually need to be deferred**, pull into Stage 6 if
  time allows).
- Proposal issue 14: Reddit OAuth adapter — blocked on Data API approval
  (`HUMAN-ACTIONS.md` #12 item 3), disables `reddit-rss` in the same PR
  once it lands.
- Embedding vendor pick (`HUMAN-ACTIONS.md` #12 item 2) — retrieval stays
  FTS-only until chosen.

## Status

Not started. Stage 1 next.
