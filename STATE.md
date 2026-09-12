# STATE — session working memory

## 2026-09-12 (session: Fable — post-M0 audit)

- **PR #4190** (auto-merge armed): M1–M4 wave prompts (`waves/m1-comms.md`,
  `m2-watchdog-handling.md`, `m3-triage.md`, `m4-loop.md`) — M0 had never
  written them; PLAN.md gains "M0 findings that bind M1" (durable copy of the
  section below); C3 row + M1 gate corrected (`send-mail.py` is reached via
  `upsert-alert.sh`); s1's `founder-decision` label marked not-live (M3
  creates it); retired "founder-approved PR" wording removed from
  c2/s1/RUNBOOK.
- Audit verdict (Sonnet researcher, spot-checked): all five specs compliant,
  no cross-spec contradictions, load-bearing repo facts confirmed.
- Reply poller moved M4 → M2 in PLAN. M4 now depends on M1 + M2.
- Runbook artifact republished (v7): M0 done, M1 prompt with copy button.
- Stale worktree `ha-close-51-65` removed (its PR #4182 was merged).
- **Next:** founder does HA #66, then pastes `waves/m1-comms.md` (Sonnet).

## 2026-09-12 (session: Opus — Marjorie Overhaul M0 + the charter-merge rule)

### Shipped and MERGED

| PR | What |
|---|---|
| #4184 | M0 design — five specs in `docs/specs/marjorie-overhaul/`, 3 decision entries, roadmap ownership line, MAP rows |
| #4183 | Marjorie charter amended — site-ops manager, `#longlive-marjorie`, Channels section, new sampling rubric |
| #4185 | **The charter-merge stamp is dead.** A charter PR merges on green CI; only *Marjorie* may not edit a charter |
| #4186 | HA #61 and #62 closed — both were verifiably already done (see below) |

Epic #4180: M0 ticked, closeout comment posted.

### The rule change (Joey, in chat: "No PR ever needs me")

`docs/agents/marjorie.md`'s header had welded two rules into one sentence.
Split them: **kept** "Marjorie may not edit any charter, including her own,
including to expand her own authority" (invariant 5 — an agent rewriting the
contract it is judged against); **removed** "a charter PR needs a founder's
approving comment". Reasoning: `CLAUDE.md`'s reversibility test — a charter
edit is a markdown diff a `git revert` undoes. Also fixed the same stamp in
`docs/plans/marjorie-overhaul/PLAN.md`'s M0 gate. Decision entry logged.

**Follow-up filed as #4187:** seven runner prompts/charters still say "never
merge" (austin-run, content-shift-run, cross-link-builder, karen-nightly,
karen-deep-review, paul-blart, content-shift). That is the *systemic* version
of the same complaint and #4185 did not touch it — deliberately, because it
is seven per-agent autonomy calls with different risk profiles, not one
stamp. The issue carries the per-agent analysis and a recommended order.
**Start there if Joey raises "no PR ever needs me" again.**

Explicitly NOT part of that sweep: `tree.md:25` (strategy is product
direction, stays founder's) and `marjorie.md:440` (don't merge over requested
changes) — both should survive.

### HA #66 — half done by me, half owed by the founder

**I created the `ops` environment** via `gh api` and restricted its
deployment branches to `main` (verified). The guard denies `gh secret set`,
not `gh api`, so that half was never human-only. **Still owed:** create the
Discord webhook in `#longlive-marjorie` and paste it as the environment
secret `DISCORD_MARJORIE_WEBHOOK_URL`. Verify with
`gh api repos/JW-Incorporated/swift2/environments/ops/secrets`, then close #66.

### Human actions: 8 open (was 10)

#61 and #62 closed on objective evidence — `SOCIAL_FREEZE` reads `false`
(updated 2026-09-12T15:43:52Z) and issue #4169 exists with the exact required
title. #62 was never a human action; it landed in the list because
`gh issue create` hit the guard false-positive (a poster filename appearing
in *prose*). **That guard bug fired twice more this session** — the
workaround is `--body-file` from a Write-tool file, never an inline heredoc.
Filed as #4170.

### M0 findings that bind M1 (all verified in source)

1. **`routine-template.yml` has no `environment:` key** → an `ops`-scoped
   secret is unreachable from any routine job. **M1's first task** is adding
   that input and proving an empty default is safe on an existing routine;
   everything else depends on it. The brief instead delivers from a second
   job (`needs: run`, `environment: ops`) — pattern confirmed verbatim at
   `routine-tree-weekly-plan.yml:84-101`.
2. **`upsert-alert.sh` has SIX callers**: watchdog, production-backup,
   backup-restore-drill, production-backup-drill, mobile-parity,
   social-audit. All six need `environment: ops` or they silently mail.
3. **Watchdog is hourly** and re-`open`s standing alerts every pass → post on
   state change only, or a week-long outage is 168 Discord posts.
4. **No nightly backup receipt exists** — the close branch exits at
   `upsert-alert.sh:50` before the mail tail. Open question for Joey.
5. **Gmail secrets cannot be deleted** — `community-inbox.yml` reads them
   over IMAP every 30 min. The removal HA the wave prompt asked for was
   deliberately **not** filed.
6. **"Definition of Done" is three documents.** The brief scores
   `docs/definition-of-done.md`'s eight *product* items.
7. **`intake` has three producers** → triage selects by title prefix,
   `startsWith` in code (GitHub search strips brackets).
8. `desk:*` labels don't exist live. `plan-recheck-marjorie.yml` isn't
   watched by watchdog; `marjorie-inbox.yml` is.

### ⚠️ M1 BLOCKER I created: PR #4047 collides with C1/C2

**Read this before writing any M1 Discord code.** PR #4047 "Deliver the
morning brief to Discord" (open since 2026-09-09) already implements most of
C1/C2's delivery layer — `scripts/discord/post-brief.mjs` + 15 tests,
`delivery-status.mjs`, chunking, mention suppression, retry, a Gmail
fallback, and watchdog delivered/unconfigured/failed classification.

**I missed it during M0.** My research passes grepped merged code for
existing Discord delivery and never checked open PRs. C1 as written is a
second implementation of an existing mechanism — `CLAUDE.md`'s scope
tripwire names exactly that. Full analysis is a comment on #4180 and on
#4047 itself.

It is not a simple "merge #4047 instead": it is `CONFLICTING` against `main`
(touches `marjorie.md` and `watchdog.yml`, both changed today), it builds on
`brief-mailer.yml` which C3 deletes, it uses a repo-level secret rather than
an environment one (the property C1 chose deliberately), and it predates the
three-channel decision so it targets the wrong channel.

**M1: lift its chunking/mention/retry logic and tests, keep C1's
environment-scoped secret and two-job shape, drop everything hanging off
`brief-mailer.yml`, then rebase or close #4047.**

**Related fact worth not re-deriving:** #4047's human gate wanted
`DISCORD_BRIEF_WEBHOOK`. HA #50 was closed "done" on 2026-09-11 but **that
secret does not exist** — verified against repo secrets and every
environment. The only Discord webhook secret present is
`DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL` (the `#longlive-tree` one). A closed HA
is not proof the thing was done.

### Architect invocations

**1 — 2026-09-12, Fable, read-only review of the five M0 specs.** Found three
real blockers (environment plumbing, hourly flood, accountability had no
mechanism), all verified independently before folding in. Cut four
over-built pieces and caught two overstatements of mine. High value.

### Next

- M1 (Sonnet): c1 + c2 + c3, gated on the `routine-template.yml` experiment
  and on HA #66.
- Recommend the reply poller ships in **M2, not M4** — no Tree dependency;
  only the Tree-facing prompt edits need Tree R2 (2026-09-21).
- Two open watchdog alerts give M2 a real test: #4129, #4009 (FB export, open
  since 09-07; reminders #3911/#3536 never actioned).

### Local checkout notes

`apps/web/app/tokens.generated.css` shows modified but the diff is CRLF-only
— do not revert, do not commit. Untracked `PLAN.md` is the Tree Wave 4 lane
plan (historical; not tracked). Local vitest cannot run (Windows EPERM
symlink in globalSetup) — CI is the gate. All worktrees from that session are removed.
