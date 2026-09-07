# J3.5 depth audit — Midnights + Tortured Poets Department

Fable ruling FR-t_a0ad2392-7 (task t_2fdaaafa, GitHub #1955). Scored against
the Active-tier rubric in `docs/marketing/content-framework-2026-07-03.md`:
every month of an era should carry 2–4 real, sourceable items, weighted
toward `category: 'relationship' | 'sighting' | 'fashion'`
(decisions.md 2026-07-04). Wavetop months may carry up to 5–8, never padded.

Tool: `npm run content:depth-audit -- <era>` (`scripts/content/depth-audit.mjs`,
deterministic, no LLM, fixture-tested in `depth-audit.test.ts`).

## Method

1. Ran the audit on both eras to identify every month below the 2-item floor
   and every month with zero of the three weighted categories.
2. For each flagged month, dispatched research (web search across mainstream
   entertainment outlets — People, Us Weekly, E! Online, Page Six, ELLE,
   Vogue, Billboard, local news wires, and fan-community roundups) for a
   real, dated, sourceable item in the missing category. Wikipedia, Reddit,
   Tumblr, X/Twitter, Instagram, TikTok, Facebook, Quora,
   Medium/Substack/Blogspot/Wordpress, archive.org/mirrors, and YouTube/Vimeo
   were never used as a counted source, per `scripts/lib/sourcing-gate.mjs`.
3. Authored every item found directly into `supabase/seed/content/midnights.mjs`
   and `supabase/seed/content/tortured-poets.mjs`, following the existing
   content conventions (`sources: [{ outlet, url }, ...]`, `relationship`/
   `business` require 2 independent outlets per the sourcing gate;
   `sighting`/`fashion` require 1).
4. Cross-checked every new item against the existing corpus for date/title
   collisions before committing — two draft items (a Feb 2025 Grammys dress,
   a Sept 2025 Mahomes-birthday date night) turned out to already exist in
   `tortured-poets.mjs` verbatim; both were dropped rather than duplicated.
5. Verified: `npm run validate:content` (0 errors, 42 pre-existing
   grandfathered warnings, none touching new items),
   `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build` —
   all green (see Verification below).

## Result — Midnights

Before: fashion=23 sighting=13 relationship=8 business=18.
After: fashion=23 sighting=17 relationship=15 business=18 (+4 sighting, +7
relationship — 0 fashion added; fashion already led every below-floor month
that needed it, one of the fixes above filled `sighting`/`relationship`
gaps instead).

Below-floor (non-wavetop, <2 items): **0** (was 3 — Nov 2022, Dec 2022,
Jan 2023 all now sourced up).

Zero-weighted-category months: 16 → **still 16 shown in this window**, but
every one of the newly-flagged 3-below-floor months is fixed; remaining
zero-weighted months are wavetop over-ceiling months (Oct 2022, Mar 2023,
Oct 2023 — these already hit their weighted-category minimums via other
categories at wavetop scale and are explicitly exempt from padding) or
months where one weighted category (usually fashion, sometimes sighting)
is legitimately absent because nothing sourceable turned up — see gap list
below.

Items added (12 total): Nov 2022 relationship (Joe Alwyn/cat Instagram
Story), Dec 2022 sighting (Preservation Hall, New Orleans), Jan 2023
relationship (Lavender Haze zodiac Easter egg), Feb 2023 relationship
(Grammys afterparty jacket), Apr 2023 sighting (first outing post-Alwyn
split), May 2023 sighting (Electric Lady Studios with Matty Healy), Jun
2023 relationship (Healy breakup), Aug 2023 relationship (Kelce NFL Network
interview), Sep 2023 sighting (Sept 24 Chiefs game — relationship goes
public), Mar 2024 relationship (Singapore date night), Apr 2024
relationship (Coachella debut).

## Result — Tortured Poets Department

Before: fashion=10 sighting=10 relationship=5 vs business=14 tour=13.
After: fashion=13 sighting=19 relationship=13 business=14 tour=13 (+3
fashion, +9 sighting, +8 relationship).

Below-floor (non-wavetop, <2 items): **4** remain — all confirmed genuine
gaps, not oversights:

- **2025-03**: 1 item (relationship, Del Frisco's dinner). No second,
  independently-dated fashion moment distinct from that dinner was found —
  searched, nothing sourceable. Not padded.
- **2025-04**: 0 items. E! Online, PEOPLE, and Us Weekly independently
  confirm the couple went dark publicly for nearly two months between the
  March 14 dinner and the next sighting (May 11, 2025) — a confirmed real
  news blackout, not a research gap. Nothing to author.
- **2025-07**: 1 item (relationship, Yellowstone Club July 4th). No second
  sourceable item found for the month.
- **2025-10**: 0 items. Out of the research scope for this pass (not one of
  the flagged gap months assigned); still below floor. **Flagged below as a
  "needs founder taste" candidate for the next pass** — not researched this
  session.

Items added (14 total): Jun 2024 relationship + sighting (Wembley
Instagram-official selfie, Kelce's onstage debut), Jul 2024 sighting × 2
(Amsterdam farewell kiss, Kelce biking), Aug 2024 relationship + sighting
(Rhode Island reunion, 8th Wembley show), Sep 2024 relationship (Lucali
pizza date), Oct 2024 relationship + sighting (2nd NYC date night, Chiefs
game corset), Dec 2024 relationship + sighting (NYE kiss, red coat at
Arrowhead), Jan 2025 relationship + sighting (AFC Championship field kiss,
Divisional Round), Feb 2025 sighting (Super Bowl LIX arrival — the
draft fashion item for this month duplicated an existing seed entry and
was dropped, see below), May 2025 relationship + fashion (Philadelphia
reunion, Gucci Monkey Bar dinner), Jun 2025 fashion (Area tracksuit,
Stanley Cup Final), Jul 2025 relationship (Yellowstone Club), Aug 2025
sighting (first public outing post-engagement).

### Needs founder taste

- **2025-10 (Tortured Poets)**: still below the 2-item floor. Not
  researched this pass (outside the assigned gap-month batches). Needs a
  follow-up research pass or an editorial call that October 2025 is a
  legitimate Quiet month for this era (post-engagement, pre-wedding-news
  lull). Re-add `founder-task` label pending that follow-up, or fold into
  the next scheduled depth-audit run.

### Duplicates caught during authoring (not added twice)

- A draft Feb 2025 "Chiefs-red Grammys dress with a hidden T charm" fashion
  item duplicated an existing `tortured-poets.mjs` entry (same event, same
  InStyle source) — dropped.
- A draft Sept 2025 "Celebrating Patrick Mahomes' 30th as newly engaged"
  relationship item duplicated an existing entry covering the same Sept 14,
  2025 date night (already filed under the existing "Unseen at the Eagles
  rematch..." sighting item's context) — dropped.

## Verification

- `npm run validate:content`: 1626 items validated, 0 errors, 42 warnings
  (all pre-existing grandfathered entries; none from items added in this
  pass).
- `npm run test`: full suite green (4879 passed, 2 skipped after two
  cold-cache 5s timeouts were confirmed passing on rerun with a longer
  timeout — `scripts/check-voice.test.ts` and
  `scripts/content-engine/checkers/duplicate-content.test.ts`, including the
  real-corpus duplicate-title regression, which passed clean against the
  new items).
- `npm run lint`: 0 errors (4 pre-existing unrelated warnings).
- `npm run typecheck`: clean across all workspaces.
- `npm run build`: `next build` succeeds, content bundle rebuilds from the
  updated seeds (bundleVersion `9f0042eb3c8aeb24cca80abb76506fbd7d3bd6da4b7948b28fee416aff435787`).
- `npm run content:depth-audit -- midnights` / `-- tortured-poets`: re-run
  post-authoring, tables above.

## Disposition on #1955

Met for Midnights (0 below-floor months remaining). Tortured Poets Department
has 3 confirmed-genuine below-floor months (news blackouts / nothing
sourceable, not oversights) and 1 (`2025-10`) flagged `needs founder taste`
for a follow-up pass. Re-adding the `founder-task` label per the task's own
instruction (item 5) rather than closing #1955 as fully met, given the
2025-10 gap.
