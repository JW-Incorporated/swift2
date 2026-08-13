# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory. -->

## Current focus

**Era reader rework** — branch `feature/era-reader-rework`, plan in `PLAN.md`
(five sequenced PRs, order is load-bearing). Driven by Joey's consolidated team
feedback on the "Time Machine Mockups" artifact, 2026-08-13.

In flight: P1 steps 1–3 (global six-chip filter foundation) dispatched to an
executor. Nothing verified yet.

## Last session

- Changed: wrote `PLAN.md`; appended the five-decision entry to
  `docs/decisions.md`. Both committed on `feature/era-reader-rework`.
- Verified by: nothing yet — P0 is documentation only. First verification gate
  is `npm test -- filters && npm run typecheck && npm run lint` at the end of
  P1 step 3.
- Left unfinished: everything from P1 step 1 onward.

## Autonomous decisions — review surface

<!-- Every call made without asking, one line each. This is what a founder
     skims instead of being interrupted. Clear it after review. -->

- **Took half of Joey's "fake date" permission.** Undated eggs/threads get a
  synthetic anchor used as a SORT KEY only; `displayDate` stays null unless the
  date is genuinely authored. The site's honesty contract forbids printing a
  date we don't have, and `undatedAnchorDate()` already works this way for the
  scrubber. Recorded as decision 4 in `docs/decisions.md`.
- **No conversion to real URL routes.** "Back returns you to your timeline
  spot" could have justified it; instead extending the existing
  `eraScrollRef`/`useBackDismiss` snapshot pattern. Routing is expensive to
  reverse and out of scope in `PLAN.md`.
- **Read "solve this directly in main" as "in the real codebase, not another
  mockup"** — still a branch + PR, since rule 2 and § Decision authority stand.
- **Sequenced as five PRs rather than one.** § Cost discipline: small PRs beat
  rework. Order is a real dependency chain, documented in `PLAN.md`.
- **`TrackGuide` stays a destination, not inlined.** Joey's "track guide should
  look just like play the era looks today" reads as swapping the AFFORDANCE
  (full-width bar + play button in the vacated slot), not inlining the list.

## Architect invocations

<!-- NEVER cleared — a running log for the life of the project. One line per
     invocation: date, question, which half of the rule fired, the call.
     Budget: <=2 per week. Two weeks at zero on genuinely novel work means
     escalation is being under-served. -->

- (none yet)

## Decisions that are settled

<!-- Must NOT be re-litigated. Anything expensive to reverse belongs in
     docs/decisions.md instead — this is the short pointer list. -->

- The five era-reader decisions (bottom nav overriding D3; Spotify player
  removed; one global filter; anchor dates sort-only; Clownbot keeps its tab)
  — `docs/decisions.md` 2026-08-13, and `PLAN.md` § Rulings. **Joey reversed
  his own brief on one point: there is NO Threads filter chip.** Six filters,
  forever: Music, Fashion, Tour, Relationship, Lore, Videos.
- **Plans do not need a sign-off** (Joey, 2026-08-13). Write the plan, execute.
- **No local-concurrency cap** (Joey, 2026-08-13).
- Merge authority is human. `git merge` / `gh pr merge` prompt by design.
- Scheduled runners live on Wyatt's account, never Joey's.
- No self-armed PR monitors, ever (CLAUDE.md § Never babysit your own PR).

## Known traps

<!-- Things that already burned tokens once. Paste the relevant ones into
     delegation prompts — agents do not read this file. -->

- **`lenses.ts` is 2473 lines, not ~238** as the landing-page brief claims. The
  brief is stale on this. It holds THREADS, EGG_NODES, CLUE_PAIRS and much more.
- **An untagged content item is invisible under any active filter** — the
  existing behaviour, tested at `tagBadges.test.ts:47`. Nothing enforces tag
  coverage today; `check:filter-coverage` (P1 step 6) is being built to.
- **The era filter is per-`EraSection` local `useState` today**, so it resets
  as you scroll between eras. That is the thing P1 replaces.
- **Reader has no URL routes.** Everything is one client page (`app/page.tsx` →
  `LongLive`) with React context; `?item=`/`?lens=`/`?era=` are read ONCE on
  mount and never written back.
- `scripts/social/post-queue.mjs` and `delete-media.mjs` hit LIVE accounts.
  `guard.sh` denies invoking them; do not work around it.
- `core.autocrlf=true` here. `.gitattributes` pins `*.mjs`, `*.generated.ts`,
  `*.sh` to LF. Never "fix" a whole-tree modified state by reverting files.
- `.claude/worktrees/` holds ~30 registered git worktrees. Never delete/clean.
- `scripts/social/social-poster-workflow.test.ts.tmp` is another session's
  untracked scratch. Leave it — it keeps the Stop hook's "code changed" true.
- The statusline renders `resets_at` in LOCAL time.

## Open threads

- [ ] **Wyatt has not signed off on the bottom nav** and should see PR 4. It
      overrides the on-device rejection in `docs/specs/2026-08-13-landing-page-
      brief.md` §3.2/D3. Surfaced per rule 5, not settled.
- [ ] Six labelled tabs do not fit 390px. The bar must degrade to icon-only at
      5–6; test with 4, 5 and 6 stub entries (P4 step 18).
- [ ] `EraSection.tsx` is 521 lines and this work adds to it — split it and
      record the split in `MAP.md` (P3 step 15).
- [ ] Residual wording: § Decision authority and § Roles still say "approved
      spec". Joey removed the sign-off gate, not the spec. Low priority.

## Next obvious step

Await the P1 steps 1–3 executor result, verify its claims (agent-reported
success is a claim, not a verification), then dispatch P1 steps 4–5, then the
coverage checker in steps 6–7. Codex review (`/codex:review`) before each PR
opens — `reviewer` does not satisfy Workflow rule 3.
