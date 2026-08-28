# Open Work Summary — Issues & PRs (2026-08-25)

Snapshot of everything open on GitHub for `JW-Incorporated/swift2` as of
2026-08-25, pulled live via `gh`. **148 open issues, 4 open PRs.** About
two-thirds of the issues are recurring automated logs (daily briefs, bot
triage runs, news-tip intake, content-quality queues) rather than one-off
work items — those are grouped and counted rather than listed line-by-line;
everything else is itemized below with what it means in plain terms and
what needs to happen to close it.

---

## 1. Open Pull Requests (4)

| # | Title | What it does | Status | Action needed |
|---|---|---|---|---|
| [3327](https://github.com/JW-Incorporated/swift2/pull/3327) | Enforce X and Instagram campaign pairs | Every social post now has to go out on both X and Instagram together (not just one platform depending on memory), and the site's content checker flags any post missing its partner. Also found 41 old posts that broke this rule (won't be fixed automatically, just flagged). | CI `build` check is **failing** | Fix the failing build check, then merge. |
| [3325](https://github.com/JW-Incorporated/swift2/pull/3325) | Auto-drafted social post from a new official Taylor Swift video | A bot noticed a new upload on Taylor's official channel and drafted a social post about it. Designed to auto-merge on its own once its checks pass — no one has to approve it. | `check-drafts` check is **failing** | Needs a human/engineering look at why the check is failing — it won't self-merge until it's fixed. |
| [3154](https://github.com/JW-Incorporated/swift2/pull/3154) | Docs: single active decision-maker (Joey) + reversibility rule | Rewrites the internal governance docs to reflect that Joey is now the sole active decision-maker (Wyatt stepped back), and that the AI can make any *reversible* call itself — only irreversible things (money, secrets, deleting data) need Joey's sign-off. Also fixes the intake rule so every work request lands as a GitHub issue instead of getting lost in email. | CI passing; merge status unknown to GitHub (likely just needs a merge click) | Ready to merge — just needs the merge to actually happen. |
| [1961](https://github.com/JW-Incorporated/swift2/pull/1961) (**draft**) | Clownbot re-spec + implementation plan | A written product spec and build plan for redoing the "Clownbot" chatbot feature, capturing decisions from an August 11 planning session. Explicitly a planning document, not something to build from yet. | Draft, CI passing | Needs founder sign-off on the open questions listed inside (naming, chip placement, usage caps, launch posture) before anyone builds against it. |

---

## 2. Launch-Blocking Items (4)

These are the last things standing between the site and a public launch.

| # | Title | What it's asking for | Action needed |
|---|---|---|---|
| [47](https://github.com/JW-Incorporated/swift2/issues/47) | Content depth & category balance | The site's content skews heavily toward music/business news; fashion, sightings, and relationship coverage is thin, and some months are sparse. | Author more content in the under-covered categories/months. |
| [50](https://github.com/JW-Incorporated/swift2/issues/50) | Product & legal copy (unofficial stance) | Still missing: a first-run explainer of what the site is, an About page with explicit "we are not officially affiliated with Taylor Swift" language, a privacy policy, and an affiliate disclosure. | Write and ship these pages — legally required before launch. |
| [51](https://github.com/JW-Incorporated/swift2/issues/51) | Per-era cover art + theming polish | Each era (Taylor Swift's different musical periods/album eras) needs finished cover art and visual polish; currently only placeholder colors exist. | Source/hotlink real cover art per era and refine the visual theme. |
| [52](https://github.com/JW-Incorporated/swift2/issues/52) | Pre-launch QA pass | Final checklist before flipping the site live: test on phone and desktop, verify no made-up content/broken sources, and do an accessibility pass. | Do last, after the other three above are done. |

---

## 3. Founder Decisions Needed (4)

Items where an AI agent has done the analysis but a founder has to actually make the call or take an action only a human can take.

| # | Title | The ask | Action needed |
|---|---|---|---|
| [479](https://github.com/JW-Incorporated/swift2/issues/479) | Create a Twilio account for SMS alerting | So the team can get paged by text message when something breaks in production, instead of just email. Costs ~$1-2/month. Recommendation in the ticket is to wait until it's actually needed. | Founder decides: sign up now, or defer until later. |
| [531](https://github.com/JW-Incorporated/swift2/issues/531) | Get the iOS app live on the App Store | The engineering work is done; what's left needs a Mac and an Apple Developer account to run the actual submission checklist. | Founder needs to execute the checklist (requires hardware/account access an AI can't provide). |
| [725](https://github.com/JW-Incorporated/swift2/issues/725) | Refresh the production database from current content | The live database is stale — it's missing recent content fixes that exist in the code repo. Requires a production database credential only a founder holds. | Founder (or whoever holds the DB credential) runs the documented refresh command. |
| [2316](https://github.com/JW-Incorporated/swift2/issues/2316) | Should social posts still require a human click to go live? | A recent automated social post got auto-merged and posted without a human reviewing the caption first, even though the process is supposed to require a human review since it's reputational risk. Flags a mismatch between what the docs say should happen and what's actually happening. | Founder decides: tighten the auto-merge rule back to human-required, or formally approve full automation. |

---

## 4. Product & Experience Work (13)

Real features/fixes for what visitors actually see and use on the site.

| # | Title | In plain terms | Action needed |
|---|---|---|---|
| [440](https://github.com/JW-Incorporated/swift2/issues/440) | Track Guide overhaul (also a launch-gate item) | Every song's info page is currently a thin note card. This is a big rebuild into a deep, well-researched page per song — full spec is already written. | Multi-phase content build, in progress via coordination tickets below. |
| [445](https://github.com/JW-Incorporated/swift2/issues/445) | Rework the easter-egg threads | Combines two existing "hidden clues" features into one unified experience: "Mastermind" (case files/theory board) and "Invisible Strings" (a map of recurring symbols across her work). Fully spec'd and approved by Joey; five separate shippable pieces. | Build against the existing approved spec. |
| [434](https://github.com/JW-Incorporated/swift2/issues/434) | Deepen the "Love Story" relationship timeline | The 18 entries covering her past relationships/life periods currently show almost nothing — a note and a date range. This restores a richer design that was originally planned but cut for time. | Build the deeper page template + content. |
| [462](https://github.com/JW-Incorporated/swift2/issues/462) | Named "Swiftie persona" authors | Product idea: instead of one generic writing voice for the site's content, create a small set of named fictional personas (each with their own personality) who "write" different articles, similar to how the site already has personality-driven bots (Karen, Kevin). | Needs a product decision on whether to pursue, then design + build. |
| [525](https://github.com/JW-Incorporated/swift2/issues/525) | The "X" close button is hard to find/use | Users report struggling to find how to exit/close screens. Root causes identified: low color contrast, a tap target smaller than accessibility minimums, and inconsistent placement. | Fix the shared CSS class (`.era-icon-btn`) — code-level fix, ready to implement. |
| [646](https://github.com/JW-Incorporated/swift2/issues/646) | "All Too Well" song page is missing well-known context | A user flagged that the site — which aims to be the definitive Swift-fan resource — doesn't mention the song's famous subject in its own guide page, and asked how to prevent this gap across the whole site. | Fill in the missing detail for this song, and treat as a symptom feeding into the broader Track Guide overhaul (#440). |
| [680](https://github.com/JW-Incorporated/swift2/issues/680) | Verify database backups actually work | Nobody has confirmed what backup guarantees the database provider actually offers, or tested restoring from a backup. This has sat with no progress across 5 status updates. | Check the backup tier, write a restore runbook, and actually test one restore. |
| [722](https://github.com/JW-Incorporated/swift2/issues/722) | Early-era timelines are overloaded with outfit photos | 20–33% of the timeline entries for her earliest three eras are single-source "she wore a dress" cards, crowding out the actual story; the site has a dedicated fashion section where these belong instead. | Move the low-substance fashion cards out of the main timeline into the fashion thread. |
| [738](https://github.com/JW-Incorporated/swift2/issues/738) | Fully automate social media posting | Once a founder approves a post in Slack, it should post itself on schedule with no further manual step — currently some manual step remains per platform. | Build out the remaining automation per the design in the ticket. |
| [744](https://github.com/JW-Incorporated/swift2/issues/744) | "evermore" era photos are cropped badly | Founder-reported: portrait photos get center-cropped into wide cards and cut off faces/heads. | Product call needed on the fix approach (listed as options in the ticket), then implement. |
| [745](https://github.com/JW-Incorporated/swift2/issues/745) | Site-wide low-quality image cleanup | An automated scanner found 115 images across all 10 eras that are either too small (blurry thumbnails) or watermarked stock-photo previews that were never replaced with real licensed images. | Replace the 115 flagged images with proper hotlinked sources. |
| [2040](https://github.com/JW-Incorporated/swift2/issues/2040) | Social posting can silently go stale | Structural design flaw: the system's record of "what's already been posted" only updates when a GitHub PR merges — if that merge ever fails silently, the system doesn't know what's already posted and can re-post duplicates. Already caused two real incidents. | Redesign the "what's already posted" tracking so it doesn't depend on a PR merging. |
| [3286](https://github.com/JW-Incorporated/swift2/issues/3286) | Audit official Taylor Swift YouTube channel for missing coverage | Joey discovered the channel posts far more original content (613 videos) than the site currently covers. | Catalog the full channel and scope what's missing from the site. |

---

## 5. Content Quality Queues — automated findings (6)

Generated by the site's built-in "Content Integrity Engine" (an automated checker, not a person) that scans the live content for problems. Each is a batch of specific items that need a human editorial pass, not a code fix.

| # | Title | Count | Action needed |
|---|---|---|---|
| [1723](https://github.com/JW-Incorporated/swift2/issues/1723) | Images hosted on low-reputation domains | 259 items | Review each image's source and re-host/replace ones from untrustworthy hosts. |
| [1715](https://github.com/JW-Incorporated/swift2/issues/1715) | Low-quality images | 137 items | Replace with higher-resolution sources. |
| [1721](https://github.com/JW-Incorporated/swift2/issues/1721) | Photo-sparse content entries | 54 items | Add more photos to these entries. |
| [884](https://github.com/JW-Incorporated/swift2/issues/884) | Fashion product links to review | 44 items | Manually verify these product/shopping links. |
| [1719](https://github.com/JW-Incorporated/swift2/issues/1719) | Content lacking depth | 26 items | Expand these entries with more detail/sourcing. |
| [138](https://github.com/JW-Incorporated/swift2/issues/138) | No CSAM-detection safety net on hotlinked images | infrastructure gap | Needs a founder decision on enrolling a paid image-safety scanning service (PhotoDNA Cloud); deliberately not something to build in-house for legal reasons. |

---

## 6. Security Findings (6)

| # | Title | In plain terms | Action needed |
|---|---|---|---|
| [1966](https://github.com/JW-Incorporated/swift2/issues/1966) | No "treat fetched web content as data, not instructions" safeguard | The AI agents that read external web pages (for news, sourcing, images, etc.) aren't explicitly told that text on those pages could contain hidden instructions trying to manipulate them ("prompt injection"). | Add that guardrail instruction to every agent prompt that reads external content. |
| [1967](https://github.com/JW-Incorporated/swift2/issues/1967) | A key safety filter only checks one type of content | The system's "don't publish legally risky claims" filter only checks one structured data field; the same kind of risky claim written as normal prose elsewhere on the page slips through unchecked. | Extend the filter to cover prose fields, not just the structured one. |
| [1970](https://github.com/JW-Incorporated/swift2/issues/1970) | Prompt-injection security review (analysis only, no live test run) | A written risk analysis of whether the content-writing bots could be tricked by malicious text on external pages they read, since content publishes automatically with no human review. | Analysis complete; any recommended fixes need to be turned into tickets/action. |
| [1971](https://github.com/JW-Incorporated/swift2/issues/1971) | Web/app security review — found a real gap | Confirmed that content can currently reach the live site with **zero human review required** on the merge process — flagged as the top-priority finding. | Decide whether to require human review before merge, or accept the risk. |
| [1975](https://github.com/JW-Incorporated/swift2/issues/1975) | Security policy header isn't fully enforced (low severity) | A browser security setting (Content-Security-Policy) is running in "log only" mode instead of actually blocking, and one part of it allows a looser rule than ideal. | Low-priority hardening task — flip enforcement on and tighten the exception once convenient. |
| [3185](https://github.com/JW-Incorporated/swift2/issues/3185) | Dependency vulnerability snapshot | Automated, auto-updating report of known security vulnerabilities in the project's third-party code libraries. **Currently reports 0 open alerts** — nothing to act on right now. | None currently — this issue just stays open as a live dashboard. |

---

## 7. Coordination / Traffic-Control Tickets (5)

Internal "who can safely work on what without collisions" tickets, mostly wrappers around the content work already listed above.

| # | Title | Purpose | Action needed |
|---|---|---|---|
| [1955](https://github.com/JW-Incorporated/swift2/issues/1955) | Midnights + TTPD timeline depth — blocked | Joey's #1 pre-launch content priority (deepening two specific album-era timelines), currently blocked by other open PRs touching the same files. | Follow the documented merge order to unblock, then author the content. |
| [1954](https://github.com/JW-Incorporated/swift2/issues/1954) | Content-track deconfliction map | A map of which content files are "locked" by an in-progress PR vs. safe to start on, so two writers don't collide on the same file. | Reference doc — keep it updated as PRs land. |
| [1956](https://github.com/JW-Incorporated/swift2/issues/1956) | Green light: Track Guide corpus is safe to start | Confirms the song-page rebuild (#440) has no file collisions right now, so work can start immediately. | Start the #440 work. |
| [1957](https://github.com/JW-Incorporated/swift2/issues/1957) | Green light: Theories & eggs content is mostly safe to start | Same kind of "safe to start" confirmation for the easter-egg/theories content, except for one era. | Start work on the clear eras. |
| [1958](https://github.com/JW-Incorporated/swift2/issues/1958) | Reserve reputation + fearless eras for next content push | Reserves two specific eras as the next targets the moment a currently-blocking PR lands. | Wait for the blocking PR, then start. |

---

## 8. Handoffs / Needs Human Triage (5)

| # | Title | What's going on | Action needed |
|---|---|---|---|
| [2102](https://github.com/JW-Incorporated/swift2/issues/2102) | Full project handoff (Wyatt → Joey) | A comprehensive status dump of everything in flight, open decisions, and known traps, written when Wyatt stepped back from active engineering. | Reference doc — read through for anything not otherwise captured in this summary. |
| [2258](https://github.com/JW-Incorporated/swift2/issues/2258) | Recreate scheduled AI routines under Joey's account | The automated background jobs (news scanning, content checks, etc.) were running under Wyatt's account and have been disabled; they need to be rebuilt under Joey's account to resume. | Founder needs to set these routines back up (or confirm they should stay off). |
| [3282](https://github.com/JW-Incorporated/swift2/issues/3282) | Social post failures never notify anyone | Confirmed: Joey has never gotten a single notification (success or failure) about social posts, and a real failed post recently went unnoticed because a different post succeeded in the same time window. | Build a notification path for individual post failures, not just overall run health. |
| [2195](https://github.com/JW-Incorporated/swift2/issues/2195) | Weekly ask: post 3 Reddit comments (week of Aug 17) | A recurring ~10-minute task asking Joey to post specific pre-written comments to Reddit to build organic visibility, without linking the site directly. | Founder action — do the Reddit posts, check the boxes. |
| [2313](https://github.com/JW-Incorporated/swift2/issues/2313) | Weekly ask: post Reddit comments (week of Aug 24) | Same kind of ask as #2195, for the following week. | Founder action — do the Reddit posts, check the boxes. |

---

## 9. Recurring Automated Reports (103 issues — not individual action items)

These are standing logs written by scheduled bots, not one-off work requests. Listing each by number wouldn't be useful; here's what exists and what (if anything) needs attention:

| Category | Count | What it is | Action needed |
|---|---|---|---|
| Founders' Brief | 27 | Daily automated status digest for the founders. | None — informational, superseded by each new day's brief. |
| Kevin Eng Triage | 28 | Daily automated engineering-issue triage pass by the "Kevin" bot. | None — routine bot output. |
| Kevin Review Radar | 6 | Periodic bot scan flagging items that need review. | None — routine bot output. |
| Kevin Daily Review | 1 | Newer format of the above, appears to be replacing it. | None. |
| News intake tips | 31 | Bot-surfaced news/social mentions about Taylor Swift, each proposing something to potentially add to the site (e.g., chart records, interview mentions, public appearances). | Each one needs a quick human/editorial yes-or-no on whether it's worth adding to the site; otherwise they age out unactioned. |
| "Nils" & "Laura" standing logs | 2 ([502](https://github.com/JW-Incorporated/swift2/issues/502), [661](https://github.com/JW-Incorporated/swift2/issues/661)) | Never-closed running logs for two automated site auditors (content-quality walker and accessibility auditor); each posts a new comment per run rather than opening new issues. | None — by design, stays open indefinitely. |
| "Unowned work sweep" ledger | 2 | Standing list of open work items that don't have a clear owner assigned. | Worth a periodic look to make sure nothing real is falling through the cracks. |
| Security Patrol | 2 | Recurring automated security scan log. | None — routine bot output. |
| Routine Audit | 1 | A one-time audit of the automated routines themselves. | None currently pending. |

**Recommendation:** these 103 issues are cluttering the open-issues list without representing real backlog. Worth periodically bulk-closing the dated ones (briefs/triage/radar older than ~2 weeks) once their content has been acted on, so the issue tracker reflects actual open work rather than a running diary.

---

## Bottom line

- **4 launch blockers** stand between the site and going live (§2) — the biggest lift is #47 (content depth) and #745/#744 (image cleanup).
- **4 items only a founder can act on** (§3) — one is a live decision to make right now (#2316, the auto-merge gate).
- **13 real product/content features or fixes** are queued (§4), the largest being the Track Guide rebuild (#440) and the easter-egg rework (#445), both already fully spec'd.
- **6 automated content-quality queues** (§5) totaling 520 individual items need editorial review — no code work, just human judgment calls at scale.
- **6 security findings** (§6) — the standout is #1971 (zero human review currently required before content goes live).
- **The 4 open PRs** (§1): two have failing CI and need fixes, one is ready to merge now, one is a draft plan awaiting sign-off.
