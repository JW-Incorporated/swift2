// Vault tours — all six headline tours, with legs and curated notable shows
// for every tour (T17 content-completeness pass).
//
// Eras Tour dates and show counts verified against the Wikipedia infobox on
// 2026-07-08; the other five tours' legs, dates, and notable shows verified
// against each tour's Wikipedia article on 2026-07-09. Show entries record
// only widely documented moments, each labeled with a confidence level —
// venue-level, past-tense, never real-time (the coverage gate enforces the
// location policy). A full per-city date table for the pre-Eras tours is
// deliberately out of scope for this pass (backlog: tours date-table ticket).
//
// Then run:  npm run db:seed:tours

const wiki = (article, title, notes, accessed = '2026-07-08') => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: accessed,
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
const awards = (source_url, source_title, publisher, notes) => ({
  source_url,
  source_title,
  publisher,
  source_type: 'awards_database',
  accessed_at: '2026-07-09',
  reliability_score: 5,
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
      legs: [
        { name: 'North America (2009)', from: '2009-04-23', to: '2009-10-11' },
        { name: 'United Kingdom', from: '2009-11-23', to: '2009-11-24' },
        { name: 'Australia & Japan', from: '2010-02-04', to: '2010-02-17' },
        { name: 'North America (2010)', from: '2010-03-04', to: '2010-07-10' },
      ],
      showCount: 118,
      surpriseSongsNote: null,
      shows: [
        {
          date: '2009-04-23',
          city: 'Evansville, IN',
          venue: 'Roberts Municipal Stadium',
          setlistChange:
            'Her first night ever as a headliner, at 19 — Evansville declared April 23, 2009 "Taylor Swift Day" for the occasion.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Fearless_Tour',
              'Fearless Tour',
              'opening night; the city council declared April 23, 2009 Taylor Swift Day',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2009-05-22',
          city: 'Los Angeles, CA',
          venue: 'Staples Center',
          guests: ['John Mayer'],
          setlistChange:
            "John Mayer joined her for 'Your Body Is a Wonderland' and 'White Horse' — a duet fans would replay very differently after 'Dear John'.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Fearless_Tour',
              'Fearless Tour',
              'the John Mayer guest appearance is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2009-08-27',
          city: 'New York, NY',
          venue: 'Madison Square Garden',
          setlistChange:
            'A sold-out Madison Square Garden headlining debut, 13,597 strong, in the middle of the first arena leg.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Fearless_Tour',
              'Fearless Tour',
              'the sold-out MSG show and its attendance are documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2010-04-15',
          city: 'Los Angeles, CA',
          venue: 'Staples Center',
          guests: ['Katy Perry'],
          setlistChange:
            "Katy Perry joined her for 'Hot n Cold' — a friendly duet that predates the feud-and-reconciliation arc by nearly a decade.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Fearless_Tour',
              'Fearless Tour',
              'the Katy Perry guest appearance is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2010-06-05',
          city: 'Foxborough, MA',
          venue: 'Gillette Stadium',
          setlistChange:
            'She became the first female musician to headline and sell out Gillette Stadium — 56,868 tickets, the highest-grossing night of the tour.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Fearless_Tour',
              'Fearless Tour',
              'the Gillette Stadium first-female-headliner sellout and tour-high gross are documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2010-07-10',
          city: 'Cavendish, Prince Edward Island',
          venue: 'Cavendish Beach Festival Grounds',
          setlistChange:
            'Show 118 of 118 — the Fearless Tour closed at the Cavendish Beach Music Festival on Prince Edward Island.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Fearless_Tour',
              'Fearless Tour',
              'closing show documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
      ],
      note: 'Her first headlining tour, launched at 19 in Evansville, Indiana — 118 shows of fairytale staging that proved the arena-filling demand was hers alone.',
      sources: [
        wiki('Fearless_Tour', 'Fearless Tour'),
        awards(
          'https://www.grammy.com/artists/taylor-swift/15450',
          'Taylor Swift | 14 Grammy Wins, 4 Album of the year',
          'Recording Academy',
          'supports the Fearless-era mainstream breakthrough and the first headlining-tour context',
        ),
      ],
    },
    {
      slug: 'speak-now-world-tour',
      eraSlug: 'speak-now',
      title: 'Speak Now World Tour',
      openedOn: '2011-02-09',
      closedOn: '2012-03-18',
      legs: [
        { name: 'Asia', from: '2011-02-09', to: '2011-02-21' },
        { name: 'Europe', from: '2011-03-06', to: '2011-03-30' },
        { name: 'North America', from: '2011-05-27', to: '2011-11-22' },
        { name: 'Australia & New Zealand', from: '2012-03-02', to: '2012-03-18' },
      ],
      showCount: 110,
      surpriseSongsNote:
        'The surprise-slot prototype: in city after city she covered a song by a hometown artist mid-set — a tradition fans now read as the ancestor of the Eras Tour acoustic set.',
      shows: [
        {
          date: '2011-02-09',
          city: 'Singapore',
          venue: 'Singapore Indoor Stadium',
          setlistChange:
            'Opening night: the Speak Now theatrical production — a full narrative staging built around the album she wrote alone — debuted in Singapore before touring Asia and Europe.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Speak_Now_World_Tour',
              'Speak Now World Tour',
              'opening night documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2011-08-28',
          city: 'Los Angeles, CA',
          venue: 'Staples Center',
          guests: ['Nicki Minaj'],
          setlistChange:
            "Nicki Minaj joined her for 'Super Bass' — the most replayed of the tour's parade of hometown-guest cameos.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Speak_Now_World_Tour',
              'Speak Now World Tour',
              'the Nicki Minaj Super Bass guest spot is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2011-11-22',
          city: 'New York, NY',
          venue: 'Madison Square Garden',
          guests: ['James Taylor', 'Selena Gomez'],
          setlistChange:
            "At the final North American show, James Taylor — the artist she was named after — duetted 'Fire and Rain' with her, and Selena Gomez sang 'Who Says'.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Speak_Now_World_Tour',
              'Speak Now World Tour',
              'the James Taylor and Selena Gomez MSG guest spots are documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2012-03-18',
          city: 'Auckland',
          venue: 'Vector Arena',
          setlistChange:
            'Show 110 of 110 — the Speak Now World Tour closed in Auckland after thirteen months and nineteen territories.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Speak_Now_World_Tour',
              'Speak Now World Tour',
              'closing show documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
      ],
      note: 'Opened in Singapore, closed in Auckland — 110 theatrical shows (aerial ballet, a levitating balcony) for the album she wrote entirely alone.',
      sources: [
        wiki('Speak_Now_World_Tour', 'Speak Now World Tour'),
        press(
          'https://www.hollywoodreporter.com/news/general-news/taylor-swift-speak-now-tour-live-cd-dvd-263669/',
          'Taylor Swift Announces Speak Now World Tour Live CD/DVD',
          'The Hollywood Reporter',
          'supports the theatrical Speak Now tour production and live-release context',
        ),
      ],
    },
    {
      slug: 'the-red-tour',
      eraSlug: 'red',
      title: 'The Red Tour',
      openedOn: '2013-03-13',
      closedOn: '2014-06-12',
      legs: [
        { name: 'North America', from: '2013-03-13', to: '2013-09-21' },
        { name: 'Oceania', from: '2013-11-29', to: '2013-12-14' },
        { name: 'Europe', from: '2014-02-01', to: '2014-02-11' },
        { name: 'Asia', from: '2014-05-30', to: '2014-06-12' },
      ],
      showCount: 86,
      surpriseSongsNote: null,
      shows: [
        {
          date: '2013-03-13',
          city: 'Omaha, NE',
          venue: 'CenturyLink Center',
          setlistChange:
            'Opening night sold out all 27,877 seats — the Red-era production debuted with its dial-turned-up staging.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Red_Tour',
              'The Red Tour',
              'opening night and its sellout attendance are documented in the tour article',
              '2026-07-09',
            ),
            press(
              'https://www.rollingstone.com/music/music-news/taylor-swifts-red-tour-her-amps-go-up-to-22-187990/',
              "Taylor Swift's Red Tour: Her Amps Go Up to 22",
              'Rolling Stone',
              "contemporary Rolling Stone coverage of the Red Tour's live staging",
            ),
          ],
        },
        {
          date: '2013-07-27',
          city: 'Foxborough, MA',
          venue: 'Gillette Stadium',
          guests: ['Carly Simon'],
          setlistChange:
            "Carly Simon emerged to duet 'You're So Vain' — one pop generation's great blind item handed to the next.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Red_Tour',
              'The Red Tour',
              'the Carly Simon guest duet is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2013-08-24',
          city: 'Los Angeles, CA',
          venue: 'Staples Center',
          guests: ['Jennifer Lopez'],
          setlistChange:
            "Jennifer Lopez joined her for 'Jenny from the Block' on the tour's Los Angeles stand.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Red_Tour',
              'The Red Tour',
              'the Jennifer Lopez guest spot is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2014-02-01',
          city: 'London',
          venue: 'The O2 Arena',
          guests: ['Ed Sheeran'],
          setlistChange:
            "Ed Sheeran — the North American leg's opening act — returned as a guest for 'Lego House' on the European leg's opening night.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Red_Tour',
              'The Red Tour',
              'the Ed Sheeran O2 guest spot is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2014-05-30',
          city: 'Shanghai',
          venue: 'Mercedes-Benz Arena',
          setlistChange:
            'All 18,000 tickets sold out in about a minute — reported at the time as the fastest-selling concert in Chinese history.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Red_Tour',
              'The Red Tour',
              'the Shanghai fastest-sellout claim is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2014-06-12',
          city: 'Singapore',
          venue: 'Singapore Indoor Stadium',
          setlistChange:
            'Show 86 of 86 — the Red Tour closed in Singapore as the highest-grossing tour ever headlined by a country artist.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Red_Tour',
              'The Red Tour',
              'closing show and country-tour gross record documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
      ],
      note: 'Eighty-six shows from Omaha to Singapore — by its close, the highest-grossing tour ever by a country artist.',
      sources: [
        wiki('The_Red_Tour', 'The Red Tour'),
        press(
          'https://www.rollingstone.com/music/music-news/taylor-swifts-red-tour-her-amps-go-up-to-22-187990/',
          "Taylor Swift's Red Tour: Her Amps Go Up to 22",
          'Rolling Stone',
          'supports the Red Tour staging and live-performance context',
        ),
      ],
    },
    {
      slug: 'the-1989-world-tour',
      eraSlug: '1989',
      title: 'The 1989 World Tour',
      openedOn: '2015-05-05',
      closedOn: '2015-12-12',
      legs: [
        { name: 'Japan', from: '2015-05-05', to: '2015-05-06' },
        { name: 'North America (spring)', from: '2015-05-15', to: '2015-06-13' },
        { name: 'Europe', from: '2015-06-19', to: '2015-06-30' },
        { name: 'North America (summer–fall)', from: '2015-07-10', to: '2015-10-31' },
        { name: 'Asia', from: '2015-11-07', to: '2015-11-11' },
        { name: 'Oceania', from: '2015-11-28', to: '2015-12-12' },
      ],
      showCount: 85,
      surpriseSongsNote:
        'Less surprise songs, more surprise people: the tour became famous for its near-nightly parade of guest stars and squad-era catwalk cameos.',
      shows: [
        {
          date: '2015-05-05',
          city: 'Tokyo',
          venue: 'Tokyo Dome',
          setlistChange:
            'Opening night: the 1989 pop-era show — light-up wristbands, runway stage — debuted at the Tokyo Dome.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_1989_World_Tour',
              'The 1989 World Tour',
              'opening night documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2015-06-27',
          city: 'London',
          venue: 'Hyde Park',
          guests: [
            'Kendall Jenner',
            'Karlie Kloss',
            'Gigi Hadid',
            'Cara Delevingne',
            'Martha Hunt',
            'Serena Williams',
          ],
          setlistChange:
            'Headlining British Summer Time in Hyde Park, she brought a squad of supermodels — plus Serena Williams — out for the mid-show runway walk, the peak squad-era image.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_1989_World_Tour',
              'The 1989 World Tour',
              'the Hyde Park model-walk guest list is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2015-08-26',
          city: 'Los Angeles, CA',
          venue: 'Staples Center',
          guests: ['Lisa Kudrow', 'Justin Timberlake', 'Selena Gomez'],
          setlistChange:
            "Lisa Kudrow revived 'Smelly Cat' two decades after Friends, Justin Timberlake sang 'Mirrors', and Selena Gomez joined for 'Good for You' — one night's guest list.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_1989_World_Tour',
              'The 1989 World Tour',
              'the August 26 Los Angeles guest lineup is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2015-09-26',
          city: 'Nashville, TN',
          venue: 'Bridgestone Arena',
          guests: ['Mick Jagger'],
          setlistChange:
            "Mick Jagger joined her for '(I Can't Get No) Satisfaction' in Nashville — arguably the tour's single biggest guest get.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_1989_World_Tour',
              'The 1989 World Tour',
              'the Mick Jagger Nashville duet is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2015-11-28',
          city: 'Sydney',
          venue: 'ANZ Stadium',
          setlistChange:
            'This show was filmed for The 1989 World Tour Live, released on Apple Music that December.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_1989_World_Tour',
              'The 1989 World Tour',
              'the Sydney filming for The 1989 World Tour Live is documented in the tour article',
              '2026-07-09',
            ),
            press(
              'https://www.billboard.com/music/pop/taylor-swift-1989-world-tour-live-concert-film-apple-music-6805694/',
              "Taylor Swift '1989 World Tour Live' Concert Film Coming to Apple Music: Watch Trailer",
              'Billboard',
              'supports the concert-film capture and Apple Music release',
            ),
          ],
        },
        {
          date: '2015-12-12',
          city: 'Melbourne',
          venue: 'AAMI Park',
          setlistChange:
            'Show 85 of 85 — the finale closed what ended the year as the highest-grossing tour of 2015.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_1989_World_Tour',
              'The 1989 World Tour',
              'closing show and 2015 gross record documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
      ],
      note: 'Tokyo to Melbourne in one calendar year — 85 shows, the highest-grossing tour of 2015, documented in The 1989 World Tour Live film.',
      sources: [
        wiki('The_1989_World_Tour', 'The 1989 World Tour'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-1989-world-tour-live-concert-film-apple-music-6805694/',
          "Taylor Swift '1989 World Tour Live' Concert Film Coming to Apple Music: Watch Trailer",
          'Billboard',
          'supports the 1989 World Tour live-film capture and Apple Music release context',
        ),
      ],
    },
    {
      slug: 'reputation-stadium-tour',
      eraSlug: 'reputation',
      title: 'reputation Stadium Tour',
      openedOn: '2018-05-08',
      closedOn: '2018-11-21',
      legs: [
        { name: 'North America', from: '2018-05-08', to: '2018-10-06' },
        { name: 'Oceania', from: '2018-10-19', to: '2018-11-09' },
        { name: 'Asia', from: '2018-11-20', to: '2018-11-21' },
      ],
      showCount: 53,
      surpriseSongsNote:
        'Every night carried an acoustic B-stage slot that rotated deep cuts — the direct precursor to the Eras Tour surprise-song format.',
      shows: [
        {
          date: '2018-05-08',
          city: 'Glendale, AZ',
          venue: 'University of Phoenix Stadium',
          setlistChange:
            'Opening night of her first all-stadium tour drew 59,157 — in the same Glendale stadium (later renamed State Farm Stadium) where the Eras Tour would open five years on.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Reputation_Stadium_Tour',
              'reputation Stadium Tour',
              'opening night and its attendance are documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2018-05-19',
          city: 'Pasadena, CA',
          venue: 'Rose Bowl',
          guests: ['Selena Gomez', 'Troye Sivan'],
          setlistChange:
            'Selena Gomez and Troye Sivan guested on night two of a Rose Bowl stand that drew more than 118,000 fans across two nights — a new single-headliner gross record for the venue.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Reputation_Stadium_Tour',
              'reputation Stadium Tour',
              'the May 19 Rose Bowl guests and two-night record are documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2018-07-22',
          city: 'East Rutherford, NJ',
          venue: 'MetLife Stadium',
          setlistChange:
            'The third of three straight MetLife nights (July 20–22) — she became the first woman to headline three consecutive nights at MetLife Stadium.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Reputation_Stadium_Tour',
              'reputation Stadium Tour',
              'the three-night MetLife sellout record is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2018-08-25',
          city: 'Nashville, TN',
          venue: 'Nissan Stadium',
          guests: ['Tim McGraw', 'Faith Hill'],
          setlistChange:
            'Tim McGraw and Faith Hill joined her in Nashville — the debut single made flesh, twelve years on.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Reputation_Stadium_Tour',
              'reputation Stadium Tour',
              'the Nashville Tim McGraw and Faith Hill guest appearance is documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
        {
          date: '2018-10-06',
          city: 'Arlington, TX',
          venue: 'AT&T Stadium',
          setlistChange:
            'The final North American show was recorded for the Netflix concert film Taylor Swift: Reputation Stadium Tour, released that New Year’s Eve.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Reputation_Stadium_Tour',
              'reputation Stadium Tour',
              'the October 6 Arlington Netflix filming is documented in the tour article',
              '2026-07-09',
            ),
            press(
              'https://www.rollingstone.com/music/music-live-reviews/taylor-swift-reputation-stadium-tour-netflix-movie-review-773808/',
              "Taylor Swift's Reputation Film Shows Why She's One of the All-Time Greats",
              'Rolling Stone',
              'supports the AT&T Stadium filming and Netflix release',
            ),
          ],
        },
        {
          date: '2018-11-21',
          city: 'Tokyo',
          venue: 'Tokyo Dome',
          setlistChange:
            'Show 53 of 53 — the tour closed at the Tokyo Dome having broken the record for the highest-grossing US tour in history.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Reputation_Stadium_Tour',
              'reputation Stadium Tour',
              'closing show and US-tour gross record documented in the tour article',
              '2026-07-09',
            ),
          ],
        },
      ],
      note: 'Her first all-stadiums tour: 53 shows with a giant snake named Karyn presiding — it broke the record for the highest-grossing US tour in history.',
      sources: [
        wiki('Reputation_Stadium_Tour', 'reputation Stadium Tour'),
        press(
          'https://www.rollingstone.com/music/music-live-reviews/taylor-swift-reputation-stadium-tour-netflix-movie-review-773808/',
          "Taylor Swift's Reputation Film Shows Why She's One of the All-Time Greats",
          'Rolling Stone',
          'supports the stadium-tour production, Dallas filming context, and end-of-era live record',
        ),
      ],
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
          outfitNote:
            'The opening-night versions of the era looks — bejeweled Lover bodysuit through the folklore dress — set the costume baseline fans then tracked variant-by-variant.',
          setlistChange: 'The 44-song, three-plus-hour era-by-era setlist debuted here in full.',
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Eras_Tour',
              'The Eras Tour',
              'opening night; the city ceremonially renamed itself Swift City for the weekend',
            ),
          ],
        },
        {
          date: '2023-05-05',
          city: 'Nashville, TN',
          venue: 'Nissan Stadium',
          setlistChange:
            "Mid-show she announced Speak Now (Taylor's Version) — the stadium turned purple as the news landed.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Speak_Now_(Taylor%27s_Version)',
              "Speak Now (Taylor's Version)",
              'announcement documented to the 2023-05-05 Nashville show',
            ),
            press(
              'https://variety.com/2023/music/news/taylor-swift-announces-speak-now-taylors-version-1235604475/',
              "Taylor Swift Announces 'Speak Now (Taylor's Version)' During Nashville Concert",
              'Variety',
              "supports the onstage Nashville announcement of Speak Now (Taylor's Version)",
            ),
          ],
        },
        {
          date: '2023-07-07',
          city: 'Kansas City, MO',
          venue: 'GEHA Field at Arrowhead Stadium',
          guests: ['Taylor Lautner'],
          setlistChange:
            "The 'I Can See You' music video premiered on the stadium screens the night Speak Now (Taylor's Version) dropped — its star Taylor Lautner backflipped across the stage.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'Speak_Now_(Taylor%27s_Version)',
              "Speak Now (Taylor's Version)",
              'video premiere at the 2023-07-07 Kansas City show',
            ),
          ],
        },
        {
          date: '2023-08-09',
          city: 'Inglewood, CA',
          venue: 'SoFi Stadium',
          surpriseSongs: ['New Romantics', "New Year's Day"],
          outfitNote: 'Blue looks all night — the color-coded tell fans had bet on for weeks.',
          setlistChange:
            "1989 (Taylor's Version) announced at the final 2023 US show — on 8/9, exactly as the fan numerology predicted.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              '1989_(Taylor%27s_Version)',
              "1989 (Taylor's Version)",
              'announcement documented to the 2023-08-09 SoFi show',
            ),
            press(
              'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-eras-tour-1235693090/',
              "Taylor Swift Announces '1989 (Taylor's Version)' at Eras Tour Show",
              'Variety',
              "supports the August 9 Eras Tour announcement of 1989 (Taylor's Version)",
            ),
          ],
        },
        {
          date: '2023-11-11',
          city: 'Buenos Aires',
          venue: 'Estadio River Plate',
          setlistChange:
            "The 'Karma' lyric became 'Karma is the guy on the Chiefs, coming straight home to me' — a live lyric change that made global headlines.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Eras_Tour',
              'The Eras Tour',
              'the Buenos Aires lyric change is documented in the tour article',
            ),
            press(
              'https://www.cnn.com/2023/11/12/entertainment/taylor-swift-karma-lyric-travis-kelce/index.html',
              "Taylor Swift changes 'Karma' lyric to reference Travis Kelce at Buenos Aires concert",
              'CNN',
              "supports the Buenos Aires 'Karma' lyric change",
            ),
          ],
        },
        {
          date: '2024-06-23',
          city: 'London',
          venue: 'Wembley Stadium',
          guests: ['Travis Kelce'],
          setlistChange:
            "Travis Kelce appeared on stage in a top hat and tails during 'I Can Do It with a Broken Heart' — his only Eras Tour stage cameo.",
          confidence: 'reputable_reporting',
          sources: [
            wiki(
              'The_Eras_Tour',
              'The Eras Tour',
              'the Wembley cameo is documented in the tour article',
            ),
            press(
              'https://people.com/travis-kelce-joins-taylor-swift-on-stage-eras-tour-london-8667842',
              'Travis Kelce Joins Taylor Swift on Stage During Eras Tour in London',
              'People',
              "supports Travis Kelce's Wembley stage cameo",
            ),
          ],
        },
        {
          date: '2024-12-08',
          city: 'Vancouver',
          venue: 'BC Place',
          setlistChange:
            'Show 149 of 149 — the finale closed the highest-grossing tour ever staged, with an extended on-stage farewell to the era of eras.',
          confidence: 'reputable_reporting',
          sources: [
            wiki('The_Eras_Tour', 'The Eras Tour', 'closing show documented in the tour article'),
            press(
              'https://apnews.com/article/118a7f5ea4609c5d3072a29152e387bb',
              "Taylor Swift's Eras Tour ends by shattering own record, grossing an estimated $2.2B, Pollstar says",
              'Associated Press',
              'supports the Vancouver finale, 149-show completed tour, and record-gross context',
            ),
          ],
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
