# T17 Breadth Audit - Wikipedia Tier 1 Coverage

Date: 2026-07-09

Scope: completeness audit only. This pass checks for corresponding items in
`supabase/seed/content/**`, `supabase/seed/theories/**`,
`supabase/seed/videos/**`, `supabase/seed/tours/**`, and
`supabase/seed/releases/**`. It does not backfill content.

Source pages pulled:

- Taylor Swift awards: https://en.wikipedia.org/wiki/List_of_awards_and_nominations_received_by_Taylor_Swift
- Taylor Swift videography: https://en.wikipedia.org/wiki/Taylor_Swift_videography
- Fearless Tour: https://en.wikipedia.org/wiki/Fearless_Tour
- Speak Now World Tour: https://en.wikipedia.org/wiki/Speak_Now_World_Tour
- The Red Tour: https://en.wikipedia.org/wiki/The_Red_Tour
- The 1989 World Tour: https://en.wikipedia.org/wiki/The_1989_World_Tour
- reputation Stadium Tour: https://en.wikipedia.org/wiki/Reputation_Stadium_Tour
- The Eras Tour: https://en.wikipedia.org/wiki/The_Eras_Tour

Method:

- Searched the scoped seed folders only; generated LongLive files were ignored.
- Counted a match only when the seed has a specific item for the award, video,
  tour leg, show, guest, or notable tour event. A generic album, song, or tour
  record is not enough to cover a specific Wikipedia row.
- For very large source tables, the gap is reported at the source-section level
  when the seed has no corresponding table shape. Example: the awards page
  lists 1,640 nominations, but the seed has scattered narrative moments rather
  than an award-entry corpus.

## Summary

- Awards: incomplete. The source page totals 690 wins and 1,640 nominations.
  Seeds include a handful of major award moments, but there is no complete
  awards/nominations data set or award-entry schema.
- Videos/singles: incomplete. `supabase/seed/videos/**` has 52 video records.
  The Wikipedia videography page lists 62 music videos, plus video albums,
  filmography, television, and commercials. At least 29 music-video rows are
  missing as video records.
- Tours: incomplete below top-level tour records. All six headline tours exist
  in `supabase/seed/tours/tours.mjs`; the first five have `legs: []` and
  `shows: []`. The Eras Tour has 5 legs and 7 notable shows, but not the full
  date/surprise-song/opening-act table.

## Award Gaps

### Confirmed Partial Matches

These award-related items exist somewhere in the scoped seed folders and should
not be counted as total gaps:

- 2007 CMA Horizon Award: `supabase/seed/content/debut.mjs`
- 2008 CMT Music Awards, "Our Song" wins Video of the Year and Female Video of
  the Year: `supabase/seed/content/debut.mjs`
- 2008 Grammy Best New Artist nomination/red-carpet moment:
  `supabase/seed/content/debut.mjs`
- 2009/2010 Fearless Grammy and country-award wins, including Album of the Year
  framing: `supabase/seed/content/fearless.mjs`,
  `supabase/seed/releases/releases.mjs`
- 2011/2012 ACM/CMA Entertainer of the Year type moments:
  `supabase/seed/content/fearless.mjs`
- 2016 Grammys, `1989` Album of the Year and related wins:
  `supabase/seed/content/1989.mjs`, `supabase/seed/releases/releases.mjs`
- 2019 AMA Artist of the Decade and all-time AMA win record:
  `supabase/seed/content/lover.mjs`
- 2019 Billboard Woman of the Decade:
  `supabase/seed/content/lover.mjs`
- 2021 BRITs Global Icon:
  `supabase/seed/content/evermore.mjs`
- 2021 Grammys, `folklore` Album of the Year:
  `supabase/seed/content/evermore.mjs`, `supabase/seed/releases/releases.mjs`
- 2022 NYU honorary doctorate:
  `supabase/seed/content/evermore.mjs`
- 2022 Nashville Songwriters Songwriter-Artist of the Decade:
  `supabase/seed/content/evermore.mjs`
- 2023 Time Person of the Year:
  `supabase/seed/content/midnights.mjs`
- 2024 Grammys, `Midnights` Album of the Year and TTPD announcement:
  `supabase/seed/content/tortured-poets.mjs`,
  `supabase/seed/releases/releases.mjs`
- 2024 MTV VMAs, seven `Fortnight` wins and all-time VMA tie:
  `supabase/seed/content/tortured-poets.mjs`
- 2025 Grammy nominations for `The Tortured Poets Department` and `Fortnight`:
  `supabase/seed/content/tortured-poets.mjs`
- 2026 Emmy nominations for `The Eras Tour: The Final Show`:
  `supabase/seed/content/the-life-of-a-showgirl.mjs`
- 2026 Showgirl Grammy eligibility miss:
  `supabase/seed/content/the-life-of-a-showgirl.mjs`

### Missing Award Coverage

- Missing complete award-entry records for the awards page's 1,640 nominations.
  Current coverage is narrative and selective, not table-complete.
- Missing all per-row fields needed to close the Wikipedia awards page:
  award body, year, recipient/work, category, result, and source URL.
- Missing complete coverage for every high-volume award body, including:
  Academy of Country Music Awards, American Music Awards, Billboard Music
  Awards, Billboard Touring Awards, BMI Country Awards, BMI London Awards, BMI
  Pop Awards, Brit Awards, Country Music Association Awards, CMT Music Awards,
  Grammy Awards, Guinness World Records, iHeartRadio Music Awards, MTV Europe
  Music Awards, MTV Video Music Awards, Nickelodeon Kids' Choice Awards,
  People's Choice Awards, Pollstar Awards, Radio Disney Music Awards, Teen
  Choice Awards, Vevo Certified Awards, and World Music Awards.
- Missing full per-entry coverage for smaller award bodies in the source
  summary table, including APRA, ARIA, A2IM Libera, BBC Music, BBC Radio 1 Teen,
  Berlin Music Video, Bravo Otto, Camerimage, Clio, GLAAD, Golden Globe,
  Gracie, Guild of Music Supervisors, IFPI, Japan Gold Disc, Juno, LOS40, MVPA,
  Myx, Nashville Songwriter, NME, NRJ, Primetime Emmy, Q, Shorty, Songwriters
  Hall of Fame, UK Music Video, Webby, YouTube Music, and the remaining
  one-off/international award bodies listed on the page.
- Missing systematic Guinness World Records coverage. Some records are covered
  as content moments, but not the full 118-record table.
- Missing systematic "Other accolades" coverage. NYU honorary doctorate is
  present; listicles and ranked honors are not represented as a complete corpus.

## Video/Single Gaps

### Music Video Rows Missing As Video Records

The following entries appear in the Wikipedia music-video table but do not have
corresponding records in `supabase/seed/videos/**`. Some songs appear in
`releases` or `content`; that does not close the video-record gap.

- [ ] "Online" - Brad Paisley video cameo
- [ ] "I'm Only Me When I'm with You"
- [ ] "Beautiful Eyes"
- [ ] "Should've Said No"
- [ ] "Change"
- [ ] "Best Days of Your Life" - Kellie Pickler featuring Swift
- [ ] "Crazier"
- [ ] "The Best Day"
- [ ] "Two Is Better Than One" - Boys Like Girls featuring Swift
- [ ] "Fearless"
- [ ] "Half of My Heart" - John Mayer featuring Swift vocals
- [ ] "Sparks Fly"
- [ ] "Ours"
- [ ] "Long Live" - Paula Fernandes version
- [ ] "Safe & Sound" - The Civil Wars collaboration
- [ ] "Both of Us" - B.o.B featuring Swift
- [ ] "Highway Don't Care" - Tim McGraw with Swift and Keith Urban
- [ ] "Red"
- [ ] "The Last Time"
- [ ] "I Don't Wanna Live Forever" - Zayn and Swift
- [ ] "Babe" - Sugarland featuring Swift
- [ ] "Christmas Tree Farm"
- [ ] "Cardigan" (Cabin in Candlelight Version)
- [ ] "The Best Day" (Taylor's Version)
- [ ] "Renegade" - Big Red Machine featuring Swift
- [ ] "The Joker and the Queen" - Ed Sheeran featuring Swift
- [ ] "Opalite"
- [ ] "Elizabeth Taylor"
- [ ] "I Knew It, I Knew You"

### Video Albums, Films, Television, And Commercial Rows

- [ ] `Taylor Swift and Def Leppard` is missing as a video/live release.
- [ ] `Taylor Swift: The Eras Tour: The Final Show` exists as content but not
  as a `videos` seed record.
- [ ] Fiction-film and acting appearances are not complete as structured video
  items: `Jonas Brothers: The 3D Concert Experience`, `Hannah Montana: The
  Movie`, `Valentine's Day`, `The Lorax`, `The Giver`, `Bluebird`, `Cats`, and
  `Amsterdam`.
- [ ] Television rows are not complete as structured video items. Known partial
  content exists for items such as `CSI`, `SNL`, `Ellen`, `Graham Norton`, and
  some late-night appearances, but the videography page's full television table
  is not represented.
- [ ] Commercial rows are not complete as structured video items. The page's
  ad/commercial entries for Activision, Nashville Predators, Sony, Target,
  CoverGirl, Elizabeth Arden, Vogue, Macy's, Keds, Coca-Cola, Toyota, EOS, Apple
  Music, DirecTV, UPS, ESPN, Capital One, NBC/Olympics, and later Olympic uses
  are not represented as a complete corpus.

## Tour Leg / Notable Show Gaps

### Top-Level Tour Records Present

`supabase/seed/tours/tours.mjs` has top-level records for:

- Fearless Tour
- Speak Now World Tour
- The Red Tour
- The 1989 World Tour
- reputation Stadium Tour
- The Eras Tour

This closes only the top-level tour existence check.

### Fearless Tour

Missing:

- [ ] Tour legs/date-table structure. The source lists 118 shows; seed has no
  `legs` and no `shows` for this tour.
- [ ] Full 2009 and 2010 date rows with city, country, venue, opening acts,
  attendance, and revenue.
- [ ] Set-list note: "Change" removed from the set after October 1, 2009.
- [ ] Set-list note: "Today Was a Fairytale" replacing "I'm Only Me When I'm
  with You" for 2010 shows.
- [ ] Notable performance: "The Best Day" in Evansville on April 23, 2009.
- [ ] Notable performance: "The Best Day" in Moline on May 8, 2010.
- [ ] Notable performance: "Jump Then Fall" in Foxborough on June 5, 2010.
- [ ] Special guest: John Mayer in Los Angeles on May 22, 2009.
- [ ] Special guest: Faith Hill in Nashville on September 12, 2009.
- [ ] Special guest: Katy Perry in Los Angeles on April 15, 2010.

Partial local matches outside `tours.mjs`: opening night, tour staging, the
Australian run, Gillette Stadium, Madison Square Garden, and Justin Bieber's
Wembley injury have content items.

### Speak Now World Tour

Missing:

- [ ] Tour legs/date-table structure. The source lists 110 shows; seed has no
  `legs` and no `shows` for this tour.
- [ ] Full 2011 and 2012 date rows with city, country, venue, opening acts,
  attendance, and revenue.
- [ ] Complete surprise-covers table. The seed has only a generic
  `surpriseSongsNote` and scattered content, not per-city cover records.
- [ ] Complete special-guest table. The Los Angeles guest run has an aggregate
  content item, but the page's full guest list is not represented.
- [ ] Explicit missing guest rows include Tal Bachman, Ronnie Dunn, Hayley
  Williams, Andy Grammer, Kenny Chesney, Tim McGraw, Usher, T.I., B.o.B, Jon
  Foreman, Jim Adkins, Shawn Colvin, Nelly, Flo Rida, Darius Rucker, John
  Rzeznik, Selena Gomez, and James Taylor.

Partial local matches outside `tours.mjs`: opening in Singapore, North American
leg opening in Omaha, live album/film, and the four-night Los Angeles cameo run.

### The Red Tour

Missing:

- [ ] Tour legs/date-table structure. The source lists 86 shows; seed has no
  `legs` and no `shows` for this tour.
- [ ] Full North America, Oceania/Australia, Europe, and Asia date rows with
  city, country, venue, opening acts, attendance, and revenue.
- [ ] Cancelled Bangkok show entry.
- [ ] Complete surprise-song table, including "Never Grow Up", "Fearless",
  "Safe & Sound", "Haunted", "Long Live", "I Almost Do", "Hey Stephen", "Tell
  Me Why", "Sad Beautiful Tragic", "Last Kiss", and "Teardrops on My Guitar"
  show placements.
- [ ] Complete special-guest table: Nelly, Tyler Glenn, Pat Monahan, B.o.B,
  Patrick Stump, Carly Simon, Cher Lloyd, Sara Bareilles, Tegan and Sara, Ellie
  Goulding, Jennifer Lopez, Gary Lightbody, Luke Bryan, Rascal Flatts, Hunter
  Hayes, Ed Sheeran, Sam Smith, Danny O'Donoghue, and Emeli Sande.

Partial local matches outside `tours.mjs`: Omaha opening, rehearsal, wardrobe,
box office/highest-grossing country tour framing, and Singapore closing.

### The 1989 World Tour

Missing:

- [ ] Tour legs/date-table structure. The source lists 85 shows; seed has no
  `legs` and no `shows` for this tour.
- [ ] Full date rows with city, country, venue, opening acts, attendance, and
  revenue.
- [ ] Complete surprise-song table.
- [ ] Complete special-guest table. Seed has broad summaries plus specific
  Hyde Park and Kobe/Staples items, but not the page's full guest list.
- [ ] Explicit missing late-table guest rows include Nelly, Keith Urban,
  Charli XCX, Ellie Goulding, Miranda Lambert, Tove Lo, Dwyane Wade, Pitbull,
  Ricky Martin, Alessia Cara, and Idina Menzel. Earlier guest rows are likewise
  incomplete unless covered by a specific content item.

Partial local matches outside `tours.mjs`: Tokyo opening, tour wardrobe, Hyde
Park squad runway, Kobe Bryant banner at Staples Center, tour film, and
Melbourne closing.

### reputation Stadium Tour

Missing:

- [ ] Tour legs/date-table structure. The source lists 53 shows; seed has no
  `legs` and no `shows` for this tour.
- [ ] Full date rows with city, country, venue, opening acts, attendance, and
  revenue.
- [ ] Set-list note: "So It Goes..." replacing "Dancing with Our Hands Tied" on
  selected dates.
- [ ] Set-list note: Philadelphia basket malfunction leading to a cappella "Our
  Song" and "Wildest Dreams".
- [ ] Set-list note: East Rutherford "Clean" before the "Long Live" / "New
  Year's Day" medley.
- [ ] Special guest: Troye Sivan in Pasadena on May 19, 2018.
- [ ] Special guest: Selena Gomez in Pasadena on May 19, 2018.
- [ ] Special guest: Hayley Kiyoko in Foxborough on July 26, 2018.
- [ ] Special guest: Bryan Adams in Toronto on August 4, 2018.
- [ ] Special guest: Tim McGraw and Faith Hill in Nashville on August 25, 2018.
- [ ] Special guest: Maren Morris in Arlington on October 5, 2018.
- [ ] Special guest: Sugarland in Arlington on October 6, 2018.

Partial local matches outside `tours.mjs`: Shawn Mendes in Pasadena, Niall
Horan and Robbie Williams at Wembley, the Netflix concert film, and the
highest-grossing U.S. tour framing.

### The Eras Tour

Present in `tours.mjs`:

- North America (2023), Latin America, Asia-Pacific, Europe, and North America
  (2024) leg objects.
- Seven show highlights: Glendale opening night, Nashville Speak Now TV
  announcement, Kansas City `I Can See You` video premiere, SoFi 1989 TV
  announcement, Buenos Aires "Karma" lyric change, Wembley Travis Kelce cameo,
  and Vancouver closing night.

Missing:

- [ ] Full 149-show tour-date table with date, city, country, venue, opening
  act(s), and attendance.
- [ ] Full surprise-song table for 2023 and 2024. The seed has a format note
  and a theory item about the metagame, but not the per-show acoustic-song
  pairs/mashups.
- [ ] Full opening-act table by show.
- [ ] Most city/date rows, including Paradise/Las Vegas, Arlington, Tampa,
  Houston, Atlanta, Philadelphia, Foxborough, East Rutherford, Chicago,
  Detroit, Pittsburgh, Minneapolis, Cincinnati, Kansas City, Denver, Seattle,
  Mexico City, Rio de Janeiro, Sao Paulo, Tokyo, Melbourne, Sydney, Singapore,
  Paris, Stockholm, Lisbon, Madrid, Lyon, Edinburgh, Liverpool, Cardiff,
  London non-cameo dates, Dublin, Amsterdam, Zurich, Milan, Gelsenkirchen,
  Hamburg, Munich, Warsaw, Vienna cancelled dates, Toronto, and Vancouver
  non-closing dates.
- [ ] Per-show notable alterations beyond the seven stored highlights, including
  instrument-order reversals, piano/weather notes, Gracie Abrams insertions,
  TTPD set introduction details, and city-specific records.

Partial local matches outside `tours.mjs`: TTPD joining the set in Paris,
Wembley eight-show record, Liverpool 100th show/end-date announcement, Vienna
cancellations, Edinburgh attendance records, final Vancouver content, Eras Tour
film, final-show film, book release, friendship bracelets, and surprise-song
metagame.

## Backfill Implications

- Awards need a dedicated structured backfill, not one-off prose. Otherwise
  T17 can never be closed because the source page is a table of award entries.
- Videos need a title-level import pass for missing music videos first, then a
  policy decision on whether filmography, television, and commercials belong in
  `videos` or another seed type.
- Tours need either full date-table import or an explicit product decision that
  T17's tour gate means "legs and notable shows" rather than every date row.
  Under the current D2 wording, the first five tour articles are not complete.
