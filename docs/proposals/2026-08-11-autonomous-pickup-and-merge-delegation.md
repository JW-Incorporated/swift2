# Autonomous work pickup, and how much of PR review we can stop doing

Status: **proposal, pending Wyatt's approval.** Written 2026-08-11 in answer to
two questions from Wyatt. Decision-log entry: `docs/decisions.md`, 2026-08-11
("Work ownership is state, not prose"). The mechanical parts marked **shipped
in this PR** below are already implemented and need no approval; everything
marked **needs a decision** does.

---

## The two questions

> **(a)** There were several issues that you discovered, for example unmerged
> PRs, which were for some reason unsolved… How do we start solving those
> without founder input? Would it make sense for Marjorie to watch for stuff
> like that, then have her spin up a Fable "founder-bot" who has permission and
> agency to solve ~all issues, maybe with very few exceptions?
>
> **(b)** Really scrutinize what PR content needs founder approval… What
> permissions can we give to you there? For risky topics, what can we do to
> mitigate the risk?

They are one question — *what can the org do without you* — split across the
two things that gate it: **who picks work up**, and **who lets it land**.

## The answer, in one page

**On (a): no founder-bot. Build routing-as-state instead.** The premise of the
founder-bot is that work stalls because no agent is *allowed* to do it. That is
not what the evidence shows. Every stuck item this week was blocked on
something else: a gate that was silently misconfigured, a red PR nobody returns
to, a review nobody ran, or a routing instruction that existed only as English
prose in a comment thread. Adding an agent with near-universal permission fixes
none of those, and it is the one grant in this system that cannot be fenced —
"solve ~all issues with few exceptions" is, by construction, the complement of
every charter we have, which is exactly the region that contains legal text,
secrets, deploys, migrations and public posting.

What Wyatt is right about is the hole: the union of all desk fences is smaller
than the set of real work, and **nobody is chartered to notice that**. The fix
is to make the hole *countable and owned*, not to hire something that stands
in it.

**On (b): widen merge delegation by artifact class, on mechanical proof — not
by trust.** The repo already has the right template and does not seem to know
it. `scripts/check-content-inert.mjs` did not authorise content auto-merge by
deciding that seed files are usually fine. It proved, with a positive AST
grammar, that a passing seed file is *structurally incapable* of I/O, secrets
or exec — and then the entire class got delegated. Every widening below is
justified the same way or not at all: **name the harm, then prove the artifact
class cannot cause it.** Where I cannot construct that proof, I recommend
keeping the human, and I say so.

**One prerequisite blocks everything.** This repo has two collaborator accounts
(`sffan15-sys`, `wjduvall-cmd`), both admin, and **both are the accounts every
agent runs under.** Any authority grant whose safety rests on "a founder
approved it" is currently unfalsifiable — the 2026-07-18 merge grant vested on
"a founder-authored comment on brief #822", posted from an account any agent
can post from. This is not theoretical prudence; it is the load-bearing
assumption under every existing grant. Fixing it needs a human hand (see
§7, item 0) and I would not stack further authority on top until it is fixed.

---

## 1. What is actually broken

Verified today, not recalled:

| Fact | Measured |
|---|---|
| Open issues | **183** |
| …with an assignee | **4** — all `wjduvall-cmd`, all a11y, all self-claims by one desk |
| …carrying any label that names an owner | **0** — no such label exists |
| Open non-draft PRs older than 7 days | **9**, oldest 15 days (#1571) |
| Repo collaborators | **2**, both admin, both shared by every agent |
| Red launch gates | **2** — LEGAL (#800), BACKUPS (#680) |

Five mechanisms produce that, and only the first is about permission at all.

**1. Routing is prose.** Marjorie's charter (amendment 7) lets her route work
"directly by label/comment", and the receiving desk's prompt says a routed item
"counts as greenlit". But no label naming a desk exists, so in practice routing
is a comment — and **no runner anywhere queries for routing comments.** Every
desk pulls by its own topic label (`intake`, `a11y`, `cie`). Routing to a desk
and routing to nobody produce identical machine state.

**2. Both red gates were routed to a desk structurally incapable of them.**
BACKUPS (#680) was routed 2026-07-15 into "the Build desk queue". Austin *is*
the Build desk's autonomous lane, and his charter bans `.github/**`, migrations,
secrets and infra — a Supabase restore drill is outside his fence in three
separate ways. He also never saw it: his queue query is
`gh issue list --label a11y` plus Kevin's triage buckets, and #680 carries
neither. LEGAL (#800) is worse: it is founder-and-counsel work that no agent
should do unilaterally, and it was "routed" anyway.

**3. The union of the fences is smaller than the work.** Reading every charter:
`.github/**` belongs to nobody except a narrow "CI/security config" slice of
Paul Blart's; infra/deploy verification belongs to nobody (Nils observes it
read-only, Marjorie owns rollback only for merges she made); legal prose
belongs to founders by design; cross-desk chores belong to nobody, because
Marjorie's own invariant 1 is "never write product code, content, or specs".
Nothing in the org is chartered to notice that this complement is non-empty.

**4. Escalation is capped at one nudge, ever.** From the operating model §5.5,
restated verbatim in Marjorie's charter:

> at most **one nudge message per day total**, batching every currently-blocking
> item, and an item may appear in a nudge **once ever** — after that it only
> carries in the brief with its cost-of-delay escalating.

That cap was a correct response to a real problem (per-item nudges rebuild the
interrupt firehose). But it controls *repetition* when the thing worth
controlling is *channel count*. The result is a system that diagnoses
"unstaffed", nudges once, and then reprints the same sentence in a daily brief
for three weeks. **Diagnosis was built; dispatch was not.**

**5. Killing the babysitting loops removed a safety net nobody replaced.** This
is already written down, in `docs/agents/vault-run-plan.md` Phase 3.5, and it
is the single most direct answer to Wyatt's "unmerged PRs":

> the replacement promise, *"if CI fails, the NEXT scheduled run picks it up"*,
> **is false**: the next run opens a BRAND NEW PR against `main`. It never
> returns to the red one. So red content PRs accumulate silently and the work
> never ships.

Found 2026-07-30. Still true 2026-08-11. The PR that fixes it, #1629, is
itself 12 days stale — the blind spot swallowed its own fix.

**Capacity per session is not the constraint; session arrival rate is.** In the
18 days to 08-10 the founders' entire human output was two comments. Then one
session cleared a 20-day-old item and ~15 stuck PRs in 90 minutes. The system
downstream is built as if founders were continuously available, and every
mechanism above is a place where that assumption is load-bearing.

---

## 2. Part A — the founder-bot question, answered

### 2.1 Why I recommend against it

**It answers the wrong question.** Sort the currently-stuck work by what it was
actually blocked on:

| Stuck item | Actually blocked on | Would a founder-bot have helped? |
|---|---|---|
| #1891, #1762 (a week each) | The auto-merge allowlist had silently fallen three files behind, and the workflow's "declined" path prints a line and exits 0 | No — needed a checker, shipped as `check:automerge-allowlist` |
| #1545/#1565/#1585 family | Red CI; no agent ever returns to a red PR | No — needs a loop closure, not permission |
| #1580/#1596/#1619 | `needs-human-review`; want a reviewer | No — a sibling bot reviewing them is self-approval with extra steps |
| #1571, #1822 (dependabot) | No desk merges; Paul Blart is chartered never to | Only by granting merge — which is (b), not a bot |
| #800 LEGAL | Needs counsel and a founder | **Must not** — this is the case where a bot acting is the failure |
| #680 BACKUPS | Routed to a desk whose fence excludes it | No — needed the routing to be checkable |

Roughly zero of these were blocked on "no agent was allowed." They were blocked
on **addressing, looping and proof**. A blanket grant fixes none and adds the
one risk class we have no control for.

**"~all issues with few exceptions" is unfenceable.** Every charter in this repo
is defined by *inclusion*: Austin gets these paths, ≤5 files, ≤150 lines, this
change-type list. The founder-bot would be defined by *exclusion* — everything
except a list. That is a deny-list, and this repo already has a worked proof
that deny-lists fail at exactly this job. `check-content-inert.mjs` says so in
its own header: a deny-list of dangerous *names* was defeated by
`({}).constructor.constructor('…')()`, which reaches `Function` without naming
it, so the check was rebuilt as a positive grammar. The org-level version of
that bypass is an issue that does not *look* like any exception on the list.

**It rebuilds the bottleneck one layer down.** One privileged agent is a single
arrival-rate limit with correlated failure: when it is wrong about a *kind* of
thing, it is wrong across every desk at once, and the desks' independent fences
— currently the thing that contains a bad run to one lane — stop containing
anything.

**Its authority would be unverifiable.** It would run as `wjduvall-cmd` — the
same identity as Wyatt's own approvals. Today, in the GitHub audit trail,
"Wyatt approved this" and "an agent approved this" are the same event. Granting
near-universal authority to the founder's own approval identity means the system
can no longer distinguish its decisions from its owner's. That is the specific
thing that must not be true of the *most* privileged actor in the system.

### 2.2 What Wyatt is right about, and what to build instead

He is right that (i) something must watch for ownerless work, (ii) Marjorie is
the right watcher, and (iii) noticing is not enough — something must *act*. The
disagreement is only about the shape of the actor. So:

**A1 — Routing writes state.** *(labels shipped in this PR; adoption needs a
decision.)* Introduce a `desk:*` taxonomy. An open issue is **routed** iff it
carries **exactly one** `desk:*` label. Nothing else counts. A routing comment
with no label is not routing and will be reported as unrouted.

One correction to the framing in the brief I was given, because it matters
mechanically: **the assignee cannot carry the route.** GitHub assignees must be
repo collaborators; there are two, and both are shared by every agent. So:

- **Label = the route.** Which desk owns it.
- **Assignee = the claim lock**, which is already Austin's meaning ("assignment
  = lock, ticket comments = attempt ledger, labels = state") with a 24h lease.
- **`desk:founder` = a named human owes an action**, on a human's clock, never
  counted as abandoned.

**A2 — The fence complement gets a name and a counter.** `desk:unowned` is a
first-class, legitimate answer, not a failure to answer. When the dispatcher
cannot map an item to a charter, that is the honest label, and it converts "no
charter covers this" from an invisible fact into a countable one. Its budget
starts at **0**, deliberately: the first item that lands there is loud.

**A3 — A deterministic ownership check, in the watchdog.** *(shipped in this
PR.)* `scripts/check-work-ownership.mjs`, zero AI, run daily from
`watchdog.yml`, reporting through the existing persistent-alert + real-email
path. Five conditions:

| Condition | Catches |
|---|---|
| `unrouted` | issues no machine-readable owner has, past a 24h grace |
| `ambiguous` | two `desk:*` labels — two desks each assuming the other |
| `unowned` | the fence complement, non-empty |
| `abandoned` | routed to a desk, but nothing moved for 10 days — **the launch-gate failure**, which is invisible unless you measure movement rather than intent |
| `stalePr` | open non-draft PR > 7 days — **Phase 3.5** |

**A4 — Escalation ratchets instead of capping.** *(needs a decision.)* Replace
"an item may appear in a nudge once ever" with: keep the volume cap (one
channel, at most one email per condition per day) and drop the memory cap. The
mechanism already exists and already fixed this exact bug once —
`scripts/watchdog/upsert-alert.sh`, one evolving issue per condition, born
because four disconnected daily alerts (#947/#1177/#1203/#1224) sat unread. The
one-nudge rule solves interrupt volume with a *memory* limit; the right control
is *channel count*. A condition that is still true tomorrow is still true, and
an alert that goes quiet while the problem persists is lying.

**A5 — Close the red-PR loop.** *(needs a decision; the `stalePr` alarm ships
now.)* Phase 3.5's own prescription, unchanged: a lane that has an open red PR
**fixes that PR** instead of opening a new one, and never relaxes a test to go
green. The `stalePr` counter makes the failure visible today; the loop closure
is a charter amendment and therefore founder-approved.

### 2.3 Who owns the complement — decomposed, not centralised

The complement is not one thing, and the smallest honest answer routes each
piece to the nearest existing owner rather than to a new privileged actor:

| Ownerless today | Recommendation | Authority delta |
|---|---|---|
| `.github/**`, CI/tooling fixes | **Extend Paul Blart**, who already owns "CI/security config only", to CI/workflow repair generally. Still opens PRs, still never merges. | Small, and inside an existing fence |
| Stale / red PR shepherding | **Not a desk — a loop closure** (A5). The lane that opened the PR owns it. | **Zero** |
| Dependency shepherding | Paul Blart already judges; the gap is merge, which is Part B | Zero new actor |
| Cross-desk chores, dispatch | **Marjorie**, as a dispatcher pass that writes labels instead of prose | Zero — she already claims routing authority; this makes it queryable |
| Infra / deploy **verification** | Watchdog probes (already exist) + `desk:founder` for the action half | Zero |
| Legal prose | **Stays founders + counsel.** Not a gap to close. | Zero |

Note what this buys: no new agent, no new authority class, and every remaining
piece is inside a fence someone already defends. If Wyatt still wants a single
named "founder-bot", the honest version of it is **Marjorie's dispatcher pass**
— she watches, she labels, and the desks that already exist do the work. That
is his proposal with the blast radius removed.

---

## 3. Part B — what still needs a human merge, category by category

The question for each category is not "do we trust it?" but **"what is the harm,
and is there an artifact-level property that proves this class cannot cause
it?"** That is the `check-content-inert.mjs` move, and it is the only kind of
argument I will make here.

| # | Class | Real risk | Mechanical proof available? | Recommendation |
|---|---|---|---|---|
| 1 | `supabase/seed/**` | Wrong/unsourced facts; privacy redline breach | `validate:content` + `check:content-inert` (positive grammar) + plain revert | **Keep delegated.** Build the redline checker (§3.1) |
| 2 | `apps/web/lib/longlive/*.generated.ts` | None independent of #1 | `check:generated` proves they are a pure function of the seeds | **Approve today's widening.** Strongest proof in the repo |
| 3 | `social/queue/**` | Copy reaches a public account | None for copy; caps + `SOCIAL_FREEZE` + revert | **Keep delegated** — but the control belongs at post time, not merge time (§3.2) |
| 4 | `apps/web/public/social/**` (images) | Bot-picked image on a public profile | **No** — and the failure surfaces on Instagram, not in CI | **REFUSE.** Reaffirm 2026-07-28 |
| 5 | `apps/web/**`, `packages/**` app code | Behaviour regression reaching users | Not in general. **Narrowly yes for the a11y lane** (§3.3) | **Conditional grant, blocked on #669** |
| 6 | `.github/**` | Changes the gate itself | N/A — this is the one class where a proof is beside the point | **REFUSE merge, always.** Enforced in code as of this PR (§3.4) |
| 7 | Dependencies | Supply chain; runtime regression | Semver + author identity are checkable; `build` runs the suite | **Grant for dev-dependency patch/minor only**, via Marjorie's envelope (§3.5) |
| 8 | `docs/**` non-governance | A wrong doc misleads future agents | **Yes** — "is not a charter, decision, spec or policy" is a checkable path property | **Grant** (§3.6) |
| 9 | Governance docs (`CLAUDE.md`, `docs/agents/**`, `docs/decisions.md`, specs, proposals, `docs/content-ops/**`) | Changes what agents may do | N/A | **REFUSE, always** — same rule as #6 |
| 10 | Legal prose / privacy policy / ToS | Regulatory representation, live from publication | No | **REFUSE, permanently.** Non-ratchetable |
| 11 | `supabase/migrations/**` | `git revert` is not a rollback | No | **REFUSE.** See §3.7 |
| 12 | Secrets, infra, deploys | Already forbidden by `CLAUDE.md` | — | **REFUSE** |

### 3.1 Seeds — keep delegated, and finally build the redline checker

Wyatt was shown this exposure on 2026-07-25 and accepted it: privacy redlines
(security arrangements, health, minors) are prose no CI job enforces, and Rumor
Desk content auto-merges anyway. That entry also stated the remedy — *"the fix
is to add a deterministic checker for it in `scripts/content-engine/`, not to
restore a human gate that was not being exercised in time to help"* — and it has
not been built. It is the highest-value un-built check in the repo, because it
is the only unbounded harm inside an already-delegated class. **Recommend
building it before widening anything else.**

### 3.2 Social copy — the control is in the wrong place

Merging a queue file is reversible. **Posting is not**: Instagram's API has no
delete endpoint (`scripts/social/delete-media.mjs` documents this), and two
duplicate posts from the 2026-07-17 incident are *still live* because removing
them needs a human's thumb in an app. So the merge gate was never the control
that mattered. Keep the merge delegated; put any new tightening at `isDue` in
`scripts/social/lib/queue.mjs`, where it can actually stop the irreversible act.

### 3.3 App code — one narrow grant, and it is currently blocked

I will not argue for general app-code auto-merge; there is no artifact-level
property that proves a React change cannot break a user path.

But the a11y lane has one. Three of the nine stale PRs (#1580, #1596, #1619) are
Austin a11y fixes, all of a very constrained shape: hit-area, spacing, heading
level. Laura's toolchain (`axe`, `pa11y`, Lighthouse) is deterministic, and each
ticket names a specific violation. The proof would be: **re-run axe on the
deployed preview and show that the exact violation ID the ticket names is gone
and no new violation appeared** — plus the diff stays inside Austin's existing
≤5-file/≤150-line fence and touches no path outside `apps/web/**`. That is a
proof of the ticket's own acceptance criterion, which is the inertness move
applied to a change class rather than a file class.

**Blocked, honestly:** an a11y pass does not prove the layout still works, and
the thing that would — the E2E suite — has all 30 tests failing uniformly
against prod (#669, open since 2026-07-15). **Do not grant this until #669 is
fixed.** I would rather name the dependency than ship the grant with a gap in it.

### 3.4 `.github/**` and governance — the self-amendment bar *(shipped)*

This is the most important rule in the proposal, and it was missing. The
allowlist checker says the quiet part in its own header: *"it cannot judge
whether a path deserves to be auto-mergeable — adding `apps/web/` to that file
would pass CI."* For ordinary paths that is correct, and CI should not pretend
to make a policy call. But one class differs in kind: a PR that edits the
allowlist, a workflow, a checker, a charter, `CLAUDE.md` or the decision log
does not merely change the product — it changes **what may merge with nobody
looking, and what agents are permitted to do**. Allowlist one of those and a bot
PR could widen its own authority and land the widening unreviewed. A single
mistaken line would be self-ratifying.

`NEVER_ALLOWLIST` in `scripts/check-automerge-allowlist.mjs` now refuses 20 such
prefixes outright, matched bidirectionally so both `docs/agents/` and a broad
`docs/` are rejected. **The mechanism that decides what merges without a human
must itself always need a human.** That rule does not get relaxed, which is why
it is code and not a sentence in a header.

*Ownership* of `.github/**` is a separate matter and does go to Paul Blart —
opening PRs there is fine; merging them is not.

### 3.5 Dependencies — a narrow grant, with the risk named

Recommend extending **Marjorie's merge envelope** (not the auto-merge workflow —
this needs a judgement step) to: PRs authored by `app/dependabot`, labelled
`dependencies`, in the **dev-dependencies** group, patch or minor, green
`build`, carrying Paul Blart's verdict comment. Production dependencies and all
majors keep needing a human.

The proof is asymmetric and that asymmetry is the whole argument: a bad *dev*
dependency breaks CI, which is the failure we want; a bad *production*
dependency can ship a transitive runtime change to users while CI stays green.

**Where this relocates risk, stated plainly:** a malicious patch release of a
dev dependency executes inside CI, which holds `SOCIAL_POSTER_PAT` and
`GMAIL_APP_PASSWORD`. Auto-merging dev deps slightly shortens the window in
which a human might notice a suspicious bump. I still recommend it — the
alternative is 15-day-old dependency PRs, which is its own security posture —
but it is a trade, not a free win, and CodeQL plus Paul Blart's weekly pass are
the compensating controls.

### 3.6 Docs — the cleanest new delegation

A documentation file that is **not** a charter, decision log, spec, proposal,
architecture doc, policy file, or `docs/launch-readiness.md` cannot change what
any agent is permitted to do. That is a checkable path property, and it is the
doc analogue of inertness: the artifact class is structurally incapable of the
harm. `docs/audits/` already merges on this logic; this simply extends it to the
rest of `docs/` minus the governance set — which the self-amendment bar (§3.4)
already enumerates and enforces.

**The counter-argument, which I take seriously:** in this repo docs *are* the
source of truth ("knowledge lives in the repo"), so a wrong doc misleads every
future session. That is exactly why the carve-out is the entire mechanism, and
why the carve-out must itself be un-amendable by an auto-merged PR — which it
now is.

### 3.7 Migrations — the case where "revert it" stops being true

Almost every delegation in this system rests on reversibility, which Joey made
the explicit T1 criterion on 2026-07-11. Migrations are where that reasoning
breaks: undoing a migration is a *new* migration, and if it dropped a column the
data is already gone. The reversibility test does not merely fail here, it
misleads — the change *looks* like a small reviewed diff. Permanent refusal.

---

## 4. What I would refuse, even though it is technically possible

1. **A single agent with "permission to solve ~all issues."** §2.1.
2. **Anything that lets an auto-merged PR change the merge rules, a charter,
   `CLAUDE.md`, or the decision log.** §3.4. Enforced in code today.
3. **Legal prose.** A published privacy policy is a representation to users and
   regulators from the moment it is live; there is no revert for having said it.
4. **Migrations.** §3.7.
5. **Bot-selected images to a public profile.** §3, row 4. The failure does not
   surface in CI, and the 2026-08-06 code guard proves only that an image is not
   *reused* — not that it is *right*.
6. **Auto-replies to comments and DMs.** Growth's charter already says
   "engagement replies stay human indefinitely" and it is correct: an unforced
   public reply is irreversible and unbounded in a way a scheduled post is not.
7. **Any new grant that vests on "a founder approved it" until identity is
   fixed.** §7 item 0.

## 5. Where "automate it" just moves the risk somewhere less visible

Four places. The first three were flagged to me; the fourth I hit while
building this.

**5.1 `needs-human-review` means two opposite things.** Austin applies it when
*Codex disagreed and the disagreement stands*. Content Shift applies it when
*Codex was merely unreachable*. Its GitHub description says a third thing
("Blocked on a human/founder decision or fix"). One means **contested**, the
other means **unreviewed**, and they are not the same risk — yet the 2026-07-18
standing grant lets Marjorie merge the class on the assumption it is the benign
one. A genuinely contested PR is currently indistinguishable from a
couldn't-reach-Codex PR. This PR ships the replacement labels
(`review:not-run`, `review:contested`); making only the former
envelope-eligible is a charter change and therefore Wyatt's call.

**5.2 Bot images fail on Instagram, not in CI.** Covered above. The general form
is worth stating because it will recur: **automation is safe in proportion to
how close the detector sits to the harm.** Every control we have for the social
pipeline lives in the repo; the harm lives on a public profile. Any future
"the checker passes, so ship it" argument about media should be read with that
gap in mind.

**5.3 Founder provenance is currently decorative.** Two collaborators, both
admin, both shared with every agent. Every grant keyed to "a founder approved
it" — including the one that vested on a comment on brief #822 — rests on an
identity the system cannot verify. This is the prerequisite in §7 item 0.

**5.4 A watchdog that is red by construction is worse than no watchdog.** On the
day this shipped, 138 open issues had no owner. A zero-threshold alarm would
have emailed both founders 138 items every morning forever, and this repo has
already proved what happens next: #947, #1177, #1203, #1224 — four consecutive
alerts, zero comments between them. Hence the committed budget file seeded at
today's real counts, and the `notEnforced` mechanism that measures `unrouted`
from day one without paging on it until routing-as-state is actually adopted.
The residual risk is the mirror image and I will name it: **a budget can be
raised to silence an alarm instead of fixing it.** Nothing in the code can stop
that. The mitigations are that raising a number is a visible one-line diff in a
file whose header says it is a policy act, and that the file cannot be
auto-merged (`.github/` is behind the self-amendment bar).

---

## 6. What is shipped in this PR (no approval needed)

| Artifact | What it does |
|---|---|
| `scripts/check-work-ownership.mjs` (+ 38 tests) | The five-condition ownership check. Pure `evaluate()` core, `gh` I/O at the edge, exit 0/1/**2** so "the check broke" can never be reported as "nothing is wrong" |
| `.github/work-ownership-budget.json` | Committed budget, seeded at today's measured backlog, with `notEnforced` reasons |
| `watchdog.yml` — new daily step | Persistent alert issue + real email, via the existing `upsert-alert.sh`. Zero AI, no `setup-node` (builtins only) |
| `scripts/marjorie/bootstrap-labels.mjs` | The `desk:*` taxonomy + the `review:not-run` / `review:contested` split. Inert until run |
| `NEVER_ALLOWLIST` in `check-automerge-allowlist.mjs` (+ 7 tests) | **The self-amendment bar.** 20 prefixes that can never be auto-merged |
| Allowlist file header | Documents the bar at the point of temptation |

None of this grants authority to anything. It makes the current state
measurable and closes one hole that a future grant could have fallen through.

## 7. Prioritised sequence

**0. Prerequisite — founder identity (TX; only a human can do it).** Create real
personal GitHub accounts for Joey and Wyatt; demote `sffan15-sys` /
`wjduvall-cmd` to `write`. Until then, any approval that must be provably human
should arrive on the Marjorie email reply path (`marjorie-inbox.yml`), which
agents cannot write to. **Everything below assumes this; nothing below should
ship a *new* provenance-dependent grant before it.**

**Do first (no decision needed):**
1. Merge this PR. The measurement starts; nothing changes.
2. Fix #669 (E2E suite stale against prod). It blocks §3.3 and it is the only
   thing standing between us and a real behavioural gate on app code.
3. Build the privacy-redline checker in `scripts/content-engine/` (§3.1) —
   the un-built remedy from the 2026-07-25 entry, and the largest unbounded
   harm inside an already-delegated class.
4. Land or close the 9 stale PRs, starting with #1629, which *is* the Phase 3.5
   fix.

**Needs Wyatt's decision:**
5. **Adopt routing-as-state** (A1/A2) — then flip `unrouted` to enforced and run
   the one-time bulk labelling pass.
6. **Escalation ratchet** (A4) — supersede the once-ever nudge cap.
7. **Red-PR loop closure** (A5) — a lane fixes its own red PR before opening a
   new one.
8. **Split `needs-human-review`** (§5.1) and make only `review:not-run`
   envelope-eligible.
9. **Extend Paul Blart** to CI/workflow repair (open PRs only, never merge).
10. **Dependency grant** — dev-dependency patch/minor into Marjorie's envelope
    (§3.5).
11. **Docs grant** — `docs/**` minus the governance set (§3.6).
12. **A11y auto-merge grant** — *after* #669 (§3.3).

**Never:**
13. A single agent with near-universal permission.
14. Auto-merge of anything that can change the merge rules, charters,
    `CLAUDE.md`, or `docs/decisions.md`.
15. Auto-merge of legal prose, migrations, or public-facing media.
16. Automated replies to real people.

## 8. Alternatives considered

**(a) Build the founder-bot as asked.** Rejected — §2.1. The four objections in
order of weight: unverifiable identity, unfenceable by construction, correlated
failure across every lane, and it does not fix the actual blockers.

**(b) Founder-bot with a *tight* fence.** Considered seriously, and it collapses
into this proposal: once you enumerate what it may touch, you have written
either an existing charter or the dispatcher pass in §2.3. The only thing the
tight version adds over routing-as-state is a second account, which makes the
provenance problem worse rather than better.

**(c) Keep prose routing, improve the nudging.** Rejected for the same reason
Joey rejected it on 2026-07-15: the bottleneck is the mechanism, not its
visibility. Also: three weeks of daily briefs restating the same unstaffed item
*is* the improved-nudging outcome, already observed.

**(d) Make routing an assignee-only convention.** Rejected on mechanics —
assignees must be collaborators, and both collaborators are shared bot
identities. The label is the only field that can name a desk.

**(e) Zero-threshold alarms instead of a budget file.** Rejected — §5.4.

**(f) Have CI decide which paths *deserve* auto-merge, not just which are
covered.** Rejected as over-reach for ordinary paths (it is a policy call and CI
should not pretend to make it), except for the one class where it is not a
policy call at all — the self-amendment bar, §3.4.

## 9. Open questions for Wyatt

1. **Identity (§7 item 0)** — do you want personal accounts now, or should
   provenance-dependent grants keep resting on the shared bot accounts with that
   limitation recorded? I recommend the former and would hold new grants until
   it lands.
2. **Docs grant scope (§3.6)** — I excluded `docs/launch-readiness.md` because
   it is the go/no-go artifact. Marjorie updates it constantly, so this is the
   one exclusion that will cost visible friction. Keep it out?
3. **Dependencies (§3.5)** — is the CI-secret exposure trade acceptable to you?
   I lean yes; you own this call.
4. **Escalation (A4)** — the once-ever nudge cap was a deliberate Codex-round
   decision. I am proposing to supersede it. If you would rather keep a hard
   ceiling, the alternative is one email per *condition* per week rather than
   per day, which preserves persistence and cuts volume further.
