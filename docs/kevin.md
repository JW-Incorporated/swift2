# Kevin — the automated ticket handler

**Karen finds problems and files tickets; Kevin acts on them.** They are separate
by design: [Karen](../scripts/content-engine/README.md) (the Content Integrity
Engine) is **read-only** and never edits content; **Kevin** proposes/applies
fixes but never files Karen's tickets and never runs or modifies Karen's engine.

**Target topology (Tier-2 T-10, cutover landed 2026-09-01, HUMAN-ACTIONS
#38):** Kevin runs as **two live triggers**, both on Joey's account (fleet
policy D1=B; registered in [`docs/agents/runners.md`](agents/runners.md)):

- **Kevin — daily desk (S1+S2+S3)** (`trig_01GH3EMWdDwwKpx2GCRnCYM5`,
  `agents/runner-prompts/kevin-desk.md`), once daily at 15:13 UTC: runs
  Stream 2 (user digest) and Stream 3 (eng triage) every day, plus Stream 1
  (Karen solver) on Sundays only — one clone, one charter read, per-stream
  failure isolation (a failing stream is logged; the run continues to the
  next). First genuine end-to-end fire was 2026-09-02.
- **Kevin — S3 comment radar (cloud)** (`trig_01LaSLx4qzbsz68E6uRLkyDd`,
  `agents/runner-prompts/kevin-stream3-radar.md`) — unchanged by the T-10
  consolidation; it stays a separate, faster-cadence trigger.

The old standalone S2-digest and S3-triage triggers were disabled (not
deleted — history preserved) on 2026-08-31 as part of the cutover. **One
old trigger is deliberately still live:** `trig_01QEvYmKcpyDJJ8ec81aBjCV`
("Kevin — S1 Karen-ticket solver (cloud)", weekly Sundays 11:17 UTC) —
per HUMAN-ACTIONS #38 it stays enabled until the new desk trigger's first
real Sunday fire (next due 2026-09-06) is confirmed correct, at which point
it gets disabled too. Only the old trigger's own creator-session (or the
`claude.ai/code/routines` UI) can flip it — a same-account agent session
gets a hard `RemoteTrigger` denial otherwise, confirmed 2026-09-02. Until
that Sunday check happens, do not assume Stream 1 has fully cut over: verify
against HUMAN-ACTIONS #38's status before treating it as closed.

Before 2026-07-12 this ran as a **session-scoped Claude Code cron** — the
cloud routines are more durable (survive session death). The radar still
polls hourly where the eventual **API-backed service** target below uses
webhooks (zero-LLM until an event fires); its prompt is deliberately lazy — a
cheap deterministic comment check runs first and Kevin's full context loads
only on a real hit — so the frequent empty runs stay cheap. This document
remains the contract that both the cloud routines and any future service
port must honor, so it is deliberately explicit.

---

## Hard invariants (never violate)

1. **Never merge a PR and never push to `main`.** Every change lands on a branch
   as a PR for a human to merge.
2. **Never close a ticket directly.** Karen-stream tickets close via `Closes #`
   when their PR merges. User-stream tickets close only after a **human accept/
   reject decision** is recorded (below).
3. **Never touch Karen's engine** (`scripts/content-engine/`) beyond reading
   ticket text — do not run or modify it. **As of 2026-07-11 PR #139 merged, so
   the engine now lives on `main`** (it previously sat on
   `feature/content-integrity-engine` by design; a past reviewer once misread
   that separation as a deletion — it wasn't). Its location changed; the rule
   did not: Kevin never runs or modifies it. Per its trust model, credentialed
   unattended runs happen on trusted branches only until the content-inertness
   CI check (#488) lands — that's Wyatt's to wire, not Kevin's.
4. **Validate before every commit:** `node scripts/validate-content.mjs` must
   report 0 errors and `node --check` must pass on each edited file.
5. **Image fixes are verify-first:** never write an image URL unless it returns
   HTTP 200 + `Content-Type: image/*` **and** is downloaded + vision-confirmed to
   match its caption (see [`.karenfix/IMAGE-FIX-PROTOCOL.md`]). Never strip a
   record to zero photos; if nothing verifies, skip and report it.
6. **Two streams stay separate** (different trust levels, different PRs, below).
7. **Always read a ticket's comments, not just its body.** Before acting on any
   ticket in any stream, fetch its comments
   (`gh issue view <n> --repo JW-Incorporated/swift2 --comments`). A later human
   comment can **refine** the suggested fix, **redirect** it, **approve** a
   proposed plan, mark the ticket **already-resolved / duplicate / won't-fix**,
   or **cancel** the work. **The most recent human comment wins over the original
   body.** Never apply a body's stale suggested fix when a comment has since
   corrected or retracted it, and never re-do work a comment says is already done.
8. **Any audit summary relayed to the founders states its scope in the first
   line** (e.g. "prose + sourcing only; photos not checked") — see the
   [audit-reporting scope convention](definition-of-done.md#audit-reporting-scope-convention).
   Applies to anything Kevin posts into the Founders' Brief or a kanban/PR
   comment that reports an audit's verdict, not just Karen/CIE output.

---

## Stream 1 — Karen tickets (`cie` label): auto-fix → review PR

Karen tickets are trusted and structured — each carries file · record ·
field · exact excerpt · a sourced **Suggested fix** · sources. Kevin may fix them
directly on a PR.

**Weekly, on Sundays, once the T-10 cutover lands** (folded into the desk's
Step 0 — see the top of this document; until cutover, this stream still runs
on its own separate weekly trigger, unchanged), Kevin:
1. Lists open `cie` issues (`--limit 500`; the gh default caps at 30).
2. Computes NEW = open `cie` minus (numbers already in any open fix PR's `Closes`
   list) minus every ticket carrying an **exclusion label** (below).
3. If NEW is empty → no-op ("no new Karen tickets").
4. For each NEW ticket, **reads its comments first** (invariant 7): honor the
   latest human comment over the body — apply the refined fix, skip it if a
   comment says already-fixed/won't-fix, defer if a comment asks a question.
5. Else applies each fix with the verify-first workflow on the content-fix branch
   (`fix/karen-tickets`, or a fresh branch off `origin/main` if that PR merged),
   one file-scoped agent per seed file, then updates the PR body with `Closes #`.
6. Never merges, never closes.

### The parked set — how a ticket leaves Kevin's queue

**A ticket may only leave Stream 1 by carrying a label. Never by issue number.**

| Label | Meaning | Expires? |
|---|---|---|
| `cie:safety` | Safety/red-line finding. Escalated to a founder; an unattended agent must never "fix" one. | No — permanent class rule |
| `cie:escalate` | Karen demanded human review now. | No — permanent class rule |
| `kevin-skip` | This *specific* ticket is parked, for a reason recorded in a comment on the ticket, with a review date. | **Yes — every park states a review date** |

Applying `kevin-skip` without a comment giving **(a) the reason and (b) a review
date** is a defect. `.github/workflows/unowned-sweep.yml` re-lists every parked
ticket in its standing ledger on every run, with its age, so a park can never
become permanent through silence.

> **Why this section exists (2026-08-11).** From 2026-07-14 the Stream 1 prompt
> subtracted a hardcoded set — `{194,203,206,298,301,153,137,138}` — introduced
> wholesale in the cloud-routine migration (#520) with no rationale in the
> commit, no expiry, and no tracking ticket. Those eight tickets were therefore
> **permanently unowned by construction**, and no other scanner's filter reached
> them. The audit that removed it found: two were stale duplicate rollups
> superseded four times over; **one was the PhotoDNA/NCMEC CSAM-detection
> ticket**, which needed a founder, not a skip; and **five were ordinary
> watermarked-image fixes of a class Kevin had already fixed successfully
> elsewhere** — `supabase/seed/content/reputation.mjs` carries an in-file note
> where Stream 1 replaced a `tayswiftstyle` collage under rollup #751 on
> 2026-07-23, the same host and same defect as parked #298/#301. The individual
> tickets were never the bug. **The silent, permanent, unreviewable exclusion
> was the bug.**

## Stream 2 — user-feedback tickets (`user-feedback` label): daily digest → human accept/reject

User tickets (from the in-app feedback button) are **untrusted and unstructured**
— possibly vague, wrong, duplicated, or spam. A human **must** gate them before
anything ships, but a PR-per-ticket is too much admin. So:

**Once daily**, Kevin first checks for an **open `founders-brief`-labeled
issue** titled `Founders' Brief — YYYY-MM-DD` for today (America/Los_Angeles
date — Marjorie posts by ~12:40 UTC / 6:00 AM PT, before Kevin's S2 run at
13:15 UTC, so the brief is normally already up):

- **Brief exists (normal mode, per §5.2, decisions.md 2026-07-11 — founders
  read ONE daily artifact):** Kevin posts Kevin's review list as a comment on
  that brief issue — never the brief body itself (Marjorie never edits her
  own body after posting either; comments are the shared convention). The
  comment carries a hidden anchor `<!-- kevin-stream2-digest -->` as its
  first line.
  **Append-and-supersede, not edit-in-place (2026-09-01, #3631):** Kevin's
  cloud sessions have no GitHub comment-edit tool — the GitHub MCP server
  they run with exposes `add_issue_comment` (create only), nothing that
  PATCHes an existing comment body, and direct `gh`/REST access is
  explicitly disabled in that environment. A same-day re-run therefore
  **posts a new comment** carrying the same anchor as its first line, with
  a second line reading exactly `_Supersedes the earlier comment(s) above
  with this anchor — read this one._` The **most recent** comment carrying
  the anchor is always the current digest; older anchored comments are
  historical and must not be re-acted-on. See "Decision processing" below
  for how a re-run locates the current one.
- **No brief exists today (degraded mode):** Kevin falls back to the
  standalone issue below, unchanged from today's behavior.

Either way the content is the same compact **review list** — one block per
pending user ticket. **The reviewer is Joey (`sffan15-sys`)** — per
`CLAUDE.md` § "The company" (2026-08-31), Joey is the sole active
decision-maker on this project; Wyatt remains an owner but no longer takes
actions or makes decisions here, so a `wjduvall-cmd` tick is not
authoritative and must be left pending, not acted on. Joey ticks
**✅ Accept** or **❌ Reject** on each block and leaves the rest to Kevin.
(It is a list of blocks, not a table, because GitHub only renders clickable
checkboxes for top-level list items, not inside table cells — true in both
an issue body and a comment.)

**Standalone/degraded mode:** Kevin posts/updates a single GitHub issue
titled **`Kevin Daily Review — YYYY-MM-DD`** (labels `kevin-digest`) with the
same review-list content.

### Digest block format

```
### 🎫 #501 — Broken photo on the 1989 polaroid page
Reported by **user** · 1989 › moment detail (`1989|2014|10|Polaroids…`) · [#501](issue-url) · confidence: **high**

**User said:** “the polaroid pic on the 1989 page won’t load for me”

**Kevin’s read:** dead image — `supabase/seed/content/1989.mjs` › "Polaroids…" `moment.photos[0].url` 404s.
**Proposed fix:** replace with a verified Wikimedia Commons photo (HTTP 200 + vision-checked).

<details><summary>before → after</summary>

- - `https://dead.example/x.jpg`
- + `https://upload.wikimedia.org/…/1989-polaroids.jpg`
</details>

- [ ] Accept #501
- [ ] Reject #501
```

Tickets Kevin can't confidently fix go under a **“Needs human decision”** heading
with no proposed change — the reviewer comments instructions or ticks Reject.

### Decision processing (next Kevin run)

Kevin locates the prior review list before doing anything else, checking in
order:
1. The most recent open `founders-brief` issue; among its comments, the
   **most recently posted** one carrying the `<!-- kevin-stream2-digest -->`
   anchor as its first line (normal mode). If more than one anchored comment
   exists on that issue — a same-day re-run under the append-and-supersede
   convention above — the latest one by creation time is authoritative;
   earlier anchored comments on the same issue are stale and must be
   ignored, never re-parsed for checkbox state.
2. Else the most recent open `kevin-digest` issue (standalone/degraded mode)
   — this one genuinely is edited in place (`issue_write`/`gh issue edit`
   covers the issue body, unlike a comment), so there is only ever one.

Kevin re-reads whichever it finds and parses the checkboxes:

| Reviewer marked | Kevin does |
|---|---|
| ✅ Accept (only) | Apply the proposed fix to the **`kevin/user-fixes`** rolling PR (separate from Karen's #426); comment "accepted → PR #N" on the source ticket; strike the digest row. Source ticket closes when that PR merges. |
| ❌ Reject (only) | Close the source ticket as **not planned** with the reviewer's note; strike the digest row. |
| both / neither | Leave pending; carry into the next day's digest. |

So the human's daily admin is **skim one artifact (the brief, or the
standalone digest in degraded mode) and tick boxes**; the occasional admin is
**merge one `kevin/user-fixes` PR**. Everything mechanical is Kevin's.

---

## Stream 3 — engineering/product tickets (Joey / `sffan15-sys`): triage only, never auto-code

Some collaborators — currently `sffan15-sys` (Joey) — file **engineering/product**
tickets (bugs, features, UX, tooling, process) that change *code and features*, not
seed content. They are often high-quality and come with root-cause + a suggested
fix, but they are **not** Karen-shaped content corrections. **Kevin must not
auto-code these** — an unattended content-fix loop turned loose on a back-button
bug or a page rebuild does harm. Kevin's only job here is **triage**.

**Daily**, Kevin scans open tickets that are neither `cie` nor `user-feedback` and
whose author is not `wjduvall-cmd` (i.e. Joey's), and buckets each into:
**bug** (small/pre-diagnosed) · **feature** · **major/overhaul** · **tooling/Karen**
· **content-ops/process** · **likely-already-resolved**, each with a one-line
tractability note and a flag for anything pre-go-live-urgent. Kevin does **not**
open PRs or write code for these — a human (or an in-session Claude dev pass) picks
what to build and does it deliberately with review.

Kevin posts the result the same way Stream 2 does (§5.2, decisions.md
2026-07-11 — founders read ONE daily artifact): first check for an open
`founders-brief`-labeled issue titled `Founders' Brief — YYYY-MM-DD` for
today (America/Los_Angeles date).

- **Brief exists (normal mode):** post **one comment** on that brief
  issue — never the brief body — carrying the hidden anchor
  `<!-- kevin-stream3-triage -->` as its first line.
  **Append-and-supersede, not edit-in-place (2026-09-01, #3631):** same
  constraint and convention as Stream 2 above — no comment-edit tool is
  available, so a same-day re-run posts a new anchored comment with the
  second line `_Supersedes the earlier comment(s) above with this anchor —
  read this one._` rather than editing the prior one. The most recent
  anchored comment on the issue is the current triage; ignore older ones.
- **No brief exists today (degraded mode):** fall back to the standalone
  issue **`Kevin Eng Triage — YYYY-MM-DD`** (label `kevin-triage`), unchanged
  from today's behavior — this one is a genuine issue-body edit, so there is
  only ever one.

Stream 3 has no next-day checkbox decision-processing step to redirect (each
day's triage re-derives its buckets from ticket-level comments, not from
digest-row state), so this is the whole of the change here.

> **Known gap (flagged, not fixed by this change):** Austin's cadence
> (`docs/agents/austin.md`) polls "after each Kevin Eng-Triage posts, and
> hourly otherwise" — a trigger keyed on the standalone `kevin-triage`-labeled
> issue. In normal mode, no such issue posts, so on a normal day Austin only
> picks up new buckets on its hourly fallback poll instead of immediately.
> This is a latency regression (up to ~1h), not a correctness break, and is
> Austin's side to fix if it matters — out of scope here since #480 only asks
> for Kevin's side.

> **Handoff (2026-07-11, once Austin activates):** the **tractable subset** —
> `bug (small/pre-diagnosed)` and `ready/greenlit` buckets that also pass
> Austin's scope fence (`docs/agents/austin.md`: reversibility, change-type
> allowlist, diff bounds, founder/desk-authored) — becomes the defined
> "in-session Claude" for those tickets, on a cadence instead of ad hoc.
> Kevin's own role and invariants are unchanged: he still triages, still
> never codes; his triage output is Austin's *intake*, never authorization —
> every Austin PR is human-merged (v1). Everything outside that subset stays
> exactly as this section says: a human picks it up deliberately.

Because these tickets are where humans **discuss** (Joey signs off on a phased
plan, changes a priority, or says "resolved" in a comment), the triage pass
**reads each ticket's comments** (invariant 7) and reflects the latest human
signal in the triage buckets — e.g. move a plan-approved ticket to a
"ready/greenlit" bucket, mark a commented-resolved one for close-confirmation,
or bump priority a comment raised. Kevin still never auto-codes; it surfaces the
decision, a human acts.

### Stream 3 comment radar (fast poll — filed as #451)

Once-daily triage is too slow for **coordination between two AI sessions**
(Joey's and Wyatt's), which happens in comments: a review finding on an open PR,
or an answer to a "decisions needed" item on a phased plan, can otherwise sit
unread for up to a day. (This mechanism exists because we hit exactly that — a
PR collected three more commits after a review flagged four issues, none
addressed, because nothing re-read the comment.) So, **in addition to** the daily
triage, Kevin runs a **cheap, frequent comment radar**:

1. **Deterministic, LLM-cheap check every ~10 min** (materially shorter than
   daily; tune freely). ONE repo-wide API call —
   `gh api "/repos/JW-Incorporated/swift2/issues/comments?since=<~13-min-ago>&per_page=100"`
   (covers issue *and* PR-conversation comments) — plus, for open PRs, a glance
   at new review state. Drop bot/self authors (`vercel`, `github-actions`,
   `wjduvall-cmd`/self). NEW = human comments in the window on Stream-3 threads
   (eng/product tickets + their PRs), minus comment IDs already surfaced (Kevin
   records surfaced IDs in the radar issue below, so re-runs are idempotent and
   the ~3-min window overlap never double-flags).
2. **If NEW is empty → stop immediately** ("radar: no new comments"). No agents,
   no real reasoning — same "compute NEW before doing work" discipline as
   Stream 1. Real reasoning is spent only when something new actually appears.
3. **If NEW is non-empty**, Kevin reads each thread and, per the fixed behavior
   table below, **surfaces** it — it never codes.

| New comment is… | Kevin does (never auto-codes) |
|---|---|
| A **review finding on an open PR** (approve / changes-requested / a plain list of issues) | Surface it **prominently** to Wyatt: post/refresh one pinned **`Kevin Review Radar — YYYY-MM-DD`** issue (label `kevin-radar`) summarizing the finding, the PR, and a direct link, so it can't be lost while the PR keeps collecting commits. Flag actionable code review as "needs Wyatt / in-session dev pass." |
| An **answer to an open "decisions needed" item** on a phased-plan or triage post | Update that plan/triage entry to record the decision and mark the item **ready-to-build** for Wyatt. |
| Anything else Stream-3 relevant | Note it in the radar issue. |

**The `never auto-code Stream 3` invariant is unchanged and explicitly
preserved.** Faster comment-awareness feeds *better, faster surfacing* to a human
(or an in-session Claude dev pass) — it must never be read as license to start
writing code against a product/UX ticket or a PR review unattended. An
unattended loop turned loose on a back-button bug or a page rebuild does harm;
that boundary stays exactly as strict as it is today.

## Migrating Kevin to an API

A service implementation must replicate this contract exactly:

- **Inputs:** GitHub Issues API — poll `cie` and `user-feedback` labels, **and
  each ticket's comments** (invariant 7: latest human comment overrides the body).
- **State/idempotency:** GitHub *is* the store, no DB required. "Already handled"
  = numbers in open fix-PR `Closes` lists + strike-through state in the current
  digest. Handle each ticket at most once.
- **Karen stream:** an LLM applies the ticket's suggested fix (text) or does
  verify-first image re-sourcing; emit/refresh one PR with `Closes #`.
- **User stream:** check for today's open `founders-brief` issue first; if
  present, generate the review list as a comment there (anchor
  `<!-- kevin-stream2-digest -->`; if a comment-edit API is unavailable to
  the caller, append-and-supersede per 2026-09-01/#3631 rather than
  duplicating without an anchor), else generate the standalone digest issue
  (a real edit, since issue bodies are PATCHable). On each cycle, locate the
  **most recent** anchored comment (or the standalone issue) and parse its
  checkbox state to drive apply (→ `kevin/user-fixes` PR) / close.
- **Eng-triage stream:** same founders-brief-first check (anchor
  `<!-- kevin-stream3-triage -->`, same append-and-supersede fallback), else
  the standalone `kevin-triage` issue. No cross-cycle checkbox state to
  carry — buckets re-derive from ticket comments each run.
- **Stream 3 comment radar:** subscribe to issue/PR-comment + PR-review **webhooks**
  (the API port's answer to the session cron's ~10-min poll — true zero-LLM until
  an event fires); on a human comment, run the radar behavior table and refresh
  the `kevin-radar` issue. Idempotency = surfaced comment IDs recorded in that
  issue. **Still never auto-codes Stream 3.**
- **Secrets:** a GitHub token with `issues:write` + `contents:write` (for PRs).
  Never commit it; inject via env/secret manager.
- **Invariants:** enforce the "Hard invariants" section in code — especially
  never-merge, never-auto-close-user-tickets-without-a-decision, and verify-first
  images. These are safety properties, not conveniences.

[`.karenfix/IMAGE-FIX-PROTOCOL.md`]: ../.karenfix/IMAGE-FIX-PROTOCOL.md
