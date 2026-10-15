# Research: why Facebook Discord cards have no link (read-only)

**Trap:** local `main` (af1b68d9c, 2026-10-04) is stale. `origin/main` is dc091aecf (2026-10-14). Refs marked (origin) come from `git show origin/main:<path>`. Local-tree reads of fb-export-ingest.mjs:210 and awareness-facebook.mjs:41 show pre-fix code.

## Root cause (high confidence)
Facebook hot_thread leads reach Discord through TWO paths. The fix for the owner's complaint (PR #5316, merged 2026-10-08; closes issues #5011, #5013, #5015) covers only one of them.

1. Community Tasks mailer path (Reddit-style card with thread link + draft): community-mailer.yml -> mailer.mjs -> reply-opportunity.mjs buildReplyOpportunity.
   - reply-opportunity.mjs:125 (origin): `threadLinkLine(lead.url)`. For a Facebook lead with url null, urlLine(null) returns null, so the link line is silently dropped. No Facebook fallback on this path.
   - mailer.mjs:120-123 (origin): destinationLine prints `Facebook · <locator>` as plain text, no anchor.
   - PR #5316 did NOT touch reply-opportunity.mjs or mailer.mjs (verified: gh api repos/JW-Incorporated/swift2/pulls/5316/files).
2. Awareness lane (awareness-deliver.mjs -> awareness-message.mjs): fallback exists here. awareness-message.mjs:109-110 (origin): `(lead.url && urlLine(...)) || (facebook && facebookFallbackLine(lead)) || locator`. facebookFallbackLine (awareness-fb-link.mjs, new in #5316) builds a group link plus search link from data/communities.json or the fb-groups-checklist groupId; returns null if the group URL is unknown.

## Where the Facebook link is created or dropped
- Parser: apps/worker/src/sources/facebook-groups-parser.ts (origin) extractPermalink (~173-200) reads href from the RAW article block (/posts/, /permalink/, story_fbid), facebook.com host only. Stored on each post at line 244.
- Ingest: scripts/community/fb-export-ingest.mjs:210 (origin) `url: post.permalink ?? null`. Local tree still has `url: null` (stale).
- Screening keeps the field: fb-export-ingest.mjs ~236-240 (origin) filters posts, does not remap them.
- Backfill for existing rows: fb-export-ingest.mjs ~254-266 (origin) backfillLeadUrl, only when stored url is null and thread_id is null. Re-run path: fb-lead-reingest.mjs:113.
- Leads created before 2026-10-08 keep url null unless re-ingested. The export is a manual Joey upload plus fb-export runs, not CI.

Reddit comparison (field names only): Reddit row = platform 'reddit', community = subreddit, thread_id = post.id, url = post.permalink, title set (scripts/community/awareness-rows.mjs:16-23). Facebook row = platform 'facebook', community 'facebook:<slug>', kind 'hot_thread', thread_id null, url (hard null before the fix), title null, locator '<group> — <excerpt>' (fb-export-ingest.mjs ~203-222 origin).

## When it broke / history
- 2026-10-01 #4743 (9b08ea6c1) introduced awareness cards. 2026-10-04 #4885 scrub commits (6e2701258, babc54b35) touched FB lead rows.
- Issues: #5011 (2026-10-04, Tree->Marjorie), #5012, #5013 (P1, "engagement_lead.url is null"), #5015 (group link). #5013 was closed 2026-10-08 by PR #5316.
- The owner's report is not explained by a missing fix alone: #5316 fixed the awareness path, not the mailer path.

## Recent runs (gh, live)
- community-awareness-deliver: last 10 runs = 9 skipped, 1 success (2026-10-12 11:22, "0 drafted, delivered 0"). Gated by workflow_run on routine-awareness-answerer conclusion == success (community-awareness-deliver.yml:17-31).
- routine-awareness-answerer: last success 2026-10-12 11:19Z; all runs since (5 most recent, through 2026-10-14 21:56Z) failed. Log: "prompt_file 'docs/agents/runner-prompts/awareness-answerer.md' does not exist in this checkout" and "result reported subtype success with is_error:true". The file exists on origin/main, so the run probably used an older SHA (UNVERIFIED).
- community-mailer (daily, Discord): 34 successes 10-02..10-14. "delivered N prompt(s)" only on 10-02, 10-03, 10-04, 10-05, 10-06, 10-10, 10-11. Since 10-12 every run says "no drafted leads to mail". Logs do not show platform, so whether any prompt was Facebook is UNVERIFIED. Ids in scratchpad mailer-ids.txt.
- Net: no awareness cards since 10-12 and no mailer cards since 10-11. Facebook cards are rare and were last sent via mailer around 10-11.

## Fix I would make (not made)
Smallest: in reply-opportunity.mjs buildReplyOpportunity, when lead.platform === 'facebook' and !lead.url, use facebookFallbackLine(lead) (already exported from awareness-fb-link.mjs) in place of the null threadLinkLine; in mailer.mjs destinationLine make the Facebook label link to the same group URL. Add a reply-opportunity test. Then confirm the export HTML yields permalinks and re-run fb-lead-reingest so pre-10-08 rows backfill.

## Traps
- Local checkout is 10 days stale. Pull --ff-only before trusting any FB code read here.
- Two Discord renderers (awareness-message.mjs vs reply-opportunity.mjs); a fix in one does not reach the other.
- The url backfill is keyed on locator+kind, so a changed excerpt creates a new row.

## Open questions / UNVERIFIED
- Whether real Facebook "Webpage, Complete" exports contain /posts/ or story_fbid hrefs inside article blocks. No fixture with real HTML found; not verified. If not, url stays null and the group fallback is the only link.
- Live DB contents (engagement_lead.url for facebook rows) not queried.
- Why answerer runs fail on a file that exists on origin/main (probable stale SHA).
- Which mailer prompts on 10-02..10-11 were Facebook.
- Owner's "Discord cards": assumed the mailer path. Owner should confirm which card/channel.
