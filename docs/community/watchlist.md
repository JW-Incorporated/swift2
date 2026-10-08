# Community watchlist — verified seed values (P0-2)

Source: `docs/proposals/2026-09-06-community-engine-plan.md` §8-Q1 defaults,
verified 2026-09-07. Research method: WebSearch only — Reddit's edge/WAF
blocks direct fetch from this environment (confirmed again: `curl` to
`reddit.com/r/*/top.rss` returned 403/429 from here), so every row below is
corroborated via cached/mirrored search snippets (official subreddit rules
wiki pages, subreddit-stats mirrors, and news coverage), not a live API call.
Where a rule could not be confirmed with confidence, `allows_links` is left
`false`/conservative per the plan's own etiquette gate (§6.5: first promo in
any sub requires a modmail check regardless of this table).

This document is the source of truth for `community_watchlist` seed rows.
P0-1 (schema migration) is still in flight in a separate worktree at the time
of this research; a follow-up task applies these exact values once P0-1
lands (see child task created against this card).

## Reddit — scan list (`scan=true`)

| id | name | status | allows_links | notes |
|---|---|---|---|---|
| reddit:TaylorSwift | r/TaylorSwift | ✅ active, ~3.8M members (main hub sub) | **false** | Sidebar/rules wiki (`/wiki/index/rules`) explicit: "No self promo... Linking or directing to your store will result in a ban." No exceptions found. Never link here without a prior modmail. |
| reddit:SwiftlyNeutral | r/SwiftlyNeutral | ✅ active (daily discussion threads dated into 2026) | **true, conditional** | Its own pinned Daily Discussion Thread rules explicitly list "Memes, videos, art, merch photos, or self-promotion you'd like to share" as permitted content — but this permission is scoped to the daily discussion thread, not the main feed/link posts. Treat as link-friendly **only inside daily discussion threads**; still gate on `redditNonPromo≥20` and do a modmail check before the first post. |
| reddit:TaylorSwiftBookClub | r/TaylorSwiftBookClub | ✅ active, small/niche (created 2019, low volume) | **true, conditional** | Official rules (`/about/sidebar`, rule 5): "Please follow Reddit's guidelines on self promotion. Self promotion links from accounts with limited non-promotion history may be removed." — i.e. no blanket ban, standard site-wide 9:1 norm applies. Low-traffic sub; a good "safe" first-link candidate for the etiquette gate once `redditNonPromo≥20`. |
| reddit:YouBelongWithMemes | r/YouBelongWithMemes | ✅ active, ~103k members (official meme sub of r/TaylorSwift, listed as its related-sub) | **false (unconfirmed)** | Could not locate a published rules/sidebar text via search (mirrors show posts but not a rules page). Meme-only culture makes link posts atypical. Default to no-link until an Answerer-desk modmail check confirms a posture. |
| reddit:TaylorSwiftMerch | r/TaylorSwiftMerch | ✅ active, small (rules: "Be Respectful", redirects autograph requests to r/TaylorSwiftAutographs) | **false (unconfirmed), merch-context only** | No explicit self-promo rule surfaced; sub exists specifically to discuss merch/trading, so shop-adjacent links may be more tolerated than elsewhere, but nothing found guarantees it. Gate behind modmail same as others — this is the E5 fan-merch-widen target, not an Answerer-desk link target. |

## Reddit — crawl list (`crawl=true`, C1 year-deep corpus)

Per plan: "first three [scan subs] plus a `TSwiftEasterEggs`-style sub if one
exists."

- reddit:TaylorSwift — crawl=true
- reddit:SwiftlyNeutral — crawl=true
- reddit:TaylorSwiftBookClub — crawl=true
- **reddit:TaylorSwiftTheories — crawl=true (new; the "TSwiftEasterEggs-style"
  slot).** r/TaylorSwiftTheories is confirmed alive with dated 2026 posts
  ("The Literacy of Taylor Swift" Apr '26, an Eras-Tour Easter-egg thread Nov
  '25, etc.) and its stated purpose is exactly "discuss and share Taylor
  Swift theories and Easter eggs" — a direct match for the Theory Miner's
  intake. The lowercase `r/tswifteastereggs` variant also exists but no
  recent activity could be found in search results (only an old tagline
  snippet); recommend TaylorSwiftTheories over it. `allows_links=false`
  (theory/discussion sub, no self-promo rule text found — treat
  conservatively; irrelevant anyway since crawl-only subs don't post).

## Facebook groups

Per plan §8-Q1: "the two groups already named in `sources.md`... + any Joey
adds." `sources.md` (2026-08-14 research) names exactly two, both
re-confirmed here:

| id | name | status | allows_links | notes |
|---|---|---|---|---|
| facebook:taylor-swifts-vault | Taylor Swift's Vault (facebook.com/groups/2254218764714763) | ✅ active, ~480k+ members. Confirmed via Bustle (2024) and a fresh 2026-08-12 news citation quoting the group's own post about Taylor's debut-album 20th anniversary — i.e. still posting in 2026. | **false** | No FB crawler exists or is planned (decisions.md 2026-08-11) — this row only matters for the human-export ingest (E4/§2.4); "links" here means comment replies drafted from an export, not automated posting. Treat as no-link by default, same modmail-style caution as Reddit, until Joey confirms group norms from an actual export. |
| facebook:friendship-bracelet-trading | Taylor Swift Friendship Bracelet Making and Trading (NO SALES) (facebook.com/groups/959997728506267) | ✅ active, ~10,000 members per Newsweek (2024) coverage; name in `sources.md` matches exactly, including the "NO SALES" qualifier baked into the group's own name. | **false** | The "NO SALES" in the group's title is itself the self-promo rule — this is a making/trading group, not a marketplace. Never draft a promotional/shop-link reply here. |

## Founder step still open (not a card — goes in the daily brief)

Per plan §7/§8: enumerating *all* of Joey's Facebook groups (beyond these
two named ones) requires his own FB login and cannot be done by an agent.
These two are the only ones independently verifiable from here; "any Joey
adds" from §8-Q1 remains open until he adds more.
