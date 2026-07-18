# News source research for the Long Live ingestion worker

**Status:** Research and source recommendation; no implementation is included  
**Researched:** 2026-07-18  
**Related architecture:** [2026-07-07 news pipeline architecture](./2026-07-07-news-pipeline-architecture.md)

## Executive summary

Long Live can cover media reporting, fan discussion, and Taylor's own
announcements without another paid subscription. The cleanest initial mix is:

- five publisher-operated RSS feeds plus Google News RSS as a discovery-only
  backstop;
- Taylor Swift's and Taylor Nation's official Tumblr blogs plus Taylor's
  YouTube upload feed; and
- Tumblr's tagged timeline for fan discussion, with Bluesky public search as
  an optional second open-social signal.

Reddit should **not** be treated as a frictionless free v1 dependency. Eligible
free API clients receive a generous 100 queries per minute, but Reddit now
requires an access request, limits ordinary free use to noncommercial uses, and
requires deletion and attribution behavior that conflicts with indefinite
retention in `news_raw_item`. A `script` OAuth application is the right client
type for an owner-run cron job; it is not an exemption from those rules or from
the 2023 API policy changes.

X does not require a separate search application or a separate "search tier."
The existing Long Live X project can use recent search, but X's current
self-service model is pay per resource: reading a post costs $0.005. Filtered
stream is also paid and requires a persistent connection, so it is a poor fit
for the one-shot hourly worker.

Instagram is conditionally usable for Taylor's and Taylor Nation's accounts.
Meta Business Discovery can read media from another Business or Creator
account through Long Live's linked professional account. It cannot read an
arbitrary personal/consumer account, and the existing app still needs a live
permission/App Review preflight. The existing posting token is not blanket
access to all public Instagram accounts.

TikTok has no practical, compliant public-account or keyword ingestion route
for this project. Its Display API reads the authorizing user's own videos, its
searchable Research API is for qualifying not-for-profit researchers, and its
consumer terms prohibit automated collection. Do not use an unofficial scraper.

## Non-negotiable content and credibility rules

Every source below is subject to the architecture's hard rule: persist only a
title, a short publisher/platform-provided snippet, the source's canonical URL
or platform permalink, timestamps, and small metadata. In particular:

- discard RSS `content:encoded`, full HTML bodies, Tumblr NPF bodies, Reddit
  `selftext` and comments, full Instagram captions, transcripts, and article
  text;
- truncate the selected snippet to the schema's 2,000-character ceiling before
  writing `raw_payload`; do not hide a full body inside JSON;
- never fetch an article for the purpose of copying its body and never rehost
  publisher or social images;
- use a platform permalink as the canonical URL for a social discussion item;
  treat any article linked from that post as a separate candidate source; and
- one `established` tabloid report is still a single-source report. A source
  tier describes the publisher, not the truth of every claim it publishes.

The proposed tier enum is deliberately coarse. TMZ, Page Six, and E! are
professional publishers rather than open social, so `established` is the best
available value, but their rumor-heavy items should remain `single_source` or
`rumor` until independently corroborated. Two brands repeating the same wire,
exclusive, or corporate-sibling report are not independent corroboration.

## 1. Media coverage

### Qualified publisher feeds

These are publisher-hosted endpoints that were still represented by current
items in a feed reader or current feed consumer on 2026-07-18. The reader links
are validation evidence only; the worker should call the publisher URL directly.

| Source | Feed URL and live check | `source_type` | Cost | `tier` | Hourly-cron and content notes |
|---|---|---:|---:|---:|---|
| Variety | [`https://variety.com/feed/`](https://variety.com/feed/) ([current feed view](https://feeder.co/discover/b36018dfed/variety-com)) | `rss` | $0 | `established` | High-volume general entertainment feed. Apply Taylor relevance before storing; use conditional GET and ignore the full-content field. |
| Rolling Stone — Latest Music News | [`https://www.rollingstone.com/music/music-news/feed/`](https://www.rollingstone.com/music/music-news/feed/) ([current feed view](https://feeder.co/discover/e77a32acbe/rollingstone-com)) | `rss` | $0 | `established` | Better signal-to-noise than the site-wide feed. Paywalled articles are still usable as title/snippet/link records. |
| Billboard | [`https://www.billboard.com/feed/`](https://www.billboard.com/feed/) ([current feed view](https://feeder.co/discover/bb69bf18e7/billboard-com)) | `rss` | $0 | `established` | High volume and includes commerce posts. Filter before insert and never ingest `content:encoded`. |
| TMZ | [`https://www.tmz.com/rss.xml`](https://www.tmz.com/rss.xml) ([current consuming page](https://evhomepage.com/), [2026 feed directory](https://feed.mikle.com/support/rss-feed-sources-online-news-sites/)) | `rss` | $0 | `established` | Celebrity-breaking-news coverage, but rumor risk is higher. Do not let one TMZ item alone become `corroborated`. |
| Page Six | [`https://pagesix.com/feed/`](https://pagesix.com/feed/) ([current feed view](https://feeder.co/discover/77ed4079f7/pagesix-com)) | `rss` | $0 | `established` | High volume and rumor-heavy. Preserve Page Six as the source even when the item cites an unnamed insider. |
| Deadline | [`https://deadline.com/feed/`](https://deadline.com/feed/) ([current feed view](https://feeder.co/discover/c30a8a1d4e/deadline-com)) | `rss` | $0 | `established` | Strong entertainment-trade coverage, but lower Taylor frequency. Site-wide polling is still cheap; filter locally. |
| E! Online — Top Stories | [`https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml`](https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml) ([current feed view](https://feeder.co/discover/7a1c56ea7a/eonline-com)) | `rss` | $0 | `established` | The feed currently resolves under E!'s syndication host. Treat insider/wedding/relationship claims conservatively. |
| Entertainment Tonight — News | [`https://www.etonline.com/news/rss`](https://www.etonline.com/news/rss) ([current feed view](https://feeder.co/discover/20143ff336/etonline-com-news)) | `rss` | $0 | `established` | General celebrity feed. Cap entries per cycle, because an hourly run only needs items newer than the prior watermark. |

All eight feeds need the same operational defenses: a descriptive User-Agent,
10–15 second timeout, a small retry budget, `ETag`/`Last-Modified` support,
deduplication by stable GUID plus canonical URL, and an entry cap. An HTTP 200
is not enough to enable a feed: the worker's source preflight should also parse
RSS/Atom and find at least one plausible recent item.

### Major outlets without a production-qualified native feed

| Outlet | Finding as of 2026-07-18 | Recommendation |
|---|---|---|
| People | `https://people.com/feed/` appears in third-party directories, but current feed discovery describes People as having **no native RSS** and generates entries from its sitemap ([FeedBagel](https://feedbagel.com/site/people.com)). A current Feeder view also does not establish that its entries come from a People-operated RSS endpoint. | Do not enable the guessed URL or a third-party synthetic feed. Use a site-restricted Google News query and require the resolved canonical host to be `people.com`. |
| Entertainment Weekly | Current directories list `https://ew.com/feed/`, and one current directory exposes a Dotdash Meredith feed host ([Feedspot, updated July 2026](https://rss.feedspot.com/entertainmentweekly_rss_feeds/)), but this research could not independently fetch the publisher endpoint or show fresh items from that exact URL. | Keep it disabled until the implementation preflight gets valid RSS/Atom and a recent `ew.com` item. Use site-restricted Google News meanwhile. This is intentionally not called a live feed. |
| Associated Press / Reuters | Neither provides a Taylor-specific public feed suitable for this worker. Old RSS lists and unofficial wrappers are not a supported publisher API. | Use Google News discovery with `site:apnews.com` or `site:reuters.com`, resolve to the publisher URL, and retain the normal `established` source only after a host match. |
| Republic Records | The current root site is an ecommerce storefront rather than a press/news service ([Republic Records](https://www.republicrecords.com/)). There is no verified Republic-operated public RSS feed. | Rely on Taylor Nation, Taylor's official channels, UMG, and established-media coverage. PR Newswire's [Republic Records release page](https://www.prnewswire.com/news/republic-records/) can be reviewed later, but it is not a Republic RSS endpoint. |

This conservative treatment matters because accepting a plausible WordPress
`/feed/` path without a parse-and-freshness check is exactly how a dead or
synthetic source gets mislabeled as working.

### Google News RSS fallback

Use the public search feed as a catch-all discovery adapter:

```text
https://news.google.com/rss/search?q=%22Taylor%20Swift%22%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen
```

For a missing publisher feed, narrow it:

```text
https://news.google.com/rss/search?q=%22Taylor%20Swift%22%20site%3Apeople.com%20when%3A7d&hl=en-US&gl=US&ceid=US%3Aen
https://news.google.com/rss/search?q=%22Taylor%20Swift%22%20site%3Aew.com%20when%3A7d&hl=en-US&gl=US&ceid=US%3Aen
```

Google documents topic and publisher search behavior, but not this RSS surface
as a supported developer API with a rate-limit or uptime SLA ([Google News
search help](https://support.google.com/googlenews/answer/9005601?hl=en)). The
endpoint remains widely usable in 2026, including `when:` and `site:` query
operators ([current 2026 behavior and limitations](https://cloro.dev/blog/google-news-rss/)).

Recommended source modeling:

- General Taylor query: `source_type = rss`, cost `$0`, `tier = unverified`.
  It mixes publishers, blogs, spam, and syndication and must not add
  `established` corroboration by itself.
- A fixed, site-restricted query may inherit that publisher's tier only after
  resolving the result and verifying the canonical hostname. If host resolution
  fails, leave the item internal/discovery-only.
- Preserve Google News's `<source>` value as discovery metadata, but do not
  treat a display label as a verified publisher identity.

Google News item links are often Google redirect/opaque URLs rather than the
publisher canonical URL. Resolve the redirect and, where necessary, the
publisher's canonical metadata without retaining the page body. If the worker
cannot establish a publisher URL, it should not serve that item as a canonical
story source. Poll one query once per hour, cache the response, and back off on
429/5xx; there is no published quota to consume up to.

## 2. Fan discourse

### Platform comparison

| Platform / source | Practical endpoint | `source_type` | Realistic cost | `tier` | Recommendation and hourly gotcha |
|---|---|---:|---:|---:|---|
| Reddit submissions from selected subreddits | OAuth listings such as `https://oauth.reddit.com/r/TaylorSwift/new?limit=100` | `reddit` | $0 only for approved, eligible noncommercial use; commercial terms are negotiated and have no public price | `fan` | Technically easy at hourly cadence, but approval, commercial-use, deletion, attribution, and data-sharing gates make it conditional. Do not scrape unauthenticated `.json` or use RSS to evade the API rules. |
| X recent search | `GET /2/tweets/search/recent` with `since_id` | `x` | $0.005 per post returned; $0.010 per user resource | Exact official accounts: `official`; curated fan accounts: `fan`; broad keyword search: `unverified` | Same app/project can search; no separate search tier. Requires prepaid credits and a spend/result cap. Use recent search, not a stream, for the one-shot worker. |
| X filtered stream | `GET /2/tweets/search/stream` | `x` | Same pay-per-use resource charges | Depends on rule | One connection and 1,000 rules are available on pay-per-use, but the persistent connection conflicts with an hourly start-run-exit process. Exclude from this architecture. |
| Tumblr tagged timeline | `GET https://api.tumblr.com/v2/tagged?tag=taylor%20swift&before=...&limit=20&api_key=...` | `tumblr` | $0; free API key | Broad tag: `unverified`; explicitly selected fan blog: `fan` | This is a tag timeline, not full-text search. Poll exact tag variants, paginate by `before`, collapse reblogs, honor removals, and retain only a short generated snippet plus permalink. |
| Bluesky public search (optional) | `GET https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=%22Taylor%20Swift%22&sort=latest&limit=100` | `bluesky` | $0; no auth | Broad search: `unverified`; selected fan account: `fan` | Public AppView is cached and has generous, unspecified read limits. Save the cursor, respect moderation labels and deletions, and expect search completeness/ranking to evolve. |
| TikTok public/hashtag search | None available to this use case | `tiktok` | N/A | Broad fan search would be `unverified`; official account would be `official` | Exclude. Display API requires the creator to authorize the app; Research API eligibility does not fit Long Live; unofficial scraping violates the consumer automation restriction. |

### Reddit: technically cheap, contractually conditional

Reddit's [Data API Wiki, updated May 11,
2026](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
requires registered OAuth, a unique descriptive User-Agent, and an access
request. Unauthenticated traffic is blocked. Eligible free clients receive
**100 queries per minute per OAuth client ID**, averaged over a 10-minute
window. Two or three subreddit listing calls per hour are far below that limit.

Recommended initial rows if the compliance gate is cleared:

| Subreddit | `source_type` | `tier` | Use |
|---|---:|---:|---|
| `r/TaylorSwift` | `reddit` | `fan` | Largest general Swiftie discussion signal; submissions only for v1. |
| `r/GaylorSwift` | `reddit` | `fan` | Distinct fan-theory community. Treat every uncorroborated claim as rumor regardless of engagement. |
| `r/SwiftlyNeutral` (optional) | `reddit` | `fan` | Adds a critical/neutral discourse lens; do not interpret sentiment as factual verification. |

Important terms consequences:

1. **A script app does not avoid pricing policy.** It is simply the correct
   confidential-client form for a script acting as the account that owns it.
   Free eligibility comes from Reddit's approved use, not the OAuth app type.
2. **Commercial use is not included by default.** Reddit's [Developer Terms,
   revised March 24, 2026](https://redditinc.com/policies/developer-terms)
   prohibit use by/on behalf of a business or as part of a monetized product
   without written approval and a separate agreement. If Long Live carries
   ads, affiliate revenue, subscriptions, or is operated as a business, obtain
   Reddit's written commercial terms before enabling the adapter.
3. **Deletion conflicts with indefinite raw storage.** Reddit requires deletion
   of a removed post's title, body, embedded URLs, and deleted-account identity;
   it recommends routinely deleting stored user data/content within 48 hours.
   A Reddit adapter therefore needs a 48-hour recheck/TTL and tombstone path.
   Do not assume that `news_raw_item` can retain a Reddit title forever.
4. **Attribution is mandatory.** Any surfaced Reddit user content needs its
   Reddit permalink, the username while the account exists, and a clear Reddit
   attribution.
5. **Do not send Reddit payloads to the hosted LLM path without approval.** The
   terms prohibit using Reddit data to train AI without permission and restrict
   third-party sharing. Classification inference is not model training, but
   transmitting user content to another provider is still a separate data
   disclosure. Keep Reddit classification rule-based unless Reddit's approval
   and a legal/terms review explicitly cover that transfer.

This means Reddit can be a useful v1.1 adapter, but it should be represented as
disabled configuration until the access purpose, commercial status, and
retention behavior are approved.

### X: reuse the app, pay for reads

The repository already records a Read+Write X application and OAuth 1.0a
credentials for `@longlivetscom` ([growth agent notes](../agents/growth.md));
the current posting integration calls `POST /2/tweets`
([platform adapter](../../scripts/social/lib/platforms.mjs)). X's [recent-search
documentation](https://docs.x.com/x-api/posts/search/introduction) makes the
last seven days available to all developers, with up to 100 posts per request.
It does not require a separate search tier or a new developer app. Use the same
project/app and add/use its Bearer token if the worker's chosen authentication
flow needs it.

Current self-service [X API pricing](https://docs.x.com/x-api/getting-started/pricing)
has no subscription or minimum spend:

- post read: **$0.005 per returned post**;
- user read: **$0.010 per returned user**;
- reads of the same resource are generally deduplicated for billing within the
  same UTC day, although X describes that as a soft guarantee; and
- pay-per-use is capped at two million post reads per monthly billing cycle,
  after which Enterprise is required.

At a hard cap of 10 new general-search posts per hour, the maximum post-read
cost is about **$1.20/day or $36/month**. At 100 per hour it is about
**$12/day or $360/month**, before any user reads. Exact-account queries for
`from:taylorswift13 OR from:taylornation13` would be far cheaper because those
accounts post infrequently.

The [current rate-limit table](https://docs.x.com/x-api/fundamentals/rate-limits)
allows recent search at 450 requests per app per 15 minutes and 300 per user per
15 minutes, so request rate is not the constraint; billing is. Persist
`since_id`, request only the necessary fields, cap returned resources, avoid
user expansions, and configure a Developer Console spend limit. Filtered stream
permits one pay-per-use connection and 1,000 rules, but its persistent HTTP
connection ([filtered-stream docs](https://docs.x.com/x-api/posts/filtered-stream/introduction))
does not fit GitHub Actions cron.

### Tumblr: a useful free tag timeline

Tumblr has a real tagged-post method but no general public full-text search API.
The official client exposes `taggedPosts(tag, options)` ([Tumblr.js
documentation](https://tumblr.github.io/tumblr.js/)). Registering an app yields
a free consumer/API key. Tumblr's [current developer resource
page](https://help.tumblr.com/knowledge-base/developer-resources/) lists default
limits of **1,000 calls/hour per key and 5,000/day per key**. Even four tag
variants plus two official blogs every hour use only 144 calls/day before
pagination.

Recommended behavior:

- poll `taylor swift` and `taylorswift` separately; tags are exact enough that
  variants matter;
- use timestamp-based `before` pagination and stop at the prior watermark;
- use post ID as `external_id` and `post_url` as the canonical permalink;
- collapse reblogs so one post does not look like independent corroboration;
- do not persist the full NPF content array or legacy body; derive and store a
  short plain-text snippet only; and
- give the open tag row `unverified`. Only a specifically approved fan blog gets
  `fan`.

### TikTok: no viable ingestion adapter

TikTok's [Display API](https://developers.tiktok.com/doc/display-api-overview/)
can list recent videos for a creator who logs in and grants `video.list`; it is
not an arbitrary-public-account reader. Taylor or Taylor Nation would have to
authorize Long Live's app.

The [Research API](https://developers.tiktok.com/doc/research-api-codebook/)
does support public video, user, hashtag, and comment research, but eligibility
is for qualifying researchers conducting not-for-profit research. A fan-news
product ingestion worker is not a defensible fit. Finally, TikTok's [U.S.
consumer terms](https://www.tiktok.com/legal/page/us/terms-of-service/en)
prohibit automated scripts that collect information or otherwise interact with
the service. Do not use browser automation, HTML scraping, unofficial APIs, or
residential proxies as a workaround.

## 3. Taylor's own channels

### Recommended and conditional official sources

| Official source | Endpoint / approach | `source_type` | Cost | `tier` | Status and hourly gotcha |
|---|---|---:|---:|---:|---|
| Taylor Swift Tumblr | `GET https://api.tumblr.com/v2/blog/taylorswift.tumblr.com/posts?api_key=...`; [live official blog](https://taylorswift.tumblr.com/) | `tumblr` | $0 | `official` | Active in 2026. Poll post IDs; exclude reblogs/likes that are not Taylor-authored announcements; store a short snippet only. |
| Taylor Nation Tumblr | `GET https://api.tumblr.com/v2/blog/taylornation.tumblr.com/posts?api_key=...`; [live official team blog](https://taylornation.tumblr.com/) | `tumblr` | $0 | `official` | Active in 2026 and explicitly identifies itself as the official TS social team. Likely the best zero-cost official announcement source. |
| Taylor Swift YouTube uploads | [`https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g`](https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g); [official channel](https://www.youtube.com/channel/UCqECaJ8Gagnn7YCbPEzWH6g) | `youtube` | $0; no API key | `official` | All uploads, not just announcements. Hourly polling is ample; ingest title, short description/snippet, timestamp, and watch URL, never transcript or full description. |
| Taylor Swift Instagram `@taylorswift` | Meta Business Discovery through Long Live's linked IG professional account | `instagram` | $0 API charge | `official` | Conditional preflight. Target must be a Business/Creator account; app must be live with correct Advanced Access. No webhook for another account, so poll. |
| Taylor Nation Instagram `@taylornation` | Same Business Discovery path | `instagram` | $0 API charge | `official` | Same constraints. Use media ID as `external_id`, permalink as canonical URL, and a truncated caption as snippet. |
| Taylor Swift X `@taylorswift13` | Recent search `from:taylorswift13 -is:retweet` | `x` | $0.005/post read | `official` | Existing X app can read after credits are available. Low likely volume, but still not zero-cost. Persist `since_id`. |
| Taylor Nation X `@taylornation13` | Recent search `from:taylornation13 -is:retweet` | `x` | $0.005/post read | `official` | Same. Can combine both accounts in one query; do not request user expansions every hour. |
| Universal Music Group news | Candidate feed [`https://www.universalmusic.com/feed/`](https://www.universalmusic.com/feed/) and [UMG news](https://www.universalmusic.com/) | `rss` | $0 | `official` | The feed is still catalogued in 2026, but this research could not independently demonstrate fresh feed items. Keep disabled until preflight. Very high noise; locally filter Taylor. |
| Taylor's official site | [`https://www.taylorswift.com/`](https://www.taylorswift.com/) | `web` | $0 | `official` | No stable news RSS. The page changes for store inventory, campaigns, and archive content, so HTML diffing would be noisy and brittle. Optional human-review discovery source, not v1. |
| Eras Tour official surface | [`https://www.taylorswift.com/tour-/`](https://www.taylorswift.com/tour-/) | `web` | $0 | `official` | It now renders the Taylor Swift Archive rather than an active tour schedule. Keep disabled until a future tour gets an official live page. |
| Republic Records | Current site and any future publisher press feed | `web` or `rss` | $0 if a feed appears | `official` | No qualified current press feed; do not scrape its store. Use UMG/Taylor Nation and established outlets instead. |

UMG has also expressly reserved rights around automated extraction and AI use of
its content ([UMG reservation of rights](https://www.universalmusic.com/umg-reservation-of-rights/)).
That reinforces the pipeline rule: use any qualified UMG feed only for
title/short description/canonical link metadata and never send or store its
article body.

### Can the existing Instagram token read Taylor's accounts?

**Conditionally, yes; not merely because the accounts are public.** Meta's
official Instagram API collection says the Facebook Login API can obtain basic
metadata about other Instagram Businesses and Creators, while it cannot access
consumer accounts ([Meta's official Postman
collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)).
The relevant operation is [Business
Discovery](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery/),
queried through Long Live's own linked professional IG user.

The repository's current token was generated for the Facebook Login-style Graph
API flow and records `instagram_basic`, `instagram_content_publish`,
`pages_read_engagement`, `business_management`, and `pages_show_list`
([growth agent notes](../agents/growth.md)). That is the right starting setup,
but a production preflight must still confirm:

- both target usernames resolve as professional accounts;
- the app is in Live mode and has the required Advanced Access/App Review for
  a non-role account;
- the long-lived token and linked Page/IG account have not expired or been
  disconnected; and
- current Graph API usage headers leave enough business-use-case capacity.

Do not promise Instagram ingestion until that read-only preflight succeeds.
Business Discovery does not create third-party-account webhooks, so an hourly
poll is required. Two profiles per hour should be modest, but Meta does not
publish a single durable universal calls-per-hour number for every app/business
use case; honor the returned usage headers and 429/backoff behavior.

### Can the existing X app read Taylor's accounts?

**Yes, through the same project/app, but reads consume credits.** Search is not
a separate paid tier. The repository's current OAuth credentials identify the
same X developer app; the worker may use the app's Bearer token for recent
search. This is authorization reuse, not free owned-data pricing: Taylor's and
Taylor Nation's posts are third-party resources, so the normal $0.005/post read
price applies. Long Live's lower $0.001 owned-read price applies only when the
authenticated user is the app owner reading that owner's own data.

## Recommended starting set for v1 of the worker

### Enable at launch: zero new paid subscriptions

This is the smallest practical set that covers all three categories while
remaining inside the current one-shot hourly/zero-hosting-cost architecture.

| Category | Enabled source rows | Why |
|---|---|---|
| Media coverage | Variety RSS; Rolling Stone Latest Music News RSS; Billboard RSS; TMZ RSS; E! Top Stories RSS | Five direct, currently active feeds cover music trade, general entertainment, and celebrity reporting. All are free. |
| Media catch-all | General Google News Taylor query as `unverified`; site-restricted People and EW queries with strict canonical-host validation | Finds gaps without pretending Google is an independent established source. Free, no API key, but unsupported/no SLA. |
| Official | Taylor Nation Tumblr; Taylor Swift Tumblr; Taylor Swift YouTube upload feed | Active, first-party, free, and pollable. The two Tumblr rows use one free API key; YouTube RSS needs no key. |
| Fan discourse | Tumblr tags `taylor swift` and `taylorswift` as `unverified` | Uses the same free Tumblr key and supplies real open-fandom discussion without a paid or contract-gated API. |
| Optional fan breadth | Bluesky public Taylor search as `unverified` | Free and no signup. Add only if the team wants a second open-social signal in v1; it is not required for category coverage. |

This set needs one free Tumblr developer-app registration, but no new **paid**
signup. It deliberately excludes X reads, Instagram Business Discovery, web
scraping, unqualified People/EW/UMG feed guesses, and TikTok.

### Configure but leave disabled

Create the source rows only after the worker supports a disabled state and
source-specific compliance metadata:

- `reddit` rows for `r/TaylorSwift`, `r/GaylorSwift`, and optionally
  `r/SwiftlyNeutral`: enable only after Reddit approves the use, Long Live's
  noncommercial/commercial status is resolved, and the worker supports
  attribution plus 48-hour recheck/deletion;
- official Instagram rows: enable only after a read-only Business Discovery
  preflight against the existing token succeeds;
- exact-account X rows: enable only if the team accepts pay-per-use and sets a
  hard monthly spend cap; and
- UMG RSS: enable only after a parse/freshness preflight succeeds.

If the team strongly prefers the originally expected "RSS + Google News +
Reddit" launch, Reddit should still be behind this explicit gate. A `script`
OAuth app makes the cron technically appropriate; it does not make a monetized
fan-news use free or remove deletion obligations.

## Source-enablement checklist

Before changing any `news_source.is_enabled` value to true:

1. Record the exact endpoint, owner, `source_type`, tier, Terms link, and date
   last verified in source config/operations documentation. Never store a key
   in `config`.
2. Require a successful parse, stable external ID, timestamp, source permalink,
   and at least one plausible recent item (except deliberately low-frequency
   official feeds).
3. Prove that the adapter discards full bodies and trims both the normalized
   fields and `raw_payload`.
4. Verify canonical-host behavior, especially for Google News. A label or
   redirect alone is not publisher identity.
5. Define deletion/recheck behavior for user-generated sources before retaining
   their content.
6. Set per-cycle item caps, conditional-request behavior, backoff, and a source
   health alert. Automatically disabling a broken feed is safer than silently
   ingesting an HTML error page.
7. Recheck prices, rate limits, platform terms, and feed freshness before
   implementation and at least quarterly thereafter; all are external moving
   dependencies.

