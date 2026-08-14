# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory. -->

## Current focus

**Era reader rework** — branch `feature/era-reader-rework`, plan in `PLAN.md`
(five sequenced PRs, order is load-bearing). Driven by Joey's consolidated team
feedback on the "Time Machine Mockups" artifact, 2026-08-13.

**PR 1 is open: #2086** (`feature/era-reader-rework` → `main`).

**P2 committed on `feature/era-reader-p2`** (stacked on P1). NOT opened as a
PR yet — awaiting a Codex review.

**P3 in flight on `feature/era-reader-p3`** (stacked on P2). Steps 13–14 done
and verified; steps 14a, 14b, 15, 16, 17 (anchor clamping, overload cleanup,
`DoorwayCard` + the `EraSection` split, back-to-position, the R4 back-link)
are with an executor. Per-era doorway counts are 5–12 (folklore lightest,
ttpd heaviest) — comfortable, no redesign needed.

**HOW TO GET A CODEX REVIEW — corrected 2026-08-13, an earlier note here was
wrong and cost Joey a round trip.** The `/codex:review` SLASH COMMAND is
`disable-model-invocation` (human-only). That does NOT mean Codex is
unreachable: invoke the **`codex:rescue` skill**, which routes to the
**`codex:codex-rescue` subagent** via the `Agent` tool. That is the
agent-facing path and it satisfies Workflow rule 3. Do not hand the review
back to a founder — Joey's expectation is that agents deploy Codex
themselves.

Gotchas on that path: `Skill(codex:codex-rescue)` does not exist and
`Skill(codex:rescue)` from inside the command re-enters and HANGS the session
— go through the `Agent` tool. Check `task-resume-candidate --json` first
unless `--resume`/`--fresh` was given. Codex health 2026-08-13: `ready: true`,
cli 0.144.6, ChatGPT auth verified. **Pull results with `codex-companion.mjs
result <job-id>`; the subagent's inline summary is not reliable.**

## Last session

<!-- Working memory, NOT a changelog. Git holds the history. Keep this to what
     the next session needs; prune anything already merged or superseded. -->

- **P1 (PR #2086, open):** one global six-chip filter in the store, rendered
  once by `EraStream`; `EraSection` lost its per-era filter state; every feed
  entry carries an `anchor`; `check:filter-coverage` gates the build.
- **P2 (committed, unopened):** Spotify player deleted, `TrackGuideBar` in its
  slot, three-pill row and era-bottom videos rail gone, `track-video.ts` pairs
  songs to videos (50/244 pair).
- **P3 (in progress):** feed union widened to four kinds; `doorways.ts` and
  `space-doorways.ts` added; UI/back-to-position/R4 with an executor.
- Verified by me directly, not taken on report: `npm test -- filters` 11/11,
  `era-feed filters doorways` 62/62, `track-video` 16/16,
  `check:filter-coverage` exit 0.

## Autonomous decisions — review surface

<!-- Every call made without asking, one line each. This is what a founder
     skims instead of being interrupted. Clear it after review. -->

REPORTED TO JOEY IN-SESSION 2026-08-13 — the reasoning for each now lives in
`docs/decisions.md` or `PLAN.md` § Plan amendments. Kept here only as a list,
to be cleared once he has reviewed the PRs:

- Took half the "fake date" permission — anchors sort, never display.
- No conversion to real URL routes; extended the existing scroll-snapshot.
- Five sequenced PRs, not one; the order is a real dependency chain.
- `TrackGuide` stays a destination — Joey's "looks like play the era" is
  about the AFFORDANCE, not about inlining the track list.
- Amended the plan mid-flight twice rather than shipping through it
  (`filtersForEntry` had dropped two shipped rules; anchor dating moved P3→P1).
- `era-midpoint` → per-id `era-scatter`; midpoint clumped 26 undated videos.
- Theory doorways scatter, with NO text-matching heuristic — verified that
  `TheoryNote` has no date, song, moment or source-date to anchor on.
- Added a zero-match era empty state the plan had missed (Tour + folklore).
- Three review corrections sent back on P3: clamp doorway anchors into the
  era, delete the `mergeEraFeed` overload scaffolding, make R4's back-link
  unconditional (it was null for `kind === 'theory'`).

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
- **An untagged item is invisible under any active filter**
  (`tagBadges.test.ts:47`). `check:filter-coverage` now gates the build on it.
- **The old filter encoded topics in SELECTION RULES, not on records** — a
  dated music video was already Music, and `videosOnly` selected
  footage-owning moments. Both restored explicitly in `filtersForEntry`. Only
  appearance-family videos genuinely carry no topic.
- **Two pre-existing test/typecheck failures, not ours:** `scripts/social/lib/
  card-render.test.ts` fails on a missing `satori` package, and repo-wide
  `npm run typecheck` fails in `apps/mobile`. Use `npm run typecheck
  --workspace=@swift2/web`.
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

- [ ] **18 appearance-family videos carry no topic tag** (interviews, awards,
      TV spots) — reachable only under Videos. `VideoNote` has no topic field
      at all. Reported to Joey 2026-08-13; his call whether to author them.
      Music videos are fine (they reach Music via the restored rule).
- [ ] **Song pointers, settled 2026-08-13:** videos DO have one
      (`VideoNote.relatedSongs`, `types.ts:844`, all 55 music/lyric videos) —
      `track-video.ts` is the tested lookup. `TheoryNote` does NOT, and nor do
      its sources. So theory doorways scatter; that is a data gap, not a code
      one, and the fix is an authored `anchorHint` in the seed.
- [ ] folklore and evermore have no Tour content. Correct — neither era had a
      tour. Not a content gap; do not "fix" it.
- [ ] **Wyatt has not signed off on the bottom nav** and should see PR 4. It
      overrides the on-device rejection in `docs/specs/2026-08-13-landing-page-
      brief.md` §3.2/D3. Surfaced per rule 5, not settled.
- [ ] Six labelled tabs do not fit 390px. The bar must degrade to icon-only at
      5–6; test with 4, 5 and 6 stub entries (P4 step 18).
- [ ] Residual wording: § Decision authority and § Roles still say "approved
      spec". Joey removed the sign-off gate, not the spec. Low priority.

## Next obvious step

Two things in flight, both needing verification, not trust:

1. **Codex review job `task-mssb0p0c-vzzubf`** on `feature/era-reader-p2`
   (covers PR 1 too — stacked). Pull it with `codex-companion.mjs result
   task-mssb0p0c-vzzubf`, NOT from the subagent's summary. Fix every finding
   before PR 2 opens; PR 1 (#2086) is already open, so a finding there is a
   follow-up commit on its branch.
2. **P3 steps 14a–17** with an executor. Check three things it could
   under-deliver: `grep -n "export function mergeEraFeed"` returns exactly ONE
   signature (14b); no theory/egg detail renders without a back-link (17);
   every touched file under 300 lines, `EraSection.tsx` included (15).

Then P4 (mobile bottom nav) from step 18, P5 (masthead) from step 21.

Branch stack, oldest first: `feature/era-reader-rework` (PR #2086, open) →
`feature/era-reader-p2` (committed, unopened) → `feature/era-reader-p3` (in
progress). Each targets its parent, not `main`, until #2086 merges. Ask Joey
to run `/codex:review` per branch before opening each PR.
