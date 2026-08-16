# STATE.md

<!-- Read first, rewritten last. Hard cap 150 lines. Working memory, not a
     changelog — git holds history, docs/ holds the record. -->

## Current focus

**Joey's 12-item punch list (2026-08-15). 11 of 12 MERGED and on `main` green;
#6 is the last one and it is IN FLIGHT.** Sequenced in WAVES, not parallel:
items 7–12 all touch `MerchSection.tsx` / `CommunitySection.tsx` /
`SectionJumpBar.tsx`, so only one writer held a contended file at a time while
read-only research ran concurrently.

Merged: **#1** Eras filters centered (#2147) · **#2/#3** hero credit quieted,
gap tightened (#2151) · **#4** alignment fixed on ALL FIVE `NO_SCRUBBER_THREADS`
(#2151) · **#5** End Game beats open MomentDetail, 17/17 (#2148) · **#8** "We
found something similar" + inline `altNote` (#2150) · **#9/#10/#12** one-line
scrolling chip rows + `SuggestLinkBanner` (#2153) · **#11** Turnstile spam gate,
INERT until keys (#2149).

**#7 MERGED (#2154).** 156 products → **97 real product photos / 55 labelled
moment-photo fallback / 4 monogram** (62%). Independently checked: 97 `imageUrl`
in the seeds, 97 in the regenerated vault, all https, all `cdn.shopify.com` —
the host I proved loads cross-origin from `www.longlivets.com` at 1345×1820 (not
a placeholder). Shopify's open `/products/<handle>.json` is the source;
Amazon/Nordstrom/LV/Tiffany/SSENSE/Revolve/Skims/Fashion Nova/Showpo/
Reformation/Tecovas expose nothing equivalent and keep the labelled fallback.

**#6 MERGED (#2158) — ALL TWELVE ITEMS ARE DONE.** Joey approved my
recommendation: **Direction A "Signal Board" + Direction B's chapter standfirst
headings**. The fix was that the page already collected `onlineCount`,
`activityLevel`, `activityEvidence`, `checkedAt` and `hypeScore` and rendered
NONE of it — hence 30 identical rectangles. New `CommunityCard.tsx` (225 lines);
`CommunitySection.tsx` down to 120.

Two calls of mine inside it, both cheap to reverse if Joey dislikes them:
- **I authored the 8 platform standfirst lines** (he never supplied them). They
  are typed `Record<CommunityPlatform, string>`, so a new platform without copy
  is a COMPILE ERROR, not a blank heading. His to rewrite.
- **The featured card per group ranks by `hypeScore`, not `memberCount`** — so
  Discord features the official Discord (99k, score 9) above Taylor Swift Fan
  Club (144k, score 8). Curated quality over headcount; a one-line change.

**Hard constraint held, browser-verified: 15 of 30 entries have `memberCount:
null` BY DESIGN — em-dash in the same optical slot rendered 15 times, "0
members" ZERO times.** Never write 0 or an estimate here.

**#2141's two watchdog checks fire daily and Check 1 is EXPECTED to alarm** —
Karen has not run since 2026-08-09, so an alert means "still not enabled", NOT a
broken check. Both steps use `if: (!cancelled()) && (…'35 14 * * *')` so an
unrelated earlier failure cannot silently skip them — that was the exact bug the
Karen alarm repair fixed, so **never "simplify" them to a plain `if:`**. Both
self-close 2026-08-22 (`WINDOW_END`); removal = delete the two steps or the two
`scripts/watchdog/*-check.mjs` files.

## Blocking / outstanding — READ BEFORE STARTING ANYTHING

- **PR #2116 is CLOSED unmerged** — its depth work landed as #2146; its
  merge-Merch-into-Community half was superseded by #2140's threshold change.
  **Joey's ruling: SIX separate tabs, device-confirmed. Never re-raise the
  merge.**
- **CC BY / CC BY-SA credits were NOT deleted, deliberately.** Joey's items
  #2/#3 asked to "get rid of" the Michael Hicks and Sally-Marie Böhm photo
  credits. Visible attribution is a LICENCE CONDITION (`lenses.ts:44-58`,
  `ThreadsMode.tsx:298-301`, `docs/decisions.md` 2026-08-15), and no
  attributions page exists as a fallback. #2151 fixed the real complaint —
  10px, muted, no default underline, `mt-5`→`mt-1.5`, conditional header
  padding. **Full removal needs Joey's EXPLICIT call; it is a licence breach,
  not a style preference.** He was told and has not yet answered.
- **`Product` has no image field** — merch cards derive from the source
  MOMENT's photo (150/156) or a monogram tile (6). That is why Joey called the
  images "weird". A UI change cannot fix it; see § Current focus for the path.
- **#2110's three questions are still unanswered** (Joey deferred, merging did
  not resolve): Instagram + TikTok in or out; who owns refresh cadence as
  invites rotate; ratify/veto excluding `r/TravisAndTaylor`. See
  `HUMAN-ACTIONS.md` #7.
- **Wyatt's five formerly-owned items are unowned** — Clownbot model tier, the
  200/day cap, the Mood route pattern, signing the Clownbot decisions entry, and
  the bottom nav overriding the landing-page brief §3.2/D3. `HUMAN-ACTIONS.md`
  #5. **He retains account access** (see that file's #1) — he is simply not
  working on this project. #2144 removed him from alert pings.
- **`tb-priv-02` is a documented, tested gap** — sexuality speculation with no
  orientation token cannot be caught deterministically without also refusing
  "what is track five on Midnights really about?". Do not "fix" it with a regex
  pinned to the probe text; that overfits the probe, not the class.
- **Four overlays share the `z-50`-under-`z-[71]` FeedbackButton overlap**
  (`EraSelector`, `MomentDetail`, `TrackGuide`, `TheoryGuide`). Deliberately NOT
  fixed — floating feedback over a reading sheet may be intentional. Joey's call.

## Merge authorization

**Joey is the ONLY merger** (2026-08-14: "No one else should be merging on this
repo except you. Wyatt is no longer working on the project"), delegated to this
session for the work it produced. Standing and NOT spent: **max two review
rounds**, never a third.

**Codex is OUT, by Joey's explicit ruling** (2026-08-14): "we can ignore the
codex reviews. use claude code review. I know that you think that's not good,
but it's all we have right now. if that's already been done then just stop
reminding me about it." This OVERRIDES Workflow rule 3's `/codex:review`
requirement. A `reviewer` agent (optionally `model: "fable"`) is the sanctioned
substitute. **Do not re-raise the missing-Codex gap with him** — he has heard it
and ruled. Note it in a PR body if it matters; do not put it in chat again.

## Autonomous decisions — review surface

- Merged #2140 and #2141 myself under the delegated authority above, after
  verifying each diff (additive-only, guard idiom, self-limiting window).
- Did NOT strip `@wjduvall-cmd` from ownership-routing or bot-identity sites in
  the same PR as the notification sweep — those change behaviour, and runners
  execute on Wyatt's account. Split, with the risky half reported not guessed.
- `auto-merge-content.yml` is landing UI CODE PRs, not just content (#2140,
  #2147, #2148 went in unattended). Correct per its own guard, which only blocks
  server-executing and secret-reading files. **Flagged to Joey; his call.**
- **Refused to delete the CC credits** (#2/#3) and shipped the quiet version
  instead. Licence conditions are not mine to waive; told him plainly it needs
  his explicit ruling.
- Sequenced the 12-item punch list in WAVES rather than dispatching 12 agents,
  because items 7–12 share three files. Research agents ran read-only in
  parallel; only one writer per contended file at a time.
- Chose the approach for #12 rather than asking ("not sure how to address this,
  see if you can figure something out"): single-line scrolling strips with edge
  fade, not multi-row wrapping.
- **Called #5 broken, then corrected within the same turn.** The browser tool's
  coordinates are in screenshot px while the page is 2048 CSS px at dpr 1.25, so
  my clicks delivered zero events. See § Known traps — this is the second time a
  tooling artifact nearly became a bug report.

## Architect invocations

<!-- NEVER cleared. Budget <=2/week. -->

- (none yet). A `reviewer` with `model: "fable"` is a MODEL OVERRIDE, NOT an
  architect escalation. Do not log those here.

## Decisions that are settled

- Era reader: bottom nav (overrides D3), Spotify player removed, one global
  filter, anchor dates sort-only, Clownbot keeps its tab (`docs/decisions.md`
  2026-08-13). **Joey reversed his own brief once: there is NO Threads filter
  chip.** Six filters forever: Music, Fashion, Tour, Relationship, Lore, Videos.
- Clownbot rulings J1–J7, same file. Plans need no sign-off; no local-concurrency
  cap (2026-08-13). Merge authority is human. Runners live on Wyatt's account.
  No self-armed PR monitors, ever.

## Known traps

**Five lessons from 2026-08-15 now live in `docs/engineering-lessons.md`
§ "Lessons added 2026-08-15" — read it before UI or content-pipeline work.**
Headlines only, so this file stays working memory: scrollable rows need
`[justify-content:safe_center]` or the first chip is unreachable · **this repo
has NO component-render harness, so a green suite cannot prove a click works** ·
the vault writer can silently drop a new field (twice now) · Windows `import()`
needs `file://` · the in-session browser tool's click coordinates are in
screenshot px, not CSS px, and deliver zero events · never kill a process you
did not start.
- **A passing suite is not evidence; EXECUTION against the real corpus is.**
  Every genuine defect this week came from running the pipeline over live data,
  never from reading code — each time 2600+ green tests had made us confident
  and wrong, because fixtures used the easy case. Demand a reproduction.
- **`apps/web` IS NOT LINTED BY ANYTHING** (verified 2026-08-14): root
  `eslint.config.mjs` ignores `apps/web/**` (line 13), `apps/web/package.json`
  has no lint script, CI runs the root lint. **"lint clean" says nothing about
  any component or lib module there** — typecheck and the suite are the only
  real gates. Turning it on is its own task; bundling it into a feature PR makes
  the diff unreviewable.
- **Over-refusal and under-blocking pull in opposite directions in the Clownbot
  gates. Any change to one must be tested against both.** Round 1's fix bricked
  sessions: screening the bot's own refusal copy with input patterns meant one
  refusal permanently killed the conversation. Both directions now pinned.
- **`shop.ts`'s affiliate seam is DORMANT, not absent.** `isAffiliate()` returns
  false for every retailer, `SHOP_DISCLOSURE` never renders. **The moment anyone
  flips `isAffiliate`, disclosure MUST render** — a one-file change silently
  carrying a compliance duty.
- **A SUM of heights is not a POSITION.** Four fixes died here. Ask the DOM where
  an edge IS (`getBoundingClientRect().bottom`) and recompute on scroll;
  `measureChromeBottom()` vs `measureChromeHeight()` encodes the distinction.
- **`pointer-events` INHERITS — a `pointer-events-none` shell does not protect
  you.** Eleven `opacity-0` adornments were invisible AND hit-testable. **Verify
  a control with `elementFromPoint` and a real tap**, never by checking that its
  container moved — that mistake cost two review rounds.
- **Two mechanisms for one fact is this repo's recurring defect** — three times
  in one branch. Grep for other callers before declaring a fix done.
- **Reddit blocks this environment outright** (403, WebFetch refuses it) and
  published r/TaylorSwift counts span 200k–3.8M the same week — **aggregators
  are not a substitute.** 15 of 30 communities carry `memberCount: null` BY
  DESIGN; never write 0. Facebook is invisible outside a login; half of public
  Discord listings are wrong (verify via
  `discord.com/api/v10/invites/<code>?with_counts=true`).
- **Joey asked for a 30-min recurring cron to "keep you going" (2026-08-14).
  RAISED, not built** — it is what § Never babysit your own PR bans, and it
  would not have fixed the stalls (background agents already re-invoke on
  completion). He then said "stand down and turn off anything automated".
  **Build it only if he reaffirms explicitly.** Never build it silently.
- **Parallel sessions share this checkout** — `STATE.md`/`PLAN.md` collided twice
  on 2026-08-14. Verify the branch right before every commit.
- **Pre-existing failures, not yours:** `scripts/social/lib/card-render.test.ts`
  (missing `satori`) and repo-wide `npm run typecheck` (`apps/mobile`). Use
  `npm run typecheck --workspace=@swift2/web`. `npm run lint` may show ~630
  errors from a `.scratch/` worktree — add `--ignore-pattern ".scratch/**"`.
- `apps/web/next-env.d.ts` is regenerated by any dev server — leave it
  uncommitted, never `git restore` it. `post-queue.mjs` + `delete-media.mjs` hit
  LIVE accounts and `guard.sh` denies them. `core.autocrlf=true`.
  `.claude/worktrees/` holds ~30 worktrees — never clean.
- **Codex review path:** `codex:rescue` skill → `codex:codex-rescue` subagent,
  always `--background`, then poll `codex-companion.mjs result <job-id>`.
- **Reader has no URL routes** — one client page, React context; `?item=`,
  `?lens=`, `?era=` read ONCE on mount, never written back.

## Open threads

- [ ] **Marketplace research — BLOCKED on Joey creating API accounts, his
      choice.** Full brief and exact signup steps in `HUMAN-ACTIONS.md` #4.
      Every hype source is unreachable from here (Etsy/Redbubble/TeePublic 403,
      Reddit refused at tool level, TikTok an empty shell) — agents pointed at
      them would invent numbers. **Permanent ceiling:** per-video TikTok/IG
      counts for accounts you don't own are unobtainable on any legitimate path;
      Etsy carries no review count. Scope `hype_evidence` to Reddit score +
      comments + press. Must feed the EXISTING Merch surface, not a parallel
      dataset. **Note: the Shopify `/products/<handle>.json` technique proven in
      #2154 may cover more of this brief than originally assumed.**
- [ ] 3 appearance videos carry no topic tag — their own records support none.
- [ ] folklore and evermore have no Tour content. True of the world, not a gap.
- [ ] Theory doorways scatter rather than sitting beside the song they discuss.
      Joey accepted this 2026-08-13; an authored `anchorHint` is the fix if it
      ever matters.

## Next obvious step

1. **Device-check the punch list on a real phone.** Twelve items shipped today
   across the Eras, Threads, Merch and Community surfaces. Highest-value checks:
   chip rows scroll and the FIRST chip is reachable at 360px; the suggest-a-link
   banner reads as an invitation; merch product photos load; the "Her look, not
   the product" label appears on fallback cards.
3. **Triage the 8 OLDER open PRs** (#2135, #2114, #2104, #2101, #2100, #2067,
   #2066, #1961) — none are from today's work, several look stale, and per
   § Never babysit your own PR nothing will come back for them. Raised with
   Joey; do not close another session's PR without his word.
4. **Await tomorrow's watchdog run** — Check 1 should alarm (Karen still not
   enabled); Check 2 reports the first post-rotation news-worker run. Neither
   needs a session babysitting it; read the alert when it lands.
5. **UNCONFIRMED, worth a look:** Escape appeared not to close the MomentDetail
   overlay during testing. Observed while the browser tool was misbehaving, so
   treat as a lead, NOT a finding — reproduce before filing.
6. Joey's hands, not mine: the credits ruling (§ Blocking), the three #2110
   questions, the five decisions that lost their owner, whether
   `auto-merge-content` should stop auto-landing UI code, the Turnstile keys
   (`HUMAN-ACTIONS.md` #8), and **restarting his port-3000 dev server** — an
   agent killed it with a stale PID (see `docs/engineering-lessons.md`).
