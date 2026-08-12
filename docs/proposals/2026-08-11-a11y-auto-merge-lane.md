# The a11y auto-merge lane: design, and why it cannot be turned on yet

**Status:** PROPOSAL / **REFUSAL to ship a loose lane.** Decision-log entry:
`docs/decisions.md`, 2026-08-11 ("Merge-machinery consolidation … and the
a11y-lane refusal"). Written by the CTO engineering session while consolidating
#1910 + #1941.

**Builds on:** #1910 §3.3 (the a11y grant is *blocked on #669*) and #1941 §2b
(refuse it as a *path* widening; it needs a dedicated a11y CI lane). This doc is
the concrete follow-through on both: it designs the lane in full **and** shows,
leg by leg, that the proof it would stand on does not exist today. Per the brief,
**a loose a11y auto-merge that lets arbitrary `.tsx` through is worse than the
status quo, so none ships.**

---

## 0. The goal, and the one honest question

Austin's a11y fixes (#701/#703/#727/#1580/#1596/#1619 — hit-area, spacing,
heading-level) are `.tsx` app-code PRs that today wait on a human merge. That
human merge is the friction the founder wants gone. The question is **not** "do
we trust Austin's lane?" It is the `check-content-inert.mjs` question, applied to
a *change class* instead of a *file class*:

> Is there a **mechanical property**, checkable at PR time, that proves this
> class of change cannot cause the harm we are removing the human to catch?

For seed content the answer is yes (a positive AST grammar proves the file can
only build a constant). For an a11y `.tsx` change, the honest answer today is
**no** — and the rest of this doc is why, plus exactly what would make it yes.

---

## 1. The gate design (what a safe lane WOULD be)

A safe a11y auto-merge lane is the AND of four independent legs. Each substitutes
for one thing the human merge currently does. Auto-merge fires only if **all
four** hold; any one failing declines to a human — the same fail-safe direction
as `auto-merge-content.yml`.

| Leg | What it proves | Proposed mechanism |
|---|---|---|
| **L1 — Identity** | The PR came from the a11y runner, not an arbitrary actor | Author is the Austin runner **and** the PR carries `austin-built` + an `a11y` label |
| **L2 — Bounded diff** | The change is within an a11y-safe envelope, not arbitrary app code | A dedicated checker (`check-a11y-diff`) proving the diff touches only `apps/web/**` `.tsx`/CSS, stays inside Austin's ≤5-file/≤150-line fence, and edits only an enumerated set of a11y-relevant constructs |
| **L3 — a11y correctness** | The ticket's named violation is actually gone, and no new one appeared | A **per-PR** axe/pa11y run against the PR build that asserts the ticket's WCAG violation ID cleared and the violation set did not grow |
| **L4 — No behavioural regression** | The change did not break a user flow the a11y scan can't see | The E2E suite (`e2e.yml`) green against the PR build |

The lane would be its own workflow (`auto-merge-a11y.yml`), keyed on the L1
labels, calling L2/L3/L4 as required checks, reading the same `hold` /
`SOCIAL_FREEZE`-style kill switch, and reading its author/label allowlist **from
the base ref** (never PR head) — the identical anti-self-widening posture the
content lane already uses. Note it does **not** go through the content path
allowlist: `.tsx` is not content, and widening the content allowlist to app code
is exactly what #1941 refused.

---

## 2. Why it cannot be turned on today — leg by leg, with the missing proof

Every leg is currently missing or unsound. This is not "needs polish"; it is four
absent preconditions.

### L1 — Identity: **decorative today.**
Both repo collaborators (`sffan15-sys`, `wjduvall-cmd`) are shared by every
agent; Austin runs as `wjduvall-cmd`, the same account Wyatt approves from
(#1910 §2.1, §5.3). So "authored by Austin" is unverifiable — any agent, or a
compromised run, presents the same identity. GitHub's own `dependabot[bot]` actor
is trustworthy because it is *GitHub's*, not ours; we have no equivalent for
Austin.
**Acceptance test that would close it:** real per-person/per-agent GitHub
identities (the #1910 §7-item-0 TX prerequisite), so the author check is a fact
GitHub asserts, not a label any agent can apply.

### L2 — Bounded diff: **no sound envelope exists.**
There is no `*.a11y.*` file convention (#1941 §2b confirmed), so a path fence
cannot select a11y changes — an a11y fix and an arbitrary feature change are both
just `.tsx`. A *diff-shape* checker (allow only edits to `aria-*`, `role`,
`min-height`/`min-width`, spacing tokens) is constructible, but it is **not a
safety proof**: unlike a constant seed object, those very attributes change
runtime behaviour — `role="button"` wires semantics, a `min-height` bump can
reflow or clip a layout, a spacing change can move a hit target off a control.
So L2 can bound *scope* but cannot, alone, prove *inertness*. It is necessary but
not sufficient, which is why L4 is non-negotiable.
**Acceptance test that would close it:** a `check-a11y-diff.mjs` (built like
`check-content-inert.mjs`, positive-grammar over the TSX AST) that is **paired
with L4** — the bound makes the E2E net's job small and legible; it never
replaces it.

### L3 — a11y correctness: **there is no per-PR a11y check at all.**
`a11y.yml` today runs axe + pa11y against **production** (`www.longlivets.com`),
on a **daily schedule**, `continue-on-error: true`, with **no `pull_request`
trigger**. It therefore proves nothing about a PR's diff — it inspects the
already-deployed site after the fact, and it cannot fail a merge because it is
non-blocking. There is also no per-PR **preview deployment** evident in the repo
for it to scan.
**Acceptance test that would close it:** a required `pull_request` a11y job that
builds the PR, serves it (preview deploy or local server in CI), runs axe/pa11y
against **that build**, and asserts (a) the specific WCAG violation ID named in
the ticket is absent and (b) the total violation count did not increase vs. base.
That is a proof of the ticket's own acceptance criterion — the inertness move
applied to a change class — and it does not exist yet.

### L4 — No behavioural regression: **the net is down (#669).**
An a11y pass does not prove the page still *works*; the E2E suite is what would.
All E2E tests fail uniformly against prod (#669, open since 2026-07-15), so there
is no green behavioural gate to require. #1910 already names this as the hard
blocker on the whole grant.
**Acceptance test that would close it:** `e2e.yml` green and required on the a11y
lane's PRs.

---

## 3. The refusal, stated plainly

Three of the four legs are absent (L1 identity, L3 per-PR a11y check, L4 E2E) and
the fourth (L2) is unsound on its own. Shipping a lane now would mean auto-merging
`.tsx` app code on the strength of a **label any agent can apply** and a
**production, non-blocking, schedule-only** scan that never saw the change — i.e.
arbitrary app code riding through on no real proof. That is precisely the outcome
the brief says is worse than the status quo. **So this PR ships no
`auto-merge-a11y.yml`, no author/label allowlist, and no content-allowlist
widening to `.tsx`.** The a11y lane stays human until the four acceptance tests
above pass.

## 4. The order to build it (each item is independently useful)

1. **L3 first — a per-PR a11y check** (`pull_request`-triggered, required, scans
   the PR build, asserts the named violation cleared + no net-new violations).
   This is valuable on its own (it gates a11y *correctness* for every app PR,
   auto-merge or not) and is the single most load-bearing missing piece. It is
   Laura/Austin desk work — a build, not an allowlist line — and is why #1941
   routed the a11y lane to "a dedicated a11y CI lane" rather than the allowlist.
2. **L4 — fix #669** so E2E is a real, green, required behavioural gate.
3. **L2 — `check-a11y-diff.mjs`**, the positive-grammar diff bound, paired with L4.
4. **L1 — real identities** (#1910 §7 item 0), so the author leg is a GitHub fact.
5. **Only then** `auto-merge-a11y.yml`, keyed on L1 labels, requiring L2+L3+L4,
   base-ref allowlist, kill switch — reviewed as its own PR, because it grants a
   new auto-merge authority over app code and deserves the scrutiny the content
   lane got.

Until step 5's preconditions are all green, the honest state is: **a11y fixes are
small, human-merged PRs**, and the friction is removed by fixing #669 and landing
the per-PR a11y check — not by handing app-code merge authority to a label.
