# Gap analysis: the agentic operating model vs. real-world SDLC practice

**Commissioned by Joey, 2026-07-11**, after #470 exposed that the model
coordinates work but nothing executes the queued tractable backlog — a gap
the Build-desk proposal (same-day) closes. This review asks: *what else did
the model miss?* Method: walk the standard practice areas of software
delivery (backlog management, CI/CD and release engineering, incident
response, security, testing, compliance, flow control) and check each
against what the model + repo actually have today. Written by the model's
own author — bias acknowledged, which is why the follow-up Codex pass on
this document is part of the deliverable.

## Summary table

| # | Gap | Severity | Fix | Status |
|---|---|---|---|---|
| G2 | **Merging IS deploying** — Vercel auto-deploys `main`, so "deploys stay human" and "auto-merge gate" quietly contradict | High | Founder decision: define the prod-promotion step before any auto-merge class activates | **Banked — must precede §5.4 gate** |
| G3 | `main` is not branch-protected — "never commit to main" is convention, not enforcement | High | Enable protection: PR required + `build` check required (repo settings — founder TX, ~3 min) | **Banked as TX — Austin activation precondition** |
| G4 | No backup/restore story for Supabase (content DB) | High (pre-launch) | Verify Supabase backup tier, document restore runbook, test one restore | Ticket |
| G5 | No privacy/ToS posture — and it's more than future analytics: the feedback endpoint **already** collects free-text user messages + page/UA/environment data into public GitHub issues; the audience predictably includes minors | High (launch gate) | Privacy policy + ToS before launch covering retention, deletion requests, what feedback submission publishes, minors, analytics consent; ties into the existing IP-counsel gate | Ticket, L-track |
| G14 | Per-agent identity & least privilege — scheduled agents act under founder GitHub identities with broad tokens; provenance checks constrain charters, not actors; no rotation/audit story | High | Phase-2 service migration gets teeth: per-agent tokens (issues-only for Marjorie, contents+PR for Austin), rotation cadence, and per-actor audit — pull forward from "someday" to a scheduled phase | Ticket (Phase 2) |
| G10 | No documented "pause the org" kill switch | **High before any autonomous coder runs** (was Medium — Codex round) | One README section: disable routines at claude.ai/code/routines, watchdog stays, labels to freeze desks | **Austin activation precondition** |
| G1 | No owner for queued tractable eng tickets | Medium (throughput, not safety — reranked in Codex round) | Build-desk autonomous lane (Austin) | Proposal in this PR |
| G6 | No dependency-vulnerability scanning | Medium | Enable Dependabot/`npm audit` in CI (config PR, cheap) | Ticket |
| G7 | Stale-PR pileup — 3 draft PRs open since 2026-07-04..08 with no policy | Medium | Kevin radar flags PRs idle >7 days into the brief: finish, close, or re-scope. For Austin PRs specifically, the WIP limit acts far earlier (3 open blocks new work) | Charter tweak |
| G8 | No regression-test-per-bug-fix rule | Medium | Adopted into Austin's charter (§4.4); adopt repo-wide via CLAUDE.md when convenient | Partially adopted |
| G9 | No incident-response runbook (T3 pages exist; what happens *after* the page is undefined) | Medium (launch) | One-page runbook: roles, comms, rollback, blameless postmortem feeding manager-hat retros | Ticket, L-track |
| G15 | GitHub itself is unbacked-up operational state — the decision bank, briefs, journals, and audit trail live only in Issues/PRs | Medium | Periodic export (scheduled Action dumping issues/comments JSON into the repo or storage); repo code is already distributed by clones | Ticket |
| G11 | Backlog aging invisible — cadence health watches desks, not queues | Low | Brief Health gains queue depth + oldest-item age per desk (Austin's spec §5 starts this) | In proposal |
| G12 | Definition of Ready implicit in Kevin's "tractable" judgment | Low | Made explicit in Austin's scope checklist (§3.3); good enough at this scale | Adopted |
| G13 | Persistent Vercel check noise — the second Vercel project fails on every cross-founder PR | Low (but erodes signal) | Founders reconcile the two Vercel projects (docs/deploy.md names the canonical one) or drop the stale integration | Banked as TX |

## The two findings that matter most

**G2 — merge = deploy.** The model says "deploys stay human, full stop" and
separately grants (in direction) an auto-merge gate for content PRs. But this
repo deploys `main` to production automatically via Vercel — so the day the
merge gate activates, the gate *is* deploying to prod, and "deploys stay
human" is false in practice. Real-world release engineering separates
integrate (merge) from release (promote); Vercel supports this cleanly
(disable auto-promotion; a human — later a gated step — promotes a built
deployment). This must be decided **before** the inertness check (#488)
activates the merge gate, or the gate silently acquires deploy authority
nobody granted. Options: (a) accept merge=deploy for content-only changes
explicitly (a founder decision restating §5.4's grant to include deploy for
that class), or (b) turn off auto-promotion and add a promote step. Either is
fine; *undecided* is not.

**G3 — branch protection.** Every "never merge/push to main" invariant in
every charter is convention. One compromised or buggy agent (or a human
slip) can push to `main` directly today. GitHub branch protection (require
PR + require the `build` check) makes the rule mechanical — it's the
cheapest, highest-leverage hardening available and it's a 3-minute founder
settings change.

## Practices considered and deliberately NOT adopted (right-sized for a
2-founder + agents shop — revisit at real scale)

- **Estimation/story points/velocity:** manager-hat cycle-time telemetry
  gives the same signal without the ceremony.
- **Formal WIP limits/kanban boards — for humans.** The brief + label queues
  are the board. *(Revised in the Codex round: for autonomous producers this
  rejection was unsound — Austin gets a hard WIP limit (3 open PRs block new
  claims), because an agent's output rate is a policy choice, not a fact of
  life.)*
- **Merge queues / trunk-based feature flags:** PR volume nowhere near
  needing them.
- **Separate staging environment:** Vercel previews give per-PR staging
  *conditionally on G2 being resolved* — if founders keep merge=deploy for
  some classes, previews alone are the whole pre-prod story and this
  rejection should be revisited; if they add a promote step, previews +
  held promotion are an adequate staging equivalent at this scale.
- **Formal change-advisory board:** the decision bank *is* the CAB, minus
  the meetings.
- **Coverage-percentage gates:** invite gaming; the regression-per-bug rule
  (G8) plus Codex review target the real risk.

## What the model already does well against the same yardstick

For balance: spec-before-code (rule 1), mandatory independent review
(cross-provider — stronger than most human shops), CI gates on every PR,
docs-as-code with same-change updates, decision log as ADR practice,
retro/telemetry loop (manager hat), on-call paging with a non-AI watchdog,
cost caps, and blameless-by-construction audit trails. The gaps above are
mostly the *operational* edges (release engineering, DR, legal) that a
pre-launch product hasn't hit yet — which is exactly why they're written
down now, before launch makes them incidents.

---

## Appendix — Codex adversarial pass (2026-07-11)

Six findings on this document, all accepted with edits: G1 downranked to
Medium (throughput ≠ safety class); G10 upranked to High and made an Austin
activation precondition; G5 rescoped from "legal pages someday" to the data
the app *already* collects (feedback text + UA into public issues, minors in
the audience); **G14 added** — per-agent identity/least-privilege/rotation
was the missing practice area central to this very model (agents currently
act as founders); **G15 added** — GitHub Issues/PRs are unbacked-up
operational state (the decision bank and audit trail live nowhere else); the
staging and WIP-limit rejections were softened/reversed as recorded inline.
The meta-point stands accepted too: the author's first pass missed exactly
the categories (identity, data his own tools collect) closest to his own
design — which is why cross-provider review of self-audits stays mandatory.
