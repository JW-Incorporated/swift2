# Proposal: Agentic Operating Model v2 — desks, a chief of staff, and the daily brief

**Status: proposed (design-debate run 2026-07-11) — needs Joey + Wyatt approval.
Nothing here is implemented; nothing changes CLAUDE.md authority until approved.**

Requested by Joey (2026-07-11): assess every current agent and rule, then design
the agentic architecture that scales this company with *less* founder input —
sandboxed agent roles, decision-making authority in the right spots with checks
and balances, one master "authority" agent that banks founder-required decisions
and asks **once a day**, and fully-automated post-launch operations (social,
feedback, usage metrics, growth).

## 1. The goal in plain language

Today, every agent that needs a human answer interrupts a founder whenever it
happens to be running, and every merge, spec, and product call is a one-off ask.
That's fine at two founders + three bots. It does not scale to a launched
product with a content engine, a copy desk, social channels, feedback streams,
and growth ops all running daily.

The target state: **founders spend ~20 minutes once a day** ticking decisions in
a single brief, plus genuine emergencies. Everything else runs itself inside
written charters, with agents checking each other instead of asking humans.

**The brief is a ceiling on asks, not a lockbox on answers.** Banked items are
ordinary GitHub issues the moment they're filed — a founder who's around can
answer any of them at any time and unblock work immediately. Once a day is the
*maximum* the org demands of you, not a queue you're forbidden to touch early.
And desks are required to keep non-blocked work in their queue: a banked
decision parks *that item*, never the whole desk (see §5.5 for the case where
it truly blocks everything).

## 2. Current state — the full inventory

### 2.1 The agents we actually have (as of 2026-07-11)

| Agent | What it is | Cadence | Authority today | Where defined |
|---|---|---|---|---|
| **Claude Code** | Planner + primary builder (PM mode / engineer mode) | Per-session, human-started | Full build authority on branches; may not merge/deploy/spend | `CLAUDE.md`, `docs/cto-role.md` |
| **Codex** | Independent reviewer; "its job is to disagree" | Per-review, invoked by Claude/humans | Advisory only | `AGENTS.md`, plugin |
| **Karen** | Content Integrity Engine — read-only scanner (facts, safety, images), two layers (deterministic + agent), files fingerprint-deduped GitHub issues | Nightly (intended); manual runs today | Read-only + `issues:write`; never edits anything | PR #139, `scripts/content-engine/README.md` |
| **Kevin** | Ticket handler. Stream 1: auto-fixes Karen tickets → rolling PR. Stream 2: daily user-feedback digest with ✅/❌ checkboxes a founder ticks. Stream 3: eng/product triage + comment "review radar" — surface-only, never auto-codes | Hourly (stream 1), daily (2, 3) as session-scoped crons | May commit fixes to PRs; never merges, never closes user tickets without a human decision | `docs/kevin.md` (on `feat/feedback-button`) |
| **Copy-desk personas** (Theo, Loren, Vera, Deb) | Persona authors as living agents — charters + routing + bylines | Proposed, not built | Draft-only, inside house voice rules | PR #463 spec (#462) |
| **v0 (Vercel)** | External UI builder; pushes to branches | Ad hoc | Writes code on shared branches (see collision risk, §2.3) | — (no charter) |
| **ChatGPT / Gemini** | Bulk drafters via `scripts/ask-chatgpt.mjs` / `ask-gemini.mjs`; Joey's standing call: bulk content drafts go to ChatGPT, Claude fact-checks and integrates | Ad hoc | Draft-only, everything fact-checked before use | `docs/chatgpt-delegation.md`, `docs/gemini-delegation.md` |
| **Tests + CI** | Deterministic QA (validate-content, budget gates, typecheck, e2e) | Every PR | Hard merge gate | `.github/workflows` |
| **/marketing** | A *mode*, not an agent: dual-AI market research → prioritized feature verdict → issues | Only when a human remembers to run it | Advisory; files issues on approval | `.claude/commands/marketing.md` |
| **/design-debate** | A mode: proposal → Codex attack → verdict | Human-invoked | Advisory | `.claude/commands/design-debate.md` |

### 2.2 The rule stack

`CLAUDE.md` (workflow, Definition of Done, decision authority, cost discipline) →
`docs/cto-role.md` (engineering charter) → `docs/decisions.md` (the case-law log,
~25 entries) → content-ops standards (`editorial-voice-and-pipeline.md`,
`depth-rubric.md`, `song-annotation-standard.md`) → `.claude/settings.json`
(the *real* sandbox: allow/deny/ask permission lists — force-push, resets, and
secret reads are denied at the harness level; merges are `ask`).

### 2.3 What already works — keep all of it

1. **Finder/fixer separation.** Karen finds, Kevin fixes, by charter — neither
   can do the other's job. This is the checks-and-balances seed to generalize.
2. **Hard invariants written as safety properties**, not vibes (Kevin's
   never-merge, verify-first images, latest-human-comment-wins).
3. **The digest-and-checkbox pattern.** Kevin's daily review issue — a founder
   skims one issue and ticks boxes — is a working prototype of exactly the
   decision bank Joey is asking for. It just only covers user-feedback tickets.
4. **Cross-provider review** (Anthropic builds, OpenAI attacks) and
   **deterministic-core-first** (rule 8): both proven cost-effective.
5. **Repo as the only memory.** Charters, decisions, notes — all in Git.
6. **Two-track file ownership** (ENGINE vs CONTENT) — parallel work without
   collisions.

### 2.4 What breaks at scale — the actual problems to solve

1. **Founder interrupts are unbatched.** Specs, merges, product calls, Karen's
   9-issues-per-run, Codex disagreements — each arrives whenever it arrives.
   Joey's goal (ask once/day) is currently structurally impossible.
2. **Nobody owns the queue.** Tickets stall when a decision lands in chat but
   never reaches the ticket (it has happened enough to become a standing
   session rule); #429 existed because CIE tickets weren't closed when fixes
   landed; PR #427 took three commits that ignored a review comment because
   nothing guaranteed anyone read it (#451).
3. **Coordination is per-agent improvisation.** Kevin grew a "review radar"
   because comment-reading gaps hurt; every new agent will re-discover and
   re-solve the same problem differently unless coordination is owned.
4. **Intake is undefined.** Joey now drops real subject matter **daily**
   (#464–467) and it fits no pipeline; he explicitly flagged wanting a defined
   intake process. Until V2's automated engine exists (#468), intake is manual
   and shapeless.
5. **Authority is only defined for Claude-in-a-session.** CLAUDE.md's
   may/may-not list doesn't distinguish Kevin from Karen from a future social
   agent. Each new agent needs its authority derived, not improvised.
6. **Departments are modes that run only when remembered.** /marketing has
   barely run; nothing schedules it, it holds no state between runs, and it
   can't watch anything. Joey's verdict (2026-07-11): it doesn't act like a
   marketing *team* — "need agents instead." A command that produces one
   brief per invocation structurally can't be a team; "fully automated
   growth" can't be built from human-remembered commands.
7. **No production ops exist at all.** No uptime watch, no error monitoring,
   no analytics, no social listening, no posting pipeline. All of it is needed
   at launch and none of it is roadmapped (fixed in §7 + roadmap update).
8. **Drift has no auditor.** Charters (where they exist) are checked by nobody
   once written. v0 has no charter at all and has already collided with a
   branch under review.

## 3. Design principles

1. **Sandbox = charter + permissions + artifact interfaces.** An agent's
   *charter* says what it may decide; its *permission profile* (settings
   allowlist / token scopes) makes violations mechanically hard; and agents
   communicate **only through repo artifacts** (issues, PRs, docs with owned
   labels) — never by editing each other's outputs or state.
2. **Deciding is separated from doing.** No agent audits itself; no agent
   both routes work and performs it. (Karen/Kevin already model this.)
3. **Deterministic core, LLM edge** (rule 8). Polling, routing, dedup,
   scheduling, metric collection: scripts. Judgment: agents. Every cadence
   job's *trigger* is deterministic and cheap.
4. **Autonomy is earned and ratcheted, not granted.** New authority ships in
   draft/queue mode first; auto mode follows a clean track record and a
   founder sign-off. Founder answers become **precedent** that prevents the
   same question being asked twice — with hard limits on what precedent may
   ever automate (§5.3: the non-ratchetable set).
5. **Interrupt budget is the scarce resource.** The design optimizes founder
   attention, not agent convenience: one brief a day, page only for fires.
6. **Everything in the repo, absolute dates, one file per fact** — unchanged.

## 4. The proposed org

### 4.1 Org chart

```
Joey (CEO/product)  +  Wyatt (CTO/engineering)     ← decide, once a day
        │
     Marjorie — chief of staff agent               ← routes, banks, briefs, watches
        │
  ┌─────┼──────────┬───────────┬──────────┬─────────────┬──────────┐
  Build desk   Content desk  Integrity  Ticket ops   Growth &     Watch desk
  (Claude +    (copy-desk    (Karen)    (Kevin)      Community    (SRE/analytics,
  Codex + CI)  personas +                            (social,     post-launch)
               intake)                               feedback)
```

*(Marjorie: after Taylor's grandmother — the wise-authority name fits, and it
keeps the tradition that ops agents get human names. Tree — as in Tree Paine —
was considered and dropped: we don't name agents after real living people.
Joey renames at will; the slug in charters is what code depends on.)*

### 4.2 Marjorie — the chief of staff (the "master authority")

**Mission:** keep every desk unblocked and every founder ask batched. Marjorie
is the only agent whose job is the *org itself*.

**Day-one scope is deliberately small (Codex, round 1):** Marjorie v1 is a
curator — it assembles the brief, dedupes/ranks the bank, cites precedent,
runs the cadence check, and *proposes* routing. Unilateral T1 routing
authority activates in Phase 2, after the first weekly audit has a journal to
audit. The chief of staff earns its own autonomy the same way every desk does.

**Owns:**
- **The decision bank** (§5) and the once-daily **Founders' Brief**.
- **Precedent:** before banking any ask, search `docs/decisions.md` + past
  briefs; if precedent answers it, answer with a citation instead of asking.
  After each brief, write durable answers back into `docs/decisions.md` and
  propagate every answer into the tickets it affects (this closes problem #2).
- **Cadence health:** a deterministic morning check that each desk's scheduled
  job ran and produced its artifact (Karen's nightly report, Kevin's digests);
  a missed cadence is a brief line, a twice-missed cadence is a banked issue.
- **Routing genuinely new work** to a desk (an event, a ticket no desk claims,
  a founder drop) — using each desk's charter, not judgment calls of its own.
- **Paging** founders immediately for Tier-3 items only (§5.3).

**Hard limits (Marjorie's own charter):**
- Never writes product code, content, or specs. Never runs another desk's
  tools. (Deciding, separated from doing.)
- Never merges, deploys, or spends. Tier assignments and precedent citations
  are logged in an append-only ops journal (`docs/ops/journal/`), so every
  Marjorie decision is auditable after the fact.
- May not edit any charter, including its own — charter changes are
  founder-approved PRs ("constitutional amendments").

**Audited by, three layers (who watches the watcher):**
1. **A dumb watchdog that is not Marjorie:** a scheduled GitHub Action (plain
   code, zero LLM) that verifies the brief exists by its deadline, each desk's
   cadence artifact appeared, and the journal grew when the brief says actions
   were taken. On failure it opens a loud issue and hits the founders' T3
   channel. Marjorie cannot be its own heartbeat, and the watchdog is too
   simple to drift.
2. **Degraded mode by construction:** the decision bank is just labeled GitHub
   issues — if Marjorie is down, founders read the raw `founder-decision` list
   and desks keep depositing. Nothing routes *through* Marjorie as a runtime
   dependency; it curates, it isn't a bus.
3. **Weekly Codex org audit** — cross-provider review of the ops journal + a
   sample of routed items against the charters: banked what it should have
   decided (timidity)? decided what it should have banked (overreach)?
   mis-routed? Findings go in the next brief. Founders see every Marjorie
   action's effects daily, so silent drift has a one-day detection window —
   and the journal-delta count in each brief makes *omissions* visible, not
   just actions.

### 4.3 The desks (existing agents, chartered and completed)

| Desk | Members | What changes vs today |
|---|---|---|
| **Build** | Claude Code sessions + Codex review + CI | Nothing about how code gets built. Specs and merge requests go to the decision bank instead of ad-hoc pings. |
| **Content** | Copy-desk personas (PR #463) + **the intake process** | Intake formalized (closes #464's flag): founder drops and (later) V2-engine events land as `intake` issues; a deterministic script routes each to a persona per the copy-desk routing table; sources verified; normal draft→Karen→Codex pipeline. Joey's daily drops get a defined, single door. |
| **Integrity** | Karen | Unchanged in role; gains per-persona voice checks (#463) and depth/photo/cross-link checkers (#441). Nightly cadence becomes real and Marjorie-watched. |
| **Ticket ops** | Kevin | Unchanged in role (the charter is good). Stream 2/3 digests **merge into the Founders' Brief** as sections, so founders read one artifact, not three. Comment-radar cadence (#451) stays Kevin's, deterministic-first. |
| **Growth & Community** | New (post-launch, §7) | Social listening + gated announcement posting, feedback sentiment, era-drop announcements (J7), a standing marketing agent replacing the retired /marketing command. |
| **Watch** | New (post-launch, §7) | Uptime, errors, cost caps, usage analytics. The only desk with Tier-3 paging authority besides Marjorie. |

**Sandboxing, uniformly:** every desk gets (a) a charter at `docs/agents/<name>.md`
(Kevin's doc is the template — mission, streams, hard invariants, cadence,
"migrating to a service" contract); (b) a permission profile (which labels it
may write, which paths it may touch, which scripts it may run — enforced by
settings allowlists and, for service agents later, token scopes); (c) an
artifact interface (its outputs are issues/PRs/reports with its label, and no
agent edits another's artifacts — Marjorie's exact mutation rights in §5.2).
**v0 gets a one-page charter too** — branch naming it must use and the rule
that it never pushes to a branch with an open PR under review (the collision
that already happened).

**Honesty note on enforcement today:** `.claude/settings.json` is currently
one global profile (broad Edit/Write/gh allowances; merges ask-gated;
force-push/reset/secrets denied). Until desks run as separate processes with
their own tokens (Phase 2+, and the service migrations each charter already
plans for), per-desk sandboxing is charter + review discipline plus the
handful of global denies — real but soft. The proposal claims the *direction*
(mechanical enforcement per desk), not that it exists on day one.

### 4.4 Checks and balances — who watches whom

| Actor | Checked by | How |
|---|---|---|
| Build desk (Claude) | Codex + CI | Existing review + gates, unchanged |
| Content personas | Karen (voice/facts/safety) + Codex (review) + human sampling | #463 pipeline |
| Karen | Kevin acts only via tickets (can't be steamrolled); precision audited by human samples + the weekly Codex audit (false-positive rate reported in brief) | New |
| Kevin | Hard invariants in code + Marjorie cadence watch + founders see digests daily | Mostly existing |
| Marjorie | Weekly Codex org audit + append-only journal + daily founder visibility | New |
| Codex | Claude rebuts findings (accept-or-rebut, never silent); disagreements surface to founders | Existing rule 5 |
| Charters themselves | Founder-approved PRs only; Codex org audit flags drift between charter and behavior | New |

No self-audits anywhere; the deepest audits are cross-provider.

## 5. The decision bank and the Founders' Brief

### 5.1 The bank

A GitHub label **`founder-decision`** + an issue template every agent must use:

- **What's being decided** (one sentence) · **Context** (three sentences max,
  links for depth) · **Options A/B(/C)** · **Agent recommendation + why** ·
  **Cost of delay** (what stalls while this waits) · **Affects** (the exact
  ticket/PR numbers this decision unblocks — machine-readable, so answer
  propagation is mechanical) · **Tier** (2 = banked, 3 = paged) · **Deadline**
  if real.

Any agent may deposit. Marjorie curates continuously: dedupe, merge, check
precedent (answer + close instead of banking, citing the decision entry), and
rank by cost-of-delay.

### 5.2 The brief

Two per day (Joey, 2026-07-11): **`Founders' Brief — YYYY-MM-DD`** at
**6:00 AM** — the main artifact, full format below — and an **evening delta
comment** on the same issue at **8:00 PM** covering only what changed since
morning and what's immediately needed (newly-blocking decisions, content
shipped/authored today, anything that stalls overnight unanswered). The
delta never restates the morning brief. Format generalizes Kevin's digest
(checkbox blocks, because founders tick boxes — proven pattern):

1. **Decisions needed** — each banked item as an A-or-B checkbox block.
   **All boxes start unchecked** (Kevin's proven format — a pre-checked box
   would let a "recommendation" be processed as if a founder had decided).
   The recommended option is *labeled* "(recommended)", never pre-ticked;
   unticked items simply carry over.
2. **Founder-action items** — things AI *cannot* do (create accounts, DNS,
   payments, legal signatures), each with prepared step-by-step instructions
   so the founder executes in minutes.
3. **Shipped & in flight** — outcomes, not activity: what merged, what's
   awaiting whose review, what Karen found (counts + worst item).
4. **Health** — cadence dashboard (every desk ran? green/red), spend vs caps,
   and post-launch: uptime, error rate, usage, sentiment.
5. **Today's plan** — what each desk does next, so a founder can veto by
   comment before work happens rather than after.

Next Marjorie run parses the checkboxes, **propagates every answer into the
affected tickets**, records precedent-worthy answers in `docs/decisions.md`,
and unblocks the desks. Unticked items carry over with their cost-of-delay
restated. Kevin's Stream-2 digest and Eng-Triage become sections 1a/3a of this
brief rather than separate issues.

**Marjorie's mutation rights, exactly** (so the artifact rule stays honest):
Marjorie may add **comments and labels** on any desk's issues/PRs; it may
close only artifacts it owns (bank items, briefs). It never edits another
agent's issue/PR bodies and never closes a desk's tickets.

**Decision provenance — authority never lives in a relay** (Codex round 2:
any agent could type a magic comment form, so no comment form may *carry*
authority). The authoritative object is always **an artifact authored by a
founder's GitHub account**: the brief edit that ticked a checkbox, or a
founder comment on the bank issue. A propagation comment ("Founder decision,
Brief YYYY-MM-DD → link: …") is a *pointer*, not a warrant: before acting on
one, a desk's deterministic runner verifies the linked artifact exists and
its author is a founder account (one API call). A relay pointing at nothing,
or at a non-founder artifact, is a no-op flagged to the audit. This also
fixes degraded mode: with Marjorie down, a founder's direct comment on the
bank issue is already authoritative, and the watchdog Action (dumb code)
cross-posts pointer comments to the ticket numbers in the item's **Affects**
field — so answers still reach desks with zero LLM in the loop.

### 5.3 Interrupt tiers (the authority model)

| Tier | What | Handling |
|---|---|---|
| **T0** | Inside a desk charter | Agent just does it. Logged in its artifacts. |
| **T1** | Cross-desk coordination: priorities, scheduling, routing, precedent-covered questions | **Marjorie decides**, journal-logged, visible in next brief (founders can veto after the fact — everything T1 is reversible by design). **In v1, routing and scheduling are propose-only** (§4.2): day-one T1 is precedent citation, dedup/ranking, and brief assembly; unilateral routing activates in Phase 2 after the first audit. |
| **T2** | Founder decisions: spec approvals, product direction, merge/deploy approvals, policy changes, anything expensive to reverse | **Banked** → daily brief. |
| **T3** | Fires: site down, legal/safety exposure, security incident, runaway cost, anything a one-day delay makes materially worse | **Page now** (channel = founder decision, §9), plus a brief entry. |
| **TX** | Things AI cannot legally/physically do: accounts, banking, signatures | Banked as founder-action items with prepared instructions. |

The **T1 line is the actual autonomy dial.** Day one, T1 is narrow (routing,
scheduling, precedent citation). When founders answer a T2 the same way twice,
Marjorie may **propose** a standing rule in the brief ("may I auto-approve
this class going forward?") — and that proposal is itself a T2 decision:
nothing moves to T1/T0 until a founder explicitly approves the rule, which is
then recorded in `docs/decisions.md`. Marjorie never self-promotes a class.
That's the ratchet that makes asks *decrease* over time, which is the
difference between this design and a notification system.

**The non-ratchetable set (the precedent ratchet may never automate these,
no matter how many identical answers accumulate):** product direction and
feature scope, brand voice and public posting, legal/policy posture,
pricing/monetization, spending, merge/deploy authority itself, and charter
changes. Two similar answers can differ on context a pattern-matcher can't
see. To be precise about what "non-ratchetable" bars (Codex round 2): it bars
the *ratchet mechanism* — pattern-matched auto-promotion — not explicit
founder grants. Founders can still deliberately delegate a narrow slice of
one of these (the §5.4 merge gate; §7's per-channel template autoposting) by
decision entry; that's a founder choosing, not Marjorie inferring.

### 5.5 When a banked item genuinely blocks a desk

If a T2 item leaves a desk with *no* chartered work at all (rare by queue
discipline, but real — e.g. a launch-gate approval), it becomes
nudge-eligible. **The nudge channel is capped org-wide, not per item** (Codex
round 2: per-item nudges quietly rebuild the interrupt firehose): at most
**one nudge message per day total**, batching every currently-blocking item,
and an item may appear in a nudge **once ever** — after that it only carries
in the brief with its cost-of-delay escalating. It doesn't page as if it were
a fire.

### 5.4 Merge authority — the one big CLAUDE.md change, decided by founders

Everything above fits inside today's rules. The largest *remaining* founder
tax will be merges: at scale, content-fix PRs (Kevin's streams, persona
rewrites) arrive daily and every one needs a human click today.

**Recommendation:** after the model runs ~2 weeks, allow auto-merge for
exactly one class: PRs that (a) touch only `supabase/seed/content/**` or
generated content files, (b) green CI including content validation, (c)
Codex-review clean, (d) originate from a chartered desk's stream.

**Mechanism matters:** this is implemented as a **deterministic merge gate** —
a dumb bot/Action that mechanically verifies (a)–(d) and merges, with a token
scoped to exactly that. **No LLM agent merges anything:** Marjorie's and
Kevin's never-merge invariants don't change (an earlier draft had Marjorie
merging, which contradicted its own charter — Codex, round 1). The founders'
grant lives in CLAUDE.md plus the gate's reviewable config; revoking it is
deleting a workflow file.

**Hard precondition (Codex round 2): the allowed paths must be inert data
first.** Today `supabase/seed/content/**` files are executable `.mjs` modules
imported by the seed/validate scripts — a path-clean PR could smuggle live
code that runs in CI and later against the DB. Before the gate can be
granted, CI gains a **content-inertness check** (parse each seed file and
reject anything beyond a single default-exported object literal — no
statements, no imports, no computed code), and "generated content files"
gets an exact path allowlist. No inertness check in CI → the class stays
human-merge regardless of the founders' answer to §9-Q1.

Code, schema, infra, workflow, and docs PRs stay human-merge until separately
revisited. Deploys stay human, full stop. This amends CLAUDE.md's "AI may not
merge" line and is **the single biggest decision in this proposal**.

**Answered (Joey, 2026-07-11 — see §9-Q1):** granted in direction, with the
standing goal that autonomous merging becomes normal as trust is earned
class-by-class. The engineering preconditions above are unchanged and Wyatt's
sign-off is pending; until both exist, human-merge continues in practice.

## 6. How agents actually run (implementation shape, not code)

- **Today's pattern continues, eyes open:** desk cadences run as scheduled
  Claude sessions/routines (Kevin's pattern), with deterministic scripts for
  triggers and polling (GitHub API "anything new since <timestamp>" costs no
  LLM tokens — #451's ask). Session crons are the *known-fragile interim*,
  not the destination — Kevin's own charter says so — which is exactly why
  the Phase-1 watchdog is a GitHub Action, independent of every cron it
  watches: a dead cron becomes a loud issue within the hour, not a silent
  gap discovered days later.
- **One checkout per agent, no exceptions:** every scheduled or parallel
  session runs in its own git worktree/clone. Two sessions sharing one
  working directory can switch branches under each other mid-commit — it
  happened *during this proposal's own drafting* (2026-07-11: a parallel
  session branched off this doc's branch and flipped the shared checkout;
  a commit landed on the wrong branch and needed cherry-pick + revert
  surgery). This line is in every charter's hard invariants.
- **Charters are runtime contracts:** each `docs/agents/<name>.md` is loaded
  by its runner; the "migrate to an API-backed service" section in Kevin's
  charter becomes the standard closing section of every charter, so any desk
  can be ported off session-crons without redesign (V2's engine, #468, will
  force this for intake anyway).
- **Cost, stated concretely rather than hand-waved:** the standing LLM burn
  is bounded by cadence — Marjorie daily (curation + brief assembly; the
  polling under it is free API calls), Karen nightly, Kevin's judgment runs
  only when deterministic polling finds something new, Codex org audit
  weekly, marketing agent monthly, Watch desk ~zero LLM (deterministic
  checks; judgment only on anomaly). Each charter states a per-run budget;
  the brief's health section reports actual spend vs a **monthly cap for all
  scheduled work combined** — breaching the cap is itself a banked decision
  (raise it or cut a cadence). Platform costs (social APIs are often paid)
  are TX/spend items before any desk depends on them. All of it is
  build-side (Max windows / capped API) — **no runtime LLM in user paths**,
  unchanged.

## 7. Post-launch operations (folded into the roadmap by this PR)

Goal #1 growth, goal #2 the fan base keeps loving the app. Two new desks, both
following the same charter/cadence/sandbox pattern:

**Growth & Community desk**
- **Social listening:** daily scan of r/TaylorSwift, X/Twitter Swiftie circles,
  app-store reviews, and media mentions of the app → sentiment + opportunity
  digest into the brief (fan-love metric, goal #2).
- **Social posting — announcements only:** era-drop announcements (the J7
  cadence the retention plan already depends on) and feature announcements,
  from founder-approved templates. **Graduated authority:** starts as a draft
  queue in the brief (founder ticks approve); may move to scheduled autopost
  per channel only after a clean track record **plus** a channel policy doc
  (voice, unofficial-app disclosure, what never gets said) **plus** an
  explicit founder grant recorded as a decision entry — the deliberate
  carve-out §5.3 permits; the precedent ratchet can never confer this. A crisis-stop rule ships with the first
  channel: any reply storm, press pickup, or legal-adjacent mention → posting
  freezes, founders paged. **Engagement replies (conversing as the brand) are
  out of automation scope indefinitely** — live brand voice in fandom politics
  is a risk no track record earns (Codex, round 1); a human posts those, with
  desk-drafted suggestions at most. Account creation and any paid platform
  API are TX/spend items (founders act, with prepared instructions).
- **Marketing as a team, not a command (Joey, 2026-07-11):** the /marketing
  command is **retired**. Its research protocol (segments → evidence →
  candidate features → Codex challenge → verdict) survives as one *cadenced
  job* of a standing Growth-desk agent that also holds state between runs
  (what was recommended, what shipped, what the metrics then showed — the
  feedback loop a one-shot command can never close). Monthly by schedule plus
  on-demand; verdicts land as banked decisions; approved features flow to the
  Build desk as issues.
- **Growth plan:** a living `docs/marketing/growth-plan.md` the desk maintains
  from real metrics — reviewed quarterly by founders as a banked decision.

**Watch desk**
- **Uptime/error monitoring** (Vercel + Supabase status, synthetic checks on
  the key routes) — deterministic, cheap, frequent; Tier-3 paging on
  hard-down, error spikes, or cost-cap breaches.
- **Usage analytics:** needs a stack decision (privacy-light, e.g. Vercel
  Analytics vs Plausible — a T2/TX item with its own cost entry, banked at
  build time). Weekly growth report (goal #1 metric: acquisition, activation,
  retention per era-drop) feeds the Growth desk.
- **Feedback loop widening:** Kevin's Stream 2 (in-app button, #427) plus
  app-store reviews and social complaints funnel into one triage; recurring
  themes become banked product decisions with evidence attached.

**Timing (revised per Joey, 2026-07-11 — pulled forward):** a launch is
itself a marketing event, so the Growth desk does **not** wait for launch.
Pre-launch: the marketing agent stands up with its first deliverable being
the **launch campaign plan**; social listening starts early to establish a
baseline (what does Swiftie social sentiment look like *before* we exist);
and social account creation (a founder TX action with real lead time) lands
in an early brief with prepared instructions. Watch desk minimum (uptime +
error paging + analytics baseline) also ships before public launch. Posting
autonomy still graduates the careful way (draft queue → per-channel founder
grant) — pulling the desk forward changes when it starts working, not what
it's allowed to do.

## 8. What this deliberately does NOT change

- Humans own product direction, deploys, money, secrets, force-anything.
- Spec-before-code, branch-always, cross-review-everything, tests, the
  Definition of Done — all Build-desk rules stand.
- Karen stays read-only; Kevin keeps every hard invariant; the copy desk spec
  (PR #463) proceeds as written.
- Repo remains the only source of truth; this proposal adds artifacts, not
  side-channels.

## 9. Founder decisions — answered by Joey, 2026-07-11

1. **Merge authority: GRANTED in direction, and more ambitious than the
   recommendation.** Joey's words: make the AI so good it can push regularly.
   Standing product goal: autonomous merging becomes normal, not exceptional.
   What still gates it: (a) the §5.4 engineering preconditions stand — the
   deterministic gate mechanism, content-inertness in CI first, expansion
   class-by-class with a track record per class; (b) **Wyatt's sign-off** —
   merge/release authority is a CTO-side call under the role split, so this
   is Joey's product direction + a pending Wyatt approval, recorded per the
   "disagreements surface" rule (no disagreement yet — just not his signature
   yet). Deploys remain human until separately revisited.
2. **T3 paging: SMS primary, email backup.** SMS needs a provider account
   (e.g. Twilio) — that's a TX/spend item (founders create it, agent preps
   instructions; cost is trivial but it's still an account + spend). Until
   that exists, email is the live channel from day one, and SMS switches to
   primary the day the account does.
3. **Brief cadence: two briefs.** **6:00 AM — the main brief** (full §5.2
   format: decisions, founder actions, shipped/in-flight, health, today's
   plan). **8:00 PM — the evening delta**: only what changed since 6:00 AM
   and what's immediately needed — decisions that became blocking during the
   day, new content shipped/authored today (era items, dossiers, drops), and
   anything that will stall overnight without an answer. The delta is short
   by charter: no restating the morning brief, changes only.
4. **Growth desk timing: pulled forward to pre-launch** (added same day).
   The marketing agent and social listening start before launch — first
   deliverable is the launch campaign plan, plus an early baseline and
   account-creation lead time. See §7 timing and Phase 3.

## 10. Rollout phases

- **Phase 1 (now, pre-launch):** Marjorie charter + decision-bank label/
  template + first Founders' Brief (absorbing Kevin's digests) + the intake
  door for Joey's daily drops (#464). One week of value before anything else.
- **Phase 2:** charter-ify every existing agent under `docs/agents/`
  (Karen, Kevin, v0, delegation scripts), stand up the ops journal, cadence
  health, weekly Codex org audit.
- **Phase 3 (pre-launch, pulled forward per Joey 2026-07-11):** Growth &
  Community desk stands up — marketing agent (first deliverable: the launch
  campaign plan), social listening baseline, account-creation TX items in an
  early brief. Watch desk minimum + analytics stack decision remain the
  launch gate.
- **Phase 4 (launch + after):** announcement draft queue goes live with the
  launch campaign; growth plan doc maintained from real metrics.
- **Phase 5 (earned):** autonomy ratchets — scoped merge authority (§5.4),
  scheduled autoposting — each individually founder-approved.

Each phase is a PR train with its own spec; none blocks V1 launch work — and
per #468's priority rule, V2 engine work stays Wyatt-filler and simply plugs
into the intake door when it exists.

## 11. Draft decision-log entry (copied to `docs/decisions.md` on approval)

> **2026-07-XX — Agentic operating model v2.** Adopt the desk model: chartered,
> sandboxed agents (`docs/agents/`) with artifact-only interfaces; a chief-of-
> staff agent (Marjorie) that routes work, maintains precedent, watches
> cadences, and banks all founder decisions into one daily Founders' Brief;
> tiered interrupt authority (T0–T3 + TX) with a founder-approved-only
> autonomy ratchet and a non-ratchetable strategic set. Brief cadence: 6:00
> AM main + 8:00 PM changes-only delta (Joey). T3 paging: SMS primary once
> the provider account exists (TX item), email until then and as backup
> (Joey). Merge authority: granted in direction by Joey — autonomous merging
> is the standing goal, earned class-by-class behind a deterministic gate,
> content-inertness CI first, Wyatt sign-off pending. Post-launch ops
> (Watch, Growth & Community) follow the same pattern, listening/draft-first
> with earned autonomy. Expensive to reverse: org process, founder habits,
> and charter contracts that future service agents must honor. Cost:
> build-side scheduled runs with per-charter caps; zero runtime LLM.

## 12. Alternatives considered

- **"Just generalize Kevin's digest" — a deterministic aggregator, charters,
  heartbeats, and no chief-of-staff agent at all** (Codex's round-1
  counter-proposal). Largely *adopted*: the bank is plain labeled issues, the
  watchdog is a dumb Action, polling is deterministic, and Marjorie v1 is
  little more than the curation pass over that machinery. What a pure
  aggregator can't do — and what Joey's ask requires — is the judgment slice:
  precedent lookup ("was this already decided?"), dedup/merge of related
  asks, cost-of-delay ranking, proposing ratchet rules, and routing new work
  by charter. That slice is one small daily LLM run on top of the simple
  design, not a different architecture. If Marjorie's audits go badly, delete
  the curation pass and the simple design is what remains — that's the
  fallback posture, by construction.
- **A standing human-style org with many always-on agents** (separate
  PM/engineer/reviewer roles) — already rejected in `docs/decisions.md`
  (2026-07-02, "ceremony without benefit at 2-person scale"). This proposal
  keeps roles as *cadenced jobs with charters*, not resident processes;
  nothing runs when there's nothing to do.
- **Do nothing until V2's content engine forces it** — rejected: the founder
  interrupt tax and the intake gap (#464) are today-problems, and Phase 1
  costs a week while paying back immediately.

---

## Verdict

**We will build the desk model with a deliberately small chief of staff.**
One decision bank (labeled GitHub issues with a required template), one
Founders' Brief per day assembled by Marjorie — a curator whose judgment
slice (precedent, dedup, ranking, routing proposals) sits on top of purely
deterministic machinery (label queries, cadence polling, a GitHub-Action
watchdog that watches Marjorie itself), so the org degrades gracefully to
"founders read labeled issues" if any agent dies. Tiered authority (T0–T3 +
TX) with a founder-approved-only ratchet and a hard non-ratchetable set keeps
strategic decisions human forever while operational asks decay toward zero.
Existing agents keep their charters and invariants unchanged; /marketing is
retired in favor of a standing Growth-desk agent; post-launch ops (Watch,
Growth & Community) join as desks under the same pattern, listening/draft
-first. It won the debate because every riskier alternative (an authoritative
LLM orchestrator, auto-merging agents, autonomous brand voice) lost a round-1
finding, and every simpler alternative is *contained in* this design as its
degraded mode rather than competing with it.

**Assumptions this rests on:** founders actually tick the brief most days
(unticked items only carry over — nothing auto-approves); auto-merge stays
off in practice until its CI preconditions land and Wyatt co-signs the grant
Joey has already given in direction (§9-Q1); session-cron reliability is
bridged by the watchdog until service migration.

---

## Appendix A — design-debate record

**Round 1 (Codex adversarial review, 2026-07-11) — 12 findings, all accepted:**
daily-batch stall risk → §1 "ceiling not lockbox" + §5.5 same-day nudge;
Marjorie SPOF/who-watches-watcher → §4.2 three-layer audit incl. non-LLM
watchdog + degraded mode; merge authority contradicted never-merge invariants
→ §5.4 deterministic merge gate, no LLM merges anything; pre-marked checkbox
= accidental auto-approval → §5.2 all boxes start unchecked; unsafe precedent
ratchet → §5.3 propose-only ratchet + non-ratchetable set; artifact-mutation
ambiguity → §5.2 exact mutation rights + relay-comment form; session-cron
fragility → §6 watchdog independence; sandbox aspirational → §4.3 honesty
note; cost hand-waved → §6 cadence-bounded burn + monthly cap as banked
decision; social posting brand risk → §7 announcements-only, channel policy,
crisis-stop, engagement replies out of scope indefinitely; monitoring the
wrong surface → roadmap L1 now requires defining the authoritative user path
first; simpler-design comparison missing → §12, largely adopted as Marjorie's
v1 scope and fallback posture. Joey (mid-debate, 2026-07-11): /marketing
doesn't act like a team, wants agents — folded into §2.4/§7 (command retired,
standing Growth-desk agent).

**Round 2 (Codex adversarial review, 2026-07-11) — 5 findings, all accepted:**
relay-comment spoofing + degraded-mode propagation gap → §5.2 rewritten:
authority lives only in founder-authored artifacts, relays are verified
pointers, the watchdog Action does mechanical propagation via the bank
template's new **Affects** field; auto-merge gate bypass via executable
seed `.mjs` files → §5.4 hard precondition: CI content-inertness check
(export-only object literals) + exact generated-file allowlist before any
grant; Marjorie v1 routing authority stated inconsistently between §4.2 and
§5.3 → T1 table now says routing/scheduling are propose-only in v1;
per-item same-day nudges could rebuild the interrupt firehose → §5.5 capped
at one batched nudge message per day org-wide, once ever per item;
autoposting appeared to contradict the non-ratchetable set → §5.3 now
distinguishes ratchet-conferred (never) from founder-granted-by-decision-
entry (allowed, narrow) autonomy. Codex confirmed the remaining round-1
revisions as substantive. Debate closed after two rounds per protocol.
