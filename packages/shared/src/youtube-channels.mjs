// Curated YouTube channel list shared by appearance discovery (scripts/appearance-discovery/channels.mjs,
// which documents the verification and relevance rules) and the news worker's embed allowlist
// (apps/worker/src/extract/youtube-embed.ts). Plain .mjs so plain node can import it.

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
