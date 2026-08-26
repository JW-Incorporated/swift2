# Open Work Summary — Issues & PRs (2026-08-26)

Updates `docs/proposals/2026-08-25-open-work-summary.md` (superseded, kept for
history). Same live-pull method via `gh`, one day later. Yesterday's snapshot:
**148 open issues, 4 open PRs.** Today: **44 open issues, 3 open PRs** —
`repos/JW-Incorporated/swift2`'s `open_issues_count` dropped from 151 to 47
overnight (that field counts issues + PRs together). At least 200 issues
closed since yesterday (the `gh` search hit its display cap at 200; the real
number is higher), overwhelmingly `cie`/`cie:image`/`cie:P1` labeled — the
Content Integrity Engine and the image-cleanup pass (#745, #1721 partial via
PR #3266) worked through a large backlog of individual findings. 30 PRs
merged since yesterday.

---

## 1. Section 3 decisions — closed out today (Joey, in chat, 2026-08-26)

All four items from yesterday's §3 now have answers, recorded on their
issues:

| # | Ask | Decision | State |
|---|---|---|---|
| [479](https://github.com/JW-Incorporated/swift2/issues/479) | Create a Twilio account for SMS alerting | **No.** Stay email-only; ratifies the ticket's own recommendation. | Closed. |
| [531](https://github.com/JW-Incorporated/swift2/issues/531) | Get the iOS app live on the App Store | Not yet a decision — **progress**: Apple Developer account application submitted, in Apple's approval queue. | Still open, waiting on Apple. |
| [725](https://github.com/JW-Incorporated/swift2/issues/725) | Refresh the production database | **Partially done.** `db:seed:content` (718 items) and `db:seed:theories` (74) ran clean. `db:seed:videos` failed on a real bug — diagnosed, fixed, and verified this session (see §2 below). | Still open pending the video re-seed. |
| [2316](https://github.com/JW-Incorporated/swift2/issues/2316) | Should social posts require a human click? | **No — full automation confirmed.** `social/queue/` has been auto-merging on `check-drafts.mjs` + CI green since 2026-08-25 already; the only stale piece was one leftover sentence in `social/README.md` claiming otherwise, fixed this session. | Already closed; decision now recorded on the issue too. |

## 2. New this session: the video-seed bug (issue #725, HUMAN-ACTIONS.md #24)

Running yesterday's §3/#725 refresh today, `db:seed:videos` failed:
`duplicate key value violates unique constraint "video_work_slug_key"`.
Root cause: `video_work.slug` is globally unique, but `seed-videos.mjs`
deleted-then-inserted **per era file only**. Commit 46a88202 (2026-08-25,
#3317) correctly moved 3 videos to different era files per the new
real-world-date rule (#3315) — but production hadn't been reseeded since,
so the old-era row for each moved video was still occupying that slug when
the new-era insert tried to claim it.

Fixed in `scripts/seed-videos.mjs` this session: videos are now upserted by
`slug` (`on conflict (slug) do update ...`) instead of delete-then-insert
scoped to one era; a slug is only deleted if it no longer appears in ANY
seed file (a genuine removal). Verified against a real ephemeral local
Postgres — reproduced the exact bug (inserted a video under its stale
pre-move era, ran the real script), confirmed it relocates cleanly with no
constraint error, and confirmed a rerun is a clean no-op. On branch
`docs/2026-08-26-decisions-and-seed-fix`, PR pending. Once merged, the only
human step left is `npm run db:seed:videos` — filed as
`HUMAN-ACTIONS.md` #24.

## 3. Notable closures since yesterday (context for what shipped)

Beyond the four §3 decisions, these issues from yesterday's doc closed:

- [#646](https://github.com/JW-Incorporated/swift2/issues/646) All Too Well missing context — fixed.
- [#738](https://github.com/JW-Incorporated/swift2/issues/738) Fully automate social posting — shipped.
- [#745](https://github.com/JW-Incorporated/swift2/issues/745) Site-wide low-quality image cleanup (115 images) — done.
- [#2040](https://github.com/JW-Incorporated/swift2/issues/2040) Social posting ledger strand risk — redesigned (the `social-ledger` branch mechanism now documented in `social/README.md`).
- [#1966](https://github.com/JW-Incorporated/swift2/issues/1966) / [#1967](https://github.com/JW-Incorporated/swift2/issues/1967) — prompt-injection guardrail gaps — closed.
- [#3282](https://github.com/JW-Incorporated/swift2/issues/3282) Social-poster failures never notify a founder — closed (founder-success-email + failure paths landed).
- PR [#3154](https://github.com/JW-Incorporated/swift2/pull/3154) (single-decision-maker docs rewrite) merged. PRs [#3327](https://github.com/JW-Incorporated/swift2/pull/3327) (X/Instagram campaign pairing) and [#3325](https://github.com/JW-Incorporated/swift2/pull/3325) (appearance-discovery fast-lane draft) both merged — yesterday's "2 PRs with failing CI" are resolved.

## 4. Still open, unchanged in substance since yesterday

- **Launch blockers** (yesterday's §2): [#47](https://github.com/JW-Incorporated/swift2/issues/47) content depth, [#50](https://github.com/JW-Incorporated/swift2/issues/50) legal/product copy, [#51](https://github.com/JW-Incorporated/swift2/issues/51) era cover art, [#52](https://github.com/JW-Incorporated/swift2/issues/52) pre-launch QA — all still open, none started.
- **New launch-adjacent item**: [HUMAN-ACTIONS.md #23](../../HUMAN-ACTIONS.md) — the BACKUPS gate (#680) needs a ~10-minute Supabase-dashboard check + one restore drill only Joey can run; filed today, not part of yesterday's snapshot.
- **Content-quality queues** ([#1723](https://github.com/JW-Incorporated/swift2/issues/1723), [#1715](https://github.com/JW-Incorporated/swift2/issues/1715), [#1721](https://github.com/JW-Incorporated/swift2/issues/1721), [#884](https://github.com/JW-Incorporated/swift2/issues/884), [#1719](https://github.com/JW-Incorporated/swift2/issues/1719)): still open, tracker bodies still show yesterday's counts (259/137/54/44/26) even though real work landed against some of them (e.g. PR #3266 sourced photos for 50/68 photo-sparsity items) — these rollup issues don't self-update, so the displayed counts are a ceiling, not a live figure. Worth a recount before treating them as current.
- **Product/experience work** (§4 items 440, 445, 434, 462, 525, 680, 722, 744, 3286) and **coordination tickets** (§7: 1955, 1954, 1956, 1957, 1958) — unchanged, all still open.
- **Overdue founder tasks**: [#2195](https://github.com/JW-Incorporated/swift2/issues/2195) (week of Aug 17) and [#2313](https://github.com/JW-Incorporated/swift2/issues/2313) (week of Aug 24) — both Reddit-comment asks, both now past their target week with no completion recorded.
- **Handoff docs**: [#2102](https://github.com/JW-Incorporated/swift2/issues/2102), [#2258](https://github.com/JW-Incorporated/swift2/issues/2258) — unchanged.

## 5. Open PRs (3, was 4)

| # | Title | Status |
|---|---|---|
| [3354](https://github.com/JW-Incorporated/swift2/pull/3354) | cie: scan report 2026-08-26 | New today, mergeable state unknown — check before assuming it's stuck. |
| [3341](https://github.com/JW-Incorporated/swift2/pull/3341) | fix(mobile): align remaining native modules with Expo SDK 57 | **CONFLICTING** — needs a rebase before it can merge. |
| [1961](https://github.com/JW-Incorporated/swift2/pull/1961) (draft) | Clownbot re-spec + implementation plan | Unchanged from yesterday — still awaiting founder sign-off on the open questions inside. |

---

## Bottom line

- **Section 3 is clear.** All four founder decisions from yesterday are made and recorded on their issues; only #725/#531 have real follow-up work left (video re-seed once the fix PR lands; iOS waiting on Apple).
- **A real production bug got caught and fixed today**, not just documented — the video seed script's era-move handling was broken, now upserts correctly and is verified against a real Postgres reproduction of the exact failure.
- **Yesterday's "148 open issues" was mostly noise, not backlog** — the mass closure confirms yesterday's own §9 recommendation (bulk-close stale automated reports) was broadly correct, though today's drop looks driven by CIE finding closures specifically, not the recurring-report cleanup that recommendation targeted.
- **The 4 launch blockers (§2, unchanged) are still the real gate** — #47 content depth and #745's sibling #744/#1721 image work are the biggest remaining lift; nothing moved on them today.
- **HUMAN-ACTIONS.md now has 2 open BLOCKING items requiring Joey directly** (#23 BACKUPS gate, #22 Photo-Enrichment egress policy) plus #24 (UPGRADE, just a re-run once the fix PR merges) — everything else completed today (#21, #20, #17, #14, and #18 mostly) has been reconciled into that file's DONE section.
