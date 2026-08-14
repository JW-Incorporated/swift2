# STATE.md

<!-- The orchestrator reads this first and rewrites it last. Hard cap: 150 lines.
     Prune ruthlessly — this is working memory, not a changelog. Git holds the
     history; this holds only what a fresh session needs in the next 30 seconds.
     It does NOT replace docs/ — see CLAUDE.md § Working memory. -->

## Current focus

**Era reader rework** — branch `feature/era-reader-rework`, plan in `PLAN.md`
(five sequenced PRs, order is load-bearing). Driven by Joey's consolidated team
feedback on the "Time Machine Mockups" artifact, 2026-08-13.

**PR 1 is open: #2086** (`feature/era-reader-rework` → `main`). Joey said the
Codex review was complete; note that `codex-companion status --all` showed
"No jobs recorded yet", so no findings text was ever seen by this session —
that ledger may be per-session, but if PR 1 needs a fix it will be a
cherry-pick follow-up.

**P2 in flight on `feature/era-reader-p2`** (stacked on P1, NOT branched off
`main` — it edits the same `EraSection.tsx` region). Steps 8, 9, 10, 11 are
done in the working tree, uncommitted; the docs slice is with an executor.

**`/codex:review` cannot be invoked by any session** — the plugin command is
`disable-model-invocation`, and the Skill tool explicitly forbids replicating
its workflow via `codex-companion.mjs`. Only a human can run it. Ask; do not
work around it, and do not arm a monitor waiting for it (§ Never babysit).

## Last session

- Changed: `PLAN.md` + `docs/decisions.md` (committed). Then P1 steps 1–5 in
  the working tree, uncommitted: new `lib/longlive/filters.ts` (+test) and
  `components/longlive/FilterBar.tsx`; `store.tsx` gained the `filters` slice;
  `EraSection.tsx` shed its per-era filter state (1086→878 lines);
  `era-feed.ts` swapped `visibleMoments`/`visibleVideos`/`watchableCount` for
  one `visibleFeed(entries, active)` pass; `EraStream.tsx` mounts `FilterBar`
  and pins the active era's offset across a filter change; `TopBar.tsx` gained
  a `data-ll-topbar` hook so the bar can measure it.
  Then 5a–5c and 6: `filters.ts` gained the owner-set ctx and the music-video
  rule; new `lib/longlive/anchor-date.ts` (+test) with `era-scatter`;
  `mergeEraFeed` now takes `(moments, videos, eraStart, eraEnd)` and every
  entry carries `anchor`; `undatedAnchorDate()` subsumed and deleted; new
  `scripts/check-filter-coverage.mjs` (+test), wired into `package.json` and
  `ci.yml`'s `build` job.
- Verified by (re-run by me, not taken on report): `npm test -- filters` →
  8/8 then 11/11; `npm run check:filter-coverage` → exit 0, "every timeline
  item carries at least one filter id". Executor reported anchor-date 15/15,
  era-feed 20/20, check-filter-coverage 11/11, typecheck/lint clean, full
  suite 2558 passing with only the pre-existing `satori` failure.
- Left unfinished: P1 step 6a + docs (in flight), then Codex review and PR 1.
  Then P2–P5.

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
- **Amended the plan mid-flight rather than shipping through it** (logged in
  `PLAN.md` § Plan amendments): `filtersForEntry` had silently dropped two
  shipped selection rules, and anchor dating moved from P3 into P1 because
  folding every video into the timeline without anchors piles undated videos
  at the end of every era. A PR must be independently correct, not just small.
- **Seeded `FilterBar`'s sticky offset at 52px** instead of 0 — it measures
  TopBar's real height, but starting at 0 parked it over TopBar for a frame.
- **Rejected the `era-midpoint` anchor fallback** in favour of a deterministic
  per-id scatter across the era span. Midpoint gave every undated item the same
  sort key, trading an end-of-era pile for a mid-era clump; 26 of 84 video
  records are undated, so the clump was real. Joey asked for them scattered.
- **Added a zero-match era empty state that the plan had missed** (step 6a).
  A global filter makes "Tour + folklore" reachable; per-era filters never
  could, because they reset at every era boundary. The section keeps its hero
  and lyric rather than collapsing — collapsing would strand the reader, break
  "stay in the era you're in", and delete that era's scrubber anchors.

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
- **The old filter encoded topics in SELECTION RULES, not on records.** Deleted
  `visibleVideos` had `if (tags.size === 0 || tags.has('Music')) return
  timelineVideos` — a dated music video was already Music content — and
  `visibleMoments` under `videosOnly` selected footage-owning moments via
  `inlineVideoMomentIds`. Both are restorations in step 5a, not new behaviour.
  Only the appearance-family videos genuinely carry no topic.
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
- [ ] **CORRECTED 2026-08-13: videos DO have a song pointer.**
      `VideoNote.relatedSongs: string[]` (`types.ts:844`) is curated in the
      seed, and all 55 music/lyric videos carry it. An earlier claim in this
      file and to Joey that "no video→song pointer exists" was WRONG.
      `lib/longlive/track-video.ts` (built in P2 step 10) is the tested lookup;
      P3 reuses it to anchor undated items near content about the same song.
      Still unverified: whether EGGS carry an equivalent pointer — check, do
      not assume.
- [ ] folklore and evermore have no Tour content. Correct — neither era had a
      tour. Not a content gap; do not "fix" it.
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

Verify the P2 docs slice, commit P2, then ask Joey to run `/codex:review` on
`feature/era-reader-p2` before opening PR 2. PR 2 targets `feature/era-reader-
rework` (or `main` once #2086 merges) — it is STACKED, so do not open it
against `main` while #2086 is unmerged.

Then P3 (timeline doorways) from step 13. P3's first real question is whether
eggs carry a song pointer the way videos do (`relatedSongs`) — check before
designing the anchoring, and reuse `lib/longlive/track-video.ts` rather than
building a second lookup.
