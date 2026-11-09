// Curated YouTube channel watchlist for appearance discovery.
//
// This is CONFIG, deliberately committed: adding/removing a channel is a
// reviewed PR, not a runtime decision. Each entry says WHY it is watched so a
// future session can prune with judgment instead of archaeology.
//
// channelId is the stable `UC…` id and is the ONLY authoritative field —
// handles and vanity URLs change, and `handle` here is a human breadcrumb (the
// news worker only uses it to map an oEmbed author_url back to a channelId).
// Every id below was verified by fetching its RSS
// feed (https://www.youtube.com/feeds/videos.xml?channel_id=<id>) and checking
// the feed's own <title> matches the channel named beside it. Do not add or
// edit an entry without doing that — a plausible-looking `UC…` string is very
// often simply wrong (five of the first fourteen drafted here 404'd), and an
// unverified id fails silently as "this channel never posts".
//
// To re-verify every committed channel at once, or to resolve a new one:
//
//   node scripts/appearance-discovery/resolve-channel.mjs --all
//   node scripts/appearance-discovery/resolve-channel.mjs @SomeHandle
//
// ## Relevance rules (deterministic — the whole point is zero LLM here)
//
// A feed entry passes the filter when ANY of these matches.
// Matching is on the video TITLE ONLY — never the description.
//
//   1. `all-uploads`   — the channel is Taylor's own (allUploads: true):
//                        every upload is relevant by definition.
//   2. `taylor-swift`  — "taylor swift" (case-insensitive, any whitespace
//                        between the words) appears in the TITLE.
//   3. `swift-title`   — the word "Swift" (capital S, word-boundaried, so
//                        "Swiftie"/"swift reaction" do NOT match) appears in
//                        the TITLE.
//
// ## Why title-only (learned from the first live dry run, 2026-08-12)
//
// The filter originally also matched descriptions. Run against the real feeds
// it immediately produced a textbook false positive: GMA's video "Rod Stewart
// calls off remaining tour dates to recover from medical procedure" matched,
// because it is a "GMA Pop News" ROUNDUP whose description lists every segment
// in the episode — one of which was Taylor's Songwriters Hall of Fame news.
// Filing it would have opened an intake issue named after Rod Stewart that was
// also a duplicate of the correctly-detected item on the same day.
//
// That failure is structural, not a one-off: news and talk-show descriptions
// are segment lists, chapter markers, and subscribe boilerplate. A name in
// there means "this channel mentioned her somewhere in 12 minutes", which is
// not an appearance. Titles are written to sell the segment, so a real
// appearance essentially always names her in the title. Dropping descriptions
// costs almost nothing in recall and removes an entire class of noise.
//
// Deliberately NOT matched: "Travis", "Kelce", song titles, album names —
// each is a recall grab that floods the intake queue with maybes. If a real
// appearance slips through because its title never says Swift, the fix is a
// human filing the intake issue by hand (the door stays open), not loosening
// this filter. Precision beats recall here: a missed video costs a day (the
// next sweep or a human catches it); a false positive costs triage time on
// every filed issue, forever.

// The list itself lives in packages/shared/src/youtube-channels.mjs so the news worker
// can reuse it as the embed allowlist. The worker also reads `handle` (matched against the
// oEmbed author_url), so keep handles accurate.
export { CHANNELS, feedUrl } from '../../packages/shared/src/youtube-channels.mjs';
