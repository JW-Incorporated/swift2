# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory. -->

## Current focus

Photo Enrichment worker (issue #762) ran a scheduled 2026-08-14 pass, PR
#2088, open against `main`, not yet merged. Next scheduled run should just
pick up the queue again per the marker in the #762 comment — nothing else in
flight.

## Last session

- Changed: PR #2088 — 3 verified photos + focal points added
  (`showgirl-wedding-raffle-gronkowski`, the Oct 2025 Fallon and Seth Meyers
  YouTube-appearance moments); 5 of 8 `content.social-post-missing` findings
  triaged to documented no-ops (comments left in the seed so future runs
  don't re-research the same dead ends); `package-lock.json` metadata
  refreshed (no version changes — this container had no `node_modules`, had
  to run `npm install` fresh before anything content-engine-related worked).
- Verified by: `validate:content` 0 errors, `node --check` clean, vault
  regenerated + `check:generated` in sync, `typecheck` clean, `lint` clean
  (no duplicate keys), vitest 2542/2542. Full details + updated `photo-done`
  marker in the issue #762 comment thread.
- Left unfinished: 3 `content.social-post-missing` P2 findings untouched
  (Mr. Perfectly Fine vault, and `socialPost` gaps on two wedding pages) —
  next run's queue. `MAP.md` still top-level only; deepen the first time a
  session has to go looking for something inside `apps/web`.

## Autonomous decisions — review surface

<!-- Every call made without asking, one line each. This is what a founder
     skims instead of being interrupted. Clear it after review. -->

- Left `post-edit.sh` `FORMAT_CMD=""` (auto-format OFF) deliberately. ~13.7k
  files in this repo are not prettier-clean, so formatting on save would rewrite
  whole files on one-line edits, and formatting a `*.generated.ts` would break
  `check:generated`. CI runs no prettier step, so there is nothing to keep
  green. Reasons are written into the hook so nobody "fixes" it later.
- Added `git restore` / `git checkout --` to `guard.sh` on top of the
  settings.json denies, so "never discard uncommitted work" also holds in
  skip-permissions sessions.
- Made the social-poster deny parse what a command EXECUTES (walk past env
  assignments, runners and flags to the first real program) instead of matching
  the path as text. The regex version both missed
  `cd scripts/social && node post-queue.mjs` and wrongly denied
  `npx eslint scripts/social/post-queue.mjs`.
- Exempted `--env-file=<path>` from the `.env` deny — it is the literal body of
  `db:migrate` and every `db:seed:*` script, and it loads env into a process
  rather than reading secrets out.
- Disabled the `pause` skill's step-4 scheduling in this repo (CLAUDE.md and
  the skill file both say so). "Never babysit your own PR" bans every wake-up
  with no exceptions, so the skill's own PAUSE.md fallback is used instead.
- (2026-08-14, #762 run) Overrode a subagent's photo-verification claim: it
  proposed a Harper's Bazaar photo as showing Kelce's wedding ring; my own
  download + 5x zoom found only an ambiguous knuckle highlight, not a
  confirmable band. Left the page at 0 photos rather than trust the
  subagent's read. Lesson for future runs: always re-verify a subagent's
  "I can see X in the image" claim yourself before it goes in the seed.
- (2026-08-14, #762 run) Treated the marker-driven photo queue as a starting
  point, not gospel — several queued pages had already been completed by
  other untracked runs/lanes since the last marker update (2026-07-19).
  Checked each candidate's actual seed state before spending research effort.
- (2026-08-14, #762 run) Did not override existing deliberate "no stand-in
  photo for chart-week/legal-paperwork stories" editorial comments already
  in 4 seed entries, even though a reference image would have been
  technically addable — respected the prior author's considered call.

## Architect invocations

<!-- NEVER cleared — a running log for the life of the project. One line per
     invocation: date, question, which half of the rule fired, the call.
     Budget: <=2 per week. Two weeks at zero on genuinely novel work means
     escalation is being under-served. -->

- (none yet)

## Decisions that are settled

<!-- Must NOT be re-litigated. Anything expensive to reverse belongs in
     docs/decisions.md instead — this is the short pointer list. -->

- **Plans do not need a sign-off** (Joey, 2026-08-13). Write the spec/`PLAN.md`,
  then execute. Planning is still required; only the approval step is gone.
  Rule 5, rule 6 and § Decision authority are unaffected — product direction,
  merges, deploys, secrets and spending are still human calls.
- **No local-concurrency cap** (Joey, 2026-08-13). Run as many local agents as
  the work warrants; the § Agent shell discipline command rules still bind all
  of them, and large fleets are still better as cloud sessions on Wyatt's
  account.
- Merge authority is human. `git merge` / `gh pr merge` prompt by design; that
  is the founders' gate, not a bug to route around (CLAUDE.md § Agent shell
  discipline).
- Scheduled runners live on Wyatt's account, never Joey's
  (`docs/agents/runners.md`).
- No self-armed PR monitors, ever (CLAUDE.md § Never babysit your own PR;
  `docs/decisions.md` 2026-07-25).

## Known traps

<!-- Things that already burned tokens once. Paste the relevant ones into
     delegation prompts — agents do not read this file. -->

- `scripts/social/post-queue.mjs` and `delete-media.mjs` hit the LIVE accounts
  the moment they run. No dry-run flag. `guard.sh` denies invoking them; do not
  work around it.
- `core.autocrlf=true` on this machine. `.gitattributes` pins `*.mjs`,
  `*.generated.ts` and `*.sh` to LF — a CRLF `.mjs` breaks vitest/esbuild and a
  CRLF `.sh` breaks every hook shebang. Never "fix" a whole-tree modified state
  by reverting files; it is a line-ending config problem.
- `.claude/worktrees/` holds ~30 registered git worktrees, excluded via
  `.git/info/exclude`. Never delete or `git clean` them.
- `scripts/social/social-poster-workflow.test.ts.tmp` is untracked scratch
  belonging to another session's work. Leave it: do not commit, delete, or
  gitignore it. It will keep the Stop hook's "code changed" check true until
  its owner removes it.
- The statusline renders `resets_at` in LOCAL time — `14:30Z` correctly shows
  `->07:30` on a PDT machine.

## Open threads

- [ ] `MAP.md` is top-level only; deepen on first real use.
- [ ] Residual wording, low priority: § Decision authority and § Roles still say
      "approved spec". Joey's 2026-08-13 ruling removed the *sign-off gate*, not
      the spec, and he asked for those sections to be left alone — but if the
      phrase ever reads as a live approval requirement, reword it to "the spec".

## Next obvious step

Kit-v3 is in. Next session: run the triage rule for real, and deepen `MAP.md`
the first time you have to go looking for something.
