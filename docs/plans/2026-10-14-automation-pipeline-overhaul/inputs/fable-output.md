# Fable's full output (architect agent, high effort), 2026-10-14
Two parts: the main audit report, then the addendum (tie-back to the dashboard). Reproduced from the agent's replies. Caveats added later by the orchestrator, from subsequent research (see planning-brief.md section 4 and the research-*.md files): Fable claimed the theory crawl ships OFF (it has been enabled since Sep 22 but runs RSS-only and 429-throttled); that a media gate is absent (one exists in validate:content); that a relay is plausible (HOME_RELAY_URL is unset and no relay exists for Swift2); the "0 of 27 events on social within 2h" and "12 of 27 on site within 48h" figures (current growth-strategy text says 12 of 21 within 48h, 1 of 21 on social within hours); and the wrong claim that dash.src.html line 375 would crash (withdrawn in the addendum). Treat Fable's recommendations as strong input, not as ground truth; verify claims against the research files.

---

# PART 1. Main audit report

The brief asks for a full audit deliverable rather than the usual ~60-line call, so this answer follows the brief. Every number comes from the scratchpad evidence files or files cited; anything I could not confirm on disk is marked UNVERIFIED.

## 1. Executive verdict (where we are vs the 11 metrics)

| # | Metric | Status | Biggest gap | Confidence |
|---|---|---|---|---|
| 1 | Critical news live in 1h + social + push | Off track | No breaking lane exists. Fastest path is news-worker (4-hourly, .github/workflows/news-worker.yml) to current_item (ISR 15 min); the Vault path is one daily Opus session at 16:07 UTC. Social: 0 of 27 time-sensitive events reached social within 2h (docs/strategy/growth-strategy.md bet 4). No "critical" definition anywhere; push producer for T1 events UNVERIFIED. | High |
| 2 | Never miss news | Not measured | 12 of 27 events on site within 48h (growth-strategy bet 4). The recall check was retired 2026-09-10 (news-worker.yml header). No ground-truth list. | High |
| 3 | Largest clowning database | Off track | ~74 hand-authored theory records in supabase/seed/theories/*.mjs (grep count). The fan corpus crawl ships OFF (COMMUNITY_CRAWL_ENABLED default false, docs/community/README.md §4.2), so theory-miner/theory-promote have had nothing to mine. | High |
| 4 | No text-only content | Partly there | 775 of 784 moments declare a photos: array (grep), but nothing blocks an empty array or a photoless new item at CI; photo-sparsity.mjs only files P2 tickets for marquee pages. The feed has a designed no-photo "text" tier (docs/longlive-experience.md §7). | Medium |
| 5 | New site content prioritized on social | Off track | Social output was 0 PRs in the week of Oct 12 (base.json weeks); followers X 0 / IG 4 / FB 10 on 2026-10-04 (social/metrics/2026-10-04.json). There is no "new on site this week" input to Tree's calendar. | High |
| 6 | Swifty voice with opinion and clowning | Partly there | The blocking gate (scripts/check-voice.mjs) only checks surname overuse and six AI-tell phrases. No exemplar corpus, no critique loop, no score. | High |
| 7 | Active posting on Reddit/Facebook | Partly there | Pipeline delivers cards to Discord; the owner posts by hand (docs/community/README.md §1). Volume depends on the owner's time (10 to 15 min/day). | High |
| 8 | Reddit upvotes measured | Not measured | No script reads scores on our comments (grep in scripts/community: only candidate scoring). Reddit blocks GitHub IPs (403). | High |
| 9 | Replies on Reddit/FB tracked | Partly measured | Reddit replies arrive as reply_to_us leads via Gmail (community-inbox.yml); IG/FB Page comments via social-reply-notifier.yml. FB group replies: nothing. Nothing is on a dashboard. | High |
| 10 | Fan merch found automatically | Partly there | merch-fanmade.yml files candidate issues daily (zero-LLM). Curation into supabase/seed/merch/fanmade.mjs is a judged lane I could not find scheduled: UNVERIFIED. | Medium |
| 11 | 3 affiliate merch matches/week | Off track | E6 step 4 (writing products onto moments) "is not yet implemented by any script" (docs/SPEC.merch-autonomy.md §8). Affiliate env vars are unset in Vercel (docs/decisions.md 2026-10-04). Counsel signed off 2026-08-30. | High |

## 2. Content-source and site-area map

Source to pipeline to surface (all paths repo-relative, C:\Users\Fourtys\Documents\Claude\Projects\swift2\):

| Source | Pipeline | Store | App surface |
|---|---|---|---|
| News outlets (RSS, Google News, GNews, Bluesky, Tumblr, Reddit RSS, site-diff, GDELT) | apps/worker/src/pipeline/run-cycle.ts via news-worker.yml every 4h; Haiku extract apps/worker/src/extract/* | news_raw_item, news_story, current_item, fan_signal, live_theory | Current era "Live" cards (components/longlive/CurrentItemCard.tsx), Clownbot board, Clue Web |
| Same news, as a digest | scripts/news/emit-candidate-digest.mjs to news-digest branch; routine-news-triage.yml daily 15:40 (Sonnet) files intake issues | GitHub issues | feeds Vault Run lane 1 |
| YouTube channel RSS | appearance-discovery.yml 13:40/21:40, zero-LLM | intake issues + staged social drafts | Videos filter, moments |
| Owner drops, "Help us verify", submit-link form | apps/web/app/api/intake/route.ts, api/submit-link/route.ts | intake issues | Vault |
| Intake issues | routine-vault-run.yml 16:07 UTC, Opus 4.8, 200 turns, 6 lanes (docs/agents/runner-prompts/vault-lanes/) | supabase/seed/content/<era>.mjs, videos/, theories/, lenses/, tracks/, song-moods/, era-secrets/, clownbot-lore/ | Era feed, moment detail, Track guide, Mood, Theories & eggs, Threads/Clue Web/Crossings, era secrets, Clownbot lore |
| Seeds | scripts/sync-longlive-content.mjs, build-content-bundle.mjs, content-publish.yml on push to main | content bundle in Supabase Storage | web build + mobile OTA (docs/architecture.md "one bundle, two renderers") |
| Official store pages | merch-official-sync.yml (E4) | supabase/seed/merch/official.mjs + store-drop social draft | MerchSection.tsx |
| Etsy, Reddit, submissions | merch-fanmade.yml (E5) | candidate issues, then merch/fanmade.mjs | MerchSection |
| Awin feeds | merch-awin-sync.yml (E0; 1.42M products indexed 10-06 per STATE.md) | Actions cache index, docs/ops/AFFILIATE-COVERAGE.md | shop links (affiliate seam, tags unset) |
| Reddit RSS, Gmail, weekly FB export | community-scan.yml, community-awareness-scan.yml, community-inbox.yml, scripts/knowledge/fb-export-* | engagement_lead | not an app surface: Discord cards, owner posts |
| Reddit year-deep crawl (OFF) | community-crawl.yml to theory-miner.yml (Haiku) to theory-promote.yml to theory-weaving-intake.yml | fan_theory_candidate, live_theory | Clownbot "What we're clowning on", Clue Web, intake to Vault |
| Wikimedia, official video frames, site photos | concert-photo-sourcing.yml, scripts/social/import-photo-library.mjs (LFS) | social/photo-library.json | Tree's posts only |
| Tree | routine-tree-weekly-plan.yml, routine-tree-daily-draft.yml, routine-tree-event-draft.yml (dispatched by social-event-dispatch.yml every 2h) | social/queue/*.json | X, Instagram, Facebook Page via social-poster.yml |
| Notification events | apps/web/app/api/notifications/dispatch/route.ts, Vercel cron every 15 min (docs/AUTOMATION.md Tier 3) | devices, inbox | push + in-app inbox; event producers for T1 categories UNVERIFIED |

Every app surface (from docs/longlive-experience.md §7 and apps/web/components/longlive/): the front door masthead; Era stream with per-era hero, lyric, TrackGuideBar, moment grid, pivot strip, Live cards for the current era; Timeline scrubber; Moment detail (video, photos, rumor banner, sources); Track guide and song dossiers; Theories & eggs (TheoryGuide, LiveTheoryCard); Threads gallery/detail, Clue Web, Crossings; Mood chat; Clownbot chat + board; Merch section; Community section (CommunitySection.tsx, content UNVERIFIED); Era secrets, countdown banner, search overlay, share cards (/api/share-card); notification settings and inbox; feedback, submit-link; support/privacy/terms; the mobile app renders the same screens plus native About/Diagnostics (commit 0ffaf4390). Routes: apps/web/app/page.tsx plus privacy, support, terms, settings/notifications, internal/notifications.

## 3. Root causes beyond the seven findings

Where I agree, with corrections.
- Finding 1 (weekly limit) is real and the top blocker this week, but the evidence also shows the limit is a symptom of pool design: 27 routines draw on one CLAUDE_CODE_OAUTH_TOKEN and the code itself says "the actual constraint remains Joey's plan rate limit, not money" (scripts/routine-usage-report.mjs:11). There is no named alert: grep for "weekly limit" in .github/ returns nothing.
- Finding 2 (thin output) misattributes. Output is thin by design cap before any budget problem: Content Shift is capped at 3 items/run (vault-lanes/1-content-shift.md), Photo Enrichment at 10 pages, one session per day, and news-worker.yml's header says authoring "is the real throughput ceiling". A fully funded Vault Run still yields at most ~3 new moments/day.
- Finding 3 (feeders) is stale as a 30-day average: appearance-discovery and Awin sync were fixed 2026-10-06 (STATE.md 08:18 and 13:16 entries). Appearance-discovery failed again on 10-15 ("channel failures", metrics-summary.json failureLogs), so it is still flaky, but the dashboard should show post-fix 7-day reliability, not the blended number.
- Finding 6 (bot clock) is not a cost finding: this repo is public, so Actions minutes are not billed (.github/workflows/social-reply-notifier.yml header, line 28). The "share of compute" KPI is a noise metric, not a dollar one. Keep the fix for noise, drop the cost framing.

Causes the seven findings miss.
1. Latency is architectural. News to site via Vault: poll (4h) + triage (daily 15:40) + Vault (daily 16:07) + CI/auto-merge (median 14 min, base.json) = 24 to 48h. Via current_item: up to 4h poll + extract + 15 min ISR, and news-worker itself failed on `tsx src/index.ts` on 9-22 and 10-05 (failure logs). Social: 2h dispatch + Tree draft + owner approval + poster. None of this is designed for a 60-minute SLA.
2. Single-session, serial lanes with one PR. vault-run.md runs six lanes in one 200-turn session and the plan's own risk note says "session length is the real constraint". Oct 9 and Oct 11 shipped only Photo Enrichment (+18, +5 lines, vault-prs.json).
3. The owner is on the critical path four times: social approval (guardrail 1), every Reddit/FB reply (guardrail 6, community README), the weekly FB export on a Sunday-night PC (docs/AUTOMATION.md), and device checks HA #100/#101 blocking the store build (HUMAN-ACTIONS.md). Tree self-approval for IG/X (#5479) is a Hermes-side change I could not find in this repo: UNVERIFIED.
4. The theory engine is switched off and even when on, the promotion bar is mention_count >= 3 and the weaving bar >= 8 (docs/AUTOMATION.md community rows), tuned for caution, not for "largest database".
5. Gates that rot. check-voice.mjs documents the lesson: "a cadence is not a gate". Media completeness, voice quality beyond naming, and news recall are all cadence-based or absent.
6. Measurement gaps hide everything above: social/metrics/ stops at 2026-10-04 (last file in the folder; cause UNVERIFIED), no per-lane yield, no current_item counts, no news-event timestamps, no community outcomes.
7. Monetization is not wired: the affiliate seam exists, counsel is cleared, tags are unset (docs/decisions.md 2026-10-04), and the E6 writer is unbuilt.

Dashboard bug to fix first (WITHDRAWN in the addendum): see Part 2.

## 4. Design per metric

### (a) Metric 1: critical news, 60-minute SLA

Definition process (written policy, docs/content-ops/critical-news.md, owner-approved once): Critical = T1 in NOTIFICATIONS_SPEC.md §4 (song_drop, album_news, tour_news) plus an official statement from Taylor or her team, plus a confirmed major personal-life event under the guardrail 4 carve-out (docs/social/guardrails.md). Confirmation rule reuses the existing sourcing bar: official source, or two independent outlets (docs/content-ops/editorial-voice-and-pipeline.md). Everything else is T2/T3 and rides the normal lanes. The LLM never decides tier alone: a deterministic candidate filter proposes, one Sonnet call classifies with the rubric, and the two-outlet check is code.

Pipeline (new breaking-lane.yml, dispatched by the bot clock every 10 min since GitHub cron drops fast schedules, STATE.md 22:20 note):
1. Poll a short primary list only: official YouTube RSS (channels already in scripts/appearance-discovery/channels.mjs), taylorswift.com and store site-diff (adapter exists: apps/worker/src/sources/site-diff.ts), Google News RSS "taylor swift" sorted new, Bluesky, GDELT. No X reads (paid, declined 2026-10-01).
2. Zero-LLM keyword gate (announce, new album, tour dates, out now, official domain) writes a breaking_candidate row.
3. One Sonnet classification with max_budget_usd: 0.5, forced tool output {tier, category, confidence, sources[]}; code verifies the two-outlet or official rule.
4. T1 confirmed: write current_item with status='confirmed', source_tier='official', image_url required (see metric 4), so the Live card appears within one ISR window (15 min). This is the on-site hit; the Vault moment follows next day via the existing promotion queue (docs/proposals/2026-08-23-knowledge-engine.md §6).
5. Fan-out: dispatch routine-tree-event-draft.yml immediately with a `breaking` flag that targets the next poster slot; and write a notification event for the T1 category. Where events are created today is UNVERIFIED; the executor must read apps/web/app/api/notifications/dispatch/route.ts and NOTIFICATIONS_SPEC.md §10 first. The governor stays in charge: spec principle 1 says no exceptions for breaking.
6. Timestamps first_public_at, detected_at, on_site_at, social_at, push_at go into a news_event table; that is the SLA metric.

Gates: privacy redlines (docs/content-ops/privacy-redlines.md) run in the classifier prompt and in screenTopic(); a redline hit is dropped, never stored. Failure handling: classifier error or budget hit opens a named breaking-lane alert and leaves the candidate for the 4-hourly worker; nothing falls through silently.

Budget math (targets): detect <=10 min, classify <=5, ISR <=15, push dispatch <=15: ~45 min to site and push. Social depends on the owner's approval unless Tree auto-approval covers breaking (owner question 2).

### (b) Metric 2: never miss, and measuring recall

Build news-recall.yml (weekly, zero-LLM): assemble a ground-truth list per day from Google News top results, r/TaylorSwift top posts of the day (anonymous RSS via HOME_RELAY_URL, residential), and official channel uploads; fingerprint each event by title cluster. Recall = share of ground-truth events with a matching current_item, intake issue, or Vault moment within 48h; separately within 1h for T1. Store {week, events, hit_48h, hit_1h, missed[]} in docs/ops/dashboard/news-recall.json. Missed events auto-file intake issues, so measuring also repairs. This revives the retired recall check as a deterministic diff rather than an Opus re-triage. Targets: recall-48h >= 95%, T1 recall-1h = 100%. Red < 80%, amber < 95%.

### (c) Metric 3: theory ingestion and the clowning database

1. Flip COMMUNITY_CRAWL_ENABLED=true with COMMUNITY_CRAWL_BUDGET=20 (owner flips it; the README says a human does). Run the crawl through the home relay; GitHub IPs 403 on reddit.com (docs/community/watchlist.md header). [Later research: already enabled since Sep 22, RSS-only, 429-throttled, no relay exists.]
2. Widen sources: add r/TaylorSwiftTheories hot/new daily (already in awareness-subs.json), the weekly FB export posts (scripts/community/fb-export-ingest.mjs already lands leads; add a theory-miner pass over the same file), and mainstream Easter-egg roundups via a GNews query so theory-weaving.md's "mainstream coverage" bar can be met automatically.
3. Lower promotion to mention_count >= 2 with a heat field, keep weaving at a sourced-roundup match rather than a raw count. This changes a documented scope decision in apps/worker/src/extract/theory-promote.ts header: say so in docs/decisions.md.
4. Data model: live_theory gains first_seen_at, last_seen_at, mention_count, source_threads[] (hashed authors stay hashed), status (open, confirmed, debunked). The Clownboard already reads live_theory by heat (CLOWNBOT.md fan corpus section).
5. Metrics: fan_theory_candidate count, live_theory origin=fan count, promoted/week, Vault theory records (seed grep), weaving issues/week. Target: +50 live fan theories/week by week 6; red if < 10.

### (d) Metric 4: media-completeness gate

Make it a PR gate that cannot rot (same reasoning as check-voice.mjs): new scripts/check-media.mjs run in CI build over the seed files the PR touches. Rule: every moment carries at least one of photos[0].url, video.youtubeId, socialPost.shortcode; a moment without one needs mediaException: 'rights'|'privacy'|'safety' (mirrors videoPresentationException in editorial-voice-and-pipeline.md). Grandfather list of existing offenders, ratcheting down only (the pattern scripts/lib/sourcing-gate.mjs already uses). Second gate on the live path: current_item with null image_url and null social_post is not servable (the dashboard node text claims a publish gate exists; UNVERIFIED in packages/core/src/knowledge/client.ts). Third: Photo Enrichment lane reads the grandfather list as its queue so the legacy count falls. Metric: % moments with media weekly from a script over supabase/seed/content, target 100% for items added after the gate, legacy trending to 100% within 6 weeks; red if any new item ships without media. [Later research: scripts/lib/moment-media-gate.mjs already enforces media on seed moments via validate:content; the real gaps are elsewhere.]

### (e) Metric 6: the Swifty voice

1. Style guide v2 docs/content-ops/voice-guide.md: keep the naming rule and cut-on-sight list, add the positive rules: lead with love, one opinion per item, name the clowning when it fits, fan shorthand, never neutral wire summary.
2. Exemplar corpus docs/content-ops/voice-exemplars/: 40 shipped items the owner picks in one Discord pass (react star on cards), plus Tree's approved posts, plus 20 counter-examples with the reason. This is the one human step and it is a 20-minute task.
3. Generate-then-critique in the lanes: Content Shift and Tree drafts already produce a critique self-score (tree-event-draft.md step 4). Make the critic a separate Sonnet call with the exemplars in context and a 5-dimension rubric (love, insight, opinion, clowning fit, AI-tell), score 1 to 5; below 3 on any dimension is rewritten once, then shipped with the score in the PR body yield record.
4. Automated voice score: scripts/content-engine/checkers/voice.mjs stays blocking for the deterministic rules; add a weekly voice-sample.yml that samples 20 shipped items and runs the same critic, writing {week, mean, p10, dimension means} to docs/ops/dashboard/voice.json. Target mean >= 4.0, red < 3.0. Owner taste check: 5 items/week in #longlive-marjorie with a 1 to 5 reaction, logged next to the model score so drift between the two is visible.

### (f) Metrics 7 to 9: Reddit and Facebook, no API key

What is safe: reading public pages anonymously from a residential IP; the owner posting by hand; Graph API reads on our own IG/FB Page (already done by social-reply-notifier.yml). What is not safe and I recommend against: any automated posting, voting or commenting on Reddit (account ban risk and it contradicts the community plan's standing rule, docs/community/README.md §5), any Facebook group crawler (ruling 2026-08-11, docs/decisions.md line 4949), linking in r/TaylorSwift (watchlist: ban).

Measurement design (no key):
- Upvotes: community-outcomes.yml daily, via HOME_RELAY_URL, fetches https://www.reddit.com/user/NegativeRest9507/comments.rss (the brand account named in scripts/community/reddit-account.mjs); the RSS is anonymous and public. Parse each comment's permalink and score, upsert engagement_outcome {lead_id?, platform, permalink, score, replies, posted_at, checked_at}. Matching to a lead: by thread URL recorded when the owner clicks Posted (/api/community/ack, apps/web/app/api/community/ack/route.ts). If the relay is not running, the job skips loudly; this is why HOME_RELAY_URL is now load-bearing (open ask in STATE.md). [Later research: Reddit RSS does not carry score or comment count (scripts/lib/reddit-rss.mjs:14), so this design needs revision.]
- Replies on Reddit: already arrive as reply_to_us via Gmail (community-inbox.yml); count them per week.
- Facebook Page replies: social-reply-notifier.yml already reads them; write counts to the outcome table instead of only Discord.
- Facebook group replies: extend the weekly export extension (scripts/knowledge/fb-extension) to visit the owner's own activity log and capture reply and reaction counts on our comments. This widens a human-run, read-only, owner-login tool; it needs the owner's yes. [Owner said yes.]
- Dashboard: comments posted/week, median and total upvotes, % with >=1 reply, by sub and by platform. Targets (assumptions): >=20 comments/week, median score >= 3, reply rate >= 25%. Red: median <= 0 or reply rate < 10%.

Cadence: keep the existing caps (awareness-subs.json: 15/day, 4 for r/TaylorSwift and r/swifties), the 9:1 non-promo norm and the redditNonPromo >= 20 link gate (docs/community/watchlist.md). Prioritize threads under 6h old with high comment velocity; add a "best hour to post" feature once outcomes exist.

### (g) Metrics 10 and 11: merch and photo-to-merch with affiliate links

1. Owner sets NEXT_PUBLIC_AWIN_ID, AMAZON_ASSOCIATES_TAG (and CATCHALL_ID) in Vercel; counsel gate is already cleared (docs/decisions.md 2026-08-30). Human action. [Later research: the code reads NEXT_PUBLIC_AWIN_ID, NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG, NEXT_PUBLIC_CATCHALL_ID; 0 Awin advertisers joined; Amazon unsigned.]
2. Build E6 step 4, the product writer: a Vault lane 7 (twice weekly, cap 3 looks) that consumes merch-matcher-authoring plan artifacts, maps score to Product.matchScore (spec §8 field note), writes products onto the moment, and passes E1/E2 verification (hasPassedVerification in scripts/merch-engine/match-moments.mjs).
3. Schedule merch-matcher-authoring.yml weekly with a hard $ cap (today manual, typed confirmation). New recurring spend is a founder decision (docs/AUTOMATION.md checklist item 5). [Later research: this workflow is a stub; see research-merch-deep.md.]
4. Fan merch: find and schedule the E5 curation lane (curateCandidate, referenced in scripts/merch-engine/fanmade-discovery.mjs) or add it as Vault lane 8 with cap 5/week; add an FTC disclosure line to MerchSection.tsx on any affiliate link. [Later research: disclosure strings already exist and render when a link is affiliate.]
5. Metrics from the merch seeds: products added/week with affiliateNetwork set, products with momentId and matchTier added/week (target >= 3), fan-made items added/week (target >= 5), dead-link count from merch-verify.yml. Red: 0 in a week. [Later research: there is no affiliateNetwork or momentId field; the network is derived from the retailer host at render.]

## 5. LLM budget and architecture

Facts: one Max-plan OAuth token shared by ~27 routines (routine-template.yml header); models today from .github/workflows/routine-*.yml: Opus 4.8 on Vault Run, Kevin S1, Nils, Paul Blart, Marjorie brief, Tree daily and event drafts; Opus 5 on every chat and ask-response routine and Tree weekly plan; Fable 5 on Austin, strategy, taste, weekly review; Sonnet on the rest; Haiku on Kevin radar. routine-marjorie-ops.yml runs hourly on Sonnet at 60 turns (364 runs in 30 days) and overran to 91/90 turns on 10-14.

Stop the starvation, in order:
1. Separate the content pool (founder decision). Option A: ANTHROPIC_API_KEY metered billing for the content producers only (Vault Run, breaking lane, news triage, voice critic, merch writer), each with max_budget_usd; immune to the weekly limit; cost is per-run and visible. Option B: a second Max seat dedicated to routines. Option C alone (cuts) does not solve first-come-first-served exhaustion. Recommend A for content plus C.
2. Named limit detection now. In routine-template.yml, match "hit your weekly limit" in the result, open one claude-weekly-limit watchdog alert with the reset time, and set a repo variable ROUTINES_PAUSED_UNTIL; non-content routines skip until reset so whatever remains goes to content.
3. Turn-budget ledger. routine-usage-report.mjs already emits turns per run; sum weekly per routine into docs/ops/dashboard/budget.json and cap the non-content pool (skip when over). Plan usage cannot be queried from a routine (UNVERIFIED), so turns are the proxy.
4. Model cuts (reversible, no founder gate): chat and ask-response routines Opus 5 to Sonnet 5; Nils and Paul Blart to Sonnet; marjorie-ops hourly to every 3h; Tree daily draft to Sonnet with an Opus critic only on breaking. Keep Opus on Vault Run lanes 1 and 4 (sourcing judgment) and Fable on the weekly strategy.
5. Caching and batching: Vault Run lanes re-read charters each run; move charter text into a cached system prompt (the extract stage already does this, knowledge-engine.md §4.5). Split Vault Run into one job per lane with concurrency so a slow lane cannot starve the others; lanes still commit to one branch. [Later research: lanes cannot simply be separate jobs because of generated-file conflicts.]

Proposed weekly turn allocation (targets): content producers 55%, social drafting 15%, community answerers 10%, ops/chat/desks 20%. Review after two weeks of ledger data.

## 6. Roadmap

Owner types: E = executor agent, J = Joey decision, H = human action. Effort S/M/L.

This week
1. Fix dashboard crash (goals missing) and stale workflow name. Metric: all. S. E. Verify: open the artifact, True north and Trends render. [Crash claim later withdrawn.]
2. Named weekly-limit alert + ROUTINES_PAUSED_UNTIL skip. Metric 1,2. S. E. Verify: gh run view of a forced-limit dry run shows the alert issue.
3. J: choose budget option A/B/C. Then H: create ANTHROPIC_API_KEY secret if A.
4. Vault Run per-lane jobs + per-lane yield record in PR body (items_added/edited/skipped, voice score). Metric 4,6. M. E. Verify: next vault/* PR body contains the yield block; vault-prs.json style parse works.
5. check-media.mjs PR gate with ratcheting grandfather list. Metric 4. M. E. Verify: a test PR adding a photoless moment goes red; CI green on main.
6. Fix draft-happy-path.test.ts hermeticity and close the 154 stuck state PRs; batch poster fold-back to daily. Metric 5. M. E. Verify: gh pr list --label automerge:content shows < 10 open.
7. J: confirm HOME_RELAY_URL and that a relay runs on Hermes (needed for 8, 11, 12). J: flip COMMUNITY_CRAWL_ENABLED=true, budget 20.
8. community-outcomes.yml (Reddit user comments RSS via relay + Gmail replies + FB Page replies) writing engagement_outcome. Metric 8,9. M. E. Verify: table has rows with scores for last week's posted comments.

Next 2 weeks
9. Breaking lane (breaking-lane.yml, candidate table, Sonnet classifier, current_item write, news_event timestamps) plus docs/content-ops/critical-news.md. Metric 1. L. E; J approves the definition. Verify: replay last month's T1 events as fixtures; each reaches current_item in a dry run within the budget.
10. Push fan-out for T1 (event producer wired to the dispatcher, governor untouched). Metric 1. M. E; J: automatic for confirmed T1 or owner tap. Verify: test device receives one push in staging.
11. news-recall.yml weekly recall with auto-filed intake for misses. Metric 2. M. E. Verify: first JSON row with events, hit_48h, missed[].
12. Theory engine widening: FB export to theory-miner, GNews roundup source, promotion bar change recorded in decisions. Metric 3. M. E. Verify: live_theory origin=fan count grows week over week.
13. Voice guide v2 + exemplar corpus (H: 20-minute star pass) + critic call in lanes + weekly voice-sample.yml. Metric 6. M. E. Verify: voice.json mean reported; PR bodies carry scores.
14. "New on site" input to Tree: a weekly list of shipped moments with media feeds the calendar; same-day event drafts prefer items already live. Metric 5. S. E. Verify: calendar PRs cite moment ids.
15. Model and cadence cuts (section 5 item 4). All. S. E. Verify: turn ledger drops; no error_max_turns.

Next 6 weeks
16. H: set affiliate env vars. J: approve weekly E6 authoring spend cap. Then E6 product writer as Vault lane 7 and E5 curation lane. Metric 10,11. L. E. Verify: >=3 products with momentId + affiliate link in a week's merged seeds.
17. FB group reply counts via the export extension (J yes/no), owner activity-log pass. Metric 9. M. E.
18. Dashboard v2 in-repo (section 7) with weekly collector. All. L. E.
19. Tree breaking slot auto-approval scope aligned with #5479 (Hermes session; coordinate, do not duplicate). Metric 1,5. J.
20. Retire the bot-clock noise: move marjorie-status to the clock table only, drop its cron. S. E.

## 7. Dashboard v2 spec

Move the dashboard into the repo as a static page (docs/ops/dashboard/index.html) reading committed JSON (docs/ops/dashboard/*.json) so a workflow, not a Claude session, writes the numbers; the Artifact's db can only be written from a session. A weekly zero-LLM dashboard-collect.yml (Monday, clock-dispatched) gathers from gh api, the seed files, engagement_outcome, news_event, live_theory counts (Supabase read with the anon key where RLS allows; service key stays in Actions), and the turn ledger.

Tabs and tiles
- True north: 11 goal cards, each with target, current, 4-week sparkline, RAG. Thresholds: M1 T1 on-site <=60 min (green), <=4h amber, else red; M2 recall-48h >=95/>=80; M3 live fan theories +50/wk green, +10 amber; M4 new items with media 100% green, any miss red; legacy % >=90 green; M5 >=50% of social posts cite a moment shipped in the last 7 days; M6 voice mean >=4.0/>=3.0; M7 >=20 comments/wk, >=10 amber; M8 median upvotes >=3/>=1; M9 reply rate >=25%/>=10%; M10 fan merch >=5/wk, >=2 amber; M11 affiliate matches >=3/wk, 1 to 2 amber, 0 red.
- News: table of news_event rows with the five timestamps, latency histogram, recall by week, missed list with links.
- Content: per-lane yield (items added/edited/skipped), media coverage %, voice score distribution, Vault Run lane success by day, current_item rows written/day.
- Community: comments posted by platform and sub, upvote distribution, replies, awareness cards delivered/posted/skipped (already collected weekly per docs/community/README.md), theory corpus counts.
- Social: posts/day by platform, followers (fix growth-snapshot gap after 10-04), share of posts citing new site content, approval latency.
- Merch: official/fan-made/matched items added, affiliate coverage, dead links.
- Budget: turns per routine per week, limit failures, estimated $ where metered, model mix.
- Automations and Flow: keep from v1, but reliability shown for 7-day and 30-day windows, and the "share of compute" bar relabeled as "share of runner time (not billed; public repo)".

JSON schemas (one file per collection, array of weekly rows): goals.json {n, status, target, now, measure, history[]}, weeks.json (v1 shape plus currentItems, laneYield{lane:{added,edited,skipped}}, mediaPct, voiceMean), news.json {week, events[], recall48, recall1h, p50_min, p90_min}, community.json {week, platform, posted, scoreSum, scoreMedian, replied, replyRate}, merch.json {week, official, fanmade, matched, affiliate}, budget.json {week, routine, runs, turns, limitFails}, annotations.json {date, text, pr}. Each writer appends; the collector fails red if any source is unreadable rather than writing zeros.

## 8. Risks and what not to do
- Do not automate Reddit posting, voting or DMs, and do not create a Reddit key (ruling 2026-10-01). Do not build a Facebook crawler (ruling 2026-08-11). Measure through the brand account's public comment feed and the owner's own export only.
- Do not let the breaking lane bypass the governor or the redlines; "breaking" is explicitly not an exception in NOTIFICATIONS_SPEC.md §1. A wrong T1 push is the fastest way to lose the one differentiator in docs/vision.md.
- Rights: photo hotlinking and rehosting is an accepted risk (guardrail 2); keep takedown-on-request, no AI images, no lyrics on cards, official-video frames only (Joey "frames yes", STATE.md 06:23). Do not rehost full videos.
- Affiliate: add a visible disclosure line wherever an affiliate link renders before tags go live; counsel sign-off covered the layer, not the absence of disclosure.
- Cost: Opus on chat routines and hourly ops is the avoidable spend; do not add routines before the content pool is separated (docs/AUTOMATION.md checklist item 5).
- Brand: lowering the theory promotion bar must never touch the relationship/identity exclusion (docs/content-ops/theory-weaving.md); "largest clowning database" means Easter eggs, not private-life speculation.
- Do not read the dashboard's 30-day feeder reliability as current; several were fixed 10-06.

## 9. Open questions only Joey can answer
1. Budget: metered ANTHROPIC_API_KEY for content routines (option A), a second plan seat (B), or cuts only (C)? This single call decides whether metrics 1 to 4 can run daily.
2. Breaking news: may Tree auto-approve and post a confirmed T1 pair without your approval, and may a confirmed T1 push go out automatically under the governor, or do you want one tap per event?
3. Will you run the Hermes-side residential relay (HOME_RELAY_URL) for anonymous Reddit reads? Without it there is no upvote measurement and no theory crawl.
4. Affiliate go-live: set the Awin and Amazon IDs now, and approve a weekly spend cap for the E6 vision and paid-search authoring?
5. Reddit and Facebook comments stay human-posted (recommended). Are you willing to post ~3 comments a day from the brand account so there is something to measure, and may the FB export extension also read your own activity log for reply counts?

Key files for the executor: scratchpad dash.src.html (line 375 bug, withdrawn), build.mjs, .github/workflows/routine-template.yml, routine-vault-run.yml, news-worker.yml, social-event-dispatch.yml, community-awareness-scan.yml, docs/agents/runner-prompts/vault-run.md, docs/community/README.md, docs/social/guardrails.md, docs/SPEC.merch-autonomy.md, scripts/check-voice.mjs, scripts/community/reddit-account.mjs, NOTIFICATIONS_SPEC.md.

---

# PART 2. Addendum: dashboard tie-back (Pipeline Atlas)

Correction first. My section 3 said dash.src.html line 375 would crash because base.json had no goals. build.mjs now defines goals (lines 69 to 80) and writes it into base.json (line 81); the base.json I read was the pre-goals build. Withdrawn. Remaining dashboard defect: the Overview readme still names social-tree-approve.yml, which is not in .github/workflows/.

## A. Findings mapped to artifact elements

| Finding (section 3) | Tab | Flow node / goal |
|---|---|---|
| Base F1 weekly limit | Diagnosis, Overview KPI "Vault Run reliability" | vault, triage, marj; new budget node; goals 1, 2, 4, 6 |
| Base F2 thin output (actually design caps) | Diagnosis, Trends "Vault lines added" | vault (subtitle should read "3 items/day cap"); goals 3, 4, 6 |
| Base F3 feeders (stale after 10-06) | Automations, Overview KPI "Feeder automations failing" | detect flag "Appearance 21% ok", merch flag "Awin 24% ok": both need a 7-day window |
| Base F4 state-PR storm | Flow | sgate flag "154 PRs stuck", gate flag "1,422 failures"; goal 5 |
| Base F5 social zero | Trends "Social PRs merged" | tree, approve, poster; goal 5 |
| Base F6 bot clock (not a dollar cost; public repo) | Overview "Where the compute goes" (relabel "runner time, not billed") | clock flag "34% of minutes" |
| Base F7 lines not items | Overview "Who produces merged work", Trends | vault subtitle; goal 4 and 6 measures |
| Mine 1 latency is architectural | True north | goal 1 "now"; news subtitle "4-hourly", triage "daily", vault "daily" |
| Mine 2 single serial session | Flow | vault subtitle "6 lanes · one session" |
| Mine 3 owner on the critical path | Flow | approve ("owner approval"), new owner node in the Community row, bot1; goals 5, 7 |
| Mine 4 theory engine off | True north | goal 3 (status and "now" are wrong, see C); detect currently hides community-crawl.yml/theory-miner.yml inside it |
| Mine 5 gates that rot | Flow | gate subtitle lacks media and voice; goals 4, 6 |
| Mine 6 measurement gaps | Diagnosis "What we cannot measure yet", Trends | goals 2, 5, 8, 9, 11; db node has no counts |
| Mine 7 affiliate unwired | True north | goal 11 "now" should name the unset tags; merch node |

## B. Roadmap items mapped to artifact elements
1 readme fix: Overview. 2 limit alert: Diagnosis F1, budget (new), watch. 3 budget decision: budget, goals 1 to 4. 4 per-lane jobs and yield: vault, Trends (new per-lane chart), goal 4 and 6. 5 media gate: gate, goal 4. 6 state-PR fix: sgate, poster, goal 5. 7 relay and crawl flip: crawl (new), outcomes (new), goals 3, 8. 8 outcomes reader: outcomes, goals 8, 9. 9 breaking lane: breaking, classify, livegate, goal 1. 10 push fan-out: push, goal 1. 11 recall: recall, goal 2. 12 theory widening: crawl, theorydb, goal 3. 13 voice loop: voice, goal 6. 14 new-on-site input: edge ship to inbox, goal 5. 15 model cuts: budget, marj, chan. 16 affiliate and E6 writer: matcher, affiliate, goals 10, 11. 17 FB group replies: cscan, outcomes, goal 9. 18 dashboard v2: every tab. 19 Tree breaking approval: approve, goal 1 and 5. 20 clock noise: clock, chan.

## C. True north tab critique (goals array in build.mjs lines 70 to 80)
- Goal 1: wording fine. Add to target: "push subject to the governor" (NOTIFICATIONS_SPEC.md §1). Measure should name five timestamps (first public, detected, on site, social, push), not two.
- Goal 2: "now" cites 6 of 113 news-worker failures; metrics-summary.json does not list news-worker, so I could not verify that figure (UNVERIFIED). Target 98% is fine; add the 1-hour recall for critical items.
- Goal 3: wrong status and wrong "now". "Theory miner ran 31 of 31 days and community crawl 30 of 31" counts green runs, but the crawl ships OFF (docs/community/README.md §4.2) and the miner "has nothing to mine while COMMUNITY_CRAWL_ENABLED stays off, which is a clean no-op" (docs/AUTOMATION.md theory-miner row). Unless the owner flipped the variable (cannot be read from disk), those green runs ingested nothing. Set status off, and rewrite "now" as "pipeline exists, switch is off, ~74 hand-authored theory records in supabase/seed/theories/". Add a seed count to the measure. [Later research: the variable IS on since Sep 22; the miner still found 0 theories because bundles are thin and throttled.]
- Goal 4: "the live news feed hides items with no image" is a claim I could not find in packages/core/src/knowledge/client.ts; mark it UNVERIFIED in the card. Status should be off (it is measurable from the seeds today: 775 of 784 moments declare a photos array). [Later research: held by packages/shared/src/current-item-quality.ts; seed media gate exists.]
- Goal 5: target "every new item gets a post within 24 hours" is unreachable by design: the poster publishes one item per platform per UTC day (tree-event-draft.md step 5) while the Vault adds up to 3 items a day. Replace with "at least 50% of daily posts cite a moment shipped in the last 7 days, and every critical item gets a post".
- Goal 6: fine. Keep the weekly human sample of 10 (my plan said 5; use 10).
- Goal 7: "Facebook groups are reachable by the crawlers" is misleading. There is no Facebook crawler by ruling (docs/decisions.md 2026-08-11); Facebook reach is the owner's weekly local export (docs/AUTOMATION.md export runbook). Status part is fairer than off: finding and drafting work, posting is human.
- Goal 8: measure should add "read from a residential relay (HOME_RELAY_URL); GitHub IPs are blocked".
- Goal 9: "not tracked on either platform" is only partly true: Reddit replies-to-us arrive via community-inbox.yml, Facebook Page comments via social-reply-notifier.yml; only groups are untracked. Status part. Drop "sentiment" from the target (a model call per reply for little value), or mark it later.
- Goal 10: the 24% and 60% reliability figures are stale after the 10-06 fixes (STATE.md); also "Awin 38 PRs" are coverage-map PRs, not merch items in the app. Say so.
- Goal 11: add the first blocker to "now": affiliate tags unset in Vercel (docs/decisions.md 2026-10-04), counsel cleared 2026-08-30, E6 writer unbuilt (docs/SPEC.merch-autonomy.md §8).
- Tab-level: add a "current vs target flow" toggle and a per-goal sparkline fed by the collector; the goals db collection should carry history[].

## D. Target Flow spec
Layout changes in dash.src.html: ROWY = [52,142,232,322,412,502,592,682,772], viewBox="0 0 1100 860", LANES becomes nine rows: 0 App content: Vault · 1 Breaking news (new) · 2 App content: live feed · 3 Merch · 4 Theories (new) · 5 Quality and voice · 6 Social · 7 Community (new) · 8 Bots, ops and budget. Each node gets a state: 'existing' | 'new' | 'changed' field; render new nodes with a dashed rect.box and show a Current/Target toggle that hides new nodes and their edges. [Implemented in dashboard v3.]

Nodes (id, c, r, type, name, subtitle, ids, flag; state in brackets):
Row 0, Vault: detect c0 r0 content "Detectors" "intake issues · no LLM" ids appearance-discovery.yml, cie-scan.yml [changed: crawl and miner move to row 4]; vault c1 r0 "Vault Run" "Opus · one job per lane · yield record" ids routine-vault-run.yml flag "3 items/day cap" [changed]; gate c2 r0 "CI gate" "validate · media · voice · tests" ids ci.yml [changed: media gate added]; merge c3 r0, ship c4 r0, app c5 r0 [existing, unchanged].
Row 1, Breaking (all new): breaking c0 r1 "Breaking poll" "every 10 min · primary sources" ids breaking-lane.yml flag "SLA 60 min"; classify c1 r1 "Critical classifier" "Sonnet · two-outlet rule"; livegate c2 r1 "Live gate" "media required · redlines"; push c5 r1 "Live card + push" "ISR 15 min · governor".
Row 2, Live feed: news c0 r2 "News worker" "ingest · 4-hourly" ids news-worker.yml [changed: moved to Detect]; extract c1 r2 "Extract" "Haiku · current_item" [existing code, new node]; triage c2 r2 "News triage" "Sonnet · daily" ids routine-news-triage.yml [existing]; recall c3 r2 "Recall audit" "weekly · reference list" ids news-recall.yml [new]; db c4 r2 "Live feed tables" "current_item · live_theory" [existing].
Row 3, Merch: merchdetect c0 r3 "Merch detect" "fan-made · verify · audit" ids merch-fanmade.yml, merch-verify.yml, merch-audit-detect.yml [existing, new node]; merch c1 r3 "Merch syncs" "official + Awin index" ids merch-official-sync.yml, merch-awin-sync.yml [existing]; matcher c2 r3 "Photo to merch matcher" "vision + Awin · E6 writer" ids merch-matcher.yml, merch-matcher-authoring.yml flag "writer not built" [new]; affiliate c3 r3 "Affiliate seam" "Awin / Amazon tags" flag "tags unset" [existing code, changed].
Row 4, Theories: crawl c0 r4 "Theory crawl" "Reddit RSS · FB export · Haiku miner" ids community-crawl.yml, theory-miner.yml flag "switch OFF" [existing, moved]; theorydb c1 r4 "Clowning database" "promote · weave · live_theory" ids theory-promote.yml, theory-weaving-intake.yml [existing, changed bar].
Row 5, Quality and voice: voice c1 r5 "Voice critic" "Sonnet · exemplars · weekly sample" ids voice-sample.yml [new]; cie c2 r5, austin c3 r5 [existing, moved].
Row 6, Social: inbox c0 r6, tree c1 r6, sgate c2 r6, approve c3 r6 (subtitle "Tree auto for IG/X · owner approval else"; UNVERIFIED), poster c4 r6, out c5 r6 [existing].
Row 7, Community (new row, mostly existing pieces): cscan c0 r7 "Community scans" "Reddit RSS · Gmail · FB export" ids community-scan.yml, community-awareness-scan.yml, community-inbox.yml [existing]; answer c1 r7 "Reply drafters" "Sonnet · no shell" ids routine-community-answerer.yml, routine-awareness-answerer.yml [existing]; cards c2 r7 "Discord cards" "Posted / Skip links" ids community-mailer.yml, community-awareness-deliver.yml [existing]; owner c3 r7 ops "Owner posts" "human · brand account" [existing, human]; outcomes c4 r7 "Outcomes reader" "upvotes · replies · via relay" ids community-outcomes.yml, social-reply-notifier.yml flag "needs HOME_RELAY_URL" [new]; comm c5 r7 "Reddit · FB groups" "public threads" [existing].
Row 8, Bots, ops and budget: clock c0, marj c1, chan c2, bot1 c3, watch c4 [existing]; budget c5 r8 ops "LLM budget" "two pools · turn ledger · limit alert" ids routine-template.yml flag "one shared token today" [new].

Edges ([from, to], 'dash' = indirect): [detect,vault],[vault,gate],[gate,merge],[merge,ship],[ship,app], [breaking,classify],[classify,livegate],[livegate,db],[db,push],[push,app],[classify,tree,dash], [news,extract],[extract,triage],[triage,detect,dash],[extract,db],[db,app],[recall,detect,dash],[db,recall,dash], [merchdetect,merch],[merch,matcher],[matcher,affiliate],[affiliate,gate],[merch,gate],[matcher,voice,dash], [crawl,theorydb],[theorydb,db],[theorydb,detect,dash], [vault,voice,dash],[voice,gate],[cie,austin],[austin,gate], [ship,inbox],[inbox,tree],[tree,sgate],[sgate,approve],[approve,poster],[poster,out],[classify,inbox,dash], [cscan,answer],[answer,cards],[cards,owner],[owner,comm],[comm,outcomes,dash],[outcomes,cscan,dash],[cscan,crawl,dash], [clock,marj,dash],[clock,poster,dash],[clock,breaking,dash],[marj,chan],[marj,bot1,dash],[marj,vault,dash],[tree,chan,dash],[poster,watch,dash],[budget,vault,dash],[budget,marj,dash],[budget,watch,dash].
New edges versus today: ship to inbox (new content feeds social), classify to tree/inbox (breaking to social), db to push, theorydb to db and detect, voice into gate, matcher/affiliate into gate, the whole community row, budget to the three spenders, clock to breaking. Remove nothing; detect loses two ids.

## E. ASCII before and after

Before (today):
```
Detect        Produce        Check          Merge        Ship          Reach
detectors --> Vault Run ---> CI gate -----> auto-merge -> publish ----> app
              news worker -> news triage ------------------> live tables -> app
              merch syncs -> CIE scan ----> Austin -----> (gate)
inbox ------> Tree -------> queue PR -----> owner OK ---> poster -----> X/IG/FB
clock ------> Marjorie ----> Discord -----> bot1 -------> watchdog
```
After (target; * = new):
```
Detect          Produce           Check            Merge          Ship            Reach
detectors ----> Vault Run ------> CI gate --------> auto-merge --> publish ------> app
                (per lane)        (+media,+voice)                                  ^
breaking* ----> classifier* ----> live gate* ---------------------> live tables -> live card + push*
news worker --> extract --------> news triage --> recall audit* --> live tables -> app
merch detect -> merch syncs ----> photo->merch* -> affiliate seam -> (CI gate)
theory crawl -> clowning db ----------------------------------------> live tables, intake
                voice critic* --> (CI gate)   CIE scan -> Austin -> (CI gate)
publish -----> inbox -> Tree ---> queue PR ------> approve -------> poster -----> X/IG/FB
scans -------> drafters --------> Discord cards -> owner posts ---> outcomes* --> Reddit/FB
clock -------> Marjorie --------> Discord -------> bot1 ----------> watchdog     LLM budget*
```
Reading the after sketch: the breaking row is the 60-minute path (poll every 10 minutes, classify, media and redline gate, live card and push), the dashed link from the classifier to Tree is the social fan-out, publish feeding Tree's inbox is "new site content first on social", the community row ends in a measurement node instead of a dead end, and the budget node is the thing that stops one token from starving the Vault.
