// Curated YouTube channel watchlist for appearance discovery.
//
// This is CONFIG, deliberately committed: adding/removing a channel is a
// reviewed PR, not a runtime decision. Each entry says WHY it is watched so a
// future session can prune with judgment instead of archaeology.
//
// channelId is the stable `UC…` id and is the ONLY authoritative field —
// handles and vanity URLs change, and `handle` here is a human breadcrumb, not
// something the code reads. Every id below was verified by fetching its RSS
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

export const CHANNELS = [
  {
    channelId: 'UCqECaJ8Gagnn7YCbPEzWH6g',
    name: 'Taylor Swift',
    handle: '@TaylorSwift',
    allUploads: true,
    why: 'Her own channel — every upload (video, performance, teaser, documentary) is content by definition.',
  },
  {
    channelId: 'UCq4isO8ZYOZfmvGJ-_1UdIA',
    name: 'GRAMMYs',
    handle: '@grammys',
    why: 'Award-show performances, acceptance speeches, backstage interviews.',
  },
  {
    channelId: 'UCxAICW_LdkfFYwTqTHHE0vg',
    name: 'MTV',
    handle: '@MTV',
    why: 'VMAs performances and speeches; red-carpet interviews.',
  },
  {
    channelId: 'UCycaNdMyMxurN4v8LZkMZ5g',
    name: 'American Music Awards',
    handle: '@TheAMAs',
    why: 'AMAs performances and record-setting wins.',
  },
  {
    channelId: 'UCBv7HEHuVlNAELGi5XJd85Q',
    name: 'Apple Music',
    handle: '@AppleMusic',
    why: 'Interviews, film/event tie-ins (e.g. halftime-show adjacency), exclusives.',
  },
  {
    channelId: 'UC8-Th83bH_thdKZDJCrn88g',
    name: 'The Tonight Show Starring Jimmy Fallon',
    handle: '@FallonTonight',
    why: 'Late-night appearances and sketches — a recurring stop on album cycles.',
  },
  {
    channelId: 'UCVTyTA7-g9nopHeHbeuvpRA',
    name: 'Late Night with Seth Meyers',
    handle: '@LateNightSeth',
    why: 'Late-night appearances.',
  },
  {
    channelId: 'UCMtFAi84ehTSYSE9XoHefig',
    name: 'The Late Show with Stephen Colbert',
    handle: '@ColbertLateShow',
    why: 'Late-night appearances.',
  },
  {
    channelId: 'UCqFzWxSCi39LnW1JKFR3efg',
    name: 'Saturday Night Live',
    handle: '@SaturdayNightLive',
    why: 'Musical-guest performances, hosting stints, sketches.',
  },
  {
    channelId: 'UC4PziMH5MvvsmqM0VCZTy-g',
    name: 'The Graham Norton Show',
    handle: '@OfficialGrahamNorton',
    why: 'The UK talk-show stop on international promo runs.',
  },
  {
    channelId: 'UCVRm2Ho8cL3lvWDyp2ayuFw',
    name: 'New Heights',
    handle: '@newheightshow',
    why: "Travis Kelce's podcast — where the August 2025 TLOAS announcement happened; direct appearances possible any week.",
  },
  {
    channelId: 'UChDKyKQ59fYz3JO2fl0Z6sg',
    name: 'TODAY',
    handle: '@TODAY',
    why: 'Morning-show interviews and plaza performances.',
  },
  {
    channelId: 'UCH1oRy1dINbMVp3UFWrKP0w',
    name: 'Good Morning America',
    handle: '@GMA',
    why: 'Morning-show interviews and announcements.',
  },
  {
    channelId: 'UCa6vGFO9ty8v5KZJXQxdhaw',
    name: 'Jimmy Kimmel Live',
    handle: '@JimmyKimmelLive',
    why: 'Late-night appearances.',
  },
];

/** RSS feed URL for a channel id — free, keyless, ~15 most recent uploads. */
export function feedUrl(channelId) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}
