# Paused work snapshot — 2026-08-19

**Read-only snapshot.** This is the live state that `STATE.md` held at the
moment kit-v3 was retired (see `docs/decisions.md` 2026-08-19). It exists so
the paused Swift2 feature work can be picked up without re-deriving anything.

**This file is a snapshot, not a working file.** Do not update it as work
proceeds — live task state belongs in GitHub Issues/PRs. The verbatim
original is at `docs/archive/kit-v3-2026-08-19/STATE.md`.

**The feature work below was deliberately NOT resumed by the migration.**

## Where things stood

Nothing was in flight. The merch page redesign to Joey's marquee mockup shipped
2026-08-16 (Wave 1 components → integrator → his six review fixes), on top of
his 12-item punch list the day before. All merged, `main` green.

## Blocking / outstanding — read before starting anything

- **CC BY / CC BY-SA credits were NOT deleted, deliberately.** Joey asked to
  "get rid of" the two Wikimedia photo credits. Visible attribution is a
  **licence condition** (`lenses.ts:44-58`, `ThreadsMode.tsx:298-301`,
  `docs/decisions.md` 2026-08-15) with no attributions page as fallback. #2151
  fixed the real complaint instead (10px, muted, tighter gap). **Full removal
  needs Joey's explicit call — a licence breach, not a style preference.**
  Still unanswered.
- **#2110's three questions are unanswered**, and **five decisions lost their
  owner** — `HUMAN-ACTIONS.md` #7 and #5. **Wyatt retains account access**
  (that file's #1); he is simply not working on this project.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap.**
  Deliberately not fixed — may be intentional. Joey's call.

## Karen — two separate faults, diagnosed 2026-08-16

- **Fault 1 (hers, Wyatt-only).** Karen is **not** a GitHub Action — she is a
  scheduled Claude Code routine on Wyatt's account
  (`trig_014HWuRmT2MFveDkPGwVDiQX`). **No session here can see or fix her.**
  Last real run = PR #1850, 2026-08-09. Full diagnosis, the config trap, and
  the prompt delivered to Joey are in **`HUMAN-ACTIONS.md` #2**. Success
  signal: a PR titled `karen: nightly run report <date>`.
- **Fault 2 (ours, fixed in #2178).** See the `bash -e {0}` lesson now recorded
  in `docs/engineering-lessons.md`.

## Open threads

- [ ] **Marketplace research — blocked on Joey creating API accounts**, his
      choice. Brief and signup steps in `HUMAN-ACTIONS.md` #4. **Ceiling:**
      per-video TikTok/IG counts for accounts you don't own are unobtainable,
      and Etsy carries no review count. **The Shopify
      `/products/<handle>.json` technique proven in #2154 may cover more of
      this than assumed.**
- [ ] Theory doorways scatter rather than sitting beside the song they discuss;
      Joey accepted this. 3 appearance videos carry no topic tag, and
      folklore/evermore have no Tour content — both true of the world, not gaps.

## Next obvious steps (as of the pause)

1. **Wyatt restarts Karen** (prompt delivered). Then fix whichever schedule
   line in `docs/agents/runners.md` he confirms is wrong.
2. **Device-check the merch redesign on a real phone** — palette transition
   between tabs; chip rows scroll with the first chip reachable at 360px; bulbs
   stop under `prefers-reduced-motion`.
3. **Triage the 8 older open PRs** (#2135, #2114, #2104, #2101, #2100, #2067,
   #2066, #1961) — none from recent work, several stale. Raised with Joey; do
   not close another session's PR without his word.
4. **Unconfirmed lead:** Escape may not close the MomentDetail overlay. Seen
   while the browser tool was misbehaving — reproduce before filing.
5. Joey's hands: the credits ruling, the #2110 questions, the five ownerless
   decisions, `auto-merge-content`'s scope, the Turnstile keys
   (`HUMAN-ACTIONS.md` #8), and restarting his port-3000 dev server.

## Autonomous decisions awaiting review

- **Refused to delete the CC credits**; shipped the quiet version instead.
- **Sequenced multi-item work in waves**, not N parallel agents, whenever items
  share files. Read-only research runs concurrently; one writer per file.
- `auto-merge-content.yml` lands **UI code PRs** unattended, not just content.
  Correct per its own guard. **Flagged to Joey; his call.**

## Repo housekeeping noticed during the migration (not acted on)

- **~30 git worktrees live inside the repo** at `.claude/worktrees/`, and ~60
  more under temp paths. `REPO-003` wants isolated worktrees; it does not want
  them nested in the checkout. Pruning is safe only after confirming each has
  no unmerged work — not done here.
- A **stale `.git/index.lock`** (0 bytes, 33 h old, no git process) was blocking
  all index writes. Removed during the migration.
- Untracked stray files at the root: `cd`, `claude`, `nul` (all 0 bytes, from
  mistyped commands), plus `.scratch-products.json`, `Python/`, and
  `scripts/social/social-poster-workflow.test.ts.tmp`. **Left in place** — per
  § Never discard uncommitted work, deleting them is the owner's call.
- `apps/web/CLAUDE.md` and `apps/web/AGENTS.md` are **generated by `next dev`**
  (`node_modules/next/dist/server/lib/generate-agent-files.js`), not workflow
  files. Committing them with your work keeps the tree clean.
