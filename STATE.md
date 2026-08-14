# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory. -->

## Current focus

**Clownbot rebuild — PR #2087 open** (`feature/clownbot-rebuild` → `main`), two
commits, plan in `PLAN.md`. Built in an ISOLATED WORKTREE outside `Projects/`
because a parallel session owns the primary checkout on `feature/era-reader-p4`.

Build A (gated, never live) deleted; build B from the #1961 re-spec ships in
Joey's layout. Rulings J1–J7 in `docs/decisions.md` (2026-08-13).

**Blocking / outstanding at checkpoint:**
- **Codex review did NOT run** — usage limit, resets **Aug 19 2026**. Workflow
  rule 3 is UNSATISFIED. Merging on Joey's explicit J6 authorization. Run
  Codex against merged `main` when credits return.
- **J5 live-key red-team battery** (`npm run clown:battery:live`) is a required
  pre-merge gate and was still running at checkpoint.
- **Wyatt owns four items, none settled:** model tier (`claude-sonnet-5`,
  a single named constant), the 200/day/instance cap, ratifying the Mood route
  pattern, and signing off the decisions entry.

## Last session

- Changed: full Clownbot rebuild — 14 build-A files deleted (content preserved
  verbatim first in `docs/proposals/2026-08-13-clownbot-shelved-content.md`),
  ~25 `clown-*` modules added, `/api/clown` route, three UI components,
  `clown:battery` wired as a REQUIRED CI check, docs + kill-switch ops page.
- Verified by me directly, not on report: **2592 tests / 145 files green**,
  `typecheck --workspace=@swift2/web` zero errors, `lint` clean, all 13 redline
  categories present after the safety port, battery counts 53/21/48 intact.
- Left unfinished: live-key battery result, Codex, merge.

## Autonomous decisions — review surface

<!-- Every call made without asking, one line each. This is what a founder
     skims instead of being interrupted. Clear it after review. -->

Clownbot rebuild, 2026-08-13 — one line each, all reported to Joey in-session:

- Wrote `clown-answer.ts` myself as the ONE client-facing shape after two
  parallel steps grew different shapes for the same thing.
- Kept `delulu` nullable and made the badge render nothing on the fallback
  path — a fabricated score is a judgement no one made.
- Endorsed NOT auto-blocking `config.mjs`'s `illegalTerms` /
  `privacySpeculationTerms` / `locationPrivacyTerms`: they are marked
  "candidates, NOT findings", and bare `child`/`minor`/`teen` would refuse
  ordinary biography. Legal wrongdoing is already covered by ACCUSATION.
- Accepted `clown-safety.test.ts` at 522 lines, over the 300-line guideline —
  splitting a red-team regression suite arbitrarily risks losing cases.
- Fixed the fallback intro that claimed an outage on the DELIBERATE zero-model
  path; `reason` is now required with no default.
- Ruled that `ClownDoc` carry a real `status` rather than let the route guess
  one from `open` — a debunked item would otherwise render as confirmed.
- Chose the orange-doors seed over the cleaner masters-buyback capture: the
  latter scores delulu 0 and opens a *clown* bot with "this is just fact".
- Left the route's zero-model `chip` path built, tested and deliberately
  UNWIRED — board taps prefill and the user sends, per Joey's UX.

Kit-v3 install decisions were reviewed and pruned — each is documented in the
hook or skill file it governs, which is the durable record.

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

PR #2087. In order:

1. Read the live-key battery result (`npm run clown:battery:live`). J5 makes it
   a merge gate. Over-refusal on the 48 LEGIT cases counts as failure too — a
   bot that refuses ordinary Taylor questions is broken even if it is safe.
2. Confirm CI green, then merge. Joey authorized it (J6) — scoped to THIS
   workstream only, not a standing grant.
3. **Run Codex when credits return (Aug 19).** Rule 3 is unsatisfied; this is
   a real debt, not a formality.
4. Hand Wyatt his four items before treating tier/caps as decided.

## Clownbot traps (paste into agent briefs — agents don't read this file)

- **Never delete a red-team battery case; only add.** The 53/21/48 counts are
  pinned by exact-equality assertions for exactly this reason.
- **Blocklist phrases are MIRRORED from `scripts/content-engine/config.mjs`,
  never imported** — a cross-boundary import passes locally, breaks the build.
- **`status` is not derivable from `open`.** A debunked item is also
  `open: false`. Ten real corpus items are debunked.
- **Don't pad the theory column.** 7 items is correct output, not a bug.
- The columns are NOT free: taps prefill, the user sends, that send hits the
  model. Only the unwired `chip` path is zero-model.
- `npm run typecheck` is repo-wide-red on `apps/mobile` — use
  `--workspace=@swift2/web`.
