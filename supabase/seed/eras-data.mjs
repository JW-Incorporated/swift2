// Vault seed content — ERAS + MILESTONES.
//
// Era themes are ported faithfully from the sibling Orbit project
// (apps/web/lib/era-themes.ts). Era windows and milestone dates are public
// record (album release dates, tour openings). Month-level `month_item` /
// `moment` content is authored separately (Joey's content track) — this file
// only seeds the skeleton: eras + wavetop milestones.

/** @typedef {import('@swift2/shared').EraTheme} EraTheme */

export const eras = [
  {
    slug: 'debut', title: 'The debut era', album: 'Taylor Swift',
    start_date: '2006-10-24', end_date: '2008-11-10', sort_order: 0,
    theme: {
      bg: '#f3ecdb', surface: '#fbf6ea', ink: '#3a2e1a', inkSoft: '#8a7550',
      line: '#e4d8bd', accent: '#bb8f2e',
      heroGradient: 'linear-gradient(135deg, #2e3a22 0%, #6b7a3a 55%, #c79a3a 100%)',
      eyebrow: 'The debut era',
    },
  },
  {
    slug: 'fearless', title: 'The Fearless era', album: 'Fearless',
    start_date: '2008-11-11', end_date: '2010-10-24', sort_order: 1,
    theme: {
      bg: '#f6ead0', surface: '#fdf6e6', ink: '#473712', inkSoft: '#9a8038',
      line: '#ecdcae', accent: '#cba023',
      heroGradient: 'linear-gradient(135deg, #5a4612 0%, #b8922a 58%, #ecca6a 100%)',
      eyebrow: 'The Fearless era',
    },
  },
  {
    slug: 'speak-now', title: 'The Speak Now era', album: 'Speak Now',
    start_date: '2010-10-25', end_date: '2012-10-21', sort_order: 2,
    theme: {
      bg: '#1b1233', surface: '#2a1f4a', ink: '#ece2ff', inkSoft: '#a594c8',
      line: '#352a5c', accent: '#b98cff',
      heroGradient: 'linear-gradient(135deg, #150c2c 0%, #4a2f7a 60%, #b98cff 100%)',
      eyebrow: 'The Speak Now era',
    },
  },
  {
    slug: 'red', title: 'The Red era', album: 'Red',
    start_date: '2012-10-22', end_date: '2014-10-26', sort_order: 3,
    theme: {
      bg: '#2a0e11', surface: '#3d161a', ink: '#f6dede', inkSoft: '#c98a8a',
      line: '#4d1d22', accent: '#e05068',
      heroGradient: 'linear-gradient(135deg, #190608 0%, #7a1f28 58%, #d9485e 100%)',
      eyebrow: 'The Red era',
    },
  },
  {
    slug: '1989', title: 'The 1989 era', album: '1989',
    start_date: '2014-10-27', end_date: '2017-11-09', sort_order: 4,
    theme: {
      bg: '#e7f1f3', surface: '#ffffff', ink: '#0f303a', inkSoft: '#4a7782',
      line: '#cfe4e8', accent: '#2f93a6',
      heroGradient: 'linear-gradient(135deg, #14525f 0%, #2f93a6 65%, #74cddc 100%)',
      eyebrow: 'The 1989 era',
    },
  },
  {
    slug: 'reputation', title: 'The reputation era', album: 'reputation',
    start_date: '2017-11-10', end_date: '2019-08-22', sort_order: 5,
    theme: {
      bg: '#0b0b0b', surface: '#161616', ink: '#ededed', inkSoft: '#9a9a9a',
      line: '#2a2a2a', accent: '#cfcfcf',
      heroGradient: 'linear-gradient(135deg, #000000 0%, #1c1c1c 70%, #3a3a3a 100%)',
      eyebrow: 'The reputation era',
    },
  },
  {
    slug: 'lover', title: 'The Lover era', album: 'Lover',
    start_date: '2019-08-23', end_date: '2020-07-23', sort_order: 6,
    theme: {
      bg: '#fbeef5', surface: '#ffffff', ink: '#5a2a48', inkSoft: '#a06a8a',
      line: '#f2d6e6', accent: '#d65aa0',
      heroGradient: 'linear-gradient(135deg, #f7a8d8 0%, #b9c8f0 55%, #bfe6f0 100%)',
      eyebrow: 'The Lover era',
    },
  },
  {
    slug: 'folklore', title: 'The folklore era', album: 'folklore',
    start_date: '2020-07-24', end_date: '2020-12-10', sort_order: 7,
    theme: {
      bg: '#e9e7e0', surface: '#f6f4ef', ink: '#272620', inkSoft: '#6b685e',
      line: '#d8d4c8', accent: '#5f6f5a',
      heroGradient: 'linear-gradient(135deg, #2f352d 0%, #5f6f5a 70%, #8a9a82 100%)',
      eyebrow: 'The folklore era',
    },
  },
  {
    slug: 'evermore', title: 'The evermore era', album: 'evermore',
    start_date: '2020-12-11', end_date: '2022-10-20', sort_order: 8,
    theme: {
      bg: '#e8e1d6', surface: '#f4efe7', ink: '#372c20', inkSoft: '#7a6a54',
      line: '#d6ccbb', accent: '#9a6a3a',
      heroGradient: 'linear-gradient(135deg, #2c2218 0%, #6b4a2e 60%, #9a7a4a 100%)',
      eyebrow: 'The evermore era',
    },
  },
  {
    slug: 'midnights', title: 'The Midnights era', album: 'Midnights',
    start_date: '2022-10-21', end_date: '2024-04-18', sort_order: 9,
    theme: {
      bg: '#0d1030', surface: '#181c46', ink: '#e2e4ff', inkSoft: '#9094c9',
      line: '#262c63', accent: '#9aa0ff',
      heroGradient: 'linear-gradient(135deg, #07091f 0%, #2a2f6b 60%, #7c6fb0 100%)',
      eyebrow: 'The Midnights era',
    },
  },
  {
    slug: 'tortured-poets', title: 'The Tortured Poets era',
    album: 'The Tortured Poets Department',
    // End trimmed 2025-12-31 -> 2025-10-02 so the era hands off to
    // the-life-of-a-showgirl on its release day (audit 2026-07-08, gap #1).
    start_date: '2024-04-19', end_date: '2025-10-02', sort_order: 10,
    theme: {
      bg: '#15151a', surface: '#21212a', ink: '#e9e6dd', inkSoft: '#9a968b',
      line: '#2d2d36', accent: '#bcb4a2',
      heroGradient: 'linear-gradient(135deg, #0d0d10 0%, #2a2a30 60%, #59544a 100%)',
      eyebrow: 'The Tortured Poets era',
    },
  },
  {
    slug: 'the-life-of-a-showgirl', title: 'The Life of a Showgirl era',
    album: 'The Life of a Showgirl',
    // Current era: end_date is a rolling "now" placeholder (same convention
    // tortured-poets used before it), pushed forward as the era continues.
    start_date: '2025-10-03', end_date: '2026-12-31', sort_order: 11,
    theme: {
      // Orange glitter on curtain teal — the album's Portofino-orange visual
      // identity (glitter title lettering, showgirl feathers, mint-to-teal
      // announcement briefcase).
      bg: '#fdf1e3', surface: '#fff9f0', ink: '#46220e', inkSoft: '#a56b3f',
      line: '#f3dcc0', accent: '#e0641d',
      heroGradient: 'linear-gradient(135deg, #0e3f45 0%, #c2521f 55%, #f2a339 100%)',
      eyebrow: 'The Life of a Showgirl era',
    },
  },
];

// Wavetop milestones (public record). album_release = original + re-records in
// the era active on their release date; a few marquee tour openings.
export const milestones = [
  { era_slug: 'debut', type: 'album_release', title: 'Taylor Swift released', date: '2006-10-24' },
  { era_slug: 'fearless', type: 'album_release', title: 'Fearless released', date: '2008-11-11' },
  { era_slug: 'fearless', type: 'tour', title: 'Fearless Tour opens', date: '2009-04-23' },
  { era_slug: 'speak-now', type: 'album_release', title: 'Speak Now released', date: '2010-10-25' },
  { era_slug: 'speak-now', type: 'tour', title: 'Speak Now World Tour opens', date: '2011-02-09' },
  { era_slug: 'red', type: 'album_release', title: 'Red released', date: '2012-10-22' },
  { era_slug: 'red', type: 'tour', title: 'The Red Tour opens', date: '2013-03-13' },
  { era_slug: '1989', type: 'album_release', title: '1989 released', date: '2014-10-27' },
  { era_slug: '1989', type: 'tour', title: 'The 1989 World Tour opens', date: '2015-05-05' },
  { era_slug: 'reputation', type: 'album_release', title: 'reputation released', date: '2017-11-10' },
  { era_slug: 'reputation', type: 'tour', title: 'reputation Stadium Tour opens', date: '2018-05-08' },
  { era_slug: 'lover', type: 'album_release', title: 'Lover released', date: '2019-08-23' },
  { era_slug: 'folklore', type: 'album_release', title: 'folklore released', date: '2020-07-24' },
  { era_slug: 'evermore', type: 'album_release', title: 'evermore released', date: '2020-12-11' },
  { era_slug: 'evermore', type: 'album_release', title: "Fearless (Taylor's Version) released", date: '2021-04-09' },
  { era_slug: 'evermore', type: 'album_release', title: "Red (Taylor's Version) released", date: '2021-11-12' },
  { era_slug: 'midnights', type: 'album_release', title: 'Midnights released', date: '2022-10-21' },
  { era_slug: 'midnights', type: 'album_release', title: "Speak Now (Taylor's Version) released", date: '2023-07-07' },
  { era_slug: 'midnights', type: 'album_release', title: "1989 (Taylor's Version) released", date: '2023-10-27' },
  { era_slug: 'midnights', type: 'tour', title: 'The Eras Tour opens', date: '2023-03-17' },
  { era_slug: 'tortured-poets', type: 'album_release', title: 'The Tortured Poets Department released', date: '2024-04-19' },
  { era_slug: 'the-life-of-a-showgirl', type: 'album_release', title: 'The Life of a Showgirl released', date: '2025-10-03' },
];
