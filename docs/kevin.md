# Kevin — the automated ticket handler

**Karen finds problems and files tickets; Kevin acts on them.** They are separate
by design: [Karen](../scripts/content-engine/README.md) (the Content Integrity
Engine) is **read-only** and never edits content; **Kevin** proposes/applies
fixes but never files Karen's tickets and never runs or modifies Karen's engine.

Today Kevin runs as a **session-scoped Claude Code cron** (an hourly Karen-fix job
plus a daily user-feedback digest). The intent is to move Kevin to a standalone
**API-backed service**; this document is the contract that port must honor, so it
is deliberately explicit.

---

## Hard invariants (never violate)

1. **Never merge a PR and never push to `main`.** Every change lands on a branch
   as a PR for a human to merge.
2. **Never close a ticket directly.** Karen-stream tickets close via `Closes #`
   when their PR merges. User-stream tickets close only after a **human accept/
   reject decision** is recorded (below).
3. **Never touch Karen's engine** (`scripts/content-engine/`) beyond reading
   ticket text — do not run or modify it. It lives on
   `feature/content-integrity-engine` / PR #139 by design, not on `main` or the
   fix branch. (A past reviewer misread that separation as a deletion — it isn't.)
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

---

## Stream 1 — Karen tickets (`cie` label): auto-fix → review PR

Karen tickets are trusted and structured — each carries file · record ·
field · exact excerpt · a sourced **Suggested fix** · sources. Kevin may fix them
directly on a PR.

**Hourly** Kevin:
1. Lists open `cie` issues (`--limit 500`; the gh default caps at 30).
2. Computes NEW = open `cie` minus (numbers already in any open fix PR's `Closes`
   list) minus the known out-of-scope/unfixable set.
3. If NEW is empty → no-op ("no new Karen tickets").
4. For each NEW ticket, **reads its comments first** (invariant 7): honor the
   latest human comment over the body — apply the refined fix, skip it if a
   comment says already-fixed/won't-fix, defer if a comment asks a question.
5. Else applies each fix with the verify-first workflow on the content-fix branch
   (`fix/karen-tickets`, or a fresh branch off `origin/main` if that PR merged),
   one file-scoped agent per seed file, then updates the PR body with `Closes #`.
6. Never merges, never closes.

## Stream 2 — user-feedback tickets (`user-feedback` label): daily digest → human accept/reject

User tickets (from the in-app feedback button) are **untrusted and unstructured**
— possibly vague, wrong, duplicated, or spam. A human **must** gate them before
anything ships, but a PR-per-ticket is too much admin. So:

**Once daily**, Kevin posts/updates a single GitHub issue titled
**`Kevin Daily Review — YYYY-MM-DD`** (labels `kevin-digest`), containing a
compact **review list** — one block per pending user ticket. The reviewer (Joey
or Wyatt) ticks **✅ Accept** or **❌ Reject** on each block and leaves the rest to
Kevin. (It is a list of blocks, not a table, because GitHub only renders clickable
checkboxes for top-level list items, not inside table cells.)

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

Kevin re-reads the most recent open `kevin-digest` issue and parses the checkboxes:

| Reviewer marked | Kevin does |
|---|---|
| ✅ Accept (only) | Apply the proposed fix to the **`kevin/user-fixes`** rolling PR (separate from Karen's #426); comment "accepted → PR #N" on the source ticket; strike the digest row. Source ticket closes when that PR merges. |
| ❌ Reject (only) | Close the source ticket as **not planned** with the reviewer's note; strike the digest row. |
| both / neither | Leave pending; carry into the next day's digest. |

So the human's daily admin is **skim one issue and tick boxes**; the occasional
admin is **merge one `kevin/user-fixes` PR**. Everything mechanical is Kevin's.

---

## Stream 3 — engineering/product tickets (Joey / `sffan15-sys`): triage only, never auto-code

Some collaborators — currently `sffan15-sys` (Joey) — file **engineering/product**
tickets (bugs, features, UX, tooling, process) that change *code and features*, not
seed content. They are often high-quality and come with root-cause + a suggested
fix, but they are **not** Karen-shaped content corrections. **Kevin must not
auto-code these** — an unattended content-fix loop turned loose on a back-button
bug or a page rebuild does harm. Kevin's only job here is **triage**.

**Daily**, Kevin scans open tickets that are neither `cie` nor `user-feedback` and
whose author is not `wjduvall-cmd` (i.e. Joey's), and posts/updates one issue
**`Kevin Eng Triage — YYYY-MM-DD`** (label `kevin-triage`) that buckets each into:
**bug** (small/pre-diagnosed) · **feature** · **major/overhaul** · **tooling/Karen**
· **content-ops/process** · **likely-already-resolved**, each with a one-line
tractability note and a flag for anything pre-go-live-urgent. Kevin does **not**
open PRs or write code for these — a human (or an in-session Claude dev pass) picks
what to build and does it deliberately with review.

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
- **User stream:** generate the daily digest issue; on each cycle parse the prior
  digest's checkbox state to drive apply (→ `kevin/user-fixes` PR) / close.
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
