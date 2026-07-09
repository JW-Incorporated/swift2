// Vault tours — all six headline tours, with per-show depth for the Eras Tour
// (rollout PRs 7/8 scope, first pass).
//
// Dates and show counts verified against each tour's Wikipedia infobox on
// 2026-07-08. Eras Tour show entries record only widely documented moments,
// each labeled with a confidence level — venue-level, past-tense, never
// real-time (the coverage gate enforces the location policy).
//
// Then run:  npm run db:seed:tours

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? 'anchors dates, legs, and show count',
});
const press = (source_url, source_title, publisher, notes) => ({
  source_url,
  source_title,
  publisher,
  source_type: 'reputable_press',
  accessed_at: '2026-07-09',
  reliability_score: 4,
  excerpt: null,
  notes,
});

export default {
  tours: [
    {
      slug: 'fearless-tour',
      eraSlug: 'fearless',
      title: 'Fearless Tour',
      openedOn: '2009-04-23',
      closedOn: '2010-07-10',
      legs: [],
      showCount: 118,
      surpriseSongsNote: null,
      shows: [],
      note: 'Her first headlining tour, launched at 19 in Evansville, Indiana — 118 shows of fairytale staging that proved the arena-filling demand was hers alone.',
      sources: [wiki('Fearless_Tour', 'Fearless Tour')],
    },
    {
      slug: 'speak-now-world-tour',
      eraSlug: 'speak-now',
      title: 'Speak Now World Tour',
      openedOn: '2011-02-09',
      closedOn: '2012-03-18',
      legs: [],
      showCount: 110,
      surpriseSongsNote:
        'The surprise-slot prototype: in city after city she covered a song by a hometown artist mid-set — a tradition fans now read as the ancestor of the Eras Tour acoustic set.',
      shows: [],
      note: 'Opened in Singapore, closed in Auckland — 110 theatrical shows (aerial ballet, a levitating balcony) for the album she wrote entirely alone.',
      sources: [wiki('Speak_Now_World_Tour', 'Speak Now World Tour')],
    },
    {
      slug: 'the-red-tour',
      eraSlug: 'red',
      title: 'The Red Tour',
      openedOn: '2013-03-13',
      closedOn: '2014-06-12',
      legs: [],
      showCount: 86,
      surpriseSongsNote: null,
      shows: [],
      note: 'Eighty-six shows from Omaha to Singapore — by its close, the highest-grossing tour ever by a country artist.',
      sources: [wiki('The_Red_Tour', 'The Red Tour')],
    },
    {
      slug: 'the-1989-world-tour',
      eraSlug: '1989',
      title: 'The 1989 World Tour',
      openedOn: '2015-05-05',
      closedOn: '2015-12-12',
      legs: [],
      showCount: 85,
      surpriseSongsNote:
        'Less surprise songs, more surprise people: the tour became famous for its near-nightly parade of guest stars and squad-era catwalk cameos.',
      shows: [],
      note: 'Tokyo to Melbourne in one calendar year — 85 shows, the highest-grossing tour of 2015, documented in The 1989 World Tour Live film.',
      sources: [wiki('The_1989_World_Tour', 'The 1989 World Tour')],
    },
    {
      slug: 'reputation-stadium-tour',
      eraSlug: 'reputation',
      title: 'reputation Stadium Tour',
      openedOn: '2018-05-08',
      closedOn: '2018-11-21',
      legs: [],
      showCount: 53,
      surpriseSongsNote:
        'Every night carried an acoustic B-stage slot that rotated deep cuts — the direct precursor to the Eras Tour surprise-song format.',
      shows: [],
      note: 'Her first all-stadiums tour: 53 shows with a giant snake named Karyn presiding — it broke the record for the highest-grossing US tour in history.',
      sources: [wiki('Reputation_Stadium_Tour', 'reputation Stadium Tour')],
    },
    {
      slug: 'the-eras-tour',
      eraSlug: 'midnights',
      title: 'The Eras Tour',
      openedOn: '2023-03-17',
      closedOn: '2024-12-08',
      legs: [
        { name: 'North America (2023)', from: '2023-03-17', to: '2023-08-09' },
        { name: 'Latin America', from: '2023-08-24', to: '2023-11-26' },
        { name: 'Asia-Pacific', from: '2024-02-07', to: '2024-03-09' },
        { name: 'Europe', from: '2024-05-09', to: '2024-08-20' },
        { name: 'North America (2024)', from: '2024-10-18', to: '2024-12-08' },
      ],
      showCount: 149,
      surpriseSongsNote:
        'A two-song acoustic set each night — one on guitar, one on piano — under a loose no-repeat rule through 2023 that fans tracked obsessively, then relaxed into multi-song mashups from the 2024 Tokyo shows onward.',
      shows: [
        {
          date: '2023-03-17',
          city: 'Glendale, AZ',
          venue: 'State Farm Stadium',
          surpriseSongs: ['mirrorball', 'Tim McGraw'],
          outfitNote: 'The opening-night versions of the era looks — bejeweled Lover bodysuit through the folklore dress — set the costume baseline fans then tracked variant-by-variant.',
          setlistChange: 'The 44-song, three-plus-hour era-by-era setlist debuted here in full.',
          confidence: 'reputable_reporting',
          sources: [wiki('The_Eras_Tour', 'The Eras Tour', 'opening night; the city ceremonially renamed itself Swift City for the weekend')],
        },
        {
          date: '2023-05-05',
          city: 'Nashville, TN',
          venue: 'Nissan Stadium',
          setlistChange: "Mid-show she announced Speak Now (Taylor's Version) — the stadium turned purple as the news landed.",
          confidence: 'reputable_reporting',
          sources: [wiki('Speak_Now_(Taylor%27s_Version)', "Speak Now (Taylor's Version)", 'announcement documented to the 2023-05-05 Nashville show')],
        },
        {
          date: '2023-07-07',
          city: 'Kansas City, MO',
          venue: 'GEHA Field at Arrowhead Stadium',
          guests: ['Taylor Lautner'],
          setlistChange: "The 'I Can See You' music video premiered on the stadium screens the night Speak Now (Taylor's Version) dropped — its star Taylor Lautner backflipped across the stage.",
          confidence: 'reputable_reporting',
          sources: [wiki('Speak_Now_(Taylor%27s_Version)', "Speak Now (Taylor's Version)", "video premiere at the 2023-07-07 Kansas City show")],
        },
        {
          date: '2023-08-09',
          city: 'Inglewood, CA',
          venue: 'SoFi Stadium',
          surpriseSongs: ['New Romantics', "New Year's Day"],
          outfitNote: 'Blue looks all night — the color-coded tell fans had bet on for weeks.',
          setlistChange: "1989 (Taylor's Version) announced at the final 2023 US show — on 8/9, exactly as the fan numerology predicted.",
          confidence: 'reputable_reporting',
          sources: [wiki('1989_(Taylor%27s_Version)', "1989 (Taylor's Version)", 'announcement documented to the 2023-08-09 SoFi show')],
        },
        {
          date: '2023-11-11',
          city: 'Buenos Aires',
          venue: 'Estadio River Plate',
          setlistChange: "The 'Karma' lyric became 'Karma is the guy on the Chiefs, coming straight home to me' — a live lyric change that made global headlines.",
          confidence: 'reputable_reporting',
          sources: [wiki('The_Eras_Tour', 'The Eras Tour', 'the Buenos Aires lyric change is documented in the tour article')],
        },
        {
          date: '2024-06-23',
          city: 'London',
          venue: 'Wembley Stadium',
          guests: ['Travis Kelce'],
          setlistChange: "Travis Kelce appeared on stage in a top hat and tails during 'I Can Do It with a Broken Heart' — his only Eras Tour stage cameo.",
          confidence: 'reputable_reporting',
          sources: [wiki('The_Eras_Tour', 'The Eras Tour', 'the Wembley cameo is documented in the tour article')],
        },
        {
          date: '2024-12-08',
          city: 'Vancouver',
          venue: 'BC Place',
          setlistChange: 'Show 149 of 149 — the finale closed the highest-grossing tour ever staged, with an extended on-stage farewell to the era of eras.',
          confidence: 'reputable_reporting',
          sources: [wiki('The_Eras_Tour', 'The Eras Tour', 'closing show documented in the tour article')],
        },
      ],
      note: 'All ten (then eleven) eras in one three-hour show, 149 times across five continents — the first tour in history to gross over one billion dollars, then the first past two.',
      sources: [
        wiki('The_Eras_Tour', 'The Eras Tour'),
        press(
          'https://apnews.com/article/118a7f5ea4609c5d3072a29152e387bb',
          "Taylor Swift's Eras Tour ends by shattering own record, grossing an estimated $2.2B, Pollstar says",
          'Associated Press',
          'supports the completed tour, 149-show count, and record gross context',
        ),
      ],
    },
  ],
};
