> **HISTORICAL SNAPSHOT — 2026-08-27 (machine-retirement audit).** Final
> per-session STATE.md checkpoint from the owner's Windows machine,
> preserved as a dated handoff record. NOT live operational state —
> CLAUDE.md's convention (STATE.md = per-session working memory, 150-line
> cap) is unchanged by this file. Known staleness at capture: at least one
> assertion below (that Hermes lacks a pre-tool-call hook mechanism) was
> already disproven on the Hostinger gateway (`hermes hooks --help`).

# STATE.md — per-session working memory (not team-shared)

Checkpointed 2026-08-26 ~12:52 PDT.

## Codex dispatches (Joey, ~12:48 PDT: "spin up codex bots... I have tons
of codex tokens") — 4 tasks routed to Codex, not Claude agents

Verified Codex CLI ready first (`codex-companion.mjs setup --json` →
`ready: true`, ChatGPT-authenticated). No live Claude Agent-tool agents
running at dispatch time (safe re: "never run Codex and a Claude agent on
the same working tree concurrently"). Each dispatched via
`codex:codex-rescue` subagent with `--background` + an explicit
`--effort` tier per CLAUDE.md (j-2) — none trivial enough for spark, all
`sol` under the hood:

- **#1978** (content-integrity red-team, all 12 eras) — `--effort high`.
  Codex background task `task-mtaidzau-agfme4`.
- **#722** (move low-substance fashion cards to Runway thread,
  debut/fearless/speak-now) — `--effort high`. Task `task-mtaiee9w-y020mf`.
- **#884** (44 fashion-product shop-link verifications) — `--effort
  medium`. Task `task-mtaiei5x-y371jn`.
- **#1723** (259 host-reputation images — told explicitly this is a
  large list, make honest partial progress, don't claim full completion)
  — `--effort high`. Task `task-mtaiep3n-qtpinp`.

All 4 forwarder dispatches confirmed (~12:52 PDT) — real Codex work is
now running independently in the background.

## Codex results, ~14:34 PDT (Joey: "still going? keep spinning up")

**Systemic finding: all 4 background Codex tasks hit the same sandbox
wall** — "GitHub connector write denied" (and Chrome/browser access also
denied in that sandbox). Confirmed `~/.codex/config.toml` already has
`approval_policy=never`/`sandbox_mode=danger-full-access` as CLAUDE.md
documents, so this isn't a shell-approval issue — it's a separate,
higher-level GitHub connector/OAuth scope that isn't authorized for this
Codex integration. Not something I can toggle via CLI; likely needs
Joey's own ChatGPT/Codex account settings (a Connectors-style
authorization, analogous to what the Hermes research surfaced earlier).
**Flag this to Joey — fixing it would make future dispatches land
autonomously instead of needing manual recovery.**

Per-task outcomes, each verified directly (not trusted from the
summary):
- **#1978** — did real, tested work (branch `fix/content-integrity-1978`,
  commit `de14323b`) but the worktree was cleaned up before I checked;
  commit is NOT reachable in the local git object DB (`git cat-file -t`
  fails) — **this work is genuinely lost**, not just unpublished.
  Redispatched fresh — forwarder confirmed, real Codex task now running
  as `task-mtamjdy8-t33yra` — this time explicitly told to leave work on
  a local branch and report the exact SHA/path if blocked again, so a
  repeat doesn't vanish the same way. Not yet complete as of ~14:47 PDT.
- **#722** — task claimed "already merged on main, would be a duplicate."
  Spot-checked: issue is still OPEN, and debut/fearless dropped from
  ~9/13 fashion cards to 1/2 (real prior progress, PR #3226 2026-08-24)
  but **speak-now still has 6** fashion-category items untouched. The
  "duplicate" claim may be too hasty for speak-now specifically — **not
  fully verified, don't trust this one at face value**; worth a dedicated
  look before closing #722.
- **#884** — genuinely needed zero code changes (verified: 4 already had
  live links, 9 already removed from corpus by prior passes, 31
  correctly have no findable exact link). Commented with full tally,
  closed myself.
- **#1723** — 258/259 already fixed by prior work; the last item
  (Speak Now Glamour-cover photo) was drafted+validated by Codex in a
  disposable `.scratch/codex-1723-verify/` archive (confirmed gitignored,
  plain directory not a separate clone) but blocked from publishing.
  **Recovered it myself**: diffed the 2 changed files against main,
  independently did the pixel-level image verification Codex couldn't
  (downloaded the new `media.glamour.com` photo, viewed it — genuinely
  Taylor in the correct black-lace dress), confirmed `cdn.shopify.com`'s
  removal from `PHOTO_HOST_LEGACY` is safe by reading `validate-content.mjs`
  directly (the many `products[].imageUrl` shop-link references elsewhere
  aren't governed by this gate at all — initially worried this was unsafe,
  investigation cleared it). Landed as PR #3378 (auto-merge armed), closes
  #1723 on merge. **259/259 done.**

## Continued (Joey: "keep fixing issues... do some work yourself too")

- **#1978 redo**: completed clean — confirmed everything from the
  original audit already fixed (my own #3366 dedup PR covered the
  remaining #1976 stubs; #1977 already fixed via #2064/#3210).
  `midnights-album`/William-Bowery pairs correctly left alone (distinct
  events). Posted the comment myself (Codex was blocked again on the
  same connector wall). Left OPEN — tracks the unrelated "Karen Deep"
  blocker, not a content defect.
- **#722 — did this one myself directly**, no agent: read the actual 6
  remaining speak-now fashion items (my earlier flag that this needed
  more work was WRONG — glad I checked rather than trusting either
  claim blindly). Computed real fashion-share percentages: debut 0%,
  fearless 5.6%, speak-now 11.5% — all under the issue's own ≤15%
  target. Read each of the 6 speak-now items individually: bangs-debut
  (lasting signature), album-cover gown (defines the era's visual
  identity), Glamour cover (real press beat), a Teen Choice look tied to
  a real 5-category sweep, first Vogue cover (already flagged
  `significance: 'notable'` in-code as a genuine milestone). All
  legitimate keeps, not filler. Closed with the evidence.
- **Bookkeeping**: #3352/#3353 (the P0 lyrics fixes) were merged via
  PR #3363 but GitHub only auto-closed the first `Closes #NNNN`
  reference in that PR body — closed the other two manually. Worth
  remembering: multi-issue `Closes` references in one PR body aren't
  reliable, verify each one individually.
- **#3368 — flagged, not resolved.** A genuine founder-decision issue:
  two automation lanes (Rumor Desk's Part C vs. Vault Run's "seed files
  only" hard limit) give contradictory instructions about whether
  `apps/web/lib/longlive/clownbot-lore.ts` can be touched. The issue
  itself explicitly asks not to have a side silently picked (workflow
  rule 5) — left for Joey, not resolved by me.
- **2 more Codex dispatches**: #1715 (137 low-quality images, task
  `task-mtantu7q-u8cb0b`, running) and #1719 (26 depth-deficit content
  items, task `task-mtanu29k-t9y97s`, queued behind it — Codex appears
  to run one task at a time regardless of how many I dispatch). Both
  `--effort high`, both explicitly told to preserve local branch/SHA
  info if blocked by the same connector wall rather than let work
  vanish like #1978's first attempt. (Note: the forwarder's own summary
  text is unreliable for job IDs — one said "job ID b7rrk02wf" which
  isn't a real task id; got the correct ones via `codex-companion.mjs
  status --all --json`, not the forwarder's rendered text.)

## Continued (Joey: "keep going... solve everything yourself")

- **#1715 Codex task came back essentially non-functional this time**:
  couldn't even read the issue (GitHub API network denied) or create a
  local branch (filesystem `Permission denied` — not just the GitHub
  connector this time). Reported "39 of 137 fixed per git history, 98
  remaining" — but that's a git-log-grep estimate, not a live check.
- **Spot-checked that estimate myself and it's wrong/stale**: grepped
  `fearless.mjs` for the ~10 specific Getty-watermark URLs issue #1715's
  own body still lists as flagged — ZERO of them exist in the file
  anymore. `media.gettyimages.com` doesn't appear in `fearless.mjs` at
  all. The issue's rolled-up tracker body is genuinely stale (same
  known pattern as #1721's counts earlier today), and the "98
  remaining" figure from git-history search is unreliable — it can't
  see fixes that were folded into later batch commits without an
  exact-string match.
- **Running a live, authoritative re-scan myself** instead of
  continuing to guess from stale numbers: `node
  scripts/content-engine/run.mjs scan` (WITH image fetching, not
  `--no-images`) in the background, log at
  `<scratchpad>/full-cie-scan.log`. This probes all 1083 distinct
  images for real and will give the true current `image.quality`
  (called `image.liveness` internally) count. Slow — still running
  after several minutes, 1083 images at concurrency 4. Check this log
  before doing any more #1715 work; do not trust the issue body or
  git-history estimates for this one.
- **#1719 (depth-deficit) Codex task still QUEUED, hasn't started** —
  seems stuck behind #1715's slot. Codex's sandbox reliability has been
  degrading through the day (#1723's task worked cleanly this morning,
  today's later dispatches increasingly fail before even reading the
  issue). Worth telling Joey this trend plainly rather than continuing
  to dispatch into it blind.
- **Closed #3373 myself** (bookkeeping) — all three parts confirmed
  done via PR #3375.
- **Checked #3370 (unowned-work-sweep ledger) and social/failed/'s 21
  items** — both purely informational/historical, nothing actionable
  found in either.

## Continued (Joey: "keep going... solve everything yourself") — done directly, no agent

- **Ran the real live scan** (`node scripts/content-engine/run.mjs scan`,
  with images, not `--no-images`) — got the TRUE current counts:
  `image.quality: 100` (not 137), `image.host-reputation: 1` (one item
  I'd fixed locally but hadn't merged yet — see below).
- **Categorized all 100 image.quality findings myself**: 2 genuine
  `/thumb/.../NNNpx-` renders (fixable, not yet done — small follow-up),
  ~90 direct-file URLs already at their host's ceiling (Wikipedia's
  non-free-content policy caps single/album covers at ~300px — verified
  this isn't a thumbnail-vs-original gap, it's the actual max; also
  tested the Guardian width-param-bump technique from an old precedent
  commit and it did NOT work on these 2 specific images — their source
  is also capped, confirmed by actually downloading at width=1000 and
  getting the same small dimensions back), 8 fixable via a technique
  found in git history (PR #3269/#819): swap a low-res single-cover for
  a verified still from the song's official YouTube video.
- **Fixed and landed the 8**: Blank Space, I Don't Wanna Live Forever,
  Should've Said No, Picture to Burn, The Last Time, End Game — for
  each, confirmed the official video via YouTube oEmbed (author "Taylor
  Swift"), downloaded the still (maxresdefault, falling back to
  hqdefault/sddefault where maxres 404'd — Picture to Burn's did), and
  **visually viewed every one** before using it, not just HTTP 200. PR
  #3379, auto-merge armed (stuck the same way #3378 did — see below).
  Commented on #1715 with the accurate 100-count and full breakdown;
  left open (~92 genuinely remain, known-deferred class).
- **Also caught and fixed**: PR #3378 (yesterday's #1723 final item) had
  sat fully green for ~10 min without auto-merging — same "doesn't fire
  on its own" trap from this morning. Merged it directly. This is the
  root cause of the "1 remaining host-reputation finding" — it was real,
  just not-yet-merged, not stale data.
- **#1719 (depth-deficit) Codex task never started** — sat `queued` for
  34+ minutes, never transitioned to running. Attempted to cancel it
  (`codex-companion.mjs cancel`) but the cancel command itself hit a
  Windows path-mangling bug in the tool (mangled `/PID` as a file path)
  and errored — left as-is, harmless either way. **Next direct-work
  target**: do #1719 myself the same way as #1715, not via Codex.

## Next step

1. Verify PR #3379 actually merges (check `mergedAt`, merge directly if
   it sits green again like #3378 did).
2. Do issue #1719 (26 depth-deficit items) directly, same rigor as
   #1715/#722 — don't wait on Codex, it's been unreliable all day.
3. Consider the 2 genuine `/thumb/` renders in #1715 as a small
   follow-up (quick, safe, already identified, just not yet done).

**Important distinction from the Claude Agent-tool flow**: the
`codex:codex-rescue` subagent is a THIN FORWARDER — it returns almost
immediately after starting the real Codex background task, not after the
work finishes. The "Agent finished" notification I get from it just means
the dispatch succeeded, NOT that the actual fix/PR is done. The real
Codex task runs independently and does not send its own Claude-native
completion notification — per CLAUDE.md, it needs active polling
(`node codex-companion.mjs result <job-id>` or `/codex:status
<job-id>`) roughly every 15 min, and "it can stall silently." Don't
mistake the forwarder's quick return for task completion in later
turns — check the actual task id.

## Since ~10:34 PDT

- **Hermes compatibility question, round 2 — no file changes, pure
  analysis.** Joey clarified his actual ask: not "run Hermes alongside
  Claude Code" (what the architect assessed) but "fully replace this
  repo's entire rule set with Hermes, including direct pushes to main."
  Answered directly from context already in hand (this session's Hermes
  research + the architect's verified local findings + my own knowledge
  of this repo's CLAUDE.md/governance, already fully in context) — no new
  agent dispatch needed, this was synthesis not research. Key points
  given: (1) **factual correction** — direct-push-to-main is gated by a
  GitHub branch-protection ruleset (`protect-main`, `bypass_actors: []`),
  which is completely independent of which AI tool is used; switching
  agents alone does not grant it, that requires a separate deliberate
  GitHub settings change; (2) enumerated what goes dark entirely under a
  full replacement (the ~22 scheduled Claude Code routines, the
  `.claude/agents/*` roster, all of `.claude/hooks/*`, Codex as
  independent reviewer) vs. what's tool-agnostic and survives (`build` CI
  check, `auto-merge-content.yml`, Vercel deploy, MCP servers); (3)
  flagged the compounding risk if BOTH the branch-protection ruleset AND
  the guard/review layer are removed together — the self-amendment bar
  (nothing today can quietly widen its own merge authority unreviewed)
  becomes structurally possible by default, not by exploit. Did not
  advocate for or against — his call, gave him the real shape of the
  tradeoff.
- **Committed + landed HUMAN-ACTIONS.md's item #25 reconciliation** that
  had been sitting uncommitted since ~10:04 PDT (moved to DONE, but never
  actually committed/pushed). Stashed it, fast-forwarded `main` (picked
  up PR #3372/#3375's real content — confirmed the two IG sibling files
  and the debut photo are genuinely on disk now), branched, committed,
  opened PR #3376, armed auto-merge, confirmed armed (`autoMergeRequest`
  populated), returned to `main`.

## Social bug: RESOLVED, confirmed on main

Joey reported "pr3327 says merged" — a digit-transposition typo for #3372
(3327 was old/unrelated, merged this morning). Verified: **both #3372 and
#3371 merged on their own** (~10:04 PDT) not long after Joey checked
Settings→Actions per the HUMAN-ACTIONS #25 steps — the missing-check-suite
cause was never conclusively identified, it just started working again.
Confirmed the actual fix landed, not just the merge: `git pull --ff-only`
+ `scripts/social/lib/queue.mjs` shows `MAX_POSTS_PER_RUN = 1` (was 5) on
`main`. HUMAN-ACTIONS.md #25 moved to DONE with this confirmation.

## Follow-up decisions (Joey, 2026-08-26 ~10:35 PDT) — dispatched, in flight

Two policy calls on issue #3373: (1) "always an IG copy. always." — retire
the `Single-platform exception:` escape hatch ENTIRELY, not just the
scheduling-pretext subset #3372 already caught (a real hardening beyond
what #3373 itself asked — flagged this as going further than the ticket in
the agent brief and in my own summary to Joey); (2) mechanically enforce
~1 post/day/platform via `MAX_POSTS_PER_PLATFORM_PER_DAY` (10→1), not left
to scheduling discipline. Recorded both on issue #3373.

Dispatched one agent (`aa156a3916d85cbc9`, branch
`fix/social-mandatory-ig-daily-cap`, worktree `%TEMP%\claude\swift2-wt\
social-ig-mandatory`) to: remove the exception mechanism from
`check-drafts.mjs` + its tests + docs, set the daily cap to 1 (and
document exactly what "day" means in this codebase — didn't want to
assume calendar-day-UTC without the agent confirming), author the 2
missing IG siblings from #3373 part 1, and sweep queue/posted for other
pretext-exception campaigns per #3373 part 2. Told it explicitly not to
loop on the "zero check-suite" mystery if it recurs — try once, then stop
and report.

**Verified directly, not just trusted** — spot-checked via `gh pr diff
3375`:
- `MAX_POSTS_PER_PLATFORM_PER_DAY`: confirmed `10 → 1` in the actual diff.
- Exception-honoring branch (`claimants`/`pretexts`) confirmed fully
  deleted from `checkCampaignPair` — the function now has exactly one exit
  for an unpaired campaign, unconditional, no marker check at all.
- Both IG sibling queue items confirmed real: sourced to actual seed
  content (`debut.mjs:358`, `red.mjs:143`), real Wikimedia photo credits,
  honest caption framing (correctly notes the Red photo is an Eras Tour
  performance shot, not a period photo, rather than implying otherwise).
  X siblings' `why` fields correctly updated to note the correction.
- **One claim did NOT hold**: agent reported "auto-merge armed on green"
  but `autoMergeRequest` was actually null when checked — armed it myself
  (`gh pr merge 3375 --squash --auto --delete-branch`). Worth remembering:
  this agent's "already armed" self-report was wrong, verify this
  specific claim type going forward, not just diff content.
- CI is triggering normally on this PR (`build: pending`, not the
  zero-check-suite mystery from earlier) — good sign that was transient.

PR #3375 now genuinely auto-merge-armed, build in progress as of ~10:55
PDT. Not merged yet — check before assuming landed.

## Architect invocations

- **2026-08-26 ~11:10 PDT** — Joey directly requested a Fable/architect
  assessment (not a debug-ladder escalation) of whether installing Hermes
  Agent (github.com/NousResearch/hermes-agent) tonight conflicts with this
  repo's structure, agent-dispatch model, and `.claude/hooks/`. I did the
  external research myself first (fetched Hermes's real README + 3 docs
  pages: architecture, context-files, security — via `gh api`/WebFetch,
  not guessed) since `architect`'s toolset (Read/Grep/Glob) has no web
  access. Key finding from that research: Hermes has **no pre-tool-call
  hook mechanism a project can supply** — `.claude/hooks/guard.sh`
  provides zero protection against an independent Hermes process; also
  its context-file discovery loads exactly ONE file type
  (`AGENTS.md`/`HERMES.md`/`CLAUDE.md`/etc., first match wins, AGENTS.md
  outranks CLAUDE.md), and it spawns subagents as fresh instances, NOT
  git worktrees by default — a possible conflict with this repo's
  single-branch-writing-session invariant. Dispatched `architect`
  (agent `a041822cccf2c3ac1`) with that research plus explicit local
  investigation targets (guard.sh internals, the AGENTS.md→CLAUDE.md
  redirect's real reliability, the existing ~22-routine cron fleet vs.
  Hermes's own cron system, worktree conventions) for final synthesis.

  **Reported ~11:2x PDT: install approved with containment.** Hermes =
  untrusted external process on Swift2 — read-only/advisory only, no
  write-scoped GitHub token, its cron never touches this repo, any file
  edits only in a dedicated %TEMP% clone, single-threaded, PR-only, never
  the shared checkout. Hard blockers (the two things that actually
  matter): (1) never give it a write-capable GitHub token for this repo,
  (2) never let its cron scheduler create jobs referencing Swift2.
  Verified locally, spot-checked by me afterward against the real files
  (not just trusted): `guard.sh`'s social-poster live-send guard and
  shared-checkout session lock are both genuinely Claude-PreToolUse-hook-
  only — structurally invisible to any other process. Root `AGENTS.md`
  really is Codex-reviewer-framed (confirmed, I'd already read it earlier
  this session) and would load INSTEAD of CLAUDE.md under Hermes's
  first-match rule, relying on a soft "read CLAUDE.md" line 3 the agent
  may or may not act on. `docs/agents/routine-invariants.md`'s Routine
  Auditor only sees Claude Code triggers — a Hermes cron job on this repo
  would recreate the 2026-07-25 runaway-loop failure class with zero
  detection.

## Since last checkpoint (~09:12 → now)

- Gave Joey the HUMAN-ACTIONS.md #25 unblock steps directly in chat
  (no file changes from that alone).
- **Caught a real known-trap recurrence and fixed it directly**: PRs
  #3363/#3366/#3367 (wave 1's three issue fixes) were fully green
  (`build`/`enable` pass) with auto-merge armed, but had silently sat
  OPEN/unmerged for over an hour — the exact "auto-merge doesn't fire on
  its own" trap already documented below. Verified via `gh pr view` before
  acting, then merged all three directly (`gh pr merge --squash
  --delete-branch`), confirmed `MERGED` on all three afterward. Local
  branch delete failed harmlessly (worktrees still reference them) — repo
  state is correct regardless, only local worktree cleanup is cosmetic.
- **Open question worth noting**: PR #3372 (the social fix) and #3371
  have ZERO check-suite (diagnosed, filed as HUMAN-ACTIONS #25). PRs
  #3363/3366/3367 DID get check-suites and just failed to auto-merge
  despite being green — these look like two DIFFERENT failure modes
  (no-CI-at-all vs CI-green-but-auto-merge-doesn't-fire), not the same
  bug. Worth keeping distinct if this recurs again — don't conflate them.

## Standing instruction (Joey, 2026-08-26 ~09:10 PDT)

"Continue solving issues... anything that's not blocked." Continuation of
the day's broader "solve the entire remainder of open issues without a
blocking human action" posture. Also (~08:xx PDT): "as long as they are all
done I don't care how" re: the 3 PRs from §Earlier — closing a superseded
PR instead of merging it was accepted as satisfying "get it done."

## Earlier this session (before this wave, already landed)

- Recorded 4 founder decisions on their issues (#479 closed/no-Twilio, #531
  progress note, #725 partial, #2316 ratified) — see PR #3358 (merged) for
  the video-seed bug fix that came out of #725 (root cause: `slug` globally
  unique, per-era delete-then-insert broke on cross-era content moves; now
  upserts by slug, verified against a real ephemeral Postgres repro).
- Merged PR #3354 (CIE scan report, green) and #1961 (Clownbot re-spec
  draft docs, marked ready then merged).
- PR #3341 (mobile Expo SDK-57 alignment) — investigated the merge
  conflict, found #3342 already merged the identical fix 5 hours earlier;
  closed #3341 as superseded rather than force a stale merge. Commented
  explaining why.
- `HUMAN-ACTIONS.md` reconciled (5 items moved to DONE, #24 filed for the
  video re-seed — still needs Joey to run `npm run db:seed:videos` after
  pulling; not yet confirmed done).

## Current wave (3 agents dispatched ~09:12 PDT, capped at 3 concurrent per CLAUDE.md)

Each in its own worktree under `%TEMP%\claude\swift2-wt\`, branch `fix/*`,
told to land its own PR (merge or `--auto`) without babysitting:

- **`fix/cie-lyric-redlines`** (agent `ad46d59028df84ee8`) — issues #3353/
  #3352/#3351, CIE P0 safety findings: 3 `song-moods/tloas.mjs` `useCase`
  fields read as verse-like lyric transcription (real copyright exposure).
  Told to rewrite as plain prose, `sync:content`, close all 3 issues on
  merge. Highest-priority item in this wave (P0/legal).
- **`fix/close-button-a11y`** (agent `a0e365f00a82585e8`) — issue #525,
  points 1+2 ONLY (contrast fix on `.era-icon-btn`, 44px tap target, extend
  `useBackDismiss` to the 4 missing components). Explicitly told NOT to
  touch point 3 (X-vs-swipe-as-primary — a real product-direction call)
  and to leave #525 OPEN pending that decision from Joey.
- **`fix/dedup-legacy-stub-moments`** (agent `a1bef570908dfcecb`) — issue
  #1976, 7 confirmed duplicate moment pairs across `midnights.mjs` /
  `the-life-of-a-showgirl.mjs` (thin RAW-migration stub + rich canonical
  moment for the same event, both currently shipping). Told to migrate
  each stub's unique `milestone`/`hiddenClue`/`threadIds` onto the
  canonical moment, delete the stub, re-verify the milestone list, and to
  skip/report rather than force-merge any pair it's not confident about.

**Verification status:**
- `fix/cie-lyric-redlines` (#3363) — **done, spot-checked directly.** Root
  cause: `redlines.mjs`'s `looksLikeLyricsBlock` flags 4+ short lines; the
  3 flagged `useCase` arrays had exactly 4 phrases. Fix trims each to 3
  (house style, confirmed via `gh pr diff` — real diff read, not just the
  agent's claim). Auto-merge armed, not yet merged as of 09:17 PDT
  (`build` hadn't started); `Closes #3351, #3352, #3353` in the PR body so
  GitHub auto-closes all 3 on merge. Still need to confirm the merge
  actually lands.
- `fix/close-back-dismiss-coverage` (#525, PR #3367) — **done, spot-checked
  directly.** Points 1/2 of the ORIGINAL issue (contrast, 44px tap target)
  turned out already fixed on `main` by an earlier PR (#853/#3332) — agent
  caught this rather than redoing it, confirmed by reading current
  `globals.css` myself (`min-width/height: 44px`, solid `var(--era-ink)`
  bg, not the old transparent color-mix). Remaining real gap (back-swipe
  dismiss on 4 components) fixed for 3 of 4 — `EntryDetail.tsx` correctly
  left alone since its parent already owns the hook (adding a second would
  double-push history, a real regression the agent avoided). Diff spot
  check confirms `useBackDismiss` wiring is real. Real-browser verification
  via claude-in-chrome, not just typecheck/tests. Issue #525 correctly
  left OPEN — point 3 (X vs. swipe as primary) still needs Joey's call.

## Wave 2 dispatched (~09:26 PDT, 3 more agents, low collision risk with wave 1 and each other)

- **`fix/evermore-image-quality`** (issue #744) — **done, verified, no PR
  needed.** Already fixed by PR #3269 (2026-08-24, untagged to this
  issue). Checker reports 0 findings corpus-wide; confirmed directly via
  grep, no sub-400px Wikimedia thumbnails remain in `evermore.mjs`. Issue
  closed correctly.
- **`fix/csp-enforce-resource-policy`** (issue #1975) — **done, verified,
  no new PR needed.** Already fixed+merged by an unrelated earlier PR
  #3345 today (confirmed: `next.config.mjs` has `enforceResourcePolicy:
  true`, merge commit is an ancestor of `main`). Agent correctly found
  this instead of duplicating work, closed the stale issue.
- **YouTube catalog bounded pass** (issue #3286) — **done, verified.**
  Comment posted (confirmed via `gh issue view`), correctly left open.
  Real finding spot-checked: `visualizer` genuinely isn't a valid
  `VideoNoteKind` (confirmed via direct read of `types.ts:858-870`, only
  10 kinds exist, no visualizer) — a real schema gap, not a fabricated
  claim. MVs effectively complete (11/11), 9 genuine lyric-video gaps
  identified with URLs, 140-item older-catalog bucket correctly left as a
  flagged policy question rather than false-positived into a todo list.

Wave 2 fully done: all 3 turned out either already-fixed (verified
independently, not just trusted) or correctly scoped-and-reported.

## Mechanical closures done directly (no agent, pure reconciliation)

- **#1970 + #1971** (security red-team trackers) — found both already had
  fresh 09:05 PDT status-check comments (from an earlier/concurrent
  session, not this one) flagging #1966/#1967 as the only remaining open
  items; then found PR #3347 (merged 09:17 PDT, also not mine) closed both
  of those. Verified all 9 total sub-tickets (1965-1969, 1972-1975) are
  CLOSED. Closed #1970 and #1971 directly with final reconciliation
  comments — no agent needed, pure bookkeeping.

## Wave 3 dispatched (~09:34 PDT, 1 agent — 2 slots held for the opus bug + headroom)

- **`content/intake-dolly-parton`** (issues #3361/#3362) — **incomplete,
  needs follow-up.** Agent `a8b39667abe6958c5` opened PR #3371 but its
  final report was itself unfinished (it was mid-poll on whether CI
  triggered and stopped without resolving). Verified directly: PR #3371
  is OPEN, `mergeable: UNKNOWN`, auto-merge never armed, `gh pr checks`
  shows only Vercel checks — no `build` (the required check) ever
  triggered. Dispatched a follow-up agent (`ab5a661e0ce3ce7eb`, NOT a true
  resume — I don't have SendMessage loaded this session, so I passed full
  context in a fresh Agent call instead; it has the PR number and enough
  detail to reconstruct state from git/gh, but isn't literally the same
  agent process) to diagnose why `build` never fired and land it properly,
  with an explicit bounded-effort instruction (don't loop forever) and to
  double-check #3361/#3362 weren't closed prematurely before the fix
  actually merged.
- `fix/dedup-legacy-stub-moments` (#1976, PR #3366) — **done, spot-checked
  directly via `gh pr diff`.** 4 pairs fixed with real milestone/hiddenClue
  migration onto canonical entries before stub deletion (`m-mid-3`,
  `m-tloas-1`, hiddenClue all confirmed moved, not dropped); 2 more pairs
  claimed already-resolved by prior issue #616 — verified #616 is real and
  closed with a matching title, so that claim checks out. 1 pair
  deliberately left alone (genuinely different events, not a dup) — sound
  judgment call. `validate:content` went 1 error → 0, full suite
  244/244. Auto-merge armed, issue #1976 already closed by the agent
  (before merge — slightly ahead of actual landing, but the PR is green
  and mergeable so low risk). Not yet confirmed merged.

## Worklist for next wave(s) — not yet dispatched, ranked roughly by value

Genuinely non-blocked (no founder-only credential/account/decision gate):
- **CIE content-quality queues**: #1723 (259 host-reputation images), #1715
  (137 low-quality images), #1721 (54 photo-sparsity — note some real
  progress already landed via PR #3266, tracker count may be stale), #884
  (44 fashion-product links), #1719 (26 depth-deficit). Large, content-file
  heavy — sequence carefully (one at a time or paired), not 5 at once, per
  the known collision-risk lesson below.
- **#1978** — content-integrity red-team, exp:P2, likely more findings in
  the same shape as #1976.
- **#744** — evermore image-crop fix (code-only, low collision risk).
- **#3286** — YouTube channel coverage audit (613 videos), research-heavy.
- **#440/#445/#434/#722** — large content epics, launch-gate-adjacent. Read
  full specs before dispatching; these are multi-session efforts, not
  single-wave.
- **#1954/#1955/#1956/#1957/#1958** — desk-coordination content tickets;
  #1955/#1958 were confirmed unblocked by an earlier session (see git/PR
  history) but touch large overlapping content files — sequence, don't
  parallelize against each other or against the CIE queues above.
- **#1970/#1971/#1975** — security red-team review/reconciliation; #1971's
  "no human review before merge" finding is now INTENTIONAL policy (see
  `docs/decisions.md`), not a gap — brief any agent touching this
  explicitly so it doesn't re-flag settled policy as a bug.
- **#47/#50/#51/#52** — go-live blockers, the biggest remaining lift
  (content depth, legal copy, era art, QA pass). Multi-session scope.
- **Intake tickets** (#3362, #3361 currently) — recurring news-tip
  additions, one agent handles all pending `intake:` issues sequentially
  in one combined PR (established pattern, avoids content-file collisions).

Explicitly OUT — blocked on Joey/Wyatt directly, do not dispatch against:
#138 (PhotoDNA paid signup), #531 (Apple Developer account, in approval),
#725 (needs `npm run db:seed:videos` rerun post-pull — code fix already
shipped, just waiting on Joey), #680 (BACKUPS gate, `HUMAN-ACTIONS.md` #23,
needs Supabase dashboard access), #2061 (explicitly "not a code task"),
#2102/#2258 (handoff/reference, need Joey's account access), #2195/#2313
(founder-only Reddit posting, both now overdue), #3185 (live snapshot
tracker, not actionable), #462/#468 (new-feature/product-scope ideas, not
yet approved — building would violate "no features outside an approved
spec").

## Known traps (carry forward)

- Auto-merge with green checks can sit without firing — verify `mergedAt`
  directly; direct (non-`--auto`) merge if checks are already green.
- Content PRs MUST run `npm run sync:content` and commit the regenerated
  `*.generated.ts` before opening the PR, every time.
- Verify branch is genuinely up to date with `origin/main` before starting
  work in any worktree — stale worktrees have bitten this session already
  (the #3341 investigation).
- After resolving any real merge conflict in overlapping content, re-grep
  for cross-file duplicate slugs/ids — line-based automerge can silently
  keep two copies of the same content.
- STATE.md checkpoint gate fires on any uncommitted working-tree change; do
  not let this file go stale mid-wave.

## Live production bug — RESOLVED (diagnosis), BLOCKED (landing)

**Full root cause found for both symptoms, no `DEBUG.md` needed** — opus
agent got there without hitting the two-strike wall:
1. **IG parity**: not a posting failure — zero IG items were ever drafted.
   A 9-day-old `⛔ OPEN INCIDENT` banner in `social/calendar.md` (real
   incident: IG screenshots were wrong aspect ratio, 780×1688 vs IG's
   0.80-1.91 range) stopped scheduling IG legs entirely and never got
   removed after the actual fix (#3157) landed 3 days ago — screenshots
   are 1080×1350 now, `check-drafts.mjs` already has the aspect gate, IG
   posted fine on 08-24/08-25. A stale doc banner silently starved a
   platform for 3 extra days after the real problem was already fixed.
   Separately, a calendar rule flatly contradicted the 2026-08-25 hard
   pairing rule ("heartbeat days never sibling-pair") and nothing enforced
   pairing in code — PR #3327 landed it as prose only.
2. **Cadence burst**: 4 appearance-discovery drafts landed with
   `scheduledAt` 3.6 seconds apart, ~11h overdue by the time their PR
   merged → all instantly due → `MAX_POSTS_PER_RUN=5` shipped all 4 in one
   run. Fixed to 1.
3. **Bonus, real, nobody asked**: the `social-ledger` duplicate-post
   defense (issue #2040, built after two live-duplicate incidents) has
   been silently dead since the moment it shipped 2026-08-25 —
   `git commit-tree` fails with `empty ident name` because `git config
   user.*` runs in a later step than the commit. Fixed.

**Fix written, tested (344 tests green), verified against the live queue
— but STUCK.** PR #3372 (`fix/social-ig-parity-cadence`) cannot merge:
GitHub Actions creates **zero check-suite** for this branch — no `build`
(the required status check), no CodeQL, no tree-pr-mail. Confirmed
independently (not just trusting the agent): `gh api .../actions/runs?
branch=fix/social-ig-parity-cadence` → 0 runs, workflows all `active`,
Actions permissions `enabled/all`, not a fork PR. A second, unrelated PR
(#3371, routine vault content) hit the IDENTICAL symptom, as did its
predecessor #3369 — so this isn't specific to touching `.github/
workflows/**`. Two independent agent investigations (plus my own spot
check) ruled out every repo-side cause reachable via `gh`/API. **Filed as
`HUMAN-ACTIONS.md` #25** — needs Joey's GitHub Settings UI access, not
something fixable from here.

**Also filed issue #3373** — the missing IG-sibling content decision
(tonight's 23:30Z X-only post needs an IG sibling authored) and the daily
volume question (`MAX_POSTS_PER_PLATFORM_PER_DAY` is still 10, "roughly
once a day" isn't encoded anywhere — a content-strategy call, deliberately
left to Joey, not guessed at).

## (superseded prelude, kept for the record) — dispatched ~09:29 PDT

Joey reported directly (not a filed issue yet): 5 X-post success emails in
the last few hours, **zero for Instagram** — breaks the documented hard
pairing rule (`social/README.md`, 2026-08-25: every campaign = X+IG pair,
same `campaign` value). Also: posting cadence should be ~daily, but 4 posts
went out at once recently instead. Two symptoms, possibly one root cause or
two — not assumed either way.

Dispatched one **opus**-model agent (Joey's explicit request) — agent
`a82b38349fb010f14`, branch `fix/social-ig-parity-cadence`, worktree
`%TEMP%\claude\swift2-wt\social-parity-bug`. Following the two-strike debug
protocol (`.claude/skills/debug-protocol`) explicitly: one hypothesis at a
time, genuinely different mechanisms, `DEBUG.md` + stop after 2 failures
rather than guess-and-check. Told it to check real `gh run` logs for
`social-poster.yml`, not just read code, and that it CANNOT execute
`post-queue.mjs`/`delete-media.mjs` (guard-denied, live, no dry-run).
Counts toward the 3-concurrent cap alongside the 2 still-running wave-2
issue agents (evermore-images, YouTube-catalog) — this is fine, wave 2 is
close to done.

**This takes priority over dispatching more issue-solving waves** until
it reports back — don't start a wave 3 until this resolves or the
concurrent slot frees up, and definitely verify this one's claims
extremely carefully given it's live-posting-adjacent and reputational.

## Next step

Wait for the 3 wave-1 completion notifications. Verify each directly
(PR merged? issue actually closed with correct evidence? tests really
passed?). Then dispatch the next wave of ≤3 from the worklist above,
picking low-mutual-collision-risk items (code-only fixes pair well with
each other; content-file-heavy items need to be sequenced one at a time
against anything else touching the same era files).
