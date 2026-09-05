// Notifications Phase 4 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§9)
// — `on_this_day` seed content, per the task's explicit instruction: "seed
// on_this_day from the repo's existing timeline/era data". Source: every
// dated `ContentItem.milestone` marker already authored in
// supabase/seed/content/** (the exact same data that drives the
// TimelineScrubber — see apps/web/lib/longlive/content.ts's MILESTONES
// export), extracted via `.scratch/dump-milestones.mjs` against the real
// content vault so this file is DERIVED data, not hand-typed guesses.
//
// month/day repeat annually (no year column on the lookup key — spec's
// example "On this day in 2014, 1989 was released" keeps the year only in
// the display TEXT); `year` here is carried through so the sync/seed
// script can build that display line without re-deriving it. One row per
// milestone — this repo's real editorial content, not invented filler,
// matching this task's content-integrity bar for lyrics.
//
// A calendar day with no milestone here (most of the year) correctly gets
// nothing: spec's "skips dates with no good entry rather than sending
// filler" is enforced by the DISPATCH job doing a lookup miss, not by this
// file padding out empty days.

export const ON_THIS_DAY_STARTER_POOL = [
  {
    month: 9,
    day: 1,
    year: 2006,
    text: 'On this day in 2006, Taylor made her Grand Ole Opry debut \u{1F3B8}',
    deepLink: null,
  },
  {
    month: 10,
    day: 24,
    year: 2006,
    text: 'On this day in 2006, her debut album Taylor Swift was released',
    deepLink: null,
  },
  {
    month: 11,
    day: 7,
    year: 2007,
    text: 'On this day in 2007, she won her first CMA Award',
    deepLink: null,
  },
  {
    month: 12,
    day: 22,
    year: 2007,
    text: '\u201cOur Song\u201d hit #1 on this day in 2007 \u2014 her first chart-topper',
    deepLink: null,
  },
  {
    month: 11,
    day: 11,
    year: 2008,
    text: 'On this day in 2008, Fearless was released',
    deepLink: null,
  },
  {
    month: 4,
    day: 23,
    year: 2009,
    text: 'The Fearless Tour opened on this day in 2009',
    deepLink: null,
  },
  {
    month: 1,
    day: 31,
    year: 2010,
    text: 'On this day in 2010, Fearless won Album of the Year at the Grammys',
    deepLink: null,
  },
  {
    month: 10,
    day: 25,
    year: 2010,
    text: 'On this day in 2010, Speak Now was released',
    deepLink: null,
  },
  {
    month: 2,
    day: 9,
    year: 2011,
    text: 'The Speak Now World Tour began on this day in 2011',
    deepLink: null,
  },
  {
    month: 8,
    day: 22,
    year: 2012,
    text: 'On this day in 2012, she scored her first #1 single',
    deepLink: null,
  },
  { month: 10, day: 22, year: 2012, text: 'On this day in 2012, Red was released', deepLink: null },
  {
    month: 3,
    day: 13,
    year: 2013,
    text: 'The Red Tour kicked off on this day in 2013',
    deepLink: null,
  },
  {
    month: 8,
    day: 18,
    year: 2014,
    text: '\u201cShake It Off\u201d dropped on this day in 2014',
    deepLink: null,
  },
  {
    month: 10,
    day: 27,
    year: 2014,
    text: 'On this day in 2014, 1989 was released \u{1F570}\uFE0F',
    deepLink: null,
  },
  {
    month: 5,
    day: 5,
    year: 2015,
    text: 'The 1989 World Tour began on this day in 2015',
    deepLink: null,
  },
  {
    month: 2,
    day: 15,
    year: 2016,
    text: 'On this day in 2016, 1989 won Album of the Year',
    deepLink: null,
  },
  {
    month: 8,
    day: 21,
    year: 2017,
    text: 'The snake video dropped on this day in 2017',
    deepLink: null,
  },
  {
    month: 11,
    day: 10,
    year: 2017,
    text: 'On this day in 2017, reputation was released',
    deepLink: null,
  },
  {
    month: 5,
    day: 8,
    year: 2018,
    text: 'The reputation Stadium Tour opened on this day in 2018',
    deepLink: null,
  },
  {
    month: 8,
    day: 23,
    year: 2019,
    text: 'On this day in 2019, Lover was released',
    deepLink: null,
  },
  {
    month: 1,
    day: 23,
    year: 2020,
    text: 'Miss Americana premiered on this day in 2020',
    deepLink: null,
  },
  {
    month: 7,
    day: 24,
    year: 2020,
    text: 'folklore surprise-dropped on this day in 2020',
    deepLink: null,
  },
  {
    month: 12,
    day: 11,
    year: 2020,
    text: 'evermore surprise-dropped on this day in 2020 \u2014 folklore\u2019s sister album',
    deepLink: null,
  },
  {
    month: 3,
    day: 14,
    year: 2021,
    text: 'On this day in 2021, folklore won Album of the Year',
    deepLink: null,
  },
  {
    month: 4,
    day: 18,
    year: 2021,
    text: 'On this day in 2021, the first re-recording hit #1',
    deepLink: null,
  },
  {
    month: 11,
    day: 21,
    year: 2021,
    text: 'Red (Taylor\u2019s Version) opened at #1 on this day in 2021',
    deepLink: null,
  },
  {
    month: 10,
    day: 21,
    year: 2022,
    text: 'On this day in 2022, Midnights was released',
    deepLink: null,
  },
  {
    month: 11,
    day: 5,
    year: 2022,
    text: 'On this day in 2022, she swept the entire Hot 100 top ten',
    deepLink: null,
  },
  {
    month: 3,
    day: 17,
    year: 2023,
    text: 'The Eras Tour began on this day in 2023',
    deepLink: null,
  },
  {
    month: 10,
    day: 13,
    year: 2023,
    text: 'The Eras Tour concert film hit theaters on this day in 2023',
    deepLink: null,
  },
  {
    month: 12,
    day: 6,
    year: 2023,
    text: 'On this day in 2023, she was named TIME Person of the Year',
    deepLink: null,
  },
  {
    month: 2,
    day: 4,
    year: 2024,
    text: 'On this day in 2024, she won a record 4th Album of the Year Grammy',
    deepLink: null,
  },
  {
    month: 4,
    day: 19,
    year: 2024,
    text: 'On this day in 2024, THE TORTURED POETS DEPARTMENT was released',
    deepLink: null,
  },
  {
    month: 12,
    day: 8,
    year: 2024,
    text: 'The Eras Tour played its finale on this day in 2024',
    deepLink: null,
  },
  {
    month: 5,
    day: 30,
    year: 2025,
    text: 'On this day in 2025, she bought back her masters',
    deepLink: null,
  },
  {
    month: 10,
    day: 3,
    year: 2025,
    text: 'On this day in 2025, The Life of a Showgirl was released',
    deepLink: null,
  },
  {
    month: 10,
    day: 18,
    year: 2025,
    text: 'On this day in 2025, she swept the Hot 100 top ten again',
    deepLink: null,
  },
  {
    month: 7,
    day: 3,
    year: 2026,
    text: 'On this day in 2026, she got married at MSG',
    deepLink: null,
  },
];

export default ON_THIS_DAY_STARTER_POOL;
