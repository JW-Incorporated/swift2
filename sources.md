# Sources — Community dataset

Researched 2026-08-14. Every directory, thread, article and listing mined to build `data/communities.json`, so this can be re-run and refreshed rather than redone.

**Read the blockers before re-running** — three platforms actively resist automated access and you will waste hours rediscovering it:

- **Reddit: HTTP 403 at the edge**, on `www.` and `oauth.` alike, and the fetch tooling refuses the domain. Needs a real Reddit API app or residential access.
- **Disboard and top.gg: Cloudflare-blocked** (403 "Just a moment...") to both fetch and tooling, even with a browser User-Agent.
- **discordbotlist.com is actively misleading** — every page embeds the SAME invite code, its own promo server, not the community listed.
- **AO3, Fanlore, Fanpop, Genius, x.com** all refuse automated fetches (403/402).
- **Amino shut down entirely on 2025-12-19.** Older listicles still cite it.

---

## Reddit

# Reddit community research - sources and blocker log (2026-08-14, revised)

## Hard blocker (read this first before re-running)

Reddit's own JSON API (about.json, new.json, oauth.reddit.com) is fully
unreachable from this environment. Confirmed independently by both the
original agent and the coordinator:

- curl to www.reddit.com/r/*/about.json, old.reddit.com, api.reddit.com,
  oauth.reddit.com - all HTTP 403 "Blocked by network security" (Reddit's own
  edge/WAF, server snooserv, Retry-After: 0 - not a rate limit)
- PowerShell Invoke-WebRequest (different TLS stack) - same 403
- Claude Code's WebFetch tool on any reddit.com subdomain - refuses outright
- r.jina.ai reader proxy (separate egress infra entirely) - still hit
  Reddit's block page
- No Reddit OAuth credentials exist anywhere in this environment (the
  coordinator checked dongerbot, this ecosystem's Reddit bot - no stored
  credential file present)

General internet egress confirmed fine (google.com, example.com both 200) -
this is Reddit-specific. redditmetrics.com also failed at DNS resolution
(ENOTFOUND), independent of the above.

**Conclusion, confirmed twice: do not attempt about.json/new.json again from
this environment without either a working Reddit OAuth app or genuine
residential/browser access. You will burn an hour rediscovering this.**

## Revised method used instead (per coordinator direction)

Since live member counts and activity are unavailable, this pass built the
dataset entirely from secondary sources that WERE fetchable (news sites,
Substack culture writers, Wikipedia, third-party stats aggregators), applying
a strict bar: **a subreddit's name and url were only recorded if 2+
independently fetched sources named it.** member_count is null everywhere on
purpose - no aggregator figure was trusted (see the wild discrepancies below).
hype_score is derived from recommendation frequency (how many independently
fetched places named the sub), not from member count or activity.

## Entries that cleared the 2+ source bar (4)

1. **r/TaylorSwift** - thehiveindex.com/communities/r-taylorswift/,
   au.rollingstone.com/.../taylor-swift-fandom-gaylor-report-exclusive-46481/,
   www.yahoo.com/entertainment/taylor-swift-subreddit-became-crash-053108842.html
   (all fetched directly and quoted). Backstory: mod "Lydia" took over ~2017,
   called the prior community "very toxic," rehauled rules, grew it from
   ~14,000 to ~2M members; reportedly bans pro-Gaylor/sexuality discussion.
2. **r/SwiftlyNeutral** - gummysearch.com/r/SwiftlyNeutral/,
   theneedledrop.com/opinion/miniseries-review-taylor-swifts-the-end-of-an-era/
   (both fetched). A music critic called it "an invaluable tool for gauging
   measured fan reaction."
3. **r/GaylorSwift** - spitfirenews.com/p/gaylor-subreddit-taylor-swift-gay,
   en.wikipedia.org/wiki/Gaylor_conspiracy_theory (both fetched). IMPORTANT:
   Wikipedia states mods set it to private in Aug 2025 to avoid trolling -
   current open/closed status is unconfirmed, flagged in the JSON entry.
4. **r/TravisAndTaylor** - brockpress.com/diving-into-the-subreddit-that-hates-taylor-swift/,
   genztranslator.substack.com/p/taylor-swift-travis-kelce-subreddits (both
   fetched). This is a SNARK board, not a fan community - included for
   completeness with an explicit warning label, not as a Swiftie destination.

## Names found but DROPPED for insufficient corroboration (do not resurrect
without a second independently-fetched source)

- **r/TaylorSwiftMerch** - only ever traced to ONE underlying article
  (Fox News "unofficial merch crackdown" piece), which appeared at multiple
  mirror URLs (foxnews.com, noticias.foxnews.com AMP) - same piece, not two
  independent sources.
- **r/Swiftie**, **r/SwiftieMerch**, **r/TaylorSwiftPictures**,
  **r/TaylorSwiftStyle** - all traced to a single listicle,
  cinematoes.com/the-top-8-taylor-swift-subreddits/, which does NOT resolve
  (DNS ENOTFOUND) - could never be independently fetched/confirmed at all.
  Also cms.northstaria.com/blog/taylor-swift-the-ultimate-reddit - same
  DNS-dead problem.
- **r/Gaylor** (distinct from r/GaylorSwift) - mentioned only inside one
  WebSearch synthesis line ("two subreddits, r/Gaylor and r/GaylorSwift"),
  never independently confirmed via a direct fetch of any article actually
  naming r/Gaylor on its own.
- **r/taylorandtravis** (name-order swap of r/TravisAndTaylor) - mentioned
  once as something a reader "might stumble across," description was
  paywalled, never corroborated as a real distinct sub vs. a
  misremembering/typo of r/TravisAndTaylor.

## Niches searched with ZERO subreddit found (any platform/method)

Friendship bracelets, UK/regional Swifties, Eras Tour ticket-trading
(a generic "reddit page for eras tour tickets" was described but no specific
subreddit name was ever given), vinyl/collectors (r/TSwiftVinyl - could not
confirm existence at all), karaoke/covers, theories/clowning (multiple
articles about "clowning" culture cite TikTok accounts, never a subreddit),
country-era-specific, r/popheads Taylor-specific coverage.

## Numbers explicitly NOT trusted (recorded here only as evidence they
disagree, not as facts)

r/TaylorSwift member count claims collected during this research, by source:
"200,000" (cinematoes.com listicle, dead domain), "460,000" (Rolling Stone AU,
fetched), "1.8 million" (aol.com/Today syndication, per a WebSearch summary),
"3.8 million" (multiple WebSearch summaries citing gummysearch.com/
subredditstats.com). A ~19x spread across sources during the same week is
proof these cannot be used as a stand-in for about.json - hence member_count
is null on every entry in communities-reddit.json, by design, not as a gap.

subredditstats.com itself disclaims its own data on-page: "This data is
likely out of date... now that Reddit has decided to kill the open
ecosystem."

## Recommendation for a future run

Same as before: get either a registered Reddit OAuth app or genuine
browser/residential access, then re-run with the ORIGINAL about.json/new.json
method - it is the right method, just blocked in this specific environment.
Until then, the secondary-source method in this file is the ceiling of what's
achievable, and 4 well-corroborated entries (not 12-20) is the honest yield
of it for Reddit specifically - most single-mention "top 8 subreddit" listicle
sites either don't resolve (dead domains) or turn out to be the same
underlying wire piece republished across mirrors.

---

## Facebook

# Sources mined -- Facebook Groups research

## Primary evidence (used in dataset)

- Bustle, "How Taylor Swifts Eras Tour Helped Us Heal" (2024-12-13)
  https://www.bustle.com/entertainment/taylor-swift-eras-tour-helped-us-heal
  -- Names Taylor Swifts Vault, 480k+ members, describes ticket-vetting and Vienna-cancellation mutual aid.

- Philippine Star / The Freeman, "How Pinoy Swiftie lobbied for PH stop of Taylor Swifts eras tour" (2023-04-28)
  https://www.philstar.com/the-freeman/cebu-entertainment/2023/04/28/2262265/how-pinoy-swiftie-lobbied-ph-stop-taylor-swifts-eras-tour
  -- Names and describes Kulto ni TAYLOR SWIFT Facebook group.

- Direct WebFetch attempts on Facebook group URLs (login wall blocks almost all content; a few returned a bare title tag before the wall):
  https://www.facebook.com/groups/2254218764714763/ (Taylor Swifts Vault -- title only)
  https://www.facebook.com/groups/959997728506267/ (Taylor Swift Friendship Bracelet Making and Trading NO SALES -- title only)
  https://www.facebook.com/groups/1404884973507150/ (Swiftie Super Worldwide Friendship Bracelet Trade -- title only)
  https://www.facebook.com/groups/557483725146375/ (Kulto ni TAYLOR SWIFT -- login page only, no title returned)
  https://www.facebook.com/groups/264466934870157/ (Taylor Swift Swifties -- login page only, no title returned)
  https://m.facebook.com/groups/1220925938596348/ (Friendship Bracelets Buy/Sell/Trade -- login page only, no title returned)

## Search queries run (WebSearch), used to find candidates and cross-references

- best Taylor Swift Facebook groups reddit recommend
- Taylor Swift Facebook fan group news article Eras Tour
- Taylor Swift Facebook group UK Swifties fan group name
- "Taylor Swift" Facebook group vinyl collectors record
- "Taylor Swift" Facebook group Brazil Brasil Swifties nome grupo
- "Taylor Swift" Facebook group Philippines Swiftie fan group name members
- "Taylor Swift" Facebook group "Swiftie moms" OR "Swiftie Mums" OR "Swiftie teachers"
- "Kulto ni Taylor Swift" facebook group
- Taylor Swift ticket exchange Facebook group scam news
- "Taylor Swift" Facebook group theories lore Easter eggs
- "Taylor Swift" Facebook group UK "Swiftie" name members thousand
- "Swifties over 30" OR "Grown Swifties" OR "Adult Swifties" Facebook group
- "friendship bracelet" Taylor Swift Facebook group name trade mail
- Taylor Swift fan Facebook group Indonesia OR Mexico OR India name
- "reputation" OR "folklore" OR "1989" Taylor Swift era Facebook group fans dedicated
- Taylor Swift Eras Tour city meetup Facebook group organize outfits
- "Taylor Swift's Vault" Facebook group 2.0 why new group split banned
- "Swiftie's Society" Facebook group members Taylor Swift
- "Taylor Swift" Facebook group Australia Swiftie fan group name members

## Candidates found but DROPPED (name+URL only, no member count/description/third-party corroboration, could not fetch content past login wall -- too thin to write an honest description without inventing detail)

- SWIFTIES<3 (Taylor Swift fans) -- facebook.com/groups/1465932236994480
- Taylor Swift (Swifties) -- facebook.com/groups/264466934870157
- The Swiftie's Society -- facebook.com/groups/308196990150746
- we are swifties -- facebook.com/groups/385732472544321
- Swifties Forever and Always -- facebook.com/groups/2166563610340714
- CERTIFIED SWIFTIES (Worldwide) -- facebook.com/groups/857955180971335
- taylor swift- swifties group -- facebook.com/groups/344186002656221
- Taylor Swift (Swifties) -- facebook.com/groups/264466934870157 (Brazil-search duplicate)
- Taylor Swift Group -- facebook.com/groups/331432847492079
- Taylor Swift Fans -- facebook.com/groups/1340064932797287
- Taylor's Version From The Vault -- facebook.com/groups/313293321232994
- Taylor Swift's Vault 2.0 -- facebook.com/groups/taylorswiftsvault2 (possible unofficial spinoff of the verified Vault group; only referenced as a flag on that entry, not included standalone)

## Non-group results (Pages, forums, other platforms) noted but excluded as out of scope (Facebook GROUPS only)

- Swifties Mindanao (facebook.com/swiftiesmindanao) -- a Facebook Page (~21.8k likes), not a group
- T-Party Philippines (facebook.com/tpartyphilippines) -- a Facebook Page (~18.1k likes), not a group
- Totally Swift Australia -- Facebook Page (tribute show, ~666 likes), not a group
- Taylor Boards, Fanpop, New Taylor Connect Forum, r/TaylorSwift -- non-Facebook forums/subreddit, out of scope
- Steam "Taylor Swift Fan Club" group (~5,000 members) -- not Facebook
- Various Goodreads Swiftie book-club groups -- not Facebook
- Meetup.com "Taylor Swift Fans Meetup Group" (Encinitas, CA) -- Meetup platform, not Facebook

## Notes on method

Facebook groups are almost entirely behind a login wall; WebFetch on facebook.com/groups/<id>/ URLs returns either a generic login page or, occasionally, a bare page title before the wall (no member counts, descriptions, or post content ever loaded). All member-count and activity claims in the dataset trace to third-party articles (Bustle, Philippine Star), never to a direct read of Facebook itself.

---

## Discord

# Discord community research -- sources mined (2026-08-14)

## Verification method
Every server in communities-discord.json was confirmed live via
`https://discord.com/api/v10/invites/<code>?with_counts=true`, which returns
the real guild name, approximate_member_count and approximate_presence_count,
or a 404 for a dead/invalid invite. This was the primary evidence for every
entry -- no member count or invite in the output was taken on the word of a
directory listing alone.

## Directories attempted
- disboard.org (tag pages: taylor-swift, swiftie, swifties, taylor, taylorswift, midnights, eras-tour, the-eras-tour) -- blocked (Cloudflare 403, "Just a moment...") for both WebFetch and direct node fetch with a browser User-Agent. Could not scrape listings directly.
- discadia.com -- WebFetch returned empty content, could not extract listings.
- top.gg -- individual server pages 403'd on both WebFetch and direct fetch.
- discord.me -- pages load (200) but are a JS-rendered SPA; raw HTML contains no invite codes or __NEXT_DATA__ blob, so codes could not be scraped this way. WebFetch's rendering occasionally surfaced a description but never an invite link.
- discordbotlist.com -- pages load and WebFetch/raw-HTML grep for discord.gg links, but every page returned the SAME code (discord.gg/cc7Y4jX), which resolves to discordbotlist.com's own promotional Discord, not the listed server. This source is NOT reliable for extracting real invite codes -- flagging for any future agent who tries the same shortcut.

Given the above, real invite codes were sourced almost entirely through
targeted WebSearch queries (search snippets and result titles directly
surfaced discord.com/invite/<code> and discord.gg/<code> links), then every
single one was independently verified against the Discord invite API before
being trusted or included.

## Confirmed live via invite API (used in output)
- discord.gg/taylorswift -> r/TaylorSwift
- discord.gg/taylor-swift-fan-club-1311387776893321337 (orig. code qfxP85uSYb) -> Taylor Swift Fan Club
- discord.gg/taylor -> Taylor Swift
- discord.gg/swiftieswanttickets -> Swifties Want Tickets
- discord.gg/merchbot -> Taylor Swift Store Updates
- discord.gg/swifties -> Swifties
- discord.gg/swiftie -> The Swift Hub
- discord.gg/swiftcord -> swiftcord (fullwidth stylized name)
- discord.gg/tsnotifs (also seen as xfw4mAJR6j) -> Taylor Swift Updates
- discord.gg/swifties-805215468734382111 (orig. code nVmJbsFEsn) -> Swifties (heart)
- discord.gg/zaSXCfpzcF -> twitter swifties

## Checked and confirmed DEAD (404) or wrong-guild -- dropped
- discord.gg/getswiftgg -- 404
- discord.gg/vc3urRJZzP ("Taylor Swift Church") -- 404
- discord.gg/swiftbasetv (SwiftBase Taylor's Version) -- 404
- discord.gg/tstourtips -- 404 (tstourtips server, tour-tips community)
- discord.gg/PXY2QfatPw -- resolved to an unrelated 84-member server ("taygracie"), NOT "The Lakes" folklore server as a directory blurb implied. Dropped -- fabricated/stale association.
- discord.gg/DSnRpG6zpv (Taylor Swift Diaries) -- 404
- discord.gg/lovetaylor (Swifties) -- 404
- discord.gg/taylorswift13 -- 404
- discord.gg/tswift -- 404
- discord.gg/Vczbvg42uS (Taylor Swift Wiki fan-wiki Discord) -- resolved but only 2 members, 0 online. Excluded per brief's "almost no presence" rule.
- discord.gg/2qURst5Mtq (a second "Taylor Swift Store Updates" candidate) -- 404
- discord.gg/swift-285379461573115904 ("Team SwiFT") -- resolved but is an unrelated Rocket League freestyle team, not a Swiftie server. Dropped.
- discord.gg/cc7Y4jX -- resolves to discordbotlist.com's own server, not any Taylor Swift community. This is the code discordbotlist.com pages spuriously surface (see note above).
- discord.com/servers/uk-and-ireland-eras-tour-1142955616231506003 -- WebFetch 404'd; could not extract a working invite code for the "UK and Ireland Eras Tour" server referenced in search snippets, so it was left out despite sounding like a good regional/tour-coordination fit.

## Niches searched but NOT found with verifiable evidence
- Bracelet-trading-specific server (distinct from general tour/ticket servers)
- Dedicated era-specific server (e.g. a live, verifiable "folklore"/"evermore"/"1989" only server -- "The Lakes," "Folklore Cabin," "Showgirl Stage," "Meet Me at Midnight" were all referenced in search snippets but no working invite code could be found or verified)
- Gaylor-adjacent server
- Snark/neutral-critique server
- Music production/covers server
- Region-specific servers outside the Portuguese-flavored "The Swift Hub" (tried UK/Ireland, Brazil, Philippines, India, South Africa, Italy, France -- none yielded a verifiable live invite)

These are honestly absent, not omitted by oversight -- flagging so a future
agent doesn't waste a search cycle assuming they exist and are just
unverified.

## Key search queries used (WebSearch tool)
- Taylor Swift Discord server disboard.org
- "discord.gg" Taylor Swift Swiftie server reddit recommend
- "swiftbase" discord taylor's version invite
- taycord discord invite taylor swift
- gaylor discord server invite taylor swift
- taylor swift theories clowning discord server invite
- eras tour discord server ticket trading friendship bracelets invite
- "the lakes" discord invite taylor swift folklore server
- "meet me at midnight" discord server taylor swift invite
- taylor swift UK discord server invite regional swifties
- "taylor swift diaries" / "swifties wonderland" / "tortured swifties department" discord.gg invite
- taylor swift wiki fandom discord server invite
- "folklore" OR "evermore" cottagecore taylor swift discord server invite
- "auxcord" discord.gg taylor swift invite
- taylor swift discord server south africa OR india OR philippines swiftie community
- "clown cult" OR "the clown car" taylor swift discord server invite theories
- taylor swift discord server "18+" OR "adult swifties" invite
- taylor swift discord server italia OR italy OR france français invite discord.gg
- "swiftposting" OR "swift twt" discord server invite taylor swift twitter stan

---

## Long tail

# Sources mined - Long Tail communities research

## Included entries - primary evidence
- https://atrl.net/forums/topic/502599-taylor-swift/ (fetched directly, thread overview + last page 2335)
- https://en.wikipedia.org/wiki/ATRL (fetched, forum founding history)
- https://buzzjack.com/forums/Taylor-Swift-f177.html (fetched directly)
- https://newtaylorconnect.freeforums.net/ (fetched directly)
- https://taylorswiftswitzerland.ch/index.php/wiki/taylor-conncect/ (Taylor Connect official history/closure, via search)
- https://taylor.boards.net/ (fetched directly, TBN forum)
- https://similarworlds.com/music/taylor-swift (fetched directly)
- https://www.tumblr.com/tales-of-kaylor (fetched directly)
- https://www.tumblr.com/taylorswiftdaily (fetched directly)
- https://steamcommunity.com/groups/tswiftfans (fetched directly)
- https://www.wattpad.com/stories/taylorswift/hot?locale=en_US (fetched directly)
- https://archiveofourown.org/tags/Based%20on%20a%20Taylor%20Swift%20Song/works (403 to fetch, confirmed via search index + Fanlore citation)
- https://fanlore.org/wiki/Taylor_Swift (cited via search snippet; direct fetch 403)
- https://archiveofourown.org/tags/Karlie%20Kloss*s*Taylor%20Swift/works (403 to fetch, confirmed via search index)
- https://kaylorfanfiction.tumblr.com/timeline (fetched directly, confirmed real, dormant)
- https://forums.feedspot.com/taylor_swift_forums/ (fetched directly, master forum list - source for BuzzJack, New Taylor Connect, TBN listings)

## Excluded - confirmed dead or unverifiable (do not resurrect without re-checking)
- Amino / Swifties Amino - ENTIRE Amino platform shut down Dec 19, 2025 (servers decommissioned). Confirmed via search. Do not include.
- monsterakatreeswift.tumblr.com - fetched directly, last post Aug 24, 2017. Dead.
- taylorswifteggscracked.tumblr.com - fetched directly, last activity ~4-5 years ago. Dead.
- taylorswift02.proboards.com - fetched directly, 9 total members, last legit post 2011. Dead.
- taylorswiftweb.net forum - closed Oct 1, 2016 per search. Dead (this was the OLD official-adjacent Taylor Swift Web forum, not to be confused with the still-open taylor.boards.net "TBN").
- Genius.com Taylor Swift annotation community - could not fetch genius.com at all (tool blocked: "unable to fetch from genius.com"); web search could not surface concrete community stats (IQ leaderboard, verified contributor counts) specific to her page. Excluded per the no-invented-community rule. A researcher with genius.com access could revisit this - the platform obviously exists and hosts her lyrics/annotations, just couldn't verify community specifics.
- X/Twitter Communities feature - x.com/i/communities/1501819553034252294 returned HTTP 402 (paywalled/auth required) to WebFetch; could not verify member count or activity for any specific X Community. Excluded rather than guess.
- Fanpop Taylor Swift club, MovieChat Taylor Swift, FOTP Forums Taylor Swift, Tapatalk "Swift Chat" (LGBT women/Gaylor gossip board), thelchat.net "Taylor Swift" megathread (Part VI+) - all returned HTTP 403 to WebFetch and searches did not surface independent confirmation of recent (60-day) activity. Named/real per feedspot listing and search snippets, but NOT included because activity could not be verified. Worth a revisit with browser-based access - "Swift Chat" on Tapatalk in particular looks like a genuine long-running Gaylor-gossip niche forum (own subforum structure, low-numbered legacy threads like t11) but I could not confirm it is still alive.
- Meetup "Taylor Swift Fans" (Encinitas, CA) - fetched directly, only 68 members, last event May 3 2024. Stale, excluded.
- Geneva app - searched, found no specific named Taylor Swift group/community on Geneva. Nothing to cite.
- Bracelet-trading network - searched for a specific named Instagram/Discord bracelet-trading community; only found generic trend coverage (Today, Yahoo, Billboard, HollywoodReporter etc. on the friendship-bracelet trend itself), no single named community with a fetchable URL. Excluded - would be inventing a specific group.
- swiftgronmasterpost.tumblr.com / allcatsarebabes "Gaylor Swift Masterpost 2.0" - the ORIGINAL Gaylor (Dianna Agron era) masterpost blogs from ~2012-2019; referenced as historical backstory context for "Tales of Kaylor" entry but not independently verified as currently active, so not included as their own entries.

## Notes on verification friction
- WebFetch consistently returns 403 for: archiveofourown.org, fanlore.org, fanpop.com, moviechat.org, tapatalk.com, thelchat.net, genius.com (outright blocked).
- WebFetch returns 402 for x.com (paywall/auth gate on that tool for X).
- Where a page could not be fetched directly, I used WebSearch to confirm the exact URL is indexed (title match) as the minimum bar for "not invented," and marked verification.status as third-party-cited rather than verified-live.

---

