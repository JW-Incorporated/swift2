# Long Live — growth strategy

**Owner of record: Marjorie's weekly Fable review** (rewrites this file every Sunday, by PR, lands on green CI).
**The owner steers it by talking to Marjorie in `#longlive-marjorie`** — see `## Owner direction (standing)`.
It sits below `docs/social/guardrails.md` (founder-owned; nothing here can override it) and above every weekly plan.
Last rewritten 2026-10-01 (weekly review, superseding the same-day first version). `(assumption)` marks anything not yet backed by data.

## Summary

- **Who we serve:** devoted Taylor Swift fans who want news they can trust (sourced, fake stories flagged) and a way to time-travel through her eras — people who argue about details and share what is true.
- **The core bet:** social drives to the site. We post one genuinely shareable thing every day where fans already are (Instagram and X, paired), take part in fan communities as real members, and give fans a card they want to post themselves; the site is where they land.
- **Where we are (week ending 2026-10-01):** not growing. 37 visitors this week (34 the week before), Instagram 4 followers, X 0, and zero posts shipped — nine days of stuck drafts, plus 6 of the owner's last 10 verdicts were rejections, every one for a re-used photo. The machine was rebuilt this week: approvals are now one message per post, the usable photo pool went from 10 to 44, and drafting resumed 2026-10-01 with two campaign pairs now awaiting the owner's ✅. Unproven until posts are live.
- **Order of work:** (1) posts ship daily again, (2) a bigger photo library, (3) start the reach lane, (4) cover time-sensitive fan moments, (5) share cards as a loop. Growth is priority #1.
- **Money:** later. The fashion section is the long-term revenue lever once traffic is meaningful; we revisit it at a sustained ~2,000 visitors a week (assumption) and only after the owner's counsel sign-off.
- **This quarter's target metric:** weekly unique visitors, from 37 now to 500 by 2026-12-31 (assumption — confirmed or replaced each week). Leading indicator: Instagram followers 150 by 2026-10-31 (a stretch from today's 4 — it dies or moves next Sunday if the reach lane still has not started), 500 by 2026-12-31.

## Audience

- **Who:** Swifties of every age who follow Taylor closely enough to care whether a rumour is true: era loyalists, theory-and-easter-egg readers, fashion followers, and fans who want to see what happened in a given month of an era.
- **What they come for:** the latest news, verified (the "recent news" half of `docs/vision.md`); the time-travel by era (the other half); fashion ("shop the look"); something worth sharing.
- **Where they are:** Instagram, X, TikTok, Reddit (r/TaylorSwift and adjacent), Tumblr, Facebook groups (`docs/marketing/growth-plan.md` §1). Reddit and Tumblr punish promotion: 20 to 30 genuine zero-link contributions come before any promo post.
- **What we do not know (assumption):** their age mix, how many are app-first versus web, and which format earns shares. Instagram reach/saves/shares per post now arrive automatically (the weekly scorecard works as of 2026-10-01); which campaign sends site visits is still unmeasurable — see bet 1.
- **Traffic reality:** nearly every visit is "direct" and almost half of this week's pageviews were the privacy page (23 of 49), which looks like automated or app-review traffic, not fans. No channel is sending anyone yet.

## How we grow (bets, ranked, each with the metric that proves/kills it)

1. **Daily paired posts on Instagram and X (Tree drafts, the owner's ✅ posts them).** Distribution is the engine and it produced zero this week.
   - Proves it: at least 5 posts live per week for two straight weeks, and social-tagged visits appear in `social.byCampaign`.
   - Kills or reshapes it: 14 days of daily posting with fewer than 5 social-sourced visits a week means the format is wrong, not the cadence — change formats before posting more.
   - Now: approvals are per-post ([#4660](https://github.com/JW-Incorporated/swift2/pull/4660)), drafting is unstuck with a same-day news lane ([#4671](https://github.com/JW-Incorporated/swift2/pull/4671)), and the first new drafts reached the queue 2026-10-01 ([#4704](https://github.com/JW-Incorporated/swift2/pull/4704)); the last engine fix is the poster exit path ([#4475](https://github.com/JW-Incorporated/swift2/issues/4475)). The proof metric itself is broken — per-campaign site visits return HTTP 402 from Vercel's API (paid tier); a no-spend fix is filed ([#4719](https://github.com/JW-Incorporated/swift2/issues/4719)).
2. **The reach lane: comments, follows, and Reddit/Facebook-group participation (the owner's ~15 minutes a week, Tree writes every word).** Near-zero traction is a symptom of this engine never running.
   - Proves it: Reddit non-promo contributions reach 20; Instagram followers reach 150 by 2026-10-31.
   - Kills or reshapes it: three weeks of the lane running with no follower or referrer movement means the communities or the angle are wrong — switch communities, do not add effort.
   - Now: waiting on the owner to start it ([#4602](https://github.com/JW-Incorporated/swift2/issues/4602)); Tree's copy-paste Reddit replies are ready ([#4663](https://github.com/JW-Incorporated/swift2/pull/4663)).
3. **Share cards: fans do the distribution.** "Share as image" on an era or moment and the personal "My Eras" card (W9, `/api/share-card`, [#4668](https://github.com/JW-Incorporated/swift2/pull/4668)); Tree may also post them as a sanctioned image kind.
   - Proves it: card-originated visits and logged shares rising week over week once the traffic exists (assumption: any measurable share in the first month is a win at this size).
   - Kills it: four weeks with zero logged shares — stop promoting cards and fold the effort into bet 4.
4. **First and right on time-sensitive fan moments.** Fans come back daily to the place that covered the thing everyone is arguing about, accurately and within hours. The 2-hour news-drafting lane ([#4671](https://github.com/JW-Incorporated/swift2/pull/4671)) and Tree's new reserved news slots ([#4678](https://github.com/JW-Incorporated/swift2/pull/4678)) are built for it.
   - Proves it: time-sensitive events covered on the site within 48 hours (12 of 27 shipped this week) and on social within 2 hours (0 of 27); the standing "Patient Zero" test.
   - Kills or reshapes it: news posts that draw less approval and engagement than evergreen ones for three weeks running.
5. **App-store launch week (later; gated).** A realistic bump is +200 to +500 Instagram followers in 7 days, but only on a base of 150 or more (`docs/marketing/social-strategy.md` §3). Not started until bet 1 and 2 have built that base.
   - Proves it: a 7-day follower jump of that size. Kills it: launching on a sub-100 base — postpone instead.

Not a growth bet yet: **fashion monetisation.** There is nothing to monetise at 37 visitors a week; "shop the look" and the dead-link cleanup ([#4643](https://github.com/JW-Incorporated/swift2/pull/4643)) protect trust until traffic exists. Affiliate work stays held for counsel sign-off (HUMAN-ACTIONS #27).

## Content strategy

- **The craft is already top tier:** sourced to several outlets, honest about what could not be verified, balanced (the lukewarm critical reception sits beside the streaming records), and rumours are re-dated rather than quietly deleted. That honesty is the brand; never trade it for speed.
- **What is missing is the conversation fans actually have:** the "Patient Zero" cover-art backlash was the week's biggest fan debate and the site said nothing. Every time-sensitive event gets covered or declined with a written reason ([#4673](https://github.com/JW-Incorporated/swift2/issues/4673)).
- **Photos first.** Real Taylor photography is the default image ("the Taylor-photo standard"); a photo that has ever shipped is rejected, so a deep library of never-used photos is the scarce resource. Growing it, credited or not, is a standing owner priority (credit the photographer whenever known; unknown credits no longer block a post — carried into the gates by [#4706](https://github.com/JW-Incorporated/swift2/pull/4706)). The usable pool is 44 after this week's additions ([#4628](https://github.com/JW-Incorporated/swift2/pull/4628), [#4672](https://github.com/JW-Incorporated/swift2/pull/4672)); the import of sourced concert photos ([#4598](https://github.com/JW-Incorporated/swift2/pull/4598)) and the non-Taylor cleanup ([#4707](https://github.com/JW-Incorporated/swift2/issues/4707)) keep it growing honestly. Cards and site screens are secondary image kinds Tree may use by evidence.
- **Campaign rhythm (Tree owns the calendar):** thread of the month (all six threads), the weekly Blank Spaces timeline (confirmed-only), the monthly Mood beat, the daily heartbeat, and the same-day news beat ([#4678](https://github.com/JW-Incorporated/swift2/pull/4678)). One idea goes to Instagram and X together.
- **Hard limits that never move without the owner:** `docs/social/guardrails.md` (✅ before anything posts, rights, no AI images of Taylor, confirmed-only sensitive topics, platform limits, replies and DMs human for now).

## What we stopped and why

- **2026-08-11 — Generic era-art tiles as the Instagram image:** a 2026-08-11 audit found every image was one; real photos are the standard now.
- **2026-08-11 — "Did you know…" openers:** 12 of 14 posts opened that way; the opener is banned and openers are checked in code.
- **2026-08-11 — Planning Reels/Stories slots:** the pipeline posts a single image plus text, so those slots could never ship; none are planned.
- **2026-07-17 — Embedded Instagram/Facebook feeds on the site:** heavy third-party code that looks stale the moment posting slows; footer links only.
- **2026-10-01 — The owner writing social taste rules:** he reviews and approves; Tree and Marjorie decide, Fable rules disputes.
- **2026-10-01 — Paid X API metrics:** declined (spend needs the owner).
- **2026-10-01 — Chasing real names for uncredited photos:** the owner ruled uncredited photos fine; the effort goes into more photos, not better credits.

## Owner direction (standing)

*Steer, challenge or ask in `#longlive-marjorie`: Marjorie restates your direction in one line, records it here word for word with the date (it lands without waiting for anyone), and has Fable rewrite whatever it changes the same day. Every rewrite must honour every line below; they outrank everything above except `docs/social/guardrails.md`.*
- **2026-09-30** — "you manage the business; the goal is to grow the site by giving fans real value; growth is priority #1; long term the money comes from the fashion section once traffic is significant."
- **2026-10-01** — "I don't want to be in the rule making business, I want to be in the reviewing/approving business."
- **2026-10-01** — "I still have no idea what Marjorie's strategy is to grow the site, and get more users. It's just not clear. We now ask weekly with Fable how we're going to manage the site and grow it, but I don't get to see that strategy, nor do I know where I can challenge the strategy. I assume I can just talk in Marjorie's channel in order to challenge the strategy, ask questions, and steer it?"
- **2026-10-01** — Uncredited photos are fine; credit the photographer whenever known; growing the photo library is a priority.


## Changelog

- 2026-10-01 — First version, written from `docs/vision.md`, the growth plan, the social strategy, the plan for the week of 2026-10-05 ([#4674](https://github.com/JW-Incorporated/swift2/issues/4674)) and the owner's directions; why: the owner could not see the strategy or where to challenge it.
- 2026-10-01 — Weekly-review rewrite the same day: refreshed "where we are" with the owner's rejection data (6 of 10 verdicts, all photo re-use) and the resumed drafting ([#4704](https://github.com/JW-Incorporated/swift2/pull/4704)) — why: the morning version predated the restart.
- 2026-10-01 — Bet 1 now names its measurement gap: per-campaign site visits cannot be collected on the current Vercel plan (HTTP 402), no-spend fix filed as [#4719](https://github.com/JW-Incorporated/swift2/issues/4719) — why: a bet whose proof metric cannot be read can never be judged.
- 2026-10-01 — Photo work redirected from credits to volume, and "chasing real names for uncredited photos" added to What we stopped — why: the owner's 2026-10-01 ruling (guardrails row 2) made the credit chase obsolete.
- 2026-10-01 — Instagram target kept at 150 by 2026-10-31 but flagged as a stretch from a base of 4, with a named decision point next Sunday — why: the prior 50-by-09-30 milestone was missed with the posting engine down; one week of the rebuilt engine decides whether the date moves.
