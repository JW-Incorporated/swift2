# HUMAN-ACTIONS.md — things only Joey can do

Anything needing Joey's identity, login, payment method, approval, or a click in
a UI an agent cannot reach. One file, this exact name, repo root.

**How to use this:** each item has a `**Status:** OPEN` line. Change that one
word to `DONE`, `SKIP` (chose not to — add a few words why) or `BLOCKED` (tried,
something stopped you) yourself, or tell a session to in chat and it will write
the edit directly (a session only does this on your explicit instruction, never
on its own judgment). **Never cut, paste, or move a block** — a session
reconciles this file and files finished items into DONE with a date. Item
numbers are stable IDs, never reused or renumbered, so "#4" means the same thing
forever. Saying "I did #2" in chat works just as well as editing the line —
a session will make the edit for you.

**`Filed:` (added 2026-08-23):** every OPEN item carries a `**Filed:**
YYYY-MM-DD` line right under its title — the date it was first written here,
backfilled via `git log` for items that predate this convention. Marjorie's
morning brief reads it to show how long each OPEN item has been waiting on
you; never remove or backdate it. DONE/SKIP items don't need one — aging
only matters while something is still pending.

`SKIP` is final. No session will re-raise a skipped item or re-argue it.

---

## OPEN

### 16. [UPGRADE] Facebook groups checklist ships empty — needs your real group list, and your first real export to trust the parser

**Filed:** 2026-08-24

**Why it matters:** `scripts/knowledge/fb-groups-checklist.mjs`
(`fb-export-reminder.yml`'s Sunday reminder, PLAN.md Stage 6) ships with
zero groups — only you know which Facebook groups you're actually in and
want tracked, so this was not guessed. The reminder issue itself still
files every Sunday and says so plainly rather than silently doing nothing.

1. **Add your groups** to `scripts/knowledge/fb-groups-checklist.mjs` —
   each entry is `{ slug: 'short-hyphenated-id', label: 'Group Name' }`.
   Start with 3–5 (that week's issue is the checklist).
2. **First real export**: `facebook-groups-parser.ts`'s HTML extraction
   (`role="article"` blocks, `aria-label` author names) was written against
   Facebook's documented accessibility markup, not a real saved export — no
   Facebook account/group was available to verify it against, and creating
   one is outside what an agent may do unattended. Run your first weekly
   export through it once you have one; if it parses to 0 posts on real
   content, tell me and I'll retune the extraction against that real file.

**Worked if:** the checklist file has real entries and at least one real
export has been parsed without silently returning 0 posts.

**Status:** OPEN

---

### 15. [UPGRADE] Two knowledge-engine calls still open after #12 — Reddit Data API status, Supabase anonymous-auth toggle

**Filed:** 2026-08-23

**Why it matters:** you answered 3 of #12's 5 items in chat tonight (GNews
free-tier yes, embedding vendor = OpenAI, Tumblr key set) and marked #12
DONE — carrying the last 2 forward here so they don't quietly vanish along
with it. Neither blocks tonight's build.

1. **Reddit Data API** — proposal says you have a request in flight and a
   meeting this week. Tell me the outcome (approved / pending / no) and
   I'll either wire the OAuth adapter or keep the RSS-only interim (≤6
   feeds, ~36 req/day, disclosed) as the long-term posture.
2. **Supabase anonymous auth** — Clownbot's server-side conversation memory
   needs "Allow anonymous sign-ins" toggled on in the Supabase dashboard
   (Authentication → Providers). I can't reach that toggle. Until it's on,
   Clownbot's DB retrieval and agent loop still ship, just without
   persisted per-user chat history/predictions.

**Worked if:** you tell me the Reddit outcome in chat and/or flip the
Supabase toggle.

**Status:** OPEN

---

### 14. [BLOCKING] No `apps/worker/.env` in knowledge-engine worktrees — 8 migrations unapplied against prod, pgvector untested

**Filed:** 2026-08-23

**Update:** Stage 1 (worker fixes, PR #2300) hit the identical gap for the
same reason — two more migrations
(`20260823010000_news_sources_seed_wave2.sql`,
`20260823020000_news_raw_item_resolved_tier.sql`) are written and merged to
`main` but not yet applied against production, because that worktree also
had no `apps/worker/.env`. All three migrations below need one
`npm run db:migrate` run from a checkout that has the real env file — do
them together, one command, once `main` has all three.

**Why it matters:** Stage 2 of the knowledge-engine build (`PLAN.md`) asked me
to test `create extension vector` against the real Supabase project first,
then apply `supabase/migrations/20260901000000_knowledge_engine.sql` with
`npm run db:migrate` and verify it's idempotent by running it twice — against
production. `apps/worker/.env` (the file holding `SUPABASE_DB_URL`) does not
exist anywhere in this worktree (`%TEMP%\claude-worktrees\
knowledge-engine-02-migration`), and `SUPABASE_DB_URL` isn't set as an
ambient environment variable either — I checked both. `git worktree add`
only copies git-tracked files; `apps/worker/.env` is gitignored, so it never
existed here even though it's presumably present in your main checkout. The
guard also correctly denies me from reading/copying a real `.env` file
directly, so I can't self-serve this even if the file were reachable.

**What I did instead, so this doesn't block the whole stage (per my
instructions):** wrote the full migration SQL, WITHOUT the proposal's
`embedding vector(1024)` column / `hnsw` index (safe default — matches the
already-ratified stance in `docs/decisions.md` 2026-08-23 that the embedding
column stays effectively unused until a vendor is picked anyway). Verified
the migration's SQL is syntactically correct and genuinely idempotent by
running it twice against a real (ephemeral, local, NOT production)
Postgres via the `embedded-postgres` package — same mechanism
`scripts/backup-restore-test.mjs --cluster ephemeral` already uses in this
repo. Both passes applied clean. I also probed `create extension vector` on
that same local Postgres: **not available** there (the embedded distribution
doesn't ship the extension's binary) — this does NOT tell us whether
pgvector is available on the actual Supabase project; Supabase almost always
ships it, but per `PLAN.md`'s own ground-truth note this was explicitly
supposed to be verified, not assumed, and I have no way to verify it without
the real credential.

**Steps:**
1. Either run `npm run db:migrate` yourself from a checkout that has
   `apps/worker/.env` (this PR's branch, once merged, or checked out
   locally) — the migration is ready to apply as-is — or hand a session
   `apps/worker/.env` in a worktree that needs DB access (copying a
   gitignored env file between your own checkouts isn't a secret leak, just
   a step no session can do to itself under the current guard).
2. While you're at it: `psql "$SUPABASE_DB_URL" -c "create extension if not
   exists vector;"` (or let a session with the env file run it) tells us
   definitively whether pgvector is available on this project's plan tier.
   If it works, a fast-follow migration can add `knowledge_doc.embedding
   vector(1024)` + the `hnsw` index — retrieval stays FTS-only until then,
   which was already the plan pending an embedding vendor pick anyway
   (`HUMAN-ACTIONS.md` #12 item 2).

**Worked if:** `npm run db:migrate` (with `apps/worker/.env` present) applies
`20260901000000_knowledge_engine.sql` cleanly against production, and running
it a second time is a clean no-op (no errors, no duplicate objects).

**Addendum (Stage 4, canonical sync):** same root cause hits
`scripts/sync-clown-knowledge.mjs`/`scripts/knowledge-coverage.mjs`, which
also need `SUPABASE_DB_URL` to write/read `knowledge_doc`/`egg_ledger`/
`symbol_lexicon`/`technique`. Both degrade gracefully instead of crashing
`npm run sync:content` (build every row from real seed data, log a clear
skip message, exit 0) when the credential isn't reachable — same as this
item's Stage 2 note. Verified for real anyway: applied all 17 migrations +
ran the sync script twice against a real ephemeral local Postgres
(`embedded-postgres`, same mechanism as this item's Stage 2 verification) —
1061 `knowledge_doc` / 37 `egg_ledger` / 52 `symbol_lexicon` rows, identical
row counts and ids on both runs (genuine upsert idempotency), `technique`
stayed at 0 rows throughout. Not a new item — same fix (step 1 above) closes
this too.

**Addendum (Stage 6, fan adapters):** another migration,
`20260901010000_knowledge_engine_fan_adapters.sql`, widens
`news_source.source_type` to admit `reddit_rss`/`tumblr`/`gnews`
(`bluesky` was already allowed) and adds `api_usage_daily` (a generic
scoped daily-call counter — first consumer: `gnews.ts`'s free-tier cap).
Same root cause, same fix: verified idempotent (applied twice) against a
real ephemeral local Postgres, not yet applied to production. Run it
together with the rest when you run step 1 above.

**Addendum (2A, live_theory redline fast-follow):** a retroactive Codex
review of `20260901000000_knowledge_engine.sql` (task-mt6t7akh-a22733) found
`live_theory` had no `redline_ok` column/RLS gate, unlike `current_item`/
`fan_signal`. Fixed in a new migration,
`supabase/migrations/20260903000000_live_theory_redline.sql` — same root
cause hits this worktree too (guard denies reading `apps/worker/.env` here
as well, confirmed directly). Verified for real: applied all 21 migrations
twice against a real ephemeral local Postgres (`embedded-postgres`, same
mechanism as this item's other verifications) — clean idempotent re-apply
both times — then, still on that local cluster, confirmed the RLS gate
itself works: inserted one `redline_ok=true` and one `redline_ok=false`
`live_theory` row, granted `SELECT` to a non-owner role (simulating
Supabase's `anon`/`authenticated` default grant), and confirmed only the
`redline_ok=true` row was visible under RLS.

**Running total (reconciled across stages):** counting every addendum
above plus Stage 3's own `usage_daily.sql` /
`news_story_extracted_at.sql` / `refresh_symbol_activity.sql` (landed on
`main` but never logged here by that stage), **8 migrations** are
unapplied against production as of this merge, not 3 or 4 — same fix
(step 1 above) closes all of them in one `npm run db:migrate` run.

**Status:** OPEN

---

### 4. [UPGRADE] API accounts for the marketplace research — ~20 min

**Filed:** 2026-08-15

**Why it matters:** you asked for a curated dataset of official + viral fan-made
merch. Tier 1 (the official store) is already solved and needs nothing from you.
Everything else in the brief is unreachable from an agent environment —
Etsy/Redbubble/TeePublic return 403, Reddit is refused at the tool level, TikTok
returns an empty shell. You chose "get proper API access first" over browser
automation. Until these exist, agents pointed at those sources would invent
numbers, so the work is deliberately parked.

**Steps:**
1. Reddit script app: `https://www.reddit.com/prefs/apps` → **create another
   app** → type **script**. Save the client id and secret.
2. Etsy Open API Personal App: `https://www.etsy.com/developers/register` (or
   `https://developer.etsy.com`). Save the keystring.
3. Optional, only for referral revenue later: Awin and Amazon Associates.
4. Put the values in the project `.env` yourself — never paste a key into chat.
   Tell a session the key NAMES only, and it will wire them up.

**Known ceiling, so you do not sign up for more than you need:** per-video
TikTok/Instagram view counts for accounts you do not own are **not obtainable**
on any legitimate path, and Etsy listings carry **no review count**. Hype
evidence will be Reddit score + comments + press mentions.

**Worked if:** the `.env` holds a Reddit client id/secret and an Etsy keystring.

**Status:** OPEN

---

### 5. [UPGRADE] Five product/tech decisions that lost their owner — ~10 min

**Filed:** 2026-08-15

**Why it matters:** these were Wyatt's calls. With him gone they are yours, or
they ship unratified by default. None is urgent; all are cheap to answer.

1. **Clownbot's model tier** — currently `claude-sonnet-5`, one named constant.
2. **The 200/day/instance Clownbot cap** — keep, raise, or lower.
3. **Ratify the Mood route pattern** (or say you do not care, which is a valid
   answer and closes it).
4. **Sign off the Clownbot decisions entry** in `docs/decisions.md`.
5. **The era reader's bottom nav** formally overrides
   `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3. It is already shipped;
   this just records that you meant it.

**Worked if:** you answer in chat. A session writes the answers into
`docs/decisions.md`.

**Status:** OPEN

---

### 6. [UPGRADE] Should `auto-merge-content` keep auto-landing UI code? — ~2 min

**Filed:** 2026-08-15

**Why it matters:** PR #2140 changed two `.tsx`/`.ts` files and merged itself
with no human involved. That is `auto-merge-content.yml` working exactly as
written — its guard only blocks server-executing and secret-reading files, and a
client component is neither — but the name says "content" and it is now shipping
interface changes unattended.

**Options:** leave it (fast, and CI still gates every merge); restrict it to
content files only; or keep the behaviour and rename it so it stops being
surprising.

**Worked if:** you pick one in chat.

**Status:** OPEN

---

### 7. [UPGRADE] Three questions left open when #2110 merged — ~5 min

**Filed:** 2026-08-15

**Why it matters:** you deferred these to land the branch. Merging did not
answer them, and the dataset ages from here.

1. **Instagram + TikTok** — your item 4b named both; the build brief omitted
   them. They are a different shape (creator accounts, not joinable groups), so
   scope was not widened without you. In or out?
2. **Who owns refresh cadence** — invites rotate and groups go private. The data
   was accurate 2026-08-14 and decays from there.
3. **`r/TravisAndTaylor`** was excluded as an anti-fan snark board — ratify or
   veto. `r/GaylorSwift` was kept, flagged private since Aug 2025.

**Worked if:** you answer in chat; a session records it on the issue.

**Status:** OPEN

---

### 8. [UPGRADE] Turn on the spam gate for link submissions — ~10 min

**Filed:** 2026-08-15

**Why it matters:** you asked for "a very simple captcha... the box you click
that says I'm human" on the Community/Merch link-submission form. That's now
built (Cloudflare Turnstile, "managed" mode — it usually passes invisibly and
only shows a checkbox when Cloudflare's own risk signal is ambiguous). It
ships **inert**: no Cloudflare account exists yet, so the code detects the
missing key and skips verification entirely — the site keeps working
normally in the meantime, exactly as it does today (honeypot + rate limiter
only). Nothing breaks by leaving this OPEN.

**Steps:**
1. Log into `https://dash.cloudflare.com` (sign up free if you don't have an
   account — the domain does not need to be on Cloudflare for this to work).
2. Left sidebar → **Turnstile** → **Add site**.
   - Site name: anything, e.g. `Long Live submissions`.
   - Domain: `longlivets.com`.
   - Widget mode: **Managed**.
3. Cloudflare shows you two values: a **Site Key** and a **Secret Key**. Copy
   both.
4. From a terminal, in the repo, with the Vercel CLI set up (see
   `docs/deploy.md`):
   ```bash
   vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY   # paste the Site Key
   vercel env add TURNSTILE_SECRET_KEY             # paste the Secret Key
   vercel --prod
   ```
   Choose **Production** (and Preview, if asked) when each `vercel env add`
   prompts you for environments.

Full write-up: `docs/ops/community-merch-submissions.md`, Part 4.

**Worked if:** open the Community or Merch page — most of the time nothing
looks different (the widget passes invisibly). Submit a test link and
confirm it still works and still shows up as a GitHub issue.

**Status:** OPEN

---

### 9. [UPGRADE] Decide whether `main` should keep requiring PRs — ~2 min

**Filed:** 2026-08-19

**CORRECTION, 2026-08-19.** An earlier version of this item said "`main` is
completely unprotected" and gave steps to add protection. **That was wrong.**
`main` has been protected the whole time by an active repository **ruleset**
named `protect-main`. The check that produced the false reading was:

```
gh api repos/JW-Incorporated/swift2/branches/main/protection
-> 404 {"message":"Branch not protected"}
```

That endpoint only reports **classic branch protection**. Protection
implemented as a **ruleset** does not appear there and returns 404 anyway. The
correct check is:

```
gh api repos/JW-Incorporated/swift2/rulesets
gh api repos/JW-Incorporated/swift2/rulesets/18819106
```

The corroborating evidence that was in plain sight: **every commit on `main`
carries a `(#NNNN)` PR number.** Nothing has been pushed directly to `main` in
this repo for a long time, because nothing can be.

**What `protect-main` (id `18819106`, enforcement `active`) actually enforces:**

| Rule | Effect |
|---|---|
| `pull_request` (0 approvals required) | **A PR is required. Direct push to `main` is blocked** |
| `required_status_checks` → `build` | `build` must be green before merge |
| `non_fast_forward` | No force-pushes |
| `deletion` | `main` cannot be deleted |
| `bypass_actors: []` | **Nobody bypasses — not admins, not Actions** |

There is also a second ruleset named `main` (id `21070803`) with enforcement
**`disabled`**, so it currently does nothing.

**So there is no gap to fix, and nothing here is blocking.** This item is now a
decision, not a repair.

**The decision.** Joey said he likes Claude Code pushing straight to `main` on
low-risk projects. In *this* repo that has never been possible, and turning it
on means editing `protect-main`:

- **To keep things as they are (recommended):** do nothing. Work lands by
  branch → PR → `build` green → merge, which is what every runner and
  `auto-merge-content.yml` already do.
- **To allow direct pushes:** open the ruleset, remove the **Require a pull
  request before merging** rule and the **Require status checks to pass** rule,
  and keep **Block force pushes** + **Restrict deletions**. Ruleset UI:
  `https://github.com/JW-Incorporated/swift2/settings/rules`

**Recommendation: leave it alone.** longlivets.com is live, `auto-merge-content.yml`
lands PRs unattended, and `build` is the only thing standing between a bad
generated-file drift and production. The PR requirement costs one extra command
and is the reason `main` has stayed green.

**Worked if:** whichever you choose, `gh api repos/JW-Incorporated/swift2/rulesets/18819106`
reflects it, and a test PR still merges once `build` is green.

**Status:** OPEN

---

## DONE

<!-- Finished items move here with a date. Numbers keep their original ID.
     Never delete — the history is how we stop re-asking. -->

### 13. [UPGRADE] Add `ANTHROPIC_API_KEY` as a worker repo secret — ~2 min

**Status:** DONE — 2026-08-23 22:31 PDT, Joey: `gh secret set
ANTHROPIC_API_KEY --repo JW-Incorporated/swift2`. Unblocks the knowledge
engine's extract stage's live run (`PLAN.md` Stage 3).

---

### 12. [UPGRADE] Vendor/account decisions for the knowledge engine build — ~20 min total

**Status:** DONE — 2026-08-23 22:31 PDT, Joey answered 3 of 5 in chat: (1)
Google News replacement = **GNews free tier** (100 req/day), engineered
around via a hard daily cap well under the limit at the 6-runs/day ingest
cadence — no paid tier needed; (2) embedding vendor = **OpenAI**
(`text-embedding-3-large`, `dimensions: 1024` to match the schema),
`OPENAI_API_KEY` set as a repo secret; (4) Tumblr = both
`TUMBLR_CONSUMER_API_KEY` and `TUMBLR_SECRET_API_KEY` set as repo secrets,
unblocking the `tumblr` adapter. Items 3 (Reddit Data API approval status)
and 5 (Supabase anonymous-auth toggle) were not addressed and are **not**
lost — carried forward as new item #15, treating Joey's DONE edit on this
item as authoritative rather than reopening it.

---

### 1. [BLOCKING] Get the production site and CI off Wyatt's accounts — ~30–60 min

**Why it matters:** Wyatt has left the project, but the live product still runs
on his infrastructure. This is the single largest standing risk in the repo.
Nothing is broken right now, and nothing will warn you before it breaks — if
those accounts lapse or get closed, longlivets.com stops deploying and ~20
scheduled agent routines stop running, and the watchdog will report the runners
as a *quiet queue* rather than as dead.

Three separate dependencies, verified 2026-08-15:

- **Vercel — the live site.** `docs/deploy.md` lines 7–9: production runs
  entirely on **Wyatt's Vercel team**, with you added as a team member. Your own
  personal Vercel account was downgraded to Hobby and is **no longer in the
  deploy path at all**. A merge today deployed to
  `vercel.com/wjduvall-cmds-projects/swift2-web`.
- **GitHub — the scheduled runners.** `docs/agents/runners.md` lines 3–11: "ALL
  scheduled agent spend runs on Wyatt's account", covering ~20 routines
  (Marjorie, Austin, Karen, Kevin, Nils, Laura, Paul Blart, Tree). This was
  deliberate — it keeps your weekly limit free — so **do not just switch it off**
  without deciding where that spend moves to.
- **`wjduvall-cmd` is a bot identity, not just a person.** Repo automation reads
  it to recognise its own runs. It was deliberately left in place today for that
  reason; only his human notifications and email CC were removed.

**Steps:**
1. Go to `https://vercel.com/wjduvall-cmds-projects` → **Settings** → **Members**.
   Confirm you are listed as **Owner**, not just Member. If you are not, have
   Wyatt transfer ownership to you before he loses access.
2. Vercel → **Settings** → **Billing**. Confirm the payment method on file is
   yours, not Wyatt's. This is what actually stops the site if it lapses.
3. Decide where scheduled agent spend should live now that there is no second
   founder to protect a limit on. Tell a session the answer and it will update
   `docs/agents/runners.md` and the workflows.
4. Do **not** delete or rename the `wjduvall-cmd` GitHub account until step 3 is
   done — automation still identifies its own runs by it.

**Worked if:** you can open Vercel → Settings → Billing for the team that serves
longlivets.com and see your own payment method, and you are listed as Owner.

**Status:** DONE — 2026-08-15. **The premise above was WRONG and is retained
only so nobody re-raises it.** Joey: "wyatt is still an owner, he's just working
on a different project while i finish this one. We co-own his vercel team, and
our github accounts are connected." No lapse risk, no migration needed. What
stays true: he is not working on this project day to day, which is why #2144
removed him from alert pings. **Lesson: shared infrastructure is not abandoned
infrastructure — ask before escalating an ownership fact into a risk.**

---

### 2. [BLOCKING] Confirm Karen's cloud routine is actually enabled — ~5 min

**Status (2026-08-23): DONE — no longer needed.** Superseded: Wyatt disabled
his ENTIRE fleet (all 21+ routines, including this Karen trigger) on
2026-08-21 as part of a full handoff (issue #2258) to move everything to
Joey's account instead of chasing individual routines on Wyatt's. Karen was
recreated fresh on Joey's account 2026-08-23 (`trig_01TmYaZgnecrEp9mkeV3Gq6X`,
current prompt from `docs/agents/runner-prompts/karen-nightly.md`, not the
stale trigger text that was originally flagged here) — see item #10 for
what's left to make her (and everything else) actually live.

Original diagnosis (2026-08-16), kept for history: Karen was a scheduled
Claude Code routine on **Wyatt's** account, invisible to any Swift2 session,
last real run 2026-08-09 (PR #1850). A ready-to-paste prompt was drafted for
Wyatt to check/fix it directly. Overtaken by the full-fleet migration before
Wyatt acted on it.

---

### 10. [BLOCKING] Strip Claude_Code_Remote from 22 new routines — ~20-30 min

**Status:** SKIP — Joey (2026-08-23): "this is an illogical approach. Instead
we remove the rule in `docs/agents/routine-invariants.md` invariant #2
forbidding any routine except the Routine Auditor from holding the
`Claude_Code_Remote` connector. That rule doesn't make sense here."

**Resolution:** removed invariant #2 instead of doing the 22-routine manual
strip (PR #2287, full rationale in `docs/decisions.md` 2026-08-23 — flagged
the tradeoff first: the connector grants trigger-creation, and the invariant
existed specifically to close off the 2026-07-25 runaway-loop failure mode;
Joey heard it and accepted the risk). All 22 routines then enabled directly
with the connector left in place — Auditor, Marjorie ×2, Content Shift,
Vault Run, Karen, Kevin ×4, Nils, Austin, Laura, Paul Blart, Growth, Tree,
Answerer, Rumor Desk, Stylist, Cross-Link builder, News Triage, Photo
Enrichment worker. Lex depth stays disabled (warm spare per issue #2258,
never test-run). Two of the original nine undocumented routines — **Audio
Curator** and **Mood Chat builder** — are gone for good, absent from
Wyatt's export and his full dashboard walk; nothing to recreate.

Original ask (2026-08-23), kept for history: a manual per-routine UI pass
to strip the connector before enabling, since the API can't do it
(`mcp_connections: []` returns 200 and silently keeps the connector) and
invariant #2 required it. Superseded by removing the invariant instead.

---

### 11. [UPGRADE] Six stale duplicate routines from a July handoff — ~5 min

**Status:** DONE — 2026-08-23. Joey: "let's kill the duplicate routines."
Deleted all 6 via the routines UI (no API delete action exists) — Content
Shift, Nils, Austin ×2, Marjorie ×2, all from the July 2026 opposite-
direction handoff. Verified via a clean page read afterward: only the
intentionally-paused Lex depth remains paused; no duplicate names left.

**Reconciliation note (2026-08-24):** this DONE record and a stale OPEN
copy of the same item (with a since-superseded "REFINED" instruction set)
existed in the file simultaneously, likely from a parallel branch's merge
against `main` picking up both versions during tonight's overnight build.
Removed the stale OPEN duplicate; this DONE entry is authoritative.

---

### 3. [UPGRADE] Device-check the bottom nav — ~2 min

**Why it matters:** the nav has been fixed three times from code, and each time
a real phone found something the tests did not. Merged 2026-08-15 (PR #2140):
the icon-only threshold moved 5 → 7 and labels dropped 11px → 10px, so all six
tabs should now show **words under the icons**.

**Steps:**
1. Open `https://www.longlivets.com/` on your phone. Hard-refresh.
2. Confirm six tabs, each with a readable label, none wrapping to two lines.
3. If your phone is narrow (360px-class), check the labels still fit.

**Worked if:** six labelled tabs, one line each, no overlap.

**Status:** DONE — 2026-08-15, confirmed on his phone: "there's still 6 but they
now all have text, and honestly it looks really good with 6." This also settled
the nav question permanently — six separate tabs, and PR #2116's merge-to-five
was closed unmerged.

---

