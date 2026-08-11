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

## Resolved: the 2026-07-30 Actions-minutes block

From 07:54 UTC on 2026-07-30 every workflow in this repo failed in 0-5 seconds
with "The job was not started because recent account payments have failed or
your spending limit needs to be increased." Nothing could merge, including the
Phase 3.5 PR that fixes the red-PR blind spot. That is why #1629 sat unmerged:
it was green-blocked, not broken.

**Billing was fixed and CI has been running normally since.** Verified
2026-08-11: `build` is passing on `main` and on #1629 itself. This section is
kept as history only — do not read the paragraphs that used to live here as a
live status. It is also the reason the alert burst everyone expected on 07-30
never needed triaging: by the time detection landed, the failures it would have
reported were gone.

The durable lesson is in `docs/decisions.md` (2026-08-11): this repo is
cost-sensitive on Actions minutes, so anything that can trigger a CI run on a
schedule needs an explicit cap. The stuck-PR watchdog check carries one.

## Phases

- [x] **Phase 1 — lane prompt files.** Extract the six lane prompts out of their
      triggers into `runner-prompts/vault-lanes/`. This also closes the registry
      gap recorded in `runners.md`: nine runners had prompts existing ONLY inside
      the trigger, so the "repo file is the source of truth" rule was vacuously
      true for exactly the agents that drifted worst.
- [x] **Phase 2 — the orchestrator.** `runner-prompts/vault-run.md`: lane order,
      the due-today calendar, per-lane failure isolation, one commit per lane,
      one PR. Register the runner in `runners.md`.
- [x] **Phase 3 — create and test-fire.** VERIFIED 2026-07-30 — PR #1625, "vault: 2026-07-30 — 4 lanes shipped": one PR, one commit per lane (`lane(content-shift)`, `lane(photo-enrichment)`, `lane(rumor-desk)`, `lane(cross-link)`, plus `vault: regenerate`), green `build`, files confined to `supabase/seed/` + the generated vault. It named every lane's outcome including the two that did nothing (Answerer no-op: zero open curiosity-ledgers; Stylist not due: Sundays), disclosed trimming a lane for budget, and self-corrected a `no-dupe-keys` trip it caused. ORIGINAL NOTES: created Routine CREATED:
      `trig_01EuLgUdMgbuqL51o3iWQfTL`, Opus, daily `7 16 * * *`,
      `persist_session: false`, `Claude_Code_Remote` stripped (it WAS added by
      default, exactly as `routine-invariants.md` warns — and the API silently
      refused to remove it, so it had to be done in the UI). Test-fired
      2026-07-30T05:49Z against the heaviest realistic load: Thu + even
      day-of-month = 5 of 6 lanes due. **Verification still pending** — see the
      blocker below, which must be fixed first.
- [x] **Phase 3.5 — FIX THE RED-PR BLIND SPOT.** Written 2026-07-30, **corrected 2026-08-11** (see "What the 07-30 version got wrong" below — it would have shipped a detector that caught nothing). As it now stands: (1) `watchdog.yml` gained a "PRs stuck on failing or missing checks" step — EVERY open non-draft PR, >24h, any failing check or a missing `build`, minus PRs explicitly parked for a human; it also re-runs a `build` red >48h, capped at 2/day. (2) `vault-run.md` gained STEP 0: adopt a stranded `vault/*` PR before opening a new one, **at most once**, then label it `founder-decision` and move on. (3) `CLAUDE.md`'s "the next scheduled run picks it up" promise is corrected to say what actually happens. (4) Diagnosed: the 07-28 failures are NOT content degradation — see below. The remaining piece is a founder call, filed as an issue, and does NOT block Phase 4.

      **What the 07-30 version got wrong.** Replayed against the live repo on
      2026-08-11, the detector as originally written examined 2 of 27 open PRs
      and alerted on NEITHER — it missed every genuinely stuck PR in the repo,
      including ones this very document names. Three independent causes:

      - **The bot branch-prefix allowlist was the big one.** `vault/
        content-shift/ depth/answerer content/rumor-desk content/stylist
        claude/` — three of those six match no branch that has ever existed,
        while `claude/` matches every Claude session including ops work. The
        longest-stuck PR in the repo, **#1642** (`build` red since 07-31, 11
        days, auto-merge armed), is on `fix/ci-actions-v7-tags` and was never
        even looked at. Enumerating bot branch prefixes is a losing game: the
        list goes stale the moment a lane is renamed, and it fails CLOSED
        (silently missing PRs) rather than open.
      - **Only `build` was read.** **#1762** has been open since 08-03 with
        `build` SUCCESS and `enable` FAILURE — the auto-merge gate is what
        strands it. Any failing check strands a PR, not just `build`.
      - **A missing check read as healthy.** **#1585** has been open since
        07-28 with NO `build` check at all on its head commit (CI never fired
        for that push). The jq returned "NONE", which is not "FAILURE", so it
        stayed silent — and auto-merge waits on a check that will never arrive,
        forever. This is the same class of fault as the stale-check cases
        #1633 (5 days) and #1565 (07-27 → 08-11).

      The corrected step catches all three, verified by dry-running it against
      live repo data before merge.

      **Found 2026-07-30, and it is a regression introduced by the 2026-07-25
      token-burn work.** Photo Enrichment has opened three PRs over three days
      (#1545, #1565, #1585) that all FAIL `build`, and nobody noticed:

      - Auto-merge behaved correctly — it armed and then held each red PR.
      - The agent no longer babysits its PR, by design.
      - But the replacement promise, *"if CI fails, the NEXT scheduled run picks
        it up"*, **is false**: the next run opens a BRAND NEW PR against `main`.
        It never returns to the red one. So red content PRs accumulate silently
        and the work never ships.

      Before 07-25 the self-check-in loops caught exactly this ("drive-to-green
      — my PR"). Killing them removed ~69% of token spend AND this safety net;
      only the first half was accounted for.

      The failures are real, not stale tests — both pass on `main` and fail only
      on the Photo Enrichment branches:
      `feed-tiers.test.ts` "expected 'media' to be 'hero'" and
      `substance.test.ts` "expected 6.33 to be greater than 7". Adding photos is
      changing a moment's tier classification and dropping its substance score.

      **This blocks Phase 4.** The Vault Run inherits the same false promise —
      `vault-run.md` currently says "tomorrow's run picks it up". Consolidating
      six lanes behind one PR makes it WORSE: today one red PR strands one
      lane's work, but after consolidation one red PR strands all six.

      Fix requires all three:
      1. **Detection** — `watchdog.yml` gains a check for a content PR that has
         been open with a failing required check for >24h, alerting via the
         real-email path (`scripts/watchdog/send-mail.py`), not a bot mention.
      2. **A recovery path** — either the Vault Run rebases and fixes its own
         previous red PR when one exists instead of opening a new one, or a
         human is told. Silently opening a fresh PR is what got us here.
      3. **The actual test failures** — diagnose whether the lane is degrading
         content or the invariants are too strict. Do NOT relax a test to go
         green without establishing which.

- [ ] **Phase 4 — retire the six, measure the delta.** Only after Phase 3 looks
      good: **disable, do not delete** the six runners (warm spares — their
      prompts now live in the repo, but the triggers carry cadence history).
      Watch one full cycle, then write the `docs/decisions.md` entry and record
      the actual Actions-minutes and PR-count change.

## Rollback

Re-enable the six triggers and disable the Vault Run. Nothing is deleted in
Phase 4 precisely so this stays a two-minute operation.
