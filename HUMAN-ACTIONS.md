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

### 24. [UPGRADE] Unblock the video seed — code fix is in, just re-run the command — ~2 min

**Filed:** 2026-08-26

**Why it matters:** issue #725. Running the four seed commands today,
`db:seed:content` (718 items) and `db:seed:theories` (74) succeeded;
`db:seed:videos` failed:

```
VIDEO SEED FAILED: duplicate key value violates unique constraint "video_work_slug_key"
```

**Root cause (diagnosed from the repo, no DB access needed):**
`video_work.slug` is globally unique, but `scripts/seed-videos.mjs` used to
delete-then-insert per era file only. Commit 46a88202 (2026-08-25, "Classify
dated content by calendar era", #3317) correctly moved 3 videos to a
different era file each (real-world-date rule, #3315). Production was last
seeded *before* that move (2026-08-24, item #18), so the old-era row for
each moved slug was still sitting in prod when the new-era insert tried to
claim the same slug — the global unique constraint rejected it.

**Fixed in code, this session:** `scripts/seed-videos.mjs` now upserts every
video by `slug` (`on conflict (slug) do update ...`) instead of
delete-then-insert scoped to one era, and deletes only slugs that no longer
appear in ANY seed file (genuine removals). Verified for real against a
fresh ephemeral local Postgres (all 27 migrations applied, `embedded-postgres`
— same mechanism as items #14/#18's own verifications): reproduced the exact
#725 scenario (inserted a video under its old, pre-move era_slug, then ran
the real script), confirmed it relocates cleanly with no duplicate-key error,
and confirmed a second run is a clean no-op (215 rows both times). PR:
`docs/2026-08-26-decisions-and-seed-fix` branch.

**Steps:**
1. Once that PR merges to `main`, from a checkout with `apps/worker/.env`,
   just run: `npm run db:seed:videos`. Nothing else needed — content and
   theories are already caught up.

**Worked if:** the command prints `seeded videos: N from 12 file(s)` with no
error, and production's `video_work` table matches `supabase/seed/videos/**`.

**Status:** OPEN

---

### 23. [BLOCKING] BACKUPS launch gate (#680) — read Supabase plan/backup status off the dashboard, run one restore drill against production's own bytes — ~10 min

**Filed:** 2026-08-26

**Why it matters:** the BACKUPS launch gate has been 🟡 since 2026-08-12. The
restore mechanism itself is built, tested, and green in CI (#1890) — a drill
that backs up, restores into a scratch database, and verifies by checksum.
What's left needs your own Supabase login, not more engineering: (1) nobody
has confirmed whether this project actually has automated daily backups or
PITR — on the free plan the answer is "none," which needs to be a recorded
accepted risk, not an assumption; (2) the drill has only ever run against a
fixture built from repo seeds, never against production's real bytes.
Checked today for any agent-side workaround (env vars, `gh secret list`,
Supabase CLI/MCP/management-API token) — none exists; this is genuinely
founder-only. Full detail: `docs/backup-restore.md` §2 and §6.

**Steps:**
1. Open the Supabase dashboard for the Long Live project → **Settings** →
   **Billing** (or **Database** → **Backups**). Note: (a) the plan tier,
   (b) whether **Database → Backups** lists automated daily backups, (c) the
   retention window, and whether **PITR** is enabled/available.
2. Record those three answers in `docs/backup-restore.md` §6 (there's a
   table row format already there to follow), or tell a session the answers
   in chat and it will write them in.
3. From a machine/checkout that has `apps/worker/.env` (`SUPABASE_DB_URL`),
   run one real drill, read-only against production:
   ```bash
   node scripts/backup-restore-test.mjs \
     --source "$SUPABASE_DB_URL" \
     --target "postgres://postgres:postgres@127.0.0.1:5432/scratch?sslmode=disable" \
     --keep
   ```
   (Needs a local scratch Postgres reachable at that target — `npm i
   --no-save embedded-postgres` then point `--target` at a local instance,
   or any throwaway Postgres you already have. The script refuses to write
   to production or to any `*.supabase.co` host, by design.)
4. Paste the pass/fail output (or tell a session) and it'll log it as a new
   row in `docs/backup-restore.md` §6's drill log and flip the BACKUPS gate
   in `docs/launch-readiness.md` once both items are done.

**Worked if:** `docs/backup-restore.md` §6 has a drill-log row sourced from
production (not the fixture) marked **PASS**, and §2's plan/backup-status
table is filled in instead of "UNVERIFIED."

**Status:** OPEN

---

### 22. [BLOCKING] Photo-Enrichment worker's scheduled environment has total network egress block — 3 consecutive no-op runs — ~5 min

**Filed:** 2026-08-25

**Why it matters:** the Photo-Enrichment worker (issue #762) needs to fetch
press pages and Instagram embed HTML, and download/vision-confirm candidate
images, before it can add anything — that's the whole verify-first design of
the protocol. The scheduled environment this trigger runs in has **all
outbound HTTPS blocked**, not just image-host CDNs: `curl`/`WebFetch` to a
neutral control domain (`example.com`) and to `instagram.com` both fail
(`WebFetch` → `EGRESS_BLOCKED`; the proxy status endpoint logs `gateway
answered 403 to CONNECT`). Only `WebSearch` (server-side, bypasses this
session's egress proxy) and `api.github.com` are reachable. This has now
happened on **three separate firings** — 2026-08-24 ~06:40 UTC, 2026-08-24
~20:55 UTC, and 2026-08-25 — each one a complete no-op (0 photos, 0 posts)
because nothing could be verified. Every future firing will keep hitting the
same wall until the environment's network policy changes.

**Steps:**
1. Find the scheduled trigger that fires the Photo-Enrichment worker prompt
   (the one whose stored prompt starts "You are the Photo Enrichment worker
   for the Long Live app..." and references issue #762) — likely in
   `claude.ai/code` under this repo's triggers/schedules, or wherever
   scheduled sessions for `JW-Incorporated/swift2` are managed.
2. Open that trigger's environment configuration and change its **network
   policy** from whatever fully-blocking setting it currently has to one
   that permits general outbound web access (the level other manually-run
   or differently-configured sessions in this repo already have — e.g. the
   photo-sparsity work landing today via PR #3266 clearly had working
   outbound fetch).
3. Save, and let the next scheduled firing confirm the fix (a run that
   posts an actual PR with photos/posts added, or at minimum a comment that
   no longer reports `EGRESS_BLOCKED`, means it worked).

Background/docs on how environments and their network policy are
configured: `https://code.claude.com/docs/en/claude-code-on-the-web`.

**Worked if:** the next Photo-Enrichment run's comment on issue #762 no
longer reports an egress block, and actually adds/rejects real candidates
instead of a 0/0/0 no-op.

**Update (2026-08-25, later firing):** this run had working egress —
`example.com`, `billboard.com`, and `instagram.com` all reachable — and
shipped PR #3296 with real photo/focalPoint work (see the run's comment on
#762). That matches the "worked if" signal above. Leaving Status as OPEN
since one good run isn't proof the underlying policy was changed on purpose
rather than being transiently available; a founder call is still the way to
close this out for good.

**Update (2026-08-26):** egress reachable again (wikimedia, billboard,
forbes, variety, yahoo all 200) — PR #3343 shipped with real photo work.
Third good firing in a row.

**Update (2026-08-27):** egress reachable again (`api.github.com` +
outlet CDNs all 200) — see this run's PR and #762 comment. Fourth
consecutive good firing since the 08-25 fix. Still leaving Status as OPEN
per the above — a founder call remains the way to confirm the policy
change was intentional and close this for good, but at this point the
egress block looks resolved.

**Status:** OPEN

---

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
   (Authentication → Providers). I can't reach that toggle. **Update
   (PLAN.md Stage 11, PR #2319):** the schema (`clown_conversation`/
   `clown_turn`/`bot_prediction`/`clown_pinned_theory`, `supabase/
   migrations/20260904000000_clown_sessions.sql`) and the code (session
   resolution, conversation continuity + rolling summary, per-user daily
   cap, prediction persistence) are built and tested — every write path
   genuinely fails closed to today's stateless behavior while this toggle
   is off, confirmed by both the tests and an independent Codex review.
   **Update (2026-08-24, fix branch `fix/clown-sessions-codex-findings`):**
   that Codex review's three bugs — the client never round-tripping the
   session id, the rolling-summary fold not being transactional, and
   persisted memory being write-only — are now fixed (see item #14's
   addendum for the migration, and this branch's diff for the code):
   `ClownChat.tsx` now captures the `x-clown-session` response header and
   resends it on the next message; the fold is one atomic RPC call
   (`fold_clown_conversation`, item #14's addendum) instead of two
   independent requests; and the route now loads the stored rolling summary
   + recent turns back into the model's context on a returning conversation
   (`clown-memory.ts`'s new `loadClownHistory`) instead of only ever
   writing. A fourth issue the same review round found — the per-user daily
   reservation firing before the route even knew whether a model call would
   happen (kill-switch/missing-key/global-cap misses still consumed the
   user's allowance) — is fixed too, moved inside `runClownAgent` to fire
   only once a model call is genuinely about to be attempted. **Still hold
   off flipping the toggle until item #14's two new migrations are applied**
   (same batch as the rest of that item) — the code fix alone doesn't apply
   the migration or flip the toggle for you.

   **Update (2026-08-24, PR #2325 merged) — I ran that pending Codex review
   myself before merging. Correcting the fix branch's own self-report above,
   which claimed more than the independent review confirmed: still do NOT
   flip the toggle, real issues remain.** Genuinely fixed and independently
   verified: the SECURITY DEFINER grant scoping (item #14), and the fold RPC
   is now provably atomic for its stated claim (a forced mid-call error
   rolls back both the delete and the update together — tested against a
   real ephemeral Postgres, not just asserted). Real issues still open:
   - **New this round, not present before**: loaded conversation history
     (rolling summary + recent turns) is fed into the model's system prompt
     without going through `screenConversation` the way the client-supplied
     transcript is — stored user text becomes elevated-trust context an
     attacker's own prior turn could poison. Needs the same screening pass
     applied to `loadClownHistory`'s output before `clown-agent.ts` uses it.
   - `clown-memory.ts`'s `getConversation`/`loadClownHistory` don't catch
     fetch/JSON failures, so once real sessions exist a Supabase hiccup
     would 500 the live chat route instead of degrading to no-memory —
     confirmed this can't fire TODAY (I verified `resolveClownSession` is
     fully try/caught and Supabase itself rejects every signup attempt
     while the toggle is off, so `memorySession` is null on every request
     right now, meaning `loadClownHistory` is never actually called yet) —
     but it needs a try/catch before the toggle flips.
   - The session token lives only in a `ClownChat` component ref, so
     switching modes or reloading loses it — each return visit mints a
     fresh anonymous identity, which also resets the per-user daily cap.
     Needs to move to something that survives remount (the app's existing
     `store.tsx`, or `localStorage`).
   - A request that gets denied for being over the per-user cap still
     consumes the shared global reservation before returning the denial —
     minor, but real.
   - The fold RPC doesn't verify the turns it deletes actually belong to
     the conversation it's updating, and doesn't check affected-row counts.
   None of this is live-exploitable today — confirmed directly, not
   assumed, since every path requires a resolved anonymous session and
   Supabase itself is the gate keeping that null. But it means the toggle
   genuinely isn't ready to flip yet. Full findings: PR #2325's review,
   Codex session `01a033dd-7645-7373-827e-c22739c7e943`.

   **Update (2026-08-24, fix branch `fix/clown-sessions-final-hardening`) —
   all 5 remaining findings from PR #2325's review are now fixed, third
   pass:** loaded conversation history (rolling summary + recent turns) now
   runs through `screenConversation`/`screenInput` in `route.ts` before ever
   reaching the agent loop, the same gate the client-supplied transcript
   already goes through — a stored turn/summary that would fail the screen
   now gets the same fixed refusal, model never called (tested: a blocked
   turn and a blocked summary each caught before `runClownAgent`).
   `clown-memory.ts`'s `getConversation`/`loadClownHistory` now catch
   rejected fetches and malformed JSON, degrading to `null` instead of
   throwing into `route.ts`'s `POST` — same fails-closed discipline
   `resolveClownSession` already follows, including a warn-once log (tested:
   a rejected fetch and a malformed-JSON response on both the conversation
   lookup and the recent-turns lookup all resolve to `null`, never throw).
   The session token now persists via `clown-session-storage.ts`
   (localStorage, mirroring `progress.ts`'s existing pattern) instead of
   living only in a `ClownChat` component ref, so it survives a mode-switch
   remount or a page reload (tested: write-then-independent-read round-trip,
   simulating a fresh mount). A user-cap denial in `clown-agent.ts` now
   calls a new `MoodUsage.release()` to give back the shared global
   reservation it had already taken, so a cap-denied request no longer
   wastes shared budget (tested: `usage.used()` is 0 after a denial, 1 after
   a call that actually proceeds). `fold_clown_conversation` has a v2
   migration (`20260907000000_clown_fold_conversation_v2.sql`) scoping its
   delete by `conversation_id` too (not just the turn ids) and raising when
   the update affects zero rows — verified against a real ephemeral local
   Postgres: idempotent across all 26 migrations applied twice, a turn
   genuinely owned by the caller but belonging to a DIFFERENT conversation
   survives a fold scoped to the right one, and a fold against a
   nonexistent/invisible conversation id raises instead of silently
   succeeding. Also made a genuine attempt at the LOW file-length finding:
   `ClownChat.tsx` 387→301 lines (`ClownChatTitlebar.tsx`/
   `ClownChatComposer.tsx`/`useChromeOffset.ts` split out) and
   `clown-agent.ts` 334→311 lines (`clown-agent-caps.ts` +
   `clown-agent-prompt.ts`'s new `dispatchReadBlocks`) — both land just
   above the 300-line guideline, not under it, noted honestly rather than
   fragmenting further. **Still do NOT flip the toggle** until this branch's
   `codex:rescue` review comes back clean (same category of risk as every
   prior pass — schema + the live chat route's context-assembly logic).

   **Update (2026-08-24, same branch `fix/clown-sessions-final-hardening`,
   fourth pass) — architect (Fable) escalation after round 3's own
   `codex:rescue` review found recurring trust-boundary gaps; implementing
   Fable's decided design, not another incremental fix:**
   1. **Session credential moved from a client-visible token to an
      `HttpOnly; Secure; SameSite=Strict; Path=/api/clown` cookie**
      (`clown_session`) — round 3's `x-clown-session` header/localStorage
      approach handed the raw Supabase access+refresh token pair to client
      JS; the client now never sees it at all, the browser's cookie jar
      handles persistence and same-origin resend with zero client code.
      `clown-session-storage.ts` (the round-3 localStorage module) is
      deleted outright, along with its test and the now-dead
      `withSessionHeader`/`nextSessionToken` helpers.
   2. **The stored conversation summary is demoted into the first
      user-role message** (wrapped in `<conversation_memory>` tags, with a
      literal `</conversation_memory>` stripped from the stored text first
      against a tag-breakout attempt), never promoted into a system block —
      round 3's second system block is removed. Fold-time screening
      (`clown-memory.ts`'s `maintainRollingSummary`) is now per-turn and
      role-aware (mirrors `screenConversation`'s dispatch), silently
      dropping a turn that fails its own screen from what gets folded
      rather than surfacing a refusal (round 3's regression). The route's
      own `screenInput` pass over the folded summary text is removed —
      replaced by the fold-time screening above; the route's
      `screenConversation` pass over loaded TURNS is unchanged.
   3. **Schema fix:** `clown_conversation` now carries `unique (user_id)`
      (`20260908000000_clown_conversation_unique.sql`, with a dedupe step
      for any pre-existing duplicate rows) — one conversation per user is
      the actual identity model. Conversation creation is now a PostgREST
      upsert (`on_conflict=user_id`, `resolution=merge-duplicates`) with a
      fresh `expires_at`, so an EXPIRED row (still physically present under
      RLS) is recoverable instead of permanently blocking creation.
      `getConversation` now distinguishes a confirmed-empty read from a
      failed one; only confirmed-empty falls through to creation — a read
      failure degrades to no-memory instead of risking a duplicate
      conversation. Also fixed the day-keyed `MoodUsage.release()` bug
      (a per-user cap reservation taken before midnight, released after,
      could decrement the wrong day's counter).
   Verified: `npm run typecheck --workspace=@swift2/web` clean, full suite
   green (216 files / 3543 tests), and the new migration checked against a
   real ephemeral Postgres — idempotent across all 27 migrations applied
   twice, dedupe keeps the most-recently-active row, the unique constraint
   is live, and the upsert recovers from an expired-row collision (reset
   summary + fresh `expires_at`, no duplicate row).

   **RESOLVED, 2026-08-24 12:10 PDT — PR #2328 merged, this whole thread is
   closed out.** Two more `codex:rescue` rounds ran on the architect's
   design (5 review rounds total across this item's history): round 4
   confirmed the architecture itself is sound (both harder pieces — cookie
   session, demoted summary — fully held) and found 3 small mechanical
   gaps (one response path missing its cookie header, an over-loose
   "confirmed empty" check that could wrongly reset real data, a stale doc
   line); a narrow fix closed those; a final round 5 review confirmed both
   real claims genuinely FIXED with real regression tests, no remaining
   system-role summary path anywhere, no defect in either of the two
   latest migrations. What's left is cosmetic, not functional, noted for
   whoever's next through this file: a missing test assertion on the
   cookie header for one specific response branch (the code is right, the
   test just doesn't check it — `route.test.ts`'s loaded-history-refusal
   case), one line of leftover historical wording in `MAP.md`, and a
   non-blocking note that user/assistant turn-pair writes aren't
   transactional (a partial failure could store one side of an exchange
   without the other — flagged non-blocking by the reviewer itself).

   **Anonymous-auth toggle: safe to flip whenever you're ready.** The
   session credential the toggle would start minting is now
   `HttpOnly`/never client-visible, stored conversation history can't
   reach the model with elevated trust, and conversation identity/rate-
   limit accounting are both correct. Nothing left blocking it — do this
   at the same time as item #14's migration batch, since the schema this
   depends on isn't live until those apply.

**Worked if:** you tell me the Reddit outcome in chat. Once item #14's
migrations are applied, flip the Supabase toggle whenever you like — the
code is ready.

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

**Progress (2026-08-24):** Etsy Open API done — `ETSY_KEYSTRING` and
`ETSY_SHARED_SECRET` are saved (values never seen by any session, key names
only). Awin (step 3, referral revenue) also done — `AWIN_API` saved, same
way. Reddit script app (step 1) still needed before the marketplace-
research work can start — no code exists yet to consume any of these
credentials, this was just registering accounts/keys ahead of that build.

**Worked if:** the `.env` holds a Reddit client id/secret and an Etsy keystring.

**Status:** OPEN - Etsy is done, Awin application submitted, Reddit open (cannot figure it out, sent support ticket)

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

### 26. [MERCH] Record owner decisions D1 and D3 for the autonomous marketplace

**Filed:** 2026-08-29

**Decision received (2026-08-30):** Joey chose D1-a: list the full official
store catalog without affiliate links to the official store, with a secondary
Amazon affiliate alternative only where the same item is verified there. Joey
also approved D3: "inspired-by" yes, bootleg no — reject fan-made items that
reprint official art, tour graphics, or photos of Taylor.

**Status:** DONE — choices recorded in `docs/decisions.md` and
`docs/PLAN.merch-autonomy.md`; downstream E4 and E5 work must follow them.

---

### 25. [BLOCKING] Two PRs stuck with zero GitHub Actions check-suite — one is the live IG/X posting bug fix — ~5-15 min, needs your GitHub UI access

**Filed:** 2026-08-26

**Why it matters:** you asked why Instagram posts have been silent while X
posts keep firing, and why 4 posts went out at once instead of ~daily.
**Both are fully diagnosed and fixed** (see the writeup below/in chat), but
the fix — **PR #3372** — cannot merge: GitHub Actions never creates a
`build`/`CodeQL`/`tree-pr-mail` check-suite for this branch at all, so the
required `build` status check (branch protection, `bypass_actors: []` —
nobody can bypass it, not even you as admin) never appears and the merge
stays blocked. A second, unrelated PR (**#3371**, a routine content batch)
hit the identical symptom, as did its predecessor **#3369** before it. Two
separate agent investigations ruled out: workflow files disabled, repo
Actions permissions, path filters, draft-PR suppression, an org-wide
outage (other same-window PRs got full check-suites fine), and fork-PR
restrictions (both are same-repo branches, not forks). Pushing an empty
commit and closing/reopening the PR did not trigger anything either.

**Status:** DONE — 2026-08-26 ~10:04 PDT. Both #3372 and #3371 merged on
their own not long after Joey checked the Settings/Actions UI (root cause
of the missing check-suite never conclusively identified, but it resolved
itself rather than needing a workaround branch). Confirmed on `main`:
`scripts/social/lib/queue.mjs`'s `MAX_POSTS_PER_RUN = 1` (was 5).

---

### 21. [BLOCKING] Grant the Paul Blart runner read access to Dependabot alerts — ~5 min

**Filed:** 2026-08-17

**Why it matters:** Paul Blart's whole job is "zero CVEs sitting unseen." Right
now he **cannot see them at all.** The token the scheduled runner uses returns
`403 Resource not accessible by integration` on every Dependabot security-alert
endpoint, and the 403 response literally names the missing scope:
`X-Accepted-GitHub-Permissions: vulnerability_alerts=read`. So the weekly patrol
can review version-bump PRs but is **blind to the actual CVE feed** — a critical
alert could be open today and no report would show it. This is the one thing that
makes the whole desk trustworthy, and it is off.

Endpoints confirmed 403 on 2026-08-17: `dependabot/alerts`,
`vulnerability-alerts`, `automated-security-fixes`. (`code-scanning/alerts`
returns "Code Security must be enabled" — that's the separate CodeQL toggle, see
issue #1894, not this item.)

**Correction, 2026-08-24 — the original steps below were wrong, sorry for the
runaround.** You tried them and found none of your 4 installed GitHub Apps
(Claude, Vercel, Slack, Supabase) show anything about Dependabot when opened.
That's not you missing a menu — **it's genuinely not there to find.** Paul
Blart is a Claude Code cloud routine, so its GitHub access runs through the
`Claude` app itself (Anthropic's own GitHub App). A GitHub App's installer
can only grant permissions the app's own manifest requests; you can't add a
scope to someone else's app from the installed-apps screen, no matter which
of the 4 you click. `X-Accepted-GitHub-Permissions: vulnerability_alerts=read`
was real, but the fix isn't a checkbox anywhere in that UI.

**The actual fix, now built** (`.github/workflows/dependabot-alerts-snapshot.yml`
+ `scripts/dependabot-alerts-snapshot.mjs`, PR pending): a GitHub Actions
workflow — which unlike a routine CAN use a dedicated repo secret — fetches
the open alerts once a week and publishes them into one persistent tracking
issue titled "Dependabot alerts — automated snapshot," which Paul Blart's
routine now reads instead (`docs/agents/runner-prompts/paul-blart-run.md`
updated). This needs one thing from you: a fine-grained PAT, scoped to just
this repo, with exactly the one permission that was missing.

**Steps:**
1. Go to `https://github.com/settings/personal-access-tokens/new`.
2. **Token name**: something identifiable, e.g. `swift2-dependabot-alerts-read`.
3. **Resource owner**: `JW-Incorporated`.
4. **Repository access**: **Only select repositories** → `swift2`.
5. **Permissions** → **Repository permissions** → find **Dependabot alerts**
   → set to **Read-only**. (Nothing else needs a permission — leave every
   other row at "No access.")
6. **Generate token**, copy the value (starts `github_pat_...`).
7. From a terminal, in the repo: `gh secret set DEPENDABOT_ALERTS_PAT --repo
   JW-Incorporated/swift2` and paste the value when prompted (or `--body`
   with the value piped in, never typed where it could land in shell
   history) — same pattern as `HUMAN-ACTIONS.md` #13's `ANTHROPIC_API_KEY`
   earlier. I can't run this myself — `gh secret set` is guard-denied,
   human-only on purpose.

**Worked if:** `gh secret list --repo JW-Incorporated/swift2` shows
`DEPENDABOT_ALERTS_PAT` (value stays hidden either way), and the next Monday
21:00 UTC run of `dependabot-alerts-snapshot.yml` updates the tracking issue
with either a real severity-ranked table or "0 open alerts" — not the
"PAT not configured yet" notice. You can also trigger it manually anytime via
**Actions → dependabot-alerts-snapshot → Run workflow** (uncheck "dry run"
to actually publish).

**Done 2026-08-24 (Joey):** set `DEPENDABOT_ALERTS_PAT`, confirmed present
via `gh secret list`. Verified end-to-end same day rather than waiting for
Monday — triggered the workflow manually (`gh workflow run
dependabot-alerts-snapshot.yml -f dry_run=false`), it completed
successfully, and tracking issue #3185 updated with a real fetch (no more
"PAT not configured" placeholder). Paul Blart can now actually see the CVE
feed.

**Status:** DONE

---

### 20. [UPGRADE] Register a DMCA agent with the U.S. Copyright Office — ~15 min + a small filing fee

**Filed:** 2026-08-24

**Why it matters:** Joey decided (2026-08-24, in chat) to register a DMCA
agent. `apps/web/lib/longlive/legal.ts`'s takedown-notice section (PR #2332)
now says "we are in the process of registering" — that line needs to become
"is registered" once this is actually done, so don't leave this open long.
This needs your own identity/account and a payment method — no agent can do
it for you.

**Steps:**
1. Go to `https://dmca.copyright.gov` and create/sign in to a U.S. Copyright
   Office account.
2. Start a new **"Designation of Agent to Receive Notification of Claimed
   Infringement"** filing.
3. Fill in: Service Provider Name → `JW Labs LLC` (also list `Long Live` /
   `longlivets.com` as an alternate name if the form asks for one). Agent
   name/title → whoever should actually receive DMCA notices (you, or a
   role). Agent contact → use `legal@longlivets.com` (PR #2332) so it
   matches the published policy. Public contact address → same
   postal-address call as item #19/legal.ts (currently omitted per counsel;
   the Copyright Office may require a real one for this specific filing —
   check the form).
4. Pay the filing fee (check the current amount on the site — it's changed
   before, don't trust a number from an old source) and submit.
5. Tell a session once it's filed — the confirmation gives you the agent's
   registration number, which is worth recording in `docs/decisions.md`.

**Worked if:** `dmca.copyright.gov`'s public agent directory shows JW Labs
LLC / Long Live with a live registration, and `legal.ts`'s DMCA line is
updated to say "is registered."

**Status:** DONE

---

### 18. [UPGRADE] Refresh the production database — content seed has drifted, not urgent — ~15 min, needs Wyatt

**Filed:** 2026-08-24

**Why it matters:** issue #725 — production `month_item`/`track_note`/
`theory`/`video_work` tables are stale against `supabase/seed/**`. The issue
itself says this isn't urgent — it only matters before the Android device
test (item #17 below), so bundle them.

**Steps:**
1. Whoever has `apps/worker/.env` (`SUPABASE_DB_URL` — Wyatt) runs `npm run
   db:seed:content`, `db:seed:tracks`, `db:seed:theories`, `db:seed:videos`.

**Worked if:** production content matches the current seed files.

**Status:** DONE — content/tracks/theories seeded clean. Videos seed
failed on a real bug (`video_work_slug_key` collision); root cause,
code fix, and the one command to unblock it are filed separately as
item #24.

---

### 17. [UPGRADE] Android — real-device test is the only thing left before Play Store — ~15 min, needs Wyatt

**Filed:** 2026-08-24

**Why it matters:** issue #530. Engineering is done — two draft PRs (#42,
#67) hold a working Expo/EAS build plus the shipping checklist. The only
remaining blocker is running it on a real Android phone, which needs
Wyatt's account/hardware. `docs/definition-of-done.md` row 8's "#1815 —
unshipped" note is stale; #1815 is a merged PR, not the actual tracker — the
live tracker is #530.

**Steps:**
1. Wyatt installs the EAS build from #67's checklist on a real Android
   phone and runs through it.
2. Report back pass/fail; if it passes, the Play Store submission steps are
   already written in #67.

**Worked if:** #530 closes with a real-device pass recorded.

**Done 2026-08-24 (Joey):** tested the EAS build on a real Android phone —
works great. #530 closed with the pass recorded. Next step per #67's
checklist: Play Store submission (separate, not blocking this item).

**Status:** DONE

---

### 14. [BLOCKING] No `apps/worker/.env` in knowledge-engine worktrees — 10 migrations unapplied against prod, pgvector untested, one real security gap to close first

**Filed:** 2026-08-23

**Security finding — FIXED IN CODE (2026-08-24, fix branch
`fix/clown-sessions-codex-findings`), still needs applying like every other
migration below:** `increment_usage_daily` (from
`20260902000000_usage_daily.sql`, used by Stage 3/6/11's daily caps) is a
`SECURITY DEFINER` function that takes a caller-controlled scope string
and, once applied, would have been callable by anyone holding the site's
public anon key (embedded client-side by design) via Supabase's
auto-generated REST RPC endpoint — nothing in the original migration
revoked its default `PUBLIC` execute grant. A new migration,
`supabase/migrations/20260905000000_usage_daily_grants.sql`, closes this:
`revoke execute ... from public` + explicit grants to only the two roles
that actually call it (`authenticated` — the web app's anonymous-auth
sessions; `service_role` — the worker). It also re-creates the function to
check, for an `authenticated` caller specifically, that the scope it's
asking to touch is its OWN `clown-chat:<uid>` scope — granting to
`authenticated` alone would otherwise reopen nearly the same hole, since
Supabase hands that role to every anonymous sign-in (i.e. every site
visitor, once the toggle below is on). Verified for real: applied
alongside every other migration twice against a real ephemeral local
Postgres, confirmed `PUBLIC` has no execute grant, `authenticated`/
`service_role` do, an authenticated caller can increment its own
`clown-chat:` scope but is rejected touching `extract`, and `service_role`
can still touch any scope. Same fix (step 1 below) applies it — nothing
extra needed.

**Update:** Stage 1 (worker fixes, PR #2300) hit the identical gap for the
same reason — two more migrations
(`20260823010000_news_sources_seed_wave2.sql`,
`20260823020000_news_raw_item_resolved_tier.sql`) are written and merged to
`main` but not yet applied against production, because that worktree also
had no `apps/worker/.env`. All three migrations below need one
`npm run db:migrate` run from a checkout that has the real env file — do
them together, one command, once `main` has all three.

**Update 2026-08-24 — no longer reddening CI, still BLOCKING the feature.**
`news-worker.yml` had been crashing every 4h (exit 1) on the resulting
schema-cache errors (`resolved_tier`, `symbol_lexicon`, `news_story.extracted_at`),
which paged daily via watchdog.yml's cadence check. `apps/worker/src/index.ts`
now classifies "schema not yet migrated" errors (`/schema cache|does not exist/`)
as a degraded no-op that keeps the Action green — matching the worker's
documented "zero sources = no-op usefully" posture — while any *genuine* error
still fails the job. This removes the CI noise but does **not** substitute for
this item: the Current tier stays empty and the knowledge engine cannot ingest
until these migrations are applied. Once `npm run db:migrate` runs, the worker's
same calls succeed and it resumes real work automatically.

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

**Addendum (Stage 11, sessions/memory):** one more migration,
`supabase/migrations/20260904000000_clown_sessions.sql`
(`clown_conversation`/`clown_turn`/`bot_prediction`/`clown_pinned_theory` —
`usage_daily` reused with a new scope, not a new table). Same root cause,
same fix. Verified for real: applied all 23 migrations twice against a real
ephemeral local Postgres, clean idempotent re-apply both times — but this
one needed one extra step the others didn't: vanilla Postgres has no `auth`
schema (that's Supabase's own GoTrue service, not anything a migration in
this repo creates), so I stubbed a minimal `auth.users(id uuid)` table and
an `auth.uid() returns uuid` function locally just to prove the DDL/FK/RLS-
policy SQL itself is valid Postgres syntax against a real FK target. That
stub is NOT a substitute for testing against the actual Supabase project —
the real `auth.uid()` returning a genuine anonymous-auth JWT's user id, and
therefore whether the RLS policies actually scope reads/writes correctly for
a real anonymous session, can only be verified once both this migration is
applied AND the toggle in item #15/2 is flipped. Flag this for a look once
both are true, not just the migration alone.

**Addendum (2026-08-24, Codex review fix pass on PR #2319, fix branch
`fix/clown-sessions-codex-findings`):** two more migrations closing the
findings this item and item #15/2 documented —
`supabase/migrations/20260905000000_usage_daily_grants.sql` (the
`increment_usage_daily` grant-scoping fix, see this item's top section) and
`supabase/migrations/20260906000000_clown_fold_conversation.sql` (a new
`fold_clown_conversation` RPC so the rolling-summary fold's delete + summary
patch happen as one atomic transaction instead of two independent
requests — item #15/2's third finding). Same root cause, same fix. Verified
for real: applied all 25 migrations twice against a real ephemeral local
Postgres (same `auth.users`/`auth.uid()` stub as the Stage 11 addendum
above), clean idempotent re-apply both times; then, on that same local
cluster, exercised both new functions directly under simulated
`authenticated`/`service_role` sessions (real `SET LOCAL role` + a stubbed
JWT claim inside an explicit transaction, mirroring how PostgREST actually
scopes a request) — confirmed the grant scoping (item #14 top) and, for the
fold RPC, confirmed a call wrapped in a transaction that's then rolled back
leaves BOTH the summary patch and the turn deletion undone together (proof
the two writes are genuinely one atomic unit), and that a forced mid-call
error (a malformed delete-target id) aborts the whole call rather than
leaving the summary patch to land on its own.

**Running total (reconciled across stages):** counting every addendum
above plus Stage 3's own `usage_daily.sql` /
`news_story_extracted_at.sql` / `refresh_symbol_activity.sql` (landed on
`main` but never logged here by that stage), **11 migrations** are
unapplied against production as of this merge, not 3 or 4 — same fix
(step 1 above) closes all of them in one `npm run db:migrate` run.

**Done 2026-08-24 (Joey):** ran `npm run db:migrate` from a checkout with
`apps/worker/.env` set up — all 27 migrations applied clean, then ran it a
second time with zero errors (the script re-runs every file unconditionally
by design, so a clean second pass IS the idempotency proof — no
"relation already exists"-style failures). Production is caught up; the
knowledge engine, clown-sessions, and the `increment_usage_daily`
grant-scoping security fix are all live. `psql` wasn't available locally
for the optional pgvector check, so a small script
(`scripts/check-pgvector.mjs`, PR #3235) was added as a psql-free
alternative — separate, non-blocking follow-up.

**Status:** DONE

---

### 19. [BLOCKING] 17 Getty photos with unclear rights, still live in seed content — ~15 min to decide, lawyer's call

**Status:** DONE — 2026-08-24, Joey, in chat: retire and replace with real,
verified, non-Getty images (not license, not strip blank). A fresh grep the
same session found only 6 distinct URLs (11 references) still live — the
rest had already been retired in earlier work. All 6 replaced with verified
live images on allowlisted hosts (People.com, WWD, tayswiftstyle.wordpress.com,
one already-fixed YouTube still found on `origin/main`); one item
(`00-orbit.mjs` NYC street style, an unpublished candidate) left with no
photo and a TODO rather than a forced mismatch. `grep -r "gettyimages.com"
supabase/seed/` returns nothing. Full writeup in `docs/decisions.md`
(2026-08-24 entry). PR: see `fix/retire-getty-seed-images` branch.

---

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

