# PLAN.md — Land the Community + Merch depth work on SIX separate tabs

**Status:** ready for `executor`. Written 2026-08-15.

## The decision this encodes

Joey ruled 2026-08-15: **keep six separate bottom-nav tabs** (Eras, Threads,
Mood, Clownbot, Community, Merch). He has seen them live on his phone with
labels and approved.

PR #2116 (`feature/community-social-merch`) built genuinely good depth work —
merch filters, era grouping, product images, jump bars with counts — but bundled
it with **merging Merch into Community to reach 5 tabs**, because at the time 5
was the only way to get text labels back.

**That premise is dead.** PR #2140 raised `BOTTOM_NAV_ICON_ONLY_THRESHOLD` from
5 to 7, so six tabs render WITH labels. The nav justification for #2116 no
longer exists, and Joey has rejected the merge.

**This plan takes the depth work and drops the tab merge.** #2116 is closed
unmerged at the end.

## Strategy: PORT FORWARD, DO NOT REBASE

Branch fresh from current `main`. Do **not** rebase or merge
`feature/community-social-merch` — it conflicts with `main`, it is checked out
in another session's git worktree, and most of its conflicts are in exactly the
files we are dropping. Copy the files we want from that ref, by path.

Read the old versions with `git show origin/feature/community-social-merch:<path>`.

## TWO TRAPS THAT WILL SILENTLY UNDO TODAY'S WORK

1. **NEVER take `STATE.md` or `PLAN.md` from that branch.** Its `STATE.md` is
   262 lines of divergence and would revert the 2026-08-15 checkpoint.
2. **NEVER take `apps/web/lib/longlive/bottom-nav-layout.ts` or its test from
   that branch.** It carries the OLD 5-tab threshold. `main`'s value is
   `BOTTOM_NAV_ICON_ONLY_THRESHOLD = 7` and it must stay 7. Taking that file
   deletes every nav label — the exact bug Joey reported and #2140 fixed.

If either file appears in `git status`, you have made a mistake. Revert that
path only (`git checkout main -- <path>` is NOT allowed by this repo's rules —
instead re-copy the correct content from `main` with `git show main:<path>`).

## TAKE — the depth work (all of it)

New files, self-contained, no dependency on merging the tabs:

| File | Why |
|---|---|
| `apps/web/lib/longlive/merch-filters.ts` | in-stock / piece / three price bands |
| `apps/web/lib/longlive/merch-filters.test.ts` | its tests |
| `apps/web/lib/longlive/section-jump.ts` | jump-bar model + counts |
| `apps/web/lib/longlive/section-jump.test.ts` | its tests |
| `apps/web/components/longlive/SectionJumpBar.tsx` | the jump bar UI + sticky rail |
| `apps/web/lib/longlive/filter-chips.tsx` | shared chip rendering |
| `docs/engineering-lessons.md` | docs, additive |

Modified files — port the DEPTH changes only:

| File | Take | Do NOT take |
|---|---|---|
| `apps/web/components/longlive/MerchSection.tsx` | twelve era sections newest-first, filters, `0 of 13 match` empty-state, product images (150/156 real photo, 6 monogram tiles), jump bar | anything assuming it renders inside Community |
| `apps/web/components/longlive/CommunitySection.tsx` | jump bar, counts, section depth | the Social/Merch segmented toggle |

## DROP — the tab merge

Do not port any of these; `main`'s versions are correct:

- `apps/web/components/longlive/SegmentedToggle.tsx` — **do not create it.**
  It exists only to switch Social/Merch inside one tab. If some ported code
  imports it, that import is part of the merge and must be removed instead.
- `apps/web/components/longlive/BottomNav.tsx` + `BottomNav.test.ts` — six tabs
  stay exactly as they are on `main`.
- `apps/web/lib/longlive/bottom-nav-layout.ts` + test — see trap 2.
- `apps/web/components/longlive/TopBar.tsx` — its −47 lines remove Merch from
  the desktop nav. Merch keeps its desktop entry.
- `apps/web/lib/longlive/store.tsx`, `LongLive.tsx`, `deepLink.ts` — take a
  change ONLY if a ported depth feature genuinely needs it (e.g. a filter or
  jump-target deep-link param). The `?mode=merch` → Community redirect is part
  of the merge: **do not port it.** `?mode=merch` must keep resolving to the
  standalone Merch tab.
- `apps/web/lib/longlive/share.ts` + test — `main` already ships
  `merchShareCopy()` / `{kind:'merch'}`. Keep Merch's own share target.
- `apps/web/components/longlive/FilterBar.tsx` — its −63 lines are entangled
  with the toggle. Start from `main` and add only what a ported feature needs.

## Steps — verify each before advancing

**Step 1 — branch.** From up-to-date `main`, in your OWN git worktree created
outside `Documents\Claude\Projects\` (see `docs/agents/README.md`).
Branch: `feature/merch-community-depth`.
*Verify:* `git log --oneline -1` matches `origin/main`; `git worktree list`
shows your worktree.

**Step 2 — copy the seven TAKE-whole files.**
*Verify:* `npm run typecheck --workspace=@swift2/web` — expect failures ONLY
about the two modified components not yet updated. Record them.

**Step 3 — port `MerchSection.tsx`.** Standalone tab, not a pane.
*Verify:* `npm test -- merch-filters` and `npm test -- section-jump` pass.

**Step 4 — port `CommunitySection.tsx`.** No segmented toggle.
*Verify:* `node -e` grep proves `SegmentedToggle` appears nowhere:
`node -e "const {execSync}=require('child_process');console.log(execSync('git grep -l SegmentedToggle || true').toString()||'clean')"`

**Step 5 — prove the nav is untouched.**
*Verify, all three must hold:*
- `git diff main --stat -- apps/web/components/longlive/BottomNav.tsx apps/web/lib/longlive/bottom-nav-layout.ts` is EMPTY
- `node -e "console.log(require('fs').readFileSync('apps/web/lib/longlive/bottom-nav-layout.ts','utf8').match(/THRESHOLD = \d/)[0])"` prints `THRESHOLD = 7`
- `npm test -- bottom-nav` passes

**Step 6 — deep links still resolve.**
*Verify:* `npm test -- deepLink` passes and `?mode=merch` still maps to the
Merch tab, not Community.

**Step 7 — full suite + typecheck.**
*Verify:* `npm test` green (baseline ~2939 passing; pre-existing failure
`scripts/social/lib/card-render.test.ts` missing `satori` is NOT yours) and
`npm run typecheck --workspace=@swift2/web` clean. Repo-wide typecheck fails on
`apps/mobile` — pre-existing, not yours.

**Step 8 — PR.** `gh pr create --body-file` (never inline backticks). TL;DR
first two sentences in plain language: Merch and Community each get filters,
images and jump bars, and the six-tab nav is unchanged. Then `---`, then what
landed, then a "Deliberately not ported" section naming the tab merge and why.

## Definition of done

- Six labelled tabs, `THRESHOLD = 7`, `BottomNav.tsx` byte-identical to `main`
- Merch: era sections, filters, images, jump bar — as a STANDALONE tab
- Community: depth + jump bar, no segmented toggle
- `?mode=merch` resolves to Merch
- Full suite green, web typecheck clean
- **Device check at 360px and 390px before it is called done** — a green suite
  has missed every nav bug this week.

## After merge

Close #2116 with a comment explaining the depth work landed separately and the
tab merge was rejected because #2140 made it unnecessary. Do not delete its
branch until the comment is posted.
