# The Vault Run — build plan

**Status: IN PROGRESS.** Tick phases off as they land. Any session — this one or
a fresh one — should be able to pick this up from here without being re-briefed.

## Why

Six agents all edit the same files (`supabase/seed/**` and the regenerated
`apps/web/lib/longlive/content-vault.generated.ts`) and each opens its own PR:

| Lane | Cadence |
|---|---|
| Answerer | daily |
| Content Shift | daily |
| Photo Enrichment | daily |
| Rumor Desk | every 2 days |
| Cross-Link | Mon + Thu |
| Stylist | weekly |

That is ~4.2 content PRs/day, and **every PR costs two CI runs** — one on the
PR, one on `main` after it merges. CI is ~77% of this repo's GitHub Actions
minutes (352 runs / 474 min in the 7 days to 2026-07-27), and the account hit
90% of its included minutes on 2026-07-27.

Three wins, in increasing order of importance:

1. **Actions minutes** — ~4.2 PRs/day → 1. Saves ~6.4 CI runs/day, ≈260 min/month.
2. **Tokens** — six cold boots, six clones, six `npm ci`, six charter reads → one.
3. **It removes a bug class.** Six agents each regenerating and committing the
   same generated vault on six branches conflict *by construction*. That is what
   the hourly self-check-in loops were largely resolving before they were killed
   (see `docs/decisions.md` 2026-07-25). One run, one regeneration, no
   cross-lane conflicts. **This is the real reason to do it** — the savings are
   a bonus.

## The design, and the risk it is designed around

The obvious approach — fold six prompts into one mega-prompt — is the wrong one.
It would collapse six sets of hard-won specifics (the `focalPoint` field-order
rule that prevented a real corruption, the oEmbed `author_name` check that
caught a fan re-upload, the privacy redlines) into undifferentiated mush. That
is exactly why the four "builder" bots were cadence-staggered rather than merged
on 2026-07-25.

So instead: **each lane keeps its own versioned prompt file** in
`runner-prompts/vault-lanes/`. The orchestrator reads them and runs the lanes
sequentially in one session, supplying the shared scaffolding (clone, sync,
gate, commit, PR) so no lane repeats boilerplate.

- **One commit per lane** on the branch, so `git revert <lane commit>` still
  works selectively.
- **Per-lane failure isolation** — a lane that throws is logged and the run
  continues to the next one. One bad lane must not take out the day.
- **Lanes not due today exit in seconds.**

### Known risks

- **Session length is the real constraint.** Six lanes in one session. The
  existing per-lane caps (Answerer 3–6 ledgers, Content Shift 3 items, Photo
  Enrichment 10 pages) mostly handle it; if runs start truncating, cut caps
  before cutting lanes.
- **Review granularity** — one PR with six kinds of change is harder to skim.
  Per-lane commits are the mitigation.

## Deliberately NOT folded in

- **Growth** — writes `social/queue/`, not the vault. No conflict to solve, and
  social copy is reputational.
- **Austin** — code, not content. Different review risk entirely.
- **Kevin** — issue triage, opens no content PR.
- **Karen** — read-only on content; its PR is just a run report. Weekly and cheap.

## Phases

- [x] **Phase 1 — lane prompt files.** Extract the six lane prompts out of their
      triggers into `runner-prompts/vault-lanes/`. This also closes the registry
      gap recorded in `runners.md`: nine runners had prompts existing ONLY inside
      the trigger, so the "repo file is the source of truth" rule was vacuously
      true for exactly the agents that drifted worst.
- [ ] **Phase 2 — the orchestrator.** `runner-prompts/vault-run.md`: lane order,
      the due-today calendar, per-lane failure isolation, one commit per lane,
      one PR. Register the runner in `runners.md`.
- [ ] **Phase 3 — create and test-fire.** Create the routine (Opus, daily,
      `persist_session: false`, and **remove the `Claude_Code_Remote` connector`**
      per `routine-invariants.md` — it is added by default). Test-fire and verify:
      exactly one PR, one commit per lane, green gate.
- [ ] **Phase 4 — retire the six, measure the delta.** Only after Phase 3 looks
      good: **disable, do not delete** the six runners (warm spares — their
      prompts now live in the repo, but the triggers carry cadence history).
      Watch one full cycle, then write the `docs/decisions.md` entry and record
      the actual Actions-minutes and PR-count change.

## Rollback

Re-enable the six triggers and disable the Vault Run. Nothing is deleted in
Phase 4 precisely so this stays a two-minute operation.
