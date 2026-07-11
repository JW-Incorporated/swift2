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
6. **Departments are modes that run only when remembered.** /marketing has run
   twice ever; nothing schedules it. "Fully automated growth" can't be built
   from human-remembered commands.
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
   founder sign-off. And every founder answer becomes **precedent** that
   prevents the same question being asked twice.
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

**Audited by:** a **weekly Codex org audit** — cross-provider review of the ops
journal + a sample of routed items against the charters: did Marjorie bank
things it should have decided (timidity), decide things it should have banked
(overreach), or mis-route? Findings go in the next brief. Founders see every
Marjorie action's effects in the daily brief, so silent drift has a one-day
detection window.

### 4.3 The desks (existing agents, chartered and completed)

| Desk | Members | What changes vs today |
|---|---|---|
| **Build** | Claude Code sessions + Codex review + CI | Nothing about how code gets built. Specs and merge requests go to the decision bank instead of ad-hoc pings. |
| **Content** | Copy-desk personas (PR #463) + **the intake process** | Intake formalized (closes #464's flag): founder drops and (later) V2-engine events land as `intake` issues; a deterministic script routes each to a persona per the copy-desk routing table; sources verified; normal draft→Karen→Codex pipeline. Joey's daily drops get a defined, single door. |
| **Integrity** | Karen | Unchanged in role; gains per-persona voice checks (#463) and depth/photo/cross-link checkers (#441). Nightly cadence becomes real and Marjorie-watched. |
| **Ticket ops** | Kevin | Unchanged in role (the charter is good). Stream 2/3 digests **merge into the Founders' Brief** as sections, so founders read one artifact, not three. Comment-radar cadence (#451) stays Kevin's, deterministic-first. |
| **Growth & Community** | New (post-launch, §7) | Social listening + posting, feedback sentiment, era-drop announcements (J7), scheduled /marketing runs. |
| **Watch** | New (post-launch, §7) | Uptime, errors, cost caps, usage analytics. The only desk with Tier-3 paging authority besides Marjorie. |

**Sandboxing, uniformly:** every desk gets (a) a charter at `docs/agents/<name>.md`
(Kevin's doc is the template — mission, streams, hard invariants, cadence,
"migrating to a service" contract); (b) a permission profile (which labels it
may write, which paths it may touch, which scripts it may run — enforced by
settings allowlists and, for service agents later, token scopes); (c) an
artifact interface (its outputs are issues/PRs/reports with its label, and no
agent edits another's artifacts). **v0 gets a one-page charter too** — branch
naming it must use and the rule that it never pushes to a branch with an open
PR under review (the collision that already happened).

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
  **Cost of delay** (what stalls while this waits) · **Tier** (2 = banked,
  3 = paged) · **Deadline** if real.

Any agent may deposit. Marjorie curates continuously: dedupe, merge, check
precedent (answer + close instead of banking, citing the decision entry), and
rank by cost-of-delay.

### 5.2 The brief

One issue per day, **`Founders' Brief — YYYY-MM-DD`**, generalizing Kevin's
digest format (checkbox blocks, because founders tick boxes — proven pattern):

1. **Decisions needed** — each banked item as an A-or-B checkbox block with
   the recommendation pre-marked. Ticking the recommendation is one click.
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

### 5.3 Interrupt tiers (the authority model)

| Tier | What | Handling |
|---|---|---|
| **T0** | Inside a desk charter | Agent just does it. Logged in its artifacts. |
| **T1** | Cross-desk coordination: priorities, scheduling, routing, precedent-covered questions | **Marjorie decides**, journal-logged, visible in next brief (founders can veto after the fact — everything T1 is reversible by design). |
| **T2** | Founder decisions: spec approvals, product direction, merge/deploy approvals, policy changes, anything expensive to reverse | **Banked** → daily brief. |
| **T3** | Fires: site down, legal/safety exposure, security incident, runaway cost, anything a one-day delay makes materially worse | **Page now** (channel = founder decision, §9), plus a brief entry. |
| **TX** | Things AI cannot legally/physically do: accounts, banking, signatures | Banked as founder-action items with prepared instructions. |

The **T1 line is the actual autonomy dial.** Day one, T1 is narrow (routing,
scheduling, precedent citation). Every time founders answer a T2 the same way
twice, Marjorie proposes a standing rule in the brief ("may I auto-approve
this class going forward?") — accepted rules move that class to T1/T0
permanently. That's the ratchet that makes asks *decrease* over time, which is
the difference between this design and a notification system.

### 5.4 Merge authority — the one big CLAUDE.md change, decided by founders

Everything above fits inside today's rules. The largest *remaining* founder
tax will be merges: at scale, content-fix PRs (Kevin's streams, persona
rewrites) arrive daily and every one needs a human click today.

**Recommendation:** after the model runs ~2 weeks, grant Marjorie **scoped
merge authority** for exactly one class: PRs that (a) touch only
`supabase/seed/content/**` or generated content files, (b) green CI including
content validation, (c) Codex-review clean, (d) originate from a chartered
desk's stream. Code, schema, infra, workflow, and docs PRs stay human-merge
forever until separately revisited. Deploys stay human, full stop.

This amends CLAUDE.md's "AI may not merge" line and is called out as **the
single biggest decision in this proposal** — default if unanswered: not
granted, everything stays human-merge.

## 6. How agents actually run (implementation shape, not code)

- **Today's pattern continues:** desk cadences run as scheduled Claude
  sessions/routines (Kevin already proves hourly/daily session crons work),
  with deterministic scripts for triggers and polling (GitHub API "anything
  new since <timestamp>" costs no LLM tokens — #451's ask).
- **Charters are runtime contracts:** each `docs/agents/<name>.md` is loaded
  by its runner; the "migrate to an API-backed service" section in Kevin's
  charter becomes the standard closing section of every charter, so any desk
  can be ported off session-crons without redesign (V2's engine, #468, will
  force this for intake anyway).
- **Cost:** every scheduled desk states its per-run token budget in its
  charter; Marjorie's health check includes spend vs cap. All of it is
  build-side (Max windows / capped API) — **no runtime LLM in user paths**,
  unchanged.

## 7. Post-launch operations (folded into the roadmap by this PR)

Goal #1 growth, goal #2 the fan base keeps loving the app. Two new desks, both
following the same charter/cadence/sandbox pattern:

**Growth & Community desk**
- **Social listening:** daily scan of r/TaylorSwift, X/Twitter Swiftie circles,
  app-store reviews, and media mentions of the app → sentiment + opportunity
  digest into the brief (fan-love metric, goal #2).
- **Social posting:** era-drop announcements (the J7 cadence the retention
  plan already depends on), feature announcements, engagement replies.
  **Graduated authority:** starts as a draft queue in the brief (founder ticks
  approve); moves to scheduled autopost per channel after a clean track record
  + founder sign-off. Account creation is TX (founders act, with prepared
  instructions). Public posting is the second-riskiest authority in this doc
  after merges — it starts human-gated.
- **Marketing research:** /marketing stops being a remembered command and runs
  **monthly by schedule** (plus on-demand), its verdict landing as banked
  decisions; approved features flow to the Build desk as issues, exactly as
  the command already specifies.
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

Launch gating: Watch desk minimum (uptime + error paging + analytics baseline)
ships **before** public launch; Growth desk can start listening-only at launch
and earn posting autonomy after.

## 8. What this deliberately does NOT change

- Humans own product direction, deploys, money, secrets, force-anything.
- Spec-before-code, branch-always, cross-review-everything, tests, the
  Definition of Done — all Build-desk rules stand.
- Karen stays read-only; Kevin keeps every hard invariant; the copy desk spec
  (PR #463) proceeds as written.
- Repo remains the only source of truth; this proposal adds artifacts, not
  side-channels.

## 9. Open founder decisions

1. **Scoped merge authority for content-fix PRs after a 2-week track record —
   yes or no?** (§5.4; default if silent: no, human-merge continues.)
2. **T3 paging channel:** where do fires reach you — push notification, email,
   or SMS? (Pick one; everything else lands in the daily brief.)
3. **Brief timing:** one fixed time (e.g. 9:00) or morning + evening split
   (decisions AM, plan-veto PM)? Recommendation: one, 9:00, expand only if
   carry-over gets chronic.

## 10. Rollout phases

- **Phase 1 (now, pre-launch):** Marjorie charter + decision-bank label/
  template + first Founders' Brief (absorbing Kevin's digests) + the intake
  door for Joey's daily drops (#464). One week of value before anything else.
- **Phase 2:** charter-ify every existing agent under `docs/agents/`
  (Karen, Kevin, v0, delegation scripts), stand up the ops journal, cadence
  health, weekly Codex org audit.
- **Phase 3 (launch gate):** Watch desk minimum + analytics stack decision.
- **Phase 4 (post-launch):** Growth & Community desk, listening-first;
  scheduled /marketing; growth plan doc.
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
> tiered interrupt authority (T0–T3 + TX) with an autonomy ratchet (repeated
> identical founder answers become standing rules). Post-launch ops (Watch,
> Growth & Community) follow the same pattern, listening/draft-first with
> earned autonomy. Merge authority unchanged pending the §5.4 decision.
> Expensive to reverse: org process, founder habits, and charter contracts
> that future service agents must honor. Cost: build-side scheduled runs with
> per-charter caps; zero runtime LLM.

---

## Appendix A — design-debate record

*(Round 1 and Round 2 Codex findings and their resolutions are recorded here
after each round; see PR discussion for full transcripts.)*
