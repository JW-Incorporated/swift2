# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**Nothing in flight.** The merch page redesign to Joey's marquee mockup shipped
2026-08-16 (Wave 1 components → integrator → his six review fixes), on top of
his 12-item punch list the day before. All merged, `main` green.

**Two rulings a future session WILL be tempted to undo:**

- **Merch is a THEME, not an opt-out.** `MERCH_THEME` + `merchStyle()` flow
  through the same `--era-*` mechanism as Threads' `VAULT_THEME` — that is what
  makes TopBar/BottomNav/SiteFooter transition. `--merch-*` survives ONLY for the
  three section accents and background gradients. I ruled the opposite first;
  Joey overruled it because the chrome could not follow. **Never re-separate.**
- **The merch card splits ONLY when both images exist.** 59 of 156 items have one
  photo, so an unconditional split showed a bare monogram on 38% of cards.
  `merchItemImage()` is the single source of that decision. Monograms 59 → 4.

## KAREN — TWO SEPARATE FAULTS, diagnosed 2026-08-16

**Fault 1 (hers, WYATT-ONLY).** Karen is NOT a GitHub Action — she is a
**scheduled Claude Code routine on Wyatt's account** (`trig_014HWuRmT2MFveDkPGwVDiQX`).
**No session here can see or fix her**; `CronList` only sees the current session.
Last real run = PR #1850, 2026-08-09. **Full diagnosis, the config trap, and the
prompt delivered to Joey are in `HUMAN-ACTIONS.md` #2** — read that, not this.
Success signal: a PR titled `karen: nightly run report <date>`.

**Fault 2 (OURS, fixed in #2178, and why Joey got silence).** `watchdog.yml`
runs `run:` blocks as **`bash -e {0}`**. Two steps use a non-zero exit as the
ALARM SIGNAL then read `$?` on the next line — but `set -uo pipefail` does NOT
clear the inherited `-e`, so the shell died the instant the check exited 1 and
never reached the branch that opens the alert. The old comment claiming "`set -e`
is deliberately off for this line" was FALSE. Now `STATUS=0; node … || STATUS=$?`,
a guarded context errexit does not fire on. **Never use bare `|| true` — it
discards the exit code the branch needs.**

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **CC BY / CC BY-SA credits were NOT deleted, deliberately.** Joey asked to
  "get rid of" the two Wikimedia photo credits. Visible attribution is a LICENCE
  CONDITION (`lenses.ts:44-58`, `ThreadsMode.tsx:298-301`, `docs/decisions.md`
  2026-08-15) with no attributions page as fallback. #2151 fixed the real
  complaint instead (10px, muted, tighter gap). **Full removal needs Joey's
  EXPLICIT call — a licence breach, not a style preference.** Not yet answered.
- **#2110's three questions are unanswered** and **five decisions lost their
  owner** — see `HUMAN-ACTIONS.md` #7 and #5. **Wyatt retains account access**
  (that file's #1); he is simply not working on this project.
- **`tb-priv-02` is a documented, tested gap** — sexuality speculation with no
  orientation token cannot be caught without also refusing "what is track five
  on Midnights really about?". Do not "fix" it with a regex pinned to the probe
  text; that overfits the probe, not the class.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap.**
  Deliberately NOT fixed — may be intentional. Joey's call.

## Merge authorization

**Joey is the ONLY merger** (2026-08-14), delegated to a session for the work it
produced. Standing and NOT spent: **max two review rounds**, never a third.
**Codex is OUT by his explicit ruling** — "use claude code review… then just stop
reminding me about it." This OVERRIDES Workflow rule 3; a `reviewer` agent is the
sanctioned substitute. **Do not re-raise the missing-Codex gap with him.**

## Autonomous decisions — review surface

- **Refused to delete the CC credits**; shipped the quiet version instead.
- **Sequenced multi-item work in WAVES**, not N parallel agents, whenever items
  share files. Read-only research runs concurrently; one writer per file.
- `auto-merge-content.yml` lands UI CODE PRs unattended, not just content.
  Correct per its own guard. **Flagged to Joey; his call.**

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. -->
- (none yet). A `reviewer` with `model: "fable"` is a MODEL OVERRIDE, NOT an
  architect escalation. Do not log those here.

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only, Clownbot keeps its tab. **NO Threads filter
  chip** — Joey reversed his own brief. Six filters forever: Music, Fashion,
  Tour, Relationship, Lore, Videos. **Six separate bottom-nav tabs**,
  device-confirmed; PR #2116's merge-to-five is closed, never re-raise it.
- Clownbot rulings J1–J7 (`docs/decisions.md`). Plans need no sign-off; no
  local-concurrency cap. Merge authority is human. Runners live on Wyatt's
  account. **No self-armed PR monitors, ever.**

## Known traps

**The durable lessons live in `docs/engineering-lessons.md` — read it before UI
or content-pipeline work.** Headlines only here: a green suite CANNOT prove a
click works (no component-render harness) · scrollable rows need
`[justify-content:safe_center]` · the vault writer can silently drop a new field
(twice now) · **diff a branch against `origin/main`, not local HEAD — a stale
base once deleted three files while all tests passed** · agents write into the
shared checkout by absolute path · never kill a process you did not start.

- **A passing suite is not evidence; EXECUTION against the real corpus is.**
- **`apps/web` IS NOT LINTED BY ANYTHING** — the root config ignores it, so
  typecheck and the suite are the only real gates.
- **`shop.ts`'s affiliate seam is DORMANT, not absent.** `isAffiliate()` returns
  false for every retailer. **Flip it and disclosure MUST render** — a one-file
  change silently carrying a compliance duty.
- **A SUM of heights is not a POSITION** (`measureChromeBottom()` vs
  `measureChromeHeight()`), and **`pointer-events` INHERITS**.
- **Two mechanisms for one fact is this repo's recurring defect.** Grep for other
  callers before declaring a fix done.
- **Reddit blocks this environment outright**; 15 of 30 communities carry
  `memberCount: null` BY DESIGN — never write 0.
- **Parallel sessions share this checkout.** Verify the branch before every
  commit. `core.autocrlf=true` makes files look modified with no content change
  — investigate, never revert.
- **Pre-existing failures, not yours:** `card-render.test.ts` (missing `satori`)
  and repo-wide typecheck (`apps/mobile`). Use
  `npm run typecheck --workspace=@swift2/web`.
- **Reader has NO URL routes** — `?item=`/`?lens=`/`?era=`/`?mode=` read ONCE on
  mount. **A 30-min recurring cron was RAISED, not built** — § Never babysit your
  own PR bans it; only if Joey reaffirms.

## Open threads

- [ ] **Marketplace research — BLOCKED on Joey creating API accounts**, his
      choice. Brief and signup steps in `HUMAN-ACTIONS.md` #4. **Ceiling:**
      per-video TikTok/IG counts for accounts you don't own are unobtainable and
      Etsy carries no review count. **The Shopify `/products/<handle>.json`
      technique proven in #2154 may cover more of this than assumed.**
- [ ] Theory doorways scatter rather than sitting beside the song they discuss;
      Joey accepted this. 3 appearance videos carry no topic tag, and
      folklore/evermore have no Tour content — both true of the world, not gaps.

## Next obvious step

1. **Wyatt restarts Karen** (prompt delivered). Then fix whichever schedule line
   in `runners.md` he confirms is wrong.
2. **Device-check the merch redesign on a real phone** — palette transition
   between tabs; chip rows scroll with the FIRST chip reachable at 360px; bulbs
   stop under `prefers-reduced-motion`.
3. **Triage the 8 OLDER open PRs** (#2135, #2114, #2104, #2101, #2100, #2067,
   #2066, #1961) — none from recent work, several stale. Raised with Joey; do
   not close another session's PR without his word.
4. **UNCONFIRMED lead:** Escape may not close the MomentDetail overlay. Seen
   while the browser tool was misbehaving — reproduce before filing.
5. Joey's hands: the credits ruling, the #2110 questions, the five ownerless
   decisions, `auto-merge-content`'s scope, the Turnstile keys
   (`HUMAN-ACTIONS.md` #8), and restarting his port-3000 dev server.
