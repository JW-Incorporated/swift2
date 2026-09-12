# STATE — session working memory

## 2026-09-12 (session: Opus — Marjorie Overhaul wave M0, design)

Prior session (Fable) verified Tree Wave 4 6/6 merged and kicked off the
Marjorie Overhaul. That work is landed: #4178 (channel rename + decisions),
#4181 (plan dir + recheck routine), #4182 (HA #51/#65 closed). Epic #4180 open.

### M0 — what shipped

| Deliverable | Where |
|---|---|
| Five specs | `docs/specs/marjorie-overhaul/{c1-delivery,c2-brief,c3-email-retired,w1-watchdog-handling,s1-triage}.md`, all <300 lines |
| 3 decision entries | `docs/decisions.md` 2026-09-12 "Marjorie posts by webhook; the brief is the one daily surface; triage classifies but never decides" |
| Roadmap ownership | `docs/roadmap.md` — "Site ownership: Marjorie (single owner)" beside Tree's line |
| MAP rows | 5 spec rows |
| Charter amendment | **PR #4183, OPEN, NOT merged** — needs the founder's approving comment (hard invariant 5) |

### Findings that changed the design (verified in source, not taken on report)

1. **`routine-template.yml` has no `environment:` key** → an `ops`-scoped
   secret is unreachable from any routine job. The brief delivers from a
   second job (`needs: run`, `environment: ops`), the Tree pattern
   (`routine-tree-weekly-plan.yml:84-101`). Ops/triage need a new
   `environment` input on the template — **prove it with an empty default on
   an existing routine before any Marjorie routine depends on it.**
2. **`upsert-alert.sh` has SIX callers**, not two: watchdog,
   production-backup, backup-restore-drill, production-backup-drill,
   mobile-parity, social-audit. All six need `environment: ops` or they
   silently fall back to email.
3. **Watchdog is hourly** (`cron: "5 * * * *"`) and re-`open`s a standing
   alert every pass → Discord would flood. Fix: post on state change only
   (create/close branches), not the "commented on existing" branch.
4. **There is no nightly backup receipt.** On success `upsert-alert.sh close`
   exits at `:50` before the mail tail when no alert is open. The "receipt"
   is really failure-and-recovery notices. Flagged for the founder.
5. **The Gmail secrets cannot be deleted.** `community-inbox.yml` (live, cron
   `5,35 * * * *`) reads `MARJORIE_EMAIL`/`GMAIL_APP_PASSWORD` over IMAP. The
   wave prompt asked for an HA to remove them after MR1 — **not filed**, the
   premise is wrong.
6. **"Definition of Done" is three documents.** The brief scores
   `docs/definition-of-done.md`'s eight product items; `CLAUDE.md` has six
   engineering clauses; `launch-readiness.md`'s 12 gates are retired. The
   wave prompt conflated the first two.
7. **The `intake` label has three producers** (reader reports, content-desk
   drops, agent chores) → triage selects by title prefix
   (`[Feedback] `/`[Intake] `/`[Link submission] `), filtered `startsWith` in
   code because GitHub search strips brackets.
8. `desk:*` labels in `bootstrap-labels.mjs` **do not exist live** — routing
   on them would drop tickets. Live path is Kevin triage → Austin.
9. `send-community-mail.py` has zero callers and holds the last CC address.
10. `plan-recheck-marjorie.yml` is **not** in watchdog's watch list (has a
    cron but doesn't match `routine-*.yml`); `marjorie-inbox.yml` **is**.

### Architect invocations

**1 — 2026-09-12, Fable, read-only review of the five M0 specs** (per the
wave prompt's explicit instruction, ~20 min budget). Found three real
blockers, all independently verified before folding in: the environment
plumbing (#1 above), the hourly flood (#3), and no mechanism behind
"accountable for the outcome". Also cut four over-built pieces (per-alert
dispatch, Marjorie spending CI re-runs, the aging-HA handler, the per-post
social success notice) and caught two overstatements I had made ("no
Write/Edit = structurally cannot edit code" — false, `Bash` writes files;
and the GitHub bracket-search trap). Everything material was folded in;
nothing was rejected outright. High-value invocation.

### Open / next

- **PR #4183 (charter) needs Joey's approving comment.** Do not merge it.
- HA #66 (`ops` env + `DISCORD_MARJORIE_WEBHOOK_URL`) still **OPEN** — M1
  cannot be verified without it. Recommend filing the bot's View Channel
  grant alongside it now, so the reply poller isn't blocked twice.
- M1 (Sonnet) is next: c1 + c2 + c3. Its first task is the
  `routine-template.yml` `environment` input experiment — everything else
  depends on it.
- Recommend the reply poller ships in **M2**, not M4; only the Tree-facing
  prompt edits need to wait for Tree R2 (2026-09-21).
- Two open watchdog alerts to hand M2 a real test: #4129 (5 workflows never
  succeeded) and #4009 (FB export, open since 09-07, plus reminder issues
  #3911/#3536 never actioned).

### Local checkout notes

`apps/web/app/tokens.generated.css` shows modified but the diff is CRLF-only
— do not revert, do not commit. Untracked `PLAN.md` is the Tree Wave 4 lane
plan (historical; `PLAN.md` is not tracked). Local vitest cannot run (Windows
EPERM symlink in globalSetup) — CI is the gate. Worktrees to remove once
their PRs land: `%TEMP%\claude-worktrees\{marjorie-overhaul-specs,
marjorie-charter-amendment}`, plus the older wave-4/discord-rename ones.
