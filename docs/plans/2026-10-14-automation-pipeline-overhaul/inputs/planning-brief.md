# Planning brief for the Opus plan: reaching Joey's 11 goals
Compiled 2026-10-14 19:15 PDT from 8 read-only research passes. Nothing below changed any repo file. Items marked UNVERIFIED were not confirmed.
Raw reports (same folder): research-relay.md, research-fbcards.md, research-merch.md, research-jev-tokens.md, base.json (dashboard data), automation-inventory.json, workflow-metrics.json, pr-metrics.json, vault-prs.json. Live dashboard: https://claude.ai/artifact/VVQYq41yw812eEYmFqqoFM

## 0. Before reading: caveats that change the plan
- Local `main` of Swift2 is stale (af1b68d9c, Oct 4; origin/main is about dc091aecf, Oct 14). Run `git -C <repo> fetch` and `pull --ff-only` before trusting any local code read.
- Fable's audit (inside the dashboard) contains claims that later research corrected. See section 4.

## 1. The owner's 11 goals (true north)
1 Critical Taylor news live within 1 hour, plus social and push. 2 Never miss news. 3 Largest "clowning" theory database. 4 Never any item without picture or video. 5 New site content first on social. 6 Swifty voice, quality copy with opinion and clowning. 7 Post in the most important Reddit and Facebook conversations. 8 Reddit comments get upvotes (measured). 9 Reddit and Facebook comments get replies (measured). 10 New fan merch found and posted automatically. 11 At least 3 new affiliate merch pieces a week matching what Taylor wears.

## 2. Owner decisions and constraints (Joey, 2026-10-14)
- Budget: owner has local compute, a Claude Max plan and a Codex plan. Wants a specific, simple answer on any spend. Wants to use "Jev" wherever possible for routing and decisions. Reducing Claude token burn is a REQUIRED part of the optimization.
- Critical news may auto-post and auto-push IF fact-checked and confirmed. Proposed bar: official source (Taylor, her team, her site or store, label, ticketing) OR two independent reputable outlets, checked in code; privacy redlines always on; kill switch. Open: does "critical" include major personal-life news, or only music, tour, album, official statements?
- Reddit and Facebook posting: quality and strategy over quantity; post the number that makes sense. Owner will do whatever is needed (floated 10 a day as willingness, not a target). Existing caps: 15 a day total, 4 for r/TaylorSwift and r/swifties. Owner will not hunt for topics: every Reddit or Facebook card MUST carry a link.
- Facebook export may read the owner's activity log, and anything else of the owner's it needs.
- Never a Reddit API key. Facebook crawler ruled out (decisions 2026-08-11). Comments stay human-posted. No automated voting or DMs.
- Owner expects the merch/affiliate pipeline to already work ("a ton of merch with affiliate links, matched well") and wants it to run frequently with high quality. See section 3D, which does not match.

## 3. Facts by area

### A. Claude token burn and routing (research-jev-tokens.md)
- ~27 routines run on `anthropics/claude-code-action@v1` with one shared `CLAUDE_CODE_OAUTH_TOKEN` (Max pool). No Codex variant exists; no workflow uses `codex exec`. Moving anything to Codex needs a new template, an OpenAI secret and an owner decision. Root rules j/j-2/j-3 restrict Codex to grunt/executor work and forbid it for social work (`scripts/social/**`, `social/queue/**`).
- No committed per-routine turn data: `routine-usage-report.mjs` only emits a per-run artifact. All figures are estimates (turns assumed at 50% of max_turns).
- Top estimated weekly turn burners: marjorie-ops hourly (600 to 2500, routing, no app content), vault-run (~750, the only app-content writer, opus-4-8, 200 turns), marjorie-ask-response (~300, 30+ of 44 runs failed in ~100 s), marjorie-brief (~295, opus), marjorie-status-reply (~290), community-answerer (~280), kevin-radar (~280, haiku), tree-daily-draft (~180), awareness-answerer (~165), marjorie-triage and news-triage (~150 each). austin-build runs on fable-5 (~145).
- Routing/classification-only routines (best Jev, plain code or cheaper model targets): marjorie-ops, marjorie-triage, news-triage, kevin-radar, awareness-answerer, marjorie-status-reply.
- Failures waste tokens: marjorie-ops 89 of 364 failed; marjorie-ask-response mass failures; kevin-daily-desk 11 of 31; tree-daily-draft 10 of 32.
- Only 5 routines have `max_budget_usd`. The rest have no dollar cap.
- Some marjorie-ops and marjorie-status "runs" are skipped before the LLM job, so run counts overstate invocations.
- JEV: not defined anywhere searchable (swift2 repo, memory, root CLAUDE.md). Hermes folder is isolated and was not read. NEED from owner: what Jev is, where it runs, how a workflow or script calls it, and what it can decide.
- Plan usage cannot be queried from a routine (UNVERIFIED), so turns are the proxy.

### B. Reddit scanning and the relay (research-relay.md)
- `HOME_RELAY_URL` is NOT set (not a repo variable or secret). STATE.md lists it as an unanswered owner ask; HUMAN-ACTIONS has no entry. Docs say the relay was never built (docs/community/README.md lines 152-154; proposal 2026-09-03 places it on a home PC over Tailscale). It is a repo VARIABLE (STATE.md wrongly calls it a secret).
- Reddit rate-limits (429) both the awareness scans and the RSS crawl. 3 of 6 sampled awareness-scan runs did nothing ("lane cooling down after a Reddit 429"); the others fetched 2 to 5 candidates then aborted on 429. `relayUsed: 0` in every sampled run.
- COMMUNITY_CRAWL_ENABLED=true since Sep 22 (Fable's "crawl ships off" was stale). The crawl runs RSS-only ("home-relay not configured") and wrote 100 bundles on the latest run. COMMUNITY_CRAWL_BUDGET unset (default 15). COMMUNITY_SCAN_ENABLED=true.
- All community workflows show "success" even when Reddit failed, so a green check hides throttling.
- `community-scan.yml` has no relay reference and scans Reddit directly (inserted 4 leads on one sampled run).
- UNVERIFIED: whether any relay process runs on the owner's network; items fetched across all 30 runs; the 2026-09-27 crawl failure.

### C. Facebook cards without links (research-fbcards.md)
- Root cause, high confidence: two Discord renderers. `reply-opportunity.mjs:125` (the Community Tasks card the owner receives, via community-mailer) drops the link when `lead.url` is null; `mailer.mjs:120-123` prints "Facebook · locator" as plain text. PR #5316 (Oct 8) fixed URL extraction in `fb-export-ingest.mjs` (previously `url: null` hard-coded) but did not touch those two files. The awareness path (`awareness-message.mjs:109-110`, `awareness-fb-link.mjs`) already has a group-link fallback.
- Smallest fix (not made): use `facebookFallbackLine(lead)` in `buildReplyOpportunity` when platform is facebook and url is null; link the Facebook label in `destinationLine`; add a test; re-run `fb-lead-reingest` so older rows backfill.
- Related supply problem: `routine-awareness-answerer` failed every run since Oct 12 (last success 10-12 11:19Z, latest failure 10-14 21:56Z), so `community-awareness-deliver` was skipped 9 of its last 10 runs. `community-mailer` has said "no drafted leads to mail" since Oct 12. Reddit card supply is thin right now too. Cause of the answerer failures not found (possibly a stale checkout SHA).
- Issues #5011, #5012, #5013, #5015 cover the Facebook link problem; #5013 auto-closed by #5316.
- UNVERIFIED: whether real "Webpage, Complete" Facebook exports contain `/posts/` or `story_fbid` links (no real-HTML fixture found; if not, a group link is the best possible); whether the owner's cards come from the mailer path (assumed).

### D. Merch and affiliate links (research-merch.md). THIS CONTRADICTS THE OWNER'S PREMISE
- `docs/ops/AFFILIATE-COVERAGE.md` (origin HEAD): 414 products, 0 wrapped; 10 `awin-apply`, 8 `pending-signup` (amazon.com), 98 uncovered, 298 direct-by-policy (official store). Awin advertiser list (generated Oct 14): 8 advertisers, 0 joined. 0 of 377 official and fan-made seed URLs contain tracking parameters. Affiliate wrapping happens at render time in `shop.ts` and only for joined networks.
- The vars the code reads are `NEXT_PUBLIC_AWIN_ID`, `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`, `NEXT_PUBLIC_CATCHALL_ID` (Vercel env, not GitHub). Decision text names slightly different variables. Even if set, almost nothing would earn: no joined advertiser, Amazon unsigned.
- Existing matched products: 94 `moment.products[]` entries in `supabase/seed/content/<era>.mjs` (fields in `packages/content/src/schema.ts:173-188`: matchTier, matchScore, isAlternative; there is no affiliateNetwork or momentId field). 92 are `unscored`, 8 scored. They came from in-session agent PRs (#2186, #3257) and one manual vision audit (#3486, 2026-08-30) that removed 25 mismatches.
- New matched products since Aug 31: 0 in about 6 weeks. New fan-made: 0 (22 items from a manual curation PR #3480 on Aug 30). New official: +5 (a deterministic Shopify scrape runs twice a day and removes dead links).
- The automated matcher does not work: `merch-matcher-authoring.yml` passes stub functions (`extractImpl` returns `{}`, `judge` returns score 0, lines ~86 and 89) so it can never match anything; the real path (`match-moments-authoring.mjs`, claude-sonnet-5) is invoked by no workflow. `merch-matcher.yml` and `merch-matcher-authoring.yml` have zero runs ever, and are dispatch-only. E6 step 4 (writing matched products onto moments) is unimplemented (`docs/SPEC.merch-autonomy.md:411-417`).
- `merch-awin-sync.yml`: 20 of 20 recent runs cancelled. The feed refresh hits its 45-minute timeout (line 21) after about 86 feeds, so the product index never persists; it also opens roughly 30 "refresh Awin advertiser map" PRs in 10 days (probably churn, UNVERIFIED).
- `merch-official-sync` 20 of 20 ok. `merch-fanmade` 19 ok. `merch-verify` 6 failures Sep 25 to 30 (artifact upload), green since.
- Costs: authoring `paid_search_cap` default 5 SerpAPI calls; no Claude cap in the workflow (stubbed to zero calls). The separate E3 vision audit has `MAX_RUN_COST_USD = 5` and requires a typed confirmation.
- UNVERIFIED: Vercel env values; whether any Awin publisher approval or Amazon Associates account exists outside the repo (the owner may know of earnings or approvals the repo cannot show); real cost of the real E6 path (never run).

### E. Pipeline and process facts (from the first audit; all from files, still valid unless noted)
- Vault Run (`routine-vault-run.yml`, daily 16:07 UTC, opus-4-8, 200 turns, 6 lanes) is the only LLM producer of seed content. Last 3 scheduled runs (Oct 12 to 14) failed on the Claude weekly limit; 7 of 33 failed in 30 days; 24 merged PRs, 2,561 lines, median 100 lines; content on 21 of 31 days. Content Shift is capped at 3 items per run by design. No alert names the weekly limit.
- Latency: Vault path 24 to 48 h; live feed up to 4 h plus a 15-minute cache. News worker polls every 4 h. 0 of 27 time-sensitive events reached social within 2 h and 12 of 27 reached the site within 48 h (docs/strategy/growth-strategy.md bet 4). No breaking lane and no definition of "critical" exist.
- 154 social-poster state PRs open (non-hermetic test `draft-happy-path.test.ts`, photo reuse rule L001) cause 79% of CI failures, but content PRs still merge (203 of 207, median 14 min). Social merged 0 PRs in the week of Oct 12; the poster failed on its last run (one Instagram post fails permanently; an X post returns 403).
- Voice gate (`scripts/check-voice.mjs`) only catches surname overuse and six AI phrases. No media-completeness gate (775 of 784 moments declare a photos array, nothing blocks an empty one). No exemplar corpus or voice score.
- Tree may now auto-approve IG/X drafts (#5479, Hermes side, UNVERIFIED in this repo); Tree/Marjorie are moving to Hermes daily loops (#5484 open draft retires their Actions routines). Poster publishes one item per platform per day.
- Repo is public: Actions minutes are not billed. bot-chat-poll uses 34% of runner time (noise, not cost).
- The three Discord bots are Tree (social), Marjorie (site ops) and bot1/Hermes1 (Hermes server). The owner said "two"; assumed Tree and Marjorie.

## 4. Corrections to the Fable audit and the dashboard (not yet applied to the artifact)
1. "Theory crawl ships OFF" is wrong: COMMUNITY_CRAWL_ENABLED=true since Sep 22. Truth: it runs RSS-only and Reddit 429s throttle it; goal 3 status and "now" text should say so.
2. "Relay: owner confirms it exists" is unsupported: HOME_RELAY_URL is not configured and docs say the relay was never built.
3. Goal 10 and 11 "now" text: the affiliate layer is further from working than stated (0 wrapped, 0 joined advertisers, matcher stubbed, Awin index never persists).
4. Dashboard roadmap item 16 and 17 (affiliate tags, E6 writer) understate the work; item 7 (flip the crawl) is already done.
5. Dashboard Flow node `crawl` flag "Switch OFF" is wrong; `matcher` flag "Writer not built" is right and should add "workflow stubbed".

## 5. What the planner should deliver
A sequenced plan that (a) cuts Claude token burn first (specific routines to move, throttle, convert to code or route through Jev, each with expected savings), (b) repairs the broken inputs (answerer failures, Facebook card link, Awin sync timeout, relay or no-relay Reddit strategy), (c) builds the missing capabilities (breaking lane, media gate, voice critic, outcomes measurement, affiliate matching) in dependency order, (d) respects the constraints in section 2, and (e) says for each step: owner type, effort, acceptance test, and which dashboard element changes. It must also state what the owner needs to provide: what Jev is, whether any Awin or Amazon approval exists outside the repo, whether a relay machine exists, and whether "critical" includes personal-life news.

## 6. Open questions only the owner can answer
1. What is Jev, where does it run, how is it called, what can it decide? (blocks the token plan)
2. Does a relay machine exist or is one wanted? Reddit 429 throttling is the real bottleneck. Options include spreading requests, caching, or building the relay on the home PC (the owner's local compute).
3. Are you earning on any affiliate links today (Awin or Amazon dashboards)? Which accounts and programs are approved? The repo shows none joined.
4. Does "critical" include major personal-life news?
5. Do the Facebook cards you receive come from the "Community Tasks" email-style Discord card? A screenshot or message link would settle which renderer to fix.
