# STATE — session working memory

## 2026-09-12 (session: Sonnet — M1 wave DONE)

**Wave M1 of the Marjorie Overhaul (epic #4180) — complete.** Closeout
comment with every proof command/run URL:
https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5648659124

**Merged:** Step 1 (#4197) · C1 (#4199) · C2 (#4200) · C3 (#4201) ·
checkpoints/PLAN tick (#4205). #4047 closed. `checkpoints.json`: MR1 due
2026-09-19, MR2 due 2026-10-03.

**Real live proof, not claimed:** a genuine `routine-marjorie-brief.yml`
dispatch (`runs/34718289679`) posted a real Founders' Brief to
`#longlive-marjorie` (`delivered: discord`), producing real issue #4206 —
six-section format, header self-link, `cc` line, Waiting-on-you listing
exactly the 9 live `HUMAN-ACTIONS.md` numbers, honest non-fabricated
reporting where data doesn't exist yet. A real `watchdog.yml` dispatch
(`runs/34718231324`) hit 3 genuinely pre-existing standing alerts and
correctly suppressed repeat Discord posts on all three (the anti-flood
NOTIFY gate, proven on production conditions, not synthetic ones).

**One item deliberately deferred, not silently dropped:**
`social-poster.yml`'s alert reroute is draft **PR #4202**, blocked on
**HA #68** (the RULINGS-SOCIAL A6 social-freeze CI gate — human-only,
matches the existing #60/#65 precedent). Until it merges, `social-poster.yml`
keeps its unchanged pre-C3 direct-email behavior — no regression, just not
yet on the new path.

**Two real bugs caught by review before shipping, worth remembering:**
1. C1: CodeQL HIGH `js/insecure-temporary-file` (predictable temp filename,
   symlink-race) — an executor's own test pass won't catch a security
   scanner finding; always check CI's actual code-scanning result, not just
   "tests pass."
2. C3: Codex round 2 caught that my own round-1 fix over-corrected —
   removed a workflow's *working* email fallback based on a plausible but
   wrong theory (conflated two independent mail pathways:
   `ALERT_ALSO_MAIL`'s dual-send exception vs. `post-or-mail.mjs`'s own
   independent Discord-failure fallback). Handled via `debug-protocol`
   (`DEBUG.md`, local-only, never committed) rather than a third review
   round — round 2's own response already was the "fresh diagnosis" step 1
   of the escalation ladder calls for, precise enough to fix + verify via
   real CI directly.

**Also filed, not fixed:** issue #4204 (a stale doc reference orphaned by
C2's rebuild, unrelated to C3). Documented-not-fixed: a double-outage
(Discord + email both down) at the exact moment of a state change is never
retried later — M2 hardening candidate.

**Rebase-vs-force-push lesson** (reusable if it recurs): rebasing a pushed
branch then trying to push hits the guard's blanket force-push denial —
correctly, no exception even for a safe `--force-with-lease` on an
untouched branch. Fix: `git reset` (bare, not `--hard`) back to the last
pushed commit, keeping the working tree's file content as uncommitted
changes; redo the same integration as a real `git merge`; `git stash`/pop
anything else back on top. Ordinary push afterward.

**Mid-session gotcha, twice:** `git fetch` updates the remote-tracking ref
but not local `main` itself — caught this stale-checkout gap firing false
"still broken" grep results after C3 merged. `git pull --ff-only` (or
explicit `origin/main` refs) before trusting any local grep/read as
representing current `main`.

**Next session:** MR1 (2026-09-19) and MR2 (2026-10-03) are automated via
`plan-recheck-marjorie.yml` — nothing further needed from this session.
M2 (watchdog handling) and M3 (submissions triage) are the next waves,
independent of each other, never in the same checkout. Whoever picks up
M2/M3 should also glance at PR #4202/HA #68's status — if the founder has
since actioned it, that's one less loose end to carry forward.

### Local checkout notes

Untracked `PLAN.md` is the Tree Overhaul Wave 4 lane plan (historical,
unrelated epic — leave it). Local vitest cannot run (Windows EPERM symlink
in `sync-web-react-globalSetup.ts`'s `globalSetup`) — CI is the real gate;
a scratch-only vitest config dropping `globalSetup` (and, for non-rendering
test files, `jsdom-render-setup.ts` too) is the local workaround, never
committed. A `pr-4047-review` local git ref exists from this session's
Step-0 research (`git branch -D pr-4047-review` to clean it up — harmless
either way).
